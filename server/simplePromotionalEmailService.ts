import { storage } from './storage.js';
import { sendEmail } from './emailService.js';
import { User } from '../shared/schema.js';

interface PromotionalEmailConfig {
  enabled: boolean;
  intervalHours: number;
  batchSize: number;
  maxEmailsPerDay: number;
}

// Configuration for promotional emails
const PROMO_CONFIG: PromotionalEmailConfig = {
  enabled: process.env.PROMOTIONAL_EMAILS_ENABLED === 'true',
  intervalHours: parseInt(process.env.PROMO_EMAIL_INTERVAL_HOURS || '72'), // Every 3 days by default
  batchSize: parseInt(process.env.PROMO_EMAIL_BATCH_SIZE || '50'),
  maxEmailsPerDay: parseInt(process.env.PROMO_EMAIL_MAX_PER_DAY || '500')
};

// Track email sending to prevent spam
const emailTracker = new Map<string, { lastSent: Date; count: number }>();

class SimplePromotionalEmailService {
  private isRunning = false;

  async start() {
    if (!PROMO_CONFIG.enabled) {
      console.log('📧 Promotional email service disabled via configuration');
      return;
    }

    console.log(`📧 Starting simple promotional email service - interval: ${PROMO_CONFIG.intervalHours}h`);
    
    // Initial run after 1 minute
    setTimeout(() => this.sendPromotionalEmails(), 60 * 1000);
    
    // Regular interval for sending emails
    setInterval(() => this.sendPromotionalEmails(), PROMO_CONFIG.intervalHours * 60 * 60 * 1000);
  }

  private async sendPromotionalEmails() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📧 Starting promotional email batch...');

