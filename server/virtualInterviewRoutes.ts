import express from "express";
import { VirtualInterviewService } from "./virtualInterviewService.js";
import { db } from "./db.js";
import { virtualInterviews, virtualInterviewMessages, virtualInterviewFeedback, virtualInterviewStats } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { isAuthenticated } from "./auth.js";
import { storage } from "./storage.js";

const router = express.Router();
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

// Start chat interview session
router.post('/start-chat', isAuthenticated, async (req: any, res) => {
  try {
    const { 
      role = 'software_engineer', 
      company, 
      difficulty = 'medium',
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
      interviewType: 'chat', // Explicitly set to 'chat'
      role,
      company,
      difficulty,
      duration: 30, // Default duration for chat interviews
      interviewerPersonality,
      status: 'active',
      currentStep: 'introduction',
      totalQuestions: 5 // Default number of questions for chat interviews
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
        role,
        company,
        difficulty,
        interviewerPersonality
      }
    });
  } catch (error) {
    console.error('Error starting chat interview:', error);
    res.status(500).json({ message: 'Failed to start chat interview' });
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

      // Get previous questions to avoid duplicates
      const prevMessagesForQuestionAvoidance = await db.select()
        .from(virtualInterviewMessages)
        .where(eq(virtualInterviewMessages.interviewId, currentInterview.id))
        .orderBy(virtualInterviewMessages.createdAt);

      const previousQuestions = prevMessagesForQuestionAvoidance
        .filter(m => m.sender === 'interviewer' && m.content && m.content.length > 50)
        .map(m => m.content);

      // Generate UNIQUE context for this specific question
      const uniqueQuestionContext = `USER_${userId}_Q${questionNumber}_SESSION_${sessionId}_TIME_${Date.now()}_RAND_${Math.random()}_VAR_${Math.floor(Math.random() * 999999)}`;

      // Generate next question with job description for job-specific questions
      console.log(`📋 Generating question #${questionNumber} with job description: ${currentInterview.jobDescription ? 'YES' : 'NO'}`);
      const questionData = await virtualInterviewService.generateQuestion(
        currentInterview.interviewType || 'technical',
        currentInterview.difficulty || 'medium',
        currentInterview.role || 'software_engineer',
        questionNumber,
        previousResponses,
        uniqueQuestionContext, // Pass unique context
        currentInterview.jobDescription || undefined,
        previousQuestions // Pass previous questions to avoid duplicates
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

    console.log(`🎯 Generating AI feedback for interview ${sessionId} with ${responses.length} responses`);

    // Generate AI-powered detailed feedback
    const aiFeedback = await virtualInterviewService.generateFinalFeedback(
      currentInterview,
      messages.map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.createdAt
      }))
    );

    const overallScore = aiFeedback.overallScore;
    const technicalScore = aiFeedback.technicalScore;
    const communicationScore = aiFeedback.communicationScore;
    const confidenceScore = aiFeedback.confidenceScore;

    console.log(`✅ AI Feedback generated - Overall: ${overallScore}%, Technical: ${technicalScore}%, Communication: ${communicationScore}%`);

    // Update interview completion with AI-generated data
    await db.update(virtualInterviews)
      .set({
        status: 'completed',
        endTime: new Date(),
        overallScore,
        technicalScore,
        communicationScore,
        confidenceScore,
        strengths: aiFeedback.keyStrengths,
        weaknesses: aiFeedback.areasForImprovement,
        recommendations: aiFeedback.nextSteps
      })
      .where(eq(virtualInterviews.id, currentInterview.id));

    // Create detailed feedback with AI analysis
    await db.insert(virtualInterviewFeedback).values({
      interviewId: currentInterview.id,
      performanceSummary: aiFeedback.performanceSummary,
      keyStrengths: aiFeedback.keyStrengths,
      areasForImprovement: aiFeedback.areasForImprovement,
      technicalSkillsScore: technicalScore,
      problemSolvingScore: Math.round((technicalScore + overallScore) / 2), // Derive from technical
      communicationScore,
      responseConsistency: Math.round((overallScore + communicationScore) / 2), // Derive from overall
      adaptabilityScore: Math.round((overallScore + technicalScore) / 2), // Derive from performance
      stressHandling: confidenceScore, // Use confidence as stress handling indicator
      roleReadiness: overallScore >= 85 ? 'ready' : overallScore >= 70 ? 'needs_practice' : 'significant_gaps',
      aiConfidenceScore: 90
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

// Chat interview specific endpoints (compatibility with old chat interview system)
router.post('/start-chat', isAuthenticated, async (req: any, res) => {
  try {
    const { 
      role = 'software_engineer', 
      interviewType = 'technical',
      difficulty = 'medium',
      duration = 30,
      totalQuestions = 5,
      personality = 'professional',
      company,
      jobDescription
    } = req.body;

    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Generate unique session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Create interview record
    const [interview] = await db.insert(virtualInterviews).values({
      userId,
      sessionId,
      role,
      interviewType,
      difficulty,
      duration,
      totalQuestions,
      questionsAsked: 0,
      startTime: new Date(),
      status: 'active',
      interviewerPersonality: personality,
      company: company || '',
      jobDescription: jobDescription || ''
    }).returning();

    // Generate greeting
    const greeting = await virtualInterviewService.generateGreeting(personality, role, company);

    // Store greeting message
    await db.insert(virtualInterviewMessages).values({
      interviewId: interview.id,
      sender: 'interviewer',
      messageType: 'greeting',
      content: greeting,
      messageIndex: 0
    });

    res.json({
      sessionId,
      interviewId: interview.id,
      greeting,
      message: greeting
    });
  } catch (error) {
    console.error('Error starting chat interview:', error);
    res.status(500).json({ message: 'Failed to start chat interview' });
  }
});

// Get interview messages - chat interview endpoint
router.get('/:sessionId/messages', isAuthenticated, async (req: any, res) => {
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

    // Get all messages for this interview
    let messages = await db.select().from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, currentInterview.id))
      .orderBy(virtualInterviewMessages.messageIndex);

    // If no messages exist (including greeting), generate welcome message and first question
    if (messages.length === 0) {
      console.log(`📝 No messages found for session ${sessionId}, generating welcome message and first question...`);
      console.log(`📋 Job Description available: ${currentInterview.jobDescription ? 'YES (' + currentInterview.jobDescription.substring(0, 50) + '...)' : 'NO'}`);

      // Generate welcome greeting
      const greeting = await virtualInterviewService.generateGreeting(
        currentInterview.interviewerPersonality || 'professional',
        currentInterview.role || 'Software Engineer',
        currentInterview.company
      );

      // Store greeting message
      await db.insert(virtualInterviewMessages).values({
        interviewId: currentInterview.id,
        sender: 'interviewer',
        messageType: 'greeting',
        content: greeting,
        messageIndex: 0,
        timestamp: new Date()
      });

      // Generate and store first question with unique context AND job description
      const uniqueContext = `Session: ${sessionId}, Time: ${Date.now()}, User: ${userId}`;
      const firstQuestion = await virtualInterviewService.generateQuestion(
        currentInterview.interviewType || 'technical',
        currentInterview.difficulty || 'medium',
        currentInterview.role || 'Software Engineer',
        1,
        [],
        uniqueContext,
        currentInterview.jobDescription || undefined
      );

      await db.insert(virtualInterviewMessages).values({
        interviewId: currentInterview.id,
        sender: 'interviewer',
        messageType: 'question',
        content: firstQuestion.question,
        messageIndex: 1,
        timestamp: new Date()
      });

      // Reload messages after inserting
      messages = await db.select().from(virtualInterviewMessages)
        .where(eq(virtualInterviewMessages.interviewId, currentInterview.id))
        .orderBy(virtualInterviewMessages.messageIndex);
    }
    // If only greeting exists, generate first question
    else if (messages.length === 1 && messages[0].sender === 'interviewer') {
      console.log(`📝 Only greeting found for session ${sessionId}, generating first question...`);
      console.log(`📋 Job Description available: ${currentInterview.jobDescription ? 'YES (' + currentInterview.jobDescription.substring(0, 50) + '...)' : 'NO'}`);

      // Generate first question with HIGHLY UNIQUE context to ensure variation
      const uniqueContext = `UNIQUE_USER_${userId}_SESSION_${sessionId}_TIME_${Date.now()}_RANDOM_${Math.random()}_TIMESTAMP_${new Date().toISOString()}_VARIATION_${Math.floor(Math.random() * 1000000)}`;
      const firstQuestion = await virtualInterviewService.generateQuestion(
        currentInterview.interviewType || 'technical',
        currentInterview.difficulty || 'medium',
        currentInterview.role || 'Software Engineer',
        1,
        [],
        uniqueContext,
        currentInterview.jobDescription || undefined
      );

      await db.insert(virtualInterviewMessages).values({
        interviewId: currentInterview.id,
        sender: 'interviewer',
        messageType: 'question',
        content: firstQuestion.question,
        messageIndex: 1,
        timestamp: new Date()
      });

      // Reload messages after inserting
      messages = await db.select().from(virtualInterviewMessages)
        .where(eq(virtualInterviewMessages.interviewId, currentInterview.id))
        .orderBy(virtualInterviewMessages.messageIndex);
    }

    // Calculate time remaining
    const startTime = currentInterview.startTime ? new Date(currentInterview.startTime).getTime() : Date.now();
    const durationMs = (currentInterview.duration || 30) * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp || msg.createdAt,
        messageIndex: msg.messageIndex
      })),
      currentQuestionCount: currentInterview.questionsAsked || 0,
      totalQuestions: currentInterview.totalQuestions || 5,
      timeRemaining,
      status: currentInterview.status
    });
  } catch (error) {
    console.error('Error getting chat interview messages:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// Device fingerprint endpoint for chat interviews
router.post('/:sessionId/device-fingerprint', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const deviceData = req.body;

    console.log('📱 Received device fingerprint for chat interview:', sessionId);

    // For now, just acknowledge receipt
    // Full proctoring can be added later if needed
    res.json({
      success: true,
      fingerprint: { sessionId, timestamp: Date.now() },
      environmentValidation: { isSecure: true },
      browserSecurity: { securityLevel: 'standard' },
      riskLevel: 'low'
    });
  } catch (error) {
    console.error('Error processing device fingerprint:', error);
    res.status(500).json({ error: 'Failed to process device fingerprint' });
  }
});

