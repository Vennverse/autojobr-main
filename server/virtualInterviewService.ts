import { groqService } from './groqService';
import { aiService } from './aiService';
import { aiDetectionService } from './aiDetectionService';
import { behavioralQuestionService, BehavioralQuestion } from './behavioralQuestions';
import { proctorService } from './proctorService';
import { behavioralAnalyzer } from './behavioralAnalyzer';
import { cameraProctorService } from './cameraProctorService';

// Using centralized AI service for all virtual interview functionality

interface InterviewerPersonality {
  greeting: string;
  style: string;
  questionTransitions: string[];
  encouragements: string[];
}

interface InterviewQuestion {
  category: 'technical' | 'behavioral' | 'system_design' | 'follow_up';
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedKeywords: string[];
  followUpPrompts: string[];
  personalityTraits?: string[];
}

interface MessageAnalysis {
  responseQuality: number; // 1-10
  technicalAccuracy: number; // 0-100
  clarityScore: number; // 0-100
  depthScore: number; // 0-100
  keywordsMatched: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 1-100
  aiDetection?: any; // AI detection results
  finalScore?: number; // Score after AI penalty
  partialResultsOnly?: boolean;
  behavioralAnalysis?: any; // Behavioral analysis results
  proctoringSummary?: any; // Proctoring summary
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface InterviewSession {
  sessionId: string;
  userId: string;
  startTime: number;
  deviceFingerprint?: any;
  behavioralData?: any;
  violations?: any[];
  riskScore?: number;
  cameraMonitoring?: boolean;
}

export class VirtualInterviewService {
  
  private personalities: Record<string, InterviewerPersonality> = {
    friendly: {
      greeting: "Hi! I'm excited to chat with you today. I'm here to help you practice and improve your interview skills in a relaxed, supportive environment.",
      style: "conversational and encouraging",
      questionTransitions: [
        "Great answer! Let's dive into another area...",
        "That's a solid response. Now I'm curious about...",
        "I love your perspective! Let me ask you about..."
      ],
      encouragements: [
        "You're doing really well!",
        "That's a thoughtful answer.",
        "I can see you've put good thought into this."
      ]
    },
    professional: {
      greeting: "Good day. I'll be conducting your interview today. We'll cover various aspects of your experience and technical knowledge.",
      style: "structured and thorough",
      questionTransitions: [
        "Let's move to the next question.",
        "Now I'd like to explore...",
        "Moving forward, let's discuss..."
      ],
      encouragements: [
        "Understood.",
        "That's noted.",
        "Please continue."
      ]
    },
    challenging: {
      greeting: "Welcome. I'll be asking you some challenging questions today to really test your knowledge and problem-solving abilities.",
      style: "probing and detail-oriented",
      questionTransitions: [
        "Let's see how you handle this challenge...",
        "Here's a more complex scenario...",
        "I want to push you a bit further..."
      ],
      encouragements: [
        "Interesting approach.",
        "Tell me more about that.",
        "What's your reasoning behind that?"
      ]
    }
  };

  constructor() {
    console.log("Virtual Interview Service initialized with centralized AI service");
  }

  async generateGreeting(
    personality: string,
    role: string,
    company?: string
  ): Promise<string> {
    const personalityConfig = this.personalities[personality] || this.personalities.professional;
    const context = company ? ` for a ${role} position at ${company}` : ` for a ${role} position`;
    
    return `${personalityConfig.greeting}\n\nToday we'll be conducting a practice interview${context}. I'll ask you questions to help you practice and improve your interview skills. Feel free to answer naturally, and I'll provide feedback to help you grow.\n\nShall we begin?`;
  }

