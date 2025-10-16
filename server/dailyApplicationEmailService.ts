import { db } from './db';
import { 
  users, 
  jobApplications,
  tasks,
  jobPostings
} from '@shared/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { sendEmail } from './emailService';

export class DailyApplicationEmailService {
  
  async sendDailyApplicationSummary(userId: string): Promise<boolean> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0] || !user[0].email) {
        console.log(`No email found for user ${userId}`);
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysApplications = await db.select()
        .from(jobApplications)
        .where(and(
          eq(jobApplications.userId, userId),
          gte(jobApplications.appliedDate, today),
          lte(jobApplications.appliedDate, tomorrow)
        ))
        .orderBy(desc(jobApplications.appliedDate));

      if (todaysApplications.length === 0) {
        return await this.sendMotivationalEmail(user[0]);
      }

      return await this.sendApplicationSummaryEmail(user[0], todaysApplications);
    } catch (error) {
      console.error('Error sending daily application summary:', error);
      return false;
    }
  }

  private async sendApplicationSummaryEmail(user: any, applications: any[]): Promise<boolean> {
    const userName = user.firstName || 'there';
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .header h1 {
      color: #10b981;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #1f2937;
      font-size: 20px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .section h2 span {
      margin-right: 10px;
    }
    .application-card {
      background-color: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .application-card h3 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 18px;
    }
    .application-card .company {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .application-card .meta {
      display: flex;
      gap: 15px;
      font-size: 14px;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .application-card .link {
      display: inline-block;
      color: #10b981;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .application-card .link:hover {
      text-decoration: underline;
    }
    .task-list {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
    }
    .task-list ul {
      margin: 10px 0 0 0;
      padding-left: 20px;
    }
    .task-list li {
      margin-bottom: 8px;
      color: #78350f;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .stat-item {
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      display: block;
    }
    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 10px 5px;
    }
    .cta-button:hover {
      background-color: #059669;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }
    .quote {
      font-style: italic;
      color: #6b7280;
      padding: 15px;
      background-color: #f9fafb;
      border-left: 3px solid #10b981;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Your Job Search Activity</h1>
      <p>${dateStr}</p>
    </div>

    <div class="section">
      <h2><span>📊</span> Today's Summary</h2>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">${applications.length}</span>
          <span class="stat-label">Applications Submitted</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2><span>📝</span> Applications Submitted Today</h2>
      ${applications.map(app => `
        <div class="application-card">
          <h3>${app.jobTitle}</h3>
          <div class="company">🏢 ${app.company}</div>
          ${app.location ? `<div class="meta"><span>📍 ${app.location}</span></div>` : ''}
          ${app.jobUrl ? `<a href="${app.jobUrl}" class="link">View Job Posting →</a>` : ''}
          ${app.notes ? `<p style="margin-top: 10px; color: #6b7280; font-size: 14px;">Note: ${app.notes}</p>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2><span>✅</span> Suggested Follow-Up Actions</h2>
      <div class="task-list">
        <p><strong>We've automatically created these tasks for you:</strong></p>
        <ul>
          ${applications.map(app => `
            <li>Follow up on <strong>${app.jobTitle}</strong> at <strong>${app.company}</strong> (Due in 3 days)</li>
          `).join('')}
          <li>Connect with recruiters at these companies on LinkedIn</li>
          <li>Research company culture and recent news</li>
          <li>Prepare for potential screening calls</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2><span>🎨</span> Next Steps</h2>
      <p>Keep the momentum going! Here's what you can do:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://autojobr.com/jobs" class="cta-button">Discover More Jobs</a>
        <a href="https://autojobr.com/applications" class="cta-button">Track Applications</a>
      </div>
    </div>

    <div class="quote">
      "Success is the sum of small efforts repeated day in and day out." - Robert Collier
    </div>

    <div class="footer">
      <p>Keep up the great work, ${userName}! 💪</p>
      <p style="margin-top: 10px;">
        <a href="https://autojobr.com" style="color: #10b981; text-decoration: none;">AutoJobr</a> - 
        Your AI-Powered Job Search Assistant
      </p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="https://autojobr.com/settings" style="color: #9ca3af;">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail({
      to: user.email,
      subject: `🎯 Your Job Search Activity for ${dateStr}`,
      html: htmlContent
    });
  }

  private async sendMotivationalEmail(user: any): Promise<boolean> {
    const userName = user.firstName || 'there';
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const newJobs = await db.select()
      .from(jobPostings)
      .where(eq(jobPostings.isActive, true))
      .orderBy(desc(jobPostings.createdAt))
      .limit(5);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      color: #3b82f6;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .motivational-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .motivational-box h2 {
      margin: 0 0 15px 0;
      font-size: 24px;
    }
    .motivational-box p {
      font-size: 16px;
      line-height: 1.8;
    }
    .job-card {
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .job-card h3 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 18px;
    }
    .job-card .company {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .job-card .link {
      display: inline-block;
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
      font-size: 16px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }
    .tips-box {
      background-color: #fef3c7;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .tips-box h3 {
      color: #78350f;
      margin-top: 0;
    }
    .tips-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .tips-box li {
      color: #78350f;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💡 Stay Motivated!</h1>
      <p>${dateStr}</p>
    </div>

    <div class="motivational-box">
      <h2>🌟 No Applications Today?</h2>
      <p>That's okay! Every job search journey has its own pace. Today is a perfect day to explore new opportunities and take the next step toward your dream career.</p>
      <p><strong>Remember:</strong> Your next great opportunity could be just one application away!</p>
    </div>

    <div style="margin: 30px 0;">
      <h2 style="color: #1f2937;">🎯 Fresh Opportunities Waiting for You</h2>
      <p style="color: #6b7280;">Check out these new job postings that might be perfect for you:</p>
      
      ${newJobs.length > 0 ? newJobs.map(job => `
        <div class="job-card">
          <h3>${job.title}</h3>
          <div class="company">🏢 ${job.companyName}</div>
          ${job.location ? `<div style="color: #9ca3af; font-size: 14px;">📍 ${job.location}</div>` : ''}
          <a href="https://autojobr.com/view-job/${job.id}" class="link">View Details →</a>
        </div>
      `).join('') : '<p style="color: #6b7280;">Visit our job board to discover new opportunities!</p>'}
    </div>

    <div class="tips-box">
      <h3>💪 Quick Tips to Boost Your Job Search</h3>
      <ul>
        <li>Update your resume with recent projects or achievements</li>
        <li>Optimize your LinkedIn profile with keywords from your target jobs</li>
        <li>Set up job alerts for your preferred roles and companies</li>
        <li>Practice common interview questions</li>
        <li>Network with professionals in your industry</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="https://autojobr.com/jobs" class="cta-button">🔍 Browse All Jobs</a>
    </div>

    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-radius: 6px;">
      <p style="font-style: italic; color: #166534; font-size: 18px; margin: 0;">
        "The only way to do great work is to love what you do." - Steve Jobs
      </p>
    </div>

    <div class="footer">
      <p>You've got this, ${userName}! Keep pushing forward. 🚀</p>
      <p style="margin-top: 10px;">
        <a href="https://autojobr.com" style="color: #3b82f6; text-decoration: none;">AutoJobr</a> - 
        Your AI-Powered Job Search Assistant
      </p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="https://autojobr.com/settings" style="color: #9ca3af;">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail({
      to: user.email,
      subject: `💡 Keep Your Job Search Momentum Going - ${dateStr}`,
      html: htmlContent
    });
  }

  async sendDailySummaryToAllUsers(): Promise<void> {
    try {
      const activeUsers = await db.select()
        .from(users)
        .where(eq(users.emailVerified, true));

      console.log(`📧 Sending daily application summaries to ${activeUsers.length} users...`);

      for (const user of activeUsers) {
        try {
          await this.sendDailyApplicationSummary(user.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error sending summary to user ${user.id}:`, error);
        }
      }

      console.log(`✅ Daily application summaries sent successfully`);
    } catch (error) {
      console.error('Error in sendDailySummaryToAllUsers:', error);
    }
  }
}

export const dailyApplicationEmailService = new DailyApplicationEmailService();
