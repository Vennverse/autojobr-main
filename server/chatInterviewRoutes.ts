import express from 'express';
import { db } from './db.js';
import { virtualInterviews, virtualInterviewMessages } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { chatInterviewService } from './chatInterviewService.js';
import { isAuthenticated } from './auth.js';
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

// Get interview feedback for completed interviews
router.get('/:sessionId/feedback', isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Find the interview by sessionId and userId
    const interview = await db.select()
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId),
        eq(virtualInterviews.status, 'completed')
      ))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview not found or not completed' });
    }

    const interviewData = interview[0];

    // Get all messages for this interview
    const messages = await db.select()
      .from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, interviewData.id))
      .orderBy(virtualInterviewMessages.messageIndex);

    // Generate comprehensive feedback
    const feedback = {
      interviewId: interviewData.id,
      sessionId: sessionId,
      completedAt: interviewData.completedAt,
      duration: interviewData.duration,
      totalQuestions: interviewData.totalQuestions,
      questionsAsked: interviewData.questionsAsked || messages.filter(m => m.sender === 'interviewer').length,
      
      // Performance metrics
      performance: {
        overallScore: calculateOverallScore(messages),
        responseQuality: calculateAverageResponseQuality(messages),
        communicationSkills: analyzeCommunicationSkills(messages),
        technicalCompetency: analyzeTechnicalCompetency(messages),
        engagement: analyzeEngagement(messages)
      },
      
      // Detailed analysis
      strengths: identifyStrengths(messages),
      improvementAreas: identifyImprovementAreas(messages),
      keyInsights: generateKeyInsights(messages),
      recommendations: generateRecommendations(messages),
      
      // Interview analytics if available
      analytics: interviewData.analytics ? JSON.parse(interviewData.analytics) : null,
      
      // Message summary
      messageCount: messages.length,
      averageResponseTime: calculateAverageResponseTime(messages)
    };

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching chat interview feedback:', error);
    res.status(500).json({ message: 'Failed to fetch interview feedback' });
  }
});

// Helper functions for feedback generation
function calculateOverallScore(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  if (candidateMessages.length === 0) return 0;
  
  const totalQuality = candidateMessages.reduce((sum, msg) => {
    return sum + (msg.responseQuality || 50);
  }, 0);
  
  return Math.round(totalQuality / candidateMessages.length);
}

function calculateAverageResponseQuality(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate' && m.responseQuality);
  if (candidateMessages.length === 0) return 0;
  
  const totalQuality = candidateMessages.reduce((sum, msg) => sum + msg.responseQuality, 0);
  return Math.round(totalQuality / candidateMessages.length);
}

function analyzeCommunicationSkills(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  if (candidateMessages.length === 0) return 0;
  
  let score = 70; // Base score
  
  // Analyze clarity and coherence
  candidateMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    
    // Bonus for detailed responses
    if (wordCount > 50) score += 5;
    if (wordCount > 100) score += 5;
    
    // Bonus for professional language
    if (content.includes('experience') || content.includes('project')) score += 3;
    
    // Penalty for too short responses
    if (wordCount < 10) score -= 10;
  });
  
  return Math.min(100, Math.max(0, score));
}

function analyzeTechnicalCompetency(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  if (candidateMessages.length === 0) return 0;
  
  let score = 60; // Base score
  const technicalKeywords = [
    'algorithm', 'data structure', 'api', 'database', 'framework', 
    'optimization', 'scalability', 'architecture', 'design pattern',
    'testing', 'debugging', 'performance', 'security', 'integration'
  ];
  
  candidateMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    const keywordCount = technicalKeywords.filter(keyword => 
      content.includes(keyword)).length;
    
    score += keywordCount * 5;
    
    // Bonus for technical accuracy markers
    if (msg.technicalAccuracy && msg.technicalAccuracy > 70) {
      score += 15;
    }
  });
  
  return Math.min(100, Math.max(0, score));
}

function analyzeEngagement(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  if (candidateMessages.length === 0) return 0;
  
  let score = 70; // Base score
  
  candidateMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    
    // Positive engagement indicators
    if (content.includes('excited') || content.includes('interested') || 
        content.includes('passionate')) score += 10;
    
    // Questions show engagement
    if (content.includes('?')) score += 5;
    
    // Detailed responses show engagement
    if (wordCount > 75) score += 8;
    
    // Check sentiment if available
    if (msg.sentiment === 'positive') score += 5;
    if (msg.sentiment === 'negative') score -= 10;
  });
  
  return Math.min(100, Math.max(0, score));
}

