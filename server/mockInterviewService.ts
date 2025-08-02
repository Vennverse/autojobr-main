import { storage } from "./storage";
import { groqService } from "./groqService";
import { pistonService } from "./pistonService";
import { MockInterview, MockInterviewQuestion, InsertMockInterview, InsertMockInterviewQuestion } from "@shared/schema";
import { QUESTION_BANK, getRandomQuestions, getQuestionsByType } from "./questionBank";

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
      if (!groqService.client && groqService.developmentMode) {
        return `Good attempt! Here's some feedback: Your answer addresses the main points of the question. ${code ? 'Your code shows understanding of the problem.' : 'Consider providing more specific examples.'} Continue practicing to improve your interview skills.`;
      }

      // Use the proper Groq API call with rotation service
      const response = await groqService.makeRequest({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 400,
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
        if (!groqService.client && groqService.developmentMode) {
          // Fallback scoring based on answer length and basic analysis
          const answerLength = answer.trim().length;
          if (answerLength < 50) return 40;
          if (answerLength < 100) return 60;
          if (answerLength < 200) return 75;
          return 85;
        }

        const response = await groqService.makeRequest({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 10,
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
      feedback: overallFeedback
    });

    // Update user interview stats
    await this.updateUserStats(interview.userId, averageScore);

    return updatedInterview;
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
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || 'Great job completing the interview! Keep practicing to improve your skills.';
    } catch (error) {
      return 'Great job completing the interview! Keep practicing to improve your skills.';
    }
  }

  private async updateUserStats(userId: string, score: number): Promise<void> {
    const existingStats = await storage.getUserInterviewStats(userId);
    
    if (existingStats) {
      const totalInterviews = existingStats.totalInterviews + 1;
      const newAverage = Math.round(((existingStats.averageScore * existingStats.totalInterviews) + score) / totalInterviews);
      
      await storage.upsertUserInterviewStats({
        userId,
        totalInterviews,
        freeInterviewsUsed: existingStats.freeInterviewsUsed + 1,
        averageScore: newAverage,
        bestScore: Math.max(existingStats.bestScore, score),
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
        freeInterviewsUsed: Math.max(0, stats.freeInterviewsUsed - credits),
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