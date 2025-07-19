import { db } from "./db";
import { virtualInterviewStats, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface VirtualInterviewUsage {
  canStartInterview: boolean;
  requiresPayment: boolean;
  freeInterviewsRemaining: number;
  monthlyInterviewsRemaining: number;
  message: string;
  cost?: number;
}

export class VirtualInterviewPaymentService {
  private readonly FREE_INTERVIEWS_LIMIT = 1;
  private readonly PREMIUM_MONTHLY_LIMIT = 5;
  private readonly INTERVIEW_COST = 2; // $2 per interview

  async checkUsageAndPayment(userId: string): Promise<VirtualInterviewUsage> {
    try {
      // Get user subscription status
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create user stats
      let userStats = await db.query.virtualInterviewStats.findFirst({
        where: eq(virtualInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(virtualInterviewStats).values({
          userId,
          totalInterviews: 0,
          freeInterviewsUsed: 0,
          monthlyInterviewsUsed: 0,
          lastMonthlyReset: new Date()
        }).returning();
        userStats = newStats;
      }

      // Reset monthly usage if needed
      userStats = await this.resetMonthlyUsageIfNeeded(userStats);

      const isPremium = user.planType === 'premium' || user.subscriptionStatus === 'active';
      
      // Check free interviews first (available to all users)
      if (userStats.freeInterviewsUsed < this.FREE_INTERVIEWS_LIMIT) {
        return {
          canStartInterview: true,
          requiresPayment: false,
          freeInterviewsRemaining: this.FREE_INTERVIEWS_LIMIT - userStats.freeInterviewsUsed,
          monthlyInterviewsRemaining: isPremium ? this.PREMIUM_MONTHLY_LIMIT - userStats.monthlyInterviewsUsed : 0,
          message: `You have ${this.FREE_INTERVIEWS_LIMIT - userStats.freeInterviewsUsed} free interview${this.FREE_INTERVIEWS_LIMIT - userStats.freeInterviewsUsed === 1 ? '' : 's'} remaining.`
        };
      }

      // For premium users, check monthly limit
      if (isPremium && userStats.monthlyInterviewsUsed < this.PREMIUM_MONTHLY_LIMIT) {
        return {
          canStartInterview: true,
          requiresPayment: false,
          freeInterviewsRemaining: 0,
          monthlyInterviewsRemaining: this.PREMIUM_MONTHLY_LIMIT - userStats.monthlyInterviewsUsed,
          message: `You have ${this.PREMIUM_MONTHLY_LIMIT - userStats.monthlyInterviewsUsed} premium interview${this.PREMIUM_MONTHLY_LIMIT - userStats.monthlyInterviewsUsed === 1 ? '' : 's'} remaining this month.`
        };
      }

      // User needs to pay
      return {
        canStartInterview: false,
        requiresPayment: true,
        freeInterviewsRemaining: 0,
        monthlyInterviewsRemaining: 0,
        cost: this.INTERVIEW_COST,
        message: isPremium 
          ? `You've used all your monthly premium interviews. Pay $${this.INTERVIEW_COST} to continue.`
          : `You've used your free interview. Upgrade to premium for 5 monthly interviews or pay $${this.INTERVIEW_COST} per interview.`
      };

    } catch (error) {
      console.error('Error checking virtual interview usage:', error);
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

      let userStats = await db.query.virtualInterviewStats.findFirst({
        where: eq(virtualInterviewStats.userId, userId)
      });

      if (!userStats) {
        // Create initial stats record
        const [newStats] = await db.insert(virtualInterviewStats).values({
          userId,
          totalInterviews: 1,
          freeInterviewsUsed: isPaid ? 0 : 1,
          monthlyInterviewsUsed: user.planType === 'premium' && !isPaid ? 1 : 0,
          lastMonthlyReset: new Date()
        }).returning();
        return;
      }

      // Reset monthly usage if needed
      userStats = await this.resetMonthlyUsageIfNeeded(userStats);

      const isPremium = user.planType === 'premium' || user.subscriptionStatus === 'active';
      
      let updateData: any = {
        totalInterviews: userStats.totalInterviews + 1
      };

      if (!isPaid) {
        // This is a free interview
        if (userStats.freeInterviewsUsed < this.FREE_INTERVIEWS_LIMIT) {
          updateData.freeInterviewsUsed = userStats.freeInterviewsUsed + 1;
        } else if (isPremium && userStats.monthlyInterviewsUsed < this.PREMIUM_MONTHLY_LIMIT) {
          updateData.monthlyInterviewsUsed = userStats.monthlyInterviewsUsed + 1;
        }
      }

      await db.update(virtualInterviewStats)
        .set(updateData)
        .where(eq(virtualInterviewStats.userId, userId));

    } catch (error) {
      console.error('Error recording interview start:', error);
      throw error;
    }
  }

  private async resetMonthlyUsageIfNeeded(userStats: any): Promise<any> {
    const now = new Date();
    const lastReset = new Date(userStats.lastMonthlyReset);
    
    // Check if a month has passed
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      const [updatedStats] = await db.update(virtualInterviewStats)
        .set({
          monthlyInterviewsUsed: 0,
          lastMonthlyReset: now
        })
        .where(eq(virtualInterviewStats.userId, userStats.userId))
        .returning();
      
      return updatedStats;
    }
    
    return userStats;
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

export const virtualInterviewPaymentService = new VirtualInterviewPaymentService();