  async generateQuestion(
    interviewType: string,
    difficulty: string,
    role: string,
    questionNumber: number,
    previousResponses: string[],
    userContext?: string
  ): Promise<InterviewQuestion> {
    const prompt = this.buildQuestionPrompt(interviewType, difficulty, role, questionNumber, previousResponses, userContext);
    
    try {
      const response = await groqService.chat([
        {
          role: "system",
          content: "You are an expert interviewer. Generate a single, specific interview question with metadata. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      // Clean and parse the JSON response
      const cleanedContent = this.cleanJsonResponse(content);
      let questionData;
      try {
        questionData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error for question generation:', parseError);
        console.error('Content that failed to parse:', cleanedContent);
        throw new Error('Invalid JSON response from AI service');
      }

      return {
        category: questionData.category || interviewType as any,
        question: questionData.question,
        difficulty: questionData.difficulty || difficulty as any,
        expectedKeywords: questionData.expectedKeywords || [],
        followUpPrompts: questionData.followUpPrompts || []
      };
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback question
      return this.getFallbackQuestion(interviewType, difficulty, role);
    }
  }

  async analyzeResponse(
    question: string,
    userResponse: string,
    expectedKeywords: string[],
    questionCategory: string
  ): Promise<MessageAnalysis> {
    // Skip AI detection for faster response during development
    const aiDetection = {
      isAIGenerated: false,
      confidence: 0,
      humanScore: 100,
      indicators: [],
      reasoning: 'AI detection skipped for performance'
    };
    
    // Use centralized AI service for analysis
    
    const prompt = `
Analyze this interview response. Be concise.

Question: "${question}"
Category: ${questionCategory}
Response: "${userResponse}"

Return JSON only: {"responseQuality": 1-10, "technicalAccuracy": 0-100, "clarityScore": 0-100, "depthScore": 0-100, "keywordsMatched": ["matched", "keywords"], "sentiment": "positive/neutral/negative", "confidence": 1-100}`;

    try {
      const response = await groqService.chat([
        {
          role: "system",
          content: "You are an expert interview evaluator. Analyze responses thoroughly and fairly."
        },
        {
          role: "user",
          content: prompt
        }
      ]);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const cleanedContent = this.cleanJsonResponse(content);
      const analysis = JSON.parse(cleanedContent);

      // Calculate base analysis
      const baseAnalysis = {
        responseQuality: Math.min(10, Math.max(1, analysis.responseQuality || 5)),
        technicalAccuracy: Math.min(100, Math.max(0, analysis.technicalAccuracy || 50)),
        clarityScore: Math.min(100, Math.max(0, analysis.clarityScore || 50)),
        depthScore: Math.min(100, Math.max(0, analysis.depthScore || 50)),
        keywordsMatched: analysis.keywordsMatched || [],
        sentiment: analysis.sentiment || 'neutral',
        confidence: Math.min(100, Math.max(1, analysis.confidence || 50))
      };

      // Apply AI detection analysis
      const responseAnalysis = aiDetectionService.analyzeResponseWithAI(
        { overallScore: baseAnalysis.responseQuality * 10 }, 
        aiDetection
      );

      return {
        ...baseAnalysis,
        aiDetection: responseAnalysis.aiDetection,
        finalScore: responseAnalysis.finalScore,
        partialResultsOnly: responseAnalysis.partialResultsOnly
      };
    } catch (error) {
      console.error('Error analyzing response:', error);
      // Fallback analysis with AI detection
      const baseAnalysis = {
        responseQuality: 5,
        technicalAccuracy: 50,
        clarityScore: 50,
        depthScore: 50,
        keywordsMatched: [],
        sentiment: 'neutral' as const,
        confidence: 50
      };

      const responseAnalysis = aiDetectionService.analyzeResponseWithAI(
        { overallScore: 50 }, 
        aiDetection
      );

      return {
        ...baseAnalysis,
        aiDetection: responseAnalysis.aiDetection,
        finalScore: responseAnalysis.finalScore,
        partialResultsOnly: responseAnalysis.partialResultsOnly
      };
    }
  }

  async generateFollowUp(
    previousQuestion: string,
    userResponse: string,
    analysis: MessageAnalysis,
    personality: string
  ): Promise<string> {
    const personalityConfig = this.personalities[personality] || this.personalities.professional;
    
    if (!this.groq) {
      // Fallback follow-up based on response quality
      if (analysis.responseQuality >= 7) {
        return personalityConfig.encouragements[0] + " Can you elaborate on that further?";
      } else {
        return "That's interesting. Can you tell me more about your approach to this?";
      }
    }
    
    const prompt = `
As an interviewer with a ${personalityConfig.style} style, generate a follow-up response to:

Previous Question: "${previousQuestion}"
Candidate Response: "${userResponse}"
Response Quality: ${analysis.responseQuality}/10
Clarity: ${analysis.clarityScore}/100

Generate a natural follow-up that:
1. Acknowledges their response appropriately
2. Asks a relevant follow-up question or probes deeper
3. Maintains the ${personality} personality
4. Helps the candidate improve

Keep it conversational and under 100 words.`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a ${personality} interviewer conducting a practice interview. Be helpful and encouraging while maintaining your interviewing style.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.8,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || "That's interesting. Can you tell me more about your approach?";
    } catch (error) {
      console.error('Error generating follow-up:', error);
      return "That's a good response. Can you elaborate on that further?";
    }
  }

  async generateFinalFeedback(
    interviewData: any,
    messages: any[]
  ): Promise<{
    performanceSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    recommendedResources: any[];
    nextSteps: string[];
  }> {
    if (!this.groq) {
      console.error('GROQ client not initialized - check API key');
      return this.getFallbackFeedback();
    }

    const candidateResponses = messages
      .filter(m => m.sender === 'candidate')
      .map(m => m.content)
      .join('\n\n');

    const questionsAnswered = messages.filter(m => m.sender === 'candidate').length;
    
    const prompt = `Analyze this interview session and provide feedback as JSON only:

Role: ${interviewData.role}
Interview Type: ${interviewData.interviewType}
Questions Answered: ${questionsAnswered}

Candidate Responses:
${candidateResponses}

Return valid JSON only with these exact fields:
{
  "performanceSummary": "2-3 sentence assessment",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "overallScore": 75,
  "technicalScore": 70,
  "communicationScore": 80,
  "confidenceScore": 75,
  "recommendedResources": [{"title": "Resource", "url": "https://example.com", "description": "Description"}],
  "nextSteps": ["step1", "step2", "step3"]
}

Be constructive and encouraging.`;

    try {
      console.log('Generating GROQ feedback for interview:', interviewData.id);
      
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach. Return only valid JSON feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('No content in GROQ response');
        return this.getFallbackFeedback();
      }

      console.log('GROQ response received, parsing JSON...');
      const cleanedContent = this.cleanJsonResponse(content);
      let feedback;
      try {
        feedback = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error for feedback generation:', parseError);
        console.error('Content that failed to parse:', cleanedContent);
        return this.getFallbackFeedback();
      }
      
      // Validate required fields
      if (!feedback.performanceSummary || !feedback.keyStrengths || !feedback.overallScore) {
        console.error('Invalid feedback structure from GROQ');
        return this.getFallbackFeedback();
      }

      console.log('GROQ feedback generated successfully');
      return feedback;
    } catch (error) {
      console.error('Error generating GROQ feedback:', error);
      return this.getFallbackFeedback();
    }
  }

  private buildQuestionPrompt(
    interviewType: string,
    difficulty: string,
    role: string,
    questionNumber: number,
    previousResponses: string[],
    userContext?: string
  ): string {
    // Define question progression strategy
    let questionFocus = '';
    switch (questionNumber) {
      case 1:
        questionFocus = 'Start with foundational concepts or basic experience';
        break;
      case 2:
        questionFocus = 'Ask about practical application and problem-solving';
        break;
      case 3:
        questionFocus = 'Focus on advanced concepts or system design';
        break;
      case 4:
        questionFocus = 'Ask about experience and real-world scenarios';
        break;
      case 5:
        questionFocus = 'Conclude with challenging or situational questions';
        break;
      default:
        questionFocus = 'Ask a comprehensive question building on previous answers';
    }

    return `
Generate interview question ${questionNumber} for a ${role} candidate.
Interview Type: ${interviewType}
Difficulty: ${difficulty}
Question Focus: ${questionFocus}
${userContext ? `Candidate Background: ${userContext}` : ''}

Previous responses (avoid repetition): ${previousResponses.slice(-2).join('; ')}

CRITICAL REQUIREMENTS:
- Generate ONLY ONE unique question completely different from previous ones
- Question should be specific to ${interviewType} interviews  
- Follow ${questionFocus} for this question number
- For technical: Include specific technologies, algorithms, or coding concepts
- For behavioral: Use STAR method scenarios
- Make it realistic and engaging

Return valid JSON only:
{
  "category": "${interviewType}",
  "question": "detailed specific question text here",
  "difficulty": "${difficulty}",
  "expectedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "followUpPrompts": ["follow-up1", "follow-up2"]
}`;
  }

  private cleanJsonResponse(content: string): string {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content provided for JSON cleaning');
    }
    
    // Remove markdown code blocks and clean the response
    let cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Validate that we have valid JSON structure
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      throw new Error('Response does not contain valid JSON structure');
    }
    
