import { Router, Request, Response } from "express";
import { referralMarketplaceService } from "./referralMarketplaceService.js";
import { createPaypalOrder, capturePaypalOrder } from "./paypal.js";
import { z } from "zod";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      };
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
 * Get all available service listings
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

    // Create PayPal order with escrow model
    const orderRequest = {
      body: {
        amount: amount.toString(),
        currency: 'USD',
        intent: 'CAPTURE'
      }
    };

    await createPaypalOrder(orderRequest as any, res);
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
});

/**
 * POST /api/referral-marketplace/payment/capture/:orderId
 * Capture PayPal payment
 */
router.post("/payment/capture/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    // Capture PayPal order
    const captureRequest = {
      params: { orderID: orderId }
    };

    await capturePaypalOrder(captureRequest as any, res);
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({ success: false, error: 'Failed to capture payment' });
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

export default router;