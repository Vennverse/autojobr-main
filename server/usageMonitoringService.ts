import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, subscriptions } from '../shared/schema';

interface UsageReport {
  subscription: {
    isActive: boolean;
    planType: string;
  };
  usage: Record<string, number>;
  limits: Record<string, number>;
  percentages: Record<string, number>;
  upgradeRecommended: boolean;
  isFreeTier: boolean;
}

class UsageMonitoringService {
  async generateUsageReport(userId: string): Promise<UsageReport> {
    try {
      // Get user subscription data
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new Error('User not found');
      }

      const subscription = await db.select().from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const hasActiveSubscription = subscription.length > 0 && subscription[0].status === 'active';
      const planType = hasActiveSubscription ? subscription[0].planType : 'free';

      // Mock usage data based on user type for demonstration
      const userType = user[0].userType || 'jobseeker';
      let usage: Record<string, number> = {};
      let limits: Record<string, number> = {};

      if (userType === 'recruiter') {
        usage = {
          jobPostings: 3,
          interviews: 8,
          candidates: 15,
          analytics: 12
        };
        
        if (hasActiveSubscription) {
          limits = {
            jobPostings: -1, // unlimited
            interviews: -1,
            candidates: -1,
            analytics: -1
          };
        } else {
          limits = {
            jobPostings: 5,
            interviews: 10,
            candidates: 20,
            analytics: 15
          };
        }
      } else {
        usage = {
          applications: 12,
          resumeAnalyses: 8,
          autoFills: 25,
          jobAnalyses: 5
        };
        
        if (hasActiveSubscription) {
          limits = {
            applications: -1,
            resumeAnalyses: -1,
            autoFills: -1,
            jobAnalyses: -1
          };
        } else {
          limits = {
            applications: 15,
            resumeAnalyses: 10,
            autoFills: 30,
            jobAnalyses: 8
          };
        }
      }

      // Calculate percentages
      const percentages: Record<string, number> = {};
      Object.keys(usage).forEach(key => {
        if (limits[key] > 0) {
          percentages[key] = Math.round((usage[key] / limits[key]) * 100);
        } else {
          percentages[key] = 0; // Unlimited
        }
      });

      // Determine if upgrade is recommended
      const upgradeRecommended = !hasActiveSubscription && 
        Object.values(percentages).some(p => p > 80);

      return {
        subscription: {
          isActive: hasActiveSubscription,
          planType
        },
        usage,
        limits,
        percentages,
        upgradeRecommended,
        isFreeTier: !hasActiveSubscription
      };
    } catch (error) {
      console.error('Error generating usage report:', error);
      
      // Return minimal usage report on error
      return {
        subscription: {
          isActive: false,
          planType: 'free'
        },
        usage: {},
        limits: {},
        percentages: {},
        upgradeRecommended: false,
        isFreeTier: true
      };
    }
  }

  async checkUsageLimit(userId: string, feature: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    const report = await this.generateUsageReport(userId);
    const currentUsage = report.usage[feature] || 0;
    const limit = report.limits[feature] || 0;
    
    return {
      allowed: limit === -1 || currentUsage < limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
      limit
    };
  }

  async enforceUsageLimit(userId: string, feature: string): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    const check = await this.checkUsageLimit(userId, feature);
    
    if (!check.allowed) {
      return {
        allowed: false,
        message: `You have reached your limit for ${feature}. Please upgrade to continue.`
      };
    }
    
    return { allowed: true };
  }
}

export const usageMonitoringService = new UsageMonitoringService();