// Use dynamic import for pdf-parse to handle module issues
let pdfParse: any = null;

export interface ParsedResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  professionalTitle?: string;
  yearsExperience?: number;
  summary?: string;
  skills?: string[];
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
  }[];
  workExperience?: {
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }[];
  linkedinUrl?: string;
  city?: string;
  state?: string;
}

export class ResumeParser {
  /**
   * Parse PDF resume and extract structured data using free NLP techniques
   */
  async parseResumeFile(fileBuffer: Buffer, mimeType: string): Promise<ParsedResumeData> {
    let text = '';
    
    try {
      if (mimeType === 'application/pdf') {
        try {
          // Dynamic import to handle module loading issues
          if (!pdfParse) {
            pdfParse = (await import('pdf-parse')).default;
          }
          const pdfData = await pdfParse(fileBuffer);
          text = pdfData.text;
        } catch (pdfError) {
          console.warn('PDF parsing failed, using basic text extraction:', pdfError.message);
          // Fallback: Try basic text extraction
          text = fileBuffer.toString('utf-8');
        }
      } else {
        // For non-PDF files, convert buffer to text (basic support)
        text = fileBuffer.toString('utf-8');
      }
      
      return this.extractDataFromText(text);
    } catch (error) {
      console.error('Error parsing resume:', error);
      return {};
    }
  }

