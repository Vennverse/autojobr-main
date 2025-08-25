import { db } from "./db";
import { 
  referrers, 
  referralServices, 
  referralBookings, 
  referralFeedback, 
  referralPayments,
  conversations,
  users,
  InsertReferrer,
  InsertReferralService,
  InsertReferralBooking,
  InsertReferralFeedback
} from "@shared/schema";
import { eq, and, or, desc, asc, avg, count, gte } from "drizzle-orm";
import { simpleChatService } from "./simpleChatService";
import { sendEmail } from "./emailService.js";
import crypto from "crypto";

/**
 * Referral Marketplace Service
 * Handles the complete Fiverr-like referral marketplace system
 */
export class ReferralMarketplaceService {

  /**
   * Create a referrer profile with email verification
   */
  async createReferrerProfile(userId: string, profileData: {
    companyEmail: string;
    companyName: string;
    jobTitle: string;
    department?: string;
    linkedinProfile?: string;
    isAnonymous: boolean;
    displayName?: string;
    yearsAtCompany?: number;
    bio?: string;
    specialties?: string[];
    availableRoles?: string[];
  }) {
    try {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create referrer profile
      const newReferrer = await db.insert(referrers)
        .values({
          userId,
          companyEmail: profileData.companyEmail,
          companyName: profileData.companyName,
          jobTitle: profileData.jobTitle,
          department: profileData.department,
          linkedinProfile: profileData.linkedinProfile,
          isAnonymous: profileData.isAnonymous,
          displayName: profileData.displayName || `${profileData.companyName} Employee`,
          yearsAtCompany: profileData.yearsAtCompany,
          bio: profileData.bio,
          specialties: profileData.specialties || [],
          availableRoles: profileData.availableRoles || [],
          verificationToken,
          verificationTokenExpiry,
          isEmailVerified: false,
          verificationLevel: 'basic'
        })
        .returning();

      // Send verification email
      await this.sendVerificationEmail(
        profileData.companyEmail, 
        verificationToken, 
        profileData.companyName
      );

      return {
        success: true,
        referrer: newReferrer[0],
        message: 'Referrer profile created. Please check your company email for verification link.'
      };
    } catch (error) {
      console.error('Error creating referrer profile:', error);
      throw new Error('Failed to create referrer profile');
    }
  }

  /**
   * Verify referrer email with token
   */
  async verifyReferrerEmail(token: string) {
    try {
      const referrer = await db.select()
        .from(referrers)
        .where(
          and(
            eq(referrers.verificationToken, token),
            gte(referrers.verificationTokenExpiry, new Date())
          )
        )
        .limit(1);

      if (referrer.length === 0) {
        throw new Error('Invalid or expired verification token');
      }

      // Update verification status
      await db.update(referrers)
        .set({
          isEmailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          verificationLevel: 'verified',
          acceptingBookings: true,
          updatedAt: new Date()
        })
        .where(eq(referrers.id, referrer[0].id));

      return {
        success: true,
        message: 'Email verified successfully! You can now create service listings.'
      };
    } catch (error) {
      console.error('Error verifying referrer email:', error);
      throw new Error('Email verification failed');
    }
  }

  /**
   * Create a referral service listing (bundle)
   */
  async createServiceListing(referrerId: number, serviceData: {
    serviceType: string;
    title: string;
    description: string;
    basePrice: number;
    referralBonusPrice?: number;
    sessionDuration?: number;
    sessionsIncluded?: number;
    includesReferral: boolean;
    features: string[];
    deliverables: string[];
    requirements?: string[];
    targetRoles?: string[];
  }) {
    try {
      const newService = await db.insert(referralServices)
        .values({
          referrerId,
          serviceType: serviceData.serviceType,
          title: serviceData.title,
          description: serviceData.description,
          basePrice: serviceData.basePrice.toString(),
          referralBonusPrice: (serviceData.referralBonusPrice || 0).toString(),
          sessionDuration: serviceData.sessionDuration,
          sessionsIncluded: serviceData.sessionsIncluded || 1,
          includesReferral: serviceData.includesReferral,
          features: serviceData.features,
          deliverables: serviceData.deliverables,
          requirements: serviceData.requirements || [],
          targetRoles: serviceData.targetRoles || [],
          isActive: true
        })
        .returning();

      return {
        success: true,
        service: newService[0],
        message: 'Service listing created successfully!'
      };
    } catch (error) {
      console.error('Error creating service listing:', error);
      throw new Error('Failed to create service listing');
    }
  }

