import Groq from 'groq-sdk';
import { db } from './db.js';
import { virtualInterviews, virtualInterviewMessages } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const DEFAULT_MODEL_STR = "llama-3.1-8b-instant";

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

interface InterviewContext {
  role: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  currentQuestionCount: number;
  personality: string;
  companyName?: string;
  jobDescription?: string;
  yearsExperience?: number;
  techStack?: string[];
}

interface ProcessResponse {
  message: string;
  isComplete: boolean;
  shouldEndInterview: boolean;
  questionNumber?: number;
  confidence?: number;
  suggestedFollowUp?: string;
  candidateEngagement?: 'low' | 'medium' | 'high';
}

interface InterviewAnalytics {
  responseQuality: number;
  technicalDepth: number;
  communicationSkills: number;
  problemSolvingApproach: number;
  overallEngagement: number;
  strengths: string[];
  improvementAreas: string[];
}

interface AdaptiveQuestionStrategy {
  questionType: 'technical' | 'behavioral' | 'scenario' | 'problem-solving' | 'culture-fit';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  domain: string;
  estimatedDuration: number;
}

export class ChatInterviewService {
  private groq: Groq | null;
  private readonly maxRetries = 3;
  private readonly maxTokens = 600;
  private readonly conversationMemoryLimit = 12;
  private readonly questionBank: Map<string, AdaptiveQuestionStrategy[]> = new Map();
  private readonly analytics: Map<number, InterviewAnalytics> = new Map();
  private readonly sessionStartTimes: Map<number, number> = new Map();

