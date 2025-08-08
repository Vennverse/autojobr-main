import Groq from 'groq-sdk';
import { behavioralAnalyzer } from './behavioralAnalyzer';

interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number; // 0-100
  indicators: string[];
  humanScore: number; // 0-100, higher = more human-like
  reasoning: string;
  responseTime?: number;
  linguisticPatterns?: LinguisticAnalysis;
  crossValidation?: CrossValidationResult;
}

interface LinguisticAnalysis {
  vocabularyComplexity: number;
  sentenceStructure: 'simple' | 'complex' | 'ai-like';
  coherenceScore: number;
  repetitionPatterns: string[];
  unusualPhrases: string[];
}

interface CrossValidationResult {
  models: string[];
  agreement: number;
  confidence: number;
  consensusResult: boolean;
}

interface ResponseAnalysis {
  originalAnalysis: any;
  aiDetection: AIDetectionResult;
  finalScore: number; // Adjusted score considering AI usage
  partialResultsOnly: boolean; // Flag for recruiters
}

export class AIDetectionService {
  private groq: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY not found - AI detection will use fallback mode");
      this.groq = null as any; // Will use fallback detection
    } else {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  }

  async detectAIUsage(userResponse: string, questionContext?: string, behavioralData?: any): Promise<AIDetectionResult> {
    const startTime = Date.now();
    
    // Quick checks for obvious AI patterns
    const quickIndicators = this.performQuickChecks(userResponse);
    
    if (quickIndicators.isObvious) {
      return {
        isAIGenerated: true,
        confidence: 95,
        indicators: quickIndicators.indicators,
        humanScore: 5,
        reasoning: "Contains obvious AI-generated patterns",
        responseTime: Date.now() - startTime
      };
    }

    // Enhanced linguistic analysis
    const linguisticAnalysis = this.performLinguisticAnalysis(userResponse);
    
    // Behavioral pattern analysis if available
    let behavioralScore = 50; // neutral
    if (behavioralData) {
      const behavioralProfile = behavioralAnalyzer.generateBehavioralProfile(behavioralData);
      behavioralScore = behavioralProfile.overallAuthenticity;
    }

    // Use Groq for detailed analysis with minimal tokens (if available)
    if (!this.groq) {
      // Enhanced fallback analysis combining multiple signals
      const combinedScore = this.calculateCombinedScore(quickIndicators, linguisticAnalysis, behavioralScore);
      
      return {
        isAIGenerated: combinedScore.isAI,
        confidence: combinedScore.confidence,
        indicators: [...quickIndicators.indicators, ...linguisticAnalysis.indicators],
        humanScore: combinedScore.humanScore,
        reasoning: 'Enhanced pattern analysis (AI service unavailable)',
        responseTime: Date.now() - startTime,
        linguisticPatterns: linguisticAnalysis
      };
    }

    try {
      const prompt = `Analyze if this response was AI-generated. Be concise.

Response: "${userResponse}"
${questionContext ? `Question: "${questionContext}"` : ''}

Check for:
- Unnatural phrasing/structure
- Generic AI-style responses
- Overly perfect grammar
- Typical AI patterns

Return JSON: {"aiGenerated": boolean, "confidence": 0-100, "humanScore": 0-100, "indicators": ["reason1", "reason2"], "reasoning": "brief explanation"}`;

      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Faster, cheaper model
        temperature: 0.1,
        max_tokens: 200, // Minimal tokens
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI detection response');

      const analysis = JSON.parse(this.cleanJsonResponse(content));
      
      // Cross-validation with multiple models if available
      const crossValidation = await this.performCrossValidation(userResponse, questionContext);
      
      // Combine AI analysis with behavioral and linguistic signals
      const finalResult = this.combineDetectionResults(
        analysis,
        linguisticAnalysis,
        behavioralScore,
        crossValidation
      );
      
      return {
        isAIGenerated: finalResult.isAIGenerated,
        confidence: Math.min(100, Math.max(0, finalResult.confidence)),
        indicators: finalResult.indicators,
        humanScore: Math.min(100, Math.max(0, finalResult.humanScore)),
        reasoning: finalResult.reasoning,
        responseTime: Date.now() - startTime,
        linguisticPatterns: linguisticAnalysis,
        crossValidation
      };
    } catch (error) {
      console.error('AI detection error:', error);
      // Fallback to pattern-based detection
      return this.fallbackDetection(userResponse);
    }
  }

  private performQuickChecks(response: string): { isObvious: boolean; indicators: string[] } {
    const indicators: string[] = [];
    const text = response.toLowerCase();

    // Common AI phrases
    const aiPhrases = [
      'as an ai', 'i am an ai', 'i cannot', 'i apologize, but',
      'however, it\'s important to note', 'it\'s worth noting that',
      'while i understand', 'from my training data',
      'based on my knowledge', 'in my opinion as an ai'
    ];

    // Overly structured responses
    const structurePatterns = [
      /^(first|firstly|1\.)/i,
      /\n(second|secondly|2\.)/i,
      /\n(third|thirdly|3\.)/i,
      /\n(finally|in conclusion)/i
    ];

    // Check for AI phrases
    for (const phrase of aiPhrases) {
      if (text.includes(phrase)) {
        indicators.push(`Contains AI phrase: "${phrase}"`);
      }
    }

    // Check for overly structured responses
    const structureMatches = structurePatterns.filter(pattern => pattern.test(response));
    if (structureMatches.length >= 3) {
      indicators.push('Overly structured numbered/bullet format');
    }

    // Check for excessive length relative to question complexity
    if (response.length > 800 && response.split('\n').length > 5) {
      indicators.push('Unusually detailed and structured response');
    }

    return {
      isObvious: indicators.length >= 2,
      indicators
    };
  }

  private fallbackDetection(response: string): AIDetectionResult {
    const quickCheck = this.performQuickChecks(response);
    const confidence = quickCheck.indicators.length * 25;
    
    return {
      isAIGenerated: confidence > 50,
      confidence: Math.min(100, confidence),
      indicators: quickCheck.indicators,
      humanScore: Math.max(0, 100 - confidence),
      reasoning: 'Pattern-based detection (AI analysis unavailable)'
    };
  }

  analyzeResponseWithAI(originalAnalysis: any, aiDetection: AIDetectionResult): ResponseAnalysis {
    let finalScore = originalAnalysis.overallScore || originalAnalysis.responseQuality || 0;
    let partialResultsOnly = false;

    // Enhanced penalty system based on confidence and cross-validation
    const penaltyMultiplier = this.calculatePenaltyMultiplier(aiDetection);
    
    if (aiDetection.isAIGenerated) {
      if (aiDetection.confidence > 80 && aiDetection.crossValidation?.agreement > 0.7) {
        // High confidence with cross-validation agreement - severe penalty
        finalScore = Math.max(0, finalScore * 0.1); // 90% penalty
        partialResultsOnly = true;
      } else if (aiDetection.confidence > 60) {
        // Significant penalty for likely AI usage
        finalScore = Math.max(0, finalScore * penaltyMultiplier);
        partialResultsOnly = true;
      } else if (aiDetection.confidence > 40) {
        // Moderate penalty for suspicious responses
        finalScore = Math.max(0, finalScore * 0.7); // 30% penalty
        partialResultsOnly = true;
      }
    }

    // Additional penalties for specific patterns
    if (aiDetection.linguisticPatterns?.sentenceStructure === 'ai-like') {
      finalScore = Math.max(0, finalScore * 0.8);
    }
    
    if (aiDetection.responseTime && aiDetection.responseTime < 100) {
      // Suspiciously fast analysis suggests pre-generated content
      finalScore = Math.max(0, finalScore * 0.9);
    }

    return {
      originalAnalysis,
      aiDetection,
      finalScore: Math.round(finalScore),
      partialResultsOnly
    };
  }

  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks and extra whitespace
    return content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  // Enhanced linguistic analysis
  private performLinguisticAnalysis(response: string): LinguisticAnalysis & { indicators: string[] } {
    const words = response.toLowerCase().split(/\s+/);
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const indicators: string[] = [];
    
    // Vocabulary complexity analysis
    const complexWords = words.filter(word => word.length > 8);
    const vocabularyComplexity = complexWords.length / words.length;
    
    // Sentence structure analysis
    const avgSentenceLength = words.length / sentences.length;
    let sentenceStructure: 'simple' | 'complex' | 'ai-like' = 'simple';
    
    if (avgSentenceLength > 25) {
      sentenceStructure = 'complex';
    }
    
    // AI-like patterns
    const aiStructurePatterns = [
      /^(firstly|secondly|thirdly|finally)/i,
      /in conclusion/i,
      /it is important to note/i,
      /furthermore/i,
      /moreover/i
    ];
    
    const structureMatches = aiStructurePatterns.filter(pattern => pattern.test(response)).length;
    if (structureMatches >= 2 && avgSentenceLength > 20) {
      sentenceStructure = 'ai-like';
      indicators.push('AI-like sentence structure detected');
    }
    
    // Coherence analysis (simplified)
    const coherenceScore = this.calculateCoherence(sentences);
    
    // Repetition patterns
    const repetitionPatterns = this.findRepetitionPatterns(words);
    if (repetitionPatterns.length > 0) {
      indicators.push('Repetitive language patterns detected');
    }
    
    // Unusual phrases for context
    const unusualPhrases = this.findUnusualPhrases(response);
    if (unusualPhrases.length > 0) {
      indicators.push('Unusual AI-like phrases detected');
    }
    
    return {
      vocabularyComplexity,
      sentenceStructure,
      coherenceScore,
      repetitionPatterns,
      unusualPhrases,
      indicators
    };
  }
  
  // Cross-validation with multiple detection methods
  private async performCrossValidation(response: string, context?: string): Promise<CrossValidationResult> {
    const models = ['pattern-based', 'linguistic', 'statistical'];
    const results: boolean[] = [];
    
    // Pattern-based detection
    const patternResult = this.performQuickChecks(response).isObvious;
    results.push(patternResult);
    
    // Linguistic detection
    const linguisticAnalysis = this.performLinguisticAnalysis(response);
    const linguisticResult = linguisticAnalysis.sentenceStructure === 'ai-like' || 
                           linguisticAnalysis.indicators.length > 2;
    results.push(linguisticResult);
    
    // Statistical detection (simplified)
    const statisticalResult = this.performStatisticalAnalysis(response);
    results.push(statisticalResult);
    
    const positiveResults = results.filter(r => r).length;
    const agreement = positiveResults / results.length;
    const consensusResult = agreement > 0.5;
    
    return {
      models,
      agreement,
      confidence: agreement * 0.8 + 0.2, // Boost confidence slightly
      consensusResult
    };
  }
  
  // Calculate combined score from multiple signals
  private calculateCombinedScore(quickIndicators: any, linguisticAnalysis: any, behavioralScore: number) {
    let aiLikelihood = 0;
    
    // Quick indicators weight (30%)
    if (quickIndicators.isObvious) aiLikelihood += 30;
    
    // Linguistic analysis weight (40%)
    if (linguisticAnalysis.sentenceStructure === 'ai-like') aiLikelihood += 25;
    if (linguisticAnalysis.indicators.length > 2) aiLikelihood += 15;
    
    // Behavioral analysis weight (30%)
    if (behavioralScore < 50) aiLikelihood += 30;
    else if (behavioralScore < 70) aiLikelihood += 15;
    
    const confidence = Math.min(aiLikelihood, 95);
    const isAI = aiLikelihood > 50;
    const humanScore = Math.max(0, 100 - aiLikelihood);
    
    return {
      isAI,
      confidence,
      humanScore
    };
  }
  
  // Combine results from multiple detection methods
  private combineDetectionResults(aiAnalysis: any, linguisticAnalysis: any, behavioralScore: number, crossValidation?: CrossValidationResult) {
    let confidence = aiAnalysis.confidence || 50;
    let isAIGenerated = aiAnalysis.aiGenerated || false;
    let indicators = [...(aiAnalysis.indicators || [])];
    
    // Boost confidence with cross-validation agreement
    if (crossValidation && crossValidation.agreement > 0.6) {
      confidence = Math.min(95, confidence * 1.2);
      isAIGenerated = crossValidation.consensusResult;
    }
    
    // Incorporate linguistic analysis
    if (linguisticAnalysis.indicators.length > 0) {
      indicators = [...indicators, ...linguisticAnalysis.indicators];
      if (linguisticAnalysis.sentenceStructure === 'ai-like') {
        confidence = Math.min(95, confidence * 1.1);
      }
    }
    
    // Factor in behavioral score
    if (behavioralScore < 40) {
      confidence = Math.min(95, confidence * 1.3);
      indicators.push('Suspicious behavioral patterns detected');
    }
    
    const humanScore = Math.max(5, 100 - confidence);
    
    let reasoning = aiAnalysis.reasoning || 'AI detection analysis';
    if (crossValidation) {
      reasoning += ` Cross-validation agreement: ${Math.round(crossValidation.agreement * 100)}%`;
    }
    
    return {
      isAIGenerated,
      confidence,
      indicators: [...new Set(indicators)], // Remove duplicates
      humanScore,
      reasoning
    };
  }
  
  // Calculate penalty multiplier based on detection confidence and cross-validation
  private calculatePenaltyMultiplier(aiDetection: AIDetectionResult): number {
    let multiplier = 0.3; // Base penalty (70% reduction)
    
    // Adjust based on confidence
    if (aiDetection.confidence > 90) multiplier = 0.1; // 90% penalty
    else if (aiDetection.confidence > 80) multiplier = 0.2; // 80% penalty
    else if (aiDetection.confidence > 70) multiplier = 0.3; // 70% penalty
    else multiplier = 0.5; // 50% penalty
    
    // Further reduction for cross-validation agreement
    if (aiDetection.crossValidation && aiDetection.crossValidation.agreement > 0.8) {
      multiplier *= 0.8; // Additional 20% penalty
    }
    
    return Math.max(0.05, multiplier); // Minimum 5% of original score
  }
  
  // Helper methods for linguistic analysis
  private calculateCoherence(sentences: string[]): number {
    // Simplified coherence calculation
    // In a real implementation, this would use more sophisticated NLP
    if (sentences.length < 2) return 100;
    
    let coherenceScore = 100;
    for (let i = 1; i < sentences.length; i++) {
      const prev = sentences[i-1].toLowerCase().split(/\s+/);
      const curr = sentences[i].toLowerCase().split(/\s+/);
      const overlap = prev.filter(word => curr.includes(word)).length;
      const maxLength = Math.max(prev.length, curr.length);
      const sentenceCoherence = overlap / maxLength;
      coherenceScore = Math.min(coherenceScore, sentenceCoherence * 100);
    }
    
    return coherenceScore;
  }
  
  private findRepetitionPatterns(words: string[]): string[] {
    const patterns: string[] = [];
    const wordCount: {[key: string]: number} = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    Object.entries(wordCount).forEach(([word, count]) => {
      if (count > 3) {
        patterns.push(`Repeated word: "${word}" (${count} times)`);
      }
    });
    
    return patterns;
  }
  
  private findUnusualPhrases(response: string): string[] {
    const unusualPhrases = [
      'as an ai', 'as a language model', 'i don\'t have personal experience',
      'i cannot provide', 'it\'s worth noting', 'it\'s important to understand',
      'from my training', 'based on my knowledge cutoff'
    ];
    
    const text = response.toLowerCase();
    return unusualPhrases.filter(phrase => text.includes(phrase));
  }
  
  private performStatisticalAnalysis(response: string): boolean {
    // Simplified statistical analysis
    // Check for statistical patterns that suggest AI generation
    const words = response.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = words.length / sentences.length;
    
    // AI tends to produce more consistent metrics
    const isAILike = avgWordLength > 5.5 && avgWordLength < 6.5 && 
                    avgSentenceLength > 15 && avgSentenceLength < 25;
    
    return isAILike;
  }

  generateRecruiterFeedback(analysis: ResponseAnalysis): string {
    if (!analysis.aiDetection.isAIGenerated) {
      return "Response appears to be human-generated.";
    }

    const confidence = analysis.aiDetection.confidence;
    let feedback = `AI Usage Detected (${confidence}% confidence)\n`;
    
    if (confidence > 80) {
      feedback += "⚠️ High likelihood of AI assistance\n";
    } else if (confidence > 60) {
      feedback += "⚠️ Moderate likelihood of AI assistance\n";
    } else {
      feedback += "⚠️ Some indicators of possible AI assistance\n";
    }

    feedback += `Indicators: ${analysis.aiDetection.indicators.join(', ')}\n`;
    feedback += `Human-like score: ${analysis.aiDetection.humanScore}/100\n`;
    feedback += `Original score: ${analysis.originalAnalysis.overallScore || 'N/A'} → Adjusted: ${analysis.finalScore}`;

    return feedback;
  }

  generateCandidateFeedback(analysis: ResponseAnalysis): string {
    if (!analysis.partialResultsOnly) {
      return ""; // No need to inform if no AI detected
    }

    let feedback = `Note: This assessment includes an AI authenticity check. Partial results shown. For complete evaluation, ensure responses reflect your personal knowledge and experience.`;
    
    // Add specific guidance based on detected patterns
    if (analysis.aiDetection.linguisticPatterns?.sentenceStructure === 'ai-like') {
      feedback += ` Consider using more natural, conversational language.`;
    }
    
    if (analysis.aiDetection.indicators.some(i => i.includes('timing'))) {
      feedback += ` Take adequate time to formulate thoughtful responses.`;
    }
    
    return feedback;
  }
}

export const aiDetectionService = new AIDetectionService();