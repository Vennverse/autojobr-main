import { db } from './db';
import { oneTimePayments } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface PaymentVerificationRequest {
  userId: string;
  serviceType: 'mock_interview' | 'virtual_interview' | 'ranking_test' | 'test_retake';
  amount: number;
  transactionId?: string;
  paypalOrderId?: string;
}

export class PaymentVerificationService {
  
  /**
   * Record a successful payment from PayPal hosted button
   * This is called after the client receives success callback
   */
  async recordPayPalPayment(request: PaymentVerificationRequest): Promise<boolean> {
    try {
      // Generate a unique payment ID if not provided
      const paymentId = request.paypalOrderId || `paypal_hosted_${Date.now()}_${request.userId}`;
      
      // Record the payment in our database
      await db.insert(oneTimePayments).values({
        userId: request.userId,
        serviceType: request.serviceType,
        serviceId: null, // For one-time payments
        amount: request.amount.toString(),
        currency: 'USD',
        paymentProvider: 'paypal',
        paymentId: paymentId,
        status: 'completed', // PayPal hosted button only fires success callback after payment is complete
        description: this.getServiceDescription(request.serviceType),
        transactionData: {
          paypalOrderId: request.paypalOrderId,
          transactionId: request.transactionId,
          timestamp: new Date().toISOString(),
          method: 'paypal_hosted_button'
        }
      });

      console.log(`✅ Payment recorded: ${request.serviceType} for user ${request.userId}, amount: $${request.amount}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to record PayPal payment:', error);
      return false;
    }
  }

  /**
   * Check if user has made payment for a specific service
   * This can be used to verify access before granting service
   */
  async hasValidPayment(userId: string, serviceType: string, withinMinutes: number = 30): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - (withinMinutes * 60 * 1000));
      
      const recentPayment = await db.query.oneTimePayments.findFirst({
        where: and(
          eq(oneTimePayments.userId, userId),
          eq(oneTimePayments.serviceType, serviceType as any),
          eq(oneTimePayments.status, 'completed')
        ),
        orderBy: (payments, { desc }) => [desc(payments.createdAt)]
      });

      if (recentPayment && recentPayment.createdAt && new Date(recentPayment.createdAt) > cutoffTime) {
        console.log(`✅ Valid payment found for user ${userId}, service: ${serviceType}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Grant access based on payment verification
   * Updates user's service access (like interview eligibility)
   */
  async grantServiceAccess(userId: string, serviceType: string): Promise<boolean> {
    try {
      switch (serviceType) {
        case 'virtual_interview':
        case 'test_retake':
          // For interview retakes, we'll handle this in the interview service
          // The payment verification is sufficient - no need to update separate counters
          return true;
        
        case 'mock_interview':
          // Similar logic for mock interviews
          return true;
        
        case 'ranking_test':
          // For ranking tests, grant immediate access
          return true;
        
        default:
          console.warn(`Unknown service type: ${serviceType}`);
          return false;
      }
    } catch (error) {
      console.error('❌ Error granting service access:', error);
      return false;
    }
  }

  /**
   * Get user's payment history for a service type
   */
  async getPaymentHistory(userId: string, serviceType?: string) {
    try {
      const whereClause = serviceType 
        ? and(eq(oneTimePayments.userId, userId), eq(oneTimePayments.serviceType, serviceType as any))
        : eq(oneTimePayments.userId, userId);

      return await db.query.oneTimePayments.findMany({
        where: whereClause,
        orderBy: (payments, { desc }) => [desc(payments.createdAt)]
      });
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      return [];
    }
  }

  private getServiceDescription(serviceType: string): string {
    switch (serviceType) {
      case 'mock_interview': return 'Mock Interview Session - $10';
      case 'virtual_interview': return 'Virtual Interview Access - $5';
      case 'ranking_test': return 'Ranking Test Access';
      case 'test_retake': return 'Test Retake - $5';
      default: return `${serviceType} Payment`;
    }
  }

  /**
   * PayPal webhook handler (for production use)
   * This would be called by PayPal when hosted button payments complete
   */
  async handlePayPalWebhook(webhookData: any): Promise<boolean> {
    try {
      // In production, you'd verify the webhook signature first
      console.log('📨 PayPal webhook received:', webhookData.event_type);

      if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const capture = webhookData.resource;
        
        // Extract user info from custom_id or other fields
        const customId = capture.custom_id; // Format: serviceType_serviceId_userId
        if (customId) {
          const [serviceType, , userId] = customId.split('_');
          
          await this.recordPayPalPayment({
            userId,
            serviceType: serviceType as any,
            amount: parseFloat(capture.amount.value),
            paypalOrderId: capture.id,
            transactionId: capture.id
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error handling PayPal webhook:', error);
      return false;
    }
  }
}

export const paymentVerificationService = new PaymentVerificationService();