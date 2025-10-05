import express from 'express';
import { db } from './db.js';
import { virtualInterviews, virtualInterviewMessages } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { chatInterviewService } from './chatInterviewService.js';
import { isAuthenticated, requireAuthForInterview } from './auth.js';
import { proctorService } from './proctorService.js';
import { behavioralAnalyzer } from './behavioralAnalyzer.js';
import crypto from 'crypto';

const router = express.Router();

// Device fingerprinting endpoint for chat interviews
router.post('/:sessionId/device-fingerprint', requireAuthForInterview, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const deviceData = req.body;
    
    console.log('📱 Received device fingerprint for chat interview:', sessionId);
    
    // Generate comprehensive device fingerprint
    const fingerprint = await proctorService.generateDeviceFingerprint(deviceData);
    
    // Validate environment
    const environmentValidation = await proctorService.validateEnvironment(deviceData);
    
    // Analyze browser security
    const browserSecurity = await proctorService.analyzeBrowserSecurity(deviceData);
    
    // Initialize proctoring session
    await proctorService.initializeSession(sessionId, req.user.id, {
      sessionType: 'chat_interview',
      securityLevel: 'high',
      enableScreenRecording: false,
      enableActivityTracking: true
    });
    
    console.log('🔍 Environment validation:', environmentValidation);
    console.log('🛡️ Browser security:', browserSecurity);
    
    res.json({
      success: true,
      fingerprint,
      environmentValidation,
      browserSecurity,
      riskLevel: environmentValidation.isVirtualMachine ? 'high' : 'low'
    });
  } catch (error) {
    console.error('Error processing device fingerprint:', error);
    res.status(500).json({ error: 'Failed to process device fingerprint' });
  }
});

// Violation reporting endpoint for chat interviews
router.post('/:sessionId/violation', requireAuthForInterview, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const violation = req.body;
    const userId = req.user.id;
    
    console.log(`🚨 Violation reported in chat interview: ${violation.type} for session ${sessionId}`);
    
    // Record violation with enhanced data
    await proctorService.recordViolation({
      ...violation,
      userId,
      sessionId
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({ error: 'Failed to record violation' });
  }
});