function identifyStrengths(messages: any[]): string[] {
  const strengths: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return strengths;
  
  const avgWordCount = candidateMessages.reduce((sum, msg) => 
    sum + msg.content.split(/\s+/).length, 0) / candidateMessages.length;
  
  if (avgWordCount > 50) {
    strengths.push('Provides detailed and comprehensive responses');
  }
  
  const technicalMessages = candidateMessages.filter(msg => 
    msg.content.toLowerCase().includes('technical') || 
    msg.content.toLowerCase().includes('algorithm') ||
    msg.content.toLowerCase().includes('code')).length;
    
  if (technicalMessages > candidateMessages.length * 0.3) {
    strengths.push('Strong technical knowledge and communication');
  }
  
  const positiveMessages = candidateMessages.filter(msg => 
    msg.sentiment === 'positive').length;
    
  if (positiveMessages > candidateMessages.length * 0.4) {
    strengths.push('Positive attitude and enthusiasm');
  }
  
  if (candidateMessages.some(msg => msg.content.toLowerCase().includes('team'))) {
    strengths.push('Team collaboration awareness');
  }
  
  if (candidateMessages.some(msg => msg.content.toLowerCase().includes('problem'))) {
    strengths.push('Problem-solving mindset');
  }
  
  return strengths.slice(0, 5); // Limit to top 5 strengths
}

function identifyImprovementAreas(messages: any[]): string[] {
  const areas: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return areas;
  
  const avgWordCount = candidateMessages.reduce((sum, msg) => 
    sum + msg.content.split(/\s+/).length, 0) / candidateMessages.length;
  
  if (avgWordCount < 20) {
    areas.push('Provide more detailed responses to showcase expertise');
  }
  
  const shortResponses = candidateMessages.filter(msg => 
    msg.content.split(/\s+/).length < 10).length;
    
  if (shortResponses > candidateMessages.length * 0.5) {
    areas.push('Expand on answers with examples and context');
  }
  
  const avgResponseTime = calculateAverageResponseTime(messages);
  if (avgResponseTime > 120) { // More than 2 minutes
    areas.push('Consider preparing common interview topics for quicker responses');
  }
  
  const technicalAccuracy = candidateMessages.filter(msg => 
    msg.technicalAccuracy && msg.technicalAccuracy < 60).length;
    
  if (technicalAccuracy > 0) {
    areas.push('Review technical concepts for improved accuracy');
  }
  
  if (!candidateMessages.some(msg => msg.content.toLowerCase().includes('example'))) {
    areas.push('Include specific examples to support your answers');
  }
  
  return areas.slice(0, 4); // Limit to top 4 areas
}

function generateKeyInsights(messages: any[]): string[] {
  const insights: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return insights;
  
  insights.push(`Answered ${candidateMessages.length} questions with an average response length of ${Math.round(candidateMessages.reduce((sum, msg) => sum + msg.content.split(/\s+/).length, 0) / candidateMessages.length)} words`);
  
  const positiveResponses = candidateMessages.filter(msg => 
    msg.sentiment === 'positive').length;
  if (positiveResponses > 0) {
    insights.push(`Maintained positive attitude in ${Math.round((positiveResponses / candidateMessages.length) * 100)}% of responses`);
  }
  
  const technicalContent = candidateMessages.filter(msg => 
    msg.content.toLowerCase().match(/\b(technical|algorithm|code|database|api|framework)\b/)).length;
  if (technicalContent > 0) {
    insights.push(`Demonstrated technical knowledge in ${technicalContent} responses`);
  }
  
  return insights;
}

function generateRecommendations(messages: any[]): string[] {
  const recommendations: string[] = [];
  
  recommendations.push('Continue practicing technical interview questions to build confidence');
  recommendations.push('Prepare specific examples from your experience to illustrate your points');
  recommendations.push('Practice explaining complex concepts in simple terms');
  recommendations.push('Research the company and role to tailor your responses accordingly');
  
  return recommendations;
}

function calculateAverageResponseTime(messages: any[]): number {
  const candidateMessages = messages.filter(m => 
    m.sender === 'candidate' && m.responseTime && m.responseTime > 0);
    
  if (candidateMessages.length === 0) return 0;
  
  const totalTime = candidateMessages.reduce((sum, msg) => sum + msg.responseTime, 0);
  return Math.round(totalTime / candidateMessages.length);
}

export default router;