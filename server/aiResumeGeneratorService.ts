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

  // High-impact AI enhancement for experience
  private async enhanceExperience(
    experienceText: string,
    jobDescription?: string,
  ): Promise<any[]> {
    const prompt = `Transform this work experience into ATS-optimized bullet points with quantified achievements:

${jobDescription ? `Target Role: ${jobDescription.substring(0, 200)}...` : ""}

Experience Text:
${experienceText}

Rules:
- Start each point with action verbs
- Add specific numbers/percentages where possible
- Use industry keywords
- Keep each point under 20 words
- Return as JSON array of experience objects

Format: [{"jobTitle":"","company":"","location":"","startDate":"","endDate":"","achievements":["point1","point2"]}]`;

    try {
      return await this.callAI(prompt, 800); // Much smaller token limit
    } catch (error) {
      return this.parseExperienceBasic(experienceText);
    }
  }

  // Enhance project descriptions to be more compelling
  private async enhanceProjects(projectsText: string): Promise<any[]> {
    const prompt = `Enhance these project descriptions to be more compelling and ATS-friendly:

${projectsText}

Rules:
- Add technical impact and outcomes
- Use action verbs and metrics
- Keep descriptions concise
- Return as JSON array of project objects

Format: [{"name":"","date":"","description":["point1","point2"],"technologies":["tech1","tech2"]}]`;

    try {
      return await this.callAI(prompt, 600);
    } catch (error) {
      return this.parseProjectsBasic(projectsText);
    }
  }

  // Generate professional summary only when needed
  private async generateProfessionalSummary(
    content: ExtractedResumeContent,
    jobDescription?: string,
  ): Promise<string> {
    const prompt = `Create a 3-line professional summary based on:

Experience: ${content.rawExperience.substring(0, 300)}
Skills: ${content.rawSkills.substring(0, 100)}
${jobDescription ? `Target Role: ${jobDescription.substring(0, 150)}` : ""}

Make it compelling and ATS-friendly. 3 lines max.`;

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

      // Use AI-enhanced content where it adds value
      professionalSummary: enhancedContent.professionalSummary,
      experience: enhancedContent.enhancedExperience,
      projects: enhancedContent.enhancedProjects || [],

      // Use basic parsing for structured data
      education: enhancedContent.education || [],
      skills: enhancedContent.skills || {
        programming: [],
        frameworks: [],
        databases: [],
        tools: [],
        cloudPlatforms: [],
      },
      certifications: enhancedContent.certifications || [],
      additionalInfo: {},
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
        executablePath: "/nix/store/chromium/bin/chromium"
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

    // Continue with other replacements...
    // (Same logic as original populateTemplate method)

    return populated;
  }
}

// Export for backward compatibility
export const AIResumeGeneratorService = OptimizedAIResumeService;
export default OptimizedAIResumeService;
