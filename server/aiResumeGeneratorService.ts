import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { apiKeyRotationService } from './apiKeyRotationService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export class AIResumeGeneratorService {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '..', 'ats_resume_templates.html');
  }

  async generateResumeFromUserData(userId: string, existingResumeText: string, targetJobDescription?: string): Promise<{ pdfBuffer: Buffer; resumeData: ResumeData }> {
    try {
      // Extract user data using AI
      const resumeData = await this.extractResumeDataWithAI(existingResumeText, targetJobDescription);
      
      // Generate PDF
      const pdfBuffer = await this.generatePDF(resumeData, 'professional'); // Default to professional template
      
      return { pdfBuffer, resumeData };
    } catch (error) {
      console.error('AI Resume Generation Error:', error);
      throw new Error('Failed to generate AI resume');
    }
  }

  private async extractResumeDataWithAI(resumeText: string, targetJobDescription?: string): Promise<ResumeData> {
    const prompt = `
You are an expert resume writer and ATS optimization specialist. Please analyze the following resume text and extract/enhance the information to create an optimized resume.

${targetJobDescription ? `Target Job Description: ${targetJobDescription}\n\n` : ''}

Resume Text: ${resumeText}

Please extract and enhance the following information, making it ATS-friendly and impactful:

1. Personal Information (name, email, phone, location, LinkedIn, portfolio)
2. Professional Summary (3-4 lines highlighting experience and achievements)
3. Work Experience (with quantified achievements)
4. Education
5. Technical Skills (categorized)
6. Projects (if applicable)
7. Certifications
8. Additional Information

Format the response as a JSON object with the following structure:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "professionalSummary": "string",
  "experience": [
    {
      "jobTitle": "string",
      "company": "string", 
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "major": "string",
      "university": "string",
      "location": "string", 
      "graduationDate": "string",
      "gpa": "string",
      "honors": "string",
      "coursework": "string"
    }
  ],
  "skills": {
    "programming": ["string"],
    "frameworks": ["string"],
    "databases": ["string"],
    "tools": ["string"],
    "cloudPlatforms": ["string"]
  },
  "projects": [
    {
      "name": "string",
      "date": "string",
      "description": ["string"],
      "technologies": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "organization": "string", 
      "date": "string"
    }
  ],
  "additionalInfo": {
    "languages": "string",
    "volunteer": "string",
    "associations": "string"
  }
}

Make sure to:
- Quantify achievements with specific numbers and percentages
- Use action verbs and industry keywords
- Optimize for ATS scanning
- Keep descriptions concise but impactful
- Fill in reasonable defaults if information is missing
`;

    try {
      const response = await apiKeyRotationService.executeWithGroqRotation(async (groqClient: any) => {
        const apiKey = groqClient.apiKey || process.env.GROQ_API_KEY;
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4000
          })
        });
        
        if (!groqResponse.ok) {
          throw new Error(`Groq API error: ${groqResponse.statusText}`);
        }
        
        return groqResponse.json();
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from AI');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const resumeData = JSON.parse(jsonMatch[0]);
      return resumeData;

    } catch (error) {
      console.error('AI extraction failed:', error);
      // Return fallback data structure
      return this.getFallbackResumeData(resumeText);
    }
  }

  private getFallbackResumeData(resumeText: string): ResumeData {
    // Basic fallback parsing
    return {
      personalInfo: {
        fullName: "Professional Name",
        email: "email@example.com",
        phone: "(555) 123-4567",
        location: "City, State"
      },
      professionalSummary: "Experienced professional with proven track record of delivering results in dynamic environments.",
      experience: [{
        jobTitle: "Professional Role",
        company: "Company Name",
        location: "City, State", 
        startDate: "2020",
        endDate: "Present",
        achievements: ["Key achievement with measurable impact"]
      }],
      education: [{
        degree: "Bachelor's Degree",
        major: "Major Field",
        university: "University Name",
        location: "City, State",
        graduationDate: "2020"
      }],
      skills: {
        programming: ["JavaScript", "Python"],
        frameworks: ["React", "Node.js"],
        databases: ["MySQL", "MongoDB"],
        tools: ["Git", "Docker"],
        cloudPlatforms: ["AWS", "Azure"]
      },
      projects: [{
        name: "Project Name",
        date: "2023",
        description: ["Project description with impact"],
        technologies: ["Tech Stack"]
      }],
      certifications: [],
      additionalInfo: {}
    };
  }

  private async generatePDF(resumeData: ResumeData, templateType: 'professional' | 'modern' = 'professional'): Promise<Buffer> {
    try {
      // Read the HTML template
      const templateHtml = await fs.readFile(this.templatePath, 'utf-8');
      
      // Populate template with data
      const populatedHtml = this.populateTemplate(templateHtml, resumeData, templateType);
      
      // Generate PDF using Puppeteer with Chrome path fallback
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu'
        ],
        executablePath: process.env.CHROME_EXECUTABLE_PATH || '/usr/bin/chromium-browser' || undefined
      });
      
      const page = await browser.newPage();
      await page.setContent(populatedHtml, { waitUntil: 'networkidle0' });
      
      // Add CSS to show only the selected template
      await page.addStyleTag({
        content: `
          .template-selector { display: none !important; }
          .resume-container { display: none !important; }
          .resume-container.${templateType === 'professional' ? 'template1' : 'template2'} { display: block !important; }
          .data-field::before { display: none !important; }
          body { background: white !important; }
        `
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in', 
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      await browser.close();
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private populateTemplate(html: string, data: ResumeData, templateType: string): string {
    let populated = html;
    
    // Personal Information
    populated = populated.replace(/\[FULL_NAME\]/g, data.personalInfo.fullName || 'Your Name');
    populated = populated.replace(/\[EMAIL\]/g, data.personalInfo.email || 'your.email@example.com');
    populated = populated.replace(/\[PHONE\]/g, data.personalInfo.phone || '(555) 123-4567');
    populated = populated.replace(/\[CITY, STATE\]/g, data.personalInfo.location || 'City, State');
    populated = populated.replace(/\[LOCATION\]/g, data.personalInfo.location || 'City, State');
    populated = populated.replace(/\[LINKEDIN_URL\]/g, data.personalInfo.linkedin || 'linkedin.com/in/yourprofile');
    populated = populated.replace(/\[LINKEDIN_PROFILE\]/g, data.personalInfo.linkedin || 'linkedin.com/in/yourprofile');
    populated = populated.replace(/\[PORTFOLIO_URL\]/g, data.personalInfo.portfolio || 'yourportfolio.com');
    populated = populated.replace(/\[PROFESSIONAL_TITLE\]/g, data.experience[0]?.jobTitle || 'Professional Title');

    // Professional Summary
    populated = populated.replace(/\[PROFESSIONAL_SUMMARY[^\]]*\]/g, data.professionalSummary);

    // Core Skills
    const allSkills = [
      ...data.skills.programming,
      ...data.skills.frameworks, 
      ...data.skills.databases,
      ...data.skills.tools,
      ...data.skills.cloudPlatforms
    ].join(', ');
    populated = populated.replace(/\[CORE_SKILLS[^\]]*\]/g, allSkills);

    // Experience
    data.experience.forEach((exp, index) => {
      const i = index + 1;
      populated = populated.replace(new RegExp(`\\[JOB_TITLE_${i}\\]`, 'g'), exp.jobTitle);
      populated = populated.replace(new RegExp(`\\[COMPANY_${i}\\]`, 'g'), exp.company);
      populated = populated.replace(new RegExp(`\\[LOCATION_${i}\\]`, 'g'), exp.location);
      populated = populated.replace(new RegExp(`\\[START_DATE_${i}\\]`, 'g'), exp.startDate);
      populated = populated.replace(new RegExp(`\\[END_DATE_${i}\\]`, 'g'), exp.endDate);
      populated = populated.replace(new RegExp(`\\[DATES_${i}\\]`, 'g'), `${exp.startDate} - ${exp.endDate}`);
      
      // Achievements
      exp.achievements.forEach((achievement, achIndex) => {
        populated = populated.replace(
          new RegExp(`\\[ACHIEVEMENT_${i}_${achIndex + 1}[^\\]]*\\]`, 'g'), 
          achievement
        );
      });
    });

    // Education
    data.education.forEach((edu, index) => {
      const i = index + 1;
      populated = populated.replace(new RegExp(`\\[DEGREE_${i}\\]`, 'g'), edu.degree);
      populated = populated.replace(new RegExp(`\\[MAJOR_${i}\\]`, 'g'), edu.major);
      populated = populated.replace(new RegExp(`\\[UNIVERSITY_${i}\\]`, 'g'), edu.university);
      populated = populated.replace(new RegExp(`\\[UNIVERSITY_LOCATION_${i}\\]`, 'g'), edu.location);
      populated = populated.replace(new RegExp(`\\[UNI_LOCATION_${i}\\]`, 'g'), edu.location);
      populated = populated.replace(new RegExp(`\\[GRADUATION_DATE_${i}\\]`, 'g'), edu.graduationDate);
      populated = populated.replace(new RegExp(`\\[GRAD_DATE_${i}\\]`, 'g'), edu.graduationDate);
      populated = populated.replace(new RegExp(`\\[GPA_${i}\\]`, 'g'), edu.gpa || 'N/A');
      populated = populated.replace(new RegExp(`\\[HONORS_${i}\\]`, 'g'), edu.honors || 'N/A');
      populated = populated.replace(new RegExp(`\\[RELEVANT_COURSEWORK_${i}\\]`, 'g'), edu.coursework || 'Relevant coursework');
    });

    // Technical Skills
    populated = populated.replace(/\[PROGRAMMING_LANGUAGES\]/g, data.skills.programming.join(', '));
    populated = populated.replace(/\[FRAMEWORKS_LIBRARIES\]/g, data.skills.frameworks.join(', '));
    populated = populated.replace(/\[DATABASES\]/g, data.skills.databases.join(', '));
    populated = populated.replace(/\[TOOLS_SOFTWARE\]/g, data.skills.tools.join(', '));
    populated = populated.replace(/\[CLOUD_PLATFORMS\]/g, data.skills.cloudPlatforms.join(', '));

    // Projects
    data.projects.forEach((project, index) => {
      const i = index + 1;
      populated = populated.replace(new RegExp(`\\[PROJECT_${i}_NAME\\]`, 'g'), project.name);
      populated = populated.replace(new RegExp(`\\[PROJECT_${i}_DATE\\]`, 'g'), project.date);
      populated = populated.replace(new RegExp(`\\[PROJECT_${i}_TECHNOLOGIES\\]`, 'g'), project.technologies.join(', '));
      
      project.description.forEach((desc, descIndex) => {
        populated = populated.replace(
          new RegExp(`\\[PROJECT_${i}_DESCRIPTION_${descIndex + 1}\\]`, 'g'),
          desc
        );
        populated = populated.replace(
          new RegExp(`\\[PROJECT_${i}_DESC${descIndex + 1}\\]`, 'g'),
          desc
        );
      });
    });

    // Certifications
    data.certifications.forEach((cert, index) => {
      const i = index + 1;
      populated = populated.replace(
        new RegExp(`\\[CERTIFICATION_${i}\\]`, 'g'),
        cert.name
      );
      populated = populated.replace(
        new RegExp(`\\[ISSUING_ORGANIZATION_${i}\\]`, 'g'),
        cert.organization
      );
      populated = populated.replace(
        new RegExp(`\\[CERT_DATE_${i}\\]`, 'g'),
        cert.date
      );
      populated = populated.replace(
        new RegExp(`\\[CERT_${i}\\]`, 'g'),
        `${cert.name} - ${cert.organization} (${cert.date})`
      );
    });

    // Additional Information
    populated = populated.replace(/\[LANGUAGES_WITH_PROFICIENCY\]/g, data.additionalInfo.languages || 'English (Native)');
    populated = populated.replace(/\[VOLUNTEER_EXPERIENCE\]/g, data.additionalInfo.volunteer || 'Various volunteer experiences');
    populated = populated.replace(/\[PROFESSIONAL_ASSOCIATIONS\]/g, data.additionalInfo.associations || 'Professional associations');

    // Clean up any remaining placeholders
    populated = populated.replace(/\[[A-Z_0-9\s\-,]*\]/g, '');

    return populated;
  }
}