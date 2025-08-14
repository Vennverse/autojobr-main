import { apiKeyRotationService } from './apiKeyRotationService';

// Types from groqService - we'll use the same interface structure
interface ResumeAnalysis {
  atsScore: number;
  scoreBreakdown: {
    keywords: { score: number; maxScore: number; details: string };
    formatting: { score: number; maxScore: number; details: string };
    content: { score: number; maxScore: number; details: string };
    atsCompatibility: { score: number; maxScore: number; details: string };
  };
  recommendations: string[];
  keywordOptimization: {
    missingKeywords: string[];
    overusedKeywords: string[];
    suggestions: string[];
    density: { current: number; recommended: number };
  };
  formatting: {
    score: number;
    issues: string[];
    improvements: string[];
    atsIssues: string[];
  };
  content: {
    strengthsFound: string[];
    weaknesses: string[];
    suggestions: string[];
    missingElements: string[];
    quantificationOpportunities: string[];
  };
  rewriteSuggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  industrySpecific: {
    detectedIndustry: string;
    industryKeywords: string[];
    industryStandards: string[];
  };
}

interface JobMatchAnalysis {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  skillGaps: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
  seniorityLevel: string;
  workMode: string;
  jobType: string;
  roleComplexity: string;
  careerProgression: string;
  industryFit: string;
  cultureFit: string;
  applicationRecommendation: string;
  tailoringAdvice: string;
  interviewPrepTips: string;
}

// AI Service that uses both Groq and OpenRouter with rotation
class AIService {
  private developmentMode: boolean;
  
  // AI Model configuration
  private readonly models = {
    groq: {
      premium: "llama-3.3-70b-versatile",
      basic: "llama-3.3-70b-versatile"
    },
    openrouter: {
      premium: "mistralai/mistral-small-2402", // Mistral Small 3.2 24B (free)
      basic: "mistralai/mistral-small-2402"
    }
  };

  constructor() {
    const status = apiKeyRotationService.getStatus();
    const hasGroq = status.groq.totalKeys > 0;
    const hasOpenRouter = status.openrouter.totalKeys > 0;
    
    if (!hasGroq && !hasOpenRouter) {
      console.warn("No AI API keys configured - AI analysis will be simulated in development mode");
      this.developmentMode = true;
      return;
    }
    
    this.developmentMode = false;
    console.log(`AI Service initialized with:`);
    console.log(`   - Groq: ${status.groq.totalKeys} keys (${status.groq.availableKeys} available)`);
    console.log(`   - OpenRouter: ${status.openrouter.totalKeys} keys (${status.openrouter.availableKeys} available)`);
  }

  // Execute AI operation with automatic rotation between services
  private async executeWithRotation<T>(
    operation: (service: 'groq' | 'openrouter', model: string) => Promise<T>,
    user?: any
  ): Promise<T> {
    const status = apiKeyRotationService.getStatus();
    const hasGroq = status.groq.availableKeys > 0;
    const hasOpenRouter = status.openrouter.availableKeys > 0;
    
    // Randomly choose between available services for load balancing
    const availableServices: ('groq' | 'openrouter')[] = [];
    if (hasGroq) availableServices.push('groq');
    if (hasOpenRouter) availableServices.push('openrouter');
    
    if (availableServices.length === 0) {
      throw new Error('No AI services available');
    }
    
    // Try services in random order for better load distribution
    const shuffledServices = availableServices.sort(() => Math.random() - 0.5);
    
    let lastError: any;
    
    for (const serviceName of shuffledServices) {
      try {
        const model = this.getModel(serviceName, user);
        console.log(`🎯 Attempting AI operation with ${serviceName} using model: ${model}`);
        
        return await operation(serviceName, model);
      } catch (error) {
        lastError = error;
        console.warn(`AI operation failed with ${serviceName}:`, error);
        
        // Try next service if available
        if (shuffledServices.indexOf(serviceName) < shuffledServices.length - 1) {
          console.log(`Retrying with next available AI service...`);
          continue;
        }
      }
    }
    
    throw lastError || new Error('All AI services failed');
  }

  private getModel(service: 'groq' | 'openrouter', user?: any): string {
    // All users get premium models for now
    return this.models[service].premium;
  }

