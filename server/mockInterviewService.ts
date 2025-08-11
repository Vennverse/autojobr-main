import { storage } from "./storage";
import { groqService } from "./groqService";
import { apiKeyRotationService } from "./apiKeyRotationService";
import { pistonService } from "./pistonService";
import { MockInterview, MockInterviewQuestion, InsertMockInterview, InsertMockInterviewQuestion } from "@shared/schema";
import { QUESTION_BANK, getRandomQuestions, getQuestionsByType } from "./questionBank";
import { aiDetectionService } from "./aiDetectionService";
import { proctorService } from "./proctorService";
import { behavioralAnalyzer } from "./behavioralAnalyzer";
import { cameraProctorService } from "./cameraProctorService";

interface InterviewQuestion {
  question: string;
  type: 'coding' | 'behavioral' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  testCases?: Array<{
    input: any;
    expected: any;
    description: string;
  }>;
  sampleAnswer?: string;
}

interface InterviewConfiguration {
  role: string;
  company?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interviewType: 'technical' | 'behavioral' | 'system_design';
  language: string;
  totalQuestions: number;
}

interface MockInterviewSession {
  sessionId: string;
  userId: string;
  startTime: number;
  deviceFingerprint?: any;
  behavioralData?: any;
  violations?: any[];
  riskScore?: number;
  cameraMonitoring?: boolean;
}

interface EnhancedAnalysis {
  score: number;
  feedback: string;
  aiDetection?: any;
  behavioralAnalysis?: any;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  finalScore?: number;
  partialResultsOnly?: boolean;
}

