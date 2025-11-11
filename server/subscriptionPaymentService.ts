// Import PayPal services for payment processing  
// Note: PayPal integration uses the existing PayPal service for order creation
import { db } from './db';
import { userProfiles, subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker' | 'recruiter';
  features: string[];
  limits: {
    jobAnalyses?: number;
    resumeAnalyses?: number;
    applications?: number;
    autoFills?: number;
    jobPostings?: number;
    interviews?: number;
    candidates?: number;
    coverLetters?: number;
  };
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  // Job Seeker Plans - New Structure
  // 1. MONTHLY ACCESS - Pay As You Go
  {
    id: 'monthly-access',
    name: 'MONTHLY ACCESS',
    price: 19,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'jobseeker',
    features: [
      'Same AI tools & Resume Builder as Smart Saver',
      'Ideal for quick job hunts or interview prep',
      'Upgrade anytime to Smart Saver and save 30%',
      'Full access — no auto-renew hassle'
    ],
    limits: {
      jobAnalyses: -1, // Unlimited
      resumeAnalyses: -1, // Unlimited
      applications: -1, // Unlimited applications
      autoFills: -1, // Unlimited auto-fills
      coverLetters: -1, // Unlimited cover letters
      interviews: 10 // Limited mock interviews
    }
  },
  
  // 2. SMART SAVER - Most Popular (Monthly)
  {
    id: 'smart-saver-monthly',
    name: 'SMART SAVER',
    price: 13,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'jobseeker',
    features: [
      'Unlimited Resumes & Job Tracking',
      'AI Resume & Cover Letter Builder',
      'LinkedIn & ATS Optimization',
      'Chrome Extension for One-Click Apply',
      'Interview Practice Tools',
      '72% of users got interviews within 3 weeks',
      'Cancel Anytime — No Hidden Fees'
    ],
    limits: {
      jobAnalyses: -1, // Unlimited
      resumeAnalyses: -1, // Unlimited
      applications: -1, // Unlimited applications
      autoFills: -1, // Unlimited auto-fills
      coverLetters: -1, // Unlimited cover letters
      interviews: -1 // Unlimited interviews
    }
  },
  
  // 2b. SMART SAVER - Most Popular (Yearly)
  {
    id: 'smart-saver-yearly',
    name: 'SMART SAVER',
    price: 130,
    currency: 'USD',
    billingCycle: 'yearly',
    userType: 'jobseeker',
    features: [
      'Unlimited Resumes & Job Tracking',
      'AI Resume & Cover Letter Builder',
      'LinkedIn & ATS Optimization',
      'Chrome Extension for One-Click Apply',
      'Interview Practice Tools',
      '72% of users got interviews within 3 weeks',
      'Cancel Anytime — No Hidden Fees',
      'Save $26/year compared to monthly'
    ],
    limits: {
      jobAnalyses: -1, // Unlimited
      resumeAnalyses: -1, // Unlimited
      applications: -1, // Unlimited applications
      autoFills: -1, // Unlimited auto-fills
      coverLetters: -1, // Unlimited cover letters
      interviews: -1 // Unlimited interviews
    }
  },
  
  // 3. ULTRA PLAN - Power Career Mode (Monthly)
  {
    id: 'ultra-plan-monthly',
    name: 'ULTRA PLAN',
    price: 24,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'jobseeker',
    features: [
      'Everything in Smart Saver, plus:',
      'Unlimited AI Applications & Mock Interviews',
      'Video Interview Prep + AI Feedback',
      'Career Analytics & Salary Coach',
      'Priority Referrals & Early Job Access',
      'Career Planning & Growth Tracker',
      '24-hour Priority Support'
    ],
    limits: {
      jobAnalyses: -1, // Unlimited
      resumeAnalyses: -1, // Unlimited
      applications: -1, // Unlimited applications
      autoFills: -1, // Unlimited auto-fills
      interviews: -1, // Unlimited
      coverLetters: -1 // Unlimited cover letters
    }
  },
  
  // 3b. ULTRA PLAN - Power Career Mode (Yearly)
  {
    id: 'ultra-plan-yearly',
    name: 'ULTRA PLAN',
    price: 240,
    currency: 'USD',
    billingCycle: 'yearly',
    userType: 'jobseeker',
    features: [
      'Everything in Smart Saver, plus:',
      'Unlimited AI Applications & Mock Interviews',
      'Video Interview Prep + AI Feedback',
      'Career Analytics & Salary Coach',
      'Priority Referrals & Early Job Access',
      'Career Planning & Growth Tracker',
      '24-hour Priority Support',
      'Save $48/year compared to monthly'
    ],
    limits: {
      jobAnalyses: -1, // Unlimited
      resumeAnalyses: -1, // Unlimited
      applications: -1, // Unlimited applications
      autoFills: -1, // Unlimited auto-fills
      interviews: -1, // Unlimited
      coverLetters: -1 // Unlimited cover letters
    }
  },

  // Recruiter Plans
  // FREE TIER (default - no entry needed here, handled by free plan in subscriptionService.ts)
  
  // STARTER - $10/month
  {
    id: 'recruiter_starter_monthly',
    name: 'Recruiter Starter',
    price: 10,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'FREE Professional Career Page (We maintain it!)',
      'Up to 5 Active Job Postings',
      'Candidate Search & Filtering',
      'Basic AI Resume Scoring',
      'Virtual Interview Assignments (50)',
      'Basic Analytics Dashboard',
      'Email Support'
    ],
    limits: {
      jobPostings: 5,
      candidates: 100,
      interviews: 50
    }
  },
  
  // PROFESSIONAL - $20/month (Most Popular)
  {
    id: 'recruiter_professional_monthly',
    name: 'Recruiter Professional',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'Everything in Starter, plus:',
      'FREE Professional Career Page (We maintain it!)',
      'Up to 20 Active Job Postings',
      'Virtual Interview Assignments (200)',
      'Custom Coding Test Creation',
      'Advanced AI Candidate Matching',
      'Advanced Analytics & Reports',
      'Priority Email Support'
    ],
    limits: {
      jobPostings: 20,
      candidates: 500,
      interviews: 200
    }
  },
  
  // ENTERPRISE - $40/month
  {
    id: 'recruiter_enterprise_monthly',
    name: 'Recruiter Enterprise',
    price: 40,
    currency: 'USD',
    billingCycle: 'monthly',
    userType: 'recruiter',
    features: [
      'Everything in Professional, plus:',
      'FREE Fortune 500-Quality Career Page (We maintain it!)',
      'Unlimited Job Postings',
      'Unlimited Virtual Interviews',
      'Custom Company Branding',
      'API Access & Integrations',
      'Bulk Candidate Operations',
      'Dedicated Account Manager',
      'Priority Support (24-hour response)'
    ],
    limits: {
      jobPostings: -1, // Unlimited
      candidates: -1,
      interviews: -1
    }
  }
];