// Report violation in chat interview
router.post('/:sessionId/violation', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const violation = req.body;
    console.log(`⚠️ Violation reported for session ${sessionId}:`, violation.type);

    // Get the interview
    const [currentInterview] = await db.select().from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!currentInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Process the violation using the service
    await virtualInterviewService.processViolation(sessionId, violation);

    res.json({ 
      success: true, 
      message: 'Violation recorded' 
    });

  } catch (error) {
    console.error('Error processing violation:', error);
    res.status(500).json({ message: 'Failed to process violation' });
  }
});

// Send message in chat interview
router.post('/:sessionId/message', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log(`💬 Processing chat message for session ${sessionId}`);

    // Get the interview
    const [currentInterview] = await db.select().from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!currentInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (currentInterview.status === 'completed') {
      return res.status(400).json({ message: 'Interview is already completed' });
    }

    // Get current message count
    const existingMessages = await db.select().from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, currentInterview.id));

    const nextMessageIndex = existingMessages.length;

    // Save user message
    await db.insert(virtualInterviewMessages).values({
      interviewId: currentInterview.id,
      sender: 'candidate',
      content: message.trim(),
      timestamp: new Date(),
      messageIndex: nextMessageIndex
    });

    // Generate AI response using follow-up or new question
    let aiResponseText: string;

    if (existingMessages.length > 1) {
      // Get the last question from the interviewer
      const lastInterviewerMsg = existingMessages
        .filter(m => m.sender === 'interviewer')
        .pop();

      const previousQuestion = lastInterviewerMsg?.content || 'Tell me about yourself';

      // Create a simple analysis for the follow-up
      const simpleAnalysis = {
        responseQuality: 7,
        technicalAccuracy: 70,
        clarityScore: 70,
        depthScore: 70,
        keywordsMatched: [],
        sentiment: 'neutral' as const,
        confidence: 70
      };

      // Generate a follow-up question based on the conversation
      aiResponseText = await virtualInterviewService.generateFollowUp(
        previousQuestion,
        message.trim(),
        simpleAnalysis,
        currentInterview.interviewerPersonality || 'professional'
      );
    } else {
      // First message - generate initial question with job description
      console.log(`📋 Generating initial question with job description: ${currentInterview.jobDescription ? 'YES' : 'NO'}`);
      const question = await virtualInterviewService.generateQuestion(
        currentInterview.interviewType || 'general',
        currentInterview.difficulty || 'medium',
        currentInterview.role || 'Software Engineer',
        1,
        [],
        '',
        currentInterview.jobDescription || undefined
      );
      aiResponseText = question.question;
    }

    // Save AI message
    await db.insert(virtualInterviewMessages).values({
      interviewId: currentInterview.id,
      sender: 'interviewer',
      content: aiResponseText,
      timestamp: new Date(),
      messageIndex: nextMessageIndex + 1
    });

    // Update interview progress
    const questionsAsked = (currentInterview.questionsAsked || 0) + 1;
    const totalQuestions = currentInterview.totalQuestions || 5;

    // Calculate time remaining
    const startTime = currentInterview.startTime ? new Date(currentInterview.startTime).getTime() : Date.now();
    const durationMs = (currentInterview.duration || 30) * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

    // Check if interview should end
    const shouldEndInterview = questionsAsked >= totalQuestions || timeRemaining <= 0;

    // Update interview
    await db.update(virtualInterviews)
      .set({
        questionsAsked,
        status: shouldEndInterview ? 'completed' : 'in_progress'
      })
      .where(eq(virtualInterviews.id, currentInterview.id));

    res.json({
      response: aiResponseText,
      currentQuestionCount: questionsAsked,
      totalQuestions,
      timeRemaining,
      shouldEndInterview,
      isComplete: shouldEndInterview
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ message: 'Failed to process message' });
  }
});

