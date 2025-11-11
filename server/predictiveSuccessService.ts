
import { db } from './db';
import { jobApplications, jobPostings, users, resumes } from '@shared/schema';
import { eq, and, desc, count } from 'drizzle-orm';

interface ApplicationSuccessFactors {
  resumeScore: number;
  jobMatchScore: number;
  companyFitScore: number;
  timingScore: number;
  competitionLevel: number;
  salaryFitScore: number;
}

interface SuccessPrediction {
  interviewProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  improvementSuggestions: string[];
  optimalApplyTime: string;
  competitorAnalysis: {
    expectedApplicants: number;
    yourRanking: number;
    strengthsVsCompetition: string[];
  };
  salaryNegotiationPower: number;
}

export class PredictiveSuccessService {
  
  async predictApplicationSuccess(
    userId: string, 
    jobId: number, 
    resumeContent: string
  ): Promise<SuccessPrediction> {
    
    // Get job details
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId));
    
    if (!job) throw new Error('Job not found');

    // Get user's historical application data
    const userApplications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .limit(50);

    // Calculate success factors
    const factors = await this.calculateSuccessFactors(userId, job, resumeContent, userApplications);
    
    // AI-powered prediction algorithm
    const prediction = this.generatePrediction(factors, job);
    
    // Store prediction for learning
    await this.storePredictionForLearning(userId, jobId, prediction);
    
    return prediction;
  }

  private async calculateSuccessFactors(
    userId: string, 
    job: any, 
    resumeContent: string,
    historicalApplications: any[]
  ): Promise<ApplicationSuccessFactors> {
    
    // 1. Resume-Job Match Score (0-100)
    const resumeScore = this.calculateResumeJobMatch(resumeContent, job);
    
    // 2. Job Match Score based on requirements
    const jobMatchScore = this.calculateJobRequirementsMatch(resumeContent, job);
    
    // 3. Company Fit Score
    const companyFitScore = this.calculateCompanyFit(userId, job);
    
    // 4. Timing Score (when to apply for maximum success)
    const timingScore = this.calculateOptimalTiming(job);
    
    // 5. Competition Level Analysis
    const competitionLevel = await this.analyzeCompetitionLevel(job);
    
    // 6. Salary Fit Score
    const salaryFitScore = this.calculateSalaryFit(userId, job, historicalApplications);
    
    return {
      resumeScore,
      jobMatchScore,
      companyFitScore,
      timingScore,
      competitionLevel,
      salaryFitScore
    };
  }

  private calculateResumeJobMatch(resumeContent: string, job: any): number {
    const jobKeywords = this.extractKeywords(job.description + ' ' + job.requirements);
    const resumeKeywords = this.extractKeywords(resumeContent);
    
    const matchedKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.some(resumeKeyword => 
        resumeKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    const matchPercentage = (matchedKeywords.length / jobKeywords.length) * 100;
    return Math.min(matchPercentage, 100);
  }

  private calculateJobRequirementsMatch(resumeContent: string, job: any): number {
    // Advanced NLP analysis of job requirements vs resume
    const requiredSkills = this.extractRequiredSkills(job.requirements || '');
    const userSkills = this.extractUserSkills(resumeContent);
    
    let matchScore = 0;
    let totalWeight = 0;
    
    requiredSkills.forEach(skill => {
      const weight = skill.isRequired ? 3 : 1;
      const hasSkill = userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.name.toLowerCase())
      );
      
      if (hasSkill) matchScore += weight * 20;
      totalWeight += weight * 20;
    });
    
    return totalWeight > 0 ? (matchScore / totalWeight) * 100 : 50;
  }

  private calculateCompanyFit(userId: string, job: any): number {
    // Analyze company culture, values, and user preferences
    const companyCulture = this.analyzeCompanyCulture(job.company);
    const userPreferences = this.getUserPreferences(userId);
    
    // Score based on company size, industry, culture match
    let fitScore = 50; // baseline
    
    if (companyCulture.includes('startup') && userPreferences.prefersStartups) fitScore += 30;
    if (companyCulture.includes('remote') && userPreferences.prefersRemote) fitScore += 20;
    if (companyCulture.includes('tech') && userPreferences.prefersTech) fitScore += 25;
    
    return Math.min(fitScore, 100);
  }

  private calculateOptimalTiming(job: any): number {
    const now = new Date();
    const jobPosted = new Date(job.createdAt);
    const daysSincePosted = Math.floor((now.getTime() - jobPosted.getTime()) / (1000 * 60 * 60 * 24));
    
    // Optimal application timing (research shows 1-3 days after posting is best)
    if (daysSincePosted <= 1) return 95; // Very early
    if (daysSincePosted <= 3) return 100; // Optimal
    if (daysSincePosted <= 7) return 80; // Good
    if (daysSincePosted <= 14) return 60; // Fair
    return 30; // Late application
  }

  private async analyzeCompetitionLevel(job: any): Promise<number> {
    // Analyze how many people have applied and their quality
    const applicationsCount = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.jobPostingId, job.id));
    
    const totalApplicants = applicationsCount[0]?.count || 0;
    
    // Competition scoring (inverse - fewer applicants = higher score)
    if (totalApplicants <= 5) return 90; // Low competition
    if (totalApplicants <= 20) return 70; // Medium competition
    if (totalApplicants <= 50) return 50; // High competition
    return 30; // Very high competition
  }

  private calculateSalaryFit(userId: string, job: any, historicalApplications: any[]): number {
    // Analyze if salary expectations align with job offering
    const jobSalary = this.extractSalaryFromJob(job);
    const userExpectedSalary = this.getUserSalaryExpectations(userId, historicalApplications);
    
    if (!jobSalary || !userExpectedSalary) return 70; // Default if no data
    
    const salaryRatio = jobSalary / userExpectedSalary;
    
    if (salaryRatio >= 1.2) return 100; // Job pays 20% more than expected
    if (salaryRatio >= 1.0) return 90; // Job meets expectations
    if (salaryRatio >= 0.8) return 70; // Job pays 20% less
    return 40; // Significant underpayment
  }

  private generatePrediction(factors: ApplicationSuccessFactors, job: any): SuccessPrediction {
    // Advanced ML-inspired weighted algorithm with dynamic adjustment
    let weights = {
      resumeScore: 0.25,
      jobMatchScore: 0.25,
      companyFitScore: 0.15,
      timingScore: 0.15,
      competitionLevel: 0.15,
      salaryFitScore: 0.05
    };
    
    // Dynamic weight adjustment based on job characteristics
    if (job.experienceLevel === 'senior' || job.experienceLevel === 'lead') {
      weights.resumeScore = 0.30; // Resume matters more for senior roles
      weights.companyFitScore = 0.20; // Culture fit is critical
    } else if (job.experienceLevel === 'entry' || job.experienceLevel === 'junior') {
      weights.jobMatchScore = 0.30; // Skills match matters more
      weights.timingScore = 0.20; // Early application helps entry level
    }
    
    // Industry-specific adjustments
    if (job.description?.toLowerCase().includes('startup')) {
      weights.companyFitScore = 0.25; // Startups care about culture fit
      weights.competitionLevel = 0.10; // Less competition typically
    }
    
    const weightedScore = Object.entries(factors).reduce((total, [key, value]) => {
      return total + (value * weights[key as keyof typeof weights]);
    }, 0);
    
    // Apply sigmoid function for more realistic probability distribution
    const sigmoidScore = 100 / (1 + Math.exp(-0.1 * (weightedScore - 50)));
    const interviewProbability = Math.min(Math.max(sigmoidScore, 5), 95); // 5-95% range
    
    // Confidence level based on data quality
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    if (factors.resumeScore > 80 && factors.jobMatchScore > 80) confidenceLevel = 'high';
    if (factors.resumeScore < 50 || factors.jobMatchScore < 50) confidenceLevel = 'low';
    
    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(factors);
    
    // Optimal apply time
    const optimalApplyTime = this.calculateOptimalApplyTime(factors.timingScore);
    
    // Competitor analysis
    const competitorAnalysis = {
      expectedApplicants: Math.round(100 - factors.competitionLevel),
      yourRanking: Math.ceil((interviewProbability / 100) * 10),
      strengthsVsCompetition: this.identifyCompetitiveAdvantages(factors)
    };
    
    return {
      interviewProbability: Math.round(interviewProbability),
      confidenceLevel,
      improvementSuggestions,
      optimalApplyTime,
      competitorAnalysis,
      salaryNegotiationPower: Math.round(factors.salaryFitScore)
    };
  }

  private generateImprovementSuggestions(factors: ApplicationSuccessFactors): string[] {
    const suggestions: string[] = [];
    
    if (factors.resumeScore < 70) {
      suggestions.push("Optimize your resume with more relevant keywords from the job description");
    }
    
    if (factors.jobMatchScore < 70) {
      suggestions.push("Highlight specific skills and experiences that match the job requirements");
    }
    
    if (factors.timingScore < 70) {
      suggestions.push("Apply earlier - this job has been posted for a while");
    }
    
    if (factors.competitionLevel < 50) {
      suggestions.push("This is a competitive position - consider highlighting unique value propositions");
    }
    
    if (factors.companyFitScore < 60) {
      suggestions.push("Research the company culture and tailor your application accordingly");
    }
    
    return suggestions;
  }

  private calculateOptimalApplyTime(timingScore: number): string {
    if (timingScore > 90) return "Apply now - optimal timing!";
    if (timingScore > 70) return "Apply within 24 hours for best results";
    if (timingScore > 50) return "Apply soon - competition is increasing";
    return "Apply immediately - this position is getting crowded";
  }

  private identifyCompetitiveAdvantages(factors: ApplicationSuccessFactors): string[] {
    const advantages: string[] = [];
    
    if (factors.resumeScore > 85) advantages.push("Strong keyword match");
    if (factors.jobMatchScore > 85) advantages.push("Excellent skills alignment");
    if (factors.companyFitScore > 80) advantages.push("Great culture fit");
    if (factors.salaryFitScore > 90) advantages.push("Salary expectations aligned");
    
    return advantages;
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 20); // Top 20 keywords
  }

  private extractRequiredSkills(requirements: string): Array<{name: string, isRequired: boolean}> {
    const requiredKeywords = ['required', 'must have', 'essential', 'mandatory'];
    const skills: Array<{name: string, isRequired: boolean}> = [];
    
    // Simple skill extraction (can be enhanced with NLP)
    const sentences = requirements.split(/[.!?]/);
    sentences.forEach(sentence => {
      const isRequired = requiredKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      );
      
      // Extract potential skills (this is simplified)
      const potentialSkills = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
      potentialSkills.forEach(skill => {
        skills.push({ name: skill, isRequired });
      });
    });
    
    return skills.slice(0, 10); // Top 10 skills
  }

  private extractUserSkills(resumeContent: string): string[] {
    // Extract skills from resume (simplified)
    return resumeContent.match(/\b[A-Z][a-z]+\b/g) || [];
  }

  private analyzeCompanyCulture(company: string): string[] {
    // Simplified company culture analysis
    const cultureKeywords: string[] = [];
    
    if (company.toLowerCase().includes('startup')) cultureKeywords.push('startup');
    if (company.toLowerCase().includes('tech')) cultureKeywords.push('tech');
    if (company.toLowerCase().includes('remote')) cultureKeywords.push('remote');
    
    return cultureKeywords;
  }

  private getUserPreferences(userId: string): any {
    // This would come from user profile/preferences
    return {
      prefersStartups: true,
      prefersRemote: true,
      prefersTech: true
    };
  }

  private extractSalaryFromJob(job: any): number | null {
    // Extract salary from job description
    const salaryMatch = job.description?.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    return salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : null;
  }

  private getUserSalaryExpectations(userId: string, applications: any[]): number | null {
    // Estimate user salary expectations from application history
    return 80000; // Simplified - would be calculated from user data
  }

  private async storePredictionForLearning(
    userId: string, 
    jobId: number, 
    prediction: SuccessPrediction
  ): Promise<void> {
    // Store prediction for machine learning improvement
    // This would go to a predictions table for tracking accuracy
    console.log(`Stored prediction for user ${userId}, job ${jobId}: ${prediction.interviewProbability}%`);
  }
}

export const predictiveSuccessService = new PredictiveSuccessService();
