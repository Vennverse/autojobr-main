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

export class OptimizedResumeParser {
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

    // MEGA OPTIMIZED: Single AI call does BOTH parsing AND analysis
    const combinedPrompt = `Extract resume data AND analyze. Return JSON only:

${rawText.substring(0, 2000)}

{
  "parsedData": {
    "fullName": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "professionalTitle": "string",
    "skills": ["top 10"],
    "yearsExperience": number,
    "education": [{"degree": "str", "institution": "str", "year": "str"}],
    "workExperience": [{"title": "str", "company": "str", "duration": "str"}]
  },
  "analysis": {
    "atsScore": number (20-95),
    "recommendations": ["3 key fixes"],
    "keywordOptimization": {"missingKeywords": ["top 5"], "overusedKeywords": ["top 2"]},
    "formatting": {"score": number, "issues": ["top 3"]},
    "content": {"strengthsFound": ["top 3"], "weaknesses": ["top 3"]}
  }
}`;

    try {
      const completion = await apiKeyRotationService.executeWithGroqRotation(async (client) => {
        return await client.chat.completions.create({
          model: "llama-3.1-8b-instant", // Cheapest model
          messages: [
            { role: "system", content: "Resume parser + ATS analyzer. JSON only." },
            { role: "user", content: combinedPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000,
        });
      });

      const content = completion.choices[0]?.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : content || '{}');

      return {
        parsedData: { ...result.parsedData, fullText: rawText },
        analysis: result.analysis
      };
    } catch (error) {
      console.error('Combined AI parsing failed:', error);
      // Fallback to basic parsing
      const basicParsed = await this.parseWithAI(rawText);
      return {
        parsedData: basicParsed,
        analysis: null
      };
    }
  }
}
