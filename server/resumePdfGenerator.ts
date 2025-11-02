import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface ResumeData {
  // Personal Information
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Professional Summary (AI-modified for job targeting)
  summary?: string;
  
  // Work Experience (AI-modifies bullet points)
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    bulletPoints: string[];
  }>;
  
  // Education
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationYear?: number;
    gpa?: string;
    achievements?: string[];
  }>;
  
  // Skills (AI-reorders based on job relevance)
  skills: string[];
  
  // Projects (optional)
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
  
  // Certifications
  certifications?: string[];
  
  // Awards
  awards?: string[];
}

export class ResumePdfGenerator {
  
  /**
   * Generate a professional ATS-friendly resume PDF using PDFKit
   */
  async generatePdf(resumeData: ResumeData, templateStyle: 'modern' | 'classic' | 'harvard' = 'harvard'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 36, bottom: 36, left: 45, right: 45 }
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        console.log('📄 Generating PDF with data:', {
          name: resumeData.fullName,
          phone: resumeData.phone || 'N/A',
          location: resumeData.location || 'N/A',
          experience: resumeData.experience?.length || 0,
          education: resumeData.education?.length || 0,
          skills: resumeData.skills?.length || 0
        });

        // Sanitize data to prevent [object Object] errors
        const sanitizedData = this.sanitizeResumeData(resumeData);

        // Generate content based on template
        this.generateHarvardTemplate(doc, sanitizedData);

