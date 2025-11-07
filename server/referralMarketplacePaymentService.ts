import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from './db.js';
import { referralBookings, referrers } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface PaymentRequest {
  bookingId: number;
  amount: number;
  currency: 'USD' | 'INR';
  userCountry: string;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export class ReferralMarketplacePaymentService {
  private razorpay: Razorpay | null = null;
  private readonly INR_TO_USD_RATE = 83; // Approximate rate, should use live API for production

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log('✅ Razorpay initialized for referral marketplace payments');
    } else {
      console.warn('⚠️ Razorpay credentials not configured - Indian payment features will be disabled');
    }
  }

  /**
   * Detect user's country from IP address (geolocation)
   */
  async detectUserCountry(ipAddress: string): Promise<string> {
    try {
      // In development, check if IP is localhost
      if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('::ffff:127.0.0.1')) {
        // Default to India for development (or use a test IP)
        return 'IN';
      }

      // Use a free geolocation API
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      const data = await response.json();

      if (data.status === 'success') {
        return data.countryCode || 'US';
      }

      return 'US'; // Default to US if detection fails
    } catch (error) {
      console.error('Error detecting country from IP:', error);
      return 'US'; // Default to US on error
    }
  }

  /**
   * Calculate pricing with country-specific adjustments
   */
  private calculatePricing(baseAmount: number, country: string): {
    amount: number;
    currency: 'USD' | 'INR';
    discount: number;
  } {
    if (country === 'IN') {
      // Convert USD to INR without discount
      const inrAmount = Math.round(baseAmount * this.INR_TO_USD_RATE);

      return {
        amount: inrAmount,
        currency: 'INR',
        discount: 0
      };
    } else {
      // International users pay in USD without discount
      return {
        amount: baseAmount,
        currency: 'USD',
        discount: 0
      };
    }
  }

  /**
   * Create Razorpay order for Indian users
   */
  async createRazorpayOrder(
    bookingId: number,
    amountInINR: number
  ): Promise<RazorpayOrderResponse> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const options = {
        amount: amountInINR * 100, // Amount in paise
        currency: 'INR',
        receipt: `booking_${bookingId}_${Date.now()}`,
        notes: {
          bookingId: bookingId.toString(),
          type: 'referral_marketplace'
        }
      };

      const order = await this.razorpay.orders.create(options);
      console.log(`✅ Razorpay order created: ${order.id} for booking ${bookingId}`);

      return {
        id: order.id,
        amount: order.amount / 100, // Convert back to rupees
        currency: order.currency,
        receipt: order.receipt
      };
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error('Failed to create Razorpay order: ' + error.message);
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay key secret not configured');
    }

    try {
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      const isValid = expectedSignature === signature;
      console.log(`🔐 Razorpay payment verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);

      return isValid;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      return false;
    }
  }

  /**
   * Process successful payment and update booking
   */
  async processPaymentSuccess(
    bookingId: number,
    paymentId: string,
    provider: 'paypal' | 'razorpay',
    currency: 'USD' | 'INR',
    country: string
  ): Promise<void> {
    try {
      // Update booking with payment information
      await db.update(referralBookings)
        .set({
          paymentStatus: 'escrowed',
          escrowStatus: 'held',
          paymentId: paymentId,
          paymentProvider: provider,
          paymentCurrency: currency,
          paymentCountry: country,
          status: 'confirmed'
        })
        .where(eq(referralBookings.id, bookingId));

      console.log(`✅ Payment processed successfully for booking ${bookingId} via ${provider}`);
    } catch (error) {
      console.error('Error processing payment success:', error);
      throw error;
    }
  }

  /**
   * Get booking with referrer details
   */
  async getBookingDetails(bookingId: number) {
    try {
      const [booking] = await db
        .select({
          booking: referralBookings,
          referrer: referrers
        })
        .from(referralBookings)
        .leftJoin(referrers, eq(referralBookings.referrerId, referrers.id))
        .where(eq(referralBookings.id, bookingId))
        .limit(1);

      return booking;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  }

  /**
   * Create payment order (PayPal or Razorpay based on country)
   */
  async createPaymentOrder(
    bookingId: number,
    baseAmount: number,
    userIp: string
  ): Promise<{
    provider: 'paypal' | 'razorpay';
    orderId: string;
    amount: number;
    currency: 'USD' | 'INR';
    discount: number;
    country: string;
    razorpayKeyId?: string;
  }> {
    const country = await this.detectUserCountry(userIp);
    const pricing = this.calculatePricing(baseAmount, country);

    if (country === 'IN' && this.razorpay) {
      // Use Razorpay for Indian users
      const order = await this.createRazorpayOrder(bookingId, pricing.amount);

      return {
        provider: 'razorpay',
        orderId: order.id,
        amount: pricing.amount,
        currency: 'INR',
        discount: pricing.discount,
        country: country,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      };
    } else {
      // Use PayPal for international users
      return {
        provider: 'paypal',
        orderId: '', // Will be created by PayPal flow
        amount: pricing.amount,
        currency: 'USD',
        discount: pricing.discount,
        country: country
      };
    }
  }
}

export const referralMarketplacePaymentService = new ReferralMarketplacePaymentService();