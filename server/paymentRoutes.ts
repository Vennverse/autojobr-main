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

    const { serviceType, serviceId, amount, paymentData, itemName } = req.body;

    if (!serviceType || !amount) {
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Validate service type
    const validServices = ['mock_interview', 'virtual_interview', 'ranking_test', 'test_retake'];
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

    // Record the payment with serviceId
    const paymentRecorded = await paymentVerificationService.recordPayPalPayment({
      userId,
      serviceType,
      amount: parseFloat(amount.toString()),
      paypalOrderId: paymentData?.orderID || paymentData?.id,
      transactionId: paymentData?.transactionID || paymentData?.id,
      serviceId
    });

    if (!paymentRecorded) {
      return res.status(500).json({
        success: false,
        message: 'Failed to record payment'
      });
    }

    // CRITICAL: Grant service access and check if it succeeded
    const accessGranted = await paymentVerificationService.grantServiceAccess(userId, serviceType, serviceId);

    if (!accessGranted) {
      return res.status(422).json({
        success: false,
        message: 'Payment recorded but failed to enable service access. Please contact support.',
        paymentRecorded: true,
        accessGranted: false
      });
    }

    res.json({
      success: true,
      message: `Payment verified for ${serviceType}`,
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