import { Router, Request, Response } from "express";
import { referralMarketplaceService } from "./referralMarketplaceService.js";
import { createPaypalOrder, capturePaypalOrder } from "./paypal.js";
import { referralMarketplacePaymentService } from "./referralMarketplacePaymentService.js";
import { z } from "zod";
import { db } from "./db.js";
import { referralBookings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Extend Express Request interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    }
    interface Request {
      user?: User;
    }
  }
}

const router = Router();

// Validation schemas
const createReferrerSchema = z.object({
  companyEmail: z.string().email(),
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  department: z.string().optional(),
  linkedinProfile: z.string().url().optional(),
  isAnonymous: z.boolean(),
  displayName: z.string().optional(),
  yearsAtCompany: z.number().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  availableRoles: z.array(z.string()).optional(),
});

const createServiceSchema = z.object({
  serviceType: z.enum(['intro_meeting', 'interview_prep', 'ongoing_mentorship']),
  title: z.string().min(1),
  description: z.string().min(10),
  basePrice: z.number().min(1),
  referralBonusPrice: z.number().optional(),
  sessionDuration: z.number().optional(),
  sessionsIncluded: z.number().optional(),
  includesReferral: z.boolean(),
  features: z.array(z.string()),
  deliverables: z.array(z.string()),
  requirements: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
});

const bookServiceSchema = z.object({
  notes: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const submitFeedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  helpfulnessRating: z.number().min(1).max(5),
  professionalismRating: z.number().min(1).max(5),
  valueRating: z.number().min(1).max(5),
  reviewTitle: z.string().optional(),
  reviewText: z.string().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  referralLikelihood: z.enum(['very_likely', 'likely', 'unlikely', 'very_unlikely']),
  wouldBookAgain: z.boolean(),
  recommendToOthers: z.boolean(),
  displayName: z.string().optional(),
});

/**
 * GET /api/referral-marketplace/services
 * Get all available service listings (PUBLIC ENDPOINT)
 */
router.get("/services", async (req: Request, res: Response) => {
  try {
    const filters = {
      serviceType: req.query.serviceType as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      companyName: req.query.companyName as string,
      includesReferral: req.query.includesReferral === 'true' ? true :
                       req.query.includesReferral === 'false' ? false : undefined,
    };

    const services = await referralMarketplaceService.getServiceListings(filters);
    res.json({ success: true, services });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get services'
    });
  }
});

/**
 * POST /api/referral-marketplace/referrer
 * Create referrer profile
 */
router.post("/referrer", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = createReferrerSchema.parse(req.body);
    const result = await referralMarketplaceService.createReferrerProfile(
      req.user.id,
      validatedData
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating referrer profile:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create referrer profile'
    });
  }
});

/**
 * GET /api/referral-marketplace/verify-email
 * Verify referrer email with token
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid verification token' });
    }

    const result = await referralMarketplaceService.verifyReferrerEmail(token);
    res.json(result);
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Email verification failed'
    });
  }
});

/**
 * POST /api/referral-marketplace/service
 * Create service listing
 */
router.post("/service", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get user's referrer profile
    const referrerProfile = await referralMarketplaceService.getReferrerProfile(req.user.id);
    if (!referrerProfile || !referrerProfile.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'You must be a verified referrer to create services'
      });
    }

    const validatedData = createServiceSchema.parse(req.body);
    const result = await referralMarketplaceService.createServiceListing(
      referrerProfile.id,
      validatedData
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create service'
    });
  }
});

/**
 * POST /api/referral-marketplace/book/:serviceId
 * Book a service
 */
router.post("/book/:serviceId", async (req: any, res: Response) => {
  try {
    // Check both req.user and req.session.user for authentication
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      console.log('❌ [BOOKING] Authentication failed - no user found');
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Use the userId we found
    req.user = req.user || { id: userId };

    const serviceId = parseInt(req.params.serviceId);
    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, error: 'Invalid service ID' });
    }

    const validatedData = bookServiceSchema.parse(req.body);
    const bookingData = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
    };

    const result = await referralMarketplaceService.bookService(
        serviceId,
        req.user.id,
        bookingData,
        false // Don't send emails yet - wait for payment
      );

      res.json(result);
    } catch (error) {
    console.error('Error booking service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to book service'
    });
  }
});

/**
 * POST /api/referral-marketplace/payment/initialize
 * Initialize payment - automatically selects PayPal or Razorpay based on user location
 */
