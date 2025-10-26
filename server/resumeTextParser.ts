/**
 * Resume Text Parser
 * Extracts structured data from resume text
 */

export interface ParsedResumeData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    bulletPoints: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationYear?: number;
    gpa?: string;
    achievements?: string[];
  }>;
  skills: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
  certifications?: string[];
  awards?: string[];
}

export class ResumeTextParser {
  
  /**
   * Parse resume text into structured data
   */
  parse(resumeText: string): ParsedResumeData {
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l);
    
    return {
      fullName: this.extractName(resumeText),
      email: this.extractEmail(resumeText),
      phone: this.extractPhone(resumeText),
      location: this.extractLocation(resumeText),
      linkedinUrl: this.extractLinkedIn(resumeText),
      githubUrl: this.extractGitHub(resumeText),
      portfolioUrl: this.extractPortfolio(resumeText),
      summary: this.extractSection(resumeText, ['CAREER OBJECTIVE', 'PROFESSIONAL SUMMARY', 'SUMMARY', 'OBJECTIVE']),
      experience: this.extractExperience(resumeText),
      education: this.extractEducation(resumeText),
      skills: this.extractSkills(resumeText),
      projects: this.extractProjects(resumeText),
      certifications: this.extractCertifications(resumeText),
      awards: []
    };
  }

  private extractName(text: string): string {
    const lines = text.split('\n');
    // Name is usually the first non-empty line or all caps at the top
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      if (trimmed && trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 3) {
        return trimmed;
      }
    }
    return 'Your Name';
  }

  private extractEmail(text: string): string {
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  private extractPhone(text: string): string {
    const phoneRegex = /(?:Mobile|Phone|Tel|Contact)?:?\s*(\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})/i;
    const match = text.match(phoneRegex);
    return match ? match[1].trim() : '';
  }

  private extractLocation(text: string): string {
    const locationRegex = /Location:?\s*([A-Za-z\s,]+(?:India|USA|UK|Canada|Australia|Singapore))/i;
    const match = text.match(locationRegex);
    return match ? match[1].trim() : '';
  }

  private extractLinkedIn(text: string): string {
    const linkedinRegex = /(?:LinkedIn|linkedin\.com)[:\s]*(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s\n]+)/i;
    const match = text.match(linkedinRegex);
    return match ? match[1].trim() : '';
  }

  private extractGitHub(text: string): string {
    const githubRegex = /(?:GitHub|github\.com)[:\s]*(https?:\/\/(?:www\.)?github\.com\/[^\s\n]+)/i;
    const match = text.match(githubRegex);
    return match ? match[1].trim() : '';
  }

  private extractPortfolio(text: string): string {
    const portfolioRegex = /(?:Portfolio|Website)[:\s]*(https?:\/\/[^\s\n]+)/i;
    const match = text.match(portfolioRegex);
    return match ? match[1].trim() : '';
  }

  private extractSection(text: string, headers: string[]): string {
    const lines = text.split('\n');
    let capturing = false;
    let content: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is one of our section headers
      if (headers.some(h => line.toUpperCase().includes(h))) {
        capturing = true;
        continue;
      }

      // Stop if we hit another major section
      if (capturing && this.isMajorSection(line)) {
        break;
      }

      if (capturing && line) {
        content.push(line);
      }
    }

    return content.join(' ').trim();
  }

  private extractExperience(text: string): any[] {
    const lines = text.split('\n');
    const experiences: any[] = [];
    let capturing = false;
    let currentExp: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start capturing at PROFESSIONAL EXPERIENCE or WORK EXPERIENCE
      if (line.toUpperCase().includes('PROFESSIONAL EXPERIENCE') || 
          line.toUpperCase().includes('WORK EXPERIENCE') ||
          (line.toUpperCase() === 'EXPERIENCE')) {
        capturing = true;
        continue;
      }

      // Stop at next major section
      if (capturing && this.isMajorSection(line) && 
          !line.toUpperCase().includes('EXPERIENCE')) {
        break;
      }

      if (!capturing) continue;

      // Detect job title (usually bold or standalone)
      // Skip if it's a bullet point, too short, or contains pipe (metadata line)
      if (line && !line.startsWith('•') && !line.startsWith('-') && 
          line.length > 3 && line.length < 100 && !line.includes('|')) {
        
        // Check if next line has metadata (company | location | dates)
        const nextLine = lines[i + 1]?.trim() || '';
        if (!nextLine || !nextLine.includes('|')) {
          // Skip this line - it's not a position title
          continue;
        }
        
        // If we have a current experience, save it
        if (currentExp && currentExp.position) {
          experiences.push(currentExp);
        }

        // This line is the position
        currentExp = {
          position: line,
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          bulletPoints: []
        };

        // Parse company/location/dates from next line
        i++; // Move to the next line
          
        // Parse: Company | Location | Dates
        // Or: Company, Location | Dates
        // Or: Company | Dates
        const parts = nextLine.split('|').map(p => p.trim());
        
        if (parts.length >= 1) {
          // First part is always company (may include location after comma)
          const companyPart = parts[0];
          const companyLocationMatch = companyPart.match(/^(.+?),\s*(.+)$/);
          if (companyLocationMatch) {
            currentExp.company = companyLocationMatch[1].trim();
            currentExp.location = companyLocationMatch[2].trim();
          } else {
            currentExp.company = companyPart;
          }
        }
        
        if (parts.length >= 2) {
          // Check if second part is location or dates
          const datePattern = /(\w{3,}\s+\d{4}|\d{4})/i;
          if (datePattern.test(parts[1])) {
            // Second part is dates
            const dateMatch = parts[1].match(/(.+?)\s*[-–—]\s*(.+)/);
            if (dateMatch) {
              currentExp.startDate = dateMatch[1].trim();
              currentExp.endDate = dateMatch[2].trim();
              currentExp.isCurrent = dateMatch[2].toLowerCase().includes('present');
            }
          } else {
            // Second part is location
            currentExp.location = parts[1];
            
            // Third part should be dates
            if (parts.length >= 3) {
              const dateMatch = parts[2].match(/(.+?)\s*[-–—]\s*(.+)/);
              if (dateMatch) {
                currentExp.startDate = dateMatch[1].trim();
                currentExp.endDate = dateMatch[2].trim();
                currentExp.isCurrent = dateMatch[2].toLowerCase().includes('present');
              }
            }
          }
        }
      }
      // Collect bullet points
      else if (currentExp && (line.startsWith('•') || line.startsWith('-'))) {
        const bullet = line.replace(/^[•\-]\s*/, '').trim();
        if (bullet) {
          currentExp.bulletPoints.push(bullet);
        }
      }
    }

    // Add last experience
    if (currentExp && currentExp.position) {
      experiences.push(currentExp);
    }

    return experiences;
  }

  private extractEducation(text: string): any[] {
    const lines = text.split('\n');
    const education: any[] = [];
    let capturing = false;
    let currentEdu: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start capturing at EDUCATION
      if (line.toUpperCase().includes('EDUCATION')) {
        capturing = true;
        continue;
      }

      // Stop at next major section
      if (capturing && this.isMajorSection(line) && 
          !line.toUpperCase().includes('EDUCATION')) {
        break;
      }

      if (!capturing) continue;

      // Detect degree (Bachelor, Master, B.Tech, etc.)
      const degreePattern = /(Bachelor|Master|B\.?Tech|M\.?Tech|B\.?S\.?|M\.?S\.?|PhD|Diploma)/i;
      if (degreePattern.test(line)) {
        if (currentEdu) {
          education.push(currentEdu);
        }

        currentEdu = {
          degree: line,
          institution: '',
          fieldOfStudy: '',
          graduationYear: undefined,
          gpa: '',
          achievements: []
        };

        // Check next line for institution
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine && !degreePattern.test(nextLine)) {
          i++;
          currentEdu.institution = nextLine;

          // Extract year from institution line or next line
          const yearMatch = nextLine.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            currentEdu.graduationYear = parseInt(yearMatch[0]);
          }
        }
      }
      // Look for GPA
      else if (line.toLowerCase().includes('gpa') || line.toLowerCase().includes('grade')) {
        if (currentEdu) {
          currentEdu.gpa = line;
        }
      }
    }

    // Add last education
    if (currentEdu) {
      education.push(currentEdu);
    }

    return education;
  }

  private extractSkills(text: string): string[] {
    const skillsSection = this.extractSection(text, [
      'TECHNICAL SKILLS',
      'SKILLS',
      'CORE COMPETENCIES',
      'TECHNOLOGIES'
    ]);

    if (!skillsSection) return [];

    // Split by common delimiters
    const skills: string[] = [];
    const delimiters = /[,•\-|]/g;
    const parts = skillsSection.split(delimiters);

    for (const part of parts) {
      const trimmed = part.trim();
      // Remove category labels like "Programming:" or "Languages:"
      const cleaned = trimmed.replace(/^[A-Za-z\s&]+:\s*/, '');
      
      if (cleaned && cleaned.length > 1 && cleaned.length < 50) {
        skills.push(cleaned);
      }
    }

    return skills;
  }

  private extractProjects(text: string): any[] {
    const lines = text.split('\n');
    const projects: any[] = [];
    let capturing = false;
    let currentProject: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start capturing at KEY PROJECTS or PROJECTS
      if (line.toUpperCase().includes('KEY PROJECTS') || 
          line.toUpperCase().includes('PROJECTS')) {
        capturing = true;
        continue;
      }

      // Stop at next major section
      if (capturing && this.isMajorSection(line) && 
          !line.toUpperCase().includes('PROJECT')) {
        break;
      }

      if (!capturing) continue;

      // Detect project name (usually standalone line before description)
      if (line && !line.startsWith('•') && !line.toLowerCase().startsWith('tech') && 
          line.length > 5 && line.length < 100) {
        
        if (currentProject && currentProject.name) {
          projects.push(currentProject);
        }

        currentProject = {
          name: line,
          description: '',
          technologies: []
        };
      }
      // Extract tech stack
      else if (currentProject && line.toLowerCase().includes('tech')) {
        const techMatch = line.match(/Tech\s*Stack:?\s*(.+)/i);
        if (techMatch) {
          currentProject.technologies = techMatch[1].split(/[,•]/).map((t: string) => t.trim()).filter(Boolean);
        }
      }
      // Collect description
      else if (currentProject && line && !line.toLowerCase().includes('tech')) {
        currentProject.description += (currentProject.description ? ' ' : '') + line;
      }
    }

    // Add last project
    if (currentProject && currentProject.name) {
      projects.push(currentProject);
    }

    return projects;
  }

  private extractCertifications(text: string): string[] {
    const lines = text.split('\n');
    const certifications: string[] = [];
    let capturing = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Start capturing at CERTIFICATIONS
      if (trimmed.toUpperCase().includes('CERTIFICATION')) {
        capturing = true;
        continue;
      }

      // Stop at next major section
      if (capturing && this.isMajorSection(trimmed) && 
          !trimmed.toUpperCase().includes('CERTIFICATION')) {
        break;
      }

      if (capturing && trimmed && (trimmed.startsWith('•') || trimmed.startsWith('-') || !this.isMajorSection(trimmed))) {
        const cert = trimmed.replace(/^[•\-]\s*/, '').trim();
        if (cert) {
          certifications.push(cert);
        }
      }
    }

    return certifications;
  }

  private isMajorSection(line: string): boolean {
    const majorSections = [
      'EDUCATION',
      'EXPERIENCE',
      'PROFESSIONAL EXPERIENCE',
      'WORK EXPERIENCE',
      'SKILLS',
      'TECHNICAL SKILLS',
      'PROJECTS',
      'KEY PROJECTS',
      'CERTIFICATIONS',
      'AWARDS',
      'PUBLICATIONS',
      'LANGUAGES',
      'ADDITIONAL INFORMATION',
      'CAREER OBJECTIVE',
      'PROFESSIONAL SUMMARY'
    ];

    const upper = line.toUpperCase().trim();
    return majorSections.some(section => upper === section || upper.startsWith(section));
  }
}

export const resumeTextParser = new ResumeTextParser();
