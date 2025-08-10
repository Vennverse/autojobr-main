import express from 'express';
import { db } from './db.js';
import { virtualInterviews, virtualInterviewMessages } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { chatInterviewService } from './chatInterviewService.js';
import { isAuthenticated } from './replitAuth.js';
import crypto from 'crypto';

const router = express.Router();

// Start a new chat-based interview
router.post('/start-chat', isAuthenticated, async (req: any, res) => {
  try {
    const {
      role = 'software_engineer',
      interviewType = 'technical',
      difficulty = 'medium',
      duration = 30,
      totalQuestions = 5,
      personality = 'professional'
    } = req.body;

    const userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Generate unique session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Create interview record
    const interview = await db.insert(virtualInterviews).values({
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
      retakeAllowed: false
    }).returning();

    const interviewId = interview[0].id;

    // Start the chat interview
    const greeting = await chatInterviewService.startInterviewChat(interviewId, {
      role,
      interviewType,
      difficulty,
      totalQuestions,
      currentQuestionCount: 0,
      personality
    });

    res.json({
      sessionId,
      interviewId,
      greeting,
      message: greeting
    });

  } catch (error) {
    console.error('Error starting chat interview:', error);
    res.status(500).json({ message: 'Failed to start interview' });
  }
});

// Get interview messages (chat history)
router.get('/:sessionId/messages', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    // Get interview
    const interview = await db.select()
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Get all messages
    const messages = await db.select()
      .from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, interview[0].id))
      .orderBy(virtualInterviewMessages.messageIndex);

    // Calculate remaining time
    const startTime = new Date(interview[0].startTime).getTime();
    const durationMs = interview[0].duration * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.createdAt,
        messageIndex: msg.messageIndex
      })),
      currentQuestionCount: interview[0].questionsAsked || 0,
      totalQuestions: interview[0].totalQuestions || 5,
      timeRemaining,
      status: interview[0].status
    });

  } catch (error) {
    console.error('Error getting interview messages:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// Send a message (user response)
router.post('/:sessionId/message', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id || req.session?.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Get interview
    const interview = await db.select()
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const currentInterview = interview[0];

    // Check if interview is still active
    if (currentInterview.status !== 'active') {
      return res.status(400).json({ message: 'Interview is no longer active' });
    }

    // Check time limit
    const startTime = new Date(currentInterview.startTime).getTime();
    const durationMs = currentInterview.duration * 60 * 1000;
    const elapsed = Date.now() - startTime;
    
    if (elapsed > durationMs) {
      // Auto-complete the interview
      await db.update(virtualInterviews)
        .set({ 
          status: 'completed',
          endTime: new Date()
        })
        .where(eq(virtualInterviews.id, currentInterview.id));

      return res.json({
        response: "Time's up! Your interview has been completed. Thank you for participating.",
        isComplete: true,
        shouldEndInterview: true,
        timeRemaining: 0
      });
    }

    // Process the user's message
    const context = {
      role: currentInterview.role,
      interviewType: currentInterview.interviewType,
      difficulty: currentInterview.difficulty,
      totalQuestions: currentInterview.totalQuestions,
      currentQuestionCount: currentInterview.questionsAsked || 0,
      personality: 'professional'
    };

    const result = await chatInterviewService.processUserResponse(
      currentInterview.id,
      message.trim(),
      context
    );

    // If interview is complete, update status
    if (result.shouldEndInterview) {
      await db.update(virtualInterviews)
        .set({ 
          status: 'completed',
          endTime: new Date()
        })
        .where(eq(virtualInterviews.id, currentInterview.id));
    }

    // Calculate remaining time
    const newElapsed = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - newElapsed) / 1000));

    res.json({
      response: result.message,
      isComplete: result.isComplete,
      shouldEndInterview: result.shouldEndInterview,
      timeRemaining,
      currentQuestionCount: context.currentQuestionCount + (result.isComplete ? 0 : 1)
    });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ message: 'Failed to process message' });
  }
});

// Complete interview manually
router.post('/:sessionId/complete', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;

    const interview = await db.select()
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await db.update(virtualInterviews)
      .set({ 
        status: 'completed',
        endTime: new Date()
      })
      .where(eq(virtualInterviews.id, interview[0].id));

    res.json({ message: 'Interview completed successfully' });

  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Failed to complete interview' });
  }
});

export default router;