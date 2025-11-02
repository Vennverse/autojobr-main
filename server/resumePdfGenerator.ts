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
  async generatePdf(resumeData: ResumeData, templateStyle: 'modern' | 'classic' | 'harvard' = 'harvard', pageFormat: '1-page' | '2-page' = '2-page'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Adjust margins based on page format
        const margins = pageFormat === '1-page' 
          ? { top: 32, bottom: 32, left: 40, right: 40 }  // Tighter for 1-page
          : { top: 40, bottom: 40, left: 50, right: 50 }; // Comfortable for 2-page

        const doc = new PDFDocument({
          size: 'LETTER',
          margins
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
          skills: resumeData.skills?.length || 0,
          pageFormat: pageFormat
        });

        // Sanitize data to prevent [object Object] errors
        const sanitizedData = this.sanitizeResumeData(resumeData);

        // Generate content based on template and page format
        this.generateHarvardTemplate(doc, sanitizedData, pageFormat);

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
   * Professional, ATS-friendly layout with 1-page or 2-page optimization
   */
  private generateHarvardTemplate(doc: PDFKit.PDFDocument, data: ResumeData, pageFormat: '1-page' | '2-page' = '2-page') {
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Spacing configuration based on page format
    const spacing = pageFormat === '1-page' ? {
      headerName: 0.1,
      afterContact: 0.35,
      sectionGap: 0.3,
      beforeBullets: 0.15,
      betweenBullets: 0.15,
      betweenJobs: 0.25,
      fontSize: 9.5,
      titleSize: 10,
      nameSize: 17
    } : {
      headerName: 0.2,
      afterContact: 0.5,
      sectionGap: 0.5,
      beforeBullets: 0.2,
      betweenBullets: 0.2,
      betweenJobs: 0.3,
      fontSize: 10,
      titleSize: 10.5,
      nameSize: 18
    };

    // Header - Name and Contact Info
    doc.fontSize(spacing.nameSize)
       .font('Times-Bold')
       .text(data.fullName.toUpperCase(), { align: 'center' });

    doc.moveDown(spacing.headerName);

    // Contact Information - Single line
    const contactInfo: string[] = [];
    if (data.phone) contactInfo.push(data.phone);
    if (data.email) contactInfo.push(data.email);
    if (data.location) contactInfo.push(data.location);
    
    if (contactInfo.length > 0) {
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(contactInfo.join(' | '), { align: 'center' });
    }

    // Add LinkedIn URL on separate line below contact info
    if (data.linkedinUrl) {
      const linkedinHandle = data.linkedinUrl.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '');
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(`LinkedIn: https://www.linkedin.com/in/${linkedinHandle}`, { align: 'center' });
    }

    doc.moveDown(spacing.afterContact);

    // Professional Summary - 2-3 line concise summary below LinkedIn
    if (data.summary) {
      this.addSectionHeader(doc, 'PROFESSIONAL SUMMARY');
      // Ensure summary is complete and well-formatted as 2-3 lines
      const summaryText = data.summary.trim();
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(summaryText, { align: 'justify', lineGap: pageFormat === '1-page' ? 1 : 1.5 });
      doc.moveDown(spacing.sectionGap);
    }

    // Work Experience
    if (data.experience && data.experience.length > 0) {
      this.addSectionHeader(doc, 'PROFESSIONAL EXPERIENCE');
      
      data.experience.forEach((exp, index) => {
        // Position - Company on one line
        doc.fontSize(spacing.titleSize)
           .font('Times-Bold')
           .text(exp.position + ' - ' + exp.company);

        // Location and Dates
        const dateText = `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}`;
        const locationDate = exp.location ? `${exp.location} | ${dateText}` : dateText;
        
        doc.fontSize(spacing.fontSize)
           .font('Times-Italic')
           .text(locationDate);

        // Bullet Points
        if (exp.bulletPoints && exp.bulletPoints.length > 0) {
          doc.moveDown(spacing.beforeBullets);
          exp.bulletPoints.forEach(bullet => {
            const bulletX = doc.x;
            const bulletY = doc.y;
            
            doc.fontSize(spacing.fontSize)
               .font('Times-Roman')
               .text('•', bulletX, bulletY, { continued: false })
               .text('   ' + bullet, bulletX, bulletY, { 
                 width: contentWidth,
                 lineGap: pageFormat === '1-page' ? 0.8 : 1,
                 indent: 15
               });
            
            doc.moveDown(spacing.betweenBullets);
          });
        }

        if (index < data.experience.length - 1) {
          doc.moveDown(spacing.betweenJobs);
        }
      });
      doc.moveDown(spacing.sectionGap);
    }

    // Education - Clean, no repetition
    if (data.education && data.education.length > 0) {
      this.addSectionHeader(doc, 'EDUCATION');
      
      data.education.forEach((edu, index) => {
        // Degree - Field of Study (BOLD)
        const degreeText = edu.fieldOfStudy 
          ? `${edu.degree} – ${edu.fieldOfStudy}` 
          : edu.degree;
        
        doc.fontSize(spacing.titleSize)
           .font('Times-Bold')
           .text(degreeText);

        // Institution name - Remove "University" repetition if needed
        const institutionLine = edu.institution + 
          (edu.graduationYear ? ` | ${edu.graduationYear}` : '') +
          (edu.gpa ? ` | GPA: ${edu.gpa}` : '');
        
        doc.fontSize(spacing.fontSize)
           .font('Times-Roman')
           .text(institutionLine);

        // Academic achievements on same line
        if (edu.achievements && edu.achievements.length > 0) {
          const achievementsText = 'Academic Performance: ' + edu.achievements.join(', ');
          doc.fontSize(spacing.fontSize)
             .font('Times-Roman')
             .text(achievementsText);
        }

        if (index < data.education.length - 1) {
          doc.moveDown(spacing.betweenJobs);
        }
      });
      doc.moveDown(spacing.sectionGap);
    }

    // Technical Skills
    if (data.skills && data.skills.length > 0) {
      this.addSectionHeader(doc, 'TECHNICAL SKILLS');
      
      const skillsText = data.skills.join(' • ');
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(skillsText, { align: 'left', lineGap: pageFormat === '1-page' ? 0.8 : 1.5 });
      
      doc.moveDown(spacing.sectionGap);
    }

    // Projects - One compact paragraph per project
    if (data.projects && data.projects.length > 0) {
      this.addSectionHeader(doc, 'KEY PROJECTS');
      
      data.projects.forEach((project, index) => {
        // Project name
        doc.fontSize(spacing.titleSize)
           .font('Times-Bold')
           .text(project.name);

        // Technologies on next line
        if (project.technologies && project.technologies.length > 0) {
          doc.fontSize(spacing.fontSize)
             .font('Times-Italic')
             .text(`Technologies: ${project.technologies.join(', ')}`);
        }

        // Description as paragraph
        doc.fontSize(spacing.fontSize)
           .font('Times-Roman')
           .text(project.description, { lineGap: pageFormat === '1-page' ? 0.8 : 1.5 });

        if (index < data.projects.length - 1) {
          doc.moveDown(spacing.betweenJobs);
        }
      });
      doc.moveDown(spacing.sectionGap);
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      this.addSectionHeader(doc, 'CERTIFICATIONS');
      
      data.certifications.forEach(cert => {
        const bulletX = doc.x;
        const bulletY = doc.y;
        
        doc.fontSize(spacing.fontSize)
           .font('Times-Roman')
           .text('•', bulletX, bulletY)
           .text('   ' + cert, bulletX, bulletY, { 
             width: contentWidth,
             lineGap: pageFormat === '1-page' ? 0.5 : 1,
             indent: 15
           });
        
        doc.moveDown(spacing.betweenBullets);
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
    
    doc.moveDown(0.3);
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
