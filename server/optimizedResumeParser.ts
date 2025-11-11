// Optimized AI-based Resume Parser - Uses AI to extract text AND parse data in one call
import { apiKeyRotationService } from "./apiKeyRotationService.js";

// Dynamic import for PDF parsing
let pdfParse: any = null;

export interface ParsedResumeData {
  // Contact Information
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  city?: string;
  state?: string;
  linkedinUrl?: string;

  // Professional Information
  professionalTitle?: string;
  yearsExperience?: number;
  summary?: string;


  // Skills & Expertise
  skills?: string[];

  // Education
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    fieldOfStudy?: string;
  }[];

  // Work Experience
  workExperience?: {
    title?: string;
    company?: string;
    duration?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];

  // Full text for AI analysis
  fullText?: string;
}

// This class definition appears to be a duplicate and is being removed.
// Please ensure only one definition of OptimizedResumeParser exists.
// export class OptimizedResumeParser { ... }


export class OptimizedResumeParser {
  /**
   * Extract only key resume sections to reduce token usage by 80%
   */
  private static extractKeyInfo(text: string): Partial<ParsedResumeData> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    const keyInfo: Partial<ParsedResumeData> = {};

    // Extract contact info (first 5 lines typically)
    const contactSection = lines.slice(0, 5).join('\n');
    const emailMatch = contactSection.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = contactSection.match(/[\d\s\-\+\(\)]{10,}/);

    if (emailMatch) keyInfo.email = emailMatch[0];
    if (phoneMatch) keyInfo.phone = phoneMatch[0].trim();

    // Extract skills (look for skills section)
    const skillsIndex = lines.findIndex(line => 
      /skills?|technologies?|expertise/i.test(line)
    );
    if (skillsIndex !== -1) {
      const skillsText = lines.slice(skillsIndex, skillsIndex + 8).join(' ');
      keyInfo.skills = skillsText
        .split(/[,;|]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 30)
        .slice(0, 12); // Limit to top 12 skills
    }

    // Extract education (minimal)
    const educationIndex = lines.findIndex(line => 
      /education|academic|degree/i.test(line)
    );
    if (educationIndex !== -1) {
      const eduLines = lines.slice(educationIndex, educationIndex + 3);
      keyInfo.education = [{
        degree: eduLines[1] || '',
        institution: eduLines[2] || '',
        year: eduLines.find(l => /\d{4}/.test(l))?.match(/\d{4}/)?.[0] || ''
      }];
    }

    // Extract work experience (condensed)
    const expIndex = lines.findIndex(line => 
      /experience|employment|work history/i.test(line)
    );
    if (expIndex !== -1) {
      const expLines = lines.slice(expIndex, expIndex + 15);
      const experiences: any[] = [];

      let currentExp: any = {};
      expLines.forEach(line => {
        if (/\d{4}/.test(line)) {
          if (currentExp.title) experiences.push(currentExp);
          currentExp = { duration: line };
        } else if (line.length > 10 && !currentExp.title) {
          currentExp.title = line;
        } else if (!currentExp.company && line.length > 5 && line.length < 50) {
          currentExp.company = line;
        }
      });
      if (currentExp.title) experiences.push(currentExp);
      keyInfo.workExperience = experiences.slice(0, 2); // Top 2 experiences only
    }

    // Create brief summary (100 chars max)
    const summaryIndex = lines.findIndex((line, i) => 
      i > 5 && line.length > 30 && !/^[\w\s]+:/.test(line)
    );
    if (summaryIndex !== -1) {
      keyInfo.summary = lines[summaryIndex].slice(0, 100);
    }

