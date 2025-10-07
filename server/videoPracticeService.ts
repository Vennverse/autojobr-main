import { storage } from "./storage";
import { groqService } from "./groqService";
import { virtualInterviewService } from "./virtualInterviewService";

interface VideoPracticeQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'domain';
  timeLimit: number;
}

interface SimplifiedAnalysis {
  overallScore: number;
  contentScore: number;
  deliveryScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  detailedFeedback: string;
}

export class VideoPracticeService {
  async generateQuestions(
    role: string,
    interviewType: string,
    difficulty: string
  ): Promise<VideoPracticeQuestion[]> {
    const questions: VideoPracticeQuestion[] = [];
    const count = 5;

    for (let i = 0; i < count; i++) {
      const questionType = i < 2 ? 'behavioral' : 
                          interviewType === 'technical' ? 'technical' : 'domain';
      
      const question = await virtualInterviewService.generateQuestion(
        questionType,
        difficulty,
        role,
        i + 1,
        [],
        ''
      );

      questions.push({
        id: `q${i + 1}`,
        question: question.question,
        type: questionType as any,
        timeLimit: 90
      });
    }

    return questions;
  }

  async analyzeResponse(
    question: VideoPracticeQuestion,
    transcript: string,
    duration: number
  ): Promise<any> {
    const wordsPerMinute = Math.round((transcript.split(' ').length / duration) * 60);
    const fillerWords = this.countFillerWords(transcript);
    const clarity = Math.max(0, 100 - (fillerWords * 5));
    
    const contentAnalysis = await this.analyzeContent(question.question, transcript);
    
    return {
      questionId: question.id,
      contentScore: contentAnalysis.score,
      clarity,
      wordsPerMinute,
      fillerWords,
      relevance: contentAnalysis.relevance
    };
  }

