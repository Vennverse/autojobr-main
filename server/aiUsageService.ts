import { db } from "@db";
import { aiUsageTracking, users } from "@db/schema";
import { eq, and } from "drizzle-orm";

// AI Feature Types with quota limits
export const AI_FEATURE_TYPES = {
  CONNECTION_NOTE: 'connection_note',
  RESUME_OPTIMIZATION: 'resume_optimization',
  COVER_LETTER: 'cover_letter',
  INTERVIEW_PRACTICE: 'interview_practice',
} as const;

export type AIFeatureType = typeof AI_FEATURE_TYPES[keyof typeof AI_FEATURE_TYPES];

// Quota limits by feature and plan type
const QUOTA_LIMITS: Record<AIFeatureType, { free: number; premium: number }> = {
  [AI_FEATURE_TYPES.CONNECTION_NOTE]: { free: 5, premium: Infinity },
  [AI_FEATURE_TYPES.RESUME_OPTIMIZATION]: { free: 3, premium: Infinity },
  [AI_FEATURE_TYPES.COVER_LETTER]: { free: 3, premium: Infinity },
  [AI_FEATURE_TYPES.INTERVIEW_PRACTICE]: { free: 2, premium: Infinity },
};

/**
 * Get current month in YYYY-MM format (matches existing schema)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if user has available quota for a feature
 */
export async function checkQuota(
  userId: string,
  featureType: AIFeatureType
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  // Get user plan type
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { planType: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
  const monthKey = getCurrentMonthKey();

  // Get quota limits
  const limits = QUOTA_LIMITS[featureType];
  const userLimit = isPremium ? limits.premium : limits.free;

  // Premium users have unlimited quota
  if (isPremium) {
    return {
      allowed: true,
      used: 0,
      limit: userLimit,
      remaining: userLimit,
    };
  }

  // Check current usage for free users
  const usage = await db.query.aiUsageTracking.findFirst({
    where: and(
      eq(aiUsageTracking.userId, userId),
      eq(aiUsageTracking.featureType, featureType),
      eq(aiUsageTracking.monthYear, monthKey)
    ),
  });

  const used = usage?.usageCount || 0;
  const remaining = Math.max(0, userLimit - used);

  return {
    allowed: remaining > 0,
    used,
    limit: userLimit,
    remaining,
  };
}

/**
 * Increment usage counter for a feature
 */
export async function incrementUsage(
  userId: string,
  featureType: AIFeatureType
): Promise<void> {
  const monthKey = getCurrentMonthKey();
  const limits = QUOTA_LIMITS[featureType];

  // Check if record exists
  const existing = await db.query.aiUsageTracking.findFirst({
    where: and(
      eq(aiUsageTracking.userId, userId),
      eq(aiUsageTracking.featureType, featureType),
      eq(aiUsageTracking.monthYear, monthKey)
    ),
  });

  if (existing) {
    // Increment existing record
    await db
      .update(aiUsageTracking)
      .set({
        usageCount: existing.usageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(aiUsageTracking.id, existing.id));
  } else {
    // Create new record for this month
    await db.insert(aiUsageTracking).values({
      userId,
      featureType,
      monthYear: monthKey,
      usageCount: 1,
      limit: limits.free, // Store the free tier limit
    });
  }
}

/**
 * Get usage statistics for all features for a user
 */
export async function getUserUsageStats(userId: string): Promise<{
  [key in AIFeatureType]?: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
  };
}> {
  const monthKey = getCurrentMonthKey();
  
  // Get user plan
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { planType: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isPremium = user.planType === 'premium' || user.planType === 'enterprise';

  // Get all usage records for current month
  const usageRecords = await db.query.aiUsageTracking.findMany({
    where: and(
      eq(aiUsageTracking.userId, userId),
      eq(aiUsageTracking.monthYear, monthKey)
    ),
  });

  // Calculate next reset date (first day of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetDate = nextMonth.toISOString().split('T')[0];

  // Build stats object
  const stats: any = {};

  for (const featureType of Object.values(AI_FEATURE_TYPES)) {
    const usage = usageRecords.find(r => r.featureType === featureType);
    const limits = QUOTA_LIMITS[featureType as AIFeatureType];
    const userLimit = isPremium ? limits.premium : limits.free;
    const used = usage?.usageCount || 0;

    stats[featureType] = {
      used: isPremium ? 0 : used,
      limit: userLimit,
      remaining: isPremium ? userLimit : Math.max(0, userLimit - used),
      resetDate,
    };
  }

  return stats;
}

/**
 * Middleware to check and enforce quota before AI feature use
 */
export async function enforceQuota(
  userId: string,
  featureType: AIFeatureType
): Promise<void> {
  const quota = await checkQuota(userId, featureType);

  if (!quota.allowed) {
    throw new Error(
      `Monthly quota exceeded for ${featureType}. You've used ${quota.used}/${quota.limit} this month. Upgrade to premium for unlimited access.`
    );
  }
}