router.post("/payment/initialize", async (req: Request, res: Response) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, error: 'Booking ID and amount required' });
    }

    const bookingIdNum = parseInt(bookingId);
    if (isNaN(bookingIdNum) || bookingIdNum <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    // Get user's IP address
    const userIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = Array.isArray(userIp) ? userIp[0] : userIp.split(',')[0];

    // Create payment order with automatic provider selection
    const paymentOrder = await referralMarketplacePaymentService.createPaymentOrder(
      bookingIdNum,
      parseFloat(amount),
      clientIp
    );

    return res.json({
      success: true,
      ...paymentOrder,
      escrowProtected: true,
      escrowMessage: 'Payment will be held securely until service delivery is confirmed'
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize payment'
    });
  }
});

/**
 * POST /api/referral-marketplace/payment/razorpay/verify
 * Verify Razorpay payment and update booking
 */
router.post("/payment/razorpay/verify", async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields'
      });
    }

    // Verify payment signature
    const isValid = referralMarketplacePaymentService.verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    const bookingIdNum = parseInt(bookingId);

    // Get booking details
    const bookingDetails = await referralMarketplacePaymentService.getBookingDetails(bookingIdNum);
    
    if (!bookingDetails) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Process payment success
    await referralMarketplacePaymentService.processPaymentSuccess(
      bookingIdNum,
      razorpay_payment_id,
      'razorpay',
      'INR',
      'IN'
    );

    // Send confirmation email with booking link
    if (bookingDetails.referrer?.meetingScheduleLink) {
      await referralMarketplaceService.sendBookingConfirmationEmail(
        bookingIdNum,
        bookingDetails.booking.jobSeekerId,
        bookingDetails.referrer.id,
        bookingDetails.referrer.meetingScheduleLink
      );
    }

    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      bookingId: bookingIdNum,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment'
    });
  }
});

/**
 * POST /api/referral-marketplace/payment/create-order
 * Create PayPal order with ESCROW protection - funds held until service delivery
 */