export class MockInterviewService {
  async generateInterviewQuestions(config: InterviewConfiguration): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];
    
    console.log(`🔄 Generating ${config.totalQuestions} questions for ${config.interviewType} interview`);
    
    // Get questions from the comprehensive question bank
    const selectedQuestions = await getRandomQuestions(
      config.interviewType === 'technical' ? 'coding' : config.interviewType,
      config.difficulty,
      config.totalQuestions
    );
    
    // Convert to the expected format
    questions.push(...selectedQuestions.map(q => ({
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      hints: q.hints,
      testCases: q.testCases,
      sampleAnswer: q.sampleAnswer
    })));

    console.log(`✅ Got ${questions.length} questions from question bank`);

    // If we need more questions, generate them with AI or use fallbacks
    if (questions.length < config.totalQuestions) {
      const aiQuestions = await this.generateAIQuestions(config, config.totalQuestions - questions.length);
      questions.push(...aiQuestions);
      
      // If still not enough questions, use fallback questions
      if (questions.length < config.totalQuestions) {
        const fallbackQuestions = this.generateFallbackQuestions(config, config.totalQuestions - questions.length);
        questions.push(...fallbackQuestions);
      }
    }

    console.log(`🎯 Final question count: ${questions.length}/${config.totalQuestions}`);
    
    // Ensure we always have at least the minimum required questions
    if (questions.length === 0) {
      console.warn('⚠️ No questions generated, using emergency fallback');
      questions.push(...this.getEmergencyFallbackQuestions(config));
    }

    return questions.slice(0, config.totalQuestions); // Ensure exact count
  }

  private async generateAIQuestions(config: InterviewConfiguration, count: number): Promise<InterviewQuestion[]> {
    const prompt = `Generate ${count} high-quality ${config.difficulty} ${config.interviewType} interview questions for a ${config.role} position. 

Return a valid JSON array with this exact format:
[{
  "question": "Clear, specific question text",
  "hints": ["helpful hint 1", "helpful hint 2", "helpful hint 3"],
  "testCases": [{"input": "sample input", "expected": "expected output", "description": "test description"}],
  "sampleAnswer": "concise but complete sample answer"
}]

Requirements:
- Questions should be realistic and relevant to ${config.role}
- For coding questions, include proper test cases
- For behavioral questions, testCases can be empty array
- Keep sample answers professional and concise`;

    try {
      if (!groqService.client && groqService.developmentMode) {
        console.log('⚠️ Groq client not available, using fallback questions');
        return [];
      }
      
      const response = await groqService.makeRequest({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      // Clean the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const aiQuestions = JSON.parse(jsonMatch[0]);
      return aiQuestions.map((q: any) => ({
        question: q.question,
        type: config.interviewType === 'technical' ? 'coding' : config.interviewType,
        difficulty: config.difficulty,
        hints: q.hints || [],
        testCases: q.testCases || [],
        sampleAnswer: q.sampleAnswer || ''
      }));
    } catch (error) {
      console.error('Error generating AI questions:', error);
      return [];
    }
  }

  async startInterview(userId: string, config: InterviewConfiguration): Promise<MockInterview> {
    // Generate a more robust UUID-like session ID
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${userId.substr(-4)}`;
    
    console.log('🔍 Starting interview with sessionId:', sessionId);
    
    // Check if a session with this ID already exists (unlikely but good to check)
    const existingInterview = await storage.getMockInterviewBySessionId(sessionId);
    if (existingInterview) {
      console.warn('⚠️ Session ID collision detected, generating new one');
      const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${userId.substr(-4)}_retry`;
      console.log('🔍 Using new sessionId:', newSessionId);
      return this.startInterviewWithSessionId(userId, config, newSessionId);
    }
    
    const interviewData: InsertMockInterview = {
      userId,
      sessionId,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      role: config.role,
      company: config.company,
      language: config.language,
      totalQuestions: config.totalQuestions,
      timeRemaining: 3600, // 1 hour
      isPaid: false // First interview is free
    };

    console.log('🔍 Interview data to insert:', interviewData);

    const interview = await storage.createMockInterview(interviewData);
    
    console.log('🔍 Interview created in storage:', interview);
    
    if (!interview) {
      throw new Error('Failed to create interview in storage');
    }
    
    // CRITICAL: Generate and store questions - this must succeed
    try {
      const questions = await this.generateInterviewQuestions(config);
      
      console.log('🔍 Generated questions:', questions.length);
      
      if (questions.length === 0) {
        throw new Error('No questions generated');
      }
      
      // Store questions with error handling
      for (let i = 0; i < questions.length; i++) {
        const questionData: InsertMockInterviewQuestion = {
          interviewId: interview.id,
          questionNumber: i + 1,
          question: questions[i].question,
          questionType: questions[i].type,
          difficulty: questions[i].difficulty,
          hints: JSON.stringify(questions[i].hints),
          testCases: JSON.stringify(questions[i].testCases || []),
          sampleAnswer: questions[i].sampleAnswer
        };
        
        try {
          await storage.createMockInterviewQuestion(questionData);
          console.log(`✅ Stored question ${i + 1}/${questions.length}`);
        } catch (error) {
          console.error(`❌ Failed to store question ${i + 1}:`, error);
          throw new Error(`Failed to store question ${i + 1}`);
        }
      }
      
      console.log('✅ All questions stored successfully');
      
    } catch (error) {
      console.error('❌ Critical error during question generation/storage:', error);
      // Clean up the interview if question generation failed
      await storage.deleteMockInterview(interview.id);
      throw new Error('Failed to create interview questions. Please try again.');
    }

    console.log('🔍 Returning interview:', interview);
    
    return interview;
  }

  // Helper method to start interview with specific session ID
  private async startInterviewWithSessionId(userId: string, config: InterviewConfiguration, sessionId: string): Promise<MockInterview> {
    const interviewData: InsertMockInterview = {
      userId,
      sessionId,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      role: config.role,
      company: config.company,
      language: config.language,
      totalQuestions: config.totalQuestions,
      timeRemaining: 3600, // 1 hour
      isPaid: false // First interview is free
    };

    const interview = await storage.createMockInterview(interviewData);
    
    if (!interview) {
      throw new Error('Failed to create interview in storage');
    }
    
    // Generate and store questions
    try {
      const questions = await this.generateInterviewQuestions(config);
      
      if (questions.length === 0) {
        throw new Error('No questions generated');
      }
      
      // Store questions with error handling
      for (let i = 0; i < questions.length; i++) {
        const questionData: InsertMockInterviewQuestion = {
          interviewId: interview.id,
          questionNumber: i + 1,
          question: questions[i].question,
          questionType: questions[i].type,
          difficulty: questions[i].difficulty,
          hints: JSON.stringify(questions[i].hints),
          testCases: JSON.stringify(questions[i].testCases || []),
          sampleAnswer: questions[i].sampleAnswer
        };
        
        await storage.createMockInterviewQuestion(questionData);
      }
      
    } catch (error) {
      console.error('❌ Critical error during question generation/storage:', error);
      await storage.deleteMockInterview(interview.id);
      throw new Error('Failed to create interview questions. Please try again.');
    }

    return interview;
  }

  async getInterviewWithQuestions(sessionId: string): Promise<{ interview: MockInterview; questions: MockInterviewQuestion[] } | null> {
    const interview = await storage.getMockInterviewBySessionId(sessionId);
    if (!interview) return null;

    let questions = await storage.getMockInterviewQuestions(interview.id);
    
    // CRITICAL FIX: If no questions found, generate them now
    if (questions.length === 0) {
      console.warn(`⚠️ No questions found for interview ${interview.id}, generating now...`);
      
      try {
        const config: InterviewConfiguration = {
          role: interview.role || 'Software Engineer',
          company: interview.company,
          difficulty: interview.difficulty as 'easy' | 'medium' | 'hard',
          interviewType: interview.interviewType as 'technical' | 'behavioral' | 'system_design',
          language: interview.language || 'javascript',
          totalQuestions: interview.totalQuestions || 5
        };
        
        const generatedQuestions = await this.generateInterviewQuestions(config);
        
        // Store the generated questions
        for (let i = 0; i < generatedQuestions.length; i++) {
          const questionData: InsertMockInterviewQuestion = {
            interviewId: interview.id,
            questionNumber: i + 1,
            question: generatedQuestions[i].question,
            questionType: generatedQuestions[i].type,
            difficulty: generatedQuestions[i].difficulty,
            hints: JSON.stringify(generatedQuestions[i].hints),
            testCases: JSON.stringify(generatedQuestions[i].testCases || []),
            sampleAnswer: generatedQuestions[i].sampleAnswer
          };
          
          await storage.createMockInterviewQuestion(questionData);
        }
        
        // Fetch the newly created questions
        questions = await storage.getMockInterviewQuestions(interview.id);
        console.log(`✅ Generated and stored ${questions.length} questions for existing interview`);
        
      } catch (error) {
        console.error('❌ Failed to generate questions for existing interview:', error);
        // Return empty array but log the issue
        console.error(`Interview ${interview.id} will show as "Session Not Found" due to missing questions`);
      }
    }
    
    return { interview, questions };
  }

  async submitAnswer(questionId: number, answer: string, code?: string): Promise<void> {
    const question = await storage.getMockInterviewQuestion(questionId);
    if (!question) throw new Error('Question not found');

    // Update question with user's answer
    await storage.updateMockInterviewQuestion(questionId, {
      userAnswer: answer,
      userCode: code,
      timeSpent: 0 // Will be calculated on frontend
    });

    // Generate AI feedback for the answer
    const feedback = await this.generateFeedback(question, answer, code);
    const score = await this.calculateScore(question, answer, code);

    await storage.updateMockInterviewQuestion(questionId, {
      feedback,
      score
    });
  }

  private async generateFeedback(question: MockInterviewQuestion, answer: string, code?: string): Promise<string> {
    const prompt = `Provide constructive feedback for this interview answer:
    
    Question: ${question.question}
    Question Type: ${question.questionType}
    User Answer: ${answer}
    ${code ? `Code: ${code}` : ''}
    
    Provide specific, actionable feedback focusing on:
    1. Correctness and completeness
    2. Code quality and best practices (if applicable)
    3. Communication and explanation
    4. Suggestions for improvement
    
    Keep feedback constructive and encouraging. Keep response under 300 words.`;

    try {
      if (!groqService.client) {
        return `Good attempt! Here's some feedback: Your answer addresses the main points of the question. ${code ? 'Your code shows understanding of the problem.' : 'Consider providing more specific examples.'} Continue practicing to improve your interview skills.`;
      }

      // Use the proper Groq API call with rotation service
      const response = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 400,
        });
      });

      return response.choices[0]?.message?.content || 'No feedback available';
    } catch (error) {
      console.error('Error generating feedback:', error);
      return `Good attempt! Your answer shows understanding of the question. ${code ? 'Your code demonstrates problem-solving skills.' : 'Consider adding more specific examples next time.'} Keep practicing!`;
    }
  }

  private safeCodeExecution(code: string, input: any): any {
    // Safer code execution - sanitize and limit scope
    try {
      // Create a restricted execution context
      const sandbox = {
        input: input,
        console: { log: () => {} }, // Disable console
        setTimeout: undefined,
        setInterval: undefined,
        require: undefined,
        process: undefined,
        global: undefined,
        Buffer: undefined
      };
      
      // Create function in sandbox context
      const func = new Function('sandbox', `
        with(sandbox) {
          return (${code})(input);
        }
      `);
      
      return func(sandbox);
    } catch (error) {
      throw error;
    }
  }

  // Fallback question generators to ensure interviews always have questions
  private generateFallbackQuestions(config: InterviewConfiguration, count: number): InterviewQuestion[] {
    const fallbackQuestions: InterviewQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      if (config.interviewType === 'technical' || config.interviewType === 'coding') {
        fallbackQuestions.push({
          question: `Write a function to solve a ${config.difficulty} level programming problem related to ${config.role}.`,
          type: 'coding',
          difficulty: config.difficulty,
          hints: ['Think about the algorithm', 'Consider edge cases', 'Optimize for time complexity'],
          testCases: [{ input: 'test', expected: 'result', description: 'Basic test case' }],
          sampleAnswer: '// Implementation depends on specific requirements'
        });
      } else {
        fallbackQuestions.push({
          question: `Describe your approach to handling ${config.difficulty} challenges in ${config.role} position at ${config.company || 'a tech company'}.`,
          type: 'behavioral',
          difficulty: config.difficulty,
          hints: ['Use STAR method', 'Be specific', 'Show impact'],
          sampleAnswer: 'I would approach this by first analyzing the situation, then developing a strategy...'
        });
      }
    }
    
    return fallbackQuestions;
  }

  private getEmergencyFallbackQuestions(config: InterviewConfiguration): InterviewQuestion[] {
    return [
      {
        question: 'Tell me about yourself and your experience with programming.',
        type: 'behavioral',
        difficulty: 'easy',
        hints: ['Keep it concise', 'Focus on relevant experience', 'Mention key skills'],
        sampleAnswer: 'I am a software developer with experience in...'
      },
      {
        question: 'What interests you about this role?',
        type: 'behavioral', 
        difficulty: 'easy',
        hints: ['Research the company', 'Connect to your goals', 'Be genuine'],
        sampleAnswer: 'I am interested in this role because...'
      },
      {
        question: 'Describe a challenging project you worked on.',
        type: 'behavioral',
        difficulty: 'medium',
        hints: ['Use STAR method', 'Explain your role', 'Highlight the outcome'],
        sampleAnswer: 'I worked on a project where...'
      }
    ];
  }

  private async calculateScore(question: MockInterviewQuestion, answer: string, code?: string): Promise<number> {
    if (question.questionType === 'coding' && code) {
      // For coding questions, use AI to evaluate code quality and correctness
      const prompt = `Evaluate this coding solution on a scale of 0-100:

Question: ${question.question}
User's Code:
\`\`\`javascript
${code}
\`\`\`

Evaluation Criteria:
- Correctness (0-40 points): Does the code solve the problem correctly?
- Code Quality (0-30 points): Is the code clean, readable, and well-structured?
- Efficiency (0-20 points): Is the solution efficient in time/space complexity?
- Edge Cases (0-10 points): Does it handle edge cases properly?

Test Cases: ${question.testCases || '[]'}

Return only the numeric score (0-100).`;

      try {
        if (!groqService.client && groqService.developmentMode) {
          // Fallback: analyze code length and basic structure
          const codeLines = code.trim().split('\n').length;
          const hasFunction = /function|=>|\{/.test(code);
          const hasReturn = /return/.test(code);
          
          let score = 30; // Base score
          if (hasFunction) score += 20;
          if (hasReturn) score += 20; 
          if (codeLines > 2) score += 15;
          if (code.length > 50) score += 15;
          
          return Math.min(score, 95);
        }

        const response = await groqService.makeRequest({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 20,
        });

        const scoreText = response.choices[0]?.message?.content?.trim() || '50';
        const score = parseInt(scoreText.replace(/[^0-9]/g, ''));
        return Math.max(0, Math.min(100, isNaN(score) ? 50 : score));
      } catch (error) {
        console.error('Error calculating code score:', error);
        // Fallback scoring
        const hasFunction = /function|=>|\{/.test(code);
        const hasReturn = /return/.test(code);
        return hasFunction && hasReturn ? 65 : 40;
      }
    } else {
      // For behavioral and system design questions, use AI to score
      const prompt = `Rate this interview answer on a scale of 0-100:
      
      Question: ${question.question}
      Answer: ${answer}
      
      Scoring criteria:
      - Completeness and relevance (0-25 points)
      - Structure and clarity (0-25 points)  
      - Specific examples and details (0-25 points)
      - Overall professional quality (0-25 points)
      
      Return only the numeric score (0-100).`;

      try {
        if (!groqService.client) {
          // Fallback scoring based on answer length and basic analysis
          const answerLength = answer.trim().length;
          if (answerLength < 50) return 40;
          if (answerLength < 100) return 60;
          if (answerLength < 200) return 75;
          return 85;
        }

        const response = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
          return await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 10,
          });
        });

        const scoreText = response.choices[0]?.message?.content?.trim() || '50';
        const score = parseInt(scoreText.replace(/[^0-9]/g, ''));
        return Math.max(0, Math.min(100, isNaN(score) ? 50 : score));
      } catch (error) {
        console.error('Error calculating AI score:', error);
        // Fallback scoring
        const answerLength = answer.trim().length;
        if (answerLength < 50) return 40;
        if (answerLength < 100) return 60;
        return 70;
      }
    }
  }

  async completeInterview(sessionId: string): Promise<MockInterview> {
    const interview = await storage.getMockInterviewBySessionId(sessionId);
    if (!interview) throw new Error('Interview not found');

    const questions = await storage.getMockInterviewQuestions(interview.id);
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    const averageScore = Math.round(totalScore / questions.length);

    const overallFeedback = await this.generateOverallFeedback(interview, questions);

    const updatedInterview = await storage.updateMockInterview(interview.id, {
      status: 'completed',
      endTime: new Date(),
      score: averageScore,
      feedback: overallFeedback,
      retakeAllowed: false // SECURITY FIX: Reset retakeAllowed flag to prevent unauthorized retakes
    });

    // Update user interview stats
    try {
      await this.updateUserStats(interview.userId, averageScore);
    } catch (error) {
      console.error('Error updating user stats:', error);
      // Don't fail the completion if stats update fails
    }

    return updatedInterview;
  }

  // ===============================
  // INDUSTRY-LEADING ANTI-CHEATING METHODS FOR MOCK INTERVIEWS
  // ===============================
  
  async initializeMockInterviewSession(sessionId: string, userId: string): Promise<MockInterviewSession> {
    console.log(`🔒 Initializing secure mock interview session: ${sessionId}`);
    
    const session: MockInterviewSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      violations: [],
      riskScore: 0,
      cameraMonitoring: false
    };
    
    try {
      // Initialize comprehensive proctoring services for mock interviews
      await proctorService.initializeSession(sessionId, userId, {
        sessionType: 'mock_interview',
        securityLevel: 'high',
        enableDeviceFingerprinting: true,
        enableEnvironmentValidation: true,
        enableBrowserSecurity: true,
        enableCodeAnalysis: true // Special for coding interviews
      });
      
      await cameraProctorService.initializeSession(sessionId, {
        faceDetection: true,
        eyeTracking: true,
        environmentMonitoring: true,
        multiplePersonDetection: true,
        screenRecording: true // Mock interviews might need recording
      });
      
      session.cameraMonitoring = true;
      console.log(`✅ Mock interview security initialized for session ${sessionId}`);
    } catch (error) {
      console.error('Error initializing mock interview security:', error);
      // Continue with reduced security features
    }
    
    return session;
  }
  
  async enhancedSubmitAnswer(
    questionId: number, 
    answer: string, 
    code?: string, 
    behavioralData?: any, 
    sessionData?: any
  ): Promise<EnhancedAnalysis> {
    const question = await storage.getMockInterviewQuestion(questionId);
    if (!question) throw new Error('Question not found');
    
    console.log(`🔬 Enhanced answer analysis for mock interview question ${questionId}`);
    
    try {
      // 1. AI Detection with enhanced context
      const aiDetection = await aiDetectionService.detectAIUsage(
        answer + (code ? `\n\nCode:\n${code}` : ''), 
        question.question, 
        behavioralData
      );
      
      // 2. Behavioral Analysis if available
      let behavioralAnalysis = null;
      if (behavioralData) {
        behavioralAnalysis = behavioralAnalyzer.generateBehavioralProfile({
          ...behavioralData,
          sessionId: sessionData?.sessionId || `mock_${questionId}`,
          userId: sessionData?.userId || 'unknown',
          context: 'mock_interview'
        });
      }
      
      // 3. Code-specific analysis for technical questions
      let codeAnalysis = null;
      if (code && question.questionType === 'coding') {
        codeAnalysis = await this.analyzeCode(code, question, behavioralData);
      }
      
      // 4. Generate enhanced feedback and scoring
      const baseScore = await this.calculateScore(question, answer, code);
      const baseFeedback = await this.generateFeedback(question, answer, code);
      
      // 5. Calculate comprehensive risk score
      const riskScore = this.calculateMockInterviewRiskScore(
        aiDetection, 
        behavioralAnalysis, 
        codeAnalysis,
        { answer, code }
      );
      
      // 6. Apply enhanced penalties
      const finalScore = this.applyMockInterviewPenalties(baseScore, riskScore, aiDetection);
      
      // 7. Generate comprehensive feedback
      const enhancedFeedback = this.generateEnhancedFeedback(
        baseFeedback, 
        aiDetection, 
        behavioralAnalysis, 
        codeAnalysis,
        riskScore
      );
      
      // 8. Update question with enhanced results
      await storage.updateMockInterviewQuestion(questionId, {
        userAnswer: answer,
        userCode: code,
        feedback: enhancedFeedback,
        score: finalScore,
        timeSpent: behavioralData?.responseTime || 0
      });
      
      const result: EnhancedAnalysis = {
        score: finalScore,
        feedback: enhancedFeedback,
        aiDetection,
        behavioralAnalysis,
        riskLevel: this.determineMockRiskLevel(riskScore),
        finalScore,
        partialResultsOnly: riskScore > 50 || aiDetection.isAIGenerated
      };
      
      console.log(`✅ Enhanced analysis completed - Risk: ${result.riskLevel}, Score: ${finalScore}`);
      return result;
      
    } catch (error) {
      console.error('Error in enhanced answer analysis:', error);
      
      // Fallback to standard analysis
      await this.submitAnswer(questionId, answer, code);
      const fallbackQuestion = await storage.getMockInterviewQuestion(questionId);
      
      return {
        score: fallbackQuestion?.score || 50,
        feedback: fallbackQuestion?.feedback || 'Analysis completed with basic methods.',
        riskLevel: 'medium'
      };
    }
  }
  
  async generateMockInterviewSummary(sessionId: string): Promise<any> {
    try {
      console.log(`📊 Generating comprehensive mock interview security summary for session: ${sessionId}`);
      
      const proctoringSummary = await proctorService.generateProctoringSummary(sessionId);
      const cameraSummary = await cameraProctorService.generateSummary(sessionId);
      
      // Get interview and questions for additional context
      const interviewData = await this.getInterviewWithQuestions(sessionId);
      
      const overallRisk = this.calculateMockOverallRisk(proctoringSummary, cameraSummary);
      const recommendation = this.generateMockSecurityRecommendation(overallRisk, interviewData);
      
      const comprehensiveSummary = {
        sessionId,
        timestamp: new Date().toISOString(),
        sessionType: 'mock_interview',
        interviewInfo: interviewData ? {
          role: interviewData.interview.role,
          difficulty: interviewData.interview.difficulty,
          questionsCount: interviewData.questions.length
        } : null,
        security: {
          proctoringSummary,
          cameraSummary,
          overallRisk,
          recommendation
        },
        performance: this.calculatePerformanceMetrics(interviewData?.questions || []),
        reliability: this.assessMockResultReliability(overallRisk),
        nextSteps: this.generateMockNextSteps(overallRisk, interviewData)
      };
      
      console.log(`✅ Mock interview security summary generated - Overall Risk: ${overallRisk}`);
      return comprehensiveSummary;
      
    } catch (error) {
      console.error('Error generating mock interview summary:', error);
      return {
        sessionId,
        overallRisk: 'medium',
        recommendation: 'Manual review recommended due to analysis errors',
        reliability: 'uncertain'
      };
    }
  }
  
  // Private helper methods for enhanced mock interview security
  
  private async analyzeCode(code: string, question: MockInterviewQuestion, behavioralData?: any): Promise<any> {
    const analysis = {
      complexity: this.calculateCodeComplexity(code),
      quality: this.assessCodeQuality(code),
      patterns: this.detectCodePatterns(code),
      suspiciousIndicators: []
    };
    
    // Check for copy-paste indicators
    if (behavioralData?.violations) {
      const copyPasteAttempts = behavioralData.violations.filter((v: any) => v.type === 'copy_attempt').length;
      if (copyPasteAttempts > 0) {
        analysis.suspiciousIndicators.push(`${copyPasteAttempts} copy/paste attempts during coding`);
      }
    }
    
    // Check for unusually perfect code
    if (analysis.quality > 0.9 && analysis.complexity > 0.8) {
      analysis.suspiciousIndicators.push('Code quality unusually high for time constraints');
    }
    
    // Check for rapid code completion
    if (behavioralData?.responseTime && code.length > 200 && behavioralData.responseTime < 120000) { // 2 minutes
      analysis.suspiciousIndicators.push('Code completed unusually quickly');
    }
    
    return analysis;
  }
  
  private calculateCodeComplexity(code: string): number {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const functions = (code.match(/function|=>|def |class /g) || []).length;
    const loops = (code.match(/for|while|forEach/g) || []).length;
    const conditions = (code.match(/if|switch|case/g) || []).length;
    
    // Normalize complexity (0-1)
    const complexity = (functions * 0.3 + loops * 0.3 + conditions * 0.2 + lines.length * 0.01) / 10;
    return Math.min(1, Math.max(0, complexity));
  }
  
  private assessCodeQuality(code: string): number {
    let quality = 0.5; // Base quality
    
    // Check for good practices
    if (/\/\*|\*\/|\/\//.test(code)) quality += 0.1; // Comments
    if (/const|let/.test(code)) quality += 0.1; // Modern variable declarations
    if (/function\s+\w+|\w+\s*=>/.test(code)) quality += 0.1; // Function definitions
    if (/try|catch/.test(code)) quality += 0.1; // Error handling
    if (!/var /.test(code)) quality += 0.1; // Avoids old var declarations
    
    // Check for bad practices
    if (/console\.log/.test(code)) quality -= 0.05; // Console logs in solution
    if (/eval\(/.test(code)) quality -= 0.2; // Dangerous eval
    if (/alert\(/.test(code)) quality -= 0.1; // Alerts
    
    return Math.min(1, Math.max(0, quality));
  }
  
  private detectCodePatterns(code: string): any {
    return {
      hasComments: /\/\*|\*\/|\/\//.test(code),
      hasErrorHandling: /try|catch|throw/.test(code),
      usesModernJS: /const|let|=>/.test(code),
      hasLoops: /for|while|forEach/.test(code),
      hasConditionals: /if|switch|case/.test(code),
      lineCount: code.split('\n').length
    };
  }
  
  private calculateMockInterviewRiskScore(
    aiDetection: any, 
    behavioralAnalysis: any, 
    codeAnalysis: any,
    responseData: any
  ): number {
    let riskScore = 0;
    
    // AI detection risk (35% weight)
    if (aiDetection.isAIGenerated) {
      riskScore += aiDetection.confidence * 0.35;
    }
    
    // Behavioral analysis risk (25% weight)
    if (behavioralAnalysis && behavioralAnalysis.overallAuthenticity < 50) {
      riskScore += (100 - behavioralAnalysis.overallAuthenticity) * 0.25;
    }
    
    // Code analysis risk (25% weight) - for coding questions
    if (codeAnalysis) {
      if (codeAnalysis.suspiciousIndicators.length > 0) {
        riskScore += codeAnalysis.suspiciousIndicators.length * 8; // 8 points per indicator
      }
      
      // Perfect code might be suspicious
      if (codeAnalysis.quality > 0.95 && codeAnalysis.complexity > 0.8) {
        riskScore += 15;
      }
    }
    
    // Response pattern risk (15% weight)
    if (responseData.answer && responseData.answer.length > 1000 && responseData.code && responseData.code.length > 500) {
      riskScore += 10; // Unusually comprehensive responses
    }
    
    return Math.min(100, riskScore);
  }
  
  private applyMockInterviewPenalties(baseScore: number, riskScore: number, aiDetection: any): number {
    let finalScore = baseScore;
    
    // Progressive penalty system for mock interviews
    if (riskScore >= 80) {
      finalScore *= 0.05; // 95% penalty for critical risk
    } else if (riskScore >= 60) {
      finalScore *= 0.2; // 80% penalty for high risk
    } else if (riskScore >= 40) {
      finalScore *= 0.5; // 50% penalty for medium risk
    } else if (riskScore >= 20) {
      finalScore *= 0.75; // 25% penalty for low risk
    }
    
    // Additional penalties for specific AI patterns
    if (aiDetection.confidence > 90) {
      finalScore *= 0.5; // Additional 50% penalty for very confident AI detection
    }
    
    return Math.round(Math.max(0, finalScore));
  }
  
  private generateEnhancedFeedback(
    baseFeedback: string, 
    aiDetection: any, 
    behavioralAnalysis: any, 
    codeAnalysis: any,
    riskScore: number
  ): string {
    let enhancedFeedback = baseFeedback;
    
    if (riskScore > 50) {
      enhancedFeedback += "\n\n⚠️ Security Analysis:\n";
      
      if (aiDetection.isAIGenerated) {
        enhancedFeedback += `• AI assistance detected (${aiDetection.confidence}% confidence)\n`;
      }
      
      if (behavioralAnalysis && behavioralAnalysis.overallAuthenticity < 50) {
        enhancedFeedback += `• Unusual behavioral patterns detected\n`;
      }
      
      if (codeAnalysis && codeAnalysis.suspiciousIndicators.length > 0) {
        enhancedFeedback += `• Code analysis concerns: ${codeAnalysis.suspiciousIndicators.join(', ')}\n`;
      }
      
      enhancedFeedback += "\nNote: Results adjusted based on security analysis. Focus on authentic problem-solving approach.";
    }
    
    return enhancedFeedback;
  }
  
  private determineMockRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
  
  private calculateMockOverallRisk(proctoringSummary: any, cameraSummary: any): 'low' | 'medium' | 'high' | 'critical' {
    const risks = [
      proctoringSummary?.riskLevel || 'low', 
      cameraSummary?.riskLevel || 'low'
    ];
    
    if (risks.includes('critical')) return 'critical';
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }
  
  private generateMockSecurityRecommendation(riskLevel: string, interviewData?: any): string {
    const recommendations = {
      low: 'Mock interview completed with excellent security compliance. Results are highly reliable for skill assessment.',
      medium: 'Some security concerns detected during mock interview. Results should be reviewed with additional context.',
      high: 'Significant security violations detected. Consider supplementary assessment methods to validate skills.',
      critical: 'Critical security breaches detected. Mock interview results should not be used for skill evaluation without further investigation.'
    };
    
    let recommendation = recommendations[riskLevel as keyof typeof recommendations] || recommendations.medium;
    
    // Add context-specific recommendations
    if (interviewData?.interview?.interviewType === 'technical' && riskLevel !== 'low') {
      recommendation += ' Consider live coding session with screenshare for technical validation.';
    }
    
    return recommendation;
  }
  
  private calculatePerformanceMetrics(questions: MockInterviewQuestion[]): any {
    if (questions.length === 0) return { averageScore: 0, questionsAnswered: 0 };
    
    const answeredQuestions = questions.filter(q => q.userAnswer);
    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
    
    return {
      questionsAnswered: answeredQuestions.length,
      totalQuestions: questions.length,
      averageScore: answeredQuestions.length > 0 ? Math.round(totalScore / answeredQuestions.length) : 0,
      completionRate: Math.round((answeredQuestions.length / questions.length) * 100)
    };
  }
  
  private assessMockResultReliability(riskLevel: string): 'high' | 'medium' | 'low' | 'unreliable' {
    const reliability = {
      low: 'high',
      medium: 'medium', 
      high: 'low',
      critical: 'unreliable'
    };
    
    return reliability[riskLevel as keyof typeof reliability] as any || 'medium';
  }
  
  private generateMockNextSteps(riskLevel: string, interviewData?: any): string[] {
    const baseSteps = {
      low: ['Use results for skill assessment', 'Consider for hiring decisions', 'Provide detailed feedback to candidate'],
      medium: ['Review responses manually', 'Consider follow-up questions', 'Validate key technical concepts'],
      high: ['Conduct additional assessment', 'Schedule live technical interview', 'Review security violations'],
      critical: ['Do not use results for assessment', 'Investigate security violations', 'Require supervised re-assessment']
    };
    
    const steps = [...(baseSteps[riskLevel as keyof typeof baseSteps] || baseSteps.medium)];
    
    // Add context-specific steps
    if (interviewData?.interview?.interviewType === 'coding' && riskLevel !== 'low') {
      steps.push('Consider pair programming session');
    }
    
    if (interviewData?.interview?.difficulty === 'hard' && riskLevel === 'low') {
      steps.push('Candidate shows strong problem-solving skills');
    }
    
    return steps;
  }

  private async generateOverallFeedback(interview: MockInterview, questions: MockInterviewQuestion[]): Promise<string> {
    const prompt = `Generate overall interview feedback based on these responses:
    
    Interview Type: ${interview.interviewType}
    Role: ${interview.role}
    Difficulty: ${interview.difficulty}
    
    Questions and Scores:
    ${questions.map(q => `Q: ${q.question}\nScore: ${q.score || 0}/100`).join('\n\n')}
    
    Provide:
    1. Overall performance summary
    2. Strengths identified
    3. Areas for improvement
    4. Specific recommendations for next steps
    
    Keep it encouraging and actionable.`;

    try {
      const response = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 800,
        });
      });

      return response.choices[0]?.message?.content || 'Great job completing the interview! Keep practicing to improve your skills.';
    } catch (error) {
      return 'Great job completing the interview! Keep practicing to improve your skills.';
    }
  }

  private async updateUserStats(userId: string, score: number): Promise<void> {
    const existingStats = await storage.getUserInterviewStats(userId);
    
    if (existingStats) {
      const totalInterviews = (existingStats.totalInterviews || 0) + 1;
      const newAverage = Math.round((((existingStats.averageScore || 0) * (existingStats.totalInterviews || 0)) + score) / totalInterviews);
      
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews,
        freeInterviewsUsed: (existingStats.freeInterviewsUsed || 0) + 1,
        averageScore: newAverage,
        bestScore: Math.max(existingStats.bestScore || 0, score),
        lastInterviewDate: new Date()
      });
    } else {
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: 1,
        freeInterviewsUsed: 1,
        averageScore: score,
        bestScore: score,
        lastInterviewDate: new Date()
      });
    }
  }

  async checkFreeInterviewsRemaining(userId: string): Promise<number> {
    const stats = await storage.getUserInterviewStats(userId);
    const freeInterviewsUsed = stats?.freeInterviewsUsed || 0;
    return Math.max(0, 1 - freeInterviewsUsed); // 1 free interview
  }

  async addInterviewCredits(userId: string, credits: number): Promise<void> {
    const stats = await storage.getUserInterviewStats(userId);
    
    if (stats) {
      // Reset free interviews used to allow more interviews
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: stats.totalInterviews,
        freeInterviewsUsed: Math.max(0, (stats.freeInterviewsUsed || 0) - credits),
        averageScore: stats.averageScore,
        bestScore: stats.bestScore,
        lastInterviewDate: stats.lastInterviewDate
      });
    } else {
      // Create new stats with credits
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews: 0,
        freeInterviewsUsed: -credits, // Negative means additional credits
        averageScore: 0,
        bestScore: 0,
        lastInterviewDate: new Date()
      });
    }
  }
}

export const mockInterviewService = new MockInterviewService();