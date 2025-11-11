import { Router } from 'express';
import { paymentVerificationService } from './paymentVerificationService';

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  const userId = req.user?.id || req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

const router = Router();

// Verify PayPal hosted button payment
router.post('/verify-paypal', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { orderId, serviceType, serviceId, amount } = req.body;

    if (!serviceType || !amount || !orderId) {
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Validate service type
    const validServices = ['mock_interview', 'virtual_interview', 'ranking_test', 'test_retake', 'referral_marketplace'];
    if (!validServices.includes(serviceType)) {
      return res.status(400).json({ message: 'Invalid service type' });
    }

    // CRITICAL: Require serviceId for test retakes
    if (serviceType === 'test_retake' && !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Test assignment ID required for retake payment'
      });
    }

    console.log(`🔍 [PAYMENT] Verifying PayPal order ${orderId} for ${serviceType}, user ${userId}`);

    // CRITICAL: Verify payment with PayPal API
    const { paymentService } = await import('./paymentService.js');
    const isValidPayment = await paymentService.verifyPayPalOrder(orderId);

    if (!isValidPayment) {
      console.error(`❌ [PAYMENT] Invalid PayPal order ${orderId}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - invalid PayPal order'
      });
    }

    console.log(`✅ [PAYMENT] PayPal order verified: ${orderId}`);

    // Check if payment already processed
    const { db } = await import('./db.js');
    const { oneTimePayments, sql } = await import('../shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const existingPayment = await db.select()
      .from(oneTimePayments)
      .where(eq(oneTimePayments.paymentId, orderId))
      .limit(1);

    let recordedPayment;

    if (existingPayment.length > 0) {
      console.log(`⚠️ [PAYMENT] Payment already recorded for order ${orderId}`);
      recordedPayment = existingPayment[0];
    } else {
      // Record the payment
      const [newPayment] = await db.insert(oneTimePayments).values({
        userId,
        serviceType,
        serviceId: serviceId || null,
        amount: amount.toString(),
        currency: 'USD',
        paymentProvider: 'paypal',
        paymentId: orderId,
        status: 'completed',
        description: `${serviceType.replace('_', ' ')} - $${amount}`,
        completedAt: new Date(),
        transactionData: {
          paypalOrderId: orderId,
          timestamp: new Date().toISOString(),
          method: 'paypal_hosted_button'
        }
      }).returning();

      recordedPayment = newPayment;
      console.log(`💾 [PAYMENT] Payment recorded: ${recordedPayment.id}`);
    }

    // CRITICAL: Grant service access
    const accessGranted = await paymentVerificationService.grantServiceAccess(userId, serviceType, serviceId);

    if (!accessGranted) {
      console.error(`❌ Failed to grant ${serviceType} access for user ${userId}, serviceId: ${serviceId}`);

      // Mark payment as failed
      await db.update(oneTimePayments)
        .set({
          status: 'failed',
          transactionData: sql`
            CASE
              WHEN transaction_data IS NULL THEN
                jsonb_build_object('error', 'Failed to grant service access', 'timestamp', NOW())
              ELSE
                transaction_data || jsonb_build_object('error', 'Failed to grant service access', 'timestamp', NOW())
            END
          `
        })
        .where(eq(oneTimePayments.id, recordedPayment.id));

      return res.status(422).json({
        success: false,
        message: 'Payment received but failed to enable service access. Please contact support with order ID: ' + orderId,
        paymentRecorded: true,
        accessGranted: false,
        orderId: orderId,
        error: 'SERVICE_ACCESS_FAILED'
      });
    }

    console.log(`✅ Successfully granted ${serviceType} access for user ${userId}`);

    res.json({
      success: true,
      message: `Payment verified and ${serviceType} access granted`,
      serviceType,
      amount,
      accessGranted: true
    });
  } catch (error) {
    console.error('PayPal verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Check if user has valid payment for service
router.get('/check-access/:serviceType', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { serviceType } = req.params;
    const { withinMinutes = 30 } = req.query;

    const hasAccess = await paymentVerificationService.hasValidPayment(
      userId,
      serviceType,
      parseInt(withinMinutes.toString())
    );

    res.json({
      hasAccess,
      serviceType,
      userId
    });
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      hasAccess: false,
      message: 'Failed to check access'
    });
  }
});

// Get payment history
router.get('/history', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { serviceType } = req.query;

    const payments = await paymentVerificationService.getPaymentHistory(
      userId,
      serviceType?.toString()
    );

    res.json({
      payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      payments: [],
      message: 'Failed to fetch payment history'
    });
  }
});

// PayPal webhook handler (for production)
router.post('/webhook/paypal', async (req, res) => {
  try {
    const webhookData = req.body;

    // In production, verify webhook signature here
    console.log('PayPal webhook received:', webhookData.event_type);

    const success = await paymentVerificationService.handlePayPalWebhook(webhookData);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ success: false });
  }
});

export { router as paymentRoutes };