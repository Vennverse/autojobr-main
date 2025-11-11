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
    const exchangeRate = 84; // Updated approximate rate (Jan 2025)
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
      
      // Try to find existing customer by email or create new one
      let customer;
      
      const { db } = await import('./db');
      const schema = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Check if customer already exists in database
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId)
      });
      
      if (existingUser?.razorpayCustomerId) {
        try {
          // Fetch existing customer from Razorpay
          customer = await this.razorpay.customers.fetch(existingUser.razorpayCustomerId);
          console.log(`✅ Using existing Razorpay customer: ${customer.id}`);
        } catch (fetchError) {
          console.log(`⚠️ Failed to fetch existing customer, will create new one`);
          // Customer ID in DB but doesn't exist in Razorpay, create new one
          customer = null;
        }
      }
      
      // If no customer found, create new one
      if (!customer) {
        try {
          customer = await this.razorpay.customers.create({
            name: userEmail.split('@')[0],
            email: userEmail,
            contact: '',
            notes: {
              userId: userId
            }
          });
          
          console.log(`✅ Created new Razorpay customer: ${customer.id}`);
          
          // Save customer ID to database
          await db.update(schema.users)
            .set({ razorpayCustomerId: customer.id })
            .where(eq(schema.users.id, userId));
        } catch (createError: any) {
          // If customer already exists in Razorpay, try to find them by email
          if (createError.error?.description?.includes('Customer already exists')) {
            console.log(`⚠️ Customer exists in Razorpay but not in DB, fetching by email...`);
            
            // List customers and find by email
            const customersList = await this.razorpay.customers.all({ email: userEmail });
            if (customersList.items && customersList.items.length > 0) {
              customer = customersList.items[0];
              
              // Save to database
              await db.update(schema.users)
                .set({ razorpayCustomerId: customer.id })
                .where(eq(schema.users.id, userId));
              
              console.log(`✅ Found and linked existing customer: ${customer.id}`);
            } else {
              throw new Error('Customer exists but could not be found');
            }
          } else {
            throw createError;
          }
        }
      }

      // Create subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customer.id,
        quantity: 1,
        total_count: interval === 'yearly' ? 1 : 12, // 1 year or 12 months
        start_at: Math.floor(Date.now() / 1000) + (10 * 60), // Start 10 minutes from now to avoid timing issues
        expire_by: Math.floor(Date.now() / 1000) + (48 * 60 * 60), // Expire in 48 hours if not paid
        customer_notify: true,
        notes: {
          userId,
          tierName,
          usdPrice: usdPrice.toString(),
          interval
        }
      });

      // Save subscription to database (reuse existing db and schema imports)
      
      await db.insert(schema.subscriptions).values({
        userId,
        tier: tierName,
        tierId: tierName, // For compatibility
        status: 'pending',
        paymentMethod: 'razorpay',
        amount: usdPrice.toString(),
        currency: 'USD',
        billingCycle: interval,
        startDate: new Date(subscription.start_at * 1000),
        endDate: new Date(subscription.start_at * 1000 + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(subscription.start_at * 1000 + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: customer.id,
        razorpayPlanId: planId,
        createdAt: new Date()
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

    const { db } = await import('./db');
    const schema = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(schema.subscriptions)
      .set({
        status: 'active',
        startDate: new Date(subscription.current_start * 1000),
        endDate: new Date(subscription.current_end * 1000),
        activatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.subscriptions.razorpaySubscriptionId, subscription.id));

    // Update user subscription status
    await db.update(schema.users)
      .set({
        subscriptionStatus: 'active',
        planType: subscription.notes.tierName || 'premium',
        subscriptionStartDate: new Date(subscription.current_start * 1000),
        subscriptionEndDate: new Date(subscription.current_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId));

    console.log(`Razorpay subscription activated for user ${userId}`);
  }

  private async handleSubscriptionCharged(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    const { db } = await import('./db');
    const schema = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Update subscription end date for renewal
    await db.update(schema.subscriptions)
      .set({
        endDate: new Date(subscription.current_end * 1000),
        nextBillingDate: new Date(subscription.current_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(schema.subscriptions.razorpaySubscriptionId, subscription.id));

    console.log(`Razorpay subscription charged for user ${userId}`);
  }

  private async handleSubscriptionCancelled(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    const { db } = await import('./db');
    const schema = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(schema.subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.subscriptions.razorpaySubscriptionId, subscription.id));

    console.log(`Razorpay subscription cancelled for user ${userId}`);
  }

  private async handleSubscriptionCompleted(subscription: RazorpaySubscription): Promise<void> {
    const userId = subscription.notes.userId;
    if (!userId) return;

    const { db } = await import('./db');
    const schema = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(schema.subscriptions)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(schema.subscriptions.razorpaySubscriptionId, subscription.id));

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