export class SubscriptionPaymentService {
  async createSubscriptionOrder(
    userId: string,
    tierId: string,
    paymentMethod: 'paypal' | 'razorpay'
  ): Promise<{ orderId: string; approvalUrl?: string }> {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    if (!tier) {
      throw new Error('Invalid subscription tier');
    }

    // Create subscription record in database (pending)
    // Monthly Access is a one-time payment with no auto-renew
    const shouldAutoRenew = tierId !== 'monthly-access';
    
    const subscription = await db.insert(subscriptions).values({
      userId,
      tier: tierId,
      status: 'pending',
      paymentMethod,
      amount: tier.price,
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      startDate: new Date(),
      endDate: this.calculateEndDate(tier.billingCycle),
      autoRenew: shouldAutoRenew
    }).returning();

    if (paymentMethod === 'paypal') {
      return this.createPayPalSubscription(tier, subscription[0].id);
    } else {
      return this.createRazorpaySubscription(tier, subscription[0].id);
    }
  }

  private async createPayPalSubscription(
    tier: SubscriptionTier,
    subscriptionId: number
  ): Promise<{ orderId: string }> {
    // For now, create a one-time payment order
    // In production, you'd create a PayPal subscription plan
    const mockRequest = {
      body: {
        amount: tier.price.toString(),
        currency: tier.currency,
        intent: 'CAPTURE'
      }
    } as any;

    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => ({ statusCode: code, ...data })
      })
    } as any;

    await createPaypalOrder(mockRequest, mockResponse);
    
    // In a real implementation, extract the order ID from the response
    return { orderId: `PP_${subscriptionId}_${Date.now()}` };
  }

  private async createRazorpaySubscription(
    tier: SubscriptionTier,
    subscriptionId: number
  ): Promise<{ orderId: string }> {
    // Razorpay integration would go here
    // For now, return a mock order ID
    return { orderId: `RZ_${subscriptionId}_${Date.now()}` };
  }

  async handlePaymentSuccess(
    orderId: string,
    paymentDetails: any
  ): Promise<void> {
    // Extract subscription ID from order ID
    const subscriptionId = this.extractSubscriptionId(orderId);
    
    // Update subscription status to active
    await db.update(subscriptions)
      .set({
        status: 'active',
        paymentId: paymentDetails.id || orderId,
        activatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId));

    // Update user's subscription tier
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId)
    });

    if (subscription) {
      // Update user profile subscription tier
      await db.update(userProfiles)
        .set({
          subscriptionTier: subscription.tier,
          subscriptionStatus: 'active'
        })
        .where(eq(userProfiles.userId, subscription.userId));

      // CRITICAL: Update user's planType to 'premium' for access control
      const { users } = await import('@shared/schema');
      await db.update(users)
        .set({
          planType: 'premium',
          subscriptionStatus: 'active',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: subscription.endDate
        })
        .where(eq(users.id, subscription.userId));
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    // Mark subscription as cancelled
    await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false
      })
      .where(eq(subscriptions.userId, userId));

    // Update user profile
    await db.update(userProfiles)
      .set({
        subscriptionStatus: 'cancelled'
      })
      .where(eq(userProfiles.userId, userId));

    // CRITICAL: Downgrade user to free plan when subscription is cancelled
    const { users } = await import('@shared/schema');
    await db.update(users)
      .set({
        planType: 'free',
        subscriptionStatus: 'cancelled'
      })
      .where(eq(users.id, userId));
  }

  async getSubscriptionTiers(userType?: 'jobseeker' | 'recruiter'): Promise<SubscriptionTier[]> {
    if (userType) {
      return SUBSCRIPTION_TIERS.filter(tier => tier.userType === userType);
    }
    return SUBSCRIPTION_TIERS;
  }

  async getUserSubscription(userId: string) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)]
    });

    if (!subscription) {
      return null;
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier);
    
    return {
      ...subscription,
      tierDetails: tier,
      isActive: subscription.status === 'active' && new Date() < subscription.endDate,
      daysRemaining: Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    };
  }

  private calculateEndDate(billingCycle: 'monthly' | 'yearly'): Date {
    const now = new Date();
    if (billingCycle === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  private extractSubscriptionId(orderId: string): number {
    // Extract subscription ID from order ID format: PP_123_timestamp or RZ_123_timestamp
    const parts = orderId.split('_');
    return parseInt(parts[1]);
  }

  async processSubscriptionRenewal(subscriptionId: number): Promise<boolean> {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId)
    });

    if (!subscription || !subscription.autoRenew) {
      return false;
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier);
    if (!tier) {
      return false;
    }

    try {
      // Create renewal order (would integrate with PayPal/Razorpay recurring billing)
      const newEndDate = this.calculateEndDate(tier.billingCycle);
      
      await db.update(subscriptions)
        .set({
          endDate: newEndDate,
          renewedAt: new Date()
        })
        .where(eq(subscriptions.id, subscriptionId));

      return true;
    } catch (error) {
      console.error('Failed to renew subscription:', error);
      return false;
    }
  }
}

export const subscriptionPaymentService = new SubscriptionPaymentService();