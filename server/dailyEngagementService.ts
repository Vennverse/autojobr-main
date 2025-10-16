
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
    
    // Import gamification service dynamically
    const { gamificationService } = await import('./gamificationService');
    const achievements = await gamificationService.getUserAchievements(userId);
    const streak = await gamificationService.getUserStreak(userId);
    const nextMilestone = await gamificationService.getNextMilestone(userId);

    // Calculate premium value if user is premium
    let premiumValue = null;
    if (user[0].planType === 'premium' || user[0].planType === 'ultra_premium') {
      const { premiumFeaturesService } = await import('./premiumFeaturesService');
      premiumValue = await premiumFeaturesService.calculatePremiumValue(userId);
      
      // Convert monthly to weekly approximation
      premiumValue.weeklySavings = Math.round(premiumValue.monthlySavings / 4);
      premiumValue.aiUses = Math.round(premiumValue.aiInteractions / 4);
      premiumValue.interviews = Math.round(premiumValue.interviewPractices / 4);
      premiumValue.applications = Math.round(premiumValue.totalApplications / 4);
      premiumValue.resumeChecks = Math.round(premiumValue.resumeAnalyses / 4);
    }

    await this.transporter.sendMail({
      from: '"AutoJobr Career Coach" <coach@autojobr.com>',
      to: user[0].email!,
      subject: '📈 Your Weekly Career Growth Report - AutoJobr',
      html: this.generateWeeklyInsightsHTML({
        userName: user[0].firstName || 'there',
        stats: weekStats,
        tips: careerTips,
        isPremium: user[0].planType === 'premium' || user[0].planType === 'ultra_premium',
        achievements: achievements.map(a => `${a.icon} ${a.name}`),
        streak: streak.currentStreak,
        nextMilestone,
        premiumValue
      })
    });

    await db.insert(emailCampaignLog).values({
      userId,
      campaignType: 'weekly_insights',
      emailSubject: '📈 Your Weekly Career Growth Report - AutoJobr',
      emailTemplate: 'weekly_insights_v2',
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
    const isPremium = data.isPremium || false;
    const premiumBadge = isPremium ? '<span style="background: gold; color: #000; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">⭐ PREMIUM</span>' : '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f7fa; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #667eea; }
    .stat-value { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .stat-label { color: #6c757d; font-size: 14px; }
    .premium-value { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; }
    .tip-box { background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0; border-radius: 5px; }
    .achievement-badge { display: inline-block; background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; margin: 5px; font-size: 13px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Your Weekly Success Report</h1>
      <p style="margin: 10px 0; opacity: 0.9;">${data.userName} ${premiumBadge}</p>
      <p style="font-size: 14px; opacity: 0.8;">Keep crushing your career goals! 🚀</p>
    </div>
    
    <div class="content">
      ${isPremium ? `
      <div class="premium-value">
        <h3 style="margin: 0 0 15px 0; color: #000;">💰 Premium Value This Week</h3>
        <div style="font-size: 36px; font-weight: bold; color: #000; margin: 10px 0;">
          $${data.premiumValue?.weeklySavings || 0} Saved
        </div>
        <p style="margin: 5px 0; color: #333;">vs. paying per feature</p>
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left;">
          <div>✨ ${data.premiumValue?.aiUses || 0} AI analyses</div>
          <div>🎯 ${data.premiumValue?.interviews || 0} mock interviews</div>
          <div>📝 ${data.premiumValue?.applications || 0} applications</div>
          <div>📊 ${data.premiumValue?.resumeChecks || 0} resume scans</div>
        </div>
      </div>
      ` : ''}
      
      <h2 style="color: #333; margin: 25px 0 20px 0;">This Week's Activity</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${data.stats.applicationsThisWeek || 0}</div>
          <div class="stat-label">Applications Sent</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.stats.interviewsThisWeek || 0}</div>
          <div class="stat-label">Interview Practices</div>
        </div>
      </div>

      ${data.achievements && data.achievements.length > 0 ? `
      <h3 style="color: #333; margin: 25px 0 15px 0;">🏆 Achievements Unlocked</h3>
      <div>
        ${data.achievements.map((achievement: string) => `<span class="achievement-badge">${achievement}</span>`).join('')}
      </div>
      ` : ''}

      <h3 style="color: #333; margin: 25px 0 15px 0;">💡 Personalized Action Plan</h3>
      ${data.tips.map((tip: string) => `<div class="tip-box">${tip}</div>`).join('')}

      ${!isPremium ? `
      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <h4 style="margin: 0 0 10px 0; color: #856404;">🚀 Unlock Premium Features</h4>
        <p style="margin: 0; color: #856404;">Get unlimited AI features, mock interviews, and save $200+/month vs. competitors</p>
        <a href="https://autojobr.com/premium" class="cta-button" style="display: inline-block; margin-top: 15px;">Upgrade to Premium - Only $5/mo</a>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; margin: 10px 0;">Keep up the momentum! 💪</p>
        <a href="https://autojobr.com/dashboard" style="color: #667eea; text-decoration: none;">View Full Dashboard →</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const dailyEngagementService = new DailyEngagementService();
