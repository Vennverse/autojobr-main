import express from "express";
import { VirtualInterviewService } from "./virtualInterviewService.js";
import { db } from "./db.js";
import { virtualInterviews, virtualInterviewMessages, virtualInterviewFeedback, virtualInterviewStats } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { isAuthenticated } from "./auth.js";
import { storage } from "./storage.js";

const router = express.Router();
const virtualInterviewService = new VirtualInterviewService();
const virtualInterviewService = new VirtualInterviewService();

// Check eligibility for virtual interview  
router.post('/check-eligibility', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { interviewId, isRetake } = req.body;

    // If this is a recruiter-assigned interview (has interviewId)
    if (interviewId) {
      // Check if this is the first attempt (free) or a retake (paid)
      const existingAttempts = await db.select().from(virtualInterviews)
        .where(and(
          eq(virtualInterviews.userId, userId),
          eq(virtualInterviews.jobPostingId, interviewId)
        ));

      if (existingAttempts.length === 0) {
        // First attempt for recruiter-assigned interview - always free
        return res.json({
          eligible: true,
          remainingFree: 1,
          needsPayment: false,
          isRecruiterAssigned: true,
          message: 'First attempt at recruiter-assigned interview is free'
        });
      } else {
        // This is a retake of recruiter-assigned interview - ALWAYS requires payment
        return res.status(402).json({
          eligible: false,
          remainingFree: 0,
          needsPayment: true,
          cost: 5,
          isRetake: true,
          message: 'Retaking recruiter-assigned interviews requires a $5 payment'
        });
      }
    }

    // For practice interviews, check user's subscription limits
    const user = await storage.getUser(userId);
    const subscriptionTier = user?.planType || 'free';
    
    // Get user's interview stats
    const stats = await db.select().from(virtualInterviewStats)
      .where(eq(virtualInterviewStats.userId, userId))
      .limit(1);
    
    let freeLimit = 1; // Free users get 1 practice interview
    if (subscriptionTier === 'premium' || subscriptionTier === 'ultra_premium') {
      freeLimit = 5; // Premium users get 5 practice interviews
    }

    let freeUsed = 0;
    if (stats.length > 0) {
      freeUsed = stats[0].freeInterviewsUsed || 0;
    }

    const remainingFree = Math.max(0, freeLimit - freeUsed);

    if (remainingFree > 0) {
      res.json({
        eligible: true,
        remainingFree,
        needsPayment: false,
        isPractice: true
      });
    } else {
      res.status(402).json({
        eligible: false,
        remainingFree: 0,
        needsPayment: true,
        cost: 5,
        isPractice: true,
        message: 'No free practice interviews remaining. Pay $5 for additional practice.'
      });
    }
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: 'Failed to check eligibility' });
  }
});

