import { db } from './db';
import { oneTimePayments } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface PaymentVerificationRequest {
  userId: string;
  serviceType: 'mock_interview' | 'virtual_interview' | 'ranking_test' | 'test_retake';
  amount: number;
  transactionId?: string;
  paypalOrderId?: string;
  serviceId?: string; // CRITICAL: For test_retake, this is the assignment ID
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
        serviceId: request.serviceId || null, // CRITICAL: Store assignment ID for test retakes
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
  async grantServiceAccess(userId: string, serviceType: string, serviceId?: string): Promise<boolean> {
    try {
      switch (serviceType) {
        case 'test_retake':
          // CRITICAL FIX: Enable test retake for the specific assignment
          if (!serviceId) {
            console.error('❌ Test retake payment missing assignment ID');
            return false;
          }

          const { testAssignments } = await import('../shared/schema.js');
          const { eq, and } = await import('drizzle-orm');

          // CRITICAL: First verify the assignment exists and belongs to this user
          const assignment = await db.select()
            .from(testAssignments)
            .where(
              and(
                eq(testAssignments.id, parseInt(serviceId)),
                eq(testAssignments.jobSeekerId, userId)
              )
            )
            .then(rows => rows[0]);

          if (!assignment) {
            console.error(`❌ Test assignment ${serviceId} not found or doesn't belong to user ${userId}`);
            return false;
          }

          // CRITICAL: Update the test assignment to allow retake
          // Keep status as 'completed' but set retakeAllowed=true so frontend knows retake is paid
          // DO NOT change status to 'assigned' - that would break the UI flow
          const result = await db.update(testAssignments)
            .set({ 
              retakeAllowed: true,
              // Keep status as 'completed' - frontend checks retakeAllowed to enable retake
              // Keep score - user should see their previous score before retaking
              answers: [], // Clear previous answers
              questions: [], // CRITICAL FIX: Clear previous questions to generate new ones
              completionTime: null,
              warningCount: 0,
              tabSwitchCount: 0,
              copyAttempts: 0,
              terminationReason: null
            })
            .where(
              and(
                eq(testAssignments.id, parseInt(serviceId)),
                eq(testAssignments.jobSeekerId, userId)
              )
            )
            .returning();

          if (!result || result.length === 0) {
            console.error(`❌ Failed to update test assignment ${serviceId} for user ${userId}`);
            return false;
          }

          console.log(`✅ Test retake enabled and reset for assignment ${serviceId}, user ${userId}`);
          return true;

        case 'virtual_interview':
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

  async verifyTestRetakePayment(orderId: string, serviceId: string, userId: string): Promise<{ success: boolean; accessGranted: boolean; message?: string }> {
    try {
      console.log(`🔍 [RETAKE PAYMENT] Verifying PayPal order ${orderId} for test ${serviceId}, user ${userId}`);

      // Verify PayPal payment
      const isValid = await paymentService.verifyPayPalOrder(orderId);

      if (!isValid) {
        console.log(`❌ [RETAKE PAYMENT] Invalid PayPal order ${orderId}`);
        return { success: false, accessGranted: false, message: 'Payment verification failed' };
      }

      console.log(`✅ [RETAKE PAYMENT] Valid PayPal payment for order ${orderId}`);

      // Check if payment already processed
      const existingPayment = await db.select()
        .from(oneTimePayments)
        .where(eq(oneTimePayments.paymentId, orderId))
        .limit(1);

      if (existingPayment.length > 0) {
        console.log(`⚠️ [RETAKE PAYMENT] Payment already processed for order ${orderId}`);
        // Still grant access if not already granted
        const assignmentId = parseInt(serviceId);
        const assignment = await db.select()
          .from(testAssignments)
          .where(eq(testAssignments.id, assignmentId))
          .limit(1);

        if (assignment[0]?.retakeAllowed) {
          return { success: true, accessGranted: true, message: 'Access already granted' };
        }
      } else {
        // Record payment in one_time_payments
        await db.insert(oneTimePayments).values({
          userId: userId,
          serviceType: 'test_retake',
          serviceId: serviceId,
          amount: '5.00',
          currency: 'USD',
          paymentProvider: 'paypal',
          paymentId: orderId,
          status: 'completed',
          description: `Test retake payment for assignment ${serviceId}`,
          completedAt: new Date()
        });

        console.log(`💾 [RETAKE PAYMENT] Payment recorded for test ${serviceId}`);
      }

      // CRITICAL: Grant retake access by updating test assignment
      const assignmentId = parseInt(serviceId);
      const [updatedAssignment] = await db
        .update(testAssignments)
        .set({
          retakeAllowed: true,
          // Keep status as 'completed' - frontend checks retakeAllowed to enable retake
          // Keep score - user should see their previous score before retaking
          retakePaymentId: orderId,
          answers: [], // Clear previous answers
          questions: [], // CRITICAL FIX: Clear previous questions to generate new ones
          completionTime: null,
          warningCount: 0,
          tabSwitchCount: 0,
          copyAttempts: 0,
          terminationReason: null,
          updatedAt: new Date()
        })
        .where(eq(testAssignments.id, assignmentId))
        .returning();

      if (updatedAssignment) {
        console.log(`✅ [RETAKE PAYMENT] Retake access SUCCESSFULLY granted for assignment ${assignmentId}`);
        console.log(`   - retakeAllowed: ${updatedAssignment.retakeAllowed}`);
        console.log(`   - status: ${updatedAssignment.status}`);
        console.log(`   - retakePaymentId: ${updatedAssignment.retakePaymentId}`);
        return { success: true, accessGranted: true, message: 'Retake access granted successfully' };
      } else {
        console.log(`❌ [RETAKE PAYMENT] Failed to update assignment ${assignmentId}`);
        return { success: true, accessGranted: false, message: 'Payment processed but access grant failed' };
      }

    } catch (error) {
      console.error('❌ [RETAKE PAYMENT] Verification error:', error);
      return { success: false, accessGranted: false, message: error.message };
    }
  }
}

export const paymentVerificationService = new PaymentVerificationService();