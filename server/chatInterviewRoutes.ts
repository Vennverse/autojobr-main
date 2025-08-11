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

    // Import the virtual interview stats table and update statistics
    const { virtualInterviewStats } = await import('../shared/schema.js');
    
    // Update interview statistics to track usage
    const currentStats = await db.select()
      .from(virtualInterviewStats)
      .where(eq(virtualInterviewStats.userId, userId))
      .limit(1);

    if (currentStats.length > 0) {
      const stats = currentStats[0];
      // Update existing stats
      await db.update(virtualInterviewStats)
        .set({ 
          totalInterviews: stats.totalInterviews + 1,
          freeInterviewsUsed: stats.freeInterviewsUsed + 1,
          lastInterviewDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(virtualInterviewStats.userId, userId));
    } else {
      // Create new stats record
      await db.insert(virtualInterviewStats).values({
        userId: userId,
        totalInterviews: 1,
        completedInterviews: 0,
        freeInterviewsUsed: 1,
        monthlyInterviewsUsed: 1,
        lastMonthlyReset: new Date(),
        averageScore: 0,
        bestScore: 0,
        improvementRate: 0,
        consistencyScore: 0,
        technicalInterviewAvg: 0,
        behavioralInterviewAvg: 0,
        systemDesignAvg: 0,
        strongestSkills: '',
        improvingSkills: '',
        needsWorkSkills: '',
        totalTimeSpent: 0,
        averageSessionLength: 0,
        lastInterviewDate: new Date(),
        milestonesAchieved: '',
        nextMilestone: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
      status: 'active'
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
    const startTime = interview[0].startTime ? new Date(interview[0].startTime).getTime() : Date.now();
    const durationMs = (interview[0].duration || 30) * 60 * 1000;
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
    const startTime = currentInterview.startTime ? new Date(currentInterview.startTime).getTime() : Date.now();
    const durationMs = (currentInterview.duration || 30) * 60 * 1000;
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
      role: currentInterview.role || 'software_engineer',
      interviewType: currentInterview.interviewType || 'technical',
      difficulty: currentInterview.difficulty || 'medium',
      totalQuestions: currentInterview.totalQuestions || 5,
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

    // Find the interview by sessionId and userId - allow both completed and active interviews
    const interview = await db.select()
      .from(virtualInterviews)
      .where(and(
        eq(virtualInterviews.sessionId, sessionId),
        eq(virtualInterviews.userId, userId)
      ))
      .limit(1);

    if (!interview.length) {
      return res.status(404).json({ message: 'Interview session not found. Please check the session ID and try again.' });
    }

    const interviewData = interview[0];
    
    // If interview is still active, auto-complete it to allow feedback viewing
    if (interviewData.status === 'active') {
      await db.update(virtualInterviews)
        .set({ 
          status: 'completed',
          endTime: new Date()
        })
        .where(eq(virtualInterviews.id, interviewData.id));
      
      // Update local copy for feedback generation
      interviewData.status = 'completed';
      interviewData.endTime = new Date();
    }

    // Get all messages for this interview
    const messages = await db.select()
      .from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, interviewData.id))
      .orderBy(virtualInterviewMessages.messageIndex);

    // Generate comprehensive feedback
    const feedback = {
      interviewId: interviewData.id,
      sessionId: sessionId,
      completedAt: interviewData.endTime,
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
    
  if (positiveMessages > candidateMessages.length * 0.5) {
    strengths.push('Maintains positive and professional communication');
  }
  
  return strengths.length > 0 ? strengths : ['Shows engagement and participation in the interview'];
}

function identifyImprovementAreas(messages: any[]): string[] {
  const areas: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return areas;
  
  const avgWordCount = candidateMessages.reduce((sum, msg) => 
    sum + msg.content.split(/\s+/).length, 0) / candidateMessages.length;
  
  if (avgWordCount < 20) {
    areas.push('Provide more detailed responses to demonstrate depth of knowledge');
  }
  
  const technicalMessages = candidateMessages.filter(msg => 
    msg.content.toLowerCase().includes('technical') || 
    msg.content.toLowerCase().includes('algorithm')).length;
    
  if (technicalMessages < candidateMessages.length * 0.2) {
    areas.push('Include more technical details and examples in responses');
  }
  
  const questionsAsked = candidateMessages.filter(msg => 
    msg.content.includes('?')).length;
    
  if (questionsAsked === 0) {
    areas.push('Ask clarifying questions to show curiosity and engagement');
  }
  
  return areas.length > 0 ? areas : ['Continue developing communication and technical skills'];
}

function generateKeyInsights(messages: any[]): string[] {
  const insights: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return insights;
  
  const avgResponseTime = candidateMessages.reduce((sum, msg) => 
    sum + (msg.responseTime || 30), 0) / candidateMessages.length;
  
  if (avgResponseTime < 15) {
    insights.push('Quick thinking and response time demonstrates preparedness');
  } else if (avgResponseTime > 60) {
    insights.push('Takes time to formulate thoughtful responses');
  }
  
  const avgQuality = candidateMessages.reduce((sum, msg) => 
    sum + (msg.responseQuality || 50), 0) / candidateMessages.length;
  
  if (avgQuality > 75) {
    insights.push('Consistently high-quality responses throughout the interview');
  }
  
  return insights.length > 0 ? insights : ['Participated actively in the interview process'];
}

function generateRecommendations(messages: any[]): string[] {
  const recommendations: string[] = [];
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  
  if (candidateMessages.length === 0) return recommendations;
  
  const avgWordCount = candidateMessages.reduce((sum, msg) => 
    sum + msg.content.split(/\s+/).length, 0) / candidateMessages.length;
  
  if (avgWordCount < 30) {
    recommendations.push('Practice elaborating on answers with specific examples and details');
  }
  
  const technicalTerms = candidateMessages.filter(msg => {
    const content = msg.content.toLowerCase();
    return content.includes('algorithm') || content.includes('data structure') || 
           content.includes('api') || content.includes('database');
  }).length;
  
  if (technicalTerms < 2) {
    recommendations.push('Strengthen technical vocabulary and discuss more technical concepts');
  }
  
  recommendations.push('Continue practicing interview skills and technical communication');
  recommendations.push('Consider doing more mock interviews to build confidence');
  
  return recommendations;
}

function calculateAverageResponseTime(messages: any[]): number {
  const candidateMessages = messages.filter(m => m.sender === 'candidate' && m.responseTime);
  if (candidateMessages.length === 0) return 0;
  
  const totalTime = candidateMessages.reduce((sum, msg) => sum + (msg.responseTime || 30), 0);
  return Math.round(totalTime / candidateMessages.length);
}

export default router;