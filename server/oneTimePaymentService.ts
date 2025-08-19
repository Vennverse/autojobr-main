import { db } from './db';
import { oneTimePayments } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface OneTimePaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  serviceType: 'mock_interview' | 'virtual_interview' | 'ranking_test' | 'test_retake' | 'premium_targeting';
  serviceId?: string;
  description: string;
}

export interface PaymentResult {
  paymentId: string;
  approvalUrl?: string;
  clientSecret?: string;
  orderId?: string;
}

export class OneTimePaymentService {
  // PayPal one-time payment
  async createPayPalOrder(request: OneTimePaymentRequest): Promise<PaymentResult> {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create PayPal order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: request.currency,
            value: request.amount.toFixed(2)
          },
          description: request.description,
          custom_id: `${request.serviceType}_${request.serviceId || Date.now()}_${request.userId}`
        }],
        application_context: {
          return_url: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success`,
          cancel_url: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/cancelled`,
          user_action: 'PAY_NOW'
        }
      })
    });

    const orderData = await orderResponse.json();
    
    if (orderData.id) {
      // Store payment record
      await db.insert(oneTimePayments).values({
        userId: request.userId,
        serviceType: request.serviceType,
        serviceId: request.serviceId,
        amount: request.amount.toString(),
        currency: request.currency,
        paymentProvider: 'paypal',
        paymentId: orderData.id,
        status: 'pending',
        description: request.description
      });

      const approvalUrl = orderData.links.find((link: any) => link.rel === 'approve')?.href;
      return { 
        paymentId: orderData.id, 
        approvalUrl,
        orderId: orderData.id
      };
    } else {
      throw new Error('Failed to create PayPal order');
    }
  }

  // Amazon Pay one-time payment (mock implementation)
  async createAmazonPayOrder(request: OneTimePaymentRequest): Promise<PaymentResult> {
    // Mock Amazon Pay implementation
    const orderId = `amazon_pay_order_${Date.now()}`;
    
    // Store payment record
    await db.insert(oneTimePayments).values({
      userId: request.userId,
      serviceType: request.serviceType,
      serviceId: request.serviceId,
      amount: request.amount.toString(),
      currency: request.currency,
      paymentProvider: 'amazon_pay',
      paymentId: orderId,
      status: 'pending',
      description: request.description
    });

    return {
      paymentId: orderId,
      orderId
    };
  }

  // Verify and capture PayPal payment
  async capturePayPalPayment(orderId: string): Promise<boolean> {
    try {
      // Get PayPal access token
      const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Capture PayPal order
      const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const captureData = await captureResponse.json();
      
      if (captureData.status === 'COMPLETED') {
        // Update payment status
        await db.update(oneTimePayments)
          .set({ 
            status: 'completed',
            completedAt: new Date()
          })
          .where(eq(oneTimePayments.paymentId, orderId));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PayPal capture error:', error);
      return false;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<any> {
    const payment = await db.query.oneTimePayments.findFirst({
      where: eq(oneTimePayments.paymentId, paymentId)
    });
    
    return payment;
  }

  // Process successful payment
  async processSuccessfulPayment(paymentId: string, transactionData?: any): Promise<void> {
    await db.update(oneTimePayments)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        transactionData: transactionData ? JSON.stringify(transactionData) : null
      })
      .where(eq(oneTimePayments.paymentId, paymentId));
  }
}

export const oneTimePaymentService = new OneTimePaymentService();