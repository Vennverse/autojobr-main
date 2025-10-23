
import { db } from "./db";
import { videoPracticeStats, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface VideoPracticeUsage {
  canStartInterview: boolean;
  requiresPayment: boolean;
  freeInterviewsRemaining: number;
  message: string;
  cost?: number;
}

export class VideoPracticePaymentService {
  private readonly FREE_INTERVIEWS_LIMIT = 2; // 2 free interviews for all users per month
  private readonly PREMIUM_FREE_LIMIT = 5; // 5 free interviews for premium users per month
  private readonly INTERVIEW_COST = 5; // $5 per interview after free limit

  async checkUsageAndPayment(userId: string): Promise<VideoPracticeUsage> {
    try {
      // Get user subscription status
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create user stats
      let userStats = await db.query.videoPracticeStats.findFirst({
        where: eq(videoPracticeStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(videoPracticeStats).values({
          userId,
          totalInterviews: 0,
          freeInterviewsUsed: 0,
          lastReset: new Date()
        }).returning();
        userStats = newStats;
      }

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      
      // Check free interviews based on user type
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      if (userStats.freeInterviewsUsed < freeLimit) {
        return {
          canStartInterview: true,
          requiresPayment: false,
          freeInterviewsRemaining: freeLimit - userStats.freeInterviewsUsed,
          message: `You have ${freeLimit - userStats.freeInterviewsUsed} free video interview${freeLimit - userStats.freeInterviewsUsed === 1 ? '' : 's'} remaining.`
        };
      }

      // After free limit, all users must pay per interview
      return {
        canStartInterview: false,
        requiresPayment: true,
        freeInterviewsRemaining: 0,
        cost: this.INTERVIEW_COST,
        message: isPremium 
          ? `You've used all ${this.PREMIUM_FREE_LIMIT} free video interviews. Pay $${this.INTERVIEW_COST} via PayPal or Amazon Pay for additional interviews.`
          : `You've used your ${this.FREE_INTERVIEWS_LIMIT} free video interviews. Upgrade to premium for ${this.PREMIUM_FREE_LIMIT} free interviews or pay $${this.INTERVIEW_COST} per interview via PayPal or Amazon Pay.`
      };

    } catch (error) {
      console.error('Error checking video practice usage:', error);
      throw error;
    }
  }

  async recordInterviewStart(userId: string, isPaid: boolean = false): Promise<void> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      let userStats = await db.query.videoPracticeStats.findFirst({
        where: eq(videoPracticeStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(videoPracticeStats).values({
          userId,
          totalInterviews: 1,
          freeInterviewsUsed: isPaid ? 0 : 1,
          lastReset: new Date()
        }).returning();
        return;
      }

      const isPremium = user.subscriptionStatus === 'active' && user.planType === 'premium';
      const freeLimit = isPremium ? this.PREMIUM_FREE_LIMIT : this.FREE_INTERVIEWS_LIMIT;
      
      let updateData: any = {
        totalInterviews: userStats.totalInterviews + 1
      };

      if (!isPaid) {
        // This is a free interview - update based on user type
        if (userStats.freeInterviewsUsed < freeLimit) {
          updateData.freeInterviewsUsed = userStats.freeInterviewsUsed + 1;
        }
      }

      await db.update(videoPracticeStats)
        .set(updateData)
        .where(eq(videoPracticeStats.userId, userId));

    } catch (error) {
      console.error('Error recording video interview start:', error);
      throw error;
    }
  }

  async createPaymentIntent(userId: string): Promise<{ amount: number; currency: string }> {
    return {
      amount: this.INTERVIEW_COST * 100, // Convert to cents
      currency: 'usd'
    };
  }

  getInterviewCost(): number {
    return this.INTERVIEW_COST;
  }
}

export const videoPracticePaymentService = new VideoPracticePaymentService();