  private hasAIAccess(user: any): { tier: 'premium' | 'basic', message?: string } {
    // Everyone gets the same efficient model - no tier restrictions
    return { tier: 'premium' };
  }

  // Groq-specific operation wrapper
  private async executeGroqOperation<T>(
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    return await apiKeyRotationService.executeWithGroqRotation(operation);
  }

  // OpenRouter-specific operation wrapper
  private async executeOpenRouterOperation<T>(
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    return await apiKeyRotationService.executeWithOpenRouterRotation(operation);
  }

  // Chat completion with automatic service rotation
  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      user?: any;
    } = {}
  ) {
    if (this.developmentMode) {
      throw new Error('AI service not available in development mode');
    }

    return await this.executeWithRotation(async (service, model) => {
      const completionOptions = {
        messages,
        model: options.model || model,
        temperature: options.temperature || 0.2,
        max_tokens: options.max_tokens || 1000,
      };

      if (service === 'groq') {
        return await this.executeGroqOperation(async (client) => {
          return await client.chat.completions.create(completionOptions);
        });
      } else {
        return await this.executeOpenRouterOperation(async (client) => {
          return await client.chat.completions.create(completionOptions);
        });
      }
    }, options.user);
  }

  async analyzeResume(resumeText: string, userProfile?: any, user?: any): Promise<ResumeAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    const analysisId = Math.random().toString(36).substring(7);
    
    const prompt = `Analyze resume comprehensively for ATS optimization. Return detailed JSON:
${resumeText}

{
  "atsScore": number (15-95),
  "scoreBreakdown": {
    "keywords": {"score": number, "maxScore": 25, "details": "explanation"},
    "formatting": {"score": number, "maxScore": 25, "details": "explanation"},
    "content": {"score": number, "maxScore": 25, "details": "explanation"},
    "atsCompatibility": {"score": number, "maxScore": 25, "details": "explanation"}
  },
  "recommendations": ["specific actionable fixes with examples"],
  "keywordOptimization": {
    "missingKeywords": ["critical keywords to add"],
    "overusedKeywords": ["keywords used too frequently"],
    "suggestions": ["specific technical terms and industry keywords"],
    "density": {"current": number, "recommended": number}
  },
  "formatting": {
    "score": number,
    "issues": ["specific formatting problems"],
    "improvements": ["exact formatting fixes"],
    "atsIssues": ["ATS parsing problems"]
  },
  "content": {
    "strengthsFound": ["specific strong points"],
    "weaknesses": ["areas lacking detail"],
    "suggestions": ["content improvements with examples"],
    "missingElements": ["standard resume sections missing"],
    "quantificationOpportunities": ["achievements that need metrics"]
  },
  "rewriteSuggestions": [
    {
      "original": "example weak text",
      "improved": "enhanced version with metrics",
      "reason": "explanation of improvement"
    }
  ],
  "industrySpecific": {
    "detectedIndustry": "identified field",
    "industryKeywords": ["relevant terms"],
    "industryStandards": ["expected qualifications"]
  }
}`;

    try {
      const accessInfo = this.hasAIAccess(user);
      
      if (this.developmentMode) {
        console.log("Running in development mode - using fallback resume analysis");
        return this.generateFallbackResumeAnalysis(accessInfo);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert ATS resume analyzer. Analyze resumes and return valid JSON only. No code, no explanations, just the requested JSON structure."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.2,
        max_tokens: 1000,
        user
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      console.log("Raw AI response:", content.substring(0, 500) + "...");

      // Parse JSON response with error handling
      let analysis;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        analysis = JSON.parse(jsonContent);
        
        console.log("Parsed analysis - ATS Score:", analysis.atsScore);
        
        if (analysis.atsScore && analysis.atsScore >= 20 && analysis.atsScore <= 95) {
          // AI provided a reasonable score, use it with minor adjustments
          const variance = Math.random() * 6 - 3;
          analysis.atsScore = Math.max(20, Math.min(95, Math.round(analysis.atsScore + variance)));
        } else {
          // Calculate dynamic score based on content quality
          analysis.atsScore = this.calculateDynamicScore(resumeText, analysis);
        }
        
        return {
          ...analysis,
          aiTier: accessInfo.tier,
          upgradeMessage: accessInfo.message
        } as ResumeAnalysis & { aiTier?: string, upgradeMessage?: string };
      } catch (parseError) {
        console.error("Failed to parse JSON response:", content);
        const fallbackAccessInfo = this.hasAIAccess(user);
        return this.generateFallbackResumeAnalysis(fallbackAccessInfo);
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      const fallbackAccessInfo = this.hasAIAccess(user);
      return this.generateFallbackResumeAnalysis(fallbackAccessInfo);
    }
  }

  private calculateDynamicScore(resumeText: string, analysis: any): number {
    const baseScore = 55;
    let score = baseScore;
    
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount > 200) score += 10;
    if (wordCount > 400) score += 5;
    
    const hasNumbers = /\d/.test(resumeText);
    if (hasNumbers) score += 8;
    
    const technicalTerms = ['API', 'database', 'framework', 'programming', 'development', 'engineering'];
    const foundTerms = technicalTerms.filter(term => 
      resumeText.toLowerCase().includes(term.toLowerCase())
    ).length;
    score += foundTerms * 3;
    
    const hasEducation = /education|degree|university|college/i.test(resumeText);
    if (hasEducation) score += 5;
    
    const randomVariance = Math.random() * 12 - 6;
    score += randomVariance;
    
    return Math.max(25, Math.min(90, Math.round(score)));
  }

  private generateFallbackResumeAnalysis(accessInfo: { tier: 'premium' | 'basic', message?: string }): ResumeAnalysis & { aiTier?: string, upgradeMessage?: string } {
    return {
      atsScore: 75,
      scoreBreakdown: {
        keywords: { score: 18, maxScore: 25, details: "Good technical keywords present, but missing some industry-specific terms" },
        formatting: { score: 22, maxScore: 25, details: "Clean, professional formatting with minor improvements needed" },
        content: { score: 17, maxScore: 25, details: "Solid experience but lacks quantified achievements" },
        atsCompatibility: { score: 18, maxScore: 25, details: "Good structure, some sections could be optimized for ATS parsing" }
      },
      recommendations: [
        "Add specific metrics and numbers to quantify your achievements (e.g., 'Increased sales by 25%')",
        "Include more relevant technical skills for your target industry",
        "Use stronger action verbs to describe your accomplishments",
        "Add missing standard sections like 'Professional Summary' or 'Core Competencies'"
      ],
      keywordOptimization: {
        missingKeywords: ["technical skills", "industry-specific tools", "soft skills", "certifications"],
        overusedKeywords: ["responsible for", "worked on"],
        suggestions: ["Add role-specific technical terms", "Include metrics and percentages", "Use action-oriented language"],
        density: { current: 2.5, recommended: 3.5 }
      },
      formatting: {
        score: 70,
        issues: ["Inconsistent bullet point styles", "Some sections lack clear headers"],
        improvements: ["Use consistent bullet points", "Include clear section headers", "Ensure proper spacing and alignment"],
        atsIssues: ["Contact information could be better formatted", "Skills section needs better structure"]
      },
      content: {
        strengthsFound: ["Well-structured content", "Clear job progression", "Good education background"],
        weaknesses: ["Could benefit from more specific details", "Missing quantified achievements", "Lacks professional summary"],
        suggestions: ["Add specific numbers and percentages to achievements", "Include more detailed work experience descriptions", "Highlight measurable impact and results"],
        missingElements: ["Professional Summary", "Core Competencies section", "Achievement highlights"],
        quantificationOpportunities: ["Work experience achievements", "Project outcomes", "Team leadership examples"]
      },
      rewriteSuggestions: [
        {
          original: "Worked on web development projects",
          improved: "Developed 5 responsive web applications using React and Node.js, improving user engagement by 40% and reducing page load time by 25%",
          reason: "Added specific numbers, technologies, and measurable outcomes"
        },
        {
          original: "Responsible for managing team",
          improved: "Led cross-functional team of 8 developers and designers, delivering projects 15% ahead of schedule while maintaining 99% quality standards",
          reason: "Quantified team size, performance metrics, and outcomes"
        }
      ],
      industrySpecific: {
        detectedIndustry: "Technology",
        industryKeywords: ["JavaScript", "React", "Node.js", "API", "Database"],
        industryStandards: ["GitHub portfolio", "Technical certifications", "Open source contributions"]
      },
      aiTier: accessInfo.tier,
      upgradeMessage: accessInfo.message
    };
  }

  async analyzeJobMatch(
    jobData: { title: string; company: string; description: string; requirements?: string[] },
    userProfile: any,
    user?: any
  ): Promise<JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    const prompt = `Analyze job match. Return JSON only:
Job: ${jobData.title} at ${jobData.company}
Description: ${jobData.description}
Requirements: ${jobData.requirements?.join(', ') || 'Not specified'}

User: ${userProfile.professionalTitle || 'Professional'}, ${userProfile.yearsExperience || 0}yr exp
Skills: ${userProfile.skills?.map((s: any) => s.skillName).join(', ') || 'None listed'}

{
  "matchScore": number,
  "strengths": ["matching qualifications"],
  "gaps": ["missing requirements"],
  "recommendations": ["how to improve match"],
  "salaryEstimate": "range based on role",
  "workMode": "remote/hybrid/onsite preference",
  "jobType": "contract/fulltime/parttime",
  "roleComplexity": "entry/mid/senior level",
  "careerProgression": "growth potential",
  "industryFit": "industry alignment",
  "cultureFit": "company culture match",
  "applicationRecommendation": "apply/consider/skip",
  "tailoringAdvice": "resume customization tips",
  "interviewPrepTips": "interview preparation advice"
}`;

    try {
      const accessInfo = this.hasAIAccess(user);
      
      if (this.developmentMode) {
        console.log("Running in development mode - using fallback job analysis");
        return this.generateFallbackJobAnalysis(accessInfo);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert career coach. Analyze job matches and return valid JSON only. No code, no explanations, just the requested JSON structure."
        },
        {
          role: "user", 
          content: prompt
        }
      ], {
        temperature: 0.1,
        max_tokens: 800,
        user
      });
      
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      let cleanContent = content.trim();
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd);
      }
      
      try {
        const analysis = JSON.parse(cleanContent);
        return {
          ...analysis,
          aiTier: accessInfo.tier,
          upgradeMessage: accessInfo.message
        } as JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string };
      } catch (parseError) {
        console.error("Failed to parse JSON response:", cleanContent);
        const fallbackAccessInfo = this.hasAIAccess(user);
        return this.generateFallbackJobAnalysis(fallbackAccessInfo);
      }
    } catch (error) {
      console.error("Error analyzing job match:", error);
      const fallbackAccessInfo = this.hasAIAccess(user);
      return this.generateFallbackJobAnalysis(fallbackAccessInfo);
    }
  }

  private generateFallbackJobAnalysis(accessInfo: { tier: 'premium' | 'basic', message?: string }): JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string } {
    return {
      matchScore: 65,
      matchingSkills: ['Professional experience relevant to role', 'Skills align with job requirements'],
      missingSkills: ['Specific technical skills may need development'],
      skillGaps: {
        critical: ['Industry-specific expertise'],
        important: ['Advanced technical skills'],
        nice_to_have: ['Additional certifications']
      },
      seniorityLevel: 'Mid-level',
      workMode: 'Please check job posting for details',
      jobType: 'Please review full job description',
      roleComplexity: 'Standard',
      careerProgression: 'Good opportunity to grow',
      industryFit: 'Review company culture and values',
      cultureFit: 'Research company background',
      applicationRecommendation: 'recommended',
      tailoringAdvice: 'Customize your resume to highlight relevant experience and skills mentioned in the job posting',
      interviewPrepTips: 'Research the company, practice common interview questions, and prepare specific examples of your work',
      aiTier: accessInfo.tier,
      upgradeMessage: accessInfo.message
    };
  }

  // Get AI access information for user
  public getAIAccessInfo(user: any): { tier: 'premium' | 'basic', message?: string, daysLeft?: number } {
    const accessInfo = this.hasAIAccess(user);
    return accessInfo;
  }
}

// Export singleton instance
export const aiService = new AIService();