  private countFillerWords(text: string): number {
    const fillers = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'sort of', 'kind of'];
    const words = text.toLowerCase().split(' ');
    return words.filter(w => fillers.includes(w)).length;
  }

  private async analyzeContent(question: string, answer: string): Promise<{ score: number, relevance: number }> {
    if (!groqService.client || answer.length < 20) {
      return { score: 70, relevance: 70 };
    }

    try {
      const prompt = `Rate this interview answer 0-100:
Q: ${question}
A: ${answer}

Reply only: {"score": N, "relevance": N}`;

      const response = await groqService.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 50
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"score": 70, "relevance": 70}');
      return result;
    } catch (error) {
      console.error('Content analysis error:', error);
      return { score: 70, relevance: 70 };
    }
  }

  async generateFinalFeedback(
    role: string,
    analyses: any[]
  ): Promise<SimplifiedAnalysis> {
    const avgContent = Math.round(analyses.reduce((sum, a) => sum + a.contentScore, 0) / analyses.length);
    const avgClarity = Math.round(analyses.reduce((sum, a) => sum + a.clarity, 0) / analyses.length);
    const avgRelevance = Math.round(analyses.reduce((sum, a) => sum + a.relevance, 0) / analyses.length);
    
    const deliveryScore = Math.round((avgClarity * 0.6) + (analyses[0]?.wordsPerMinute >= 120 && analyses[0]?.wordsPerMinute <= 180 ? 40 : 20));
    const contentScore = Math.round((avgContent * 0.5) + (avgRelevance * 0.5));
    const overallScore = Math.round((contentScore * 0.6) + (deliveryScore * 0.4));

    const strengths = [];
    const improvements = [];

    if (avgClarity >= 80) strengths.push('Clear and confident communication');
    if (avgContent >= 80) strengths.push('Strong answer quality and depth');
    if (avgRelevance >= 85) strengths.push('Highly relevant responses');

    if (avgClarity < 70) improvements.push('Reduce filler words, practice speaking more clearly');
    if (avgContent < 70) improvements.push('Provide more detailed examples using STAR method');
    if (avgRelevance < 70) improvements.push('Stay more focused on the question asked');

    const avgFillers = Math.round(analyses.reduce((sum, a) => sum + a.fillerWords, 0) / analyses.length);
    if (avgFillers > 3) improvements.push(`Reduce filler words (avg ${avgFillers} per answer)`);

    let recommendation = '';
    if (overallScore >= 85) {
      recommendation = `You demonstrate strong capability for ${role} positions. You're interview-ready with excellent communication and content quality.`;
    } else if (overallScore >= 70) {
      recommendation = `You show good potential for ${role} positions. Focus on the improvement areas and you'll be highly competitive.`;
    } else {
      recommendation = `You have foundational skills for ${role}. Practice the suggested improvements, especially using STAR method and reducing filler words.`;
    }

    const detailedFeedback = this.buildDetailedFeedback(
      overallScore,
      contentScore,
      deliveryScore,
      strengths,
      improvements,
      analyses
    );

    return {
      overallScore,
      contentScore,
      deliveryScore,
      strengths,
      improvements,
      recommendation,
      detailedFeedback
    };
  }

  // Simple ML-based scoring from transcript analysis (Web Speech API output)
  async analyzeTranscript(transcript: string, question: string): Promise<any> {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Analyze filler words
    const fillerWords = this.countFillerWords(transcript);
    const fillerRatio = wordCount > 0 ? (fillerWords / wordCount) * 100 : 0;
    
    // Speech clarity score (less filler words = higher clarity)
    const clarity = Math.max(0, 100 - (fillerWords * 5));
    
    // Estimate speaking pace (Web Speech API transcripts are usually real-time)
    const wordsPerMinute = wordCount >= 100 ? Math.min(180, wordCount * 0.6) : wordCount * 0.5;
    
    // Content relevance (keyword matching)
    const questionKeywords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const transcriptLower = transcript.toLowerCase();
    const relevantKeywords = questionKeywords.filter(kw => transcriptLower.includes(kw)).length;
    const relevance = Math.min(100, (relevantKeywords / Math.max(questionKeywords.length, 1)) * 100);
    
    // Structure indicators (STAR method keywords)
    const structureKeywords = ['situation', 'task', 'action', 'result', 'because', 'therefore', 'first', 'then', 'finally', 'however'];
    const structureScore = structureKeywords.filter(kw => transcriptLower.includes(kw)).length * 10;
    
    // Content quality scoring
    let contentScore = 40; // Base score
    
    // Word count scoring (100-150 is ideal)
    if (wordCount >= 100 && wordCount <= 150) {
      contentScore += 30; // Perfect range
    } else if (wordCount >= 80 && wordCount < 100) {
      contentScore += 20; // Slightly short
    } else if (wordCount > 150 && wordCount <= 200) {
      contentScore += 25; // Slightly long
    } else if (wordCount > 50 && wordCount < 80) {
      contentScore += 10; // Too short
    }
    
    // Structure bonus
    contentScore += Math.min(20, structureScore);
    
    // Relevance bonus
    if (relevance > 70) contentScore += 15;
    else if (relevance > 50) contentScore += 10;
    else if (relevance > 30) contentScore += 5;
    
    // Technical depth indicators (for technical roles)
    const technicalTerms = ['optimize', 'algorithm', 'performance', 'debug', 'implement', 'architecture', 'scalability', 'efficiency'];
    const technicalDepth = technicalTerms.filter(term => transcriptLower.includes(term)).length * 5;
    
    return {
      contentScore: Math.min(100, contentScore),
      clarity,
      wordsPerMinute,
      fillerWords,
      fillerRatio: Math.round(fillerRatio * 10) / 10,
      relevance: Math.round(relevance),
      wordCount,
      structureScore: Math.min(100, structureScore),
      technicalDepth: Math.min(100, technicalDepth)
    };
  }

  private buildDetailedFeedback(
    overall: number,
    content: number,
    delivery: number,
    strengths: string[],
    improvements: string[],
    analyses: any[]
  ): string {
    let feedback = `📊 **Overall Score: ${overall}/100**\n\n`;
    
    feedback += `**Performance Breakdown:**\n`;
    feedback += `• Content Quality: ${content}/100\n`;
    feedback += `• Delivery & Clarity: ${delivery}/100\n\n`;
    
    if (strengths.length > 0) {
      feedback += `**✅ Key Strengths:**\n`;
      strengths.forEach(s => feedback += `• ${s}\n`);
      feedback += '\n';
    }
    
    if (improvements.length > 0) {
      feedback += `**📈 Areas for Improvement:**\n`;
      improvements.forEach(i => feedback += `• ${i}\n`);
      feedback += '\n';
    }
    
    const avgWPM = Math.round(analyses.reduce((sum, a) => sum + a.wordsPerMinute, 0) / analyses.length);
    feedback += `**Speaking Pace:** ${avgWPM} words/minute `;
    feedback += avgWPM >= 120 && avgWPM <= 180 ? '✓ (Ideal range)\n' : '(Aim for 120-180 wpm)\n';
    
    return feedback;
  }
}

export const videoPracticeService = new VideoPracticeService();
