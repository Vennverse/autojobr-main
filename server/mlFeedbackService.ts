
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';

interface FeedbackData {
  analysisType: 'resume' | 'job_match' | 'interview' | 'prediction';
  analysisId: string;
  userId: string;
  prediction: any;
  actualOutcome?: any;
  userFeedback?: {
    rating: number;
    wasAccurate: boolean;
    corrections?: string[];
  };
  timestamp: Date;
}

interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleSize: number;
}

export class MLFeedbackService {
  private feedbackStore: Map<string, FeedbackData[]> = new Map();
  
  // Store feedback for model improvement
  async storeFeedback(feedback: FeedbackData): Promise<void> {
    const key = `${feedback.analysisType}_${feedback.userId}`;
    
    if (!this.feedbackStore.has(key)) {
      this.feedbackStore.set(key, []);
    }
    
    this.feedbackStore.get(key)!.push(feedback);
    
    // In production, this would write to a database table
    console.log(`ML Feedback stored: ${feedback.analysisType} - Accuracy: ${feedback.userFeedback?.wasAccurate}`);
  }
  
  // Calculate model performance metrics
  calculatePerformance(analysisType: string): ModelPerformance {
    let correctPredictions = 0;
    let totalPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    
    for (const feedbackList of this.feedbackStore.values()) {
      for (const feedback of feedbackList) {
        if (feedback.analysisType === analysisType && feedback.actualOutcome) {
          totalPredictions++;
          
          const predicted = this.extractBinaryOutcome(feedback.prediction);
          const actual = this.extractBinaryOutcome(feedback.actualOutcome);
          
          if (predicted === actual) correctPredictions++;
          if (predicted && actual) truePositives++;
          if (predicted && !actual) falsePositives++;
          if (!predicted && actual) falseNegatives++;
        }
      }
    }
    
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    const precision = (truePositives + falsePositives) > 0 
      ? truePositives / (truePositives + falsePositives) 
      : 0;
    const recall = (truePositives + falseNegatives) > 0 
      ? truePositives / (truePositives + falseNegatives) 
      : 0;
    const f1Score = (precision + recall) > 0 
      ? 2 * (precision * recall) / (precision + recall) 
      : 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      sampleSize: totalPredictions
    };
  }
  
  // Get model improvement suggestions based on feedback
  getImprovementSuggestions(analysisType: string): string[] {
    const performance = this.calculatePerformance(analysisType);
    const suggestions: string[] = [];
    
    if (performance.accuracy < 0.7) {
      suggestions.push('Model accuracy is below 70% - consider retraining with more diverse data');
    }
    
    if (performance.precision < 0.6) {
      suggestions.push('High false positive rate - adjust decision thresholds');
    }
    
    if (performance.recall < 0.6) {
      suggestions.push('Missing too many positive cases - broaden feature extraction');
    }
    
    if (performance.sampleSize < 100) {
      suggestions.push('Insufficient training data - collect more feedback samples');
    }
    
    return suggestions;
  }
  
  // Adjust model weights based on feedback (simplified version)
  async adjustModelWeights(analysisType: string): Promise<{
    adjustedWeights: any;
    improvement: number;
  }> {
    const performance = this.calculatePerformance(analysisType);
    
    // In production, this would use actual ML algorithms
    // For now, we'll simulate weight adjustment
    const adjustedWeights = {
      baseWeight: 1.0,
      accuracyAdjustment: performance.accuracy,
      precisionAdjustment: performance.precision,
      recallAdjustment: performance.recall
    };
    
    const improvement = performance.f1Score - 0.5; // Compare to baseline
    
    return { adjustedWeights, improvement };
  }
  
  private extractBinaryOutcome(outcome: any): boolean {
    if (typeof outcome === 'boolean') return outcome;
    if (typeof outcome === 'string') {
      return ['interview', 'offer', 'accepted', 'true', 'yes'].includes(outcome.toLowerCase());
    }
    if (typeof outcome === 'number') return outcome > 0.5;
    return false;
  }
}

export const mlFeedbackService = new MLFeedbackService();
