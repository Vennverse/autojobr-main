
import { db } from './db';
import { 
  users, 
  jobPostings, 
  jobApplications, 
  emailCampaignLog, 
  userEngagementLog,
  premiumValueMetrics,
  virtualInterviews,
  mockInterviewSessions
} from '@shared/schema';
import { eq, and, lte, gte, sql, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export class DailyEngagementService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailConfig = process.env.RESEND_API_KEY 
      ? {
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY
          }
        }
      : process.env.SENDGRID_API_KEY
      ? {
          host: 'smtp.sendgrid.net',
          port: 465,
          secure: true,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        }
      : {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER || 'noreply@autojobr.com',
            pass: process.env.EMAIL_PASSWORD || ''
          }
        };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  // Morning digest - sent at 8 AM user's timezone
  async sendMorningDigest(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    // Get today's stats instead of tasks (tasks table doesn't exist yet)
    const stats = await this.getUserDailyStats(userId);

    const newJobs = await this.getNewMatchingJobs(userId);

    await this.transporter.sendMail({
      from: '"AutoJobr Career Coach" <coach@autojobr.com>',
      to: user[0].email!,
      subject: '🌅 Your Daily Career Update - AutoJobr',
      html: this.generateMorningDigestHTML({
        userName: user[0].firstName || 'there',
        stats,
        newJobs,
        isPremium: user[0].planType === 'premium' || user[0].planType === 'enterprise'
      })
    });

    await db.insert(emailCampaignLog).values({
      userId,
      campaignType: 'morning_digest',
      emailSubject: '🌅 Your Daily Career Update - AutoJobr',
      emailTemplate: 'morning_digest_v1',
      wasDelivered: true
    });
  }

  // Evening summary - sent at 6 PM
  async sendEveningSummary(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    const todaysActivity = await this.getTodaysActivity(userId);

    await this.transporter.sendMail({
      from: '"AutoJobr Team" <team@autojobr.com>',
      to: user[0].email!,
      subject: '📊 Today\'s Progress & Tomorrow\'s Plan - AutoJobr',
      html: this.generateEveningSummaryHTML({
        userName: user[0].firstName || 'there',
        activity: todaysActivity
      })
    });

    await db.insert(emailCampaignLog).values({
      userId,
      campaignType: 'evening_summary',
      emailSubject: '📊 Today\'s Progress & Tomorrow\'s Plan - AutoJobr',
      emailTemplate: 'evening_summary_v1',
      wasDelivered: true
    });
  }

  // Weekly career insights - sent Sunday evening
  async sendWeeklyInsights(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return;

    const weekStats = await this.getWeeklyStats(userId);
    const careerTips = await this.generateAICareerTips(user[0]);

    await this.transporter.sendMail({
      from: '"AutoJobr Career Coach" <coach@autojobr.com>',
      to: user[0].email!,
      subject: '📈 Your Weekly Career Growth Report - AutoJobr',
      html: this.generateWeeklyInsightsHTML({
        userName: user[0].firstName || 'there',
        stats: weekStats,
        tips: careerTips
      })
    });

    await db.insert(emailCampaignLog).values({
      userId,
      campaignType: 'weekly_insights',
      emailSubject: '📈 Your Weekly Career Growth Report - AutoJobr',
      emailTemplate: 'weekly_insights_v1',
      wasDelivered: true
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

  private async getUserDailyStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [applicationsToday] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        gte(jobApplications.createdAt, today)
      ));

    const [interviewsCompleted] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.userId, userId),
        eq(virtualInterviews.status, 'completed')
      ));

    return {
      applicationsToday: Number(applicationsToday?.count) || 0,
      interviewsCompleted: Number(interviewsCompleted?.count) || 0
    };
  }

  private async getTodaysActivity(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applicationsToday = await db.select({ count: sql<number>`count(*)` })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        gte(jobApplications.createdAt, today)
      ));

    return {
      applicationsSubmitted: Number(applicationsToday[0]?.count) || 0
    };
  }

  private async getWeeklyStats(userId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const applications = await db.select({ count: sql<number>`count(*)` })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        gte(jobApplications.createdAt, weekAgo)
      ));

    const interviews = await db.select({ count: sql<number>`count(*)` })
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.userId, userId),
        gte(virtualInterviews.createdAt, weekAgo)
      ));

    return {
      applicationsThisWeek: Number(applications[0]?.count) || 0,
      interviewsThisWeek: Number(interviews[0]?.count) || 0
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
    const motivationalQuotes = [
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "Your dream job is waiting for you. Keep pushing forward!",
      "Every application brings you one step closer to your goal."
    ];
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .content { background: white; padding: 30px; margin-top: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .stat-box { background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
    .cta-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .quote { font-style: italic; color: #718096; border-left: 3px solid #667eea; padding-left: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌅 Good Morning, ${data.userName}!</h1>
      <p>Let's make today count</p>
    </div>
    <div class="content">
      <div class="quote">"${quote}"</div>
      
      <h2>📊 Your Progress</h2>
      <div class="stat-box">
        <strong>📝 Applications Today:</strong> ${data.stats.applicationsToday}<br>
        <strong>🎯 Interview Practice Sessions:</strong> ${data.stats.interviewsCompleted} completed<br>
        ${data.isPremium ? '<strong>⭐ Status:</strong> Premium Active' : '<strong>💡 Tip:</strong> Upgrade to Premium for unlimited AI coaching!'}
      </div>

      <h2>🎯 New Job Opportunities (${data.newJobs.length})</h2>
      <ul>${data.newJobs.slice(0, 3).map((j: any) => `<li><strong>${j.title}</strong> at ${j.companyName}</li>`).join('') || '<li>Check the dashboard for new matches!</li>'}</ul>

      <a href="${process.env.BASE_URL || 'https://autojobr.com'}/dashboard" class="cta-button">Start Applying Now →</a>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateEveningSummaryHTML(data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .stat-box { background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 Great Work Today, ${data.userName}!</h1>
    </div>
    <div style="padding: 30px;">
      <h2>Today's Achievements</h2>
      <div class="stat-box">
        <strong>✅ Applications Submitted:</strong> ${data.activity.applicationsSubmitted}
      </div>
      <p>Keep this momentum going tomorrow! Every application is a step toward success.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateWeeklyInsightsHTML(data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Weekly Progress Report</h1>
      <p>for ${data.userName}</p>
    </div>
    <div style="padding: 30px;">
      <h2>This Week's Stats</h2>
      <p><strong>Applications:</strong> ${data.stats.applicationsThisWeek}</p>
      <p><strong>Interviews:</strong> ${data.stats.interviewsThisWeek}</p>
      
      <h3>Career Growth Tips</h3>
      <ul>${data.tips.map((tip: string) => `<li>${tip}</li>`).join('')}</ul>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const dailyEngagementService = new DailyEngagementService();
