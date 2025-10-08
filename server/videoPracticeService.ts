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
    const isTechnical = interviewType === 'technical';
    
    // Check if AI service is available
    const isAIAvailable = !aiService['developmentMode'];
    
    // First 3 questions: Always General/Behavioral (realistic interview flow)
    const behavioralPrompts = [
      `Generate a realistic behavioral interview question for ${role} at ${difficulty} level. Focus on past experiences and challenges. The candidate will record a 60-90 second video answer.`,
      `Generate a realistic question about handling work situations for ${role}. Ask about deadlines, teamwork, or problem-solving. Keep it conversational like a real interview.`,
      `Generate a situational question for ${role} about professional challenges or decision-making. Make it specific to their role but realistic.`
    ];

    // Fallback questions for when AI is unavailable
    const fallbackBehavioral = [
      `Tell me about a challenging project you worked on as a ${role}. What was the situation, what actions did you take, and what was the result?`,
      `Describe a time when you had to work under a tight deadline as a ${role}. How did you prioritize your tasks and ensure quality?`,
      `Give me an example of a time when you had to collaborate with a difficult team member. How did you handle the situation?`
    ];

    for (let i = 0; i < 3; i++) {
      let questionText = fallbackBehavioral[i];
      
      if (isAIAvailable) {
        try {
          const aiResponse = await aiService.createChatCompletion([
            {
              role: 'system',
              content: 'You are an experienced interviewer. Generate ONE realistic interview question that would actually be asked in real interviews. No theoretical puzzles, just practical questions about experience and approach.'
            },
            {
              role: 'user',
              content: behavioralPrompts[i]
            }
          ], {
            temperature: 0.7,
            max_tokens: 150
          });

          questionText = aiResponse.choices[0]?.message?.content?.trim() || fallbackBehavioral[i];
        } catch (error) {
          console.log(`AI question generation failed, using fallback for question ${i + 1}`);
          questionText = fallbackBehavioral[i];
        }
      }

      questions.push({
        id: `q${i + 1}`,
        question: questionText,
        type: 'behavioral',
        timeLimit: 90
      });
    }

    // Next 3 questions: Technical OR Domain-specific
    if (isTechnical) {
      // Fallback technical questions
      const fallbackTechnical = [
        `Explain your approach to optimizing a database query that's running slowly. Walk through your thought process verbally - we want your logic and troubleshooting methodology, not code execution.`,
        `Describe how you would debug a production issue where users are reporting intermittent errors. What's your systematic approach to identifying and resolving the problem?`,
        `Explain how you would design a scalable system to handle 1 million concurrent users. Walk through your architecture decisions and reasoning verbally.`
      ];

      const technicalPrompts = [
        `Generate a technical question for ${role} asking them to EXPLAIN their approach to a coding problem. Emphasize: "Explain your thought process verbally, no code execution needed - just walk through your logic and approach."`,
        `Generate a debugging scenario question for ${role}. Ask them to explain how they would debug or optimize something. Focus on their problem-solving approach, not actual code.`,
        `Generate a system design or architecture question for ${role} at ${difficulty} level. Ask them to explain their approach and reasoning verbally.`
      ];

      for (let i = 0; i < 3; i++) {
        let questionText = fallbackTechnical[i];
        
        if (isAIAvailable) {
          try {
            const aiResponse = await aiService.createChatCompletion([
              {
                role: 'system',
                content: 'You are a technical interviewer. Generate questions that assess problem-solving and technical thinking. Explicitly tell candidates to EXPLAIN their approach verbally - we want their logic and thought process, NOT running code.'
              },
              {
                role: 'user',
                content: technicalPrompts[i]
              }
            ], {
              temperature: 0.6,
              max_tokens: 200
            });

            questionText = aiResponse.choices[0]?.message?.content?.trim() || fallbackTechnical[i];
          } catch (error) {
            console.log(`AI technical question generation failed, using fallback for question ${i + 4}`);
            questionText = fallbackTechnical[i];
          }
        }

        questions.push({
          id: `q${i + 4}`,
          question: questionText,
          type: 'technical',
          timeLimit: 90
        });
      }
    } else {
      // Fallback domain questions
      const fallbackDomain = [
        `How would you develop a strategy to improve team productivity in your role as ${role}? Explain your approach and the key factors you would consider.`,
        `Describe how you would handle a major challenge or crisis situation in your domain. Walk through your decision-making process and priorities.`,
        `Explain how you would improve an existing process or workflow in your field. What steps would you take and how would you measure success?`
      ];

      const domainPrompts = [
        `Generate a practical ${role} question about strategy or planning. The candidate will write a brief answer and then explain their reasoning verbally.`,
        `Generate a ${role} question about solving a real-world challenge in their domain. They'll provide written response and verbal explanation.`,
        `Generate a ${role} question about decision-making or process improvement. Ask for written answer with verbal justification.`
      ];

      for (let i = 0; i < 3; i++) {
        let questionText = fallbackDomain[i];
        
        if (isAIAvailable) {
          try {
            const aiResponse = await aiService.createChatCompletion([
              {
                role: 'system',
                content: `You are interviewing for a ${role} position. Generate practical, domain-specific questions that real hiring managers ask. The candidate will write their answer AND explain verbally.`
              },
              {
                role: 'user',
                content: domainPrompts[i]
              }
            ], {
              temperature: 0.6,
              max_tokens: 200
            });

            questionText = aiResponse.choices[0]?.message?.content?.trim() || fallbackDomain[i];
          } catch (error) {
            console.log(`AI domain question generation failed, using fallback for question ${i + 4}`);
            questionText = fallbackDomain[i];
          }
        }

        questions.push({
          id: `q${i + 4}`,
          question: questionText,
          type: 'domain',
          timeLimit: 90
        });
      }
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

      // Enhanced prompt matching your requirements
      const prompt = `Analyze this ${role} interview and provide honest, constructive feedback in the exact format below.

Performance Data:
- Content Quality: ${avgContentScore}/100
- Delivery & Speech: ${avgDeliveryScore}/100
- Body Language: ${avgBodyLanguageScore}/100
- Communication Clarity: ${avgCommunicationQuality}/100
- Overall Score: ${avgOverallScore}/100

Questions Answered: ${analyses.length}
Observed Strengths: ${[...new Set(allStrengths)].slice(0, 5).join(', ')}
Areas Needing Work: ${[...new Set(allWeaknesses)].slice(0, 5).join(', ')}

CRITICAL: Your feedback must follow this EXACT format - assess capability honestly:

1. Start with capability assessment:
   - If score >= 75: "You are capable for this ${role} role with strong [specific strengths]"
   - If score 60-74: "You show potential for this ${role} role but need improvement in [specific areas]"
   - If score < 60: "You need significant development for this ${role} role, particularly in [critical areas]"

2. Then provide specific improvements needed

Return as JSON:
{
  "capabilityAssessment": "You are [capable/show potential/need development] for this ${role} role...",
  "overallScore": ${avgOverallScore},
  "specificStrengths": ["strength 1 with example", "strength 2 with example", "strength 3 with example"],
  "criticalImprovements": ["improvement 1 - be specific", "improvement 2 - be specific", "improvement 3 - be specific"],
  "bodyLanguageFeedback": "Specific observations about posture, eye contact, gestures",
  "speechPatternFeedback": "Specific observations about pace, clarity, filler words, confidence",
  "technicalDepth": "Assessment of technical knowledge or domain expertise demonstrated",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "readinessLevel": "${avgOverallScore}% ready for real ${role} interview"
}`;

      const completion = await aiService.createChatCompletion([
        {
          role: "system",
          content: `You are an experienced ${role} hiring manager providing honest interview feedback. Be direct about capability - if someone is ready, say so. If they need work, specify exactly what. Format: "You are capable/need improvement in X" with specific examples. Return valid JSON only.`
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.3,
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
        questionsAnalyzed: analyses.length,
        verdict: avgOverallScore >= 75 ? 'Capable' : avgOverallScore >= 60 ? 'Shows Potential' : 'Needs Development'
      };

    } catch (error) {
      console.error('Error generating final feedback:', error);
      const avgScore = Math.round(analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length);

      return {
        capabilityAssessment: avgScore >= 75 
          ? `You are capable for this ${role} role with strong communication skills and good technical understanding.`
          : avgScore >= 60
          ? `You show potential for this ${role} role but need improvement in response depth and technical clarity.`
          : `You need significant development for this ${role} role, particularly in technical knowledge and communication confidence.`,
        overallScore: avgScore,
        specificStrengths: ['Completed all questions', 'Showed engagement', 'Attempted comprehensive answers'],
        criticalImprovements: ['Provide more specific examples from experience', 'Improve technical depth in explanations', 'Enhance confidence in delivery'],
        bodyLanguageFeedback: 'Work on maintaining steady eye contact with camera and minimizing nervous movements.',
        speechPatternFeedback: 'Reduce filler words (um, uh), speak at moderate pace, and project more confidence.',
        technicalDepth: 'Demonstrates basic understanding but needs more real-world examples and deeper technical insights.',
        nextSteps: ['Practice STAR method with specific examples', 'Review core technical concepts for the role', 'Record mock interviews to improve delivery'],
        readinessLevel: `${Math.max(50, avgScore)}% ready for real ${role} interview`,
        verdict: avgScore >= 75 ? 'Capable' : avgScore >= 60 ? 'Shows Potential' : 'Needs Development',
        performanceBreakdown: {
          content: avgScore,
          delivery: Math.max(0, avgScore - 5),
          bodyLanguage: Math.max(0, avgScore - 10),
          communication: avgScore
        },
        questionsAnalyzed: analyses.length
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