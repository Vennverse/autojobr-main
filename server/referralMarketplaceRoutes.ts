import { Router, Request, Response } from "express";
import { referralMarketplaceService } from "./referralMarketplaceService.js";
import { createPaypalOrder, capturePaypalOrder } from "./paypal.js";
import { z } from "zod";

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
router.post("/book/:serviceId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

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
      bookingData
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
 * POST /api/referral-marketplace/payment/create-order
 * Create PayPal order for referral service payment
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

    // Create PayPal order directly without recursive response override
    const mockReq = {
      body: {
        amount: parseFloat(amount).toFixed(2),
        currency: 'USD',
        intent: 'CAPTURE'
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
        // Add approval URL to response
        const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paypalResponse.id}`;
        
        return res.json({
          success: true,
          id: paypalResponse.id,
          approvalUrl,
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
      await capturePaypalOrder(mockReq, mockRes);
      
      if (captureResponse && captureResponse.status === 'COMPLETED') {
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

export default router;