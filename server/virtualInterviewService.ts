import Groq from 'groq-sdk';
import { aiDetectionService } from './aiDetectionService';
import { behavioralQuestionService, BehavioralQuestion } from './behavioralQuestions';

// Using Groq AI for all virtual interview functionality - optimized for token usage
const DEFAULT_MODEL_STR = "llama-3.1-8b-instant"; // Faster, cheaper model

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
}

export class VirtualInterviewService {
  private groq: Groq;
  
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
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("Virtual Interview Groq client initialized successfully");
    } else {
      console.log("GROQ_API_KEY not provided - virtual interviews will use fallback mode");
      // Initialize with null to avoid undefined errors
      this.groq = null as any;
    }
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
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer. Generate a single, specific interview question with metadata. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.7,
        max_tokens: 500,
      });

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
    // First, detect if AI was used
    const aiDetection = await aiDetectionService.detectAIUsage(userResponse, question);
    
    // If GROQ is not available, return fallback analysis
    if (!this.groq) {
      const baseAnalysis = {
        responseQuality: Math.min(10, Math.max(1, Math.floor(userResponse.length / 20) + 3)),
        technicalAccuracy: 60,
        clarityScore: 65,
        depthScore: 55,
        keywordsMatched: expectedKeywords.filter(keyword => 
          userResponse.toLowerCase().includes(keyword.toLowerCase())
        ),
        sentiment: 'neutral' as const,
        confidence: 60
      };

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
    }
    
    const prompt = `
Analyze this interview response. Be concise.

Question: "${question}"
Category: ${questionCategory}
Response: "${userResponse}"

Return JSON only: {"responseQuality": 1-10, "technicalAccuracy": 0-100, "clarityScore": 0-100, "depthScore": 0-100, "keywordsMatched": ["matched", "keywords"], "sentiment": "positive/neutral/negative", "confidence": 1-100}`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert interview evaluator. Analyze responses thoroughly and fairly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.3,
        max_tokens: 300, // Reduced tokens
      });

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
    return `
Generate an interview question for:
- Role: ${role}
- Type: ${interviewType}
- Difficulty: ${difficulty}
- Question #: ${questionNumber}
${userContext ? `- Candidate Background: ${userContext}` : ''}

Previous responses (to avoid repetition): ${previousResponses.slice(-2).join('; ')}

Return JSON with:
{
  "category": "${interviewType}",
  "question": "specific question text",
  "difficulty": "${difficulty}",
  "expectedKeywords": ["keyword1", "keyword2"],
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
}

export const virtualInterviewService = new VirtualInterviewService();