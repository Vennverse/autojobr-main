
import { db } from './db';
import { users, jobPostings, applications, tasks, crmContacts } from '@shared/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { sendEmail } from './emailService';

export class DailyEngagementService {
  // Morning digest - sent at 8 AM user's timezone
  async sendMorningDigest(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    const todaysTasks = await db.select().from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, 'pending'),
        lte(tasks.dueDate, new Date())
      ));

    const newJobs = await this.getNewMatchingJobs(userId);
    const pendingApplications = await this.getPendingApplications(userId);

    await sendEmail({
      to: user[0].email!,
      subject: '🌅 Your Daily Career Update - AutoJobr',
      html: this.generateMorningDigestHTML({
        userName: user[0].firstName || 'there',
        tasks: todaysTasks,
        newJobs,
        pendingApplications
      })
    });
  }

  // Evening summary - sent at 6 PM
  async sendEveningSummary(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    const todaysActivity = await this.getTodaysActivity(userId);
    const tomorrowsTasks = await this.getTomorrowsTasks(userId);

    await sendEmail({
      to: user[0].email!,
      subject: '📊 Today\'s Progress & Tomorrow\'s Plan - AutoJobr',
      html: this.generateEveningSummaryHTML({
        userName: user[0].firstName || 'there',
        activity: todaysActivity,
        tomorrowsTasks
      })
    });
  }

  // Weekly career insights - sent Sunday evening
  async sendWeeklyInsights(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    const weekStats = await this.getWeeklyStats(userId);
    const careerTips = await this.generateAICareerTips(user[0]);

    await sendEmail({
      to: user[0].email!,
      subject: '📈 Your Weekly Career Growth Report - AutoJobr',
      html: this.generateWeeklyInsightsHTML({
        userName: user[0].firstName || 'there',
        stats: weekStats,
        tips: careerTips
      })
    });
  }

  private async getNewMatchingJobs(userId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return await db.select().from(jobPostings)
      .where(and(
        eq(jobPostings.isActive, true),
        gte(jobPostings.createdAt, yesterday)
      ))
      .limit(5);
  }

  private async getPendingApplications(userId: string) {
    return await db.select().from(applications)
      .where(and(
        eq(applications.userId, userId),
        eq(applications.status, 'pending')
      ));
  }

  private async getTodaysActivity(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applicationsToday = await db.select({ count: sql`count(*)` })
      .from(applications)
      .where(and(
        eq(applications.userId, userId),
        gte(applications.createdAt, today)
      ));

    return {
      applicationsSubmitted: applicationsToday[0]?.count || 0,
      // Add more metrics
    };
  }

  private async getTomorrowsTasks(userId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return await db.select().from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, 'pending'),
        gte(tasks.dueDate, tomorrow)
      ))
      .limit(5);
  }

  private async getWeeklyStats(userId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const applications = await db.select({ count: sql`count(*)` })
      .from(applications)
      .where(and(
        eq(applications.userId, userId),
        gte(applications.createdAt, weekAgo)
      ));

    return {
      applicationsThisWeek: applications[0]?.count || 0,
      // Add more stats
    };
  }

  private async generateAICareerTips(user: any) {
    return [
      'Update your resume with recent accomplishments',
      'Connect with 3 new professionals in your field',
      'Practice answering behavioral interview questions'
    ];
  }

  private generateMorningDigestHTML(data: any) {
    return `
      <h2>Good morning, ${data.userName}! ☕</h2>
      <h3>Your Day at a Glance</h3>
      <div>
        <h4>📋 Today's Tasks (${data.tasks.length})</h4>
        <ul>${data.tasks.map((t: any) => `<li>${t.title}</li>`).join('')}</ul>
      </div>
      <div>
        <h4>🎯 New Matching Jobs (${data.newJobs.length})</h4>
        <ul>${data.newJobs.map((j: any) => `<li>${j.title} at ${j.companyName}</li>`).join('')}</ul>
      </div>
      <a href="https://autojobr.com/dashboard" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">
        Start Your Day →
      </a>
    `;
  }

  private generateEveningSummaryHTML(data: any) {
    return `
      <h2>Great work today, ${data.userName}! 🌟</h2>
      <h3>Today's Achievements</h3>
      <p>Applications submitted: ${data.activity.applicationsSubmitted}</p>
      <h3>Tomorrow's Focus</h3>
      <ul>${data.tomorrowsTasks.map((t: any) => `<li>${t.title}</li>`).join('')}</ul>
    `;
  }

  private generateWeeklyInsightsHTML(data: any) {
    return `
      <h2>Weekly Progress Report for ${data.userName}</h2>
      <p>Applications this week: ${data.stats.applicationsThisWeek}</p>
      <h3>Career Growth Tips</h3>
      <ul>${data.tips.map((tip: string) => `<li>${tip}</li>`).join('')}</ul>
    `;
  }
}

export const dailyEngagementService = new DailyEngagementService();
