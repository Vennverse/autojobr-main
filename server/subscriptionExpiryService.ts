import { db } from './db.js';
import { eq, and, lt, lte } from 'drizzle-orm';
import * as schema from '@shared/schema.js';
import { sendEmail } from './emailService.js';

/**
 * Subscription Expiry Service
 * Handles premium subscription expiry, downgrades, and expiry warning emails
 */
export class SubscriptionExpiryService {
  private expiryCheckInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.init();
  }

  private init() {
    console.log('💳 Subscription Expiry Service initialized');
    this.startExpiryChecks();
  }

  /**
   * Start daily checks for subscription expiry at 12 UTC
   * Runs once per day at 12:00 UTC (noon)
   */
  private startExpiryChecks() {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }

    // Calculate time until next 12 UTC
    const scheduleNextRun = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(12, 0, 0, 0);

      const timeUntilNext = tomorrow.getTime() - now.getTime();
      
      // If it's already past 12 UTC today, schedule for today at 12 UTC
      if (timeUntilNext > 24 * 60 * 60 * 1000) {
        const today = new Date(now);
        today.setUTCHours(12, 0, 0, 0);
        if (today.getTime() > now.getTime()) {
          const runTime = today.toUTCString();
          console.log(`⏰ Subscription expiry check scheduled for: ${runTime} (12:00 UTC)`);
          return today.getTime() - now.getTime();
        }
      }

      const runTime = tomorrow.toUTCString();
      console.log(`⏰ Subscription expiry check scheduled for: ${runTime} (12:00 UTC)`);
      return timeUntilNext;
    };

    // Schedule first run
    const initialDelay = scheduleNextRun();
    setTimeout(() => {
      this.performExpiryChecks().catch(err => 
        console.error('❌ Error in scheduled expiry check:', err)
      );

      // Set up daily interval (24 hours = 86400000 ms)
      this.expiryCheckInterval = setInterval(() => {
        this.performExpiryChecks().catch(err => 
          console.error('❌ Error in scheduled expiry check:', err)
        );
      }, 24 * 60 * 60 * 1000); // Every 24 hours

      console.log('⏰ Subscription expiry check started - runs daily at 12:00 UTC');
    }, initialDelay);
  }

  /**
   * Perform all subscription expiry checks and actions
   */
  private async performExpiryChecks() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const now = new Date();

    try {
      // 1. Downgrade users whose premium has expired
      await this.downgradeExpiredPremium(now);

      // 2. Send warning emails to users expiring in 1 day
      await this.sendExpiryWarningEmails(now);

      // 3. Send warning emails to users expiring today
      await this.sendExpiryTodayEmails(now);
    } catch (error) {
      console.error('❌ Error in subscription expiry service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Downgrade users whose premium subscription has expired
   */
  private async downgradeExpiredPremium(now: Date) {
    try {
      const expiredUsers = await db.query.users.findMany({
        where: and(
          eq(schema.users.planType, 'premium'),
          eq(schema.users.subscriptionStatus, 'active'),
          lte(schema.users.subscriptionEndDate, now)
        )
      });

      if (expiredUsers.length === 0) {
        return;
      }

      console.log(`⏳ Processing ${expiredUsers.length} expired premium subscriptions...`);

      for (const user of expiredUsers) {
        try {
          // Downgrade user to free plan
          await db.update(schema.users)
            .set({
              planType: 'free',
              subscriptionStatus: 'free',
              subscriptionEndDate: null
            })
            .where(eq(schema.users.id, user.id));

          console.log(`✅ Downgraded user ${user.email} from premium to free`);

          // Send downgrade confirmation email
          await this.sendDowngradeEmail(user.email, user.firstName || 'User');
        } catch (err) {
          console.error(`❌ Error downgrading user ${user.email}:`, err);
        }
      }
    } catch (error) {
      console.error('❌ Error downgrading expired premiums:', error);
    }
  }

  /**
   * Send warning emails to users expiring in approximately 1 day (tomorrow)
   * Runs once daily at 12 UTC, checks for users expiring in ~24 hours
   */
  private async sendExpiryWarningEmails(now: Date) {
    try {
      // Calculate tomorrow at this time (24 hours from now)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStart = new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000); // 2 hours buffer
      const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000); // 2 hours buffer

      const expiringTomorrow = await db.query.users.findMany({
        where: and(
          eq(schema.users.planType, 'premium'),
          eq(schema.users.subscriptionStatus, 'active')
        )
      });

      const warningUsers = expiringTomorrow.filter(user => {
        if (!user.subscriptionEndDate) return false;
        const endDate = new Date(user.subscriptionEndDate);
        return endDate >= tomorrowStart && endDate <= tomorrowEnd;
      });

      if (warningUsers.length === 0) {
        return;
      }

      console.log(`📧 Sending 1-day expiry warning emails to ${warningUsers.length} users...`);

      for (const user of warningUsers) {
        try {
          await this.sendExpiryWarningEmail(
            user.email,
            user.firstName || 'User',
            user.subscriptionEndDate as Date
          );
        } catch (err) {
          console.error(`❌ Error sending warning email to ${user.email}:`, err);
        }
      }
    } catch (error) {
      console.error('❌ Error sending expiry warnings:', error);
    }
  }

  /**
   * Send urgent emails to users expiring within the next few hours
   * Runs once daily at 12 UTC, checks for users expiring soon
   */
  private async sendExpiryTodayEmails(now: Date) {
    try {
      // Check for users expiring in the next 12 hours from the daily run time
      const soon = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const expiringUsers = await db.query.users.findMany({
        where: and(
          eq(schema.users.planType, 'premium'),
          eq(schema.users.subscriptionStatus, 'active')
        )
      });

      const urgentUsers = expiringUsers.filter(user => {
        if (!user.subscriptionEndDate) return false;
        const endDate = new Date(user.subscriptionEndDate);
        return endDate > now && endDate <= soon;
      });

      if (urgentUsers.length === 0) {
        return;
      }

      console.log(`🚨 Sending urgent expiry emails to ${urgentUsers.length} users expiring within 12 hours...`);

      for (const user of urgentUsers) {
        try {
          await this.sendExpiryUrgentEmail(
            user.email,
            user.firstName || 'User',
            user.subscriptionEndDate as Date
          );
        } catch (err) {
          console.error(`❌ Error sending urgent email to ${user.email}:`, err);
        }
      }
    } catch (error) {
      console.error('❌ Error sending urgent expiry emails:', error);
    }
  }

  /**
   * Send premium expiry warning email (1 day before)
   */
  private async sendExpiryWarningEmail(email: string, name: string, expiryDate: Date) {
    const expiryTime = expiryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8a306; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Premium Expiring Soon!</h1>
            </div>

            <div class="content">
              <p>Hi ${name},</p>

              <p>Your premium subscription is expiring <strong>tomorrow at ${expiryTime}</strong>!</p>

              <p>After your premium expires, you'll be downgraded to our free plan and lose access to:</p>
              <ul>
                <li>Advanced job matching and filtering</li>
                <li>Priority support</li>
                <li>Unlimited job applications tracking</li>
                <li>AI-powered resume optimization</li>
                <li>Interview preparation tools</li>
              </ul>

              <p><strong>Don't lose your premium benefits!</strong></p>
              <p>Renew your premium subscription now to continue enjoying all the premium features:</p>

              <a href="https://autojobr.com/dashboard/premium" class="button">Upgrade to Premium</a>

              <p>Questions? Contact our support team at support@autojobr.com</p>
            </div>

            <div class="footer">
              <p>© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `⚠️ Your Premium Subscription Expires Tomorrow!`,
        html: emailHtml
      });
      console.log(`✅ Sent 1-day warning email to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send warning email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send urgent email on expiry day
   */
  private async sendExpiryUrgentEmail(email: string, name: string, expiryDate: Date) {
    const expiryTime = expiryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { background-color: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #d32f2f; }
            .button { background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: bold; }
            .footer { text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Your Premium Expires Today!</h1>
            </div>

            <div class="content">
              <p>Hi ${name},</p>

              <p><strong>Your premium subscription expires TODAY at ${expiryTime}!</strong></p>

              <p>This is your last chance to renew before you're downgraded to our free plan.</p>

              <p>Act now to keep all your premium features including:</p>
              <ul>
                <li>Advanced job matching and filtering</li>
                <li>Priority support</li>
                <li>Unlimited job applications tracking</li>
                <li>AI-powered resume optimization</li>
                <li>Interview preparation tools</li>
              </ul>

              <p><strong style="color: #d32f2f;">RENEW NOW - LIMITED TIME!</strong></p>

              <a href="https://autojobr.com/dashboard/premium" class="button">Renew Premium - 1 Click</a>

              <p>If you have any questions, our support team is ready to help at support@autojobr.com</p>
            </div>

            <div class="footer">
              <p>© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `🚨 URGENT: Your Premium Expires TODAY - Renew Now!`,
        html: emailHtml
      });
      console.log(`✅ Sent urgent expiry email to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send urgent email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send downgrade confirmation email
   */
  private async sendDowngradeEmail(email: string, name: string) {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #666; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Premium Subscription Has Ended</h1>
            </div>

            <div class="content">
              <p>Hi ${name},</p>

              <p>Your premium subscription has expired and your account has been downgraded to our free plan.</p>

              <p><strong>You still have access to:</strong></p>
              <ul>
                <li>Basic job search and filtering</li>
                <li>Application tracking</li>
                <li>Profile management</li>
                <li>Community resources</li>
              </ul>

              <p><strong>Want to get premium back?</strong></p>
              <p>Upgrade anytime to restore all premium features and benefits:</p>

              <a href="https://autojobr.com/dashboard/premium" class="button">Upgrade to Premium</a>

              <p>We've special offers available - check your email or login to see current promotions!</p>

              <p>Questions? Contact us at support@autojobr.com</p>
            </div>

            <div class="footer">
              <p>© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'Your Premium Subscription Has Ended',
        html: emailHtml
      });
      console.log(`✅ Sent downgrade confirmation email to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send downgrade email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
      console.log('💳 Subscription Expiry Service stopped');
    }
  }
}

// Create and export singleton instance
export const subscriptionExpiryService = new SubscriptionExpiryService();