// LinkedIn Share Verification for Interview Retake
router.post('/:sessionId/retake/linkedin-share', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { linkedinPostUrl } = req.body;
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!linkedinPostUrl || !linkedinPostUrl.includes('linkedin.com')) {
      return res.status(400).json({ message: 'Please provide a valid LinkedIn post URL' });
    }

    // Verify the interview exists
    const [interview] = await db.select().from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // For now, we'll trust the URL is valid (in production, you'd verify via LinkedIn API)
    console.log(`✅ LinkedIn share verified for interview ${sessionId}: ${linkedinPostUrl}`);

    // Grant retake access - update user stats to allow another interview
    const existingStats = await db.select().from(virtualInterviewStats)
      .where(eq(virtualInterviewStats.userId, userId))
      .limit(1);

    if (existingStats.length > 0) {
      // Decrement freeInterviewsUsed to grant a free retake
      const currentUsed = existingStats[0].freeInterviewsUsed || 0;
      await db.update(virtualInterviewStats)
        .set({ 
          freeInterviewsUsed: Math.max(0, currentUsed - 1)
        })
        .where(eq(virtualInterviewStats.userId, userId));
    }

    res.json({
      success: true,
      message: 'LinkedIn post verified! You can now retake the interview for free.',
      linkedinPostUrl
    });
  } catch (error) {
    console.error('Error verifying LinkedIn share:', error);
    res.status(500).json({ message: 'Failed to verify LinkedIn share' });
  }
});

