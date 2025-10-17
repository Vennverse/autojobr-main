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

    // Create brief summary (50 chars max)
    const summaryIndex = lines.findIndex((line, i) => 
      i > 5 && line.length > 30 && !/^[\w\s]+:/.test(line)
    );
    if (summaryIndex !== -1) {
      keyInfo.summary = lines[summaryIndex].slice(0, 100); // Reduced to 100 chars
    }

    return keyInfo;
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
    const keyInfo = this.extractKeyInfo(rawText);
    const combinedPrompt = `Parse & score resume (JSON only):

${JSON.stringify(keyInfo)}

{"parsedData":{"fullName":"","email":"","phone":"","location":"","professionalTitle":"","skills":[],"yearsExperience":0},"analysis":{"atsScore":70,"recommendations":["tip1","tip2"],"keywordOptimization":{"missingKeywords":["kw1"]},"content":{"strengthsFound":["s1"],"weaknesses":["w1"]}}}`;

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
      if (!content) {
        throw new Error("No AI response");
      }

      // Clean and extract JSON more robustly
      let jsonStr = content.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', content.substring(0, 200));
        throw new Error("Invalid JSON response");
      }

      // Parse with error recovery
      let result;
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Try fixing common JSON issues
        const fixed = jsonMatch[0]
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Fix unquoted keys
        result = JSON.parse(fixed);
      }

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