import Razorpay from 'razorpay';
import { storage } from './storage';

interface RazorpaySubscriptionPlan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    active: boolean;
    name: string;
    description: string;
    amount: number;
    unit_amount: number;
    currency: string;
    type: string;
  };
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, string>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: number;
  expire_by: number;
  short_url: string;
}

export class RazorpayService {
  private razorpay: Razorpay | null = null;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      console.warn('Razorpay credentials not configured - Indian payment features will be disabled');
    }
  }

  isAvailable(): boolean {
    return this.razorpay !== null;
  }

  // Convert USD to INR (you might want to use a currency API for real-time rates)
  private usdToInr(usdAmount: number): number {
    const exchangeRate = 83; // Approximate rate, should use live API
    return Math.round(usdAmount * exchangeRate * 100); // Razorpay expects amount in paise
  }

  async createSubscriptionPlan(
    tierName: string,
    usdPrice: number,
    interval: 'monthly' | 'yearly'
  ): Promise<string> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    const amountInPaise = this.usdToInr(usdPrice);
    const periodMapping = {
      monthly: { period: 'monthly', interval: 1 },
      yearly: { period: 'yearly', interval: 1 }
    };

    try {
      // First create an item
      const item = await this.razorpay.items.create({
        name: `${tierName} Plan`,
        description: `${tierName} subscription plan`,
        amount: amountInPaise,
        currency: 'INR',
        type: 'plan'
      });

      // Then create the plan
      const plan = await this.razorpay.plans.create({
        period: periodMapping[interval].period,
        interval: periodMapping[interval].interval,
        item: {
          name: `${tierName} Plan`,
          description: `${tierName} subscription plan`,
          amount: amountInPaise,
          currency: 'INR'
        },
        notes: {
          tier: tierName,
          usdPrice: usdPrice.toString(),
          interval
        }
      });

      return plan.id;
    } catch (error: any) {
      console.error('Razorpay plan creation error:', error);
      throw new Error('Failed to create Razorpay subscription plan');
    }
  }

  async createSubscription(
    userId: string,
    tierName: string,
    usdPrice: number,
    interval: 'monthly' | 'yearly',
    userEmail: string
  ): Promise<{
    subscriptionId: string;
    shortUrl: string;
    amountInINR: number;
  }> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      // Create or get existing plan
      const planId = await this.createSubscriptionPlan(tierName, usdPrice, interval);
      
      // Create customer
      const customer = await this.razorpay.customers.create({
        name: userEmail.split('@')[0],
        email: userEmail,
        contact: '', // You might want to collect phone number
        notes: {
          userId: userId
        }
      });

      // Create subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customer.id,
        quantity: 1,
        total_count: interval === 'yearly' ? 1 : 12, // 1 year or 12 months
        start_at: Math.floor(Date.now() / 1000) + 60, // Start 1 minute from now
        expire_by: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expire in 24 hours if not paid
        customer_notify: true,
        notes: {
          userId,
          tierName,
          usdPrice: usdPrice.toString(),
          interval
        }
      });

      // Save subscription to database
      await storage.createSubscription({
        id: `razorpay_${subscription.id}`,
        userId,
        tier: tierName,
        status: 'pending',
        paymentMethod: 'razorpay',
        amount: usdPrice,
        currency: 'USD',
        billingCycle: interval,
        startDate: new Date(subscription.start_at * 1000),
        endDate: new Date(subscription.start_at * 1000 + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: customer.id,
        razorpayPlanId: planId
      });

      return {
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        amountInINR: this.usdToInr(usdPrice) / 100 // Convert back to rupees from paise
      };
    } catch (error: any) {
      console.error('Razorpay subscription creation error:', error);
      throw new Error('Failed to create Razorpay subscription');
    }
  }

  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.event) {
        case 'subscription.activated':
          await this.handleSubscriptionActivated(event.payload.subscription.entity);
          break;
        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.subscription.entity);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.payload.subscription.entity);
          break;
        case 'subscription.completed':
          await this.handleSubscriptionCompleted(event.payload.subscription.entity);
          break;
        default:
          console.log('Unhandled Razorpay webhook event:', event.event);
      }
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  private async handleSubscriptionActivated(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    await storage.updateSubscription(`razorpay_${subscription.id}`, {
      status: 'active',
      startDate: new Date(subscription.current_start * 1000),
      endDate: new Date(subscription.current_end * 1000)
    });

    console.log(`Razorpay subscription activated for user ${userId}`);
  }

  private async handleSubscriptionCharged(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    // Update subscription end date for renewal
    await storage.updateSubscription(`razorpay_${subscription.id}`, {
      endDate: new Date(subscription.current_end * 1000)
    });

    console.log(`Razorpay subscription charged for user ${userId}`);
  }

  private async handleSubscriptionCancelled(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    await storage.updateSubscription(`razorpay_${subscription.id}`, {
      status: 'cancelled'
    });

    console.log(`Razorpay subscription cancelled for user ${userId}`);
  }

  private async handleSubscriptionCompleted(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    await storage.updateSubscription(`razorpay_${subscription.id}`, {
      status: 'completed'
    });

    console.log(`Razorpay subscription completed for user ${userId}`);
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      await this.razorpay.subscriptions.cancel(subscriptionId, true);
      return true;
    } catch (error: any) {
      console.error('Error cancelling Razorpay subscription:', error);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();