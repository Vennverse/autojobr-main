import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users } from "@shared/schema";

class MonthlyAllocationService {
  /**
   * Grant monthly free tests to all premium users
   * This should be called monthly via a cron job or scheduled task
   */
  async grantMonthlyFreeTests(): Promise<void> {
    console.log('🗓️ Starting monthly free test allocation for premium users...');
    
    try {
      // Update all premium users with active subscriptions
      const result = await db.update(users)
        .set({ 
          freeRankingTestsRemaining: 1
        })
        .where(
          and(
            eq(users.planType, 'premium'),
            eq(users.subscriptionStatus, 'active')
          )
        );
      
      console.log(`✅ Successfully granted monthly free tests to all premium users`);
      
      // Log the specific users who received free tests
      const premiumUsers = await db.select({
        id: users.id,
        email: users.email,
        freeRankingTestsRemaining: users.freeRankingTestsRemaining
      })
      .from(users)
      .where(
        and(
          eq(users.planType, 'premium'),
          eq(users.subscriptionStatus, 'active')
        )
      );
      
      console.log(`📊 Premium users updated: ${premiumUsers.length}`);
      premiumUsers.forEach(user => {
        console.log(`  - ${user.email}: ${user.freeRankingTestsRemaining} free tests`);
      });
      
    } catch (error) {
      console.error('❌ Error granting monthly free tests:', error);
      throw error;
    }
  }

  /**
   * Check and grant free test to individual premium user if needed
   * Called during user login/API calls
   */
  async checkAndGrantFreeTestForUser(userId: string): Promise<boolean> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return false;
      }

      // Grant free test if premium user has 0 remaining tests
      if (user.planType === 'premium' && 
          user.subscriptionStatus === 'active' && 
          (user.freeRankingTestsRemaining === null || user.freeRankingTestsRemaining === 0)) {
        
        await db.update(users)
          .set({ 
            freeRankingTestsRemaining: 1
          })
          .where(eq(users.id, userId));
        
        console.log(`🎁 Auto-granted free ranking test to premium user ${userId} (${user.email})`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking/granting free test for user:', error);
      return false;
    }
  }

  /**
   * Get allocation status for a user
   */
  async getUserAllocationStatus(userId: string): Promise<{
    isPremium: boolean;
    isActive: boolean;
    freeTestsRemaining: number;
    eligibleForAutoGrant: boolean;
  }> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return {
          isPremium: false,
          isActive: false,
          freeTestsRemaining: 0,
          eligibleForAutoGrant: false
        };
      }

      const isPremium = user.planType === 'premium';
      const isActive = user.subscriptionStatus === 'active';
      const freeTestsRemaining = user.freeRankingTestsRemaining || 0;
      const eligibleForAutoGrant = isPremium && isActive && freeTestsRemaining === 0;

      return {
        isPremium,
        isActive,
        freeTestsRemaining,
        eligibleForAutoGrant
      };
    } catch (error) {
      console.error('❌ Error getting user allocation status:', error);
      return {
        isPremium: false,
        isActive: false,
        freeTestsRemaining: 0,
        eligibleForAutoGrant: false
      };
    }
  }
}

export const monthlyAllocationService = new MonthlyAllocationService();