
import { storage } from "./storage";
import { groqService } from "./groqService";

interface PersonalityQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'situational';
  scale: number; // 1-5 or 1-7
  category: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism' | 'integrity' | 'leadership' | 'teamwork';
  reversed?: boolean; // For reverse-scored items
  competency?: string; // Optional competency mapping
}

interface PersonalityProfile {
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  workStyles: {
    leadership: number;
    teamwork: number;
    innovation: number;
    analyticalThinking: number;
    communication: number;
    adaptability: number;
    integrity: number;
    resilience: number;
  };
  jobFit: {
    role: string;
    fitScore: number;
    strengths: string[];
    developmentAreas: string[];
    recommendations: string[];
  };
  reliability: {
    consistencyScore: number;
    responseTime: number;
    flaggedResponses: string[];
  };
}

interface PersonalityAssessmentConfig {
  type: 'big_five' | 'work_styles' | 'comprehensive' | 'leadership' | 'sales_aptitude';
  questionCount: number;
  timeLimit?: number; // minutes
  jobRole?: string;
  industry?: string;
}

interface PersonalityResponse {
  questionId: string;
  answer: number;
  responseTime: number; // milliseconds
  confidence?: number; // 1-5 scale
}

export class PersonalityAssessmentService {
  private questionBank: PersonalityQuestion[] = [];

  constructor() {
    this.initializeQuestionBank();
  }

