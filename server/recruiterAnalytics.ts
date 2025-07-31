// High-Performance Recruiter Analytics Engine
// Optimized for real-time UX with minimal computation

interface ApplicantAnalysis {
  candidateId: string;
  overallScore: number;
  skillMatch: {
    matchingSkills: string[];
    missingSkills: string[];
    skillScore: number;
    proficiencyLevel: 'junior' | 'mid' | 'senior' | 'lead';
  };
  experienceAnalysis: {
    totalYears: number;
    relevantYears: number;
    careerProgression: 'ascending' | 'stable' | 'varied';
    industryFit: number;
  };
  educationFit: {
    degreeRelevance: number;
    certifications: string[];
    continuousLearning: boolean;
  };
  compatibilityMetrics: {
    roleCompatibility: number;
    teamFit: number;
    cultureAlignment: number;
    growthPotential: number;
  };
  riskFactors: {
    overqualified: boolean;
    underqualified: boolean;
    salaryMismatch: boolean;
    locationConcerns: boolean;
  };
  recommendations: {
    action: 'hire' | 'interview' | 'consider' | 'pass';
    interviewFocus: string[];
    negotiationPoints: string[];
    onboardingNotes: string[];
  };
  quickStats: {
    responseTime: string;
    applicationCompleteness: number;
    referenceQuality: number;
    portfolioStrength: number;
  };
}

export class RecruiterAnalyticsEngine {
  private readonly version = '1.0.0';

  // High-performance keyword matching for instant results
  private readonly professionKeywords = {
    sales: ['sales', 'revenue', 'quota', 'crm', 'lead', 'prospect', 'account', 'closing', 'pipeline'],
    marketing: ['marketing', 'campaign', 'brand', 'digital', 'social media', 'seo', 'content', 'analytics'],
    hr: ['hr', 'recruiting', 'talent', 'hiring', 'employee', 'performance', 'benefits', 'training'],
    tech: ['programming', 'development', 'software', 'engineer', 'code', 'system', 'database', 'api'],
    finance: ['finance', 'accounting', 'budget', 'analysis', 'investment', 'audit', 'tax', 'risk'],
    operations: ['operations', 'process', 'logistics', 'supply chain', 'quality', 'efficiency', 'automation']
  };