  constructor() {
    this.initializeQuestionBank();

    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("Chat Interview Groq client initialized successfully");
    } else {
      console.log("GROQ_API_KEY not provided - chat interviews will use fallback mode");
      this.groq = null;
    }
  }

  private initializeQuestionBank(): void {
    // Software Engineering & IT Roles - Include coding questions
    this.questionBank.set('software_engineer', [
      { questionType: 'problem-solving', complexity: 'intermediate', domain: 'coding', estimatedDuration: 300 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'algorithms', estimatedDuration: 240 },
      { questionType: 'behavioral', complexity: 'basic', domain: 'teamwork', estimatedDuration: 150 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'system-design', estimatedDuration: 200 },
    ]);

    this.questionBank.set('frontend_developer', [
      { questionType: 'problem-solving', complexity: 'intermediate', domain: 'frontend-coding', estimatedDuration: 300 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'javascript', estimatedDuration: 180 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'react', estimatedDuration: 200 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'performance', estimatedDuration: 240 },
    ]);

    this.questionBank.set('backend_developer', [
      { questionType: 'problem-solving', complexity: 'intermediate', domain: 'backend-coding', estimatedDuration: 300 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'api-design', estimatedDuration: 200 },
      { questionType: 'technical', complexity: 'advanced', domain: 'database', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'scalability', estimatedDuration: 240 },
    ]);

    this.questionBank.set('data_scientist', [
      { questionType: 'problem-solving', complexity: 'intermediate', domain: 'data-coding', estimatedDuration: 300 },
      { questionType: 'technical', complexity: 'advanced', domain: 'machine-learning', estimatedDuration: 240 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'statistics', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'data-analysis', estimatedDuration: 200 },
    ]);

    this.questionBank.set('devops_engineer', [
      { questionType: 'problem-solving', complexity: 'intermediate', domain: 'infrastructure-coding', estimatedDuration: 300 },
      { questionType: 'technical', complexity: 'advanced', domain: 'cloud-architecture', estimatedDuration: 240 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'containerization', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'deployment', estimatedDuration: 200 },
    ]);

    // Sales Roles
    this.questionBank.set('sales_representative', [
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'relationship-building', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'objection-handling', estimatedDuration: 240 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'persuasion', estimatedDuration: 200 },
      { questionType: 'scenario', complexity: 'basic', domain: 'customer-needs', estimatedDuration: 150 },
    ]);

    this.questionBank.set('sales_manager', [
      { questionType: 'behavioral', complexity: 'advanced', domain: 'team-leadership', estimatedDuration: 240 },
      { questionType: 'scenario', complexity: 'advanced', domain: 'sales-strategy', estimatedDuration: 300 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'coaching', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'performance-management', estimatedDuration: 200 },
    ]);

    // Marketing Roles
    this.questionBank.set('marketing_manager', [
      { questionType: 'scenario', complexity: 'intermediate', domain: 'campaign-strategy', estimatedDuration: 300 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'creativity', estimatedDuration: 180 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'analytics', estimatedDuration: 200 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'brand-management', estimatedDuration: 240 },
    ]);

    this.questionBank.set('digital_marketing_specialist', [
      { questionType: 'technical', complexity: 'intermediate', domain: 'digital-campaigns', estimatedDuration: 240 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'social-media-strategy', estimatedDuration: 200 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'seo-sem', estimatedDuration: 180 },
      { questionType: 'behavioral', complexity: 'basic', domain: 'data-driven-thinking', estimatedDuration: 150 },
    ]);

    // Finance Roles
    this.questionBank.set('financial_analyst', [
      { questionType: 'technical', complexity: 'advanced', domain: 'financial-modeling', estimatedDuration: 300 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'investment-analysis', estimatedDuration: 240 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'valuation', estimatedDuration: 200 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'attention-to-detail', estimatedDuration: 150 },
    ]);

    this.questionBank.set('investment_banker', [
      { questionType: 'technical', complexity: 'expert', domain: 'deal-structuring', estimatedDuration: 400 },
      { questionType: 'scenario', complexity: 'advanced', domain: 'client-presentation', estimatedDuration: 300 },
      { questionType: 'behavioral', complexity: 'advanced', domain: 'pressure-handling', estimatedDuration: 180 },
      { questionType: 'technical', complexity: 'advanced', domain: 'market-analysis', estimatedDuration: 240 },
    ]);

    // Product Management
    this.questionBank.set('product_manager', [
      { questionType: 'scenario', complexity: 'advanced', domain: 'product-strategy', estimatedDuration: 300 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'stakeholder-management', estimatedDuration: 200 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'prioritization', estimatedDuration: 240 },
      { questionType: 'technical', complexity: 'basic', domain: 'data-analysis', estimatedDuration: 180 },
    ]);

    // Other important roles
    this.questionBank.set('business_analyst', [
      { questionType: 'scenario', complexity: 'intermediate', domain: 'process-improvement', estimatedDuration: 240 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'requirements-gathering', estimatedDuration: 200 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'analytical-thinking', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'stakeholder-communication', estimatedDuration: 200 },
    ]);

    this.questionBank.set('hr_manager', [
      { questionType: 'behavioral', complexity: 'advanced', domain: 'people-management', estimatedDuration: 240 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'conflict-resolution', estimatedDuration: 200 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'empathy', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'policy-development', estimatedDuration: 220 },
    ]);

    this.questionBank.set('operations_manager', [
      { questionType: 'scenario', complexity: 'intermediate', domain: 'process-optimization', estimatedDuration: 260 },
      { questionType: 'behavioral', complexity: 'intermediate', domain: 'problem-solving', estimatedDuration: 200 },
      { questionType: 'technical', complexity: 'intermediate', domain: 'resource-management', estimatedDuration: 180 },
      { questionType: 'scenario', complexity: 'intermediate', domain: 'quality-control', estimatedDuration: 200 },
    ]);
  }

  async startInterviewChat(
    interviewId: number,
    context: InterviewContext
  ): Promise<string> {
    if (!interviewId || interviewId <= 0) {
      throw new Error('Invalid interview ID provided');
    }

    // Initialize analytics for this interview
    this.initializeAnalytics(interviewId);
    this.sessionStartTimes.set(interviewId, Date.now());

    if (!this.groq) {
      const fallbackGreeting = this.generatePersonalizedGreeting(context);
      await this.storeEnhancedMessage(interviewId, 'assistant', fallbackGreeting, 1, 'greeting');
      return fallbackGreeting;
    }

    const systemPrompt = this.buildAdvancedSystemPrompt(context);

    try {
      const response = await this.callGroqWithRetry({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.buildGreetingPrompt(context) }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.7,
        max_tokens: this.maxTokens,
      });

      const greeting = response.choices[0]?.message?.content?.trim() || 
        this.generatePersonalizedGreeting(context);

      await this.storeEnhancedMessage(interviewId, 'assistant', greeting, 1, 'greeting');
      await this.updateInterviewMetadata(interviewId, { status: 'active', startTime: new Date() });

      return greeting;
    } catch (error) {
      console.error('Error generating interview greeting:', error);
      const fallbackGreeting = this.generatePersonalizedGreeting(context);
      await this.storeEnhancedMessage(interviewId, 'assistant', fallbackGreeting, 1, 'greeting');
      return fallbackGreeting;
    }
  }

  async processUserResponse(
    interviewId: number,
    userMessage: string,
    context: InterviewContext
  ): Promise<ProcessResponse> {
    // Enhanced input validation
    const validationResult = this.validateUserInput(userMessage);
    if (!validationResult.isValid) {
      return {
        message: validationResult.message!,
        isComplete: false,
        shouldEndInterview: false,
        candidateEngagement: 'low'
      };
    }

    if (!this.groq) {
      return this.getAdaptiveFallbackResponse(context, userMessage);
    }

    // Advanced help-seeking and inappropriate response detection
    const responseAnalysis = this.analyzeUserResponse(userMessage);
    if (responseAnalysis.needsRedirection) {
      const redirectionMessage = this.generateContextualRedirection(responseAnalysis.type, context);
      await this.storeEnhancedMessage(interviewId, 'assistant', redirectionMessage, context.currentQuestionCount, 'redirection');
      return {
        message: redirectionMessage,
        isComplete: false,
        shouldEndInterview: false,
        candidateEngagement: responseAnalysis.engagement
      };
    }

    try {
      // Store user message with enhanced metadata
      await this.storeEnhancedMessage(interviewId, 'user', userMessage.trim(), context.currentQuestionCount, 'response');

      // Update real-time analytics
      this.updateCandidateAnalytics(interviewId, userMessage, responseAnalysis);

      // Get intelligent conversation history
      const conversationHistory = await this.getIntelligentConversationHistory(interviewId, context);

      // Build advanced prompt with dynamic context
      const chatMessages: ChatMessage[] = [
        { role: "system", content: this.buildDynamicSystemPrompt(context, responseAnalysis) },
        ...conversationHistory,
        { role: "user", content: userMessage.trim() }
      ];

      const response = await this.callGroqWithRetry({
        messages: chatMessages,
        model: DEFAULT_MODEL_STR,
        temperature: this.calculateOptimalTemperature(context, responseAnalysis),
        max_tokens: this.maxTokens,
      });

      const assistantMessage = response.choices[0]?.message?.content?.trim() || 
        "Thank you for your response. Let me continue with the next question.";

      // Advanced progression logic
      const progressionDecision = this.makeIntelligentProgressionDecision(userMessage, assistantMessage, context, responseAnalysis);

      let finalMessage = assistantMessage;
      let shouldEndInterview = false;

      if (progressionDecision.shouldComplete) {
        finalMessage = this.generatePersonalizedConclusion(assistantMessage, context);
        shouldEndInterview = true;
        await this.finalizeInterviewAnalytics(interviewId);
      }

      // Store assistant response with metadata
      await this.storeEnhancedMessage(interviewId, 'assistant', finalMessage, context.currentQuestionCount, 'question');

      // Intelligent question count management
      if (progressionDecision.shouldAdvance && !progressionDecision.shouldComplete) {
        await this.smartIncrementQuestionCount(interviewId, responseAnalysis);
      }

      return {
        message: finalMessage,
        isComplete: progressionDecision.shouldComplete,
        shouldEndInterview,
        questionNumber: context.currentQuestionCount,
        confidence: responseAnalysis.confidence,
        suggestedFollowUp: progressionDecision.suggestedFollowUp,
        candidateEngagement: responseAnalysis.engagement
      };

    } catch (error) {
      console.error('Error processing user response:', error);
      return this.getAdaptiveFallbackResponse(context, userMessage);
    }
  }

  private buildAdvancedSystemPrompt(context: InterviewContext): string {
    const roleSpecificGuidance = this.getRoleSpecificGuidance(context.role);
    const adaptiveDifficulty = this.getAdaptiveDifficultyGuidance(context);
    const personalityProfile = this.getAdvancedPersonalityGuidance(context.personality);
    const contextualFramework = this.buildContextualFramework(context);

    return `You are an expert AI interviewer conducting a ${context.interviewType} interview for a ${context.role} position${context.companyName ? ` at ${context.companyName}` : ''}.

CORE INTERVIEWING PRINCIPLES:
1. You are a SKILLED ASSESSOR, not a teacher or helper
2. NEVER provide solutions, hints, or guidance to questions
3. Maintain professional boundaries while being engaging
4. Ask ONE strategically chosen question at a time
5. Adapt your approach based on candidate responses
6. Ensure questions build upon previous answers naturally
7. Total interview questions: ${context.totalQuestions}
8. Current progress: ${context.currentQuestionCount}/${context.totalQuestions}

${roleSpecificGuidance}

${adaptiveDifficulty}

${personalityProfile}

${contextualFramework}

ADVANCED ASSESSMENT FRAMEWORK:
- Technical Competency: Depth of knowledge, problem-solving approach
- Communication: Clarity, structure, professional articulation
- Experience Application: Real-world examples, lessons learned
- Cultural Alignment: Values, work style, team collaboration
- Growth Mindset: Learning approach, adaptability, curiosity

DYNAMIC RESPONSE STRATEGY:
- Strong responses: Ask deeper follow-up questions
- Weak responses: Probe for understanding without helping
- Unclear responses: Ask for clarification professionally
- Off-topic responses: Redirect gently but firmly

Remember: Your goal is to uncover the candidate's true capabilities through strategic questioning, not to educate them.`;
  }

  private buildDynamicSystemPrompt(context: InterviewContext, responseAnalysis: any): string {
    const basePrompt = this.buildAdvancedSystemPrompt(context);

    const dynamicAdditions = [];

    if (responseAnalysis.confidence < 0.5) {
      dynamicAdditions.push("ADAPTATION: The candidate seems uncertain. Ask simpler follow-up questions to build confidence.");
    }

    if (responseAnalysis.technicalDepth > 0.8) {
      dynamicAdditions.push("ADAPTATION: The candidate shows strong technical knowledge. Increase question complexity.");
    }

    if (responseAnalysis.engagement === 'low') {
      dynamicAdditions.push("ADAPTATION: Re-engage the candidate with more interactive or scenario-based questions.");
    }

    return basePrompt + (dynamicAdditions.length > 0 ? '\n\nDYNAMIC ADAPTATIONS:\n' + dynamicAdditions.join('\n') : '');
  }

  private analyzeUserResponse(userMessage: string): {
    needsRedirection: boolean;
    type: string;
    confidence: number;
    technicalDepth: number;
    engagement: 'low' | 'medium' | 'high';
    wordCount: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  } {
    const wordCount = userMessage.trim().split(/\s+/).length;

    // Help-seeking patterns
    const helpPatterns = [
      /can you help me/i,
      /give me a hint/i,
      /what.{0,15}(answer|solution)/i,
      /tell me how/i,
      /what should i (say|do)/i,
      /(don't|do not) know/i,
      /can you explain/i,
      /i'm not sure/i
    ];

    // Inappropriate patterns
    const inappropriatePatterns = [
      /fuck|shit|damn/i,
      /this is stupid/i,
      /waste of time/i,
      /skip this/i
    ];

    // Technical depth indicators
    const technicalIndicators = [
      /implement|algorithm|architecture|design pattern/i,
      /performance|optimization|scalability/i,
      /database|api|framework|library/i,
      /testing|debugging|deployment/i
    ];

    const needsRedirection = helpPatterns.some(p => p.test(userMessage)) || 
                            inappropriatePatterns.some(p => p.test(userMessage));

    let redirectionType = 'none';
    if (helpPatterns.some(p => p.test(userMessage))) redirectionType = 'help-seeking';
    if (inappropriatePatterns.some(p => p.test(userMessage))) redirectionType = 'inappropriate';

    const technicalDepth = technicalIndicators.filter(p => p.test(userMessage)).length / technicalIndicators.length;

    const confidence = Math.min(1, wordCount / 50) * (needsRedirection ? 0.3 : 1);

    let engagement: 'low' | 'medium' | 'high' = 'medium';
    if (wordCount < 10 || needsRedirection) engagement = 'low';
    else if (wordCount > 30 && technicalDepth > 0.3) engagement = 'high';

    const positiveWords = ['excited', 'interesting', 'enjoy', 'love', 'great', 'excellent'];
    const negativeWords = ['hate', 'boring', 'difficult', 'hard', 'confused', 'frustrated'];

    const sentiment = positiveWords.some(w => userMessage.toLowerCase().includes(w)) ? 'positive' :
                     negativeWords.some(w => userMessage.toLowerCase().includes(w)) ? 'negative' : 'neutral';

    return {
      needsRedirection,
      type: redirectionType,
      confidence,
      technicalDepth,
      engagement,
      wordCount,
      sentiment
    };
  }

  private generateContextualRedirection(type: string, context: InterviewContext): string {
    const redirections: Record<string, string[]> = {
      'help-seeking': [
        "I understand this might be challenging, but I need to assess your current knowledge. Please share your thoughts based on your experience.",
        "This is an evaluation, so I can't provide hints. Please tell me what you know about this topic from your perspective.",
        "I'm here to understand your approach and knowledge. Please answer based on what you've learned or encountered before."
      ],
      'inappropriate': [
        "Let's keep our conversation professional and focused on the interview. Please answer the question I asked.",
        "I'd like to maintain a professional tone. Could you please address the question I posed?",
        "Let's stay focused on the interview. Please provide your response to the question."
      ]
    };

    const messages = redirections[type] || redirections['help-seeking'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private makeIntelligentProgressionDecision(
    userMessage: string, 
    assistantMessage: string, 
    context: InterviewContext, 
    responseAnalysis: any
  ): {
    shouldAdvance: boolean;
    shouldComplete: boolean;
    suggestedFollowUp?: string;
  } {
    const isSubstantialResponse = responseAnalysis.wordCount >= 15 && responseAnalysis.confidence > 0.4;
    const hasNewQuestion = assistantMessage.includes('?') || 
                          /next question|let me ask|moving on/i.test(assistantMessage);

    const shouldAdvance = isSubstantialResponse && hasNewQuestion && !responseAnalysis.needsRedirection;
    
    // Fix: Interview should complete when we've processed totalQuestions responses
    // currentQuestionCount starts at 0, so after processing question 1,2,3,4,5 it should be 5
    const shouldComplete = (context.currentQuestionCount + 1) >= context.totalQuestions;

    let suggestedFollowUp;
    if (responseAnalysis.technicalDepth > 0.7) {
      suggestedFollowUp = "Consider asking a deeper technical question";
    } else if (responseAnalysis.engagement === 'low') {
      suggestedFollowUp = "Try a more engaging scenario-based question";
    }

    return { shouldAdvance, shouldComplete, suggestedFollowUp };
  }

  private getRoleSpecificGuidance(role: string): string {
    const roleGuidance: Record<string, string> = {
      // Technical Roles
      'software_engineer': `SOFTWARE ENGINEER FOCUS: Assess algorithms, data structures, system design, code quality, problem-solving approach, and software architecture knowledge.`,
      'frontend_developer': `FRONTEND FOCUS: Assess UI/UX understanding, React/Vue knowledge, responsive design, browser compatibility, performance optimization, and accessibility.`,
      'backend_developer': `BACKEND FOCUS: Evaluate API design, database knowledge, server architecture, scalability, security practices, and system integration.`,
      'fullstack_developer': `FULLSTACK FOCUS: Test both frontend and backend capabilities, system architecture understanding, and end-to-end development approach.`,
      'data_scientist': `DATA SCIENCE FOCUS: Assess statistical knowledge, machine learning algorithms, data analysis, programming skills (Python/R), and business insight generation.`,
      'devops_engineer': `DEVOPS FOCUS: Assess CI/CD knowledge, infrastructure management, monitoring, automation, cloud services, and security practices.`,
      'mobile_developer': `MOBILE FOCUS: Evaluate platform-specific knowledge, mobile UX principles, performance optimization, device compatibility, and app store processes.`,
      
      // Sales Roles
      'sales_representative': `SALES REP FOCUS: Assess relationship building, objection handling, customer needs identification, persuasion skills, and closing techniques.`,
      'sales_manager': `SALES MANAGEMENT FOCUS: Evaluate team leadership, sales strategy, coaching abilities, performance management, and revenue optimization.`,
      'account_manager': `ACCOUNT MANAGEMENT FOCUS: Assess client relationship management, upselling/cross-selling, customer retention, and strategic account planning.`,
      'business_development': `BUSINESS DEV FOCUS: Evaluate market analysis, partnership development, strategic thinking, negotiation skills, and growth strategy.`,
      
      // Marketing Roles
      'marketing_manager': `MARKETING FOCUS: Assess campaign strategy, brand management, market analysis, creative thinking, and ROI measurement.`,
      'digital_marketing_specialist': `DIGITAL MARKETING FOCUS: Evaluate SEO/SEM, social media strategy, content marketing, analytics, and digital campaign optimization.`,
      'content_marketing_specialist': `CONTENT MARKETING FOCUS: Assess content strategy, storytelling, audience engagement, SEO writing, and content performance analysis.`,
      'social_media_manager': `SOCIAL MEDIA FOCUS: Evaluate platform expertise, community management, content creation, engagement strategies, and social media analytics.`,
      
      // Finance Roles
      'financial_analyst': `FINANCIAL ANALYST FOCUS: Assess financial modeling, valuation techniques, market analysis, Excel proficiency, and investment analysis.`,
      'investment_banker': `INVESTMENT BANKING FOCUS: Evaluate deal structuring, financial modeling, client presentation skills, market knowledge, and pressure handling.`,
      'accountant': `ACCOUNTING FOCUS: Assess financial reporting, tax knowledge, audit procedures, regulatory compliance, and attention to detail.`,
      'financial_planner': `FINANCIAL PLANNING FOCUS: Evaluate investment strategies, risk assessment, client advisory skills, and retirement planning expertise.`,
      
      // Management & Operations
      'product_manager': `PRODUCT MANAGEMENT FOCUS: Assess product strategy, stakeholder management, prioritization skills, market analysis, and user experience understanding.`,
      'project_manager': `PROJECT MANAGEMENT FOCUS: Evaluate planning skills, resource management, risk mitigation, team coordination, and delivery excellence.`,
      'operations_manager': `OPERATIONS FOCUS: Assess process optimization, resource management, quality control, team leadership, and continuous improvement.`,
      'hr_manager': `HR MANAGEMENT FOCUS: Evaluate people management, conflict resolution, policy development, talent acquisition, and organizational development.`,
      'business_analyst': `BUSINESS ANALYSIS FOCUS: Assess requirements gathering, process improvement, data analysis, stakeholder communication, and solution design.`
    };

    return roleGuidance[role.toLowerCase()] || `ROLE-SPECIFIC FOCUS: Assess technical skills, problem-solving ability, and relevant experience for the ${role} position.`;
  }

  private getCodingQuestionGuidance(role: string): string {
    const codingRoles = [
      'software_engineer', 'frontend_developer', 'backend_developer', 
      'fullstack_developer', 'data_scientist', 'devops_engineer', 
      'mobile_developer', 'data_analyst', 'qa_engineer', 'cybersecurity_specialist'
    ];

    if (!codingRoles.includes(role.toLowerCase())) {
      return '';
    }

    const codingGuidance: Record<string, string> = {
      'software_engineer': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: Array manipulation, string processing, or basic algorithm (e.g., "Find the first non-repeating character in a string")
2. JOB-SPECIFIC: System design coding question (e.g., "Design a simple rate limiter class" or "Implement a basic cache with TTL")`,

      'frontend_developer': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: DOM manipulation or JavaScript logic (e.g., "Implement a debounce function")
2. JOB-SPECIFIC: React/Component question (e.g., "Create a reusable modal component" or "Implement infinite scroll")`,

      'backend_developer': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: Data structure manipulation (e.g., "Merge two sorted linked lists")
2. JOB-SPECIFIC: API/Database question (e.g., "Design a REST endpoint for user authentication" or "Write a SQL query for user analytics")`,

      'data_scientist': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: Statistical analysis or data processing (e.g., "Calculate moving average from a dataset")
2. JOB-SPECIFIC: ML/Analytics question (e.g., "Implement a basic linear regression" or "Design A/B testing framework")`,

      'devops_engineer': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: System automation script (e.g., "Write a script to monitor disk usage")
2. JOB-SPECIFIC: Infrastructure question (e.g., "Design a CI/CD pipeline configuration" or "Implement health check system")`,

      'mobile_developer': `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: Algorithm for mobile constraints (e.g., "Optimize image loading for slow networks")
2. JOB-SPECIFIC: Platform-specific question (e.g., "Implement pull-to-refresh" or "Design offline data sync")`
    };

    return codingGuidance[role.toLowerCase()] || `CODING QUESTIONS (Include 1-2 per interview):
1. PROBLEM-SOLVING: Basic algorithm or data structure question
2. JOB-SPECIFIC: Role-specific technical implementation question`;
  }

  private getAdaptiveDifficultyGuidance(context: InterviewContext): string {
    const experience = context.yearsExperience || 0;
    const adjustedDifficulty = this.calculateAdjustedDifficulty(context.difficulty, experience);

    const difficultyMap: Record<string, string> = {
      'beginner': 'Ask fundamental concepts with practical examples. Focus on understanding and potential.',
      'intermediate': 'Combine theory with real-world scenarios. Test problem-solving and best practices.',
      'advanced': 'Explore complex scenarios, edge cases, and system design. Expect detailed technical discussions.',
      'expert': 'Challenge with architectural decisions, trade-offs, and industry expertise. Deep technical evaluation.'
    };

    return `DIFFICULTY LEVEL: ${adjustedDifficulty.toUpperCase()} - ${difficultyMap[adjustedDifficulty]}`;
  }

  private calculateAdjustedDifficulty(baseDifficulty: string, experience: number): string {
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    let baseIndex = difficultyLevels.indexOf(baseDifficulty.toLowerCase());

    if (baseIndex === -1) baseIndex = 1; // Default to intermediate

    // Adjust based on experience
    if (experience >= 7) baseIndex = Math.min(3, baseIndex + 1);
    else if (experience <= 2) baseIndex = Math.max(0, baseIndex - 1);

    return difficultyLevels[baseIndex];
  }

  private buildContextualFramework(context: InterviewContext): string {
    let framework = `INTERVIEW CONTEXT:\n`;

    if (context.companyName) {
      framework += `- Company: ${context.companyName}\n`;
    }

    if (context.techStack?.length) {
      framework += `- Required Technologies: ${context.techStack.join(', ')}\n`;
    }

    if (context.yearsExperience) {
      framework += `- Expected Experience Level: ${context.yearsExperience} years\n`;
    }

    framework += `- Interview Type: ${context.interviewType}\n`;
    framework += `- Assessment Areas: Technical skills, Problem-solving, Communication, Cultural fit\n`;

    return framework;
  }

  private async updateCandidateAnalytics(interviewId: number, userMessage: string, responseAnalysis: any): Promise<void> {
    const currentAnalytics = this.analytics.get(interviewId) || this.createEmptyAnalytics();

    // Update metrics based on response
    currentAnalytics.responseQuality = (currentAnalytics.responseQuality + responseAnalysis.confidence) / 2;
    currentAnalytics.technicalDepth = Math.max(currentAnalytics.technicalDepth, responseAnalysis.technicalDepth);
    currentAnalytics.communicationSkills = (currentAnalytics.communicationSkills + Math.min(1, responseAnalysis.wordCount / 50)) / 2;

    // Track engagement
    const engagementScore = responseAnalysis.engagement === 'high' ? 1 : responseAnalysis.engagement === 'medium' ? 0.6 : 0.3;
    currentAnalytics.overallEngagement = (currentAnalytics.overallEngagement + engagementScore) / 2;

    this.analytics.set(interviewId, currentAnalytics);
  }

  private createEmptyAnalytics(): InterviewAnalytics {
    return {
      responseQuality: 0,
      technicalDepth: 0,
      communicationSkills: 0,
      problemSolvingApproach: 0,
      overallEngagement: 0,
      strengths: [],
      improvementAreas: []
    };
  }

  private initializeAnalytics(interviewId: number): void {
    this.analytics.set(interviewId, this.createEmptyAnalytics());
  }

  private async finalizeInterviewAnalytics(interviewId: number): Promise<void> {
    const analytics = this.analytics.get(interviewId);
    if (analytics) {
      // Store analytics in database for later retrieval
      try {
        await this.storeInterviewAnalytics(interviewId, analytics);
      } catch (error) {
        console.error('Error storing interview analytics:', error);
      }
    }
  }

  private async storeInterviewAnalytics(interviewId: number, analytics: InterviewAnalytics): Promise<void> {
    // This would typically store in a separate analytics table
    // For now, we'll update the main interview record
    await db.update(virtualInterviews)
      .set({
        analytics: JSON.stringify(analytics),
        updatedAt: new Date()
      })
      .where(eq(virtualInterviews.id, interviewId));
  }

  private async storeEnhancedMessage(
    interviewId: number,
    sender: 'user' | 'assistant',
    content: string,
    questionNumber: number,
    messageType: string
  ): Promise<void> {
    try {
      await db.insert(virtualInterviewMessages).values({
        interviewId: interviewId,
        sender: sender === 'user' ? 'candidate' : 'interviewer',
        messageType: messageType,
        content: content.trim(),
        messageIndex: questionNumber,
        responseTime: sender === 'user' ? Math.floor((Date.now() - (this.sessionStartTimes.get(interviewId) || Date.now())) / 1000) : 0,
        keywordsMatched: [], // Initialize as empty array for the text array field
      });
    } catch (error) {
      console.error('Error storing enhanced message:', error);
    }
  }

  private async updateInterviewMetadata(interviewId: number, updates: any): Promise<void> {
    try {
      await db.update(virtualInterviews)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(virtualInterviews.id, interviewId));
    } catch (error) {
      console.error('Error updating interview metadata:', error);
    }
  }

  private validateUserInput(userMessage: string): { isValid: boolean; message?: string } {
    if (!userMessage?.trim()) {
      return {
        isValid: false,
        message: "I didn't receive your response. Could you please answer the question?"
      };
    }

    if (userMessage.trim().length < 3) {
      return {
        isValid: false,
        message: "Your response seems quite brief. Could you provide a more detailed answer?"
      };
    }

    if (userMessage.length > 2000) {
      return {
        isValid: false,
        message: "Your response is quite lengthy. Please provide a more concise answer focusing on the key points."
      };
    }

    return { isValid: true };
  }

  private generatePersonalizedGreeting(context: InterviewContext): string {
    const companyMention = context.companyName ? ` for the ${context.role} position at ${context.companyName}` : ` for the ${context.role} role`;
    const experienceAdjustment = context.yearsExperience && context.yearsExperience > 3 ? 
      " I'm excited to discuss your extensive experience." : 
      " I look forward to learning about your background.";

    const greetings = [
      `Hello! I'm your AI interviewer${companyMention}. This ${context.interviewType} interview will cover ${context.totalQuestions} questions to assess your qualifications.${experienceAdjustment} Let's begin with: Please introduce yourself and walk me through your professional journey.`,

      `Welcome to your interview${companyMention}! I'll be conducting this ${context.interviewType} assessment with ${context.totalQuestions} strategic questions.${experienceAdjustment} To start: Tell me about yourself and what draws you to this position.`,

      `Good day! I'm here to conduct your ${context.interviewType} interview${companyMention}. We'll explore your skills through ${context.totalQuestions} targeted questions.${experienceAdjustment} First question: Please share your background and relevant experience for this role.`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private buildGreetingPrompt(context: InterviewContext): string {
    return `Generate a professional, engaging greeting for a ${context.interviewType} interview. Include:
- Welcome and introduction as AI interviewer
- Mention the ${context.role} position${context.companyName ? ` at ${context.companyName}` : ''}
- Brief overview of interview structure (${context.totalQuestions} questions)
- First question asking for self-introduction and relevant background
Keep it warm but professional, matching the ${context.personality} personality style.`;
  }

  private generatePersonalizedConclusion(assistantMessage: string, context: InterviewContext): string {
    const conclusions = [
      `\n\nExcellent! That concludes our ${context.interviewType} interview for the ${context.role} position. Thank you for sharing your insights and experience. I'll now compile a comprehensive assessment with detailed feedback on your performance and recommendations.`,

      `\n\nWonderful! We've completed all ${context.totalQuestions} questions for today's interview. I appreciate your thoughtful responses and professional engagement. Your detailed evaluation and personalized feedback will be ready shortly.`,

      `\n\nPerfect! That wraps up our interview session. Thank you for demonstrating your skills and sharing your perspective. I'll now generate your assessment report with strengths, areas for improvement, and specific recommendations for your career development.`
    ];

    const randomConclusion = conclusions[Math.floor(Math.random() * conclusions.length)];
    return assistantMessage + randomConclusion;
  }

  private async getIntelligentConversationHistory(interviewId: number, context: InterviewContext): Promise<ChatMessage[]> {
    try {
      const messages = await db
        .select()
        .from(virtualInterviewMessages)
        .where(eq(virtualInterviewMessages.interviewId, interviewId))
        .orderBy(desc(virtualInterviewMessages.createdAt))
        .limit(this.conversationMemoryLimit);

      return messages
        .reverse()
        .map(msg => ({
          role: msg.sender === 'candidate' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  private calculateOptimalTemperature(context: InterviewContext, responseAnalysis: any): number {
    let baseTemperature = 0.7;

    // Adjust based on interview type
    if (context.interviewType === 'technical') baseTemperature = 0.6;
    else if (context.interviewType === 'behavioral') baseTemperature = 0.8;

    // Adjust based on candidate engagement
    if (responseAnalysis.engagement === 'low') baseTemperature += 0.1;
    else if (responseAnalysis.engagement === 'high') baseTemperature -= 0.1;

    return Math.max(0.3, Math.min(0.9, baseTemperature));
  }

  private async smartIncrementQuestionCount(interviewId: number, responseAnalysis: any): Promise<void> {
    try {
      // Only increment if this was a substantial response
      if (responseAnalysis.confidence > 0.4 && responseAnalysis.wordCount >= 10) {
        const interview = await db.select()
          .from(virtualInterviews)
          .where(eq(virtualInterviews.id, interviewId))
          .limit(1);

        if (interview.length > 0) {
          const newCount = Math.min((interview[0].questionsAsked || 0) + 1, interview[0].totalQuestions || 5);
          await db.update(virtualInterviews)
            .set({ 
              questionsAsked: newCount,
              updatedAt: new Date(),
              lastResponseQuality: responseAnalysis.confidence
            })
            .where(eq(virtualInterviews.id, interviewId));
        }
      }
    } catch (error) {
      console.error('Error in smart increment question count:', error);
    }
  }

  private getAdvancedPersonalityGuidance(personality: string): string {
    const personalityProfiles: Record<string, string> = {
      'professional': `COMMUNICATION STYLE: Maintain formal, business-appropriate tone. Be direct but respectful. Focus on competency and results.`,
      'friendly': `COMMUNICATION STYLE: Be warm and approachable while maintaining professionalism. Use encouraging language and show genuine interest.`,
      'technical': `COMMUNICATION STYLE: Focus on technical accuracy and depth. Use industry terminology appropriately. Probe for detailed technical understanding.`,
      'supportive': `COMMUNICATION STYLE: Be encouraging and patient. Provide constructive framing for questions. Help candidate feel comfortable while maintaining assessment integrity.`
    };

    return personalityProfiles[personality?.toLowerCase()] || personalityProfiles['professional'];
  }

  private getAdaptiveFallbackResponse(context: InterviewContext, userMessage: string): ProcessResponse {
    const fallbackResponses = [
      "Thank you for that response. Let me ask you about your experience with problem-solving in challenging situations.",
      "I appreciate your answer. Can you tell me about a technical challenge you've overcome recently?",
      "That's interesting. How do you typically approach learning new technologies or concepts?",
      "Thank you for sharing. What motivates you most in your professional work?"
    ];

    const selectedResponse = fallbackResponses[context.currentQuestionCount % fallbackResponses.length];
    const shouldComplete = (context.currentQuestionCount + 1) >= context.totalQuestions;

    return {
      message: selectedResponse,
      isComplete: shouldComplete,
      shouldEndInterview: shouldComplete,
      questionNumber: context.currentQuestionCount,
      confidence: 0.5,
      candidateEngagement: 'medium'
    };
  }

  private async callGroqWithRetry(params: any): Promise<any> {
    if (!this.groq) {
      throw new Error('Groq client not initialized');
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.groq.chat.completions.create(params);
      } catch (error: any) {
        console.error(`Groq API attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async getInterviewAnalytics(interviewId: number): Promise<InterviewAnalytics | null> {
    try {
      const interview = await db
        .select()
        .from(virtualInterviews)
        .where(eq(virtualInterviews.id, interviewId))
        .limit(1);

      if (interview[0]?.analytics) {
        return JSON.parse(interview[0].analytics);
      }

      return this.analytics.get(interviewId) || null;
    } catch (error) {
      console.error('Error getting interview analytics:', error);
      return null;
    }
  }
}

// Export instance
export const chatInterviewService = new ChatInterviewService();