  /**
   * Get all available service listings with referrer info (anonymous-safe)
   */
  async getServiceListings(filters?: {
    serviceType?: string;
    minPrice?: number;
    maxPrice?: number;
    companyName?: string;
    includesReferral?: boolean;
  }) {
    try {
      // Build filter conditions first
      let whereConditions = [
        eq(referralServices.isActive, true),
        eq(referrers.isEmailVerified, true),
        eq(referrers.acceptingBookings, true)
      ];
      let query = db.select({
        // Service info
        serviceId: referralServices.id,
        serviceType: referralServices.serviceType,
        title: referralServices.title,
        description: referralServices.description,
        basePrice: referralServices.basePrice,
        referralBonusPrice: referralServices.referralBonusPrice,
        sessionDuration: referralServices.sessionDuration,
        sessionsIncluded: referralServices.sessionsIncluded,
        includesReferral: referralServices.includesReferral,
        features: referralServices.features,
        deliverables: referralServices.deliverables,
        requirements: referralServices.requirements,
        targetRoles: referralServices.targetRoles,
        availableSlots: referralServices.availableSlots,
        bookedSlots: referralServices.bookedSlots,
        createdAt: referralServices.createdAt,
        
        // Referrer info (anonymous-safe)
        referrerId: referrers.id,
        companyName: referrers.companyName,
        companyLogoUrl: referrers.companyLogoUrl,
        jobTitle: referrers.jobTitle,
        department: referrers.department,
        isAnonymous: referrers.isAnonymous,
        displayName: referrers.displayName,
        yearsAtCompany: referrers.yearsAtCompany,
        bio: referrers.bio,
        specialties: referrers.specialties,
        availableRoles: referrers.availableRoles,
        verificationLevel: referrers.verificationLevel,
        totalServices: referrers.totalServices,
        completedServices: referrers.completedServices,
        totalReferrals: referrers.totalReferrals,
        successfulReferrals: referrers.successfulReferrals,
        averageRating: referrers.averageRating,
        totalReviews: referrers.totalReviews,
      })
      .from(referralServices)
      .leftJoin(referrers, eq(referralServices.referrerId, referrers.id));

      // Apply filters
      if (filters?.serviceType) {
        whereConditions.push(eq(referralServices.serviceType, filters.serviceType));
      }

      if (filters?.companyName) {
        whereConditions.push(eq(referrers.companyName, filters.companyName));
      }

      if (filters?.includesReferral !== undefined) {
        whereConditions.push(eq(referralServices.includesReferral, filters.includesReferral));
      }

      const services = await query
        .where(and(...whereConditions))
        .orderBy(desc(referrers.averageRating), desc(referrers.totalReviews));

      // Format response with anonymous privacy protection
      return services.map(service => ({
        serviceId: service.serviceId,
        serviceType: service.serviceType,
        title: service.title,
        description: service.description,
        basePrice: parseFloat(service.basePrice || '0'),
        referralBonusPrice: parseFloat(service.referralBonusPrice || '0'),
        sessionDuration: service.sessionDuration,
        sessionsIncluded: service.sessionsIncluded,
        includesReferral: service.includesReferral,
        features: service.features,
        deliverables: service.deliverables,
        requirements: service.requirements,
        targetRoles: service.targetRoles,
        availableSlots: service.availableSlots,
        bookedSlots: service.bookedSlots,
        createdAt: service.createdAt,
        
        // Referrer info (anonymous-protected)
        referrer: {
          id: service.referrerId,
          companyName: service.companyName,
          jobTitle: service.jobTitle,
          department: service.department,
          // Show real name or anonymous display name
          displayName: service.isAnonymous ? (service.displayName || 'Anonymous Employee') : `${service.companyName} ${service.jobTitle}`,
          isAnonymous: service.isAnonymous,
          yearsAtCompany: service.yearsAtCompany,
          bio: service.bio,
          specialties: service.specialties,
          availableRoles: service.availableRoles,
          verificationLevel: service.verificationLevel,
          stats: {
            totalServices: service.totalServices || 0,
            completedServices: service.completedServices || 0,
            totalReferrals: service.totalReferrals || 0,
            successfulReferrals: service.successfulReferrals || 0,
            averageRating: parseFloat(service.averageRating || '0'),
            totalReviews: service.totalReviews || 0,
            successRate: (service.totalReferrals || 0) > 0 ? 
              Math.round(((service.successfulReferrals || 0) / (service.totalReferrals || 1)) * 100) : 0
          }
        }
      }));
    } catch (error) {
      console.error('Error getting service listings:', error);
      throw new Error('Failed to get service listings');
    }
  }