  // Fast skill extraction using regex patterns
  private extractSkills(text: string): string[] {
    const skillPatterns = [
      /(\w+(?:\s+\w+){0,2})(?:\s*[-•]\s*(?:\d+\+?\s*(?:years?|yrs?)))/gi,
      /(?:skilled in|proficient in|experience with|expertise in)\s*:?\s*([^.;]+)/gi,
      /(?:languages?|technologies?|tools?|frameworks?)\s*:?\s*([^.;]+)/gi
    ];

    const skills = new Set<string>();
    skillPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const skillList = match[1].split(/[,;&]/);
        skillList.forEach(skill => {
          const cleaned = skill.trim().toLowerCase();
          if (cleaned.length > 2 && cleaned.length < 30) {
            skills.add(cleaned);
          }
        });
      }
    });

    return Array.from(skills);
  }

  // Instant profession detection
  private detectProfession(resume: string, jobDescription: string): string {
    const combinedText = (resume + ' ' + jobDescription).toLowerCase();
    let maxScore = 0;
    let detectedProfession = 'general';

    Object.entries(this.professionKeywords).forEach(([profession, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        return acc + (combinedText.match(regex)?.length || 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedProfession = profession;
      }
    });

    return detectedProfession;
  }

  // Lightning-fast experience calculation
  private calculateExperience(resume: string): { total: number; relevant: number } {
    const yearPatterns = [
      /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
      /(?:experience|exp)\s*:?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/gi,
      /(\d{4})\s*[-–]\s*(?:present|current|\d{4})/gi
    ];

    let maxYears = 0;
    yearPatterns.forEach(pattern => {
      const matches = resume.matchAll(pattern);
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (years > maxYears && years <= 50) {
          maxYears = years;
        }
      }
    });

    // Simple relevant experience estimation (80% of total for matching profession)
    return {
      total: maxYears,
      relevant: Math.floor(maxYears * 0.8)
    };
  }

  // Fast compatibility scoring
  private calculateCompatibility(candidateSkills: string[], jobRequirements: string[]): number {
    if (jobRequirements.length === 0) return 75; // Default score

    const matches = candidateSkills.filter(skill => 
      jobRequirements.some(req => 
        req.toLowerCase().includes(skill) || skill.includes(req.toLowerCase())
      )
    );

    return Math.min(95, Math.max(15, (matches.length / jobRequirements.length) * 100));
  }

  // Main analysis function - optimized for speed
  async analyzeApplicant(
    candidateData: {
      id: string;
      resume: string;
      experience: any[];
      skills: any[];
      education: any[];
      application: any;
    },
    jobPosting: {
      title: string;
      description: string;
      requirements: string[];
      salaryRange?: { min: number; max: number };
    }
  ): Promise<ApplicantAnalysis> {
    const startTime = Date.now();

    // Extract data quickly
    const candidateSkills = this.extractSkills(candidateData.resume);
    const profession = this.detectProfession(candidateData.resume, jobPosting.description);
    const experience = this.calculateExperience(candidateData.resume);
    
    // Calculate compatibility metrics
    const skillScore = this.calculateCompatibility(candidateSkills, jobPosting.requirements);
    const overallScore = Math.round((skillScore * 0.6) + (Math.min(experience.total * 5, 40)));

    // Determine proficiency level
    let proficiencyLevel: 'junior' | 'mid' | 'senior' | 'lead' = 'junior';
    if (experience.total >= 8) proficiencyLevel = 'lead';
    else if (experience.total >= 5) proficiencyLevel = 'senior';
    else if (experience.total >= 2) proficiencyLevel = 'mid';

    // Quick risk assessment
    const riskFactors = {
      overqualified: experience.total > 15 && jobPosting.title.toLowerCase().includes('junior'),
      underqualified: experience.total < 2 && jobPosting.title.toLowerCase().includes('senior'),
      salaryMismatch: false, // Would need salary data
      locationConcerns: false // Would need location data
    };

    // Generate recommendations
    let action: 'hire' | 'interview' | 'consider' | 'pass' = 'pass';
    if (overallScore >= 80) action = 'hire';
    else if (overallScore >= 65) action = 'interview';
    else if (overallScore >= 45) action = 'consider';

    const processingTime = Date.now() - startTime;

    return {
      candidateId: candidateData.id,
      overallScore,
      skillMatch: {
        matchingSkills: candidateSkills.slice(0, 10), // Top 10 for performance
        missingSkills: jobPosting.requirements.filter(req => 
          !candidateSkills.some(skill => skill.includes(req.toLowerCase()))
        ).slice(0, 5),
        skillScore: Math.round(skillScore),
        proficiencyLevel
      },
      experienceAnalysis: {
        totalYears: experience.total,
        relevantYears: experience.relevant,
        careerProgression: experience.total > experience.relevant ? 'varied' : 'ascending',
        industryFit: Math.round(skillScore * 0.8)
      },
      educationFit: {
        degreeRelevance: candidateData.education.length > 0 ? 85 : 60,
        certifications: candidateData.skills.map(s => s.name).slice(0, 5),
        continuousLearning: candidateSkills.length > 8
      },
      compatibilityMetrics: {
        roleCompatibility: Math.round(skillScore),
        teamFit: 75, // Would need team data
        cultureAlignment: 70, // Would need culture assessment
        growthPotential: Math.min(90, 60 + (10 - experience.total) * 3)
      },
      riskFactors,
      recommendations: {
        action,
        interviewFocus: this.generateInterviewFocus(profession, candidateSkills),
        negotiationPoints: this.generateNegotiationPoints(experience.total, skillScore),
        onboardingNotes: this.generateOnboardingNotes(proficiencyLevel, riskFactors)
      },
      quickStats: {
        responseTime: `${processingTime}ms`,
        applicationCompleteness: candidateData.resume.length > 500 ? 90 : 60,
        referenceQuality: 75, // Would need reference data
        portfolioStrength: candidateSkills.length > 10 ? 85 : 65
      }
    };
  }

  private generateInterviewFocus(profession: string, skills: string[]): string[] {
    const focusAreas = {
      sales: ['Sales process', 'CRM experience', 'Target achievement', 'Client relationships'],
      marketing: ['Campaign results', 'Analytics skills', 'Creative process', 'ROI measurement'],
      hr: ['Recruiting process', 'Employee relations', 'Compliance knowledge', 'Training design'],
      tech: ['Technical architecture', 'Problem solving', 'Code quality', 'System design'],
      finance: ['Financial modeling', 'Risk assessment', 'Regulatory knowledge', 'Data analysis'],
      operations: ['Process optimization', 'Quality management', 'Team leadership', 'Efficiency metrics']
    };

    return focusAreas[profession] || ['Problem solving', 'Communication', 'Team collaboration', 'Results orientation'];
  }

  private generateNegotiationPoints(experience: number, skillScore: number): string[] {
    const points = [];
    if (experience < 3) points.push('Growth opportunities');
    if (skillScore > 80) points.push('Skill premium');
    if (experience > 8) points.push('Leadership responsibilities');
    points.push('Professional development', 'Team dynamics');
    return points.slice(0, 3);
  }

  private generateOnboardingNotes(level: string, risks: any): string[] {
    const notes = [];
    if (level === 'junior') notes.push('Assign mentor', 'Structured training plan');
    if (level === 'senior') notes.push('Leadership integration', 'Strategic projects');
    if (risks.overqualified) notes.push('Engage with challenging projects');
    if (risks.underqualified) notes.push('Additional training support');
    notes.push('Team introductions', 'Goal setting session');
    return notes.slice(0, 4);
  }

  // Bulk analysis for dashboard performance
  async analyzeBulkApplicants(
    candidates: any[],
    jobPosting: any
  ): Promise<ApplicantAnalysis[]> {
    const startTime = Date.now();
    
    // Process in batches for optimal performance
    const batchSize = 10;
    const results: ApplicantAnalysis[] = [];
    
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchPromises = batch.map(candidate => 
        this.analyzeApplicant(candidate, jobPosting)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    console.log(`Analyzed ${candidates.length} candidates in ${Date.now() - startTime}ms`);
    return results.sort((a, b) => b.overallScore - a.overallScore);
  }
}

export const recruiterAnalytics = new RecruiterAnalyticsEngine();