  private initializeQuestionBank(): void {
    // Big Five Personality Test Questions (Validated items)
    this.questionBank = [
      // Openness to Experience
      {
        id: 'open_1',
        text: 'I have a vivid imagination.',
        type: 'likert',
        scale: 5,
        category: 'openness'
      },
      {
        id: 'open_2',
        text: 'I have difficulty understanding abstract ideas.',
        type: 'likert',
        scale: 5,
        category: 'openness',
        reversed: true
      },
      {
        id: 'open_3',
        text: 'I enjoy hearing new ideas.',
        type: 'likert',
        scale: 5,
        category: 'openness'
      },
      {
        id: 'open_4',
        text: 'I am not interested in abstract ideas.',
        type: 'likert',
        scale: 5,
        category: 'openness',
        reversed: true
      },

      // Conscientiousness
      {
        id: 'cons_1',
        text: 'I am always prepared.',
        type: 'likert',
        scale: 5,
        category: 'conscientiousness'
      },
      {
        id: 'cons_2',
        text: 'I leave my belongings around.',
        type: 'likert',
        scale: 5,
        category: 'conscientiousness',
        reversed: true
      },
      {
        id: 'cons_3',
        text: 'I pay attention to details.',
        type: 'likert',
        scale: 5,
        category: 'conscientiousness'
      },
      {
        id: 'cons_4',
        text: 'I make a mess of things.',
        type: 'likert',
        scale: 5,
        category: 'conscientiousness',
        reversed: true
      },

      // Extraversion
      {
        id: 'extra_1',
        text: 'I am the life of the party.',
        type: 'likert',
        scale: 5,
        category: 'extraversion'
      },
      {
        id: 'extra_2',
        text: "I don't talk a lot.",
        type: 'likert',
        scale: 5,
        category: 'extraversion',
        reversed: true
      },
      {
        id: 'extra_3',
        text: 'I feel comfortable around people.',
        type: 'likert',
        scale: 5,
        category: 'extraversion'
      },
      {
        id: 'extra_4',
        text: 'I keep in the background.',
        type: 'likert',
        scale: 5,
        category: 'extraversion',
        reversed: true
      },

      // Agreeableness
      {
        id: 'agree_1',
        text: 'I feel others\' emotions.',
        type: 'likert',
        scale: 5,
        category: 'agreeableness'
      },
      {
        id: 'agree_2',
        text: "I am not interested in other people's problems.",
        type: 'likert',
        scale: 5,
        category: 'agreeableness',
        reversed: true
      },
      {
        id: 'agree_3',
        text: 'I have a soft heart.',
        type: 'likert',
        scale: 5,
        category: 'agreeableness'
      },
      {
        id: 'agree_4',
        text: 'I insult people.',
        type: 'likert',
        scale: 5,
        category: 'agreeableness',
        reversed: true
      },

      // Neuroticism
      {
        id: 'neuro_1',
        text: 'I get stressed out easily.',
        type: 'likert',
        scale: 5,
        category: 'neuroticism'
      },
      {
        id: 'neuro_2',
        text: 'I am relaxed most of the time.',
        type: 'likert',
        scale: 5,
        category: 'neuroticism',
        reversed: true
      },
      {
        id: 'neuro_3',
        text: 'I worry about things.',
        type: 'likert',
        scale: 5,
        category: 'neuroticism'
      },
      {
        id: 'neuro_4',
        text: 'I seldom feel blue.',
        type: 'likert',
        scale: 5,
        category: 'neuroticism',
        reversed: true
      },

      // Work Styles - Leadership
      {
        id: 'lead_1',
        text: 'When working in a group, I naturally take charge of organizing tasks.',
        type: 'likert',
        scale: 5,
        category: 'leadership',
        competency: 'leadership'
      },
      {
        id: 'lead_2',
        text: 'I prefer to follow others\' lead rather than take initiative.',
        type: 'likert',
        scale: 5,
        category: 'leadership',
        competency: 'leadership',
        reversed: true
      },
      {
        id: 'lead_3',
        text: 'I enjoy mentoring and developing others.',
        type: 'likert',
        scale: 5,
        category: 'leadership',
        competency: 'leadership'
      },

      // Work Styles - Teamwork
      {
        id: 'team_1',
        text: 'I work well with others to achieve common goals.',
        type: 'likert',
        scale: 5,
        category: 'teamwork',
        competency: 'teamwork'
      },
      {
        id: 'team_2',
        text: 'I prefer working alone rather than in groups.',
        type: 'likert',
        scale: 5,
        category: 'teamwork',
        competency: 'teamwork',
        reversed: true
      },
      {
        id: 'team_3',
        text: 'I actively seek input from team members.',
        type: 'likert',
        scale: 5,
        category: 'teamwork',
        competency: 'teamwork'
      },

      // Integrity
      {
        id: 'integ_1',
        text: 'I always tell the truth, even when it might hurt me.',
        type: 'likert',
        scale: 5,
        category: 'integrity',
        competency: 'integrity'
      },
      {
        id: 'integ_2',
        text: 'Sometimes small lies are acceptable to avoid hurting someone.',
        type: 'likert',
        scale: 5,
        category: 'integrity',
        competency: 'integrity',
        reversed: true
      },

      // Situational Questions
      {
        id: 'sit_1',
        text: 'You discover a mistake in your work that your supervisor hasn\'t noticed. The deadline is today and fixing it would require significant time. What do you do?',
        type: 'forced_choice',
        scale: 4,
        category: 'integrity',
        competency: 'integrity'
      },
      {
        id: 'sit_2',
        text: 'Your team is struggling with a project deadline. A colleague suggests cutting corners on quality to meet the deadline. How do you respond?',
        type: 'forced_choice',
        scale: 4,
        category: 'conscientiousness',
        competency: 'quality_focus'
      }
    ];
  }