// Proctoring summary endpoint for chat interviews
router.post('/:sessionId/proctoring-summary', requireAuthForInterview, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { behavioralData, violations, deviceFingerprint, environmentData, riskScore } = req.body;
    const userId = req.user.id;
    
    console.log('📊 Generating proctoring summary for chat interview:', sessionId);
    
    // Generate behavioral analysis
    const behavioralProfile = behavioralAnalyzer.generateBehavioralProfile({
      ...behavioralData,
      userId,
      sessionId
    });
    
    // Generate comprehensive proctoring summary
    const proctoringSummary = await proctorService.generateProctoringSummary(sessionId);
    
    const summary = {
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      behavioralProfile,
      proctoringSummary,
      deviceFingerprint,
      environmentData,
      overallRiskScore: riskScore,
      recommendation: behavioralProfile.recommendation,
      violations: violations?.length || 0
    };
    
    console.log(`✅ Proctoring summary generated - Risk: ${behavioralProfile.riskAssessment}, Score: ${behavioralProfile.overallAuthenticity}%`);
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating proctoring summary:', error);
    res.status(500).json({ error: 'Failed to generate proctoring summary' });
  }
});

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
      // Update existing stats - handle potential null values
      await db.update(virtualInterviewStats)
        .set({ 
          totalInterviews: (stats.totalInterviews || 0) + 1,
          freeInterviewsUsed: (stats.freeInterviewsUsed || 0) + 1,
          lastInterviewDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(virtualInterviewStats.userId, userId));
    } else {
      // Create new stats record with proper field name
      await db.insert(virtualInterviewStats).values({
        userId,
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
        strongestSkills: [], // Initialize as empty array for text[] field
        improvingSkills: [], // Initialize as empty array for text[] field
        needsWorkSkills: [], // Initialize as empty array for text[] field
        totalTimeSpent: 0,
        averageSessionLength: 0,
        lastInterviewDate: new Date(),
        milestonesAchieved: [], // Initialize as empty array for text[] field
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
router.get('/:sessionId/messages', requireAuthForInterview, async (req: any, res) => {
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
    
    const currentInterview = interview[0];
    
    // If this is an assigned interview that hasn't been started, initialize it
    if (currentInterview.status === 'assigned') {
      const context = {
        role: currentInterview.role || 'software_engineer',
        interviewType: currentInterview.interviewType || 'technical',
        difficulty: currentInterview.difficulty || 'medium',
        totalQuestions: currentInterview.totalQuestions || 5,
        currentQuestionCount: 0,
        personality: currentInterview.interviewerPersonality || 'professional',
        companyName: currentInterview.company,
        jobDescription: currentInterview.jobDescription
      };
      
      // Start the interview with a greeting
      const greeting = await chatInterviewService.startInterviewChat(currentInterview.id, context);
      
      // Update status to active
      await db.update(virtualInterviews)
        .set({ 
          status: 'active',
          startTime: new Date()
        })
        .where(eq(virtualInterviews.id, currentInterview.id));
      
      currentInterview.status = 'active';
      currentInterview.startTime = new Date();
    }

    // Get all messages
    const messages = await db.select()
      .from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, currentInterview.id))
      .orderBy(virtualInterviewMessages.messageIndex);

    // Calculate remaining time
    const startTime = currentInterview.startTime ? new Date(currentInterview.startTime).getTime() : Date.now();
    const durationMs = (currentInterview.duration || 30) * 60 * 1000;
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
      currentQuestionCount: currentInterview.questionsAsked || 0,
      totalQuestions: currentInterview.totalQuestions || 5,
      timeRemaining,
      status: currentInterview.status
    });

  } catch (error) {
    console.error('Error getting interview messages:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// Send a message (user response)
router.post('/:sessionId/message', requireAuthForInterview, async (req: any, res) => {
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
router.post('/:sessionId/complete', requireAuthForInterview, async (req: any, res) => {
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

// Assign chat interview to candidate (recruiter functionality)
router.post('/assign', isAuthenticated, async (req: any, res) => {
  try {
    const {
      candidateId,
      jobPostingId,
      interviewType = 'technical',
      role,
      company,
      difficulty = 'medium',
      duration = 30,
      dueDate,
      interviewerPersonality = 'professional',
      jobDescription
    } = req.body;

    const recruiterId = req.user?.id || req.session?.user?.id;
    if (!recruiterId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Validate required fields
    if (!candidateId || !role || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate unique session ID for assigned interview
    const sessionId = `chat_assigned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create chat interview record in virtualInterviews table
    const interview = await db.insert(virtualInterviews).values({
      userId: candidateId,
      sessionId,
      role,
      interviewType,
      difficulty,
      duration,
      totalQuestions: 5,
      questionsAsked: 0,
      status: 'assigned',
      assignedBy: recruiterId,
      assignedAt: new Date(),
      dueDate: new Date(dueDate),
      jobPostingId: jobPostingId || null,
      assignmentType: 'recruiter_assigned',
      interviewerPersonality,
      company: company || '',
      jobDescription: jobDescription || ''
    }).returning();

    // Send email notification to candidate
    const { users } = await import('../shared/schema.js');
    const candidate = await db.select().from(users).where(eq(users.id, candidateId)).limit(1);
    const recruiter = await db.select().from(users).where(eq(users.id, recruiterId)).limit(1);

    if (candidate.length > 0) {
      const candidateEmail = candidate[0].email;
      const candidateName = candidate[0].firstName || candidate[0].lastName 
        ? `${candidate[0].firstName || ''} ${candidate[0].lastName || ''}`.trim()
        : 'Candidate';
      
      if (!candidateEmail) {
        throw new Error('Candidate email not found');
      }
      
      const interviewLink = `${process.env.BASE_URL || 'https://autojobr.com'}/chat-interview/${sessionId}`;
      
      // Use the email service to send notification
      const { sendEmail } = await import('./emailService.js');
      await sendEmail({
        to: candidateEmail,
        subject: `AI Interview Assignment - ${role} Position`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">AI Interview Assignment</h2>
            <p>Hello ${candidateName},</p>
            <p>You have been assigned an AI interview for the <strong>${role}</strong> position${company ? ` at ${company}` : ''}.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Interview Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Position:</strong> ${role}</li>
                ${company ? `<li style="margin: 8px 0;"><strong>Company:</strong> ${company}</li>` : ''}
                <li style="margin: 8px 0;"><strong>Type:</strong> AI Chat Interview</li>
                <li style="margin: 8px 0;"><strong>Duration:</strong> ${duration} minutes</li>
                <li style="margin: 8px 0;"><strong>Difficulty:</strong> ${difficulty}</li>
                <li style="margin: 8px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${interviewLink}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Start AI Interview
              </a>
            </div>

            <p><strong>What to Expect:</strong></p>
            <ul>
              <li>Conversational AI interview with real-time questions</li>
              <li>Questions tailored to the ${role} position</li>
              <li>Professional AI interviewer with ${interviewerPersonality} personality</li>
              <li>Comprehensive feedback and analysis</li>
            </ul>

            <p>Good luck with your interview!</p>
            <p>Best regards,<br>The AutoJobR Team</p>
          </div>
        `
      });

      // Mark email as sent
      await db.update(virtualInterviews)
        .set({ emailSent: true })
        .where(eq(virtualInterviews.id, interview[0].id));
    }

    res.json({
      message: 'AI Interview assigned successfully',
      sessionId,
      interviewId: interview[0].id
    });

  } catch (error) {
    console.error('Error assigning chat interview:', error);
    res.status(500).json({ message: 'Failed to assign interview' });
  }
});

// Get interview feedback for completed interviews
router.get('/:sessionId/feedback', requireAuthForInterview, async (req: any, res) => {
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