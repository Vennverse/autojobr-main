import { db } from './db';
import { users, premiumFeatureUsage, jobApplications } from '@shared/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
}

interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

interface Milestone {
  target: number;
  current: number;
  reward: string;
}

// Constants for better maintainability
const MILESTONES = [
  { count: 10, id: 'first_10_apps', name: 'Job Hunter', icon: '🎯', tier: 'bronze' as const },
  { count: 25, id: 'first_25_apps', name: 'Career Explorer', icon: '🗺️', tier: 'bronze' as const },
  { count: 50, id: 'first_50_apps', name: 'Career Warrior', icon: '⚔️', tier: 'silver' as const },
  { count: 100, id: 'first_100_apps', name: 'Job Master', icon: '👑', tier: 'gold' as const },
  { count: 200, id: 'first_200_apps', name: 'Career Legend', icon: '🏆', tier: 'gold' as const },
  { count: 500, id: 'first_500_apps', name: 'Career Champion', icon: '🌟', tier: 'platinum' as const },
];

const WEEKLY_ACHIEVEMENT_THRESHOLD = 10;

export class GamificationService {

  /**
   * Get all unlocked achievements for a user
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // Get application count (single query)
    const [appStats] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));

    const appCount = Number(appStats?.count) || 0;

    // Add milestone achievements
    for (const milestone of MILESTONES) {
      if (appCount >= milestone.count) {
        achievements.push({
          id: milestone.id,
          name: milestone.name,
          description: `Applied to ${milestone.count} jobs`,
          icon: milestone.icon,
          tier: milestone.tier,
        });
      }
    }

    // Check weekly consistency achievement
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [weeklyApps] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        gte(jobApplications.createdAt, weekAgo)
      ));

    const weeklyCount = Number(weeklyApps?.count) || 0;
    if (weeklyCount >= WEEKLY_ACHIEVEMENT_THRESHOLD) {
      achievements.push({
        id: 'weekly_warrior',
        name: 'Weekly Warrior',
        description: `${weeklyCount} applications this week`,
        icon: '🔥',
        tier: 'gold',
      });
    }

    return achievements;
  }

  /**
   * Calculate user's activity streak based on daily applications
   */
  async getUserStreak(userId: string): Promise<UserStreak> {
    const applications = await db
      .select({ createdAt: jobApplications.createdAt })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));

    if (applications.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
      };
    }

    // Normalize dates to midnight for comparison
    const normalizeDate = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const getDaysDifference = (date1: Date, date2: Date): number => {
      return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    let isCurrentStreakActive = true;
    const today = normalizeDate(new Date());

    for (const app of applications) {
      if (!app.createdAt) continue;

      const appDate = normalizeDate(new Date(app.createdAt));

      if (!lastDate) {
        // First application
        const daysSinceApp = getDaysDifference(today, appDate);

        // Current streak is active only if last activity was today or yesterday
        if (daysSinceApp <= 1) {
          tempStreak = 1;
          currentStreak = 1;
        } else {
          tempStreak = 1;
          isCurrentStreakActive = false;
        }
      } else {
        const daysDiff = getDaysDifference(lastDate, appDate);

        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (isCurrentStreakActive) {
            currentStreak = tempStreak;
          }
        } else if (daysDiff > 1) {
          // Streak broken
          tempStreak = 1;
          isCurrentStreakActive = false;
        }
        // If daysDiff === 0, same day - don't increment streak
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = appDate;
    }

    return {
      currentStreak,
      longestStreak,
      lastActivityDate: lastDate?.toISOString().split('T')[0] || '',
    };
  }

  /**
   * Get the next milestone and progress towards it
   */
  async getNextMilestone(userId: string): Promise<Milestone> {
    const [appStats] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));

    const current = Number(appStats?.count) || 0;

    // Find next unachieved milestone
    const nextMilestone = MILESTONES.find(m => m.count > current);

    if (nextMilestone) {
      return {
        target: nextMilestone.count,
        current,
        reward: `${nextMilestone.name} Badge`,
      };
    }

    // If all milestones achieved, set next target at 1000
    return {
      target: 1000,
      current,
      reward: 'Career Titan Badge',
    };
  }

  /**
   * Get user's progress percentage towards next milestone
   */
  async getMilestoneProgress(userId: string): Promise<number> {
    const milestone = await this.getNextMilestone(userId);

    // Find previous milestone for accurate progress calculation
    const previousMilestone = MILESTONES
      .reverse()
      .find(m => m.count <= milestone.current);

    const baseCount = previousMilestone?.count || 0;
    const range = milestone.target - baseCount;
    const progress = milestone.current - baseCount;

    return range > 0 ? Math.round((progress / range) * 100) : 0;
  }
}

export const gamificationService = new GamificationService();