// PayPal payment for interview retake
router.post('/create-payment', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Create PayPal order for $5 interview retake
    const orderPayload = {
      amount: "5.00",
      currency: "USD", 
      intent: "CAPTURE"
    };

    const response = await fetch('/api/paypal/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to create PayPal order');
    }

    const orderData = await response.json();
    
    res.json({
      success: true,
      orderId: orderData.id,
      approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Confirm PayPal payment and grant interview access  
router.post('/confirm-payment', isAuthenticated, async (req: any, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id || req.session?.user?.id;
    
    if (!userId || !orderId) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Capture PayPal payment
    const captureResponse = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!captureResponse.ok) {
      throw new Error('Payment capture failed');
    }

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      // Grant user one paid interview
      const userProfile = await storage.getUserProfile(userId);
      if (userProfile) {
        await storage.upsertUserProfile({
          ...userProfile,
          freeInterviewsRemaining: (userProfile.freeInterviewsRemaining || 0) + 1
        });
      }

      res.json({
        success: true,
        message: 'Payment confirmed. You can now start your interview.',
        grantedInterviews: 1
      });
    } else {
      res.status(400).json({ message: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Start virtual interview session
router.post('/start', isAuthenticated, async (req: any, res) => {
  try {
    const { 
      interviewType = 'technical',
      role = 'software_engineer', 
      company, 
      difficulty = 'medium',
      duration = 30,
      interviewerPersonality = 'professional'
    } = req.body;
    
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Create interview record in database
    const [interview] = await db.insert(virtualInterviews).values({
      userId,
      sessionId,
      interviewType,
      role,
      company,
      difficulty,
      duration,
      interviewerPersonality,
      status: 'active',
      currentStep: 'introduction',
      totalQuestions: 5
    }).returning();

    // Initialize user stats if not exists
    const existingStats = await db.select().from(virtualInterviewStats).where(eq(virtualInterviewStats.userId, userId)).limit(1);
    if (existingStats.length === 0) {
      await db.insert(virtualInterviewStats).values({
        userId,
        totalInterviews: 1,
        freeInterviewsUsed: 1
      });
    } else {
      await db.update(virtualInterviewStats)
        .set({ 
          totalInterviews: (existingStats[0].totalInterviews || 0) + 1,
          freeInterviewsUsed: (existingStats[0].freeInterviewsUsed || 0) + 1
        })
        .where(eq(virtualInterviewStats.userId, userId));
    }

    // Generate greeting message
    const greeting = await virtualInterviewService.generateGreeting(interviewerPersonality, role, company);

    // Store greeting message
    await db.insert(virtualInterviewMessages).values({
      interviewId: interview.id,
      sender: 'interviewer',
      messageType: 'greeting',
      content: greeting,
      messageIndex: 0
    });

    res.json({
      interviewId: interview.id,
      sessionId,
      status: 'active',
      greeting,
      configuration: {
        interviewType,
        role,
        company,
        difficulty,
        duration,
        interviewerPersonality
      }
    });
  } catch (error) {
    console.error('Error starting virtual interview:', error);
    res.status(500).json({ message: 'Failed to start interview' });
  }
});

// Get current question for interview
router.get('/:sessionId/question', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    // Handle "new" session ID - redirect to proper start page
    if (sessionId === 'new') {
      return res.status(200).json({ 
        message: 'Please configure your interview settings first.',
        redirect: '/virtual-interview-start',
        requiresSetup: true
      });
    }

    const interview = await db.select().from(virtualInterviews)
      .where(and(eq(virtualInterviews.sessionId, sessionId), eq(virtualInterviews.userId, userId)))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ 
        message: 'Interview session not found',
        redirect: '/virtual-interview-start'
      });
    }

    const currentInterview = interview[0];
    const questionsAsked = currentInterview.questionsAsked || 0;
    const questionNumber = questionsAsked + 1;
    
    console.log(`[VIRTUAL_INTERVIEW_DEBUG] Session: ${sessionId}, Questions Asked: ${questionsAsked}, Current Question Number: ${questionNumber}`);

    if (questionNumber > (currentInterview.totalQuestions || 5)) {
      return res.status(400).json({ message: 'Interview completed' });
    }

    // Check if we already have this question generated
    const existingQuestion = await db.select().from(virtualInterviewMessages)
      .where(and(
        eq(virtualInterviewMessages.interviewId, currentInterview.id),
        eq(virtualInterviewMessages.sender, 'interviewer'),
        eq(virtualInterviewMessages.messageType, 'question'),
        eq(virtualInterviewMessages.messageIndex, questionNumber)
      ))
      .limit(1);

    let questionContent, questionCategory, questionDifficulty;

    if (existingQuestion.length > 0) {
      // Return the existing question
      questionContent = existingQuestion[0].content;
      questionCategory = existingQuestion[0].questionCategory || 'technical';
      questionDifficulty = existingQuestion[0].difficulty || 'medium';
    } else {
      // Get previous responses for context
      const previousMessages = await db.select().from(virtualInterviewMessages)
        .where(and(
          eq(virtualInterviewMessages.interviewId, currentInterview.id),
          eq(virtualInterviewMessages.sender, 'candidate')
        ));

      const previousResponses = previousMessages.map(msg => msg.content);

      // Generate next question
      const questionData = await virtualInterviewService.generateQuestion(
        currentInterview.interviewType || 'technical',
        currentInterview.difficulty || 'medium',
        currentInterview.role || 'software_engineer',
        questionNumber,
        previousResponses
      );

      // Store question in database
      await db.insert(virtualInterviewMessages).values({
        interviewId: currentInterview.id,
        sender: 'interviewer',
        messageType: 'question',
        content: questionData.question,
        messageIndex: questionNumber,
        questionCategory: questionData.category,
        difficulty: questionData.difficulty,
        expectedAnswer: JSON.stringify(questionData.expectedKeywords)
      });

      questionContent = questionData.question;
      questionCategory = questionData.category;
      questionDifficulty = questionData.difficulty;
    }

    // Calculate remaining time
    const startTime = new Date(currentInterview.startTime || Date.now()).getTime();
    const durationMs = (currentInterview.duration || 30) * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

    res.json({
      question: questionContent,
      questionNumber,
      totalQuestions: currentInterview.totalQuestions || 5,
      category: questionCategory,
      timeRemaining,
      difficulty: questionDifficulty
    });
  } catch (error) {
    console.error('Error getting interview question:', error);
    res.status(500).json({ message: 'Failed to get question' });
  }
});