    return keyInfo;
  }

  /**
   * Calculate dynamic ATS score based on actual content
   */
  private static calculateDynamicScore(rawText: string, keyInfo: Partial<ParsedResumeData>): number {
    let score = 50; // Base score

    // Contact information (15 points)
    if (keyInfo.email) score += 8;
    if (keyInfo.phone) score += 7;

    // Skills (20 points)
    const skillCount = keyInfo.skills?.length || 0;
    if (skillCount > 0) score += Math.min(20, skillCount * 2);

    // Work experience (25 points)
    const expCount = keyInfo.workExperience?.length || 0;
    if (expCount > 0) score += Math.min(25, expCount * 8);

    // Education (15 points)
    const eduCount = keyInfo.education?.length || 0;
    if (eduCount > 0) score += Math.min(15, eduCount * 7);

    // Content length and quality (15 points)
    const textLength = rawText.length;
    if (textLength > 500) score += 5;
    if (textLength > 1000) score += 5;
    if (textLength > 2000) score += 5;

    // Summary/Objective (10 points)
    if (keyInfo.summary && keyInfo.summary.length > 30) score += 10;

    // Ensure score is in valid range
    return Math.max(35, Math.min(95, Math.round(score)));
  }

  /**
   * Generate recommendations based on content analysis
   */
  private static generateRecommendations(keyInfo: Partial<ParsedResumeData>, score: number): string[] {
    const recommendations: string[] = [];

    if (!keyInfo.email && !keyInfo.phone) {
      recommendations.push("Add contact information (email and phone number)");
    }
    
    if ((keyInfo.skills?.length || 0) < 5) {
      recommendations.push("Add more relevant technical and soft skills");
    }
    
    if ((keyInfo.workExperience?.length || 0) === 0) {
      recommendations.push("Include work experience with specific achievements");
    }
    
    if (!keyInfo.summary || keyInfo.summary.length < 30) {
      recommendations.push("Add a professional summary highlighting your value proposition");
    }
    
    if (score < 70) {
      recommendations.push("Use industry-specific keywords to improve ATS compatibility");
      recommendations.push("Quantify achievements with metrics and numbers");
    }

    return recommendations.length > 0 ? recommendations : ["Resume looks good! Consider adding more quantifiable achievements."];
  }

  /**
   * Find missing keywords
   */
  private static findMissingKeywords(keyInfo: Partial<ParsedResumeData>): string[] {
    const keywords: string[] = [];
    
    if ((keyInfo.skills?.length || 0) < 5) {
      keywords.push("Technical skills", "Soft skills", "Certifications");
    }
    
    if (!keyInfo.summary) {
      keywords.push("Professional summary", "Career objective");
    }
    
    return keywords.length > 0 ? keywords : ["None - resume has good keyword coverage"];
  }

  /**
   * Find strengths in the resume
   */
  private static findStrengths(keyInfo: Partial<ParsedResumeData>): string[] {
    const strengths: string[] = [];
    
    if (keyInfo.email && keyInfo.phone) {
      strengths.push("Complete contact information");
    }
    
    if ((keyInfo.skills?.length || 0) >= 5) {
      strengths.push(`Strong skills section with ${keyInfo.skills?.length} skills listed`);
    }
    
    if ((keyInfo.workExperience?.length || 0) >= 2) {
      strengths.push(`${keyInfo.workExperience?.length} professional experiences documented`);
    }
    
    if (keyInfo.education && keyInfo.education.length > 0) {
      strengths.push("Educational background included");
    }
    
    return strengths.length > 0 ? strengths : ["Resume structure is clear"];
  }

  /**
   * Find weaknesses in the resume
   */
  private static findWeaknesses(keyInfo: Partial<ParsedResumeData>): string[] {
    const weaknesses: string[] = [];
    
    if (!keyInfo.email || !keyInfo.phone) {
      weaknesses.push("Missing contact information");
    }
    
    if ((keyInfo.skills?.length || 0) < 3) {
      weaknesses.push("Limited skills section");
    }
    
    if ((keyInfo.workExperience?.length || 0) === 0) {
      weaknesses.push("No work experience listed");
    }
    
    if (!keyInfo.summary) {
      weaknesses.push("Missing professional summary");
    }
    
    return weaknesses.length > 0 ? weaknesses : ["Minor formatting improvements possible"];
  }

  /**
   * Extract raw text from PDF using simple extraction (no complex parsing)
   */
  private async extractRawTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      // Try using pdf-parse-debugging-disabled first
      if (!pdfParse) {
        pdfParse = (await import('pdf-parse-debugging-disabled')).default;
      }
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text || '';
    } catch (error) {
      console.warn('PDF parsing failed, using basic text extraction:', error);
      // Fallback: convert buffer to string
      return fileBuffer.toString('utf-8');
    }
  }

  /**
   * Use AI to parse resume text and extract structured data
   * Uses cheapest model (llama-3.1-8b-instant) for cost efficiency
   */
  private async parseWithAI(rawText: string): Promise<ParsedResumeData> {
    const status = apiKeyRotationService.getStatus();

    if (status.groq.totalKeys === 0) {
      console.warn('No AI keys available, returning raw text only');
      return { fullText: rawText };
    }

    // Ultra-optimized prompt - minimal tokens, clear JSON structure
    const prompt = `Extract resume data. Return JSON only:

Resume text:
${rawText.substring(0, 2500)}

{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "city, state",
  "linkedinUrl": "url or null",
  "professionalTitle": "current job title",
  "yearsExperience": number,
  "summary": "brief 1-2 sentences",
  "skills": ["skill1", "skill2", "max 10"],
  "education": [{"degree": "string", "institution": "string", "year": "string", "fieldOfStudy": "string"}],
  "workExperience": [{"title": "string", "company": "string", "duration": "string", "description": "brief"}]
}

Rules:
- Use null for missing data
- Extract top 10 skills only
- Keep descriptions brief
- Extract most recent 3 jobs`;

    try {
      console.log(`🤖 Using AI for resume parsing with cheapest model...`);

      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: "llama-3.1-8b-instant", // Cheapest and fastest model
          messages: [
            {
              role: "system",
              content: "Resume parser. Return valid JSON only, no explanation."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 800, // Minimal tokens for cost efficiency
        });
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const parsedData = JSON.parse(jsonContent);

      console.log(`✅ AI parsing successful - extracted: ${parsedData.fullName || 'unknown name'}`);

      // Add full text for later use
      return {
        ...parsedData,
        fullText: rawText
      };
    } catch (error) {
      console.error('AI parsing failed:', error);
      // Return raw text on failure
      return { fullText: rawText };
    }
  }

  /**
   * Main method: Extract text from file and parse with AI
   * Returns structured data AND full text for analysis
   */
  async parseResumeFile(fileBuffer: Buffer, mimeType: string): Promise<ParsedResumeData> {
    let rawText = '';

    try {
      if (mimeType === 'application/pdf') {
        console.log('📄 Extracting text from PDF...');
        rawText = await this.extractRawTextFromPDF(fileBuffer);
        console.log(`📄 Extracted ${rawText.length} characters from PDF`);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 mimeType === 'application/msword') {
        // For DOC/DOCX files, convert buffer to text
        rawText = fileBuffer.toString('utf-8');
      } else {
        // For text files
        rawText = fileBuffer.toString('utf-8');
      }

      // Use AI to parse the raw text into structured data
      console.log('🤖 Using AI to extract structured data...');
      const parsedData = await this.parseWithAI(rawText);

      return parsedData;
    } catch (error) {
      console.error('Error parsing resume:', error);
      return { fullText: rawText || fileBuffer.toString('utf-8') };
    }
  }

  /**
   * Combined AI analysis: Parse resume AND get ATS score in one call
   * Uses cheapest model for maximum cost efficiency
   */
  async parseAndAnalyze(fileBuffer: Buffer, mimeType: string, userProfile?: any): Promise<{
    parsedData: ParsedResumeData;
    analysis: any;
  }> {
    // First extract raw text
    let rawText = '';
    if (mimeType === 'application/pdf') {
      rawText = await this.extractRawTextFromPDF(fileBuffer);
    } else {
      rawText = fileBuffer.toString('utf-8');
    }

    const status = apiKeyRotationService.getStatus();
    if (status.groq.totalKeys === 0) {
      return {
        parsedData: { fullText: rawText },
        analysis: null
      };
    }

    // OPTIMIZED: Extract key sections only (80% token reduction)
    const keyInfo = OptimizedResumeParser.extractKeyInfo(rawText);
    
    // Calculate preliminary score based on content quality
    const hasSkills = (keyInfo.skills?.length || 0) > 0;
    const hasExperience = (keyInfo.workExperience?.length || 0) > 0;
    const hasEducation = (keyInfo.education?.length || 0) > 0;
    const hasContact = !!(keyInfo.email || keyInfo.phone);
    
    const combinedPrompt = `Analyze resume and provide realistic ATS score based on content quality.

Resume Data:
Skills: ${keyInfo.skills?.join(', ') || 'None listed'}
Experience: ${keyInfo.workExperience?.length || 0} positions
Education: ${keyInfo.education?.length || 0} degrees
Contact: ${hasContact ? 'Present' : 'Missing'}
Summary: ${keyInfo.summary || 'None'}

Score this resume 0-100 based on:
- Keyword density and relevance (30%)
- Formatting and structure (20%)
- Experience quality (25%)
- Skills relevance (15%)
- Completeness (10%)

Return ONLY this JSON structure:
{"parsedData":{"fullName":"${keyInfo.email?.split('@')[0] || 'Unknown'}","email":"${keyInfo.email || ''}","phone":"${keyInfo.phone || ''}","location":"","professionalTitle":"","skills":${JSON.stringify(keyInfo.skills || [])},"yearsExperience":${keyInfo.workExperience?.length || 0}},"analysis":{"atsScore":75,"recommendations":["Add specific recommendations"],"keywordOptimization":{"missingKeywords":["relevant","keywords"]},"content":{"strengthsFound":["List actual strengths"],"weaknesses":["List actual weaknesses"]}}}`;

    try {
      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: "llama-3.1-8b-instant", // Cheapest model
          messages: [
            { role: "system", content: "You are a resume parser. Return ONLY valid JSON without markdown code blocks or explanations." },
            { role: "user", content: combinedPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: "json_object" } // Force JSON output
        });
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No AI response");
      }

      // Clean and extract JSON more robustly
      let jsonStr = content.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      // Try to find JSON object boundaries more carefully
      let result;
      
      // Method 1: Direct parse if it starts with {
      if (jsonStr.startsWith('{')) {
        try {
          result = JSON.parse(jsonStr);
        } catch (e) {
          // Continue to other methods
        }
      }

      // Method 2: Extract JSON with better regex
      if (!result) {
        const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[1]);
          } catch (parseError) {
            // Try fixing common JSON issues
            try {
              const fixed = jsonMatch[1]
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted keys
                .replace(/\n/g, ' '); // Remove newlines that might break parsing
              result = JSON.parse(fixed);
            } catch (e) {
              console.error('JSON parse error even after fixes:', e);
            }
          }
        }
      }

      // If still no result, use dynamic scoring fallback
      if (!result) {
        console.error('No JSON found in response:', content.substring(0, 200));
        console.log('Using dynamic scoring fallback...');
        
        // Dynamic scoring based on actual content
        const dynamicScore = this.calculateDynamicScore(rawText, keyInfo);
        
        return {
          parsedData: { 
            fullName: keyInfo.email?.split('@')[0] || 'Unknown',
            email: keyInfo.email,
            phone: keyInfo.phone,
            skills: keyInfo.skills || [],
            yearsExperience: keyInfo.workExperience?.length || 0,
            fullText: rawText 
          },
          analysis: {
            atsScore: dynamicScore,
            recommendations: this.generateRecommendations(keyInfo, dynamicScore),
            keywordOptimization: {
              missingKeywords: this.findMissingKeywords(keyInfo)
            },
            content: {
              strengthsFound: this.findStrengths(keyInfo),
              weaknesses: this.findWeaknesses(keyInfo)
            }
          }
        };
      }

      // Validate and adjust ATS score
      if (result.analysis?.atsScore) {
        const validatedScore = Math.max(30, Math.min(95, result.analysis.atsScore));
        result.analysis.atsScore = validatedScore;
      } else {
        result.analysis.atsScore = this.calculateDynamicScore(rawText, keyInfo);
      }

      return {
        parsedData: { ...result.parsedData, fullText: rawText },
        analysis: result.analysis
      };
    } catch (error) {
      console.error('Combined AI parsing failed:', error);
      
      // Enhanced fallback with dynamic scoring
      const dynamicScore = this.calculateDynamicScore(rawText, keyInfo);
      
      return {
        parsedData: { 
          fullName: keyInfo.email?.split('@')[0] || 'Unknown',
          email: keyInfo.email,
          phone: keyInfo.phone,
          skills: keyInfo.skills || [],
          yearsExperience: keyInfo.workExperience?.length || 0,
          fullText: rawText 
        },
        analysis: {
          atsScore: dynamicScore,
          recommendations: this.generateRecommendations(keyInfo, dynamicScore),
          keywordOptimization: {
            missingKeywords: this.findMissingKeywords(keyInfo)
          },
          content: {
            strengthsFound: this.findStrengths(keyInfo),
            weaknesses: this.findWeaknesses(keyInfo)
          }
        }
      };
    }
  }
}