  async createPersonalityAssessment(
    candidateId: string,
    recruiterId: string,
    jobId: number,
    config: PersonalityAssessmentConfig
  ): Promise<any> {
    const questions = this.selectQuestions(config);
    
    const assessment = await storage.createPersonalityAssessment({
      candidateId,
      recruiterId,
      jobId,
      assessmentType: config.type,
      questions: JSON.stringify(questions),
      timeLimit: config.timeLimit || 30,
      jobRole: config.jobRole,
      industry: config.industry,
      status: 'created',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { assessment, questions };
  }

  private selectQuestions(config: PersonalityAssessmentConfig): PersonalityQuestion[] {
    let selectedQuestions: PersonalityQuestion[] = [];

    switch (config.type) {
      case 'big_five':
        // Select balanced questions from each Big Five factor
        const bigFiveCategories = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        const questionsPerCategory = Math.floor(config.questionCount / 5);
        
        bigFiveCategories.forEach(category => {
          const categoryQuestions = this.questionBank.filter(q => q.category === category);
          const selected = this.shuffleArray(categoryQuestions).slice(0, questionsPerCategory);
          selectedQuestions.push(...selected);
        });
        break;

      case 'work_styles':
        const workCategories = ['leadership', 'teamwork', 'integrity'];
        workCategories.forEach(category => {
          const categoryQuestions = this.questionBank.filter(q => q.category === category);
          selectedQuestions.push(...categoryQuestions);
        });
        break;

      case 'comprehensive':
        // Mix of Big Five and work-related questions
        const allCategories = Array.from(new Set(this.questionBank.map(q => q.category)));
        const questionsPerCat = Math.floor(config.questionCount / allCategories.length);
        
        allCategories.forEach(category => {
          const categoryQuestions = this.questionBank.filter(q => q.category === category);
          const selected = this.shuffleArray(categoryQuestions).slice(0, questionsPerCat);
          selectedQuestions.push(...selected);
        });
        break;

      case 'leadership':
        selectedQuestions = this.questionBank.filter(q => 
          ['leadership', 'extraversion', 'conscientiousness'].includes(q.category)
        );
        break;

      case 'sales_aptitude':
        selectedQuestions = this.questionBank.filter(q => 
          ['extraversion', 'agreeableness', 'conscientiousness'].includes(q.category)
        );
        break;

      default:
        selectedQuestions = this.questionBank.slice(0, config.questionCount);
    }

    return this.shuffleArray(selectedQuestions).slice(0, config.questionCount);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async submitResponses(
    assessmentId: number,
    responses: PersonalityResponse[]
  ): Promise<PersonalityProfile> {
    const assessment = await storage.getPersonalityAssessment(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const questions: PersonalityQuestion[] = JSON.parse(assessment.questions);
    
    // Calculate personality profile
    const profile = this.calculatePersonalityProfile(questions, responses, assessment);
    
    // Store responses and results
    await storage.updatePersonalityAssessment(assessmentId, {
      responses: JSON.stringify(responses),
      results: JSON.stringify(profile),
      status: 'completed',
      completedAt: new Date()
    });

    return profile;
  }

  private calculatePersonalityProfile(
    questions: PersonalityQuestion[],
    responses: PersonalityResponse[],
    assessment: any
  ): PersonalityProfile {
    // Calculate Big Five scores
    const bigFive = this.calculateBigFiveScores(questions, responses);
    
    // Calculate work style scores
    const workStyles = this.calculateWorkStyleScores(questions, responses);
    
    // Calculate job fit
    const jobFit = this.calculateJobFit(bigFive, workStyles, assessment.jobRole, assessment.industry);
    
    // Calculate reliability metrics
    const reliability = this.calculateReliability(responses);

    return {
      bigFive,
      workStyles,
      jobFit,
      reliability
    };
  }

  private calculateBigFiveScores(questions: PersonalityQuestion[], responses: PersonalityResponse[]): any {
    const categories = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const scores: any = {};

    categories.forEach(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      let totalScore = 0;
      let questionCount = 0;

      categoryQuestions.forEach(question => {
        const response = responses.find(r => r.questionId === question.id);
        if (response) {
          let score = response.answer;
          // Handle reverse-scored items
          if (question.reversed) {
            score = (question.scale + 1) - score;
          }
          totalScore += score;
          questionCount++;
        }
      });

      // Convert to 0-100 scale
      scores[category] = questionCount > 0 ? 
        Math.round(((totalScore / questionCount) - 1) / (5 - 1) * 100) : 0;
    });

    return scores;
  }

  private calculateWorkStyleScores(questions: PersonalityQuestion[], responses: PersonalityResponse[]): any {
    const workCategories = ['leadership', 'teamwork', 'integrity'];
    const scores: any = {
      leadership: 0,
      teamwork: 0,
      innovation: 0,
      analyticalThinking: 0,
      communication: 0,
      adaptability: 0,
      integrity: 0,
      resilience: 0
    };

    // Calculate direct work style scores
    workCategories.forEach(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      let totalScore = 0;
      let questionCount = 0;

      categoryQuestions.forEach(question => {
        const response = responses.find(r => r.questionId === question.id);
        if (response) {
          let score = response.answer;
          if (question.reversed) {
            score = (question.scale + 1) - score;
          }
          totalScore += score;
          questionCount++;
        }
      });

      scores[category] = questionCount > 0 ? 
        Math.round(((totalScore / questionCount) - 1) / (5 - 1) * 100) : 0;
    });

    // Derive other work styles from Big Five
    const bigFive = this.calculateBigFiveScores(questions, responses);
    
    scores.innovation = Math.round((bigFive.openness * 0.7) + (bigFive.extraversion * 0.3));
    scores.communication = Math.round((bigFive.extraversion * 0.6) + (bigFive.agreeableness * 0.4));
    scores.analyticalThinking = Math.round((bigFive.openness * 0.5) + (bigFive.conscientiousness * 0.5));
    scores.adaptability = Math.round((bigFive.openness * 0.6) + ((100 - bigFive.neuroticism) * 0.4));
    scores.resilience = Math.round(((100 - bigFive.neuroticism) * 0.7) + (bigFive.conscientiousness * 0.3));

    return scores;
  }

  private calculateJobFit(bigFive: any, workStyles: any, jobRole?: string, industry?: string): any {
    if (!jobRole) {
      return {
        role: 'Generic',
        fitScore: 50,
        strengths: ['Assessment completed'],
        developmentAreas: ['Specify job role for detailed analysis'],
        recommendations: ['Complete job-specific assessment for better insights']
      };
    }

    // Job role profiles (ideal personality characteristics)
    const jobProfiles: { [key: string]: any } = {
      'sales_representative': {
        extraversion: { min: 70, weight: 0.3 },
        agreeableness: { min: 60, weight: 0.2 },
        conscientiousness: { min: 60, weight: 0.2 },
        communication: { min: 70, weight: 0.15 },
        resilience: { min: 60, weight: 0.15 }
      },
      'software_engineer': {
        conscientiousness: { min: 70, weight: 0.25 },
        openness: { min: 60, weight: 0.2 },
        analyticalThinking: { min: 70, weight: 0.25 },
        innovation: { min: 60, weight: 0.15 },
        teamwork: { min: 50, weight: 0.15 }
      },
      'project_manager': {
        conscientiousness: { min: 75, weight: 0.25 },
        extraversion: { min: 60, weight: 0.2 },
        leadership: { min: 70, weight: 0.25 },
        communication: { min: 70, weight: 0.15 },
        adaptability: { min: 65, weight: 0.15 }
      },
      'customer_service': {
        agreeableness: { min: 70, weight: 0.3 },
        extraversion: { min: 60, weight: 0.2 },
        conscientiousness: { min: 60, weight: 0.2 },
        communication: { min: 75, weight: 0.15 },
        resilience: { min: 65, weight: 0.15 }
      },
      'marketing_manager': {
        extraversion: { min: 65, weight: 0.25 },
        openness: { min: 70, weight: 0.2 },
        innovation: { min: 70, weight: 0.2 },
        communication: { min: 70, weight: 0.2 },
        leadership: { min: 60, weight: 0.15 }
      }
    };

    const profile = jobProfiles[jobRole.toLowerCase().replace(/\s+/g, '_')] || jobProfiles['software_engineer'];
    
    let fitScore = 0;
    const strengths: string[] = [];
    const developmentAreas: string[] = [];

    // Calculate fit score
    Object.entries(profile).forEach(([trait, requirements]: [string, any]) => {
      const score = trait in bigFive ? bigFive[trait] : workStyles[trait] || 0;
      const traitFit = Math.min(100, Math.max(0, score - requirements.min + 100));
      fitScore += traitFit * requirements.weight;

      // Identify strengths and development areas
      if (score >= requirements.min + 10) {
        strengths.push(this.getTraitDescription(trait, 'strength'));
      } else if (score < requirements.min - 5) {
        developmentAreas.push(this.getTraitDescription(trait, 'development'));
      }
    });

    fitScore = Math.round(fitScore);

    // Generate recommendations
    const recommendations = this.generateJobFitRecommendations(fitScore, developmentAreas, jobRole);

    return {
      role: jobRole,
      fitScore,
      strengths: strengths.length > 0 ? strengths : ['Positive attitude toward work'],
      developmentAreas: developmentAreas.length > 0 ? developmentAreas : ['Continue developing professional skills'],
      recommendations
    };
  }

  private getTraitDescription(trait: string, type: 'strength' | 'development'): string {
    const descriptions: { [key: string]: { strength: string; development: string } } = {
      extraversion: {
        strength: 'Strong interpersonal and communication skills',
        development: 'Building confidence in social interactions'
      },
      conscientiousness: {
        strength: 'Excellent attention to detail and organization',
        development: 'Improving time management and planning skills'
      },
      openness: {
        strength: 'Creative thinking and openness to new ideas',
        development: 'Embracing change and innovative approaches'
      },
      agreeableness: {
        strength: 'Excellent teamwork and collaboration skills',
        development: 'Balancing assertiveness with cooperation'
      },
      neuroticism: {
        strength: 'Emotional stability under pressure',
        development: 'Stress management and emotional regulation'
      },
      leadership: {
        strength: 'Natural leadership and influence abilities',
        development: 'Developing leadership and delegation skills'
      },
      communication: {
        strength: 'Clear and effective communication',
        development: 'Enhancing verbal and written communication'
      },
      analyticalThinking: {
        strength: 'Strong analytical and problem-solving skills',
        development: 'Improving analytical thinking and data interpretation'
      },
      innovation: {
        strength: 'Creative problem-solving and innovation',
        development: 'Fostering creativity and innovative thinking'
      },
      resilience: {
        strength: 'High resilience and stress tolerance',
        development: 'Building resilience and coping strategies'
      }
    };

    return descriptions[trait]?.[type] || `${type === 'strength' ? 'Strong' : 'Developing'} ${trait}`;
  }

  private generateJobFitRecommendations(fitScore: number, developmentAreas: string[], jobRole: string): string[] {
    const recommendations: string[] = [];

    if (fitScore >= 80) {
      recommendations.push(`Excellent fit for ${jobRole} position`);
      recommendations.push('Consider for leadership development programs');
    } else if (fitScore >= 70) {
      recommendations.push(`Good fit for ${jobRole} with some development opportunities`);
      recommendations.push('Provide targeted training in identified development areas');
    } else if (fitScore >= 60) {
      recommendations.push(`Moderate fit for ${jobRole} - consider with additional support`);
      recommendations.push('Implement structured onboarding and mentoring program');
    } else {
      recommendations.push(`Lower fit for ${jobRole} - consider alternative roles or significant development`);
      recommendations.push('Explore roles that better match personality strengths');
    }

    // Add specific development recommendations
    if (developmentAreas.length > 0) {
      recommendations.push(`Focus development on: ${developmentAreas.slice(0, 2).join(', ')}`);
    }

    return recommendations;
  }

  private calculateReliability(responses: PersonalityResponse[]): any {
    // Check response consistency
    const responseTimes = responses.map(r => r.responseTime).filter(t => t > 0);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // Flag unusually fast responses (< 2 seconds) or slow responses (> 60 seconds)
    const flaggedResponses: string[] = [];
    responses.forEach(response => {
      if (response.responseTime < 2000) {
        flaggedResponses.push('Unusually fast response detected');
      } else if (response.responseTime > 60000) {
        flaggedResponses.push('Unusually slow response detected');
      }
    });

    // Check for straight-line responding (all same answers)
    const answers = responses.map(r => r.answer);
    const uniqueAnswers = new Set(answers);
    if (uniqueAnswers.size === 1) {
      flaggedResponses.push('Straight-line responding detected');
    }

    // Calculate consistency score
    let consistencyScore = 100;
    if (flaggedResponses.length > 0) {
      consistencyScore -= flaggedResponses.length * 10;
    }
    consistencyScore = Math.max(0, consistencyScore);

    return {
      consistencyScore,
      responseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
      flaggedResponses: Array.from(new Set(flaggedResponses)) // Remove duplicates
    };
  }

  async generatePersonalityReport(assessmentId: number): Promise<any> {
    const assessment = await storage.getPersonalityAssessment(assessmentId);
    if (!assessment || !assessment.results) {
      throw new Error('Assessment not found or not completed');
    }

    const profile: PersonalityProfile = JSON.parse(assessment.results);
    
    return {
      candidateId: assessment.candidateId,
      assessmentType: assessment.assessmentType,
      completionDate: assessment.completedAt,
      profile,
      summary: this.generateProfileSummary(profile),
      recommendations: this.generateHiringRecommendations(profile),
      reliability: this.assessReliability(profile.reliability)
    };
  }

  private generateProfileSummary(profile: PersonalityProfile): string {
    const { bigFive, workStyles, jobFit } = profile;
    
    let summary = `Personality Assessment Summary:\n\n`;
    
    // Big Five summary
    const dominantTraits = Object.entries(bigFive)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([trait, score]) => `${trait} (${score}/100)`);
    
    summary += `Dominant Personality Traits: ${dominantTraits.join(', ')}\n\n`;
    
    // Work style strengths
    const topWorkStyles = Object.entries(workStyles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style, score]) => `${style} (${score}/100)`);
    