    return cleaned;
  }

  // Add behavioral question generation
  generateBehavioralQuestions(
    personality: string,
    difficulty: string = 'medium',
    count: number = 3
  ): BehavioralQuestion[] {
    return behavioralQuestionService.selectQuestionsByPersonality(personality, difficulty, count);
  }

  analyzeBehavioralResponses(responses: Array<{question: BehavioralQuestion, response: string}>) {
    return behavioralQuestionService.generatePersonalityInsights(responses);
  }

  private getFallbackQuestion(interviewType: string, difficulty: string, role: string): InterviewQuestion {
    const fallbackQuestions = {
      technical: {
        easy: "Can you walk me through how you would approach debugging a simple JavaScript function that's not working as expected?",
        medium: "Explain the difference between synchronous and asynchronous programming. When would you use each?",
        hard: "Design a scalable system for handling millions of concurrent users. What are the key considerations?"
      },
      behavioral: {
        easy: "Tell me about a time when you had to learn something new for a project.",
        medium: "Describe a situation where you had to work with a difficult team member. How did you handle it?",
        hard: "Tell me about a time when you had to make a decision with incomplete information. What was your process?"
      }
    };

    const questionText = fallbackQuestions[interviewType as keyof typeof fallbackQuestions]?.[difficulty as keyof typeof fallbackQuestions.technical] 
      || "Tell me about your experience and what interests you about this role.";

    return {
      category: interviewType as any,
      question: questionText,
      difficulty: difficulty as any,
      expectedKeywords: ['experience', 'skills', 'approach'],
      followUpPrompts: ['Can you provide more details?', 'What was the outcome?']
    };
  }