  /**
   * Extract structured data from resume text using regex patterns and NLP techniques
   */
  private extractDataFromText(text: string): ParsedResumeData {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      fullName: this.extractFullName(cleanText, lines),
      email: this.extractEmail(cleanText),
      phone: this.extractPhone(cleanText),
      professionalTitle: this.extractProfessionalTitle(cleanText, lines),
      yearsExperience: this.extractYearsExperience(cleanText),
      summary: this.extractSummary(cleanText, lines),
      skills: this.extractSkills(cleanText, lines),
      education: this.extractEducation(cleanText, lines),
      workExperience: this.extractWorkExperience(cleanText, lines),
      linkedinUrl: this.extractLinkedIn(cleanText),
      city: this.extractCity(cleanText),
      state: this.extractState(cleanText)
    };
  }

  private extractFullName(text: string, lines: string[]): string | undefined {
    // Look for name patterns at the beginning of the resume
    const namePatterns = [
      // Full name at the start of the first few lines
      /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
      // Name after common prefixes
      /(?:Name|NOMBRE|名前)[:：]\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    ];

    // Check first 3 lines for name patterns
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length < 50) {
          return match[1].trim();
        }
      }
    }

    // Fallback: look for capitalized words at the beginning
    const firstLine = lines[0] || '';
    const capitalizedWords = firstLine.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/);
    if (capitalizedWords && capitalizedWords[0].length < 50) {
      return capitalizedWords[0];
    }

    return undefined;
  }

  private extractEmail(text: string): string | undefined {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailPattern);
    return matches ? matches[0] : undefined;
  }

  private extractPhone(text: string): string | undefined {
    const phonePatterns = [
      /\+?1?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
      /\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
      /(\d{3})[-.\s](\d{3})[-.\s](\d{4})/
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    return undefined;
  }

  private extractProfessionalTitle(text: string, lines: string[]): string | undefined {
    const titleKeywords = [
      'engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist',
      'director', 'coordinator', 'administrator', 'designer', 'architect',
      'scientist', 'researcher', 'technician', 'supervisor', 'lead', 'senior',
      'junior', 'associate', 'principal', 'chief', 'head'
    ];

    // Look in first few lines for title patterns
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      for (const keyword of titleKeywords) {
        if (line.includes(keyword) && line.length < 100) {
          return lines[i];
        }
      }
    }

    // Look for title patterns in text
    const titlePatterns = [
      /(?:^|\n)([A-Z][a-z]+ (?:Engineer|Developer|Manager|Analyst|Designer|Architect|Scientist))/i,
      /(?:Position|Title|Role)[:：]\s*([A-Z][a-z ]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length < 100) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractYearsExperience(text: string): number | undefined {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\+?\s*years?\s*in/i,
      /experience[:：]\s*(\d+)\+?\s*years?/i
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const years = parseInt(match[1]);
        if (years >= 0 && years <= 50) {
          return years;
        }
      }
    }
    return undefined;
  }

  private extractSummary(text: string, lines: string[]): string | undefined {
    const summaryKeywords = ['summary', 'profile', 'about', 'overview', 'objective'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      for (const keyword of summaryKeywords) {
        if (line.includes(keyword) && line.length < 50) {
          // Look for the next few lines as summary content
          const summaryLines = [];
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j] && lines[j].length > 20 && !this.isHeaderLine(lines[j])) {
              summaryLines.push(lines[j]);
            } else if (summaryLines.length > 0) {
              break;
            }
          }
          if (summaryLines.length > 0) {
            return summaryLines.join(' ').substring(0, 500);
          }
        }
      }
    }
    return undefined;
  }

  private extractSkills(text: string, lines: string[]): string[] {
    const skills: string[] = [];
    const skillKeywords = ['skills', 'technologies', 'expertise', 'competencies'];
    
    // Common technical skills
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql',
      'aws', 'docker', 'kubernetes', 'git', 'typescript', 'angular', 'vue',
      'mongodb', 'postgresql', 'mysql', 'redis', 'linux', 'windows', 'macos',
      'project management', 'leadership', 'communication', 'problem solving',
      'teamwork', 'analytical thinking', 'strategic planning'
    ];

    // Find skills section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      for (const keyword of skillKeywords) {
        if (line.includes(keyword)) {
          // Extract skills from next few lines
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            if (this.isHeaderLine(lines[j])) break;
            
            const skillsLine = lines[j].toLowerCase();
            for (const skill of commonSkills) {
              if (skillsLine.includes(skill) && !skills.includes(skill)) {
                skills.push(skill);
              }
            }
          }
          break;
        }
      }
    }

    // Also scan entire text for common skills
    const textLower = text.toLowerCase();
    for (const skill of commonSkills) {
      if (textLower.includes(skill) && !skills.includes(skill)) {
        skills.push(skill);
      }
    }

    return skills.slice(0, 10); // Limit to top 10 skills
  }

  private extractEducation(text: string, lines: string[]): any[] {
    const education: any[] = [];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'diploma', 'certificate'];
    const educationKeywords = ['education', 'academic', 'university', 'college', 'school'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if this line contains education keywords
      const hasEducationKeyword = educationKeywords.some(keyword => line.includes(keyword));
      const hasDegreeKeyword = degreeKeywords.some(keyword => line.includes(keyword));
      
      if (hasEducationKeyword || hasDegreeKeyword) {
        // Extract education information from this and next few lines
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const eduLine = lines[j];
          if (this.isHeaderLine(eduLine) && j > i) break;
          
          const degree = degreeKeywords.find(d => eduLine.toLowerCase().includes(d));
          if (degree && eduLine.length < 200) {
            education.push({
              degree: degree.charAt(0).toUpperCase() + degree.slice(1),
              institution: this.extractInstitution(eduLine),
              year: this.extractYear(eduLine)
            });
          }
        }
      }
    }

    return education.slice(0, 3); // Limit to 3 education entries
  }

  private extractWorkExperience(text: string, lines: string[]): any[] {
    const experience: any[] = [];
    const experienceKeywords = ['experience', 'employment', 'work history', 'career'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        // Look for job entries in the following lines
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (this.isHeaderLine(lines[j]) && j > i + 5) break;
          
          const jobLine = lines[j];
          if (this.looksLikeJobTitle(jobLine)) {
            experience.push({
              title: jobLine,
              company: this.extractCompany(lines[j + 1] || ''),
              duration: this.extractDuration(jobLine + ' ' + (lines[j + 1] || '')),
              description: this.extractJobDescription(lines, j + 2)
            });
          }
        }
      }
    }

    return experience.slice(0, 5); // Limit to 5 work experiences
  }

  private extractLinkedIn(text: string): string | undefined {
    const linkedinPattern = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
    const match = text.match(linkedinPattern);
    return match ? match[0] : undefined;
  }

  private extractCity(text: string): string | undefined {
    // Look for city patterns near address or contact information
    const cityPatterns = [
      /(?:City|Location|Address)[:：]\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
      /([A-Z][a-z]+),\s*[A-Z]{2}/  // City, State pattern
    ];

    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length < 50) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractState(text: string): string | undefined {
    // Look for state patterns
    const statePattern = /,\s*([A-Z]{2})(?:\s|$)/;
    const match = text.match(statePattern);
    return match ? match[1] : undefined;
  }

  // Helper methods
  private isHeaderLine(line: string): boolean {
    return line.length < 50 && 
           (line.toUpperCase() === line || 
            ['EDUCATION', 'EXPERIENCE', 'SKILLS', 'SUMMARY', 'PROFILE'].some(header => 
              line.toUpperCase().includes(header)));
  }

  private looksLikeJobTitle(line: string): boolean {
    const titleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'designer', 'architect'];
    return titleKeywords.some(keyword => line.toLowerCase().includes(keyword)) && line.length < 100;
  }

  private extractInstitution(line: string): string | undefined {
    const institutionKeywords = ['university', 'college', 'institute', 'school'];
    for (const keyword of institutionKeywords) {
      if (line.toLowerCase().includes(keyword)) {
        return line.trim();
      }
    }
    return undefined;
  }

  private extractYear(line: string): string | undefined {
    const yearPattern = /(19|20)\d{2}/;
    const match = line.match(yearPattern);
    return match ? match[0] : undefined;
  }

  private extractCompany(line: string): string | undefined {
    if (line && line.length < 100 && line.length > 2) {
      return line.trim();
    }
    return undefined;
  }

  private extractDuration(text: string): string | undefined {
    const durationPatterns = [
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/i,
      /(\w+ \d{4})\s*[-–]\s*(\w+ \d{4}|present|current)/i
    ];

    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  private extractJobDescription(lines: string[], startIndex: number): string | undefined {
    const descriptionLines = [];
    for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
      if (lines[i] && !this.isHeaderLine(lines[i]) && !this.looksLikeJobTitle(lines[i])) {
        descriptionLines.push(lines[i]);
      } else if (descriptionLines.length > 0) {
        break;
      }
    }
    return descriptionLines.length > 0 ? descriptionLines.join(' ').substring(0, 300) : undefined;
  }
}