  /**
   * Book a service with PayPal payment
   */
  async bookService(serviceId: number, jobSeekerId: string, bookingData: {
    notes?: string;
    scheduledAt?: Date;
  }) {
    try {
      // Get service details
      const service = await db.select({
        id: referralServices.id,
        referrerId: referralServices.referrerId,
        title: referralServices.title,
        basePrice: referralServices.basePrice,
        referralBonusPrice: referralServices.referralBonusPrice,
        includesReferral: referralServices.includesReferral,
        availableSlots: referralServices.availableSlots,
        bookedSlots: referralServices.bookedSlots,
      })
      .from(referralServices)
      .leftJoin(referrers, eq(referralServices.referrerId, referrers.id))
      .where(
        and(
          eq(referralServices.id, serviceId),
          eq(referralServices.isActive, true),
          eq(referrers.acceptingBookings, true)
        )
      )
      .limit(1);

      if (service.length === 0) {
        throw new Error('Service not found or not available');
      }

      const serviceData = service[0];

      // Check availability
      if ((serviceData.bookedSlots || 0) >= (serviceData.availableSlots || 0)) {
        throw new Error('Service is fully booked');
      }

      // Calculate total amount
      const baseAmount = parseFloat(serviceData.basePrice || '0');
      const referralBonusAmount = serviceData.includesReferral ? 
        parseFloat(serviceData.referralBonusPrice || '0') : 0;
      const totalAmount = baseAmount + referralBonusAmount;

      // Create conversation for communication
      const referrerUser = await db.select({ userId: referrers.userId })
        .from(referrers)
        .where(eq(referrers.id, serviceData.referrerId))
        .limit(1);

      const conversation = await simpleChatService.getOrCreateConversation(
        jobSeekerId, 
        referrerUser[0].userId
      );

      // Create booking record
      const newBooking = await db.insert(referralBookings)
        .values({
          serviceId,
          referrerId: serviceData.referrerId,
          jobSeekerId,
          status: 'pending',
          scheduledAt: bookingData.scheduledAt,
          conversationId: conversation.id,
          notes: bookingData.notes,
          totalAmount: totalAmount.toString(),
          baseAmount: baseAmount.toString(),
          referralBonusAmount: referralBonusAmount.toString(),
          paymentStatus: 'pending',
          escrowStatus: 'held'
        })
        .returning();

      // Update booked slots
      await db.update(referralServices)
        .set({
          bookedSlots: (serviceData.bookedSlots || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(referralServices.id, serviceId));

      return {
        success: true,
        booking: newBooking[0],
        paymentAmount: totalAmount,
        conversationId: conversation.id,
        message: 'Booking created successfully. Complete payment to confirm.'
      };
    } catch (error) {
      console.error('Error booking service:', error);
      throw new Error('Failed to book service');
    }
  }

  /**
   * Get referrer's feedback/reviews
   */
  async getReferrerFeedback(referrerId: number, limit = 10, offset = 0) {
    try {
      const feedback = await db.select({
        id: referralFeedback.id,
        overallRating: referralFeedback.overallRating,
        communicationRating: referralFeedback.communicationRating,
        helpfulnessRating: referralFeedback.helpfulnessRating,
        professionalismRating: referralFeedback.professionalismRating,
        valueRating: referralFeedback.valueRating,
        reviewTitle: referralFeedback.reviewTitle,
        reviewText: referralFeedback.reviewText,
        pros: referralFeedback.pros,
        cons: referralFeedback.cons,
        referralLikelihood: referralFeedback.referralLikelihood,
        wouldBookAgain: referralFeedback.wouldBookAgain,
        recommendToOthers: referralFeedback.recommendToOthers,
        displayName: referralFeedback.displayName,
        createdAt: referralFeedback.createdAt,
        // Service info
        serviceTitle: referralServices.title,
        serviceType: referralServices.serviceType,
      })
      .from(referralFeedback)
      .leftJoin(referralBookings, eq(referralFeedback.bookingId, referralBookings.id))
      .leftJoin(referralServices, eq(referralBookings.serviceId, referralServices.id))
      .where(
        and(
          eq(referralFeedback.referrerId, referrerId),
          eq(referralFeedback.isPublic, true),
          eq(referralFeedback.moderationStatus, 'approved')
        )
      )
      .orderBy(desc(referralFeedback.createdAt))
      .limit(limit)
      .offset(offset);

      return feedback;
    } catch (error) {
      console.error('Error getting referrer feedback:', error);
      throw new Error('Failed to get referrer feedback');
    }
  }

  /**
   * Submit feedback for a completed booking
   */
  async submitFeedback(bookingId: number, jobSeekerId: string, feedbackData: {
    overallRating: number;
    communicationRating: number;
    helpfulnessRating: number;
    professionalismRating: number;
    valueRating: number;
    reviewTitle?: string;
    reviewText?: string;
    pros?: string[];
    cons?: string[];
    referralLikelihood: string;
    wouldBookAgain: boolean;
    recommendToOthers: boolean;
    displayName?: string;
  }) {
    try {
      // Verify booking belongs to job seeker and is completed
      const booking = await db.select({
        id: referralBookings.id,
        referrerId: referralBookings.referrerId,
        status: referralBookings.status,
      })
      .from(referralBookings)
      .where(
        and(
          eq(referralBookings.id, bookingId),
          eq(referralBookings.jobSeekerId, jobSeekerId),
          eq(referralBookings.status, 'completed')
        )
      )
      .limit(1);

      if (booking.length === 0) {
        throw new Error('Booking not found or not completed');
      }

      // Create feedback record
      const newFeedback = await db.insert(referralFeedback)
        .values({
          bookingId,
          referrerId: booking[0].referrerId,
          jobSeekerId,
          overallRating: feedbackData.overallRating,
          communicationRating: feedbackData.communicationRating,
          helpfulnessRating: feedbackData.helpfulnessRating,
          professionalismRating: feedbackData.professionalismRating,
          valueRating: feedbackData.valueRating,
          reviewTitle: feedbackData.reviewTitle,
          reviewText: feedbackData.reviewText,
          pros: feedbackData.pros || [],
          cons: feedbackData.cons || [],
          referralLikelihood: feedbackData.referralLikelihood,
          wouldBookAgain: feedbackData.wouldBookAgain,
          recommendToOthers: feedbackData.recommendToOthers,
          displayName: feedbackData.displayName || 'Anonymous Job Seeker',
          isPublic: true,
          moderationStatus: 'approved'
        })
        .returning();

      // Update referrer's rating statistics
      await this.updateReferrerRatings(booking[0].referrerId);

      return {
        success: true,
        feedback: newFeedback[0],
        message: 'Thank you for your feedback!'
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Update referrer's average ratings and stats
   */
  private async updateReferrerRatings(referrerId: number) {
    try {
      // Calculate average ratings
      const stats = await db.select({
        avgRating: avg(referralFeedback.overallRating),
        totalReviews: count(referralFeedback.id),
      })
      .from(referralFeedback)
      .where(
        and(
          eq(referralFeedback.referrerId, referrerId),
          eq(referralFeedback.isPublic, true)
        )
      );

      const avgRating = stats[0]?.avgRating ? parseFloat(stats[0].avgRating.toString()) : 0;
      const totalReviews = stats[0]?.totalReviews || 0;

      // Update referrer record
      await db.update(referrers)
        .set({
          averageRating: avgRating.toFixed(2),
          totalReviews,
          updatedAt: new Date()
        })
        .where(eq(referrers.id, referrerId));

    } catch (error) {
      console.error('Error updating referrer ratings:', error);
    }
  }

  /**
   * Send verification email to company email
   */
  private async sendVerificationEmail(companyEmail: string, token: string, companyName: string) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://autojobr.com'}/verify-referrer?token=${token}`;
      
      const emailContent = {
        to: companyEmail,
        subject: 'Verify Your AutoJobr Referrer Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to AutoJobr Referral Marketplace!</h2>
            <p>Thank you for joining our referral marketplace as a referrer from <strong>${companyName}</strong>.</p>
            <p>To start offering your referral services, please verify your company email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
            <p>Once verified, you can:</p>
            <ul>
              <li>Create service listings (career advice, interview prep, referral services)</li>
              <li>Set your own pricing</li>
              <li>Choose to remain anonymous or show your profile</li>
              <li>Start earning by helping job seekers</li>
            </ul>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `
      };

      await sendEmail(emailContent);
    } catch (error) {
      console.error('Error sending verification email:', error);
      // Don't throw error here to avoid breaking the registration flow
    }
  }

  /**
   * Get user's referrer profile
   */
  async getReferrerProfile(userId: string) {
    try {
      const profile = await db.select()
        .from(referrers)
        .where(eq(referrers.userId, userId))
        .limit(1);

      return profile.length > 0 ? profile[0] : null;
    } catch (error) {
      console.error('Error getting referrer profile:', error);
      throw new Error('Failed to get referrer profile');
    }
  }

  /**
   * Get user's service listings
   */
  async getUserServiceListings(userId: string) {
    try {
      const referrer = await this.getReferrerProfile(userId);
      if (!referrer) {
        return [];
      }

      const services = await db.select()
        .from(referralServices)
        .where(eq(referralServices.referrerId, referrer.id))
        .orderBy(desc(referralServices.createdAt));

      return services;
    } catch (error) {
      console.error('Error getting user service listings:', error);
      throw new Error('Failed to get service listings');
    }
  }

  /**
   * Get referrer's bookings with full details including job seeker info
   */
  async getReferrerBookings(userId: string) {
    try {
      // First get referrer profile to get referrer ID
      const referrer = await this.getReferrerProfile(userId);
      if (!referrer) {
        return [];
      }

      // Get bookings first
      const bookings = await db.select()
        .from(referralBookings)
        .where(eq(referralBookings.referrerId, referrer.id))
        .orderBy(desc(referralBookings.createdAt));

      // For each booking, get additional details
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          // Get job seeker details
          let jobSeeker = null;
          if (booking.jobSeekerId) {
            const jobSeekerResult = await db.select()
              .from(users)
              .where(eq(users.id, booking.jobSeekerId))
              .limit(1);
            
            if (jobSeekerResult.length > 0) {
              jobSeeker = {
                id: jobSeekerResult[0].id,
                email: jobSeekerResult[0].email,
                firstName: jobSeekerResult[0].firstName,
                lastName: jobSeekerResult[0].lastName,
                phoneNumber: null, // Phone is stored in userProfiles table
              };
            }
          }

          // Get service details
          let service = null;
          if (booking.serviceId) {
            const serviceResult = await db.select()
              .from(referralServices)
              .where(eq(referralServices.id, booking.serviceId))
              .limit(1);
            
            if (serviceResult.length > 0) {
              service = {
                id: serviceResult[0].id,
                title: serviceResult[0].title,
                serviceType: serviceResult[0].serviceType,
                sessionDuration: serviceResult[0].sessionDuration,
              };
            }
          }

          return {
            id: booking.id,
            serviceId: booking.serviceId,
            jobSeekerId: booking.jobSeekerId,
            status: booking.status,
            scheduledAt: booking.scheduledAt,
            conversationId: booking.conversationId,
            notes: booking.notes,
            totalAmount: booking.totalAmount,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt,
            jobSeeker,
            service
          };
        })
      );

      return bookingsWithDetails;
    } catch (error) {
      console.error('Error getting referrer bookings:', error);
      throw new Error('Failed to get referrer bookings');
    }
  }

  /**
   * Update referrer settings (meeting link and email template)
   */
  async updateReferrerSettings(userId: string, settings: {
    meetingScheduleLink?: string;
    emailTemplate?: string;
  }) {
    try {
      // First get referrer profile to get referrer ID
      const referrer = await this.getReferrerProfile(userId);
      if (!referrer) {
        throw new Error('Referrer profile not found');
      }

      await db.update(referrers)
        .set({
          meetingScheduleLink: settings.meetingScheduleLink,
          emailTemplate: settings.emailTemplate,
          updatedAt: new Date()
        })
        .where(eq(referrers.id, referrer.id));

      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating referrer settings:', error);
      throw new Error('Failed to update referrer settings');
    }
  }

  /**
   * Send schedule email to job seeker
   */
  async sendScheduleEmail(userId: string, bookingId: number, meetingLink: string, customMessage?: string) {
    try {
      // First get referrer profile
      const referrer = await this.getReferrerProfile(userId);
      if (!referrer) {
        throw new Error('Referrer profile not found');
      }

      // Get booking details with job seeker info
      const booking = await db.select({
        id: referralBookings.id,
        referrerId: referralBookings.referrerId,
        jobSeekerId: referralBookings.jobSeekerId,
        status: referralBookings.status,
        paymentStatus: referralBookings.paymentStatus,
        
        // Job seeker info
        jobSeekerEmail: users.email,
        jobSeekerFirstName: users.firstName,
        jobSeekerLastName: users.lastName,
        
        // Service info
        serviceTitle: referralServices.title,
        serviceType: referralServices.serviceType,
        sessionDuration: referralServices.sessionDuration,
        
        // Referrer info
        referrerDisplayName: referrers.displayName,
        referrerJobTitle: referrers.jobTitle,
        referrerCompanyName: referrers.companyName,
      })
      .from(referralBookings)
      .leftJoin(users, eq(referralBookings.jobSeekerId, users.id))
      .leftJoin(referralServices, eq(referralBookings.serviceId, referralServices.id))
      .leftJoin(referrers, eq(referralBookings.referrerId, referrers.id))
      .where(
        and(
          eq(referralBookings.id, bookingId),
          eq(referralBookings.referrerId, referrer.id)
        )
      )
      .limit(1);

      if (booking.length === 0) {
        throw new Error('Booking not found or not authorized');
      }

      const bookingData = booking[0];

      // Check if payment is confirmed
      if (bookingData.paymentStatus !== 'paid') {
        throw new Error('Cannot schedule meeting until payment is confirmed');
      }

      // Generate email content
      const jobSeekerFirstName = bookingData.jobSeekerFirstName || 'there';
      const referrerName = bookingData.referrerDisplayName || 
                          `${bookingData.referrerJobTitle} at ${bookingData.referrerCompanyName}`;

      // Use custom email template if available, otherwise use default
      let emailTemplate = referrer.emailTemplate || `Hi {firstName},

Thank you for booking a session with me! I'm excited to help you with your career goals.

I'd like to schedule our meeting. Please use the link below to choose a time that works best for you:

{meetingLink}

Our session will cover:
- Career advice and insights
- Interview preparation tips
- Company-specific guidance
- Next steps in your job search

If you have any specific questions or topics you'd like to discuss, please feel free to reply to this email.

Looking forward to our conversation!

Best regards,
{referrerName}`;

      // Replace placeholders in template
      let emailContent = emailTemplate
        .replace(/{firstName}/g, jobSeekerFirstName)
        .replace(/{meetingLink}/g, meetingLink)
        .replace(/{referrerName}/g, referrerName);

      // Add custom message if provided
      if (customMessage && customMessage.trim()) {
        emailContent += `\n\nAdditional Message:\n${customMessage.trim()}`;
      }

      // Send email
      const emailParams = {
        to: bookingData.jobSeekerEmail || '',
        subject: `Meeting Invitation - ${bookingData.serviceTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Meeting Invitation - AutoJobr</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Invitation</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your scheduled session is ready!</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
              <div style="white-space: pre-line; line-height: 1.6; color: #333;">
                ${emailContent}
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0; font-size: 16px;">📅 Session Details:</h3>
                <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li><strong>Service:</strong> ${bookingData.serviceTitle}</li>
                  <li><strong>Duration:</strong> ${bookingData.sessionDuration} minutes</li>
                  <li><strong>Type:</strong> ${bookingData.serviceType}</li>
                  <li><strong>Booking ID:</strong> #${bookingData.id}</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${meetingLink}" 
                   style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Schedule Your Meeting
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                This meeting invitation was sent through the AutoJobr platform.
                <br>If you have any issues, please contact support.
              </p>
            </div>
          </body>
          </html>
        `
      };

      await sendEmail(emailParams);

      // Update booking to mark meeting link sent
      await db.update(referralBookings)
        .set({
          meetingLink: meetingLink,
          updatedAt: new Date()
        })
        .where(eq(referralBookings.id, bookingId));

      return {
        success: true,
        message: 'Meeting invitation sent successfully!'
      };
    } catch (error) {
      console.error('Error sending schedule email:', error);
      throw new Error('Failed to send schedule email');
    }
  }

  /**
   * Get user's bookings (as job seeker or referrer)
   */
  async getUserBookings(userId: string, role: 'job_seeker' | 'referrer') {
    try {
      let query;
      
      if (role === 'job_seeker') {
        query = db.select({
          id: referralBookings.id,
          status: referralBookings.status,
          scheduledAt: referralBookings.scheduledAt,
          totalAmount: referralBookings.totalAmount,
          paymentStatus: referralBookings.paymentStatus,
          conversationId: referralBookings.conversationId,
          notes: referralBookings.notes,
          createdAt: referralBookings.createdAt,
          // Service info
          serviceTitle: referralServices.title,
          serviceType: referralServices.serviceType,
          // Referrer info (anonymous-safe)
          referrerDisplayName: referrers.displayName,
          referrerCompany: referrers.companyName,
          referrerIsAnonymous: referrers.isAnonymous,
        })
        .from(referralBookings)
        .leftJoin(referralServices, eq(referralBookings.serviceId, referralServices.id))
        .leftJoin(referrers, eq(referralBookings.referrerId, referrers.id))
        .where(eq(referralBookings.jobSeekerId, userId));
      } else {
        const referrer = await this.getReferrerProfile(userId);
        if (!referrer) return [];

        query = db.select({
          id: referralBookings.id,
          status: referralBookings.status,
          scheduledAt: referralBookings.scheduledAt,
          totalAmount: referralBookings.totalAmount,
          paymentStatus: referralBookings.paymentStatus,
          conversationId: referralBookings.conversationId,
          notes: referralBookings.notes,
          createdAt: referralBookings.createdAt,
          // Service info
          serviceTitle: referralServices.title,
          serviceType: referralServices.serviceType,
          // Job seeker info
          jobSeekerName: users.firstName,
          jobSeekerEmail: users.email,
        })
        .from(referralBookings)
        .leftJoin(referralServices, eq(referralBookings.serviceId, referralServices.id))
        .leftJoin(users, eq(referralBookings.jobSeekerId, users.id))
        .where(eq(referralBookings.referrerId, referrer.id));
      }

      const bookings = await query.orderBy(desc(referralBookings.createdAt));
      return bookings;
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw new Error('Failed to get bookings');
    }
  }
}

export const referralMarketplaceService = new ReferralMarketplaceService();