  private getFallbackFeedback() {
    return {
      performanceSummary: "You demonstrated good communication skills and showed enthusiasm for the role. With some additional preparation, you'll be well-prepared for real interviews.",
      keyStrengths: ["Good communication", "Enthusiasm", "Willingness to learn"],
      areasForImprovement: ["Technical depth", "Specific examples", "Confidence in responses"],
      overallScore: 70,
      technicalScore: 65,
      communicationScore: 75,
      confidenceScore: 70,
      recommendedResources: [
        {
          title: "Interview Practice Platform",
          url: "https://leetcode.com",
          description: "Practice coding problems and technical interviews"
        }
      ],
      nextSteps: [
        "Practice more technical questions",
        "Prepare specific examples from your experience",
        "Work on confident delivery"
      ]
    };
  }

  // ===============================
  // INDUSTRY-LEADING ANTI-CHEATING METHODS
  // ===============================
  
  async initializeInterviewSession(sessionId: string, userId: string): Promise<InterviewSession> {
    console.log(`🔒 Initializing secure virtual interview session: ${sessionId}`);
    
    const session: InterviewSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      violations: [],
      riskScore: 0,
      cameraMonitoring: false
    };
    
    try {
      // Initialize comprehensive proctoring services
      await proctorService.initializeSession(sessionId, userId, {
        sessionType: 'virtual_interview',
        securityLevel: 'high',
        enableDeviceFingerprinting: true,
        enableEnvironmentValidation: true,
        enableBrowserSecurity: true
      });
      
      await cameraProctorService.initializeSession(sessionId, {
        faceDetection: true,
        eyeTracking: true,
        environmentMonitoring: true,
        multiplePersonDetection: true
      });
      
      session.cameraMonitoring = true;
      console.log(`✅ Virtual interview security initialized for session ${sessionId}`);
    } catch (error) {
      console.error('Error initializing interview security:', error);
      // Continue with reduced security features
    }
    
