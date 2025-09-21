import Groq from "groq-sdk";
import { apiKeyRotationService } from "./apiKeyRotationService.js";
import { aiService } from "./aiService.js";

interface ResumeAnalysis {
  atsScore: number;
  recommendations: string[];
  keywordOptimization: {
    missingKeywords: string[];
    overusedKeywords: string[];
    suggestions: string[];
  };
  formatting: {
    score: number;
    issues: string[];
    improvements: string[];
  };
  content: {
    strengthsFound: string[];
    weaknesses: string[];
    suggestions: string[];
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

class GroqService {
  public client: Groq | null;
  private developmentMode: boolean;
  
  // AI Model Tiers - Using optimized model with higher rate limits and better context
  private readonly models = {
    premium: "llama-3.3-70b-versatile",   // Current working model from user's example
    basic: "llama-3.3-70b-versatile"      // Same model for all users
  };

  constructor() {
    const status = apiKeyRotationService.getStatus();
    if (status.groq.totalKeys === 0) {
      console.warn("No GROQ API keys configured - AI analysis will be simulated in development mode");
      this.developmentMode = true;
      this.client = null;
      return;
    }
    
    console.log(`Groq Service initialized with ${status.groq.totalKeys} API keys (${status.groq.availableKeys} available)`);
    this.developmentMode = false;
    this.client = null; // Will use rotation service instead
  }

  // All users get the same fast, cost-effective model
  private hasAIAccess(user: any): { tier: 'premium' | 'basic', message?: string } {
    // Everyone gets the same efficient model - no tier restrictions
    return { tier: 'premium' };
  }

  private generateFallbackResumeAnalysis(accessInfo: { tier: 'premium' | 'basic', message?: string }): ResumeAnalysis & { aiTier?: string, upgradeMessage?: string } {
    return {
      atsScore: 75,
      recommendations: [
        "Resume analysis will be available when AI service is configured",
        "Add specific metrics and numbers to quantify your achievements",
        "Include more relevant technical skills for your target industry",
        "Use stronger action verbs to describe your accomplishments"
      ],
      keywordOptimization: {
        missingKeywords: ["technical skills", "industry-specific tools"],
        overusedKeywords: [],
        suggestions: ["Add role-specific technical terms", "Include metrics and percentages", "Use action-oriented language"]
      },
      formatting: {
        score: 70,
        issues: [],
        improvements: ["Use consistent bullet points", "Include clear section headers", "Ensure proper spacing and alignment"]
      },
      content: {
        strengthsFound: ["Well-structured content"],
        weaknesses: ["Could benefit from more specific details"],
        suggestions: ["Add specific numbers and percentages to achievements", "Include more detailed work experience descriptions", "Highlight measurable impact and results"]
      },
      aiTier: accessInfo.tier,
      upgradeMessage: accessInfo.message
    };
  }

  private generateFallbackJobAnalysis(accessInfo: { tier: 'premium' | 'basic', message?: string }): JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string } {
    return {
      matchScore: 45,
      matchingSkills: [],
      missingSkills: ['AI analysis unavailable - please check requirements manually'],
      skillGaps: {
        critical: [],
        important: ['Verify technical requirements match your skills'],
        nice_to_have: []
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
      upgradeMessage: 'AI analysis temporarily unavailable - manual review recommended'
    };
  }

  // Get model based on user tier
  private getModel(user: any): string {
    const { tier } = this.hasAIAccess(user);
    return this.models[tier];
  }

  // Get AI access information for user
  public getAIAccessInfo(user: any): { tier: 'premium' | 'basic', message?: string, daysLeft?: number } {
    const accessInfo = this.hasAIAccess(user);
    
    if (accessInfo.tier === 'premium' && !user?.hasUsedPremiumTrial) {
      // Calculate days left in trial
      const now = new Date();
      const trialStart = new Date(user.premiumTrialStartDate);
      const trialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      return {
        ...accessInfo,
        daysLeft: Math.max(0, daysLeft)
      };
    }
    
    return accessInfo;
  }

  async analyzeResume(resumeText: string, userProfile?: any, user?: any): Promise<ResumeAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    // Delegate to the unified AI service which handles rotation between Groq and OpenRouter
    return await aiService.analyzeResume(resumeText, userProfile, user);
  }

  async analyzeJobMatch(
    jobData: {
      title: string;
      company: string;
      description: string;
      requirements?: string;
      qualifications?: string;
      benefits?: string;
    },
    userProfile: {
      skills: Array<{ skillName: string; proficiencyLevel?: string; yearsExperience?: number }>;
      workExperience: Array<{ position: string; company: string; description?: string }>;
      education: Array<{ degree: string; fieldOfStudy?: string; institution: string }>;
      yearsExperience?: number;
      professionalTitle?: string;
      summary?: string;
    },
    user?: any
  ): Promise<JobMatchAnalysis & { aiTier?: string, upgradeMessage?: string }> {
    // Delegate to the unified AI service which handles rotation between Groq and OpenRouter
    return await aiService.analyzeJobMatch(jobData, userProfile, user);
  }

  async extractJobDetails(jobDescription: string): Promise<{
    title: string;
    company: string;
    location: string;
    workMode: string;
    jobType: string;
    salaryRange: string;
    requiredSkills: string[];
    qualifications: string[];
    benefits: string[];
  }> {
    const prompt = `
Extract structured information from this job posting:

${jobDescription}

Please return the information in the following JSON format:
{
  "title": "extracted job title",
  "company": "company name",
  "location": "job location",
  "workMode": "remote|hybrid|onsite|not_specified",
  "jobType": "full-time|part-time|contract|internship|not_specified",
  "salaryRange": "salary range or 'not_specified'",
  "requiredSkills": ["list of technical and soft skills mentioned as requirements"],
  "qualifications": ["education, experience, and other qualification requirements"],
  "benefits": ["benefits and perks mentioned"]
}

Be precise and only extract information that is explicitly stated in the job posting.
`;

    try {
      if (this.developmentMode) {
        console.log("Running in development mode - using fallback job extraction");
        return {
          title: "Sample Job Title",
          company: "Sample Company",
          location: "Remote",
          workMode: "remote",
          jobType: "full-time",
          salaryRange: "not_specified",
          requiredSkills: ["Sample skill"],
          qualifications: ["Sample qualification"],
          benefits: ["Sample benefit"]
        };
      }

      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting structured information from job postings. Return valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.1,
          max_tokens: 1000,
        });
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      const extracted = JSON.parse(content);
      return extracted;
    } catch (error) {
      console.error("Error extracting job details with Groq:", error);
      throw new Error("Failed to extract job details");
    }
  }

  async generateJobRecommendations(userProfile: any): Promise<any[]> {
    try {
      const userSkills = userProfile.skills || [];
      const userExperience = userProfile.workExperience || [];
      const userEducation = userProfile.education || [];
      
      const prompt = `Generate 6 job recommendations for: ${userProfile.professionalTitle}, ${userProfile.yearsExperience}yr exp
Skills: ${userSkills.map((s: any) => s.skillName).join(', ').substring(0, 100)}...

Return JSON array:
[{"id":"ai-1","title":"Job Title","company":"Company","location":"City","description":"Brief desc","requirements":["req1"],"matchScore":85,"salaryRange":"$80k-120k","workMode":"Remote","postedDate":"2024-01-15T10:00:00Z","applicationUrl":"https://company.com/jobs","benefits":["benefit1"],"isBookmarked":false}]`;

      if (this.developmentMode) {
        console.log("Running in development mode - using fallback job recommendations");
        return [];
      }

      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
        });
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      // Parse the JSON response with better error handling
      let recommendations;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        recommendations = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", content.substring(0, 200));
        throw new Error("Invalid JSON response from Groq API");
      }
      
      // Validate the structure
      if (!Array.isArray(recommendations)) {
        console.error("Response is not an array:", recommendations);
        throw new Error("Invalid response format - expected array");
      }

      // Add timestamps and ensure correct format
      const processedRecommendations = recommendations.map((job: any, index: number) => ({
        ...job,
        id: `ai-rec-${Date.now()}-${index}`,
        postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      }));

      return processedRecommendations;
    } catch (error) {
      console.error("Error generating job recommendations with Groq:", error);
      
      // Return empty array instead of fallback data
      return [];
    }
  }

  async generateCoverLetter(
    jobData: {
      title: string;
      company: string;
      description?: string;
    },
    userProfile: any,
    user?: any
  ): Promise<string> {
    const prompt = `Generate a professional cover letter for this job application:

JOB: ${jobData.title} at ${jobData.company}
${jobData.description ? `DESCRIPTION: ${jobData.description}` : ''}

CANDIDATE: ${userProfile?.fullName || userProfile?.firstName + ' ' + userProfile?.lastName || 'Candidate'}
TITLE: ${userProfile?.professionalTitle || 'Professional'}
EXPERIENCE: ${userProfile?.yearsExperience || '0'} years

Write a compelling, personalized cover letter that:
1. Shows enthusiasm for the specific role and company
2. Highlights relevant experience and skills
3. Demonstrates value proposition
4. Uses professional but engaging tone
5. Is 3-4 paragraphs, around 300-400 words

Return only the cover letter text, no additional formatting or explanations.`;

    try {
      if (this.developmentMode) {
        return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobData.title} position at ${jobData.company}. With my background in professional development and passion for innovation, I am excited about the opportunity to contribute to your team.

My experience has equipped me with the skills necessary to excel in this role. I am particularly drawn to ${jobData.company} because of its reputation for excellence and commitment to growth. I believe my dedication and enthusiasm would make me a valuable addition to your organization.

I would welcome the opportunity to discuss how my background and skills can benefit your team. Thank you for considering my application.

Sincerely,
${userProfile?.fullName || 'Your Name'}`;
      }

      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional career advisor. Write compelling, personalized cover letters that highlight the candidate's strengths and show genuine interest in the role and company."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: this.getModel(user),
          temperature: 0.3,
          max_tokens: 600,
        });
      });

      const coverLetter = completion.choices[0]?.message?.content?.trim();
      if (!coverLetter) {
        throw new Error("No cover letter generated");
      }

      return coverLetter;
    } catch (error) {
      console.error("Cover letter generation error:", error);
      // Return a basic fallback cover letter
      return `Dear Hiring Manager,

I am writing to express my interest in the ${jobData.title} position at ${jobData.company}. With my professional background and enthusiasm for this opportunity, I am confident I would be a valuable addition to your team.

My experience has prepared me well for this role, and I am particularly excited about the opportunity to contribute to ${jobData.company}'s continued success. I would welcome the chance to discuss how my skills and passion can benefit your organization.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${userProfile?.fullName || 'Your Name'}`;
    }
  }
  
  async improveJobDescription(
    jobDescription: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<string> {
    if (this.developmentMode) {
      // Return improved version with basic enhancements in development mode
      return `${jobDescription}

Key Responsibilities:
• Lead and execute core project initiatives
• Collaborate with cross-functional teams
• Drive results and deliver measurable outcomes

Requirements:
• Proven experience in relevant field
• Strong communication and analytical skills
• Ability to work in fast-paced environment

What We Offer:
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and inclusive work culture`;
    }

    // Ultra-concise prompt to minimize token usage
    const prompt = `Improve this job description. Make it more engaging, structured, and professional. Keep the same length, just enhance clarity and appeal:

${jobTitle ? `Job: ${jobTitle}` : ''}${companyName ? ` at ${companyName}` : ''}

${jobDescription}

Return only the improved job description, no explanations.`;

    try {
      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert HR professional. Improve job descriptions to be more engaging and professional. Return only the improved text, no additional commentary."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.1-8b-instant", // Use faster, cheaper model for simple text improvement
          temperature: 0.2,
          max_tokens: Math.min(jobDescription.length + 200, 800), // Limit tokens based on input length
        });
      });

      const improvedDescription = completion.choices[0]?.message?.content?.trim();
      if (!improvedDescription) {
        throw new Error("No improved description generated");
      }

      return improvedDescription;
    } catch (error) {
      console.error("Job description improvement error:", error);
      // Return original with minor formatting improvements as fallback
      return jobDescription.split('\n\n').map(paragraph => 
        paragraph.trim()
      ).join('\n\n') + '\n\n• Competitive compensation package\n• Growth and development opportunities\n• Collaborative team environment';
    }
  }

  async generateContent(prompt: string, user?: any): Promise<string> {
    if (this.developmentMode) {
      return "AI analysis temporarily unavailable - please check back later.";
    }

    try {
      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant that provides accurate and detailed responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: this.getModel(user),
          temperature: 0.3,
          max_tokens: 1000,
        });
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new Error("No response generated");
      }

      return response;
    } catch (error) {
      console.error("Content generation error:", error);
      return "AI analysis temporarily unavailable - please try again later.";
    }
  }
}

export const groqService = new GroqService();
export type { ResumeAnalysis, JobMatchAnalysis };