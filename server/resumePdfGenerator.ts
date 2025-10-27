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
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
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

        // Generate content based on template
        this.generateHarvardTemplate(doc, resumeData);

        doc.end();
      } catch (error) {
        console.error('❌ PDF generation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Harvard/MIT/Stanford Style Resume Template
   * Professional, ATS-friendly, single-column layout
   */
  private generateHarvardTemplate(doc: PDFKit.PDFDocument, data: ResumeData) {
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header - Name and Contact Info
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .text(data.fullName.toUpperCase(), { align: 'center' });

    doc.moveDown(0.3);

    // Contact Information
    const contactInfo: string[] = [];
    if (data.phone) contactInfo.push(data.phone);
    if (data.email) contactInfo.push(data.email);
    if (data.location) contactInfo.push(data.location);
    
    if (contactInfo.length > 0) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(contactInfo.join(' | '), { align: 'center' });
    }

    // Links (LinkedIn, GitHub, Portfolio)
    const links: string[] = [];
    if (data.linkedinUrl) links.push(`LinkedIn: ${data.linkedinUrl}`);
    if (data.githubUrl) links.push(`GitHub: ${data.githubUrl}`);
    if (data.portfolioUrl) links.push(`Portfolio: ${data.portfolioUrl}`);
    
    if (links.length > 0) {
      doc.moveDown(0.2);
      doc.fontSize(9)
         .font('Helvetica')
         .text(links.join(' | '), { align: 'center' });
    }

    // Horizontal line under header
    doc.moveDown(0.5);
    this.drawLine(doc, margins.left, doc.y, pageWidth - margins.right, doc.y);
    doc.moveDown(0.5);

    // Professional Summary
    if (data.summary) {
      this.addSectionHeader(doc, 'PROFESSIONAL SUMMARY');
      doc.fontSize(10)
         .font('Helvetica')
         .text(data.summary, { align: 'justify', lineGap: 2 });
      doc.moveDown(0.8);
    }

    // Work Experience
    if (data.experience && data.experience.length > 0) {
      this.addSectionHeader(doc, 'PROFESSIONAL EXPERIENCE');
      
      data.experience.forEach((exp, index) => {
        // Job Title and Company
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(exp.position, { continued: true })
           .fontSize(10)
           .font('Helvetica')
           .text(` - ${exp.company}`);

        // Location and Dates
        const dateText = `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}`;
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .text(`${exp.location || ''} | ${dateText}`, { lineGap: 2 });

        // Bullet Points
        if (exp.bulletPoints && exp.bulletPoints.length > 0) {
          doc.moveDown(0.3);
          exp.bulletPoints.forEach(bullet => {
            const bulletX = doc.x;
            const bulletY = doc.y;
            
            doc.fontSize(10)
               .font('Helvetica')
               .text('•', bulletX, bulletY, { continued: false })
               .text(bullet, bulletX + 15, bulletY, { 
                 width: contentWidth - 15,
                 lineGap: 1
               });
            
            doc.moveDown(0.3);
          });
        }

        if (index < data.experience.length - 1) {
          doc.moveDown(0.5);
        }
      });
      doc.moveDown(0.8);
    }

    // Education
    if (data.education && data.education.length > 0) {
      this.addSectionHeader(doc, 'EDUCATION');
      
      data.education.forEach((edu, index) => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(edu.degree + (edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''));

        doc.fontSize(10)
           .font('Helvetica')
           .text(edu.institution);

        if (edu.graduationYear || edu.gpa) {
          const eduDetails: string[] = [];
          if (edu.graduationYear) eduDetails.push(`Graduated: ${edu.graduationYear}`);
          if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);
          
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .text(eduDetails.join(' | '), { lineGap: 2 });
        }

        if (edu.achievements && edu.achievements.length > 0) {
          doc.moveDown(0.3);
          edu.achievements.forEach(achievement => {
            const bulletX = doc.x;
            const bulletY = doc.y;
            
            doc.fontSize(10)
               .font('Helvetica')
               .text('•', bulletX, bulletY)
               .text(achievement, bulletX + 15, bulletY, { 
                 width: contentWidth - 15
               });
            
            doc.moveDown(0.2);
          });
        }

        if (index < data.education.length - 1) {
          doc.moveDown(0.5);
        }
      });
      doc.moveDown(0.8);
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      this.addSectionHeader(doc, 'TECHNICAL SKILLS');
      
      const skillsText = data.skills.join(' • ');
      doc.fontSize(10)
         .font('Helvetica')
         .text(skillsText, { align: 'left', lineGap: 2 });
      
      doc.moveDown(0.8);
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      this.addSectionHeader(doc, 'KEY PROJECTS');
      
      data.projects.forEach((project, index) => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(project.name);

        doc.fontSize(10)
           .font('Helvetica')
           .text(project.description, { lineGap: 2 });

        if (project.technologies && project.technologies.length > 0) {
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .text(`Technologies: ${project.technologies.join(', ')}`, { lineGap: 2 });
        }

        if (project.url) {
          doc.fontSize(9)
             .fillColor('blue')
             .text(project.url, { link: project.url })
             .fillColor('black');
        }

        if (index < data.projects.length - 1) {
          doc.moveDown(0.5);
        }
      });
      doc.moveDown(0.8);
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      this.addSectionHeader(doc, 'CERTIFICATIONS');
      
      data.certifications.forEach(cert => {
        const bulletX = doc.x;
        const bulletY = doc.y;
        
        doc.fontSize(10)
           .font('Helvetica')
           .text('•', bulletX, bulletY)
           .text(cert, bulletX + 15, bulletY, { width: contentWidth - 15 });
        
        doc.moveDown(0.3);
      });
    }
  }

  /**
   * Add a section header with underline
   */
  private addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    const startY = doc.y;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(title);

    const endY = doc.y;
    
    // Underline
    this.drawLine(doc, doc.page.margins.left, endY + 2, doc.page.width - doc.page.margins.right, endY + 2);
    
    doc.moveDown(0.5);
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