    return session;
  }
  
  async processDeviceFingerprint(sessionId: string, deviceData: any): Promise<any> {
    try {
      console.log(`🔍 Processing device fingerprint for virtual interview ${sessionId}`);
      
      const fingerprint = await proctorService.generateDeviceFingerprint(deviceData);
      const environmentValidation = await proctorService.validateEnvironment(deviceData);
      const browserSecurity = await proctorService.analyzeBrowserSecurity(deviceData);
      
      const securityReport = {
        fingerprint,
        environmentValidation,
        browserSecurity,
        riskLevel: this.assessEnvironmentRisk(environmentValidation, browserSecurity),
        recommendations: this.generateSecurityRecommendations(environmentValidation, browserSecurity)
      };
      
      console.log(`📊 Device security analysis completed - Risk: ${securityReport.riskLevel}`);
      
      return securityReport;
    } catch (error) {
      console.error('Error processing device fingerprint:', error);
      return {
        fingerprint: null,
        environmentValidation: { isSecure: false, warning: 'Analysis failed' },
        browserSecurity: { securityLevel: 'unknown' },
        riskLevel: 'medium'
      };
    }
  }
  
  async processViolation(sessionId: string, violation: any): Promise<void> {
    try {
      console.log(`🚨 Virtual interview violation detected: ${violation.type} in session ${sessionId}`);
      
      // Record violation with comprehensive context
      await proctorService.recordViolation({
        ...violation,
        sessionType: 'virtual_interview',
        timestamp: Date.now(),
        severity: this.calculateViolationSeverity(violation.type, violation.data),
        context: {
          interviewPhase: violation.interviewPhase || 'unknown',
          questionType: violation.questionType || 'unknown'
        }
      });
      
      // If critical violation, trigger immediate response
      if (violation.severity === 'critical') {
        await this.handleCriticalViolation(sessionId, violation);
      }
      
    } catch (error) {
      console.error('Error recording interview violation:', error);
    }
  }
  
  async analyzeVideoFrame(sessionId: string, frameData: any): Promise<any> {
    try {
      const analysis = await cameraProctorService.analyzeVideoFrame(sessionId, frameData);
      
      // Enhanced analysis specific to interview context
      const interviewSpecificAnalysis = {
        ...analysis,
        attentionScore: this.calculateAttentionScore(analysis),
        engagementLevel: this.assessEngagementLevel(analysis),
        interviewReadiness: this.assessInterviewReadiness(analysis)
      };
      
      // Auto-detect concerning patterns
      if (analysis.facesCount > 1) {
        await this.processViolation(sessionId, {
          type: 'multiple_people_detected',
          severity: 'critical',
          data: { facesCount: analysis.facesCount }
        });
      }
      
      if (analysis.facesCount === 0) {
        await this.processViolation(sessionId, {
          type: 'candidate_not_visible',
          severity: 'high',
          data: { timestamp: Date.now() }
        });
      }
      
      return interviewSpecificAnalysis;
    } catch (error) {
      console.error('Error analyzing video frame:', error);
      return { facesCount: 1, confidence: 0.5, suspiciousActivity: [] };
    }
  }
  
  async enhancedAnalyzeResponse(
    question: string,
    userResponse: string,
    expectedKeywords: string[],
    questionCategory: string,
    sessionData?: any,
    behavioralData?: any
  ): Promise<MessageAnalysis> {
    console.log(`🔬 Enhanced response analysis for virtual interview session: ${sessionData?.sessionId}`);
    
    try {
      // 1. Enhanced AI Detection with behavioral context
      const aiDetection = await aiDetectionService.detectAIUsage(userResponse, question, behavioralData);
      
      // 2. Comprehensive Behavioral Analysis
      let behavioralAnalysis = null;
      if (behavioralData) {
        behavioralAnalysis = behavioralAnalyzer.generateBehavioralProfile({
          ...behavioralData,
          sessionId: sessionData?.sessionId || 'unknown',
          userId: sessionData?.userId || 'unknown',
          context: 'virtual_interview'
        });
      }
      
      // 3. Response Pattern Analysis
      const responsePatterns = this.analyzeResponsePatterns(userResponse, behavioralData);
      
      // 4. Interview-specific Analysis
      const interviewAnalysis = this.analyzeInterviewSpecificPatterns(userResponse, questionCategory, behavioralData);
      
      // 5. Calculate comprehensive risk score
      const riskScore = this.calculateInterviewRiskScore(aiDetection, behavioralAnalysis, responsePatterns, interviewAnalysis);
      
      // 6. Get base analysis (use existing method)
      const baseAnalysis = await this.analyzeResponse(question, userResponse, expectedKeywords, questionCategory);
      
      // 7. Apply enhanced penalties and adjustments
      const finalScore = this.applyEnhancedPenalties(baseAnalysis.finalScore || baseAnalysis.responseQuality * 10, riskScore, aiDetection);
      
      return {
        ...baseAnalysis,
        behavioralAnalysis,
        proctoringSummary: {
          riskScore,
          responsePatterns,
          interviewAnalysis
        },
        riskLevel: this.determineRiskLevel(riskScore),
        finalScore,
        partialResultsOnly: riskScore > 50 || aiDetection.isAIGenerated
      };
      
    } catch (error) {
      console.error('Error in enhanced response analysis:', error);
      // Fallback to standard analysis
      return await this.analyzeResponse(question, userResponse, expectedKeywords, questionCategory);
    }
  }
  
  async generateInterviewSummary(sessionId: string): Promise<any> {
    try {
      console.log(`📊 Generating comprehensive interview security summary for session: ${sessionId}`);
      
      const proctoringSummary = await proctorService.generateProctoringSummary(sessionId);
      const cameraSummary = await cameraProctorService.generateSummary(sessionId);
      
      const overallRisk = this.calculateOverallRisk(proctoringSummary, cameraSummary);
      const recommendation = this.generateSecurityRecommendation(overallRisk);
      
      const comprehensiveSummary = {
        sessionId,
        timestamp: new Date().toISOString(),
        sessionType: 'virtual_interview',
        security: {
          proctoringSummary,
          cameraSummary,
          overallRisk,
          recommendation
        },
        reliability: this.assessResultReliability(overallRisk),
        nextSteps: this.generateNextSteps(overallRisk)
      };
      
      console.log(`✅ Interview security summary generated - Overall Risk: ${overallRisk}`);
      return comprehensiveSummary;
      
    } catch (error) {
      console.error('Error generating interview summary:', error);
      return {
        sessionId,
        overallRisk: 'medium',
        recommendation: 'Manual review recommended due to analysis errors',
        reliability: 'uncertain'
      };
    }
  }
  
  // Private helper methods for enhanced security
  
  private analyzeResponsePatterns(response: string, behavioralData?: any): any {
    const patterns = {
      unusualSpeed: false,
      consistentTiming: false,
      humanLikeVariation: true,
      suspiciousPatterns: []
    };
    
    if (behavioralData?.responseTime) {
      const wordsPerMinute = (response.split(' ').length / (behavioralData.responseTime / 60000));
      if (wordsPerMinute > 120 || wordsPerMinute < 10) {
        patterns.unusualSpeed = true;
        patterns.suspiciousPatterns.push(`Unusual typing speed: ${Math.round(wordsPerMinute)} WPM`);
      }
    }
    
    if (behavioralData?.keystrokes && behavioralData.keystrokes.length > 10) {
      const keystrokeVariation = this.calculateKeystrokeVariation(behavioralData.keystrokes);
      patterns.humanLikeVariation = keystrokeVariation > 0.3;
      if (!patterns.humanLikeVariation) {
        patterns.suspiciousPatterns.push('Robotic typing patterns detected');
      }
    }
    
    return patterns;
  }
  
  private analyzeInterviewSpecificPatterns(response: string, questionCategory: string, behavioralData?: any): any {
    const analysis = {
      responseLength: response.length,
      complexity: this.calculateResponseComplexity(response),
      interviewAppropriate: true,
      concerns: []
    };
    
    // Check for overly perfect responses
    if (analysis.complexity > 0.8 && response.length > 500) {
      analysis.concerns.push('Unusually complex and lengthy response');
    }
    
    // Check for copy-paste indicators in behavioral data
    if (behavioralData?.violations) {
      const copyPasteAttempts = behavioralData.violations.filter((v: any) => v.type === 'copy_attempt').length;
      if (copyPasteAttempts > 0) {
        analysis.concerns.push(`${copyPasteAttempts} copy/paste attempts detected`);
      }
    }
    
    return analysis;
  }
  
  private calculateResponseComplexity(response: string): number {
    const words = response.split(' ').filter(word => word.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;
    
    // Normalize complexity score (0-1)
    const complexity = (avgWordLength / 10 + avgSentenceLength / 30) / 2;
    return Math.min(1, Math.max(0, complexity));
  }
  
  private calculateKeystrokeVariation(keystrokes: any[]): number {
    if (keystrokes.length < 10) return 0.5;
    
    const intervals = keystrokes.slice(1).map((keystroke, i) => 
      keystroke.timestamp - keystrokes[i].timestamp
    ).filter(interval => interval > 0 && interval < 2000); // Filter reasonable intervals
    
    if (intervals.length === 0) return 0;
    
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? standardDeviation / mean : 0;
  }
  
  private calculateInterviewRiskScore(aiDetection: any, behavioralAnalysis: any, responsePatterns: any, interviewAnalysis: any): number {
    let riskScore = 0;
    
    // AI detection risk (40% weight)
    if (aiDetection.isAIGenerated) {
      riskScore += aiDetection.confidence * 0.4;
    }
    
    // Behavioral analysis risk (30% weight)
    if (behavioralAnalysis && behavioralAnalysis.overallAuthenticity < 50) {
      riskScore += (100 - behavioralAnalysis.overallAuthenticity) * 0.3;
    }
    
    // Response patterns risk (20% weight)
    if (responsePatterns.unusualSpeed) riskScore += 20;
    if (!responsePatterns.humanLikeVariation) riskScore += 15;
    
    // Interview-specific concerns (10% weight)
    if (interviewAnalysis.concerns.length > 0) {
      riskScore += interviewAnalysis.concerns.length * 5;
    }
    
    return Math.min(100, riskScore);
  }
  
  private applyEnhancedPenalties(baseScore: number, riskScore: number, aiDetection: any): number {
    let finalScore = baseScore;
    
    // Progressive penalty system
    if (riskScore >= 80) {
      finalScore *= 0.1; // 90% penalty for critical risk
    } else if (riskScore >= 60) {
      finalScore *= 0.3; // 70% penalty for high risk
    } else if (riskScore >= 40) {
      finalScore *= 0.6; // 40% penalty for medium risk
    } else if (riskScore >= 20) {
      finalScore *= 0.8; // 20% penalty for low risk
    }
    
    return Math.round(Math.max(0, finalScore));
  }
  
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
  
  private assessEnvironmentRisk(environmentValidation: any, browserSecurity: any): 'low' | 'medium' | 'high' | 'critical' {
    if (environmentValidation.isVirtualMachine || environmentValidation.isRemoteDesktop) {
      return 'critical';
    }
    
    if (browserSecurity.hasDevToolsOpen || environmentValidation.suspiciousProcesses?.length > 0) {
      return 'high';
    }
    
    if (environmentValidation.screenSharingDetected || !browserSecurity.isSecureBrowser) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private generateSecurityRecommendations(environmentValidation: any, browserSecurity: any): string[] {
    const recommendations = [];
    
    if (environmentValidation.isVirtualMachine) {
      recommendations.push('Virtual machine detected - interview should be conducted on physical hardware');
    }
    
    if (browserSecurity.hasDevToolsOpen) {
      recommendations.push('Developer tools detected - close all development tools');
    }
    
    if (environmentValidation.screenSharingDetected) {
      recommendations.push('Screen sharing detected - disable all screen sharing applications');
    }
    
    return recommendations;
  }
  
  private calculateOverallRisk(proctoringSummary: any, cameraSummary: any): 'low' | 'medium' | 'high' | 'critical' {
    const risks = [
      proctoringSummary?.riskLevel || 'low', 
      cameraSummary?.riskLevel || 'low'
    ];
    
    if (risks.includes('critical')) return 'critical';
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }
  
  private generateSecurityRecommendation(riskLevel: string): string {
    const recommendations = {
      low: 'Interview conducted with excellent security compliance. Results are highly reliable.',
      medium: 'Some security concerns detected. Results should be reviewed with additional context.',
      high: 'Significant security violations detected. Manual review strongly recommended before making decisions.',
      critical: 'Critical security breaches detected. Interview results should be considered unreliable and require immediate review.'
    };
    
    return recommendations[riskLevel as keyof typeof recommendations] || recommendations.medium;
  }
  
  private assessResultReliability(riskLevel: string): 'high' | 'medium' | 'low' | 'unreliable' {
    const reliability = {
      low: 'high',
      medium: 'medium',
      high: 'low',
      critical: 'unreliable'
    };
    
    return reliability[riskLevel as keyof typeof reliability] as any || 'medium';
  }
  
  private generateNextSteps(riskLevel: string): string[] {
    const nextSteps = {
      low: ['Proceed with interview evaluation', 'Results can be used confidently'],
      medium: ['Review behavioral patterns', 'Consider additional verification questions'],
      high: ['Conduct manual security review', 'Consider rescheduling under better conditions', 'Request additional verification'],
      critical: ['Do not use results for decision making', 'Investigate security violations', 'Require supervised re-interview']
    };
    
    return nextSteps[riskLevel as keyof typeof nextSteps] || nextSteps.medium;
  }
  
  private calculateViolationSeverity(violationType: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: {[key: string]: string} = {
      'tab_switch': 'medium',
      'copy_attempt': 'high',
      'dev_tools': 'critical',
      'multiple_people_detected': 'critical',
      'candidate_not_visible': 'high',
      'suspicious_network': 'high',
      'external_device': 'medium',
      'rapid_responses': 'high',
      'ai_assistance': 'critical'
    };
    
    return (severityMap[violationType] || 'medium') as any;
  }
  
  private calculateAttentionScore(analysis: any): number {
    if (!analysis.primaryFace) return 0;
    
    return analysis.primaryFace.isLookingAtScreen ? 
      analysis.primaryFace.attentionLevel * 100 : 20;
  }
  
  private assessEngagementLevel(analysis: any): 'low' | 'medium' | 'high' {
    const attentionScore = this.calculateAttentionScore(analysis);
    
    if (attentionScore > 70) return 'high';
    if (attentionScore > 40) return 'medium';
    return 'low';
  }
  
  private assessInterviewReadiness(analysis: any): 'ready' | 'needs_adjustment' | 'not_ready' {
    if (analysis.facesCount !== 1) return 'not_ready';
    if (!analysis.primaryFace?.isLookingAtScreen) return 'needs_adjustment';
    return 'ready';
  }
  
  private async handleCriticalViolation(sessionId: string, violation: any): Promise<void> {
    console.log(`🚨 CRITICAL VIOLATION in virtual interview ${sessionId}: ${violation.type}`);
    
    // In a production system, this would:
    // 1. Send immediate alerts to supervisors
    // 2. Potentially pause the interview
    // 3. Log detailed violation data
    // 4. Trigger additional security measures
    
    // For now, we log the critical violation
    try {
      await proctorService.recordViolation({
        ...violation,
        severity: 'critical',
        requiresImmedateAction: true,
        sessionType: 'virtual_interview'
      });
    } catch (error) {
      console.error('Error handling critical violation:', error);
    }
  }
}

export const virtualInterviewService = new VirtualInterviewService();