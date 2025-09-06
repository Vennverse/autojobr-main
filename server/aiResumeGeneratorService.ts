import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { apiKeyRotationService } from "./apiKeyRotationService.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserProfile {
  id: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  // Other profile data from your DB
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  professionalSummary: string;
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    major: string;
    university: string;
    location: string;
    graduationDate: string;
    gpa?: string;
    honors?: string;
    coursework?: string;
  }>;
  skills: {
    programming: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloudPlatforms: string[];
    business: string[];
    marketing: string[];
    sales: string[];
    finance: string[];
    healthcare: string[];
    education: string[];
  };
  projects: Array<{
    name: string;
    date: string;
    description: string[];
    technologies: string[];
  }>;
  certifications: Array<{
    name: string;
    organization: string;
    date: string;
  }>;
  additionalInfo: {
    languages?: string;
    volunteer?: string;
    associations?: string;
  };
}

interface ExtractedResumeContent {
  rawExperience: string;
  rawEducation: string;
  rawSkills: string;
  rawProjects: string;
  rawCertifications: string;
  rawSummary?: string;
}

export class OptimizedAIResumeService {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, "..", "ats_resume_templates.html");
  }

  async generateResumeFromUserData(
    userProfile: UserProfile,
    existingResumeText: string,
    targetJobDescription?: string,
  ): Promise<{ pdfBuffer: Buffer; resumeData: ResumeData }> {
    try {
      // Step 1: Use NLP to extract only what needs AI enhancement
      const extractedContent = this.extractContentWithNLP(existingResumeText);

      // Step 2: Use AI only for enhancement, not extraction
      const enhancedContent = await this.enhanceContentWithAI(
        extractedContent,
        targetJobDescription,
      );

      // Step 3: Combine DB data with AI-enhanced content
      const resumeData = this.combineDataSources(userProfile, enhancedContent);

      // Step 4: Generate PDF
      const pdfBuffer = await this.generatePDF(resumeData, "professional");

      return { pdfBuffer, resumeData };
    } catch (error) {
      console.error("Optimized AI Resume Generation Error:", error);
      throw new Error("Failed to generate optimized AI resume");
    }
  }

  // Step 1: NLP Extraction (No AI tokens used)
  private extractContentWithNLP(resumeText: string): ExtractedResumeContent {
    const text = resumeText.toLowerCase();

    // Simple regex-based extraction for structured content
    const sections = {
      experience: this.extractSection(resumeText, [
        "experience",
        "work history",
        "employment",
        "professional experience",
      ]),
      education: this.extractSection(resumeText, [
        "education",
        "academic",
        "degree",
        "university",
        "college",
      ]),
      skills: this.extractSection(resumeText, [
        "skills",
        "technical skills",
        "technologies",
        "programming",
      ]),
      projects: this.extractSection(resumeText, [
        "projects",
        "portfolio",
        "personal projects",
      ]),
      certifications: this.extractSection(resumeText, [
        "certifications",
        "certificates",
        "licensed",
      ]),
      summary: this.extractSection(resumeText, [
        "summary",
        "objective",
        "profile",
        "about",
      ]),
    };

    return {
      rawExperience: sections.experience,
      rawEducation: sections.education,
      rawSkills: sections.skills,
      rawProjects: sections.projects,
      rawCertifications: sections.certifications,
      rawSummary: sections.summary,
    };
  }

  private extractSection(text: string, keywords: string[]): string {
    const lines = text.split("\n");
    let inSection = false;
    let sectionContent: string[] = [];
    let nextSectionStart = -1;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();

      if (keywords.some((keyword) => line.includes(keyword))) {
        inSection = true;
        continue;
      }

      if (inSection) {
        // Stop if we hit another major section
        const majorSections = [
          "experience",
          "education",
          "skills",
          "projects",
          "certifications",
        ];
        if (
          majorSections.some(
            (section) => line.includes(section) && !keywords.includes(section),
          )
        ) {
          break;
        }

        if (line.trim()) {
          sectionContent.push(lines[i].trim());
        }
      }
    }

    return sectionContent.join("\n").trim();
  }

  // Step 2: Targeted AI Enhancement (Minimal token usage)
  private async enhanceContentWithAI(
    extractedContent: ExtractedResumeContent,
    targetJobDescription?: string,
  ): Promise<any> {
    // Only enhance what actually needs AI improvement
    const enhancementTasks = [];

    // Task 1: Enhance experience descriptions (high impact)
    if (extractedContent.rawExperience) {
      enhancementTasks.push(
        this.enhanceExperience(
          extractedContent.rawExperience,
          targetJobDescription,
        ),
      );
    }

    // Task 2: Generate professional summary (if missing/weak)
    if (
      !extractedContent.rawSummary ||
      extractedContent.rawSummary.length < 50
    ) {
      enhancementTasks.push(
        this.generateProfessionalSummary(
          extractedContent,
          targetJobDescription,
        ),
      );
    }

    // Task 3: Enhance project descriptions (if they exist)
    if (extractedContent.rawProjects) {
      enhancementTasks.push(this.enhanceProjects(extractedContent.rawProjects));
    }

    const results = await Promise.all(enhancementTasks);

    return {
      enhancedExperience:
        results[0] || this.parseExperienceBasic(extractedContent.rawExperience),
      professionalSummary:
        results[1] || "Experienced professional with proven track record.",
      enhancedProjects:
        results[2] || this.parseProjectsBasic(extractedContent.rawProjects),
      // Parse other sections without AI (they don't need enhancement)
      education: this.parseEducationBasic(extractedContent.rawEducation),
      skills: this.parseSkillsBasic(extractedContent.rawSkills),
      certifications: this.parseCertificationsBasic(
        extractedContent.rawCertifications,
      ),
    };
  }

  // High-impact AI enhancement for experience - ATS OPTIMIZED
  private async enhanceExperience(
    experienceText: string,
    jobDescription?: string,
  ): Promise<any[]> {
    const atsActionVerbs = [
      "Achieved", "Accelerated", "Accomplished", "Administered", "Analyzed", "Architected", 
      "Built", "Collaborated", "Created", "Decreased", "Delivered", "Developed", "Directed",
      "Enhanced", "Executed", "Generated", "Implemented", "Improved", "Increased", "Led",
      "Managed", "Optimized", "Orchestrated", "Reduced", "Streamlined", "Supervised", "Transformed"
    ];

    const prompt = `Create 100% ATS-optimized experience bullets using EXACT keywords from the job description:

${jobDescription ? `TARGET JOB KEYWORDS TO INCLUDE: ${this.extractJobKeywords(jobDescription)}` : ""}

Current Experience:
${experienceText}

ATS OPTIMIZATION REQUIREMENTS:
1. START each bullet with these action verbs: ${atsActionVerbs.join(", ")}
2. INCLUDE quantified results (percentages, dollar amounts, timeframes)
3. USE exact keywords from job description if provided
4. MATCH industry-standard terminology
5. AVOID graphics, symbols, or special characters
6. LIMIT to 15-17 words per bullet for ATS parsing
7. INCLUDE technical skills and software names

PROVEN ATS FORMAT:
- [Action Verb] + [Task/Project] + [Quantified Result] + [Impact/Benefit]
- Example: "Developed 5 React applications serving 10,000+ users, reducing load time by 40%"

Return JSON: [{"jobTitle":"","company":"","location":"","startDate":"","endDate":"","achievements":["bullet1","bullet2","bullet3","bullet4"]}]`;

    try {
      return await this.callAI(prompt, 800); // Much smaller token limit
    } catch (error) {
      return this.parseExperienceBasic(experienceText);
    }
  }

  // Enhance project descriptions for ATS optimization
  private async enhanceProjects(projectsText: string): Promise<any[]> {
    const prompt = `Transform projects into ATS-optimized format with maximum keyword density:

${projectsText}

ATS PROJECT OPTIMIZATION:
1. USE technical keywords extensively (frameworks, languages, databases)
2. INCLUDE quantified metrics (users, performance improvements, time saved)
3. START descriptions with action verbs: Built, Developed, Created, Implemented
4. MENTION specific technologies and integrations
5. INCLUDE project scale and impact
6. AVOID generic terms, use specific technical language
7. ENSURE keywords match industry standards

PROVEN ATS FORMAT:
- Name: [Technical] + [Project Type] (e.g., "E-commerce React Application")
- Description: [Action] + [Technology Stack] + [Quantified Result]
- Technologies: List exact framework/library names

Example: "Built full-stack e-commerce platform using React, Node.js, PostgreSQL serving 5000+ users with 99% uptime"

Return JSON: [{"name":"","date":"","description":["bullet1","bullet2"],"technologies":["React","Node.js","PostgreSQL"]}]`;

    try {
      return await this.callAI(prompt, 600);
    } catch (error) {
      return this.parseProjectsBasic(projectsText);
    }
  }

  // Extract ATS keywords from job description - ALL PROFESSIONS
  private extractJobKeywords(jobDescription: string): string {
    const keywordPatterns = [
      // Technical Skills
      /\b(JavaScript|Python|Java|React|Node\.js|Angular|Vue|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|HTML|CSS|SQL)\b/gi,
      // Technical Tools & Platforms
      /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab|Salesforce|HubSpot|Marketo|Adobe|Figma|Sketch|AutoCAD|SAP|Oracle)\b/gi,
      
      // Sales & Marketing
      /\b(CRM|Lead Generation|Pipeline Management|B2B|B2C|Account Management|Territory Management|Cold Calling|Prospecting)\b/gi,
      /\b(Digital Marketing|SEO|SEM|PPC|Social Media|Content Marketing|Email Marketing|Analytics|Conversion|ROI|KPI)\b/gi,
      /\b(Salesforce|HubSpot|Pipedrive|Marketo|Mailchimp|Google Analytics|Google Ads|Facebook Ads|LinkedIn Ads)\b/gi,
      
      // Finance & Accounting
      /\b(Financial Analysis|Budgeting|Forecasting|P&L|Balance Sheet|Cash Flow|GAAP|SOX|Internal Controls|Audit)\b/gi,
      /\b(Excel|QuickBooks|SAP|Oracle Financials|Bloomberg|Tableau|Power BI|SQL|VBA|Python)\b/gi,
      
      // HR & Operations
      /\b(Talent Acquisition|Employee Relations|Performance Management|Training|Onboarding|HRIS|Payroll|Benefits)\b/gi,
      /\b(Process Improvement|Lean|Six Sigma|Project Management|Supply Chain|Logistics|Vendor Management)\b/gi,
      
      // Healthcare & Science
      /\b(Clinical Research|Regulatory Affairs|FDA|GCP|Clinical Trials|Medical Device|Pharmaceutical|Laboratory)\b/gi,
      /\b(Epic|Cerner|HL7|HIPAA|EMR|EHR|Clinical Data|Biostatistics|SAS|R|MATLAB)\b/gi,
      
      // Education & Training
      /\b(Curriculum Development|Instructional Design|Learning Management|Assessment|Student Engagement|Academic)\b/gi,
      /\b(Blackboard|Canvas|Moodle|SCORM|Educational Technology|Distance Learning|Blended Learning)\b/gi,
      
      // General Business Skills
      /\b(Leadership|Team Management|Strategic Planning|Business Development|Client Relations|Stakeholder Management)\b/gi,
      /\b(Project Management|Agile|Scrum|PMP|Change Management|Cross-functional|Communication|Negotiation)\b/gi,
      
      // Certifications (All Industries)
      /\b(PMP|Six Sigma|CPA|CFA|PHR|SHRM|Google Certified|Microsoft Certified|Salesforce Certified|HubSpot Certified)\b/gi,
      /\b(AWS Certified|Azure Certified|Certified ScrumMaster|CISSP|CompTIA|Adobe Certified|AutoCAD Certified)\b/gi
    ];
    
    const keywords = new Set<string>();
    keywordPatterns.forEach(pattern => {
      const matches = jobDescription.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match));
      }
    });
    
    return Array.from(keywords).slice(0, 20).join(", ");
  }

  // Generate ATS-optimized professional summary
  private async generateProfessionalSummary(
    content: ExtractedResumeContent,
    jobDescription?: string,
  ): Promise<string> {
    const prompt = `Create a 100% ATS-optimized professional summary that will score maximum points:

Experience: ${content.rawExperience.substring(0, 300)}
Skills: ${content.rawSkills.substring(0, 100)}
${jobDescription ? `TARGET JOB KEYWORDS: ${this.extractJobKeywords(jobDescription)}` : ""}

ATS SUMMARY REQUIREMENTS:
1. INCLUDE exact keywords from job description
2. START with years of experience (e.g., "5+ years")
3. MENTION specific technologies and skills
4. INCLUDE industry-standard terminology
5. USE quantifiable achievements when possible
6. AVOID buzzwords like "passionate," "innovative," "dynamic"
7. KEEP it 2-3 lines, 50-80 words total
8. ENSURE keywords appear naturally

FORMAT: [X years] + [Role/Industry] + [Key Skills] + [Quantified Achievement]
Example: "5+ years Software Engineer with expertise in React, Node.js, and AWS. Built 15+ applications serving 100K+ users with 99.9% uptime."`;

    try {
      const result = await this.callAI(prompt, 200); // Very small token limit
      return result.trim();
    } catch (error) {
      return "Experienced professional with proven track record of delivering results in dynamic environments.";
    }
  }

  // Minimal AI call wrapper
  private async callAI(prompt: string, maxTokens: number): Promise<any> {
    const response = await apiKeyRotationService.executeWithGroqRotation(
      async (groqClient: any) => {
        const apiKey = groqClient.apiKey || process.env.GROQ_API_KEY;
        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: maxTokens, // Much smaller limits
            }),
          },
        );

        if (!groqResponse.ok) {
          throw new Error(`Groq API error: ${groqResponse.statusText}`);
        }

        return groqResponse.json();
      },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Try to parse JSON if expected, otherwise return text
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  // Step 3: Combine DB data with AI enhancements (No tokens used)
  private combineDataSources(
    userProfile: UserProfile,
    enhancedContent: any,
  ): ResumeData {
    return {
      // Use DB data directly (no AI tokens wasted)
      personalInfo: userProfile.personalInfo,

      // Use AI-enhanced content where it adds value, with fallbacks to empty arrays
      professionalSummary: enhancedContent.professionalSummary,
      experience: Array.isArray(enhancedContent.enhancedExperience) ? enhancedContent.enhancedExperience : [],
      projects: Array.isArray(enhancedContent.enhancedProjects) ? enhancedContent.enhancedProjects : [],

      // Use basic parsing for structured data
      education: Array.isArray(enhancedContent.education) ? enhancedContent.education : [],
      skills: enhancedContent.skills || {
        programming: [],
        frameworks: [],
        databases: [],
        tools: [],
        cloudPlatforms: [],
      },
      certifications: Array.isArray(enhancedContent.certifications) ? enhancedContent.certifications : [],
      additionalInfo: enhancedContent.additionalInfo || {},
    };
  }

  // Basic parsing methods (no AI needed)
  private parseExperienceBasic(text: string): any[] {
    if (!text) return [];

    // Simple parsing logic for experience
    const experiences = [];
    const lines = text.split("\n").filter((line) => line.trim());

    let currentExp = null;
    for (const line of lines) {
      if (this.looksLikeJobTitle(line)) {
        if (currentExp) experiences.push(currentExp);
        currentExp = {
          jobTitle: this.extractJobTitle(line),
          company: this.extractCompany(line),
          location: this.extractLocation(line),
          startDate: this.extractDate(line, "start"),
          endDate: this.extractDate(line, "end"),
          achievements: [] as string[],
        };
      } else if (
        currentExp && 
        (line.trim().startsWith("-") || line.trim().startsWith("•"))
      ) {
        currentExp.achievements.push(line.replace(/^[-•]\s*/, "").trim());
      }
    }

    if (currentExp) experiences.push(currentExp);
    return experiences;
  }

  private parseSkillsBasic(text: string): any {
    if (!text)
      return {
        programming: [],
        frameworks: [],
        databases: [],
        tools: [],
        cloudPlatforms: [],
        business: [],
        marketing: [],
        sales: [],
        finance: [],
        healthcare: [],
        education: []
      };

    // Extract skills and categorize them
    const allSkills = text
      .toLowerCase()
      .split(/[,\n\-•]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    return {
      programming: allSkills.filter((s) => this.isProgrammingLanguage(s)),
      frameworks: allSkills.filter((s) => this.isFramework(s)),
      databases: allSkills.filter((s) => this.isDatabase(s)),
      tools: allSkills.filter((s) => this.isTool(s)),
      cloudPlatforms: allSkills.filter((s) => this.isCloudPlatform(s)),
      business: allSkills.filter((s) => this.isBusinessSkill(s)),
      marketing: allSkills.filter((s) => this.isMarketingSkill(s)),
      sales: allSkills.filter((s) => this.isSalesSkill(s)),
      finance: allSkills.filter((s) => this.isFinanceSkill(s)),
      healthcare: allSkills.filter((s) => this.isHealthcareSkill(s)),
      education: allSkills.filter((s) => this.isEducationSkill(s))
    };
  }

  private parseEducationBasic(text: string): any[] {
    // Basic education parsing without AI
    if (!text) return [];

    return [
      {
        degree: this.extractDegree(text) || "Bachelor's Degree",
        major: this.extractMajor(text) || "Computer Science",
        university: this.extractUniversity(text) || "University Name",
        location: this.extractLocation(text) || "City, State",
        graduationDate: this.extractGraduationDate(text) || "2020",
      },
    ];
  }

  private parseProjectsBasic(text: string): any[] {
    // Basic project parsing
    if (!text) return [];

    const projects = text.split(/\n\s*\n/).map((section) => {
      const lines = section.split("\n");
      return {
        name: lines[0]?.trim() || "Project Name",
        date: this.extractProjectDate(section) || "2023",
        description: lines.slice(1).filter((l) => l.trim()),
        technologies: this.extractTechnologies(section),
      };
    });

    return projects.filter((p) => p.name !== "Project Name");
  }

  private parseCertificationsBasic(text: string): any[] {
    if (!text) return [];

    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => ({
        name: line.trim(),
        organization: "Issuing Organization",
        date: "2023",
      }));
  }

  // Helper methods for basic parsing
  private looksLikeJobTitle(line: string): boolean {
    const jobIndicators = [
      "engineer",
      "developer",
      "manager",
      "analyst",
      "specialist",
      "coordinator",
    ];
    return jobIndicators.some((indicator) =>
      line.toLowerCase().includes(indicator),
    );
  }

  private extractJobTitle(line: string): string {
    // Extract job title from line
    return line.split(/[-–|@]/)[0]?.trim() || "Professional Role";
  }

  private extractCompany(line: string): string {
    // Extract company from line
    const parts = line.split(/[-–|@]/);
    return parts[1]?.trim() || "Company Name";
  }

  private extractLocation(line: string): string {
    // Extract location patterns
    const locationRegex = /([A-Z][a-z]+,?\s*[A-Z]{2})/;
    const match = line.match(locationRegex);
    return match?.[1] || "City, State";
  }

  private extractDate(line: string, type: "start" | "end"): string {
    // Extract dates from line
    const dateRegex =
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s.-]*\d{4}|\b\d{4}\b/g;
    const dates = line.match(dateRegex);

    if (dates && dates.length >= 2) {
      return type === "start" ? dates[0] : dates[1];
    }
    return type === "start" ? "2020" : "Present";
  }

  private isProgrammingLanguage(skill: string): boolean {
    const languages = [
      "javascript",
      "python",
      "java",
      "c++",
      "c#",
      "php",
      "ruby",
      "go",
      "rust",
      "typescript",
    ];
    return languages.some((lang) => skill.includes(lang));
  }

  private isFramework(skill: string): boolean {
    const frameworks = [
      "react",
      "angular",
      "vue",
      "node.js",
      "express",
      "django",
      "flask",
      "spring",
    ];
    return frameworks.some((framework) => skill.includes(framework));
  }

  private isDatabase(skill: string): boolean {
    const databases = [
      "mysql",
      "postgresql",
      "mongodb",
      "redis",
      "sqlite",
      "oracle",
    ];
    return databases.some((db) => skill.includes(db));
  }

  private isTool(skill: string): boolean {
    const tools = [
      "git",
      "docker",
      "jenkins",
      "jira",
      "slack",
      "postman",
      "webpack",
    ];
    return tools.some((tool) => skill.includes(tool));
  }

  private isCloudPlatform(skill: string): boolean {
    const platforms = ["aws", "azure", "gcp", "heroku", "digitalocean"];
    return platforms.some((platform) => skill.includes(platform));
  }

  private isBusinessSkill(skill: string): boolean {
    const businessSkills = [
      "leadership", "project management", "strategic planning", "business development",
      "team management", "process improvement", "stakeholder management", "negotiation",
      "communication", "presentation", "analytical", "problem solving", "decision making"
    ];
    return businessSkills.some(bSkill => skill.includes(bSkill));
  }

  private isMarketingSkill(skill: string): boolean {
    const marketingSkills = [
      "digital marketing", "seo", "sem", "ppc", "social media", "content marketing",
      "email marketing", "analytics", "google analytics", "facebook ads", "linkedin ads",
      "hubspot", "marketo", "mailchimp", "conversion optimization", "a/b testing"
    ];
    return marketingSkills.some(mSkill => skill.includes(mSkill));
  }

  private isSalesSkill(skill: string): boolean {
    const salesSkills = [
      "crm", "salesforce", "lead generation", "prospecting", "cold calling",
      "account management", "territory management", "pipeline management",
      "b2b sales", "b2c sales", "negotiation", "closing", "relationship building"
    ];
    return salesSkills.some(sSkill => skill.includes(sSkill));
  }

  private isFinanceSkill(skill: string): boolean {
    const financeSkills = [
      "financial analysis", "budgeting", "forecasting", "financial modeling",
      "excel", "quickbooks", "sap", "oracle financials", "gaap", "sox compliance",
      "audit", "tax preparation", "investment analysis", "risk management"
    ];
    return financeSkills.some(fSkill => skill.includes(fSkill));
  }

  private isHealthcareSkill(skill: string): boolean {
    const healthcareSkills = [
      "clinical research", "regulatory affairs", "fda", "gcp", "clinical trials",
      "epic", "cerner", "hl7", "hipaa", "emr", "ehr", "medical device",
      "pharmaceutical", "laboratory", "patient care", "medical coding"
    ];
    return healthcareSkills.some(hSkill => skill.includes(hSkill));
  }

  private isEducationSkill(skill: string): boolean {
    const educationSkills = [
      "curriculum development", "instructional design", "learning management",
      "blackboard", "canvas", "moodle", "educational technology", "assessment",
      "student engagement", "classroom management", "academic research"
    ];
    return educationSkills.some(eSkill => skill.includes(eSkill));
  }

  private extractDegree(text: string): string | null {
    const degreeRegex =
      /(Bachelor|Master|PhD|Associate).*?(of|in)?\s*(.*?)(?=\n|$)/i;
    return text.match(degreeRegex)?.[0] || null;
  }

  private extractMajor(text: string): string | null {
    const majorRegex = /(?:in|of)\s+([A-Za-z\s]+)(?:from|\n|$)/i;
    return text.match(majorRegex)?.[1]?.trim() || null;
  }

  private extractUniversity(text: string): string | null {
    const uniRegex = /(University|College|Institute)[\s\w]+/i;
    return text.match(uniRegex)?.[0] || null;
  }

  private extractGraduationDate(text: string): string | null {
    const dateRegex = /\b(19|20)\d{2}\b/;
    return text.match(dateRegex)?.[0] || null;
  }

  private extractProjectDate(text: string): string | null {
    const dateRegex = /\b(19|20)\d{2}\b/;
    return text.match(dateRegex)?.[0] || null;
  }

  private extractTechnologies(text: string): string[] {
    // Extract technology names from project description
    const techKeywords = [
      "javascript",
      "python",
      "react",
      "node.js",
      "mysql",
      "mongodb",
      "aws",
    ];
    const lowerText = text.toLowerCase();

    return techKeywords.filter((tech) => lowerText.includes(tech));
  }

  // PDF generation method (same as before but using launchBrowser)
  private async generatePDF(
    resumeData: ResumeData,
    templateType: "professional" | "modern" = "professional",
  ): Promise<Buffer> {
    let browser: any = null;
    try {
      const templateHtml = await fs.readFile(this.templatePath, "utf-8");
      const populatedHtml = this.populateTemplate(
        templateHtml,
        resumeData,
        templateType,
      );

      browser = await this.launchBrowser();
      const page = await browser.newPage();
      await page.setContent(populatedHtml, { waitUntil: "networkidle0" });

      await page.addStyleTag({
        content: `
          .template-selector { display: none !important; }
          .resume-container { display: none !important; }
          .resume-container.${templateType === "professional" ? "template1" : "template2"} { display: block !important; }
          .data-field::before { display: none !important; }
          body { background: white !important; }
        `,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async launchBrowser() {
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor"
      ],
    };

    // Strategy 1: Use bundled Chromium (preferred for Replit)
    // Strategy 2: System-installed browsers as fallback
    const strategies = [
      () => puppeteer.launch(launchOptions), // Uses bundled Chromium
      () => puppeteer.launch({ 
        ...launchOptions, 
        executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium"
      }),
      () => puppeteer.launch({
        ...launchOptions,
        executablePath: "/usr/bin/chromium",
      }),
      () => puppeteer.launch({
        ...launchOptions,
        executablePath: "/usr/bin/chromium-browser",
      }),
      () => puppeteer.launch({
        ...launchOptions,
        executablePath: "/usr/bin/google-chrome",
      }),
    ];

    for (let index = 0; index < strategies.length; index++) {
      try {
        return await strategies[index]();
      } catch (error) {
        console.log(`Browser launch strategy ${index + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
        if (index === strategies.length - 1) {
          throw new Error(`All browser launch strategies failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }

  private populateTemplate(
    html: string,
    data: ResumeData,
    templateType: string,
  ): string {
    // Same template population logic as before
    let populated = html;

    // Personal Information
    populated = populated.replace(
      /\[FULL_NAME\]/g,
      data.personalInfo.fullName || "Your Name",
    );
    populated = populated.replace(
      /\[EMAIL\]/g,
      data.personalInfo.email || "your.email@example.com",
    );
    populated = populated.replace(
      /\[PHONE\]/g,
      data.personalInfo.phone || "(555) 123-4567",
    );
    populated = populated.replace(
      /\[CITY, STATE\]/g,
      data.personalInfo.location || "City, State",
    );
    populated = populated.replace(
      /\[LOCATION\]/g,
      data.personalInfo.location || "City, State",
    );
    populated = populated.replace(
      /\[LINKEDIN_URL\]/g,
      data.personalInfo.linkedin || "linkedin.com/in/yourprofile",
    );
    populated = populated.replace(
      /\[LINKEDIN_PROFILE\]/g,
      data.personalInfo.linkedin || "linkedin.com/in/yourprofile",
    );
    populated = populated.replace(
      /\[PORTFOLIO_URL\]/g,
      data.personalInfo.portfolio || "yourportfolio.com",
    );
    populated = populated.replace(
      /\[PROFESSIONAL_TITLE\]/g,
      data.experience[0]?.jobTitle || "Professional Title",
    );

    // Professional Summary
    populated = populated.replace(
      /\[PROFESSIONAL_SUMMARY[^\]]*\]/g,
      data.professionalSummary,
    );

    // Core Skills - ALL PROFESSIONS
    const allSkills = [
      ...(data.skills.programming || []),
      ...(data.skills.frameworks || []),
      ...(data.skills.databases || []),
      ...(data.skills.tools || []),
      ...(data.skills.cloudPlatforms || []),
      ...(data.skills.business || []),
      ...(data.skills.marketing || []),
      ...(data.skills.sales || []),
      ...(data.skills.finance || []),
      ...(data.skills.healthcare || []),
      ...(data.skills.education || [])
    ].filter(Boolean).join(', ');
    populated = populated.replace(/\[CORE_SKILLS[^\]]*\]/g, allSkills);

    // Experience Section - ensure data.experience is an array
    if (Array.isArray(data.experience)) {
      data.experience.forEach((exp, index) => {
        const expNum = index + 1;
        populated = populated.replace(new RegExp(`\\[JOB_TITLE_${expNum}\\]`, 'g'), exp.jobTitle || '');
        populated = populated.replace(new RegExp(`\\[COMPANY_${expNum}\\]`, 'g'), exp.company || '');
        populated = populated.replace(new RegExp(`\\[LOCATION_${expNum}\\]`, 'g'), exp.location || '');
        populated = populated.replace(new RegExp(`\\[START_DATE_${expNum}\\]`, 'g'), exp.startDate || '');
        populated = populated.replace(new RegExp(`\\[END_DATE_${expNum}\\]`, 'g'), exp.endDate || '');
        
        // Achievements - ensure achievements is an array
        if (Array.isArray(exp.achievements)) {
          exp.achievements.forEach((achievement, achIndex) => {
            const achNum = achIndex + 1;
            populated = populated.replace(
              new RegExp(`\\[ACHIEVEMENT_${expNum}_${achNum}[^\\]]*\\]`, 'g'),
              achievement
            );
          });
        }
      });
    }

    // Education Section - ensure data.education is an array
    if (Array.isArray(data.education)) {
      data.education.forEach((edu, index) => {
        const eduNum = index + 1;
        populated = populated.replace(new RegExp(`\\[DEGREE_${eduNum}\\]`, 'g'), edu.degree || '');
        populated = populated.replace(new RegExp(`\\[MAJOR_${eduNum}\\]`, 'g'), edu.major || '');
        populated = populated.replace(new RegExp(`\\[UNIVERSITY_${eduNum}\\]`, 'g'), edu.university || '');
        populated = populated.replace(new RegExp(`\\[UNIVERSITY_LOCATION_${eduNum}\\]`, 'g'), edu.location || '');
        populated = populated.replace(new RegExp(`\\[GRADUATION_DATE_${eduNum}\\]`, 'g'), edu.graduationDate || '');
      });
    }

    // Skills Section (ALL PROFESSIONS)
    populated = populated.replace(/\[PROGRAMMING_LANGUAGES\]/g, (data.skills.programming || []).join(', '));
    populated = populated.replace(/\[FRAMEWORKS_LIBRARIES\]/g, (data.skills.frameworks || []).join(', '));
    populated = populated.replace(/\[DATABASES\]/g, (data.skills.databases || []).join(', '));
    populated = populated.replace(/\[TOOLS_SOFTWARE\]/g, [...(data.skills.tools || []), ...(data.skills.business || [])].join(', '));
    populated = populated.replace(/\[CLOUD_PLATFORMS\]/g, (data.skills.cloudPlatforms || []).join(', '));
    populated = populated.replace(/\[DATABASE_SYSTEMS\]/g, (data.skills.databases || []).join(', '));
    populated = populated.replace(/\[CLOUD_DEVOPS_TOOLS\]/g, (data.skills.cloudPlatforms || []).join(', '));
    populated = populated.replace(/\[DEVELOPMENT_TOOLS\]/g, (data.skills.tools || []).join(', '));
    
    // Dynamic methodologies based on profession
    const methodologies = [
      ...(data.skills.programming?.length ? ['Agile', 'Scrum', 'DevOps', 'CI/CD'] : []),
      ...(data.skills.marketing?.length ? ['A/B Testing', 'Data-Driven Marketing', 'Growth Hacking'] : []),
      ...(data.skills.sales?.length ? ['Consultative Selling', 'SPIN Selling', 'Solution Selling'] : []),
      ...(data.skills.finance?.length ? ['Financial Modeling', 'Risk Assessment', 'Variance Analysis'] : []),
      ...(data.skills.healthcare?.length ? ['Evidence-Based Practice', 'Quality Improvement', 'Patient Safety'] : []),
      ...(data.skills.education?.length ? ['Differentiated Instruction', 'Assessment Strategies', 'Classroom Management'] : [])
    ];
    populated = populated.replace(/\[METHODOLOGIES\]/g, methodologies.join(', ') || 'Strategic Planning, Process Improvement, Team Collaboration');

    // Projects Section - ensure data.projects is an array
    if (Array.isArray(data.projects)) {
      data.projects.forEach((project, index) => {
        const projNum = index + 1;
        populated = populated.replace(new RegExp(`\\[PROJECT_${projNum}_NAME\\]`, 'g'), project.name || '');
        populated = populated.replace(new RegExp(`\\[PROJECT_${projNum}_DATE\\]`, 'g'), project.date || '');
        populated = populated.replace(new RegExp(`\\[PROJECT_${projNum}_TECHNOLOGIES\\]`, 'g'), (Array.isArray(project.technologies) ? project.technologies : []).join(', '));
        populated = populated.replace(new RegExp(`\\[PROJECT_TYPE_${projNum}\\]`, 'g'), 'Personal Project');
        populated = populated.replace(new RegExp(`\\[PROJECT_${projNum}_IMPACT\\]`, 'g'), 'Enhanced user experience and system performance');
        
        // Project descriptions - ensure description is an array
        if (Array.isArray(project.description)) {
          project.description.forEach((desc, descIndex) => {
            const descNum = descIndex + 1;
            populated = populated.replace(
              new RegExp(`\\[PROJECT_${projNum}_DESCRIPTION_${descNum}\\]`, 'g'),
              desc
            );
          });
        }
      });
    }

    // Certifications Section - ensure data.certifications is an array
    if (Array.isArray(data.certifications)) {
      data.certifications.forEach((cert, index) => {
        const certNum = index + 1;
        populated = populated.replace(new RegExp(`\\[CERTIFICATION_${certNum}\\]`, 'g'), cert.name || '');
        populated = populated.replace(new RegExp(`\\[ISSUING_ORGANIZATION_${certNum}\\]`, 'g'), cert.organization || '');
        populated = populated.replace(new RegExp(`\\[CERT_DATE_${certNum}\\]`, 'g'), cert.date || '');
      });
    }

    // Additional Information
    populated = populated.replace(/\[LANGUAGES_WITH_PROFICIENCY\]/g, data.additionalInfo.languages || 'English (Native)');
    populated = populated.replace(/\[VOLUNTEER_EXPERIENCE\]/g, data.additionalInfo.volunteer || '');
    populated = populated.replace(/\[PROFESSIONAL_ASSOCIATIONS\]/g, data.additionalInfo.associations || '');
    populated = populated.replace(/\[ACADEMIC_PROJECTS\]/g, 'Various coursework projects in software development');

    // Clean up any remaining placeholders
    populated = populated.replace(/\[[A-Z_0-9]+[^\]]*\]/g, '');

    return populated;
  }
}

// Export for backward compatibility
export const AIResumeGeneratorService = OptimizedAIResumeService;
export default OptimizedAIResumeService;
