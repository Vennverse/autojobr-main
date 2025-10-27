
/**
 * Enhanced Resume Text Parser
 * Multi-pass parsing with confidence scoring, fuzzy matching, and flexible pattern support
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
    achievements?: Array<{
      text: string;
      metrics?: { type: string; value: string }[];
      actionVerb?: string;
    }>;
    confidence?: number;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationYear?: number;
    gpa?: string;
    achievements?: string[];
    confidence?: number;
  }>;
  skills: {
    all: string[];
    technical?: string[];
    soft?: string[];
    categorized?: Record<string, string[]>;
    yearsExperience?: Record<string, number>;
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
    metrics?: string[];
  }>;
  certifications?: string[];
  awards?: string[];
  metadata?: {
    parsingConfidence: number;
    warnings: string[];
    resumeFormat?: 'chronological' | 'functional' | 'hybrid';
  };
}

export class ResumeTextParser {
  private warnings: string[] = [];
  
  private sectionPatterns = {
    experience: [
      /^(PROFESSIONAL\s+)?EXPERIENCE$/i,
      /^WORK\s+(EXPERIENCE|HISTORY)$/i,
      /^EMPLOYMENT(\s+HISTORY)?$/i,
      /^CAREER\s+HISTORY$/i,
      /^RELEVANT\s+EXPERIENCE$/i
    ],
    education: [
      /^EDUCATION(AL\s+BACKGROUND)?$/i,
      /^ACADEMIC\s+(BACKGROUND|QUALIFICATIONS?)$/i,
      /^QUALIFICATIONS?$/i,
      /^DEGREES?$/i
    ],
    skills: [
      /^(TECHNICAL\s+)?SKILLS?$/i,
      /^CORE\s+COMPETENC(Y|IES)$/i,
      /^TECHNOLOGIES?$/i,
      /^EXPERTISE$/i,
      /^SKILLS?\s+(AND\s+)?TECHNOLOGIES?$/i,
      /^PROFICIENC(Y|IES)$/i
    ],
    projects: [
      /^(KEY\s+)?PROJECTS?$/i,
      /^PORTFOLIO$/i,
      /^SELECTED\s+PROJECTS?$/i,
      /^PERSONAL\s+PROJECTS?$/i
    ],
    certifications: [
      /^CERTIFICATIONS?$/i,
      /^LICENSES?\s+(AND\s+)?CERTIFICATIONS?$/i,
      /^PROFESSIONAL\s+CERTIFICATIONS?$/i
    ],
    summary: [
      /^(PROFESSIONAL\s+)?SUMMARY$/i,
      /^CAREER\s+(SUMMARY|OBJECTIVE)$/i,
      /^OBJECTIVE$/i,
      /^PROFILE$/i,
      /^ABOUT(\s+ME)?$/i
    ]
  };

  private actionVerbs = [
    'achieved', 'accelerated', 'accomplished', 'analyzed', 'architected',
    'built', 'created', 'designed', 'developed', 'engineered',
    'established', 'generated', 'implemented', 'improved', 'increased',
    'launched', 'led', 'managed', 'optimized', 'orchestrated',
    'reduced', 'resolved', 'streamlined', 'transformed', 'upgraded'
  ];

  /**
   * Parse resume text with enhanced multi-pass approach
   */
  parse(resumeText: string): ParsedResumeData {
    this.warnings = [];
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l);
    
    // First pass: Extract contact info
    const contactInfo = this.extractContactInfo(resumeText);
    
    // Second pass: Identify sections with fuzzy matching
    const sections = this.identifySections(lines);
    
    // Third pass: Parse each section with context
    const experience = this.parseExperience(lines, sections);
    const education = this.parseEducation(lines, sections);
    const skills = this.parseSkills(lines, sections, resumeText);
    const projects = this.parseProjects(lines, sections);
    const certifications = this.parseCertifications(lines, sections);
    const summary = this.extractSummary(lines, sections);

    // Detect resume format
    const resumeFormat = this.detectResumeFormat(experience, skills, sections);

    // Calculate confidence
    const confidence = this.calculateConfidence({
      hasName: !!contactInfo.fullName && contactInfo.fullName !== 'Your Name',
      hasEmail: !!contactInfo.email,
      hasExperience: experience.length > 0,
      hasEducation: education.length > 0,
      hasSkills: skills.all.length > 0
    });

    return {
      ...contactInfo,
      summary,
      experience,
      education,
      skills,
      projects,
      certifications,
      awards: [],
      metadata: {
        parsingConfidence: confidence,
        warnings: this.warnings,
        resumeFormat
      }
    };
  }

  /**
   * Extract contact information with validation
   */
  private extractContactInfo(text: string) {
    return {
      fullName: this.extractName(text),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      location: this.extractLocation(text),
      linkedinUrl: this.extractLinkedIn(text),
      githubUrl: this.extractGitHub(text),
      portfolioUrl: this.extractPortfolio(text)
    };
  }

  private extractName(text: string): string {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Strategy 1: ALL CAPS in first 5 lines
    for (const line of lines.slice(0, 5)) {
      if (line === line.toUpperCase() && 
          line.length > 3 && line.length < 60 &&
          /^[A-Z\s\.]+$/.test(line) &&
          !line.includes('@') &&
          !/(RESUME|CV|CURRICULUM)/i.test(line)) {
        return this.titleCase(line);
      }
    }
    
    // Strategy 2: Title Case name
    for (const line of lines.slice(0, 8)) {
      const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/;
      const match = line.match(namePattern);
      if (match && !line.includes('@')) {
        return match[1];
      }
    }
    
    // Strategy 3: Name: prefix
    const namePrefix = text.match(/Name:\s*([A-Za-z\s\.]+)/i);
    if (namePrefix) {
      return this.titleCase(namePrefix[1].trim());
    }
    
    this.warnings.push('Could not confidently extract name');
    return 'Your Name';
  }

  private extractEmail(text: string): string {
    const patterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      /Email:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const email = match[match.length - 1];
        // Validate email domain
        if (this.isValidEmail(email)) {
          return email;
        }
      }
    }
    
    this.warnings.push('No valid email found');
    return '';
  }

  private isValidEmail(email: string): boolean {
    const validDomains = ['.com', '.org', '.net', '.edu', '.gov', '.co', '.io', '.ai'];
    return validDomains.some(domain => email.toLowerCase().endsWith(domain));
  }

  private extractPhone(text: string): string {
    const patterns = [
      /\+\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/,
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
      /\+\d{10,15}/,
      /(?:Phone|Mobile|Tel|Contact):\s*([\d\s\-\.\(\)\+]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const phone = match[match.length - 1];
        const digitCount = phone.replace(/\D/g, '').length;
        
        // Validate digit count
        if (digitCount >= 10 && digitCount <= 15) {
          return phone.trim();
        } else {
          this.warnings.push(`Phone number has suspicious digit count: ${digitCount}`);
        }
      }
    }
    
    return '';
  }

  private extractLocation(text: string): string {
    const patterns = [
      /Location:\s*([A-Za-z\s,]+(?:USA|India|UK|Canada|Australia|Singapore|Remote|United States|Germany|France|Spain|Netherlands)[A-Za-z\s,]*)/i,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)\b/,
      /\b([A-Z][a-z]+,\s*(?:USA|India|UK|Canada|Australia|Singapore|Germany|France))\b/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2,})\s*[•|]/m
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractLinkedIn(text: string): string {
    const patterns = [
      /https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s\n)]+/i,
      /linkedin\.com\/in\/[^\s\n)]+/i,
      /LinkedIn:\s*([^\s\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const url = match[0];
        return url.startsWith('http') ? url : `https://linkedin.com/${url.replace(/^linkedin\.com\//, '')}`;
      }
    }
    
    return '';
  }

  private extractGitHub(text: string): string {
    const patterns = [
      /https?:\/\/(?:www\.)?github\.com\/[^\s\n)]+/i,
      /github\.com\/[^\s\n)]+/i,
      /GitHub:\s*([^\s\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const url = match[0];
        return url.startsWith('http') ? url : `https://${url}`;
      }
    }
    
    return '';
  }

  private extractPortfolio(text: string): string {
    const patterns = [
      /(?:Portfolio|Website):\s*(https?:\/\/[^\s\n]+)/i,
      /\b(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)\b/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const url = match[1] || match[0];
        if (!url.includes('linkedin.com') && !url.includes('github.com')) {
          return url;
        }
      }
    }
    
    return '';
  }

  /**
   * Identify sections with fuzzy matching
   */
  private identifySections(lines: string[]): Map<string, { start: number; end: number }> {
    const sections = new Map<string, { start: number; end: number }>();
    let currentSection: string | null = null;
    let sectionStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionType = this.detectSectionHeader(line);

      if (sectionType) {
        if (currentSection && sectionStart >= 0) {
          sections.set(currentSection, { start: sectionStart, end: i - 1 });
        }
        currentSection = sectionType;
        sectionStart = i + 1;
      }
    }

    if (currentSection && sectionStart >= 0) {
      sections.set(currentSection, { start: sectionStart, end: lines.length - 1 });
    }

    return sections;
  }

  private detectSectionHeader(line: string): string | null {
    const trimmed = line.trim();
    
    if (trimmed.length > 60 || trimmed.startsWith('•') || trimmed.startsWith('-')) {
      return null;
    }

    for (const [sectionType, patterns] of Object.entries(this.sectionPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          return sectionType;
        }
      }
    }

    // Fuzzy matching for common variations
    if (this.fuzzyMatch(trimmed, 'experience', 0.8)) return 'experience';
    if (this.fuzzyMatch(trimmed, 'education', 0.8)) return 'education';
    if (this.fuzzyMatch(trimmed, 'skills', 0.8)) return 'skills';

    return null;
  }

  /**
   * Simple fuzzy string matching
   */
  private fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;
    
    const similarity = this.calculateSimilarity(s1, s2);
    return similarity >= threshold;
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
   * Parse experience with achievement extraction
   */
  private parseExperience(lines: string[], sections: Map<string, { start: number; end: number }>) {
    const section = sections.get('experience');
    if (!section) return [];

    const experiences: any[] = [];
    let currentExp: any = null;
    let i = section.start;

    while (i <= section.end) {
      const line = lines[i].trim();

      if (!line) {
        i++;
        continue;
      }

      // Bullet points
      if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && currentExp) {
        const bullet = line.replace(/^[•\-\*]\s*/, '').trim();
        if (bullet) {
          const achievement = this.parseAchievement(bullet);
          currentExp.bulletPoints.push(bullet);
          if (!currentExp.achievements) currentExp.achievements = [];
          currentExp.achievements.push(achievement);
        }
        i++;
        continue;
      }

      // New job entry
      const jobEntry = this.parseJobEntry(lines, i, section.end);
      if (jobEntry) {
        if (currentExp) {
          currentExp.confidence = this.calculateJobConfidence(currentExp);
          experiences.push(currentExp);
        }
        currentExp = jobEntry.data;
        i = jobEntry.nextIndex;
      } else {
        i++;
      }
    }

    if (currentExp) {
      currentExp.confidence = this.calculateJobConfidence(currentExp);
      experiences.push(currentExp);
    }

    return experiences;
  }

  /**
   * Parse achievement with metrics extraction
   */
  private parseAchievement(text: string): any {
    const achievement: any = { text };
    
    // Extract action verb
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    if (this.actionVerbs.includes(firstWord)) {
      achievement.actionVerb = firstWord;
    }
    
    // Extract metrics (percentages, numbers, dollar amounts)
    const metrics: any[] = [];
    
    // Percentage
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/g);
    if (percentMatch) {
      percentMatch.forEach(m => {
        metrics.push({ type: 'percentage', value: m });
      });
    }
    
    // Dollar amounts
    const dollarMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*([KMB])?/gi);
    if (dollarMatch) {
      dollarMatch.forEach(m => {
        metrics.push({ type: 'currency', value: m });
      });
    }
    
    // Team size
    const teamMatch = text.match(/team\s+of\s+(\d+)/i);
    if (teamMatch) {
      metrics.push({ type: 'team_size', value: teamMatch[1] });
    }
    
    // Time periods
    const timeMatch = text.match(/(\d+)\s*(month|year|week|day)s?/gi);
    if (timeMatch) {
      timeMatch.forEach(m => {
        metrics.push({ type: 'time', value: m });
      });
    }
    
    if (metrics.length > 0) {
      achievement.metrics = metrics;
    }
    
    return achievement;
  }

  private parseJobEntry(lines: string[], startIndex: number, endIndex: number): 
    { data: any; nextIndex: number } | null {
    
    const line = lines[startIndex];
    const nextLine = lines[startIndex + 1] || '';
    const thirdLine = lines[startIndex + 2] || '';

    // Format 1: Pipe-separated
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        const dates = this.extractDates(parts[parts.length - 1]);
        return {
          data: {
            position: parts[0],
            company: parts[1] || '',
            location: parts[2] || '',
            startDate: dates.start,
            endDate: dates.end,
            isCurrent: dates.isCurrent,
            bulletPoints: [],
            achievements: []
          },
          nextIndex: startIndex + 1
        };
      }
    }

    // Format 2: Multi-line
    if (!line.startsWith('•') && !line.startsWith('-') && line.length > 5 && line.length < 100) {
      if (nextLine && (nextLine.includes('|') || this.looksLikeMetadata(nextLine))) {
        const metadata = this.parseMetadataLine(nextLine);
        return {
          data: {
            position: line,
            company: metadata.company,
            location: metadata.location,
            startDate: metadata.startDate,
            endDate: metadata.endDate,
            isCurrent: metadata.isCurrent,
            bulletPoints: [],
            achievements: []
          },
          nextIndex: startIndex + 2
        };
      }
    }

    return null;
  }

  private looksLikeMetadata(line: string): boolean {
    return /\b(19|20)\d{2}\b/.test(line) || 
           /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)/i.test(line) ||
           line.includes('|');
  }

  private parseMetadataLine(line: string) {
    const parts = line.split('|').map(p => p.trim());
    const result: any = {
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false
    };

    for (let i = parts.length - 1; i >= 0; i--) {
      const dates = this.extractDates(parts[i]);
      if (dates.start) {
        result.startDate = dates.start;
        result.endDate = dates.end;
        result.isCurrent = dates.isCurrent;
        parts.splice(i, 1);
        break;
      }
    }

    if (parts.length >= 1) result.company = parts[0];
    if (parts.length >= 2) result.location = parts[1];

    return result;
  }

  private extractDates(text: string): { start: string; end: string; isCurrent: boolean } {
    const result = { start: '', end: '', isCurrent: false };

    // Support multiple date formats
    const patterns = [
      /(\w+\s+\d{4}|\d{4})\s*[-–—to]\s*(\w+\s+\d{4}|Present|\d{4})/i,
      /\b(19|20)\d{2}\s*[-–—to]\s*((19|20)\d{2}|Present)\b/i,
      /(\d{1,2}\/\d{4})\s*[-–—to]\s*(\d{1,2}\/\d{4}|Present)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        result.start = match[1].trim();
        result.end = match[2].trim();
        result.isCurrent = /present/i.test(result.end);
        return result;
      }
    }

    return result;
  }

  private calculateJobConfidence(job: any): number {
    let score = 0.5;
    
    if (job.position && job.position.length > 3) score += 0.15;
    if (job.company && job.company.length > 2) score += 0.15;
    if (job.startDate) score += 0.1;
    if (job.bulletPoints && job.bulletPoints.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private parseEducation(lines: string[], sections: Map<string, { start: number; end: number }>) {
    const section = sections.get('education');
    if (!section) return [];

    const education: any[] = [];
    let currentEdu: any = null;

    for (let i = section.start; i <= section.end; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const degreePattern = /(Bachelor|Master|B\.?\s*Tech|M\.?\s*Tech|B\.?\s*S\.?|M\.?\s*S\.?|B\.?\s*A\.?|M\.?\s*A\.?|PhD|Ph\.D|Doctorate|Diploma|Associate)/i;
      if (degreePattern.test(line)) {
        if (currentEdu) {
          currentEdu.confidence = this.calculateEducationConfidence(currentEdu);
          education.push(currentEdu);
        }

        currentEdu = {
          degree: line,
          institution: '',
          fieldOfStudy: this.extractFieldOfStudy(line),
          graduationYear: this.extractYear(line),
          gpa: '',
          achievements: []
        };

        if (i + 1 <= section.end) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !degreePattern.test(nextLine) && !nextLine.toLowerCase().includes('gpa')) {
            currentEdu.institution = nextLine;
            if (!currentEdu.graduationYear) {
              currentEdu.graduationYear = this.extractYear(nextLine);
            }
            i++;
          }
        }
      } else if (currentEdu && /gpa|grade/i.test(line)) {
        currentEdu.gpa = line;
      }
    }

    if (currentEdu) {
      currentEdu.confidence = this.calculateEducationConfidence(currentEdu);
      education.push(currentEdu);
    }

    return education;
  }

  private calculateEducationConfidence(edu: any): number {
    let score = 0.5;
    
    if (edu.degree) score += 0.2;
    if (edu.institution && edu.institution.length > 3) score += 0.2;
    if (edu.graduationYear) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private extractFieldOfStudy(line: string): string {
    const inPattern = /\bin\s+([A-Za-z\s&]+?)(?:\s*[,|]|\s*$)/i;
    const match = line.match(inPattern);
    return match ? match[1].trim() : '';
  }

  private extractYear(text: string): number | undefined {
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0]) : undefined;
  }

  /**
   * Parse skills with categorization and experience extraction
   */
  private parseSkills(lines: string[], sections: Map<string, { start: number; end: number }>, fullText: string) {
    const section = sections.get('skills');
    if (!section) return { all: [], categorized: {} };

    const allSkills: string[] = [];
    const technical: string[] = [];
    const soft: string[] = [];
    const categorized: Record<string, string[]> = {};
    const yearsExperience: Record<string, number> = {};
    let currentCategory = 'General';

    for (let i = section.start; i <= section.end; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const categoryMatch = line.match(/^([A-Za-z\s&]+):\s*(.+)$/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        const skillsText = categoryMatch[2];
        const skills = this.splitSkills(skillsText);
        categorized[currentCategory] = skills;
        allSkills.push(...skills);
        
        // Categorize as technical or soft
        skills.forEach(skill => {
          if (this.isTechnicalSkill(skill)) {
            technical.push(skill);
          } else if (this.isSoftSkill(skill)) {
            soft.push(skill);
          }
          
          // Extract years of experience for this skill
          const years = this.extractSkillYears(fullText, skill);
          if (years > 0) {
            yearsExperience[skill] = years;
          }
        });
      } else {
        const skills = this.splitSkills(line);
        if (!categorized[currentCategory]) {
          categorized[currentCategory] = [];
        }
        categorized[currentCategory].push(...skills);
        allSkills.push(...skills);
      }
    }

    return {
      all: [...new Set(allSkills)],
      technical: [...new Set(technical)],
      soft: [...new Set(soft)],
      categorized,
      yearsExperience
    };
  }

  private isTechnicalSkill(skill: string): boolean {
    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
      'api', 'database', 'cloud', 'programming', 'development', 'framework'
    ];
    const lower = skill.toLowerCase();
    return techKeywords.some(keyword => lower.includes(keyword));
  }

  private isSoftSkill(skill: string): boolean {
    const softKeywords = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'management',
      'collaboration', 'analytical', 'creative', 'organization'
    ];
    const lower = skill.toLowerCase();
    return softKeywords.some(keyword => lower.includes(keyword));
  }

  private extractSkillYears(text: string, skill: string): number {
    const pattern = new RegExp(`${skill}.*?(\\d+)\\s*(?:years?|yrs?)`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : 0;
  }

  private splitSkills(text: string): string[] {
    return text
      .split(/[,•\-|;]/)
      .map(s => s.trim())
      .filter(s => s && s.length > 1 && s.length < 50);
  }

  private parseProjects(lines: string[], sections: Map<string, { start: number; end: number }>) {
    const section = sections.get('projects');
    if (!section) return [];

    const projects: any[] = [];
    let currentProject: any = null;

    for (let i = section.start; i <= section.end; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (!line.startsWith('•') && !line.startsWith('-') && 
          !line.toLowerCase().includes('tech') && 
          line.length > 5 && line.length < 100) {
        
        if (currentProject) {
          projects.push(currentProject);
        }

        currentProject = {
          name: line,
          description: '',
          technologies: [],
          metrics: []
        };
      } else if (currentProject && /tech\s*stack/i.test(line)) {
        const techMatch = line.match(/tech\s*stack:?\s*(.+)/i);
        if (techMatch) {
          currentProject.technologies = this.splitSkills(techMatch[1]);
        }
      } else if (currentProject) {
        const text = line.replace(/^[•\-]\s*/, '').trim();
        currentProject.description += (currentProject.description ? ' ' : '') + text;
        
        // Extract metrics
        const metrics = this.extractMetrics(text);
        currentProject.metrics.push(...metrics);
      }
    }

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  private extractMetrics(text: string): string[] {
    const metrics: string[] = [];
    const patterns = [
      /\d+(?:\.\d+)?\s*%/g,
      /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /\d+\+?\s*(?:users?|customers?|clients?)/gi,
      /\d+x\s*(?:faster|improvement|increase)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        metrics.push(...matches);
      }
    });
    
    return metrics;
  }

  private parseCertifications(lines: string[], sections: Map<string, { start: number; end: number }>) {
    const section = sections.get('certifications');
    if (!section) return [];

    const certifications: string[] = [];

    for (let i = section.start; i <= section.end; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cert = line.replace(/^[•\-]\s*/, '').trim();
      if (cert) {
        certifications.push(cert);
      }
    }

    return certifications;
  }

  private extractSummary(lines: string[], sections: Map<string, { start: number; end: number }>): string {
    const section = sections.get('summary');
    if (!section) return '';

    const summaryLines: string[] = [];
    for (let i = section.start; i <= section.end; i++) {
      const line = lines[i].trim();
      if (line) {
        summaryLines.push(line);
      }
    }

    return summaryLines.join(' ');
  }

  /**
   * Detect resume format type
   */
  private detectResumeFormat(experience: any[], skills: any, sections: Map<string, any>): 'chronological' | 'functional' | 'hybrid' {
    const hasChronologicalExp = experience.length > 0 && experience.some(e => e.startDate);
    const hasSkillsFirst = sections.has('skills') && sections.has('experience') &&
                           sections.get('skills')!.start < sections.get('experience')!.start;
    
    if (hasSkillsFirst && skills.all.length > 10) {
      return hasChronologicalExp ? 'hybrid' : 'functional';
    }
    
    return 'chronological';
  }

  private calculateConfidence(checks: Record<string, boolean>): number {
    const weights = {
      hasName: 0.2,
      hasEmail: 0.2,
      hasExperience: 0.25,
      hasEducation: 0.2,
      hasSkills: 0.15
    };

    let score = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) {
        score += weights[key as keyof typeof weights] || 0;
      }
    }

    return Math.round(score * 100);
  }

  private titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

export const resumeTextParser = new ResumeTextParser();