    summary += `Top Work Styles: ${topWorkStyles.join(', ')}\n\n`;
    
    // Job fit summary
    summary += `Job Fit Analysis:\n`;
    summary += `• Role: ${jobFit.role}\n`;
    summary += `• Fit Score: ${jobFit.fitScore}/100\n`;
    summary += `• Key Strengths: ${jobFit.strengths.slice(0, 2).join(', ')}\n`;
    
    if (jobFit.developmentAreas.length > 0) {
      summary += `• Development Areas: ${jobFit.developmentAreas.slice(0, 2).join(', ')}\n`;
    }
    
    return summary;
  }

  private generateHiringRecommendations(profile: PersonalityProfile): string[] {
    const recommendations: string[] = [];
    const { jobFit, reliability } = profile;
    
    // Reliability check
    if (reliability.consistencyScore < 70) {
      recommendations.push('⚠️ Consider re-assessment due to reliability concerns');
      return recommendations;
    }
    
    // Job fit recommendations
    if (jobFit.fitScore >= 85) {
      recommendations.push('✅ Strong Hire - Excellent personality fit for role');
      recommendations.push('Consider for fast-track hiring process');
    } else if (jobFit.fitScore >= 75) {
      recommendations.push('✅ Hire - Good personality fit with development potential');
      recommendations.push('Provide targeted onboarding in development areas');
    } else if (jobFit.fitScore >= 65) {
      recommendations.push('⚠️ Conditional Hire - Moderate fit, consider with additional assessment');
      recommendations.push('Implement structured development plan');
    } else {
      recommendations.push('❌ Consider Alternative - Lower personality fit for this specific role');
      recommendations.push('Explore other positions that better match personality profile');
    }
    
    // Specific role recommendations
    if (jobFit.strengths.length > 0) {
      recommendations.push(`Leverage strengths: ${jobFit.strengths.slice(0, 2).join(', ')}`);
    }
    
    return recommendations;
  }

  private assessReliability(reliability: any): string {
    if (reliability.consistencyScore >= 90) {
      return 'High - Results are highly reliable';
    } else if (reliability.consistencyScore >= 80) {
      return 'Good - Results are generally reliable';
    } else if (reliability.consistencyScore >= 70) {
      return 'Moderate - Results should be interpreted with caution';
    } else {
      return 'Low - Results may not be reliable, consider re-assessment';
    }
  }
}

export const personalityAssessmentService = new PersonalityAssessmentService();