    try {
      // Get non-premium users who haven't received emails recently
      const eligibleJobSeekers = await this.getEligibleJobSeekers();
      const eligibleRecruiters = await this.getEligibleRecruiters();

      console.log(`📧 Found ${eligibleJobSeekers.length} eligible job seekers and ${eligibleRecruiters.length} eligible recruiters`);

      // Send job seeker promotional emails
      for (const jobSeeker of eligibleJobSeekers.slice(0, PROMO_CONFIG.batchSize)) {
        await this.sendJobSeekerPromoEmail(jobSeeker);
        await this.delay(2000); // 2 second delay between emails
      }

      // Send recruiter promotional emails
      for (const recruiter of eligibleRecruiters.slice(0, PROMO_CONFIG.batchSize)) {
        await this.sendRecruiterPromoEmail(recruiter);
        await this.delay(2000); // 2 second delay between emails
      }

    } catch (error) {
      console.error('❌ Error in promotional email service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async getEligibleJobSeekers(): Promise<User[]> {
    try {
      const allJobSeekers = await storage.getAllUsers();
      return allJobSeekers.filter(user => 
        user.userType === 'job_seeker' &&
        user.isEmailVerified &&
        user.planType !== 'premium' &&
        this.canSendEmail(user.email)
      );
    } catch (error) {
      console.error('Error getting eligible job seekers:', error);
      return [];
    }
  }

  private async getEligibleRecruiters(): Promise<User[]> {
    try {
      const allUsers = await storage.getAllUsers();
      return allUsers.filter(user => 
        user.userType === 'recruiter' &&
        user.isEmailVerified &&
        user.planType !== 'premium' &&
        this.canSendEmail(user.email)
      );
    } catch (error) {
      console.error('Error getting eligible recruiters:', error);
      return [];
    }
  }

  private canSendEmail(email: string): boolean {
    const tracker = emailTracker.get(email);
    const now = new Date();
    
    if (!tracker) {
      emailTracker.set(email, { lastSent: now, count: 0 });
      return true;
    }

    // Check if enough time has passed
    const hoursSinceLastEmail = (now.getTime() - tracker.lastSent.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEmail < PROMO_CONFIG.intervalHours) {
      return false;
    }

    // Reset daily count if it's a new day
    const daysSinceLastEmail = hoursSinceLastEmail / 24;
    if (daysSinceLastEmail >= 1) {
      tracker.count = 0;
    }

    return tracker.count < PROMO_CONFIG.maxEmailsPerDay;
  }

  private updateEmailTracker(email: string) {
    const tracker = emailTracker.get(email) || { lastSent: new Date(), count: 0 };
    tracker.lastSent = new Date();
    tracker.count += 1;
    emailTracker.set(email, tracker);
  }

  private async sendJobSeekerPromoEmail(user: User) {
    try {
      console.log(`📧 Sending job seeker promo email to: ${user.email}`);

      const emailContent = this.generateJobSeekerEmail(user);

      const success = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (success) {
        this.updateEmailTracker(user.email);
        console.log(`✅ Job seeker promo email sent successfully to: ${user.email}`);
      }

    } catch (error) {
      console.error(`❌ Error sending job seeker promo email to ${user.email}:`, error);
    }
  }

  private async sendRecruiterPromoEmail(user: User) {
    try {
      console.log(`📧 Sending recruiter promo email to: ${user.email}`);

      const emailContent = this.generateRecruiterEmail(user);

      const success = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (success) {
        this.updateEmailTracker(user.email);
        console.log(`✅ Recruiter promo email sent successfully to: ${user.email}`);
      }

    } catch (error) {
      console.error(`❌ Error sending recruiter promo email to ${user.email}:`, error);
    }
  }

  private generateJobSeekerEmail(user: User): { subject: string; html: string } {
    const userName = user.firstName || user.email.split('@')[0];
    const baseUrl = 'https://autojobr.com';

    // Random statistics for promotional content - showing only 4-5 job matches
    const randomJobCount = Math.floor(Math.random() * 2) + 4; // 4-5 jobs
    const randomCompatibility = Math.floor(Math.random() * 20) + 80; // 80-100% compatibility
    const randomNewJobs = Math.floor(Math.random() * 15) + 5; // 5-20 new jobs

    const subjects = [
      `${randomJobCount} Perfect Job Matches Found for You!`,
      `Your Dream Job is Waiting - ${randomCompatibility}% Match Rate!`,
      `${randomJobCount} Hand-Picked Opportunities Just for You!`,
      `Unlock Your Career Potential with AutoJobr Premium`,
      `${randomJobCount} Companies Want to Hire You!`
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Job Opportunities - AutoJobr</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Amazing Job Opportunities!</h1>
    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, we found great opportunities for you</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 12px 12px;">
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📈 This Week's Job Market Insights</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${randomJobCount}</div>
          <div style="font-size: 14px; color: #6b7280;">Matching Jobs Available</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #059669;">${randomCompatibility}%</div>
          <div style="font-size: 14px; color: #6b7280;">Average Match Rate</div>
        </div>
      </div>
    </div>

    <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
      Great news! We've hand-picked ${randomJobCount} job opportunities that could be perfect for your background. 
      Our AI-powered matching system has identified these top roles with up to ${randomCompatibility}% compatibility with your profile.
    </p>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
      <h4 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">🚀 AutoJobr Premium Features</h4>
      <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li style="margin-bottom: 8px;">AI Resume Analysis & ATS Optimization</li>
        <li style="margin-bottom: 8px;">Unlimited Job Applications</li>
        <li style="margin-bottom: 8px;">Direct Messaging with Recruiters</li>
        <li style="margin-bottom: 8px;">AI-Powered Cover Letter Generation</li>
        <li style="margin-bottom: 8px;">Advanced Job Compatibility Scoring</li>
        <li style="margin-bottom: 8px;">Priority Interview Scheduling</li>
        <li style="margin-bottom: 8px;">Salary Negotiation Insights</li>
      </ul>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
      <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚡ Limited Time Offer</h4>
      <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
        <strong>Get 30% off Premium</strong> this month. Don't let these ${randomJobCount} hand-picked opportunities slip away. 
        Premium users get ${randomCompatibility > 85 ? '3x more' : '2x more'} interview responses!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/jobs" 
         style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                font-size: 16px;
                display: inline-block;">
        View ${randomJobCount} Hand-Picked Jobs
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${baseUrl}/pricing" 
         style="background: #f59e0b; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600;
                display: inline-block;">
        Upgrade to Premium - 30% Off
      </a>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #374151; margin: 0 0 15px 0; text-align: center;">🔍 What Makes AutoJobr Different</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">🤖</div>
          <div style="font-size: 14px; color: #6b7280;">AI-Powered Matching</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">📊</div>
          <div style="font-size: 14px; color: #6b7280;">Resume Analysis</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">⚡</div>
          <div style="font-size: 14px; color: #6b7280;">Instant Applications</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">🎯</div>
          <div style="font-size: 14px; color: #6b7280;">Perfect Job Matches</div>
        </div>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      💡 <strong>Pro Tip:</strong> Upload your resume to get AI-powered ATS scoring and personalized improvement suggestions. 
      Our AI has curated these ${randomJobCount} top opportunities specifically for your profile.
    </p>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
      You received this email because you're a registered AutoJobr user. 
      <a href="${baseUrl}/unsubscribe?email=${user.email}" style="color: #6b7280;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  private generateRecruiterEmail(user: User): { subject: string; html: string } {
    const recruiterName = user.firstName || user.companyName || user.email.split('@')[0];
    const baseUrl = 'https://autojobr.com';

    // Random statistics for promotional content
    const randomCandidates = Math.floor(Math.random() * 50) + 30; // 30-80 candidates
    const randomNewThisWeek = Math.floor(Math.random() * 15) + 10; // 10-25 new this week
    const randomQualityScore = Math.floor(Math.random() * 15) + 85; // 85-100% quality

    const subjects = [
      `${randomNewThisWeek} New Qualified Candidates This Week!`,
      `${randomCandidates} Candidates Match Your Requirements`,
      `Don't Miss Out on Top Talent - ${randomQualityScore}% Success Rate`,
      `Hire Faster with AutoJobr's Premium Tools`,
      `Your Competitors are Using AI Recruitment - Are You?`
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Talent Available - AutoJobr</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Fresh Talent Pool!</h1>
    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Hi ${recruiterName}, ${randomNewThisWeek} new candidates this week</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 12px 12px;">
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📈 This Week's Recruitment Stats</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${randomCandidates}</div>
          <div style="font-size: 14px; color: #6b7280;">Available Candidates</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #059669;">${randomQualityScore}%</div>
          <div style="font-size: 14px; color: #6b7280;">Quality Match Rate</div>
        </div>
      </div>
    </div>

    <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
      Excellent news! ${randomNewThisWeek} new qualified candidates joined AutoJobr this week. 
      Our platform now has ${randomCandidates} candidates with verified skills and ${randomQualityScore}% matching accuracy for your hiring needs.
    </p>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
      <h4 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">🎯 Premium Recruitment Features</h4>
      <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li style="margin-bottom: 8px;">Unlimited Job Postings</li>
        <li style="margin-bottom: 8px;">Advanced Candidate Filtering</li>
        <li style="margin-bottom: 8px;">Direct Messaging with Candidates</li>
        <li style="margin-bottom: 8px;">AI-Powered Candidate Matching</li>
        <li style="margin-bottom: 8px;">Bulk Applicant Management</li>
        <li style="margin-bottom: 8px;">Advanced Analytics Dashboard</li>
        <li style="margin-bottom: 8px;">Priority Customer Support</li>
        <li style="margin-bottom: 8px;">API Integrations</li>
      </ul>
    </div>

    <div style="background: #fef7ed; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f97316;">
      <h4 style="color: #c2410c; margin: 0 0 10px 0; font-size: 16px;">⏰ Don't Let Competitors Win</h4>
      <p style="color: #c2410c; margin: 0; font-size: 14px; line-height: 1.5;">
        <strong>Premium recruiters are already messaging these ${randomCandidates} candidates.</strong> 
        Get ${randomQualityScore > 90 ? '50%' : '30%'} faster hiring results with AutoJobr Premium. 
        Limited offer: <strong>30% off first month!</strong>
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/recruiter/candidates" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                font-size: 16px;
                display: inline-block;">
        Browse ${randomCandidates} Candidates
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${baseUrl}/pricing" 
         style="background: #f59e0b; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600;
                display: inline-block;">
        Upgrade to Premium - 30% Off
      </a>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #374151; margin: 0 0 15px 0; text-align: center;">🔍 Why Choose AutoJobr Premium</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">∞</div>
          <div style="font-size: 14px; color: #6b7280;">Unlimited Job Posts</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">💬</div>
          <div style="font-size: 14px; color: #6b7280;">Direct Messaging</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">🎯</div>
          <div style="font-size: 14px; color: #6b7280;">AI Matching</div>
        </div>
        <div>
          <div style="font-size: 24px; margin-bottom: 5px;">📊</div>
          <div style="font-size: 14px; color: #6b7280;">Advanced Analytics</div>
        </div>
      </div>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
      <h4 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">🤖 AI-Powered Recruitment Success</h4>
      <p style="color: #0c4a6e; margin: 0; font-size: 14px; line-height: 1.5;">
        Our AI analyzes candidate profiles, skills, and experience to deliver ${randomQualityScore}% matching accuracy. 
        Premium users hire ${randomQualityScore > 90 ? '3x faster' : '2x faster'} than traditional methods.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      💡 <strong>Pro Tip:</strong> Use AutoJobr's Resume Analysis to instantly score ${randomCandidates} candidates. 
      Our AI evaluates skills, experience, and cultural fit automatically.
    </p>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
      You received this email as a registered AutoJobr recruiter. 
      <a href="${baseUrl}/unsubscribe?email=${user.email}" style="color: #6b7280;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API for status and management
  getServiceStatus() {
    return {
      enabled: PROMO_CONFIG.enabled,
      intervalHours: PROMO_CONFIG.intervalHours,
      batchSize: PROMO_CONFIG.batchSize,
      maxEmailsPerDay: PROMO_CONFIG.maxEmailsPerDay,
      emailsSentToday: Array.from(emailTracker.values()).reduce((sum, tracker) => {
        const today = new Date().toDateString();
        const trackerDate = new Date(tracker.lastSent).toDateString();
        return sum + (today === trackerDate ? tracker.count : 0);
      }, 0)
    };
  }
}

// Export singleton instance
export const simplePromotionalEmailService = new SimplePromotionalEmailService();

// Auto-start if enabled
if (PROMO_CONFIG.enabled) {
  simplePromotionalEmailService.start();
}