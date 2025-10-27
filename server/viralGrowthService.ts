
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { emailService } from './emailService';

interface ViralIncentive {
  referrerId: string;
  referredEmail: string;
  incentiveType: 'premium_month' | 'credits' | 'feature_unlock';
}

class ViralGrowthService {
  // Track successful referrals
  async trackReferral(incentive: ViralIncentive) {
    const referrer = await db.select().from(users)
      .where(eq(users.id, incentive.referrerId)).limit(1);
    
    if (!referrer[0]) return;

    // Award referral bonus
    if (incentive.incentiveType === 'premium_month') {
      // Give 1 month premium for every 3 referrals
      await this.awardPremiumTime(incentive.referrerId, 30);
    }

    // Send notification
    await emailService.sendEmail({
      to: referrer[0].email!,
      subject: '🎉 Referral Bonus Unlocked!',
      html: `
        <h2>Great news! Your friend joined AutoJobR</h2>
        <p>You've earned premium benefits for referring ${incentive.referredEmail}</p>
        <p>Share your referral link to unlock more rewards!</p>
      `
    });
  }

  private async awardPremiumTime(userId: string, days: number) {
    // Extend premium subscription
    // Implementation based on your subscription service
  }

  // Generate shareable content
  generateShareableContent(userId: string) {
    return {
      twitter: `I just landed my dream job with @AutoJobR! 🚀 Apply to 1000+ jobs in minutes with AI. Get started: https://autojobr.com?ref=${userId}`,
      linkedin: `Excited to share that I found my new role using AutoJobR! Their AI-powered platform helped me apply to hundreds of jobs effortlessly. Check it out: https://autojobr.com?ref=${userId}`,
      facebook: `Job hunting made easy! 🎯 I used AutoJobR to automate my applications and land interviews. Try it free: https://autojobr.com?ref=${userId}`
    };
  }
}

export const viralGrowthService = new ViralGrowthService();
