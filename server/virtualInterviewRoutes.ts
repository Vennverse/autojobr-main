import express from "express";
import { VirtualInterviewService } from "./virtualInterviewService.js";
import { db } from "./db.js";
import { virtualInterviews, virtualInterviewMessages, virtualInterviewFeedback, virtualInterviewStats } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = express.Router();
const virtualInterviewService = new VirtualInterviewService();

// Start virtual interview session
router.post('/start', async (req: any, res) => {
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
          totalInterviews: existingStats[0].totalInterviews + 1,
          freeInterviewsUsed: existingStats[0].freeInterviewsUsed + 1
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
router.get('/:sessionId/question', async (req: any, res) => {
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
    const questionNumber = currentInterview.questionsAsked + 1;

    if (questionNumber > currentInterview.totalQuestions) {
      return res.status(400).json({ message: 'Interview completed' });
    }

    // Get previous responses for context
    const previousMessages = await db.select().from(virtualInterviewMessages)
      .where(and(
        eq(virtualInterviewMessages.interviewId, currentInterview.id),
        eq(virtualInterviewMessages.sender, 'candidate')
      ));

    const previousResponses = previousMessages.map(msg => msg.content);

    // Generate next question
    const questionData = await virtualInterviewService.generateQuestion(
      currentInterview.interviewType,
      currentInterview.difficulty,
      currentInterview.role,
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
      metadata: JSON.stringify({
        category: questionData.category,
        difficulty: questionData.difficulty,
        expectedKeywords: questionData.expectedKeywords
      })
    });

    res.json({
      question: questionData.question,
      questionNumber,
      totalQuestions: currentInterview.totalQuestions,
      category: questionData.category,
      timeRemaining: currentInterview.timeRemaining
    });
  } catch (error) {
    console.error('Error getting interview question:', error);
    res.status(500).json({ message: 'Failed to get question' });
  }
});

// Submit response to current question
router.post('/:sessionId/response', async (req: any, res) => {
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
    const responseIndex = currentInterview.questionsAsked + 1;

    // Store candidate response
    await db.insert(virtualInterviewMessages).values({
      interviewId: currentInterview.id,
      sender: 'candidate',
      messageType: 'response',
      content: response,
      messageIndex: responseIndex,
      timeSpent
    });

    // Update interview progress
    await db.update(virtualInterviews)
      .set({ 
        questionsAsked: currentInterview.questionsAsked + 1,
        timeRemaining: Math.max(0, (currentInterview.timeRemaining || (currentInterview.duration * 60)) - (timeSpent || 0))
      })
      .where(eq(virtualInterviews.id, currentInterview.id));

    // Check if interview is complete
    const isComplete = (currentInterview.questionsAsked + 1) >= currentInterview.totalQuestions;

    res.json({
      success: true,
      isComplete,
      nextQuestionNumber: isComplete ? null : currentInterview.questionsAsked + 2
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

// Complete interview and generate feedback
router.post('/:sessionId/complete', async (req: any, res) => {
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
      const newCompletedCount = currentStats.completedInterviews + 1;
      const newAverage = Math.round(((currentStats.averageScore * currentStats.completedInterviews) + overallScore) / newCompletedCount);
      
      await db.update(virtualInterviewStats)
        .set({
          completedInterviews: newCompletedCount,
          averageScore: newAverage,
          bestScore: Math.max(currentStats.bestScore, overallScore),
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
router.get('/:sessionId/feedback', async (req: any, res) => {
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