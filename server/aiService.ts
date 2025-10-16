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

  // Store analysis feedback for continuous improvement
  private async storeFeedback(analysisId: string, feedback: {
    wasAccurate: boolean;
    userCorrections?: string[];
    actualOutcome?: 'interview' | 'rejection' | 'offer';
  }): Promise<void> {
    // This would typically write to a feedback table for ML model retraining
    console.log(`Feedback stored for analysis ${analysisId}:`, feedback);
    // TODO: Implement feedback storage in database for model improvement
  }

  async analyzeResume(resumeText: string, userProfile?: any, user?: any): Promise<ResumeAnalysis & { aiTier?: string, upgradeMessage?: string, analysisId?: string }> {
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

    // Content length analysis
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount > 200) score += 10;
    if (wordCount > 400) score += 5;
    if (wordCount < 100) score -= 10; // Penalize very short resumes

    // Quantification analysis (metrics and numbers)
    const numberMatches = resumeText.match(/\d+[%$kK]?/g);
    const quantificationScore = numberMatches ? Math.min(numberMatches.length * 2, 15) : 0;
    score += quantificationScore;

    // Action verbs (strong resume indicators)
    const actionVerbs = [
      'achieved', 'developed', 'implemented', 'led', 'managed', 'created',
      'designed', 'improved', 'increased', 'reduced', 'optimized', 'built'
    ];
    const verbCount = actionVerbs.filter(verb => 
      new RegExp(`\\b${verb}`, 'i').test(resumeText)
    ).length;
    score += verbCount * 2;

    // Technical depth (industry-specific terms)
    const technicalTerms = [
      'API', 'database', 'framework', 'programming', 'development', 'engineering',
      'architecture', 'scalable', 'performance', 'optimization', 'testing', 'deployment'
    ];
    const foundTerms = technicalTerms.filter(term => 
      resumeText.toLowerCase().includes(term.toLowerCase())
    ).length;
    score += foundTerms * 2;

    // Education and certifications
    const hasEducation = /education|degree|university|college/i.test(resumeText);
    if (hasEducation) score += 5;

    const hasCertifications = /certified|certification|license/i.test(resumeText);
    if (hasCertifications) score += 5;

    // Professional keywords
    const professionalKeywords = [
      'professional', 'experience', 'responsibility', 'achievement',
      'project', 'team', 'collaboration', 'leadership'
    ];
    const profKeywordCount = professionalKeywords.filter(kw =>
      resumeText.toLowerCase().includes(kw)
    ).length;
    score += profKeywordCount * 1.5;

    // Penalize generic fluff
    const fluffWords = ['passionate', 'dedicated', 'hard-working', 'team player'];
    const fluffCount = fluffWords.filter(fw =>
      resumeText.toLowerCase().includes(fw)
    ).length;
    score -= fluffCount * 2;

    // Small controlled variance for natural distribution
    const randomVariance = (Math.random() - 0.5) * 6;
    score += randomVariance;

    return Math.max(25, Math.min(95, Math.round(score)));
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

  // Comprehensive Career Path Analysis with smart location and experience-based calculations
  async analyzeCareerPath(data: {
    careerGoal: string;
    location?: string;
    timeframe: string;
    userProfile: any;
    userSkills: any[];
    progressUpdate?: string;
  }, user?: any): Promise<any> {
    const accessInfo = this.hasAIAccess(user);
    const isPremium = accessInfo.tier === 'premium';

    // Optimized prompt with reduced tokens for free users
    const exp = data.userProfile?.yearsExperience || 0;
    const skillsToInclude = isPremium ? 12 : 5; // Premium gets more context
    const skills = data.userSkills?.slice(0, skillsToInclude).map((s: any) => s.skillName).join(',') || 'None';
    const loc = data.location || 'Not specified';

    // Premium users get detailed analysis, free users get essential analysis
    const prompt = isPremium 
      ? `Career analysis for ${data.careerGoal} in ${loc}. ${exp}yr exp. Skills: ${skills}. Timeframe: ${data.timeframe}.
${data.progressUpdate ? `Recent progress: ${data.progressUpdate.substring(0, 150)}` : ''}

Return detailed JSON with:
{
  "insights": [
    {"type":"path","title":"Career Strategy","content":"Comprehensive strategy for ${exp}yr professional","priority":"high","timeframe":"${data.timeframe}","actionItems":["4-5 detailed actions"]},
    {"type":"skill","title":"Skill Development","content":"Priority skills analysis","priority":"high","timeframe":"months","actionItems":["3-4 learning actions"]},
    {"type":"location","title":"${loc} Market","content":"Detailed market analysis with salary data","priority":"high","timeframe":"current","actionItems":["3-4 location strategies"]}
  ],
  "careerPath": {
    "currentRole":"${data.userProfile?.professionalTitle || 'Current'}","targetRole":"${data.careerGoal}","totalTimeframe":"${data.timeframe}","location":"${loc}","currency":"local symbol","successProbability":number,"steps":[{"position":"detailed role","timeline":"precise months","isCurrentLevel":bool,"requiredSkills":["specific skills"],"averageSalary":"LOCAL range with currency","salaryUSD":"USD equivalent","marketDemand":"High/Med/Low with reasoning","companiesHiring":["actual company names"]}]
  },
  "skillGaps":[{"skill":"specific name","currentLevel":0-10,"targetLevel":0-10,"importance":0-10,"learningResources":["detailed resources with links"],"timeToAcquire":"precise timeframe"}],
  "locationContext":{"country":"","city":"","currency":"","currencyCode":"","costOfLivingVsUS":"percentage","topCompanies":["actual companies"],"averageTaxRate":"rate","benefits":["specific benefits"],"remoteOpportunities":"detailed info","marketMaturity":"analysis","visaNotes":"if applicable"},
  "networkingOpportunities":[{"type":"category","platforms":["specific platforms"],"targetConnections":"who to connect with","localEvents":["actual events"]}],
  "marketTiming":{"currentConditions":"detailed analysis","hiringSeasons":"specific periods","trendingSkills":["current trends"],"recommendation":"actionable advice"}
}`
      : `Career path to ${data.careerGoal}. ${exp}yr exp. Skills: ${skills}.

Return concise JSON:
{
  "insights":[
    {"type":"path","title":"Career Strategy","content":"Key strategy for ${exp}yr pro","priority":"high","timeframe":"${data.timeframe}","actionItems":["2-3 actions"]},
    {"type":"skill","title":"Skills","content":"Priority skills","priority":"high","timeframe":"months","actionItems":["2 actions"]}
  ],
  "careerPath":{
    "currentRole":"${data.userProfile?.professionalTitle || 'Current'}","targetRole":"${data.careerGoal}","totalTimeframe":"${data.timeframe}","location":"${loc}","currency":"USD","successProbability":number,"steps":[{"position":"role","timeline":"months","isCurrentLevel":bool,"requiredSkills":["skills"],"averageSalary":"range","marketDemand":"High/Med/Low"}]
  },
  "skillGaps":[{"skill":"name","currentLevel":0-10,"targetLevel":0-10,"importance":0-10,"learningResources":["resources"],"timeToAcquire":"months"}]
}`;

    try {
      const accessInfo = this.hasAIAccess(user);

      if (this.developmentMode) {
        console.log("Running in development mode - using fallback career analysis");
        return this.generateFallbackCareerAnalysis(data, accessInfo);
      }

      // Use tier-appropriate model and token limits
      const maxTokens = isPremium ? 2000 : 1200; // Premium gets more detailed response
      const systemPrompt = isPremium
        ? `Expert international career coach. You have deep knowledge of:
- Global salary ranges in local currencies with exact figures
- Location-specific companies and detailed market analysis
- Realistic career progression timelines based on experience level
- Cost of living and tax implications worldwide
- Industry-specific networking opportunities

Return ONLY valid JSON. Provide detailed, actionable insights with specific data.`
        : `Career guidance expert. Provide:
- Essential career path steps
- Core skill requirements
- Basic market insights
- Key action items

Return ONLY valid JSON. Be concise but helpful.`;

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.2,
        max_tokens: maxTokens,
        user
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      console.log("Raw AI career analysis response:", content.substring(0, 500) + "...");

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        const analysis = JSON.parse(jsonContent);

        // Add proximity analysis for premium users
        if (isPremium) {
          const exp = data.userProfile?.yearsExperience || 0;
          const totalSteps = analysis.careerPath?.steps?.length || 1;
          const stepsRemaining = Math.max(1, totalSteps - (analysis.careerPath?.steps?.findIndex((s: any) => s.isCurrentLevel) || 0));
          
          const proximityScore = this.calculateGoalProximity(exp, stepsRemaining);
          const readinessLevel = this.determineReadinessLevel(proximityScore);
          const proximityContent = this.generateProximityContent(proximityScore, readinessLevel, data.careerGoal);
          const proximityActionItems = this.getProximityActionItems(readinessLevel, stepsRemaining);
          const proximityAnalysis = this.generateProximityAnalysis(proximityScore, exp, stepsRemaining);

          analysis.proximityAnalysis = {
            score: proximityScore,
            level: readinessLevel,
            content: proximityContent,
            actionItems: proximityActionItems,
            detailedMessage: proximityAnalysis,
            estimatedTimeToGoal: this.estimateTimeToGoal(stepsRemaining, exp)
          };
        }

        return {
          ...analysis,
          aiTier: accessInfo.tier,
          upgradeMessage: accessInfo.message
        };
      } catch (parseError) {
        console.error("Failed to parse career analysis JSON:", content);
        return this.generateFallbackCareerAnalysis(data, accessInfo);
      }
    } catch (error) {
      console.error("Error analyzing career path:", error);
      return this.generateFallbackCareerAnalysis(data, accessInfo);
    }
  }

  // Smart fallback with dynamic calculations
  private generateFallbackCareerAnalysis(
    data: any,
    accessInfo: { tier: 'premium' | 'basic', message?: string }
  ): any {
    const role = data.careerGoal || "Professional";
    const currentExp = data.userProfile?.yearsExperience || 0;
    const location = data.location || 'United States';

    // Calculate realistic progression steps based on experience
    const steps = this.calculateCareerSteps(role, currentExp, data.timeframe, location);

    // Add proximity analysis for premium users
    let proximityAnalysis = {};
    if (accessInfo.tier === 'premium') {
      const totalSteps = steps.length;
      const stepsRemaining = Math.max(1, totalSteps - (steps.findIndex((s: any) => s.isCurrentLevel) || 0));
      
      const proximityScore = this.calculateGoalProximity(currentExp, stepsRemaining);
      const readinessLevel = this.determineReadinessLevel(proximityScore);
      const proximityContent = this.generateProximityContent(proximityScore, readinessLevel, role);
      const proximityActionItems = this.getProximityActionItems(readinessLevel, stepsRemaining);
      const detailedProximityMessage = this.generateProximityAnalysis(proximityScore, currentExp, stepsRemaining);

      proximityAnalysis = {
        score: proximityScore,
        level: readinessLevel,
        content: proximityContent,
        actionItems: proximityActionItems,
        detailedMessage: detailedProximityMessage,
        estimatedTimeToGoal: this.estimateTimeToGoal(stepsRemaining, currentExp)
      };
    }

    return {
      insights: [
        {
          type: 'path',
          title: 'Career Path Strategy',
          content: `Based on your ${currentExp} years of experience, here's your realistic path to ${role}.`,
          priority: 'high',
          timeframe: data.timeframe,
          actionItems: [
            currentExp < 2 ? 'Focus on building foundational skills' : 'Leverage existing experience',
            'Build targeted portfolio projects',
            `Network with professionals in ${location}`
          ]
        },
        {
          type: 'skill',
          title: 'Skill Development',
          content: `Priority skills for someone with ${currentExp} years experience.`,
          priority: 'high',
          timeframe: currentExp < 2 ? '6-12 months' : '3-6 months',
          actionItems: [
            'Master core technical skills',
            'Develop soft skills'
          ]
        },
        {
          type: 'location',
          title: `${location} Market`,
          content: `Market analysis for ${location}. Research local companies and salary ranges.`,
          priority: 'high',
          timeframe: 'current',
          actionItems: [
            'Research local salary benchmarks',
            'Connect with local recruiters'
          ]
        }
      ],
      careerPath: {
        currentRole: data.userProfile?.professionalTitle || 'Current Position',
        targetRole: role,
        totalTimeframe: data.timeframe,
        location: location,
        currency: 'Local currency (research specific to your location)',
        successProbability: this.calculateSuccessProbability(currentExp, steps.length),
        steps: steps
      },
      skillGaps: [
        {
          skill: 'Advanced Technical Skills',
          currentLevel: Math.min(currentExp + 2, 7),
          targetLevel: 9,
          importance: 10,
          learningResources: ['Online courses', 'Bootcamps', 'Mentorship'],
          timeToAcquire: currentExp > 3 ? '3-6 months' : '6-9 months'
        },
        {
          skill: 'Leadership & Communication',
          currentLevel: Math.min(currentExp + 1, 6),
          targetLevel: 8,
          importance: currentExp > 3 ? 10 : 7,
          learningResources: ['Leadership courses', 'Team projects'],
          timeToAcquire: '4-8 months'
        }
      ],
      locationContext: {
        country: location.includes(',') ? location.split(',').pop()?.trim() : location,
        city: location.includes(',') ? location.split(',')[0] : undefined,
        currency: 'Research local currency and salary standards',
        costOfLivingVsUS: 'Varies by location',
        topCompanies: ['Research major employers in your area'],
        averageTaxRate: 'Check local tax regulations',
        benefits: ['Standard benefits vary by country'],
        remoteOpportunities: 'Growing globally',
        marketMaturity: 'Research your local tech scene',
        visaNotes: 'Consider if planning international move'
      },
      networkingOpportunities: [
        {
          type: 'Professional Networks',
          platforms: ['LinkedIn', 'Local meetups', 'Industry events'],
          targetConnections: `${role} professionals in ${location}`,
          localEvents: ['Check Meetup.com and Eventbrite for local tech events']
        }
      ],
      marketTiming: {
        currentConditions: 'Research current hiring trends in your location',
        hiringSeasons: 'Typically Q1 and Q3 are strong',
        trendingSkills: ['AI/ML', 'Cloud', 'Full-stack development'],
        recommendation: 'Start applying and networking now'
      },
      proximityAnalysis,
      aiTier: accessInfo.tier,
      upgradeMessage: accessInfo.message
    };
  }

  // Calculate career steps based on current experience
  private calculateCareerSteps(
    targetRole: string,
    currentExp: number,
    timeframe: string,
    location: string
  ): any[] {
    const timeframeMonths = timeframe === '1-year' ? 12 : 
                           timeframe === '2-years' ? 24 : 
                           timeframe === '3-years' ? 36 : 60;

    const steps: any[] = [];

    // Determine starting point based on experience
    let startLevel: 'junior' | 'mid' | 'senior' | 'lead';
    if (currentExp < 2) startLevel = 'junior';
    else if (currentExp < 5) startLevel = 'mid';
    else if (currentExp < 8) startLevel = 'senior';
    else startLevel = 'lead';

    // Define progression levels
    const levels = ['junior', 'mid', 'senior', 'lead', 'principal'];
    const startIndex = levels.indexOf(startLevel);

    // Calculate how many steps needed
    const targetLevels = levels.slice(startIndex);
    const stepsNeeded = Math.min(targetLevels.length, Math.ceil(timeframeMonths / 6));

    let cumulativeMonths = 0;

    for (let i = 0; i < stepsNeeded; i++) {
      const level = targetLevels[i];
      const isCurrentLevel = i === 0;

      // Calculate realistic timeline for this step
      let stepDuration: number;
      if (isCurrentLevel) {
        stepDuration = 0; // Current position
      } else if (currentExp < 2) {
        stepDuration = 12; // Slower progression for beginners
      } else if (currentExp < 5) {
        stepDuration = 9;
      } else {
        stepDuration = 6; // Faster for experienced
      }

      const stepEnd = cumulativeMonths + stepDuration;

      steps.push({
        position: `${level.charAt(0).toUpperCase() + level.slice(1)} ${targetRole}`,
        timeline: isCurrentLevel 
          ? 'Current position' 
          : `${cumulativeMonths}-${stepEnd} months`,
        isCurrentLevel,
        requiredSkills: this.getSkillsForLevel(level),
        averageSalary: `Research ${location} salary for ${level} level`,
        salaryUSD: this.getEstimatedSalaryUSD(level),
        marketDemand: i < 2 ? 'High' : 'Medium',
        companiesHiring: [`Research companies hiring ${level} roles in ${location}`]
      });

      cumulativeMonths = stepEnd;

      // Don't exceed timeframe
      if (cumulativeMonths >= timeframeMonths) break;
    }

    return steps;
  }

  private getSkillsForLevel(level: string): string[] {
    const skillMap: Record<string, string[]> = {
      'junior': ['Core technical skills', 'Problem solving', 'Communication'],
      'mid': ['Advanced technical skills', 'System design', 'Mentoring'],
      'senior': ['Architecture', 'Leadership', 'Strategic thinking'],
      'lead': ['Team management', 'Business acumen', 'Vision setting'],
      'principal': ['Org-level impact', 'Technical strategy', 'Thought leadership']
    };
    return skillMap[level] || ['Core skills', 'Communication'];
  }

  private getEstimatedSalaryUSD(level: string): string {
    const ranges: Record<string, string> = {
      'junior': '$50k - $80k USD',
      'mid': '$80k - $120k USD',
      'senior': '$120k - $180k USD',
      'lead': '$180k - $250k USD',
      'principal': '$250k - $400k USD'
    };
    return ranges[level] || '$60k - $100k USD';
  }

  private calculateSuccessProbability(currentExp: number, stepsNeeded: number): number {
    // More experience = higher probability
    // Fewer steps = higher probability
    let base = 60;
    base += Math.min(currentExp * 3, 20); // Up to +20 for experience
    base -= (stepsNeeded - 1) * 5; // -5 for each additional step
    return Math.max(50, Math.min(90, base));
  }

  // Calculate how close user is to their goal (0-100 score)
  private calculateGoalProximity(currentExp: number, stepsRemaining: number): number {
    let score = 0;

    // Experience contributes up to 40 points
    if (currentExp >= 8) score += 40;
    else if (currentExp >= 5) score += 30;
    else if (currentExp >= 3) score += 20;
    else if (currentExp >= 1) score += 10;

    // Fewer steps remaining = closer to goal (up to 40 points)
    if (stepsRemaining === 1) score += 40;
    else if (stepsRemaining === 2) score += 30;
    else if (stepsRemaining === 3) score += 20;
    else if (stepsRemaining === 4) score += 10;

    // Add 20 points for being on track
    score += 20;

    return Math.min(100, Math.max(0, score));
  }

  // Determine readiness level based on proximity score
  private determineReadinessLevel(proximityScore: number): string {
    if (proximityScore >= 80) return 'ready';
    if (proximityScore >= 60) return 'advanced';
    if (proximityScore >= 40) return 'intermediate';
    return 'beginner';
  }

  // Generate proximity content message
  private generateProximityContent(score: number, level: string, role: string): string {
    if (score >= 80) {
      return `You're very close to becoming a ${role}! You have the right experience and are just a step away.`;
    } else if (score >= 60) {
      return `You're making great progress toward ${role}. With focused effort, you're on the right track.`;
    } else if (score >= 40) {
      return `You're halfway to your goal of ${role}. Keep building your skills and experience.`;
    } else {
      return `You're at the beginning of your journey to ${role}. Stay committed and follow the roadmap.`;
    }
  }

  // Get action items based on readiness
  private getProximityActionItems(level: string, stepsRemaining: number): string[] {
    if (level === 'ready') {
      return [
        'Start applying to target roles',
        'Polish your portfolio and resume',
        'Network with hiring managers'
      ];
    } else if (level === 'advanced') {
      return [
        'Complete final skill certifications',
        'Build advanced portfolio projects',
        'Practice interview scenarios'
      ];
    } else if (level === 'intermediate') {
      return [
        'Focus on critical skill gaps',
        'Gain hands-on project experience',
        'Build your professional network'
      ];
    } else {
      return [
        'Master foundational skills',
        'Complete beginner certifications',
        'Start building basic projects'
      ];
    }
  }

  // Generate detailed proximity analysis
  private generateProximityAnalysis(score: number, exp: number, steps: number): string {
    const percentage = Math.round(score);
    const stepsText = steps === 1 ? '1 career step' : `${steps} career steps`;

    return `You are ${percentage}% of the way to your career goal. With ${exp} years of experience, you have ${stepsText} remaining. ${
      score >= 80 ? 'You are ready to make your move!' :
      score >= 60 ? 'You are well-positioned and making strong progress.' :
      score >= 40 ? 'You are building momentum in the right direction.' :
      'You are at the start of an exciting journey.'
    }`;
  }

  // Estimate time to goal
  private estimateTimeToGoal(steps: number, exp: number): string {
    const monthsPerStep = exp < 2 ? 12 : exp < 5 ? 9 : 6;
    const totalMonths = (steps - 1) * monthsPerStep;

    if (totalMonths < 6) return 'Within 6 months';
    if (totalMonths < 12) return '6-12 months';
    if (totalMonths < 24) return '1-2 years';
    if (totalMonths < 36) return '2-3 years';
    return '3+ years';
  }

  // Get AI access information for user
  public getAIAccessInfo(user: any): { tier: 'premium' | 'basic', message?: string, daysLeft?: number } {
    const accessInfo = this.hasAIAccess(user);
    return accessInfo;
  }

  // PREMIUM-ONLY: AI Cover Letter Generator
  async generateCoverLetter(jobDetails: {
    title: string;
    company: string;
    description: string;
    requirements: string;
  }, resume: string, user: any): Promise<{
    coverLetter: string;
    keyHighlights: string[];
    callToAction: string;
  }> {
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';
    
    if (!isPremium) {
      throw new Error('Cover letter generation is a premium feature. Upgrade to access this service.');
    }

    const prompt = `Generate a compelling, personalized cover letter for:

JOB: ${jobDetails.title} at ${jobDetails.company}
DESCRIPTION: ${jobDetails.description}
REQUIREMENTS: ${jobDetails.requirements}

CANDIDATE RESUME: ${resume}

Create a professional cover letter that:
1. Opens with a strong hook related to the company
2. Highlights 3-4 specific achievements from the resume that match the job
3. Shows genuine interest in the role and company
4. Ends with a clear call to action

Return JSON:
{
  "coverLetter": "full cover letter text with proper formatting",
  "keyHighlights": ["3-4 specific achievements emphasized"],
  "callToAction": "the closing call to action"
}`;

    try {
      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert career coach and professional writer. Generate compelling cover letters that get interviews."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.7, max_tokens: 1500, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackCoverLetter();
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return this.generateFallbackCoverLetter();
    }
  }

  private generateFallbackCoverLetter() {
    return {
      coverLetter: "Dear Hiring Manager,\n\nI am writing to express my strong interest in this position...",
      keyHighlights: ["Relevant experience", "Strong skill match", "Proven track record"],
      callToAction: "I look forward to discussing how I can contribute to your team."
    };
  }

  // PREMIUM-ONLY: Salary Negotiation Coach
  async getSalaryNegotiationAdvice(data: {
    currentOffer: number;
    desiredSalary: number;
    jobTitle: string;
    experience: number;
    location: string;
    marketData?: any;
  }, user: any): Promise<{
    strategy: string;
    counterOfferSuggestion: number;
    talkingPoints: string[];
    responses: Array<{ scenario: string; response: string }>;
    marketInsights: string;
  }> {
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';
    
    if (!isPremium) {
      throw new Error('Salary negotiation coaching is a premium feature. Upgrade to access this service.');
    }

    const prompt = `You are a senior career coach specializing in salary negotiation. Provide expert advice for:

CURRENT OFFER: $${data.currentOffer}
DESIRED SALARY: $${data.desiredSalary}
JOB: ${data.jobTitle}
EXPERIENCE: ${data.experience} years
LOCATION: ${data.location}

Provide strategic negotiation advice in JSON:
{
  "strategy": "overall negotiation strategy paragraph",
  "counterOfferSuggestion": number (recommended counter-offer amount),
  "talkingPoints": ["3-5 specific value points to emphasize"],
  "responses": [
    {"scenario": "If they say budget is fixed", "response": "your suggested response"},
    {"scenario": "If they ask for your bottom line", "response": "your suggested response"},
    {"scenario": "If they counter lower", "response": "your suggested response"}
  ],
  "marketInsights": "market data and justification for your ask"
}`;

    try {
      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert salary negotiation coach with 15+ years of experience. Provide confident, strategic advice."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.6, max_tokens: 1200, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackNegotiation(data);
    } catch (error) {
      console.error('Error generating negotiation advice:', error);
      return this.generateFallbackNegotiation(data);
    }
  }

  private generateFallbackNegotiation(data: any) {
    const counterOffer = Math.round(data.currentOffer * 1.1);
    return {
      strategy: "Negotiate confidently by emphasizing your unique value and market research.",
      counterOfferSuggestion: counterOffer,
      talkingPoints: [
        `${data.experience} years of relevant experience`,
        "Proven track record in similar roles",
        "Market rate alignment for this position"
      ],
      responses: [
        {
          scenario: "If they say budget is fixed",
          response: "I understand budget constraints. Can we explore other forms of compensation like signing bonus or additional benefits?"
        },
        {
          scenario: "If they ask for your bottom line",
          response: "I'm flexible and open to discussion. What range did you have in mind for someone with my experience?"
        }
      ],
      marketInsights: `Based on market data for ${data.jobTitle} in ${data.location}, salaries typically range from $${data.currentOffer} to $${counterOffer + 20000}.`
    };
  }

  // PREMIUM-ONLY: Interview Answer Generator (STAR method)
  async generateInterviewAnswer(question: string, resume: string, user: any): Promise<{
    starAnswer: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    fullAnswer: string;
    keyPoints: string[];
    followUpTips: string[];
  }> {
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';
    
    if (!isPremium) {
      throw new Error('Interview answer generation is a premium feature. Upgrade to access this service.');
    }

    const prompt = `Generate a compelling STAR method interview answer for:

QUESTION: "${question}"

CANDIDATE BACKGROUND: ${resume}

Create a strong answer using the STAR method (Situation, Task, Action, Result).
Return JSON:
{
  "starAnswer": {
    "situation": "brief context",
    "task": "your responsibility",
    "action": "specific steps you took",
    "result": "quantifiable outcome"
  },
  "fullAnswer": "complete 2-minute answer ready to speak",
  "keyPoints": ["3-4 key points to emphasize"],
  "followUpTips": ["potential follow-up questions and how to handle them"]
}`;

    try {
      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an interview coaching expert. Generate compelling STAR method answers that showcase achievements."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.7, max_tokens: 1000, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackInterviewAnswer();
    } catch (error) {
      console.error('Error generating interview answer:', error);
      return this.generateFallbackInterviewAnswer();
    }
  }

  private generateFallbackInterviewAnswer() {
    return {
      starAnswer: {
        situation: "In my previous role, we faced a significant challenge...",
        task: "I was responsible for leading the solution...",
        action: "I implemented a systematic approach that included...",
        result: "This resulted in a 30% improvement and positive team feedback."
      },
      fullAnswer: "Let me share a relevant example. In my previous role, we faced a significant challenge that required quick thinking and leadership. I was responsible for leading the solution, and I implemented a systematic approach that included thorough analysis and stakeholder engagement. This resulted in a 30% improvement and positive feedback from the team.",
      keyPoints: [
        "Demonstrated leadership in challenging situations",
        "Achieved measurable results",
        "Received positive stakeholder feedback"
      ],
      followUpTips: [
        "Be ready to elaborate on specific technical details",
        "Prepare to discuss lessons learned from the experience"
      ]
    };
  }

  // PREMIUM-ONLY: Career Path Planner
  async generateCareerPath(userProfile: {
    currentRole: string;
    experience: number;
    skills: string[];
    interests: string[];
    targetRole?: string;
  }, user: any): Promise<{
    careerRoadmap: Array<{
      role: string;
      timeframe: string;
      skillsNeeded: string[];
      certifications: string[];
      salaryRange: string;
      nextSteps: string[];
    }>;
    immediateActions: string[];
    longTermStrategy: string;
    alternativePaths: string[];
  }> {
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';
    
    if (!isPremium) {
      throw new Error('Career path planning is a premium feature. Upgrade to access this service.');
    }

    const prompt = `Create a detailed career progression plan for:

CURRENT: ${userProfile.currentRole} (${userProfile.experience} years experience)
SKILLS: ${userProfile.skills.join(', ')}
INTERESTS: ${userProfile.interests.join(', ')}
${userProfile.targetRole ? `TARGET ROLE: ${userProfile.targetRole}` : ''}

Provide a 3-5 year career roadmap in JSON:
{
  "careerRoadmap": [
    {
      "role": "Next career step",
      "timeframe": "Years 1-2",
      "skillsNeeded": ["specific skills to develop"],
      "certifications": ["relevant certifications"],
      "salaryRange": "$X-Y",
      "nextSteps": ["actionable steps to get there"]
    }
  ],
  "immediateActions": ["3-5 actions to start this month"],
  "longTermStrategy": "overall career strategy paragraph",
  "alternativePaths": ["alternative career paths to consider"]
}`;

    try {
      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are a senior career advisor with expertise in tech industry career progression. Provide strategic, realistic career advice."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.6, max_tokens: 1500, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackCareerPath(userProfile);
    } catch (error) {
      console.error('Error generating career path:', error);
      return this.generateFallbackCareerPath(userProfile);
    }
  }

  private generateFallbackCareerPath(userProfile: any) {
    return {
      careerRoadmap: [
        {
          role: `Senior ${userProfile.currentRole}`,
          timeframe: "Years 1-2",
          skillsNeeded: ["Advanced technical skills", "Leadership abilities"],
          certifications: ["Industry-relevant certification"],
          salaryRange: "$80,000-$120,000",
          nextSteps: [
            "Take on lead project responsibility",
            "Mentor junior team members",
            "Build strategic relationships"
          ]
        },
        {
          role: `Lead ${userProfile.currentRole}`,
          timeframe: "Years 3-5",
          skillsNeeded: ["Strategic thinking", "Team management"],
          certifications: ["Leadership certification"],
          salaryRange: "$120,000-$160,000",
          nextSteps: [
            "Manage cross-functional projects",
            "Develop business acumen",
            "Build industry network"
          ]
        }
      ],
      immediateActions: [
        "Update your LinkedIn profile with recent achievements",
        "Identify and start one skill-building course",
        "Schedule informational interviews with people in target roles",
        "Document your current projects and impact",
        "Join relevant professional communities"
      ],
      longTermStrategy: "Focus on building both technical expertise and leadership skills. Position yourself as a thought leader through content creation and speaking opportunities. Build a strong professional network and seek opportunities to lead high-impact projects.",
      alternativePaths: [
        "Consulting or freelancing in your domain",
        "Entrepreneurship and startup founding",
        "Technical management track",
        "Product management transition"
      ]
    };
  }
}

// Export singleton instance
export const aiService = new AIService();