        doc.end();
      } catch (error) {
        console.error('❌ PDF generation error:', error);
        reject(error);
      }
    });
  }

  private sanitizeResumeData(data: ResumeData): ResumeData {
    const toStringArray = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          return item.text || item.description || item.name || item.value || String(item);
        }
        return String(item);
      }).filter(s => s && s.length > 0 && s !== '[object Object]');
    };

    return {
      ...data,
      skills: toStringArray(data.skills || []),
      certifications: toStringArray(data.certifications || []),
      awards: toStringArray(data.awards || []),
      experience: (data.experience || []).map(exp => ({
        ...exp,
        bulletPoints: toStringArray(exp.bulletPoints || [])
      })),
      education: (data.education || []).map(edu => ({
        ...edu,
        achievements: toStringArray(edu.achievements || [])
      })),
      projects: (data.projects || []).map(proj => ({
        ...proj,
        technologies: toStringArray(proj.technologies || [])
      }))
    };
  }

  /**
   * Harvard/MIT/Stanford Style Resume Template
   * Professional, ATS-friendly, single-column layout with Times Roman font
   */
  private generateHarvardTemplate(doc: PDFKit.PDFDocument, data: ResumeData) {
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header - Name and Contact Info (Professional, clean header)
    doc.fontSize(20)
       .font('Times-Bold')
       .text(data.fullName.toUpperCase(), { align: 'center' });

    doc.moveDown(0.2);

    // Contact Information - Single line, professional format
    const contactInfo: string[] = [];
    if (data.phone) contactInfo.push(data.phone);
    if (data.email) contactInfo.push(data.email);
    if (data.location) contactInfo.push(data.location);
    
    if (contactInfo.length > 0) {
      doc.fontSize(10)
         .font('Times-Roman')
         .text(contactInfo.join(' | '), { align: 'center' });
    }

    // Links (LinkedIn, GitHub, Portfolio) - Professional format
    const links: string[] = [];
    if (data.linkedinUrl) {
      const linkedinHandle = data.linkedinUrl.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '');
      links.push(`LinkedIn: ${linkedinHandle}`);
    }
    if (data.githubUrl) {
      const githubHandle = data.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '');
      links.push(`GitHub: ${githubHandle}`);
    }
    if (data.portfolioUrl) {
      links.push(`Portfolio: ${data.portfolioUrl.replace(/https?:\/\/(www\.)?/, '')}`);
    }
    
    if (links.length > 0) {
      doc.moveDown(0.15);
      doc.fontSize(9)
         .font('Times-Roman')
         .text(links.join(' | '), { align: 'center' });
    }

    doc.moveDown(0.6);

    // Career Objective (simplified summary)
    if (data.summary) {
      this.addSectionHeader(doc, 'CAREER OBJECTIVE');
      doc.fontSize(10)
         .font('Times-Roman')
         .text(data.summary, { align: 'left', lineGap: 1.5 });
      doc.moveDown(0.7);
    }

    // Work Experience
    if (data.experience && data.experience.length > 0) {
      this.addSectionHeader(doc, 'PROFESSIONAL EXPERIENCE');
      
      data.experience.forEach((exp, index) => {
        // Position and Company
        doc.fontSize(11)
           .font('Times-Bold')
           .text(exp.position + ' - ' + exp.company);

        // Location and Dates on same line
        const dateText = `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}`;
        const locationDate = exp.location ? `${exp.location} | ${dateText}` : dateText;
        
        doc.fontSize(10)
           .font('Times-Italic')
           .text(locationDate);

        // Bullet Points
        if (exp.bulletPoints && exp.bulletPoints.length > 0) {
          doc.moveDown(0.25);
          exp.bulletPoints.forEach(bullet => {
            const bulletX = doc.x;
            const bulletY = doc.y;
            
            doc.fontSize(10)
               .font('Times-Roman')
               .text('•', bulletX, bulletY, { continued: false })
               .text('   ' + bullet, bulletX, bulletY, { 
                 width: contentWidth,
                 lineGap: 1.2,
                 indent: 15
               });
            
            doc.moveDown(0.25);
          });
        }

        if (index < data.experience.length - 1) {
          doc.moveDown(0.4);
        }
      });
      doc.moveDown(0.7);
    }

    // Education
    if (data.education && data.education.length > 0) {
      this.addSectionHeader(doc, 'EDUCATION');
      
      data.education.forEach((edu, index) => {
        // Degree - Field of Study
        const degreeText = edu.fieldOfStudy 
          ? `${edu.degree} – ${edu.fieldOfStudy}` 
          : edu.degree;
        
        doc.fontSize(11)
           .font('Times-Bold')
           .text(degreeText);

        // University name
        doc.fontSize(10)
           .font('Times-Roman')
           .text(edu.institution);

        // Graduation year and GPA on same line
        if (edu.graduationYear || edu.gpa) {
          const eduDetails: string[] = [];
          if (edu.graduationYear) eduDetails.push(edu.graduationYear.toString());
          if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);
          
          doc.fontSize(10)
             .font('Times-Italic')
             .text(eduDetails.join(' | '));
        }

        // Academic performance/achievements
        if (edu.achievements && edu.achievements.length > 0) {
          doc.moveDown(0.2);
          const achievementsText = 'Academic Performance: ' + edu.achievements.join(', ');
          doc.fontSize(10)
             .font('Times-Roman')
             .text(achievementsText);
        }

        if (index < data.education.length - 1) {
          doc.moveDown(0.4);
        }
      });
      doc.moveDown(0.7);
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      this.addSectionHeader(doc, 'TECHNICAL SKILLS');
      
      const skillsText = data.skills.join(' • ');
      doc.fontSize(10)
         .font('Times-Roman')
         .text(skillsText, { align: 'left', lineGap: 1.5 });
      
      doc.moveDown(0.7);
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      this.addSectionHeader(doc, 'KEY PROJECTS');
      
      data.projects.forEach((project, index) => {
        doc.fontSize(11)
           .font('Times-Bold')
           .text(project.name);

        if (project.technologies && project.technologies.length > 0) {
          doc.fontSize(10)
             .font('Times-Italic')
             .text(`Technologies: ${project.technologies.join(', ')}`);
        }

        doc.moveDown(0.15);
        doc.fontSize(10)
           .font('Times-Roman')
           .text(project.description, { lineGap: 1.5 });

        if (index < data.projects.length - 1) {
          doc.moveDown(0.4);
        }
      });
      doc.moveDown(0.7);
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      this.addSectionHeader(doc, 'CERTIFICATIONS');
      
      data.certifications.forEach(cert => {
        const bulletX = doc.x;
        const bulletY = doc.y;
        
        doc.fontSize(10)
           .font('Times-Roman')
           .text('•', bulletX, bulletY)
           .text('   ' + cert, bulletX, bulletY, { 
             width: contentWidth,
             indent: 15
           });
        
        doc.moveDown(0.25);
      });
      doc.moveDown(0.4);
    }

    // Additional Information (if any awards exist)
    if (data.awards && data.awards.length > 0) {
      this.addSectionHeader(doc, 'ADDITIONAL INFORMATION');
      
      data.awards.forEach(award => {
        const bulletX = doc.x;
        const bulletY = doc.y;
        
        doc.fontSize(10)
           .font('Times-Roman')
           .text('•', bulletX, bulletY)
           .text('   ' + award, bulletX, bulletY, { 
             width: contentWidth,
             indent: 15
           });
        
        doc.moveDown(0.25);
      });
    }
  }

  /**
   * Add a section header with underline (Harvard style)
   */
  private addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(11)
       .font('Times-Bold')
       .text(title);

    const endY = doc.y;
    
    // Thin underline for professional look
    this.drawLine(doc, doc.page.margins.left, endY + 1, doc.page.width - doc.page.margins.right, endY + 1);
    
    doc.moveDown(0.4);
  }

  /**
   * Draw a horizontal line
   */
  private drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number) {
    doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(x1, y1)
       .lineTo(x2, y2)
       .stroke();
  }
}

export const resumePdfGenerator = new ResumePdfGenerator();
