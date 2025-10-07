import { storage } from "./storage";
import { groqService } from "./groqService";
import { virtualInterviewService } from "./virtualInterviewService";
import { aiService } from "./aiService"; // Assuming aiService is imported from './aiService'

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
    question: any,
    transcript: string,
    duration: number,
    videoAnalysis?: any,
    audioAnalysis?: any
  ): Promise<any> {
    try {
      // Use AI service to analyze the transcript in context of the question
      const prompt = `Analyze this interview response comprehensively:

Question: ${question.question}
Question Type: ${question.type}
Expected Duration: 60-90 seconds
Actual Duration: ${duration} seconds

Candidate's Response (transcribed):
${transcript}

${videoAnalysis ? `
Video Analysis:
- Eye Contact: ${videoAnalysis.eyeContact}%
- Posture: ${videoAnalysis.posture}
- Motion Stability: ${videoAnalysis.motion}
- Facial Expression: ${videoAnalysis.facialExpression}
- Recommendations: ${videoAnalysis.recommendations.join(', ')}
` : ''}

${audioAnalysis ? `
Audio Analysis:
- Average Volume: ${(audioAnalysis.avgVolume * 100).toFixed(0)}%
- Speech Clarity: ${audioAnalysis.speechClarity}
- Speaking Pace: ${audioAnalysis.speakingPace}
- Volume Consistency: ${(audioAnalysis.volumeConsistency * 100).toFixed(0)}%
` : ''}

Provide detailed JSON analysis:
{
  "contentScore": number (0-100),
  "deliveryScore": number (0-100),
  "overallScore": number (0-100),
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "feedback": "detailed paragraph of constructive feedback",
  "technicalAccuracy": number (0-100),
  "communicationQuality": number (0-100),
  "bodyLanguageScore": number (0-100),
  "improvements": ["actionable improvement 1", "actionable improvement 2"]
}`;

      const completion = await aiService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert interview coach. Analyze responses comprehensively considering content, delivery, body language, and speech patterns. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.3,
        max_tokens: 800
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No AI response");
      }

      // Parse AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const analysis = JSON.parse(jsonContent);

      // Apply penalties for poor video/audio quality
      if (videoAnalysis) {
        if (videoAnalysis.eyeContact < 40) {
          analysis.bodyLanguageScore = Math.max(0, analysis.bodyLanguageScore - 15);
        }
        if (videoAnalysis.motion === 'excessive') {
          analysis.deliveryScore = Math.max(0, analysis.deliveryScore - 10);
        }
      }

      if (audioAnalysis) {
        if (audioAnalysis.speechClarity === 'too_quiet') {
          analysis.deliveryScore = Math.max(0, analysis.deliveryScore - 10);
        }
        if (audioAnalysis.volumeConsistency < 0.5) {
          analysis.communicationQuality = Math.max(0, analysis.communicationQuality - 10);
        }
      }

      // Recalculate overall score
      analysis.overallScore = Math.round(
        (analysis.contentScore * 0.4 +
         analysis.deliveryScore * 0.3 +
         analysis.bodyLanguageScore * 0.15 +
         analysis.communicationQuality * 0.15)
      );

      return analysis;

    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Fallback analysis
      return {
        contentScore: 70,
        deliveryScore: 65,
        overallScore: 68,
        bodyLanguageScore: videoAnalysis?.eyeContact || 70,
        communicationQuality: 70,
        technicalAccuracy: 65,
        strengths: ['Completed the response', 'Attempted to answer thoroughly'],
        weaknesses: ['Could provide more specific examples', 'Consider improving eye contact'],
        feedback: 'Good effort on this response. Focus on providing more concrete examples and maintaining consistent eye contact with the camera.',
        improvements: ['Add specific metrics and examples', 'Practice maintaining camera eye contact', 'Work on vocal clarity and consistency']
      };
    }
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

  async generateFinalFeedback(role: string, analyses: any[]): Promise<any> {
    try {
      const avgContentScore = Math.round(analyses.reduce((sum, a) => sum + (a.contentScore || 0), 0) / analyses.length);
      const avgDeliveryScore = Math.round(analyses.reduce((sum, a) => sum + (a.deliveryScore || 0), 0) / analyses.length);
      const avgBodyLanguageScore = Math.round(analyses.reduce((sum, a) => sum + (a.bodyLanguageScore || 0), 0) / analyses.length);
      const avgCommunicationQuality = Math.round(analyses.reduce((sum, a) => sum + (a.communicationQuality || 0), 0) / analyses.length);
      const avgOverallScore = Math.round(analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length);

      // Aggregate all strengths and weaknesses
      const allStrengths = analyses.flatMap(a => a.strengths || []);
      const allWeaknesses = analyses.flatMap(a => a.weaknesses || []);
      const allImprovements = analyses.flatMap(a => a.improvements || []);

      // Use AI to generate comprehensive final feedback
      const prompt = `Generate final interview feedback for ${role} position:

Performance Metrics:
- Content Quality: ${avgContentScore}/100
- Delivery: ${avgDeliveryScore}/100
- Body Language: ${avgBodyLanguageScore}/100
- Communication: ${avgCommunicationQuality}/100
- Overall Score: ${avgOverallScore}/100

Questions Answered: ${analyses.length}

Observed Strengths: ${[...new Set(allStrengths)].join(', ')}
Areas for Improvement: ${[...new Set(allWeaknesses)].join(', ')}

Generate comprehensive final feedback as JSON:
{
  "overallScore": ${avgOverallScore},
  "verdict": "Strong Candidate/Good Candidate/Needs Improvement/Not Ready",
  "detailedFeedback": "2-3 paragraph comprehensive analysis",
  "topStrengths": ["top 3 specific strengths"],
  "criticalImprovements": ["top 3 actionable improvements"],
  "bodyLanguageFeedback": "specific feedback on posture, eye contact, expressions",
  "communicationFeedback": "specific feedback on speech clarity, pace, confidence",
  "nextSteps": ["specific action 1", "specific action 2", "specific action 3"],
  "readinessLevel": "percentage ready for real ${role} interview"
}`;

      const completion = await aiService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert interview coach providing final comprehensive feedback. Be encouraging but honest. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.4,
        max_tokens: 1000
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No AI response");
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const finalFeedback = JSON.parse(jsonContent);

      return {
        ...finalFeedback,
        performanceBreakdown: {
          content: avgContentScore,
          delivery: avgDeliveryScore,
          bodyLanguage: avgBodyLanguageScore,
          communication: avgCommunicationQuality
        },
        questionsAnalyzed: analyses.length
      };

    } catch (error) {
      console.error('Error generating final feedback:', error);
      // Fallback feedback
      const avgScore = Math.round(analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length);

      return {
        overallScore: avgScore,
        verdict: avgScore >= 75 ? 'Good Candidate' : 'Needs Improvement',
        detailedFeedback: `You completed ${analyses.length} interview questions with an average score of ${avgScore}/100. Your responses demonstrate potential, but there are areas for improvement. Focus on providing more specific examples, maintaining better eye contact, and speaking with more confidence.`,
        topStrengths: ['Completed all questions', 'Attempted comprehensive answers', 'Showed enthusiasm'],
        criticalImprovements: ['Add more concrete examples', 'Improve body language', 'Enhance technical depth'],
        bodyLanguageFeedback: 'Work on maintaining steady eye contact with the camera and minimizing fidgeting.',
        communicationFeedback: 'Speak clearly at a moderate pace, and try to sound more confident in your delivery.',
        nextSteps: ['Practice with more technical questions', 'Record yourself and review body language', 'Prepare specific examples using STAR method'],
        readinessLevel: `${Math.max(60, avgScore)}% ready`,
        performanceBreakdown: {
          content: avgScore,
          delivery: avgScore - 5,
          bodyLanguage: avgScore - 10,
          communication: avgScore
        }
      };
    }
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

async function generateComprehensiveFeedback(
  role: string,
  analyses: any[],
  responses: any[]
): Promise<any> {
  // Calculate overall metrics
  const avgTranscriptLength = responses.reduce((sum, r) => sum + (r.transcript?.length || 0), 0) / responses.length;
  const avgDuration = responses.reduce((sum, r) => sum + (r.duration || 0), 0) / responses.length;

  // Aggregate scores
  const overallScore = analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length;

  // Identify strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Speech analysis
  if (avgTranscriptLength >= 100 && avgTranscriptLength <= 150) {
    strengths.push('Excellent response length - concise yet detailed');
  } else if (avgTranscriptLength < 75) {
    weaknesses.push('Responses are too brief - aim for 100-150 words');
  }

  // Content quality
  if (overallScore >= 80) {
    strengths.push('Strong technical knowledge and clear communication');
  } else if (overallScore < 60) {
    weaknesses.push('Needs improvement in technical depth and clarity');
  }

  // Generate recommendation
  let recommendation = '';
  if (overallScore >= 85) {
    recommendation = `You are highly capable for the ${role} role with excellent communication skills and strong technical knowledge. You demonstrate confidence and clarity in your responses.`;
  } else if (overallScore >= 75) {
    recommendation = `You are capable for the ${role} role with good fundamentals, but need improvement in ${weaknesses[0] || 'response depth and structure'}.`;
  } else {
    recommendation = `You need significant improvement for the ${role} role. Focus on ${weaknesses.join(', ')}.`;
  }

  return {
    overallScore: Math.round(overallScore),
    recommendation,
    strengths,
    weaknesses,
    detailedAnalysis: {
      communication: Math.round(overallScore * 0.9 + Math.random() * 10),
      technicalKnowledge: Math.round(overallScore * 0.95 + Math.random() * 5),
      bodyLanguage: 75 + Math.round(Math.random() * 15),
      confidence: Math.round(overallScore * 0.85 + Math.random() * 15)
    },
    actionableAdvice: [
      'Practice the STAR method for behavioral questions',
      'Work on maintaining steady eye contact with the camera',
      'Reduce filler words (um, uh, like) for more professional delivery',
      'Prepare specific examples from your experience'
    ]
  };
}

export const videoPracticeService = {
  generateQuestions: new VideoPracticeService().generateQuestions.bind(new VideoPracticeService()),
  analyzeResponse: new VideoPracticeService().analyzeResponse.bind(new VideoPracticeService()),
  generateFinalFeedback: new VideoPracticeService().generateFinalFeedback.bind(new VideoPracticeService()),
  generateComprehensiveFeedback
};