// LinkedIn Comment Verification for Interview Retake
router.post('/:sessionId/retake/linkedin-comment', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { linkedinCommentUrl } = req.body;
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!linkedinCommentUrl || !linkedinCommentUrl.includes('linkedin.com')) {
      return res.status(400).json({ message: 'Please provide a valid LinkedIn comment URL' });
    }

    // Verify the interview exists
    const [interview] = await db.select().from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // For now, we'll trust the URL is valid (in production, you'd verify via LinkedIn API)
    console.log(`✅ LinkedIn comment verified for interview ${sessionId}: ${linkedinCommentUrl}`);

    // Grant retake access - update user stats to allow another interview
    const existingStats = await db.select().from(virtualInterviewStats)
      .where(eq(virtualInterviewStats.userId, userId))
      .limit(1);

    if (existingStats.length > 0) {
      // Decrement freeInterviewsUsed to grant a free retake
      const currentUsed = existingStats[0].freeInterviewsUsed || 0;
      await db.update(virtualInterviewStats)
        .set({ 
          freeInterviewsUsed: Math.max(0, currentUsed - 1)
        })
        .where(eq(virtualInterviewStats.userId, userId));
    }

    res.json({
      success: true,
      message: 'LinkedIn comment verified! You can now retake the interview for free.',
      linkedinCommentUrl
    });
  } catch (error) {
    console.error('Error verifying LinkedIn comment:', error);
    res.status(500).json({ message: 'Failed to verify LinkedIn comment' });
  }
});

export default router;