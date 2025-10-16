
import { db } from './db';
import { users, premiumFeatureUsage, jobApplications } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

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

export class GamificationService {
  
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Application milestones
    const [appStats] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));

    const appCount = Number(appStats?.count) || 0;

    if (appCount >= 10) achievements.push({
      id: 'first_10_apps',
      name: 'Job Hunter',
      description: 'Applied to 10 jobs',
      icon: '🎯',
      tier: 'bronze'
    });

    if (appCount >= 50) achievements.push({
      id: 'first_50_apps',
      name: 'Career Warrior',
      description: 'Applied to 50 jobs',
      icon: '⚔️',
      tier: 'silver'
    });

    if (appCount >= 100) achievements.push({
      id: 'first_100_apps',
      name: 'Job Master',
      description: 'Applied to 100 jobs',
      icon: '👑',
      tier: 'gold'
    });

    // Weekly consistency
    const [weeklyApps] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        gte(jobApplications.createdAt, weekAgo)
      ));

    if (Number(weeklyApps?.count) >= 10) achievements.push({
      id: 'weekly_warrior',
      name: 'Weekly Warrior',
      description: '10+ applications this week',
      icon: '🔥',
      tier: 'gold'
    });

    return achievements;
  }

  async getUserStreak(userId: string): Promise<UserStreak> {
    // Calculate user activity streak
    const applications = await db
      .select({ createdAt: jobApplications.createdAt })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const app of applications) {
      const appDate = new Date(app.createdAt!);
      appDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          currentStreak = tempStreak;
        } else if (daysDiff > 1) {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = appDate;
    }

    return {
      currentStreak,
      longestStreak,
      lastActivityDate: lastDate?.toISOString().split('T')[0] || ''
    };
  }

  async getNextMilestone(userId: string): Promise<{ target: number; current: number; reward: string }> {
    const [appStats] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));

    const current = Number(appStats?.count) || 0;
    const milestones = [10, 25, 50, 100, 200, 500];
    const nextMilestone = milestones.find(m => m > current) || 1000;

    const rewards = {
      10: 'Job Hunter Badge',
      25: 'Career Explorer Badge',
      50: 'Career Warrior Badge',
      100: 'Job Master Badge',
      200: 'Career Legend Badge',
      500: 'Career Champion Badge',
      1000: 'Career Titan Badge'
    };

    return {
      target: nextMilestone,
      current,
      reward: rewards[nextMilestone as keyof typeof rewards] || 'Special Achievement'
    };
  }
}

export const gamificationService = new GamificationService();