router.post("/payment/create-order", async (req: Request, res: Response) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, error: 'Booking ID and amount required' });
    }

    // Validate booking ID is a positive integer
    const bookingIdNum = parseInt(bookingId);
    if (isNaN(bookingIdNum) || bookingIdNum <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    // Create PayPal order with ESCROW intent
    const mockReq = {
      body: {
        amount: parseFloat(amount).toFixed(2),
        currency: 'USD',
        intent: 'AUTHORIZE' // ESCROW: Authorize payment but don't capture until service confirmed
      }
    } as Request;

    // Create a mock response to capture PayPal response
    let paypalResponse: any = null;
    const mockRes = {
      json: (data: any) => {
        paypalResponse = data;
      },
      status: () => mockRes
    } as any;

    try {
      await createPaypalOrder(mockReq, mockRes);

      if (paypalResponse && paypalResponse.id) {
        // Update booking with escrow status
        await db.update(referralBookings)
          .set({
            escrowStatus: 'authorized',
            paymentStatus: 'authorized'
          })
          .where(eq(referralBookings.id, bookingIdNum));

        const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paypalResponse.id}`;

        return res.json({
          success: true,
          id: paypalResponse.id,
          approvalUrl,
          escrowProtected: true,
          escrowMessage: 'Payment will be held securely until service delivery is confirmed by both parties',
          links: [
            {
              href: approvalUrl,
              rel: 'approve',
              method: 'REDIRECT'
            }
          ]
        });
      } else {
        throw new Error('PayPal order creation failed');
      }
    } catch (paypalError) {
      console.error('PayPal order creation error:', paypalError);
      throw new Error('PayPal service unavailable');
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment order'
    });
  }
});

/**
 * POST /api/referral-marketplace/payment/capture/:orderId
 * Capture PayPal payment
 */
router.post("/payment/capture/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Create mock request with correct parameter structure
    const mockReq = {
      params: { orderID: orderId },
      body: req.body
    } as Request;

    // Create mock response to capture PayPal response
    let captureResponse: any = null;
    const mockRes = {
      json: (data: any) => {
        captureResponse = data;
      },
      status: () => mockRes
    } as any;

    try {


/**
 * POST /api/referral-marketplace/escrow/confirm-delivery/:bookingId
 * Job seeker confirms service delivery - releases escrow payment to referrer
 */
router.post("/escrow/confirm-delivery/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    // Get booking details
    const booking = await db.select()
      .from(referralBookings)
      .where(
        and(
          eq(referralBookings.id, bookingId),
          eq(referralBookings.jobSeekerId, req.user.id)
        )
      )
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Verify escrow status
    if (bookingData.escrowStatus !== 'held') {
      return res.status(400).json({
        success: false,
        error: 'Escrow payment not in held status'
      });
    }

    // Capture PayPal payment (release escrow to referrer)
    const captureReq = {
      params: { orderID: bookingData.paymentId },
      body: {}
    } as any;

    let captureResponse: any = null;
    const captureRes = {
      json: (data: any) => { captureResponse = data; },
      status: () => captureRes
    } as any;

    await capturePaypalOrder(captureReq, captureRes);

    // Update booking and payment status
    await db.update(referralBookings)
      .set({
        status: 'completed',
        escrowStatus: 'released',
        paymentStatus: 'completed',
        completedAt: new Date()
      })
      .where(eq(referralBookings.id, bookingId));

    // Update referrer stats
    await db.update(referrers)
      .set({
        completedServices: sql`${referrers.completedServices} + 1`
      })
      .where(eq(referrers.id, bookingData.referrerId));

    res.json({
      success: true,
      message: 'Payment released to referrer successfully',
      booking: { ...bookingData, status: 'completed', escrowStatus: 'released' }
    });
  } catch (error) {
    console.error('Error releasing escrow payment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release payment'
    });
  }
});

/**
 * POST /api/referral-marketplace/escrow/open-dispute/:bookingId
 * Open dispute for escrow payment - requires manual resolution
 */
router.post("/escrow/open-dispute/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    const { reason, description } = req.body;

    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        error: 'Dispute reason and description required'
      });
    }

    // Get booking
    const booking = await db.select()
      .from(referralBookings)
      .where(eq(referralBookings.id, bookingId))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Update escrow status to disputed
    await db.update(referralBookings)
      .set({
        escrowStatus: 'disputed',
        disputeReason: reason,
        disputeDetails: description,
        disputedAt: new Date(),
        disputedBy: req.user.id
      })
      .where(eq(referralBookings.id, bookingId));

    // Send notifications to both parties and admin
    // TODO: Implement email notifications

    res.json({
      success: true,
      message: 'Dispute opened successfully. Our team will review within 24-48 hours.',
      disputeId: bookingId
    });
  } catch (error) {
    console.error('Error opening dispute:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open dispute'
    });
  }
});

/**
 * GET /api/referral-marketplace/escrow/status/:bookingId
 * Get escrow payment status for a booking
 */
router.get("/escrow/status/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const booking = await db.select()
      .from(referralBookings)
      .where(eq(referralBookings.id, bookingId))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const bookingData = booking[0];

    res.json({
      success: true,
      escrowStatus: bookingData.escrowStatus,
      paymentStatus: bookingData.paymentStatus,
      canConfirmDelivery: bookingData.escrowStatus === 'held',
      canOpenDispute: bookingData.escrowStatus === 'held',
      message: getEscrowStatusMessage(bookingData.escrowStatus)
    });
  } catch (error) {
    console.error('Error getting escrow status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get escrow status'
    });
  }
});

function getEscrowStatusMessage(status: string): string {
  switch (status) {
    case 'authorized': return 'Payment authorized - waiting for service delivery';
    case 'held': return 'Payment held in escrow - confirm delivery to release funds';
    case 'released': return 'Payment released to referrer';
    case 'disputed': return 'Dispute opened - under review';
    case 'refunded': return 'Payment refunded to job seeker';
    default: return 'Unknown escrow status';
  }
}

      await capturePaypalOrder(mockReq, mockRes);

      if (captureResponse && captureResponse.status === 'COMPLETED') {
        // Update booking status to 'held' and trigger email to referrer
        await db.update(referralBookings)
          .set({
            escrowStatus: 'held',
            paymentStatus: 'completed'
          })
          .where(eq(referralBookings.paymentId, orderId));

        // Find the booking that was just paid for
        const updatedBooking = await db.select()
          .from(referralBookings)
          .where(eq(referralBookings.paymentId, orderId))
          .limit(1);

        if (updatedBooking && updatedBooking.length > 0) {
          // Now send the confirmation email
          await referralMarketplaceService.sendBookingConfirmationEmail(
            updatedBooking[0].id,
            'job_seeker' // Recipient role
          );
          await referralMarketplaceService.sendBookingConfirmationEmail(
            updatedBooking[0].id,
            'referrer' // Recipient role
          );
        }

        return res.json({
          success: true,
          captureData: captureResponse
        });
      } else {
        throw new Error('Payment capture failed');
      }
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError);
      throw new Error('PayPal capture service unavailable');
    }
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture payment'
    });
  }
});

/**
 * GET /api/referral-marketplace/referrer/:referrerId/feedback
 * Get feedback for a referrer
 */
router.get("/referrer/:referrerId/feedback", async (req: Request, res: Response) => {
  try {
    const referrerId = parseInt(req.params.referrerId);
    if (isNaN(referrerId)) {
      return res.status(400).json({ success: false, error: 'Invalid referrer ID' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const feedback = await referralMarketplaceService.getReferrerFeedback(
      referrerId,
      limit,
      offset
    );

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error getting referrer feedback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feedback'
    });
  }
});

/**
 * POST /api/referral-marketplace/feedback/:bookingId
 * Submit feedback for a booking
 */
router.post("/feedback/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const validatedData = submitFeedbackSchema.parse(req.body);
    const result = await referralMarketplaceService.submitFeedback(
      bookingId,
      req.user.id,
      validatedData
    );

    res.json(result);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    });
  }
});

/**
 * GET /api/referral-marketplace/my-profile
 * Get current user's referrer profile
 */
router.get("/my-profile", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const profile = await referralMarketplaceService.getReferrerProfile(req.user.id);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error getting referrer profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile'
    });
  }
});

/**
 * GET /api/referral-marketplace/my-services
 * Get current user's service listings
 */
router.get("/my-services", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const services = await referralMarketplaceService.getUserServiceListings(req.user.id);
    res.json({ success: true, services });
  } catch (error) {
    console.error('Error getting user services:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get services'
    });
  }
});

/**
 * GET /api/referral-marketplace/my-bookings
 * Get current user's bookings (as job seeker or referrer)
 */
router.get("/my-bookings", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const role = req.query.role as 'job_seeker' | 'referrer' || 'job_seeker';
    const bookings = await referralMarketplaceService.getUserBookings(req.user.id, role);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bookings'
    });
  }
});

/**
 * GET /api/referral-marketplace/bookings/referrer
 * Get referrer's bookings with full details
 */
router.get("/bookings/referrer", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookings = await referralMarketplaceService.getReferrerBookings(req.user.id);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error getting referrer bookings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bookings'
    });
  }
});

/**
 * GET /api/referral-marketplace/profile
 * Get referrer profile with settings
 */
router.get("/profile", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const profile = await referralMarketplaceService.getReferrerProfile(req.user.id);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error getting referrer profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/referral-marketplace/profile/settings
 * Update referrer settings (meeting link and email template)
 */
router.put("/profile/settings", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { meetingScheduleLink, emailTemplate } = req.body;
    const result = await referralMarketplaceService.updateReferrerSettings(
      req.user.id,
      { meetingScheduleLink, emailTemplate }
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating referrer settings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings'
    });
  }
});

/**
 * POST /api/referral-marketplace/send-schedule-email
 * Send meeting schedule email to job seeker
 */
router.post("/send-schedule-email", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { bookingId, meetingLink, customMessage } = req.body;

    if (!bookingId || !meetingLink) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and meeting link are required'
      });
    }

    const result = await referralMarketplaceService.sendScheduleEmail(
      req.user.id,
      bookingId,
      meetingLink,
      customMessage
    );

    res.json(result);
  } catch (error) {
    console.error('Error sending schedule email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send schedule email'
    });
  }
});

/**
 * POST /api/referral-marketplace/confirm-delivery/:bookingId
 * Confirm service delivery (can be called by either party)
 */
router.post("/confirm-delivery/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const result = await referralMarketplaceService.confirmDelivery(
      bookingId,
      req.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('Error confirming delivery:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm delivery'
    });
  }
});

/**
 * POST /api/referral-marketplace/confirm-meeting/:bookingId
 * Confirm meeting attendance (can be called by either party)
 */
router.post("/confirm-meeting/:bookingId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const result = await referralMarketplaceService.confirmMeeting(
      bookingId,
      req.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('Error confirming meeting:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm meeting'
    });
  }
});

/**
 * POST /api/referral-marketplace/verify-company-email
 * Verify company email domain to confirm employment
 */
router.post("/verify-company-email", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await referralMarketplaceService.verifyCompanyEmail(
      req.user.id,
      email
    );

    res.json(result);
  } catch (error) {
    console.error('Error verifying company email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify email'
    });
  }
});

export default router;