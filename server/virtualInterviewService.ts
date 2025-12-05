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
  isCorrect?: boolean; // Whether the answer is factually correct
  relevanceScore?: number; // How relevant the answer is to the question (0-100)
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
    userContext?: string,
    jobDescription?: string,
    previousQuestions?: string[]
  ): Promise<InterviewQuestion> {
    const prompt = this.buildQuestionPrompt(interviewType, difficulty, role, questionNumber, previousResponses, userContext, jobDescription, previousQuestions);
    
    const hasJobDescription = jobDescription && jobDescription.trim().length > 20;
    console.log(`🤖 Generating AI question #${questionNumber} for ${role} (${interviewType}, ${difficulty})...`);
    if (hasJobDescription) {
      console.log(`📋 Using job description for question generation (${jobDescription.substring(0, 50)}...)`);
    }
    
    // Try up to 3 attempts to get a unique question
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const systemPrompt = attempt === 1 
          ? "You are an expert interviewer. Generate a single, specific interview question with metadata. Questions MUST be directly relevant to the job description if provided and MUST BE DIFFERENT from previously asked questions. Respond with valid JSON only, no extra text."
          : "Generate a UNIQUE interview question relevant to the job. Return ONLY this JSON format, nothing else: {\"category\": \"technical\", \"question\": \"your question here\", \"difficulty\": \"medium\", \"expectedKeywords\": [], \"followUpPrompts\": []}";
        
        // Include previous questions context
        const previousQuestionsContext = previousQuestions && previousQuestions.length > 0 
          ? `\n\nPREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT THESE):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nGENERATE A COMPLETELY DIFFERENT QUESTION.`
          : '';
        
        // For retry attempts, still include job context in simplified form
        const retryPrompt = hasJobDescription 
          ? `Generate a ${difficulty} ${interviewType} interview question for a ${role} position. Question #${questionNumber}. 
             
             JOB CONTEXT: ${jobDescription.substring(0, 500)}
             ${previousQuestionsContext}
             
             IMPORTANT: Ask about skills, technologies, or scenarios from this job description. Do NOT ask generic coding questions. MUST BE DIFFERENT from previous questions.
             Return only valid JSON.`
          : `Generate a ${difficulty} ${interviewType} interview question for a ${role} position. Question #${questionNumber}. ${previousQuestionsContext} Return only valid JSON.`;
        
        const response = await aiService.createChatCompletion([
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: attempt === 1 ? prompt : retryPrompt
          }
        ], attempt === 2 ? { temperature: 0.8 } : { temperature: 0.9 });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          console.log(`⚠️ Attempt ${attempt}: No content in AI response`);
          continue;
        }

        // Clean and parse the JSON response
        const cleanedContent = this.cleanJsonResponse(content);
        let questionData;
        try {
          questionData = JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error(`⚠️ Attempt ${attempt}: JSON parse error:`, parseError);
          console.error('Raw content:', content.substring(0, 300));
          if (attempt < 2) continue; // Try again with simpler prompt
          throw new Error('Invalid JSON response from AI service');
        }

        // Validate we got a question
        if (!questionData.question || typeof questionData.question !== 'string') {
          console.log(`⚠️ Attempt ${attempt}: No valid question in response`);
          if (attempt < 2) continue;
          throw new Error('No question in AI response');
        }

        console.log(`✅ AI generated question (attempt ${attempt}): "${questionData.question.substring(0, 60)}..."`);

        return {
          category: questionData.category || interviewType as any,
          question: questionData.question,
          difficulty: questionData.difficulty || difficulty as any,
          expectedKeywords: questionData.expectedKeywords || [],
          followUpPrompts: questionData.followUpPrompts || []
        };
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt < 2) continue; // Try again
      }
    }
    
    // All attempts failed - use fallback
    console.log('❌ All AI attempts failed, using fallback question');
    return this.getFallbackQuestion(interviewType, difficulty, role);
  }

  async analyzeResponse(
    question: string,
    userResponse: string,
    expectedKeywords: string[],
    questionCategory: string
  ): Promise<MessageAnalysis> {
    // First, validate response quality (detect gibberish, spam, etc.)
    const responseValidation = this.validateResponseQuality(userResponse);
    
    if (!responseValidation.isValid) {
      console.log(`⚠️ Invalid response detected: ${responseValidation.reason}`);
      // Return low scores for gibberish/invalid responses
      const penaltyScore = 100 - responseValidation.penaltyScore;
      return {
        responseQuality: Math.max(1, Math.round(penaltyScore / 10)),
        technicalAccuracy: Math.max(0, penaltyScore - 10),
        clarityScore: Math.max(0, penaltyScore - 15),
        depthScore: Math.max(0, penaltyScore - 20),
        keywordsMatched: [],
        sentiment: 'negative' as const,
        confidence: Math.max(1, penaltyScore),
        aiDetection: {
          isAIGenerated: false,
          confidence: 0,
          humanScore: 100,
          indicators: [responseValidation.reason],
          reasoning: `Response flagged: ${responseValidation.reason}`
        },
        finalScore: Math.max(0, penaltyScore),
        partialResultsOnly: true
      };
    }

    // Skip AI detection for faster response during development
    const aiDetection = {
      isAIGenerated: false,
      confidence: 0,
      humanScore: 100,
      indicators: [],
      reasoning: 'AI detection skipped for performance'
    };
    
    // Use centralized AI service for analysis with CORRECTNESS validation
    
    const prompt = `
Analyze this interview response for CORRECTNESS and QUALITY. Be STRICT.

Question: "${question}"
Category: ${questionCategory}
Response: "${userResponse}"

CRITICAL EVALUATION CRITERIA:
1. CORRECTNESS: Is the answer factually accurate and directly addresses the question?
   - Wrong/incorrect answers get 1-3 responseQuality
   - Partially correct answers get 4-6
   - Fully correct and detailed answers get 7-10

2. RELEVANCE: Does the response actually answer what was asked?
   - Off-topic or tangential responses get low scores regardless of length

3. DEPTH: Does it show understanding or just surface-level knowledge?
   - Generic/memorized answers without examples get max 5
   - Specific examples and reasoning get higher scores

4. TECHNICAL ACCURACY: For technical questions, are concepts/code/methods correct?
   - Incorrect technical details drastically lower the score

DO NOT reward:
- Long responses that don't answer the question
- Responses that pass gibberish check but are factually wrong
- Generic answers without specifics
- Off-topic rambling

REWARD:
- Correct, accurate answers
- Specific examples demonstrating understanding
- Clear explanations of reasoning
- Direct answers to the question asked

Return JSON only: {"responseQuality": 1-10, "technicalAccuracy": 0-100, "clarityScore": 0-100, "depthScore": 0-100, "keywordsMatched": ["matched", "keywords"], "sentiment": "positive/neutral/negative", "confidence": 1-100, "isCorrect": true/false, "relevanceScore": 0-100}`;

    try {
      const response = await aiService.createChatCompletion([
        {
          role: "system",
          content: "You are a strict interview evaluator. Analyze responses critically and fairly. Do NOT give high scores for generic or low-quality responses."
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

      // CRITICAL: Apply correctness penalty - wrong answers get low scores regardless of length
      let correctnessPenalty = 1.0;
      if (analysis.isCorrect === false) {
        correctnessPenalty = 0.3; // 70% penalty for incorrect answers
        console.log(`⚠️ Answer marked as INCORRECT by AI - applying 70% penalty`);
      } else if (analysis.relevanceScore && analysis.relevanceScore < 50) {
        correctnessPenalty = 0.5; // 50% penalty for low relevance
        console.log(`⚠️ Answer has low relevance (${analysis.relevanceScore}%) - applying 50% penalty`);
      }

      // Calculate base analysis with correctness factor
      const baseAnalysis = {
        responseQuality: Math.min(10, Math.max(1, Math.round((analysis.responseQuality || 5) * correctnessPenalty))),
        technicalAccuracy: Math.min(100, Math.max(0, Math.round((analysis.technicalAccuracy || 50) * correctnessPenalty))),
        clarityScore: Math.min(100, Math.max(0, analysis.clarityScore || 50)),
        depthScore: Math.min(100, Math.max(0, Math.round((analysis.depthScore || 50) * correctnessPenalty))),
        keywordsMatched: analysis.keywordsMatched || [],
        sentiment: analysis.sentiment || 'neutral',
        confidence: Math.min(100, Math.max(1, analysis.confidence || 50)),
        isCorrect: analysis.isCorrect !== false,
        relevanceScore: analysis.relevanceScore || 50
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
      // Fallback analysis - apply validation check for fallback too
      const baseAnalysis = {
        responseQuality: 4,
        technicalAccuracy: 40,
        clarityScore: 40,
        depthScore: 35,
        keywordsMatched: [],
        sentiment: 'neutral' as const,
        confidence: 40
      };

      const responseAnalysis = aiDetectionService.analyzeResponseWithAI(
        { overallScore: 40 }, 
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
      const response = await aiService.createChatCompletion([
        {
          role: "system",
          content: `You are a ${personality} interviewer conducting a practice interview. Be helpful and encouraging while maintaining your interviewing style.`
        },
        {
          role: "user",
          content: prompt
        }
      ]);

      return response.choices[0]?.message?.content || "That's interesting. Can you tell me more about your approach?";
    } catch (error) {
      console.error('Error generating follow-up:', error);
      // Fallback follow-up based on response quality
      if (analysis.responseQuality >= 7) {
        return personalityConfig.encouragements[0] + " Can you elaborate on that further?";
      } else {
        return "That's interesting. Can you tell me more about your approach to this?";
      }
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
    const candidateResponsesRaw = messages
      .filter(m => m.sender === 'candidate')
      .map(m => m.content);
    
    const candidateResponses = candidateResponsesRaw.join('\n\n');
    const questionsAnswered = candidateResponsesRaw.length;
    
    // Validate all responses for gibberish/spam
    let invalidResponseCount = 0;
    let totalPenalty = 0;
    const validationResults: string[] = [];
    
    for (const response of candidateResponsesRaw) {
      const validation = this.validateResponseQuality(response);
      if (!validation.isValid) {
        invalidResponseCount++;
        totalPenalty += validation.penaltyScore;
        validationResults.push(validation.reason);
      }
    }
    
    // If most responses are invalid, return poor feedback immediately
    if (questionsAnswered > 0 && invalidResponseCount / questionsAnswered > 0.5) {
      console.log(`⚠️ Interview feedback: ${invalidResponseCount}/${questionsAnswered} responses flagged as invalid`);
      const avgPenalty = totalPenalty / invalidResponseCount;
      const score = Math.max(10, Math.round(100 - avgPenalty));
      
      return {
        performanceSummary: "Your responses did not demonstrate adequate preparation or effort. Many answers appeared to be incomplete, off-topic, or lacked meaningful content. We recommend practicing with thoughtful, detailed responses to improve your interview performance.",
        keyStrengths: ["Completed the interview session", "Showed up on time", "Attempted all questions"],
        areasForImprovement: [
          "Provide detailed, meaningful responses to interview questions",
          "Include specific examples and experiences in your answers",
          "Ensure responses are relevant to the question asked",
          "Practice articulating your thoughts clearly and completely"
        ],
        overallScore: score,
        technicalScore: Math.max(5, score - 10),
        communicationScore: Math.max(5, score - 5),
        confidenceScore: Math.max(5, score - 15),
        recommendedResources: [
          {
            title: "Interview Practice Platform",
            url: "https://leetcode.com",
            description: "Practice coding problems and technical interviews"
          },
          {
            title: "STAR Method Guide",
            url: "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique",
            description: "Learn how to structure behavioral interview responses"
          }
        ],
        nextSteps: [
          "Retake the interview with thoughtful, complete responses",
          "Practice answering common interview questions out loud",
          "Prepare specific examples from your experience",
          "Research the role and company before your next attempt"
        ]
      };
    }
    
    const prompt = `Analyze this interview session and provide HONEST feedback as JSON only:

Role: ${interviewData.role}
Interview Type: ${interviewData.interviewType}
Questions Answered: ${questionsAnswered}

Candidate Responses:
${candidateResponses}

IMPORTANT: Be STRICT and REALISTIC in your evaluation. 
- Only give scores above 70 for genuinely good responses with specific examples
- Give scores 50-70 for adequate but generic responses  
- Give scores below 50 for poor, vague, or off-topic responses
- Do NOT inflate scores - be honest about the quality

Return valid JSON only with these exact fields:
{
  "performanceSummary": "2-3 sentence honest assessment of actual performance",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "overallScore": 60,
  "technicalScore": 55,
  "communicationScore": 65,
  "confidenceScore": 60,
  "recommendedResources": [{"title": "Resource", "url": "https://example.com", "description": "Description"}],
  "nextSteps": ["step1", "step2", "step3"]
}

Be constructive but honest - don't give false praise.`;

    try {
      console.log('Generating AI feedback for interview:', interviewData.id);
      
      const response = await aiService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert interview coach. Return only valid JSON feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ]);

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
    userContext?: string,
    jobDescription?: string,
    previousQuestions?: string[]
  ): string {
    // Define question progression strategy with VARIATION
    let questionFocus = '';
    const randomVariation = Math.floor(Math.random() * 5); // 0-4 for variation
    switch (questionNumber) {
      case 1:
        // Add variation to first question to prevent duplicates
        const firstQuestionVariations = [
          'Start with a specific scenario-based question about real-world experience',
          'Begin with a technical problem-solving question with a unique twist',
          'Ask about a recent project or challenge they faced',
          'Start with an open-ended question about their approach to a common problem',
          'Begin with a situational question about teamwork or leadership'
        ];
        questionFocus = firstQuestionVariations[randomVariation] || 'Start with foundational concepts or basic experience related to the job';
        break;
      case 2:
        questionFocus = 'Ask about practical application and problem-solving relevant to job responsibilities';
        break;
      case 3:
        questionFocus = 'Focus on advanced concepts, system design, or specific skills mentioned in the job';
        break;
      case 4:
        questionFocus = 'Ask about experience with technologies/methodologies from the job requirements';
        break;
      case 5:
        questionFocus = 'Conclude with challenging situational questions based on job challenges';
        break;
      default:
        questionFocus = 'Ask a comprehensive question building on previous answers and job requirements';
    }

    // Detect if role is technical
    const technicalRoles = ['developer', 'engineer', 'programmer', 'software', 'full stack', 'frontend', 'backend', 'devops', 'data scientist', 'ml engineer', 'data engineer', 'architect'];
    const isTechnical = technicalRoles.some(tech => role.toLowerCase().includes(tech));

    // Build job-specific context
    const hasJobDescription = jobDescription && jobDescription.trim().length > 20;
    const jobContext = hasJobDescription ? `
JOB DESCRIPTION (USE THIS TO GENERATE RELEVANT QUESTIONS):
${jobDescription}

IMPORTANT: Generate questions that are DIRECTLY RELEVANT to:
- The specific responsibilities mentioned in the job description
- The required skills and qualifications listed
- The technologies, tools, and methodologies mentioned
- The industry or domain context of the role
- Real scenarios the candidate would face in this specific job
` : '';

    return `
Generate interview question ${questionNumber} for a ${role} candidate.
Interview Type: ${interviewType}
Difficulty: ${difficulty}
Question Focus: ${questionFocus}
${userContext ? `UNIQUE SESSION CONTEXT (ensure variation): ${userContext}` : ''}
${jobContext}

IMPORTANT FOR UNIQUENESS: 
- This is a unique interview session: ${userContext || 'session_' + Date.now()}
- Generate a DIFFERENT question than you would typically start with
- Vary the angle, scenario, or focus area to ensure uniqueness
- Use the session context to create variety

Previous responses (avoid repetition): ${previousResponses.slice(-2).join('; ')}

${previousQuestions && previousQuestions.length > 0 ? `
PREVIOUSLY ASKED QUESTIONS (GENERATE COMPLETELY DIFFERENT QUESTIONS):
${previousQuestions.map((q, i) => `${i + 1}. ${q.substring(0, 150)}...`).join('\n')}

YOU MUST NOT REPEAT ANY OF THE ABOVE QUESTIONS. Generate a fresh, unique question on a different topic/concept.
` : ''}

CRITICAL REQUIREMENTS:
${hasJobDescription ? `
*** PRIORITY: Generate questions based on the JOB DESCRIPTION above ***
- Ask about specific technologies, frameworks, or tools mentioned in the job posting
- Include questions about the actual responsibilities and challenges of this role
- Reference specific skills or qualifications required
- Ask situational questions based on what the job entails
- Do NOT ask generic coding questions - ask questions relevant to THIS specific job
` : ''}
- Generate ONLY ONE unique question completely different from previous ones
- Question should be specific to ${interviewType} interviews  
- Follow ${questionFocus} for this question number
${isTechnical && !hasJobDescription ? `
- FOR TECHNICAL ROLES: You can ask CODING QUESTIONS! 
  * Ask to write code for algorithms (sorting, searching, dynamic programming)
  * Ask to solve data structure problems (arrays, linked lists, trees, graphs)
  * Ask to implement functions or classes
  * Ask to debug code snippets
  * Ask system design questions
  * Ask about time/space complexity analysis
  * Examples: "Write a function to reverse a linked list", "Implement a binary search", "Design a cache system"
` : ''}
${hasJobDescription ? `
- Mix technical and behavioral questions based on the job requirements
- For behavioral questions: Ask about situations they'd face in THIS specific role
- For technical questions: Focus on the technologies and skills from the job posting
` : `
- For technical: Include specific technologies, algorithms, or coding concepts
- For behavioral: Use STAR method scenarios
`}
- Make it realistic and engaging

Return valid JSON only:
{
  "category": "${interviewType}",
  "question": "detailed specific question text here - MUST BE RELEVANT TO THE JOB DESCRIPTION IF PROVIDED",
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
    cleaned = cleaned.replace(/```\s*|\s*```/g, '').trim();
    
    // Try to extract JSON object using regex (more tolerant)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    } else {
      // Fallback: Remove any text before the first { or after the last }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
    
    // Validate that we have valid JSON structure
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      console.error('Raw AI content that failed to parse:', content.substring(0, 200));
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
    // Expanded fallback questions pool - randomly select to ensure variety
    const fallbackQuestions = {
      technical: {
        easy: [
          "Can you walk me through how you would approach debugging a simple JavaScript function that's not working as expected?",
          "What is the difference between var, let, and const in JavaScript?",
          "Explain how you would implement a simple REST API endpoint.",
          "What is the difference between HTTP GET and POST requests?",
          "How do you handle errors in your code?"
        ],
        medium: [
          "Explain the difference between synchronous and asynchronous programming. When would you use each?",
          "How would you optimize a slow database query?",
          "Describe the differences between SQL and NoSQL databases.",
          "What are design patterns and can you explain one you've used?",
          "How do you ensure code quality in your projects?"
        ],
        hard: [
          "Design a scalable system for handling millions of concurrent users. What are the key considerations?",
          "How would you implement a distributed caching system?",
          "Explain how you would design a real-time notification system.",
          "What strategies would you use to handle database sharding?",
          "How would you architect a microservices-based system?"
        ]
      },
      behavioral: {
        easy: [
          "Tell me about a time when you had to learn something new for a project.",
          "Describe a project you're most proud of and why.",
          "How do you stay updated with the latest technology trends?",
          "Tell me about a time you helped a teammate.",
          "What motivates you in your work?"
        ],
        medium: [
          "Describe a situation where you had to work with a difficult team member. How did you handle it?",
          "Tell me about a time when you had to meet a tight deadline.",
          "Describe a failure you experienced and what you learned from it.",
          "How do you prioritize your tasks when you have multiple deadlines?",
          "Tell me about a time you had to adapt to a significant change at work."
        ],
        hard: [
          "Tell me about a time when you had to make a decision with incomplete information. What was your process?",
          "Describe a situation where you had to influence stakeholders without direct authority.",
          "Tell me about a complex problem you solved and your approach.",
          "How have you handled conflicting priorities from different stakeholders?",
          "Describe a time when you had to lead a team through a challenging situation."
        ]
      }
    };

    // Get the question pool for this type and difficulty
    const typeQuestions = fallbackQuestions[interviewType as keyof typeof fallbackQuestions] || fallbackQuestions.technical;
    const difficultyQuestions = typeQuestions[difficulty as keyof typeof typeQuestions] || typeQuestions.medium;
    
    // Randomly select a question from the pool
    const randomIndex = Math.floor(Math.random() * difficultyQuestions.length);
    const questionText = difficultyQuestions[randomIndex];

    console.log(`⚠️ Using fallback question (AI unavailable): "${questionText.substring(0, 50)}..."`);

    return {
      category: interviewType as any,
      question: questionText,
      difficulty: difficulty as any,
      expectedKeywords: ['experience', 'skills', 'approach', 'solution', 'result'],
      followUpPrompts: ['Can you provide more details?', 'What was the outcome?', 'How did that impact the project?']
    };
  }

  private getFallbackFeedback() {
    return {
      performanceSummary: "Your interview session has been recorded. AI analysis was unavailable, so we recommend retaking the interview for a detailed assessment of your performance.",
      keyStrengths: ["Completed the interview session", "Showed effort", "Time management"],
      areasForImprovement: ["Consider retaking for AI-powered feedback", "Provide more detailed responses", "Practice with specific examples"],
      overallScore: 55,
      technicalScore: 50,
      communicationScore: 55,
      confidenceScore: 50,
      recommendedResources: [
        {
          title: "Interview Practice Platform",
          url: "https://leetcode.com",
          description: "Practice coding problems and technical interviews"
        }
      ],
      nextSteps: [
        "Retake the interview for complete AI analysis",
        "Practice more technical questions",
        "Prepare specific examples from your experience"
      ]
    };
  }

  // Validate if a response is meaningful or gibberish
  // This function aims to detect truly invalid responses while being lenient with legitimate short answers
  private validateResponseQuality(response: string): { isValid: boolean; reason: string; penaltyScore: number } {
    const trimmedResponse = response.trim().toLowerCase();
    
    // Extremely short responses (less than 10 chars) are always flagged
    if (trimmedResponse.length < 10) {
      return { isValid: false, reason: "Response is extremely short", penaltyScore: 95 };
    }

    // Short responses (10-30 chars) - check if they contain at least some coherent words
    if (trimmedResponse.length < 30) {
      const words = trimmedResponse.split(/\s+/).filter(w => w.length > 1);
      const basicWords = ['yes', 'no', 'i', 'we', 'they', 'it', 'is', 'are', 'was', 'can', 'do', 'have', 'think', 'agree', 'believe', 'know', 'sure', 'okay', 'good', 'thanks', 'sorry', 'not', 'don\'t', 'would', 'could'];
      const hasBasicWord = words.some(w => basicWords.includes(w));
      
      if (!hasBasicWord && words.length < 3) {
        return { isValid: false, reason: "Response is too short to evaluate", penaltyScore: 85 };
      }
      // Short but coherent responses get a moderate penalty (not flagged as invalid)
      // They'll naturally get lower scores from the AI evaluation
      return { isValid: true, reason: "Short but coherent response", penaltyScore: 0 };
    }

    // Check for repeated characters (e.g., "aaaaaa", "sdfsdfsdf") - at least 5 in a row
    const repeatedCharPattern = /(.)\1{5,}/;
    if (repeatedCharPattern.test(trimmedResponse)) {
      return { isValid: false, reason: "Response contains repeated characters", penaltyScore: 85 };
    }

    // Check for keyboard mashing patterns (random sequences like "asdfgh", "qwerty", "zxcvbn")
    // Only flag if the keyboard pattern is a significant portion of the response
    const keyboardPatterns = ['asdf', 'qwer', 'zxcv', 'hjkl', 'yuio', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'cvbn', 'vbnm', 'wert', 'erty', 'rtyu', 'tyui', 'uiop'];
    const keyboardMatchCount = keyboardPatterns.filter(pattern => trimmedResponse.includes(pattern)).length;
    // Only flag if multiple keyboard patterns are found OR response is mostly keyboard mashing
    if (keyboardMatchCount >= 2 && trimmedResponse.length < 80) {
      return { isValid: false, reason: "Response appears to be random keyboard input", penaltyScore: 80 };
    }

    // Check for mostly consonant-only words (gibberish detection)
    const words = trimmedResponse.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 3) { // Only check if there are enough words to analyze
      const gibberishWords = words.filter(word => {
        const vowels = (word.match(/[aeiou]/gi) || []).length;
        const ratio = vowels / word.length;
        return ratio < 0.08 && word.length > 5; // Very strict: almost no vowels in longer words
      });
      
      // Only flag if majority of words are gibberish
      if (gibberishWords.length / words.length > 0.6) {
        return { isValid: false, reason: "Response contains mostly unreadable content", penaltyScore: 85 };
      }
    }

    // Check for repeated word patterns (e.g., "test test test test")
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    const mostRepeatedWord = Math.max(...Object.values(wordCounts), 0);
    // Only flag if more than 60% of words are the same word
    if (mostRepeatedWord > words.length * 0.6 && words.length > 4) {
      return { isValid: false, reason: "Response contains excessive word repetition", penaltyScore: 75 };
    }

    // Check for meaningful English words - only for longer responses
    const commonWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'we', 'they', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'my', 'your', 'our', 'their', 'this', 'that', 'these', 'those', 'it', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'and', 'or', 'but', 'if', 'because', 'as', 'so', 'than', 'when', 'where', 'what', 'how', 'why', 'who', 'which', 'experience', 'work', 'project', 'team', 'problem', 'solution', 'skill', 'develop', 'manage', 'create', 'build', 'learn', 'use', 'help', 'make', 'think', 'believe', 'know', 'understand', 'yes', 'no', 'not', 'like', 'also', 'just', 'been', 'being', 'more', 'most', 'some', 'any', 'other', 'one', 'two', 'new', 'first', 'last', 'long', 'great', 'good', 'time', 'way', 'day', 'made', 'after', 'back', 'only', 'well', 'then', 'now', 'look', 'come', 'over', 'such', 'take', 'into'];
    
    const foundCommonWords = words.filter(word => commonWords.includes(word));
    // Only check coherence for longer responses (8+ words) and require only 10% common words
    if (words.length > 8 && foundCommonWords.length / words.length < 0.10) {
      return { isValid: false, reason: "Response lacks coherent English content", penaltyScore: 75 };
    }

    // Check for single character spam with spaces
    const singleCharSpam = /^([a-z]\s+){6,}$/i;
    if (singleCharSpam.test(trimmedResponse)) {
      return { isValid: false, reason: "Response is just random characters", penaltyScore: 90 };
    }

    // Response appears to be valid
    return { isValid: true, reason: "Response appears valid", penaltyScore: 0 };
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
        enableScreenRecording: true,
        enableActivityTracking: true
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
      suspiciousPatterns: [] as string[]
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
      concerns: [] as string[]
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