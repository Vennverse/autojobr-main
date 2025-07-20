import axios from 'axios';
import { db } from './db';
import { subscriptions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface PayPalAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
}

interface PayPalSubscription {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  subscriber: {
    email_address: string;
    payer_id: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalSubscriptionService {
  private readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

  // Product and Plan IDs (these would be created once and stored)
  private readonly PRODUCTS = {
    JOBSEEKER: {
      BASIC: 'PROD_JOBSEEKER_BASIC',
      PREMIUM: 'PROD_JOBSEEKER_PREMIUM'
    },
    RECRUITER: {
      STARTER: 'PROD_RECRUITER_STARTER',
      PROFESSIONAL: 'PROD_RECRUITER_PROFESSIONAL',
      ENTERPRISE: 'PROD_RECRUITER_ENTERPRISE'
    }
  };

  private readonly PLANS = {
    JOBSEEKER_BASIC_MONTHLY: 'PLAN_JOBSEEKER_BASIC_MONTHLY',
    JOBSEEKER_PREMIUM_MONTHLY: 'PLAN_JOBSEEKER_PREMIUM_MONTHLY',
    RECRUITER_STARTER_MONTHLY: 'PLAN_RECRUITER_STARTER_MONTHLY',
    RECRUITER_PROFESSIONAL_MONTHLY: 'PLAN_RECRUITER_PROFESSIONAL_MONTHLY',
    RECRUITER_ENTERPRISE_MONTHLY: 'PLAN_RECRUITER_ENTERPRISE_MONTHLY'
  };

  constructor() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      console.warn('PayPal credentials not configured - subscription features will be disabled');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/oauth2/token`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
        },
        data: 'grant_type=client_credentials'
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('PayPal token error:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createSubscription(userId: string, planId: string, userEmail: string): Promise<{
    subscriptionId: string;
    approvalUrl: string;
  }> {
    const token = await this.getAccessToken();
    
    const subscriptionData = {
      plan_id: planId,
      subscriber: {
        email_address: userEmail
      },
      application_context: {
        brand_name: "AutoJobr",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscription/success`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscription/cancel`
      }
    };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'PayPal-Request-Id': `SUB-${userId}-${Date.now()}`
        },
        data: subscriptionData
      });

      const subscription: PayPalSubscription = response.data;
      const approvalLink = subscription.links.find(link => link.rel === 'approve');

      if (!approvalLink) {
        throw new Error('No approval URL returned from PayPal');
      }

      // Store subscription in database with pending status
      await db.insert(subscriptions).values({
        userId,
        paypalSubscriptionId: subscription.id,
        planId,
        status: 'pending',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paymentProvider: 'paypal'
      });

      return {
        subscriptionId: subscription.id,
        approvalUrl: approvalLink.href
      };
    } catch (error: any) {
      console.error('PayPal subscription creation error:', error.response?.data || error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  async verifySubscription(subscriptionId: string): Promise<{
    status: string;
    subscriberEmail: string;
    nextBillingTime?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const subscription: PayPalSubscription = response.data;

      return {
        status: subscription.status,
        subscriberEmail: subscription.subscriber?.email_address || '',
        nextBillingTime: subscription.start_time
      };
    } catch (error) {
      console.error('PayPal subscription verification error:', error);
      throw new Error('Failed to verify PayPal subscription');
    }
  }

  async activateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Update database subscription status
      await db.update(subscriptions)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      // Update user subscription status
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.paypalSubscriptionId, subscriptionId)
      });

      if (subscription) {
        await db.update(users)
          .set({
            planType: 'premium',
            subscriptionStatus: 'active',
            updatedAt: new Date()
          })
          .where(eq(users.id, subscription.userId));
      }

      return true;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw new Error('Failed to activate subscription');
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        data: { reason }
      });

      // Update database
      await db.update(subscriptions)
        .set({ 
          status: 'cancelled',
          canceledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      // Update user status
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.paypalSubscriptionId, subscriptionId)
      });

      if (subscription) {
        await db.update(users)
          .set({
            planType: 'free',
            subscriptionStatus: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(users.id, subscription.userId));
      }

      return true;
    } catch (error) {
      console.error('PayPal subscription cancellation error:', error);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  getPlanIdForTier(userType: 'jobseeker' | 'recruiter', tierName: string): string {
    if (userType === 'jobseeker') {
      if (tierName.includes('Basic')) return this.PLANS.JOBSEEKER_BASIC_MONTHLY;
      if (tierName.includes('Premium')) return this.PLANS.JOBSEEKER_PREMIUM_MONTHLY;
    } else if (userType === 'recruiter') {
      if (tierName.includes('Starter')) return this.PLANS.RECRUITER_STARTER_MONTHLY;
      if (tierName.includes('Professional')) return this.PLANS.RECRUITER_PROFESSIONAL_MONTHLY;
      if (tierName.includes('Enterprise')) return this.PLANS.RECRUITER_ENTERPRISE_MONTHLY;
    }
    
    throw new Error('Invalid user type or tier name');
  }

  // Check if user has active premium subscription
  async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      return user?.subscriptionStatus === 'active' && user?.planType === 'premium';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }
}

export const paypalSubscriptionService = new PayPalSubscriptionService();