// Submit response to current question
router.post('/:sessionId/response', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { response, timeSpent } = req.body;
    const userId = req.user?.id || req.session?.user?.id;

    if (!response || !response.trim()) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const interview = await db.select().from(virtualInterviews)
      .where(and(eq(virtualInterviews.sessionId, sessionId), eq(virtualInterviews.userId, userId)))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    const currentInterview = interview[0];
    const responseIndex = (currentInterview.questionsAsked || 0) + 1;

    // Store candidate response
    await db.insert(virtualInterviewMessages).values({
      interviewId: currentInterview.id,
      sender: 'candidate',
      messageType: 'response',
      content: response,
      messageIndex: responseIndex,
      responseTime: timeSpent
    });

    // Update interview progress - increment questions asked
    const newQuestionsAsked = (currentInterview.questionsAsked || 0) + 1;
    console.log(`[VIRTUAL_INTERVIEW_DEBUG] Updating interview progress - Old: ${currentInterview.questionsAsked}, New: ${newQuestionsAsked}`);
    
    await db.update(virtualInterviews)
      .set({ 
        questionsAsked: newQuestionsAsked
      })
      .where(eq(virtualInterviews.id, currentInterview.id));

    // Check if interview is complete
    const isComplete = newQuestionsAsked >= (currentInterview.totalQuestions || 5);

    res.json({
      success: true,
      isComplete,
      nextQuestionNumber: isComplete ? null : newQuestionsAsked + 1
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

// Complete interview and generate feedback
router.post('/:sessionId/complete', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    const interview = await db.select().from(virtualInterviews)
      .where(and(eq(virtualInterviews.sessionId, sessionId), eq(virtualInterviews.userId, userId)))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    const currentInterview = interview[0];

    // Get all messages for analysis
    const messages = await db.select().from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, currentInterview.id));

    const responses = messages.filter(msg => msg.sender === 'candidate');
    
    // Generate basic scores (in production, this would use AI analysis)
    const overallScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
    const technicalScore = Math.floor(Math.random() * 30) + 70;
    const communicationScore = Math.floor(Math.random() * 30) + 70;
    const confidenceScore = Math.floor(Math.random() * 30) + 70;

    // Update interview completion
    await db.update(virtualInterviews)
      .set({
        status: 'completed',
        endTime: new Date(),
        overallScore,
        technicalScore,
        communicationScore,
        confidenceScore,
        strengths: ['Clear communication', 'Good problem-solving approach', 'Relevant experience'],
        weaknesses: ['Could provide more specific examples', 'Consider elaborating on technical details'],
        recommendations: ['Practice more behavioral questions', 'Prepare detailed project examples']
      })
      .where(eq(virtualInterviews.id, currentInterview.id));

    // Create detailed feedback
    await db.insert(virtualInterviewFeedback).values({
      interviewId: currentInterview.id,
      performanceSummary: `Strong performance with ${overallScore}% overall score. Good technical knowledge and communication skills.`,
      keyStrengths: ['Clear communication', 'Good problem-solving approach', 'Relevant experience'],
      areasForImprovement: ['Could provide more specific examples', 'Consider elaborating on technical details'],
      technicalSkillsScore: technicalScore,
      problemSolvingScore: Math.floor(Math.random() * 30) + 70,
      communicationScore,
      responseConsistency: Math.floor(Math.random() * 30) + 70,
      adaptabilityScore: Math.floor(Math.random() * 30) + 70,
      stressHandling: Math.floor(Math.random() * 30) + 70,
      roleReadiness: overallScore >= 85 ? 'ready' : overallScore >= 70 ? 'needs_practice' : 'significant_gaps',
      aiConfidenceScore: 85
    });

    // Update user stats
    const stats = await db.select().from(virtualInterviewStats)
      .where(eq(virtualInterviewStats.userId, userId))
      .limit(1);

    if (stats.length > 0) {
      const currentStats = stats[0];
      const newCompletedCount = (currentStats.completedInterviews || 0) + 1;
      const currentAverage = currentStats.averageScore || 0;
      const currentCompleted = currentStats.completedInterviews || 0;
      const newAverage = Math.round(((currentAverage * currentCompleted) + overallScore) / newCompletedCount);
      
      await db.update(virtualInterviewStats)
        .set({
          completedInterviews: newCompletedCount,
          averageScore: newAverage,
          bestScore: Math.max(currentStats.bestScore || 0, overallScore),
          lastInterviewDate: new Date()
        })
        .where(eq(virtualInterviewStats.userId, userId));
    }

    res.json({
      interviewId: currentInterview.id,
      completed: true,
      overallScore,
      message: 'Interview completed successfully'
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Failed to complete interview' });
  }
});

// Get interview feedback
router.get('/:sessionId/feedback', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    const interview = await db.select().from(virtualInterviews)
      .where(and(eq(virtualInterviews.sessionId, sessionId), eq(virtualInterviews.userId, userId)))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    const feedback = await db.select().from(virtualInterviewFeedback)
      .where(eq(virtualInterviewFeedback.interviewId, interview[0].id))
      .limit(1);

    if (!feedback.length) {
      return res.status(404).json({ message: 'Feedback not available yet' });
    }

    res.json({
      interview: interview[0],
      feedback: feedback[0]
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ message: 'Failed to get feedback' });
  }
});

export default router;


export default router;
// Get interview history for user
router.get('/history', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const interviews = await db.select()
      .from(virtualInterviews)
      .where(eq(virtualInterviews.userId, userId))
      .orderBy(desc(virtualInterviews.createdAt))
      .limit(10);

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ message: 'Failed to fetch interview history' });
  }
});
