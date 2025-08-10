import Groq from 'groq-sdk';
import { db } from './db.js';
import { virtualInterviews, virtualInterviewMessages } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const DEFAULT_MODEL_STR = "llama-3.1-8b-instant";

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface InterviewContext {
  role: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  currentQuestionCount: number;
  personality: string;
}

export class ChatInterviewService {
  private groq: Groq;

  constructor() {
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("Chat Interview Groq client initialized successfully");
    } else {
      console.log("GROQ_API_KEY not provided - chat interviews will use fallback mode");
      this.groq = null as any;
    }
  }

  async startInterviewChat(
    interviewId: number,
    context: InterviewContext
  ): Promise<string> {
    if (!this.groq) {
      return "Hello! I'm your AI interviewer. I'll ask you questions about your experience and skills. Let's start with: Tell me about yourself and your background.";
    }

    const systemPrompt = this.buildInterviewerSystemPrompt(context);
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please start the interview with a greeting and your first question." }
        ],
        model: DEFAULT_MODEL_STR,
        temperature: 0.7,
        max_tokens: 300,
      });

      const greeting = response.choices[0]?.message?.content || 
        "Hello! I'm your AI interviewer. Let's start with: Tell me about yourself and your background.";

      // Store the initial message
      await this.storeMessage(interviewId, 'assistant', greeting, 1);

      return greeting;
    } catch (error) {
      console.error('Error generating interview greeting:', error);
      return "Hello! I'm your AI interviewer. I'll ask you questions about your experience and skills. Let's start with: Tell me about yourself and your background.";
    }
  }

  async processUserResponse(
    interviewId: number,
    userMessage: string,
    context: InterviewContext
  ): Promise<{ message: string; isComplete: boolean; shouldEndInterview: boolean }> {
    if (!this.groq) {
      return this.getFallbackResponse(context);
    }

    // Check if user is trying to get hints or answers
    const isSeekingHelp = this.detectHelpSeeking(userMessage);
    if (isSeekingHelp) {
      const warningMessage = "I understand you may have questions, but I'm here to evaluate your knowledge. Please answer the question I asked based on your own understanding and experience.";
      await this.storeMessage(interviewId, 'assistant', warningMessage, context.currentQuestionCount);
      return {
        message: warningMessage,
        isComplete: false,
        shouldEndInterview: false
      };
    }

    // Get conversation history
    const conversationHistory = await this.getConversationHistory(interviewId);
    
    // Build chat messages for GROQ
    const chatMessages: ChatMessage[] = [
      { role: "system", content: this.buildInterviewerSystemPrompt(context) },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    try {
      const response = await this.groq.chat.completions.create({
        messages: chatMessages,
        model: DEFAULT_MODEL_STR,
        temperature: 0.7,
        max_tokens: 400,
      });

      const assistantMessage = response.choices[0]?.message?.content || 
        "Thank you for your response. Let me ask you another question.";

      // Check if we should move to next question or end interview
      const shouldMoveToNext = this.shouldMoveToNextQuestion(userMessage, assistantMessage);
      const isComplete = context.currentQuestionCount >= context.totalQuestions;

      let finalMessage = assistantMessage;
      let shouldEndInterview = false;

      if (isComplete) {
        finalMessage += "\n\nThat concludes our interview! Thank you for your time. I'll now generate your feedback and results.";
        shouldEndInterview = true;
      }

      // Store both user message and assistant response
      await this.storeMessage(interviewId, 'user', userMessage, context.currentQuestionCount);
      await this.storeMessage(interviewId, 'assistant', finalMessage, context.currentQuestionCount);

      // Increment question count if moving to next question
      if (shouldMoveToNext && !isComplete) {
        await this.incrementQuestionCount(interviewId);
      }

      return {
        message: finalMessage,
        isComplete,
        shouldEndInterview
      };

    } catch (error) {
      console.error('Error processing user response:', error);
      return this.getFallbackResponse(context);
    }
  }

  private buildInterviewerSystemPrompt(context: InterviewContext): string {
    return `You are an AI interviewer conducting a ${context.interviewType} interview for a ${context.role} position. 

CRITICAL RULES:
1. You are conducting an interview, NOT providing help or hints
2. NEVER give away answers, hints, or help the candidate solve problems
3. If the candidate asks for help, hints, or tries to get answers from you, politely redirect them to answer based on their own knowledge
4. Ask ONE question at a time and wait for their complete response
5. Ask ${context.totalQuestions} distinct questions total
6. After each answer, acknowledge their response briefly and move to the next question
7. Keep your responses concise and professional
8. Focus on evaluating their knowledge, not teaching them

Interview Style: ${context.personality}
Difficulty Level: ${context.difficulty}

Question Categories to Cover:
- Technical knowledge and skills
- Problem-solving approach
- Experience and background
- Behavioral scenarios (if appropriate)
- Industry-specific challenges

Remember: You are evaluating the candidate, not helping them. Be encouraging but maintain professional boundaries.`;
  }

  private detectHelpSeeking(userMessage: string): boolean {
    const helpPatterns = [
      /can you help me/i,
      /give me a hint/i,
      /what.{0,10}answer/i,
      /tell me how/i,
      /show me the/i,
      /what should i say/i,
      /how do i answer/i,
      /give me the solution/i,
      /what.{0,10}correct/i,
      /help me with/i
    ];

    return helpPatterns.some(pattern => pattern.test(userMessage));
  }

  private shouldMoveToNextQuestion(userMessage: string, assistantResponse: string): boolean {
    // Check if the user provided a substantial response (more than just a few words)
    const wordCount = userMessage.trim().split(/\s+/).length;
    if (wordCount < 3) return false;

    // Check if assistant is asking a new question (contains question mark at the end)
    return assistantResponse.includes('?') && wordCount >= 5;
  }

  private async getConversationHistory(interviewId: number): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(virtualInterviewMessages)
      .where(eq(virtualInterviewMessages.interviewId, interviewId))
      .orderBy(virtualInterviewMessages.messageIndex);

    return messages.map(msg => ({
      role: msg.sender === 'candidate' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  private async storeMessage(
    interviewId: number,
    sender: 'user' | 'assistant',
    content: string,
    questionNumber: number
  ): Promise<void> {
    await db.insert(virtualInterviewMessages).values({
      interviewId,
      sender: sender === 'user' ? 'candidate' : 'interviewer',
      messageType: sender === 'user' ? 'response' : 'question',
      content,
      messageIndex: questionNumber,
      responseTime: 0
    });
  }

  private async incrementQuestionCount(interviewId: number): Promise<void> {
    // Get current interview data
    const interview = await db.select()
      .from(virtualInterviews)
      .where(eq(virtualInterviews.id, interviewId))
      .limit(1);

    if (interview.length > 0) {
      const newCount = (interview[0].questionsAsked || 0) + 1;
      await db.update(virtualInterviews)
        .set({ questionsAsked: newCount })
        .where(eq(virtualInterviews.id, interviewId));
    }
  }

  private getFallbackResponse(context: InterviewContext): { message: string; isComplete: boolean; shouldEndInterview: boolean } {
    const fallbackQuestions = [
      "Tell me about your experience with this technology.",
      "How do you approach problem-solving in your work?",
      "Describe a challenging project you've worked on.",
      "What are your thoughts on best practices in this field?",
      "How do you stay updated with industry trends?"
    ];

    const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    const isComplete = context.currentQuestionCount >= context.totalQuestions;

    return {
      message: isComplete ? 
        "Thank you for your responses. That concludes our interview!" :
        `Thank you for your answer. ${randomQuestion}`,
      isComplete,
      shouldEndInterview: isComplete
    };
  }
}

export const chatInterviewService = new ChatInterviewService();