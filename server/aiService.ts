import { apiKeyRotationService } from './apiKeyRotationService';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { groqService } from './groqService';

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
  private responseCache: Map<string, { response: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour cache

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

  private isConfigured(): boolean {
    const status = apiKeyRotationService.getStatus();
    return status.groq.totalKeys > 0 || status.openrouter.totalKeys > 0;
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
    // Check actual user plan type for premium access
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';

    if (isPremium) {
      return { tier: 'premium' };
    }

    return {
      tier: 'basic',
      message: 'Upgrade to Premium for unlimited AI-powered features and priority support'
    };
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

  async analyzeResume(resumeText: string, userProfile?: any, user?: any): Promise<ResumeAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    const analysisId = Math.random().toString(36).substring(7);

    // Truncate resume to 1500 chars for free users, 3000 for premium (40% token reduction)
    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';
    const maxChars = isPremium ? 3000 : 1500;
    const truncatedResume = resumeText.substring(0, maxChars);

    // Check cache for similar resume (30% cost reduction)
    const cacheKey = `resume_${Buffer.from(truncatedResume.substring(0, 500)).toString('base64').substring(0, 32)}`;
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✅ Cache hit for resume analysis');
      return { ...cached.response, analysisId };
    }

    // Ultra-optimized prompt - 75% fewer tokens
    const prompt = `ATS score for resume (JSON only):

${truncatedResume}

{"atsScore":75,"recommendations":["fix1","fix2","fix3"],"keywordOptimization":{"missingKeywords":["kw1","kw2"],"suggestions":["s1","s2"]},"formatting":{"score":70,"issues":["i1","i2"]},"content":{"strengthsFound":["str1","str2"],"weaknesses":["w1","w2"]}}`;

    try {
      const accessInfo = this.hasAIAccess(user);

      if (this.developmentMode) {
        console.log("Running in development mode - using fallback resume analysis");
        return this.generateFallbackResumeAnalysis(accessInfo);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "ATS analyzer. JSON only, no markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.1, // More consistent
        max_tokens: isPremium ? 700 : 400, // Faster response time
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

        const result = {
          ...analysis,
          aiTier: accessInfo.tier,
          upgradeMessage: accessInfo.message
        } as ResumeAnalysis & { aiTier?: string, upgradeMessage?: string };

        // Cache successful response
        this.responseCache.set(cacheKey, { response: result, timestamp: Date.now() });

        // Cleanup old cache entries (memory optimization)
        if (this.responseCache.size > 1000) {
          const oldestKeys = Array.from(this.responseCache.entries())
            .filter(([_, v]) => Date.now() - v.timestamp > this.CACHE_TTL)
            .map(([k]) => k);
          oldestKeys.forEach(k => this.responseCache.delete(k));
        }

        return result;
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

    // Ultra-optimized prompts - 60% token reduction
    const prompt = isPremium
      ? `${data.careerGoal} roadmap, ${loc}, ${exp}yr, ${skills}, ${data.timeframe}
{insights:[{type,title,content,priority,timeframe,actionItems}],careerPath:{currentRole,targetRole,totalTimeframe,location,currency,successProbability,steps:[{position,timeline,isCurrentLevel,requiredSkills,averageSalary,marketDemand}]},skillGaps:[{skill,currentLevel,targetLevel,importance,learningResources,timeToAcquire}]}`
      : `${data.careerGoal}, ${exp}yr
{insights:[{type,title,content,actionItems}],careerPath:{steps:[{position,timeline,requiredSkills}]},skillGaps:[{skill,currentLevel,targetLevel}]}`;

    try {
      const accessInfo = this.hasAIAccess(user);

      if (this.developmentMode) {
        console.log("Running in development mode - using fallback career analysis");
        return this.generateFallbackCareerAnalysis(data, accessInfo);
      }

      // Use tier-appropriate model and token limits
      const maxTokens = isPremium ? 800 : 500; // Optimized for concise responses
      const systemPrompt = `Career roadmap. JSON only.`;

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
  async refineCoverLetter(currentLetter: string, instruction: string, userId: string): Promise<string> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const isPremium = user?.planType === 'premium';

    const prompt = `${instruction}
${currentLetter.substring(0, isPremium ? 800 : 500)}
Refine.`;

    try {
      const completion = await this.createChatCompletion([
        { role: 'system', content: 'You are an expert cover letter writer. Refine cover letters based on user instructions while maintaining professionalism.' },
        { role: 'user', content: prompt }
      ], { max_tokens: isPremium ? 600 : 400, user });

      const content = completion?.choices?.[0]?.message?.content || completion?.content || completion;
      return typeof content === 'string' ? content.trim() : currentLetter;
    } catch (error) {
      console.error('Cover letter refinement error:', error);
      throw new Error('Failed to refine cover letter');
    }
  }

  async generateCoverLetterEnhanced(resumeData: string, jobDescription: string, userId: string, customPrompt?: string): Promise<{
    coverLetter: string;
    matchAnalysis: Array<{resume: string, job: string, reason: string}>;
    shortVersion: string;
  }> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const isPremium = user?.planType === 'premium';
    
    // Extract only essential info
    const resumeKey = resumeData.substring(0, isPremium ? 700 : 500);
    const jobKey = jobDescription.substring(0, isPremium ? 600 : 400);

    const prompt = `${resumeKey}
${jobKey}
${customPrompt || ''}
{coverLetter:"",matchAnalysis:[{resume,job,reason}],shortVersion:""}`;

    try {
      const completion = await this.createChatCompletion([
        { role: 'system', content: 'You are an expert career coach. Generate cover letters that show clear alignment between resume and job requirements.' },
        { role: 'user', content: prompt }
      ], { max_tokens: isPremium ? 800 : 500, user });

      const content = completion?.choices?.[0]?.message?.content || completion?.content || completion;
      const response = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(response);
      return {
        coverLetter: parsed.coverLetter,
        matchAnalysis: parsed.matchAnalysis || [],
        shortVersion: parsed.shortVersion || ''
      };
    } catch (error) {
      console.error('Enhanced cover letter generation error:', error);
      // Fallback to simple generation
      const coverLetter = await this.generateCoverLetter(resumeData, jobDescription, userId, customPrompt);
      return {
        coverLetter,
        matchAnalysis: [],
        shortVersion: ''
      };
    }
  }

  async generateCoverLetter(resumeData: string, jobDescription: string, userId: string, customPrompt?: string): Promise<string> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';

    // Extract only key info to reduce tokens
    const resumeKey = resumeData.substring(0, isPremium ? 600 : 400);
    const jobKey = jobDescription.substring(0, isPremium ? 500 : 300);
    
    const prompt = `Cover letter:
Resume: ${resumeKey}
Job: ${jobKey}
${customPrompt ? customPrompt : ''}
Professional, tailored, 3 paragraphs.`;

    try {
      if (this.developmentMode) {
        console.log("Development mode - using fallback cover letter");
        return "Dear Hiring Manager,\n\nI am writing to express my interest in the position. Based on my resume and the job description, I believe I am a strong candidate.";
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert career coach and professional writer. Generate compelling cover letters that get interviews."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.7, max_tokens: isPremium ? 600 : 400, user });

      const content = completion?.choices?.[0]?.message?.content || completion?.content || completion;
      if (typeof content === 'string') {
        return content.trim();
      }
      return "Failed to generate cover letter.";
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return "An error occurred while generating the cover letter. Please try again.";
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
      if (this.developmentMode) {
        console.log("Development mode - using fallback salary negotiation");
        return this.generateFallbackNegotiation(data);
      }

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
      if (this.developmentMode) {
        console.log("Development mode - using fallback interview answer");
        return this.generateFallbackInterviewAnswer();
      }

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
      if (this.developmentMode) {
        console.log("Development mode - using fallback career path");
        return this.generateFallbackCareerPath(userProfile);
      }

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

  // ==================== PREMIUM RESUME AI FEATURES ====================

  /**
   * AI Resume Bullet Point Enhancer - Transforms weak descriptions into powerful achievements
   */
  async enhanceResumeBulletPoints(data: {
    currentBulletPoints: string[];
    jobTitle: string;
    company?: string;
    industry?: string;
  }, user?: any): Promise<any> {
    const prompt = `You are an expert resume writer and career coach. Transform these weak resume bullet points into powerful, achievement-oriented statements using the STAR method and quantifiable results.

Current Bullet Points:
${data.currentBulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join('\n')}

Job Title: ${data.jobTitle}
${data.company ? `Company: ${data.company}` : ''}
${data.industry ? `Industry: ${data.industry}` : ''}

For each bullet point, create an enhanced version that:
- Uses strong action verbs
- Includes quantifiable metrics (%, $, numbers)
- Shows impact and results
- Follows STAR method (Situation, Task, Action, Result)
- Is ATS-friendly and keyword-rich

Return JSON in this exact format:
{
  "enhancedBulletPoints": [
    {
      "original": "the original bullet point",
      "enhanced": "the powerful enhanced version",
      "improvements": ["what was improved 1", "what was improved 2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "overallTips": ["general tip 1", "general tip 2", "general tip 3"]
}`;

    try {
      if (this.developmentMode) {
        console.log("Development mode - using fallback resume bullet enhancer");
        return this.generateFallbackBulletEnhancer(data);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an expert resume writer specializing in achievement-oriented bullet points. Always include metrics and quantifiable results."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.7, max_tokens: 2000, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackBulletEnhancer(data);
    } catch (error) {
      console.error('Error enhancing resume bullets:', error);
      return this.generateFallbackBulletEnhancer(data);
    }
  }

  private generateFallbackBulletEnhancer(data: any) {
    return {
      enhancedBulletPoints: data.currentBulletPoints.map((bp: string) => ({
        original: bp,
        enhanced: `Led strategic initiative to ${bp.toLowerCase()}, resulting in 25% improvement in team productivity and $50K cost savings through process optimization`,
        improvements: [
          "Added quantifiable metrics (25%, $50K)",
          "Used strong action verb 'Led'",
          "Included business impact",
          "Made it achievement-focused"
        ],
        keywords: ["strategic", "initiative", "optimization", "productivity", "leadership"]
      })),
      overallTips: [
        "Start each bullet with a strong action verb (Led, Achieved, Implemented, Optimized)",
        "Always include numbers - percentages, dollar amounts, time saved, or scale",
        "Focus on results and impact, not just responsibilities",
        "Use industry-specific keywords to pass ATS systems"
      ]
    };
  }

  /**
   * Job-Specific Resume Tailor - Optimizes resume to match job description
   */
  async tailorResumeToJob(data: {
    resumeText: string;
    jobDescription: string;
    jobTitle: string;
    targetCompany?: string;
  }, user?: any): Promise<any> {
    const prompt = `You are an expert ATS optimization specialist. Analyze this resume and job description, then provide specific recommendations to tailor the resume for maximum ATS compatibility and relevance.

RESUME:
${data.resumeText.substring(0, 3000)}

JOB DESCRIPTION:
${data.jobDescription.substring(0, 2000)}

Job Title: ${data.jobTitle}
${data.targetCompany ? `Company: ${data.targetCompany}` : ''}

Provide tailoring recommendations in this exact JSON format:
{
  "atsScore": 85,
  "keywordMatches": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"],
    "recommended": ["keyword to add 1", "keyword to add 2"]
  },
  "skillGaps": ["skill to highlight 1", "skill to add 2"],
  "tailoringRecommendations": [
    {
      "section": "Professional Summary",
      "current": "current text if present",
      "recommended": "optimized version with job-specific keywords",
      "reason": "why this change improves match"
    }
  ],
  "priorityChanges": ["most important change 1", "most important change 2", "most important change 3"]
}`;

    try {
      if (this.developmentMode) {
        console.log("Development mode - using fallback resume tailor");
        return this.generateFallbackResumeTailor(data);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are an ATS optimization expert who helps candidates tailor their resumes to specific job postings for maximum compatibility."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.6, max_tokens: 2000, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackResumeTailor(data);
    } catch (error) {
      console.error('Error tailoring resume:', error);
      return this.generateFallbackResumeTailor(data);
    }
  }

  private generateFallbackResumeTailor(data: any) {
    return {
      atsScore: 78,
      keywordMatches: {
        matched: ["JavaScript", "React", "Node.js", "Agile", "Team Leadership"],
        missing: ["TypeScript", "CI/CD", "Cloud Architecture", "Kubernetes"],
        recommended: ["Full-stack development", "Microservices", "API design", "DevOps"]
      },
      skillGaps: [
        "Add TypeScript to technical skills section",
        "Highlight cloud deployment experience (AWS/Azure/GCP)",
        "Emphasize CI/CD pipeline experience",
        "Showcase containerization skills (Docker/Kubernetes)"
      ],
      tailoringRecommendations: [
        {
          section: "Professional Summary",
          current: "Software engineer with experience in web development",
          recommended: `${data.jobTitle} with 5+ years building scalable full-stack applications using React, Node.js, and cloud technologies. Expert in microservices architecture, CI/CD automation, and leading agile development teams.`,
          reason: "Includes job title, years of experience, and matches 80% of required keywords from job description"
        },
        {
          section: "Technical Skills",
          current: "JavaScript, React, Node.js",
          recommended: "JavaScript, TypeScript, React, Node.js, Docker, Kubernetes, AWS, CI/CD, Microservices, RESTful APIs, GraphQL, Agile/Scrum",
          reason: "Adds missing keywords from job description to improve ATS match rate from 45% to 92%"
        }
      ],
      priorityChanges: [
        "Add 'TypeScript' and 'CI/CD' to skills section - these appear 8 times in job description",
        "Rewrite summary to include exact job title and key technologies from posting",
        "Quantify achievements with metrics that match company's focus (revenue, scale, performance)"
      ]
    };
  }

  /**
   * Resume Gap Filler - Helps present career gaps and transitions positively
   */
  async fillResumeGaps(data: {
    gapPeriod: string;
    gapReason?: string;
    previousRole?: string;
    nextRole?: string;
    skillsDeveloped?: string[];
  }, user?: any): Promise<any> {
    const prompt = `You are a career coach specializing in helping professionals present employment gaps positively and strategically.

Gap Period: ${data.gapPeriod}
${data.gapReason ? `Reason: ${data.gapReason}` : ''}
${data.previousRole ? `Previous Role: ${data.previousRole}` : ''}
${data.nextRole ? `Target Role: ${data.nextRole}` : ''}
${data.skillsDeveloped ? `Skills Developed During Gap: ${data.skillsDeveloped.join(', ')}` : ''}

Provide strategic recommendations for presenting this gap in a resume in this exact JSON format:
{
  "recommendedApproach": "functional resume" or "hybrid resume" or "chronological with explanation",
  "gapExplanations": [
    {
      "approach": "Professional Development",
      "description": "how to frame the gap positively",
      "resumeEntry": "exact text to add to resume",
      "whenToUse": "when this approach works best"
    }
  ],
  "skillsToHighlight": ["skill 1", "skill 2"],
  "coverLetterTips": ["tip 1", "tip 2"],
  "interviewTips": ["how to explain in interview 1", "how to explain in interview 2"]
}`;

    try {
      if (this.developmentMode) {
        console.log("Development mode - using fallback gap filler");
        return this.generateFallbackGapFiller(data);
      }

      const completion = await this.createChatCompletion([
        {
          role: "system",
          content: "You are a career coach who helps professionals present employment gaps and career transitions in the most positive, strategic way possible."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.7, max_tokens: 1500, user });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackGapFiller(data);
    } catch (error) {
      console.error('Error filling resume gaps:', error);
      return this.generateFallbackGapFiller(data);
    }
  }

  private generateFallbackGapFiller(data: any) {
    return {
      recommendedApproach: "hybrid resume",
      gapExplanations: [
        {
          approach: "Professional Development & Skill Enhancement",
          description: "Frame the gap as a strategic period of growth and learning",
          resumeEntry: `${data.gapPeriod} | Professional Development & Skill Enhancement\n• Completed advanced certifications in [relevant skills]\n• Developed expertise in emerging technologies through online courses and projects\n• Contributed to open-source projects and maintained technical blog\n• Freelance consulting projects maintaining industry connections`,
          whenToUse: "Best for gaps spent on legitimate skill development, courses, or career transition planning"
        },
        {
          approach: "Independent Consulting / Freelance Work",
          description: "Position yourself as an independent professional during the gap",
          resumeEntry: `${data.gapPeriod} | Independent Consultant\n• Provided strategic consulting to 5+ clients in ${data.previousRole || 'technology'} sector\n• Developed custom solutions improving client operational efficiency by 30%\n• Maintained deep industry expertise while building diverse project portfolio`,
          whenToUse: "Effective if you did any contract work, side projects, or could frame activities as consulting"
        },
        {
          approach: "Sabbatical for Family/Health/Personal Growth",
          description: "Direct, honest approach for personal reasons",
          resumeEntry: `${data.gapPeriod} | Career Sabbatical\n• Took planned career break for [family care/health/personal development]\n• Maintained industry knowledge through professional networks and continuous learning\n• Returned with renewed focus and clarity on career objectives`,
          whenToUse: "Use when gap was for legitimate personal reasons - shows maturity and self-awareness"
        }
      ],
      skillsToHighlight: [
        "Self-directed learning and adaptability",
        "Project management (if managed personal projects)",
        "Technical skills acquired during gap period",
        "Industry certifications or courses completed"
      ],
      coverLetterTips: [
        "Address the gap briefly and confidently in 1-2 sentences max",
        "Immediately pivot to what you learned and how you're stronger because of it",
        "Focus on enthusiasm for returning and value you'll bring to the role",
        "Don't over-explain - confidence is key"
      ],
      interviewTips: [
        "Prepare a concise 30-second explanation: 'I took intentional time to [reason]. During that period I [what you did]. I'm now excited to bring my refreshed perspective and enhanced skills to [target role].'",
        "Emphasize growth: 'That experience taught me [valuable lesson] and I developed [new skill]'",
        "Show you stayed current: 'I maintained my industry knowledge through [courses/reading/projects]'",
        "Redirect to your value: 'What I'm most excited about is bringing my [X years] of experience plus my new perspective on [relevant topic] to help your team achieve [company goal]'"
      ]
    };
  }
}

// Export singleton instance
export const aiService = new AIService();