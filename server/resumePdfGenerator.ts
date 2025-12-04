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

    const sanitizeSummary = (summary: string | undefined): string => {
      if (!summary) return '';
      let cleaned = summary.trim();
      const sectionHeaders = [
        /^CAREER\s+OBJECTIVE\s*/i,
        /^PROFESSIONAL\s+SUMMARY\s*/i,
        /^SUMMARY\s*/i,
        /^OBJECTIVE\s*/i,
        /^PROFILE\s*/i,
        /^ABOUT\s+ME\s*/i
      ];
      for (const pattern of sectionHeaders) {
        cleaned = cleaned.replace(pattern, '');
      }
      return cleaned.trim();
    };

    const isValidEducation = (edu: any): boolean => {
      if (!edu) return false;
      const inst = (edu.institution || '').trim().toLowerCase();
      const deg = (edu.degree || '').trim().toLowerCase();
      if (inst === 'university' && !deg) return false;
      if (deg === 'university' && !inst) return false;
      if (!inst && !deg) return false;
      if (inst.length < 3 && deg.length < 3) return false;
      return true;
    };

    const cleanEducation = (edu: any) => {
      const institution = (edu.institution || '').trim();
      const degree = (edu.degree || '').trim();
      if (institution.toLowerCase() === 'university' && degree.length > 5) {
        return { ...edu, institution: '', achievements: toStringArray(edu.achievements || []) };
      }
      if (degree.toLowerCase() === 'university' && institution.length > 5) {
        return { ...edu, degree: institution, institution: '', achievements: toStringArray(edu.achievements || []) };
      }
      return { ...edu, achievements: toStringArray(edu.achievements || []) };
    };

    return {
      ...data,
      summary: sanitizeSummary(data.summary),
      skills: toStringArray(data.skills || []),
      certifications: toStringArray(data.certifications || []),
      awards: toStringArray(data.awards || []),
      experience: (data.experience || []).map(exp => ({
        ...exp,
        bulletPoints: toStringArray(exp.bulletPoints || [])
      })),
      education: (data.education || [])
        .filter(isValidEducation)
        .map(cleanEducation),
      projects: (data.projects || []).map(proj => ({
        ...proj,
        technologies: toStringArray(proj.technologies || [])
      }))
    };
  }

  /**
   * Helper to check if we need a page break
   */
  private shouldAddPageBreak(doc: PDFKit.PDFDocument, estimatedHeight: number = 100): boolean {
    const bottomMargin = doc.page.margins.bottom;
    const pageHeight = doc.page.height;
    const currentY = doc.y;
    return (currentY + estimatedHeight + bottomMargin) > pageHeight;
  }

  /**
   * Check remaining space on current page
   */
  private getRemainingSpace(doc: PDFKit.PDFDocument): number {
    const bottomMargin = doc.page.margins.bottom;
    const pageHeight = doc.page.height;
    const currentY = doc.y;
    return pageHeight - currentY - bottomMargin;
  }

  /**
   * Check if we can fit content in 1-page mode
   */
  private canFitInOnePage(doc: PDFKit.PDFDocument, estimatedHeight: number): boolean {
    return this.getRemainingSpace(doc) >= estimatedHeight;
  }

  /**
   * Harvard/MIT/Stanford Style Resume Template
   * Professional, ATS-friendly layout with 1-page or 2-page optimization
   */
  private generateHarvardTemplate(doc: PDFKit.PDFDocument, data: ResumeData, pageFormat: '1-page' | '2-page' = '2-page') {
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Spacing configuration based on page format - ultra-tight for 1-page
    const spacing = pageFormat === '1-page' ? {
      headerName: 0.02,
      afterContact: 0.1,
      sectionGap: 0.08,
      beforeBullets: 0.03,
      betweenBullets: 0.02,
      betweenJobs: 0.08,
      fontSize: 8.5,
      titleSize: 9,
      nameSize: 14,
      lineGap: 0.1,
      sectionHeader: 9.5,
      maxSummaryChars: 400,
      maxBulletChars: 120
    } : {
      headerName: 0.2,
      afterContact: 0.5,
      sectionGap: 0.5,
      beforeBullets: 0.2,
      betweenBullets: 0.2,
      betweenJobs: 0.3,
      fontSize: 10,
      titleSize: 10.5,
      nameSize: 18,
      lineGap: 1.5,
      sectionHeader: 11,
      maxSummaryChars: 1000,
      maxBulletChars: 300
    };

    // Helper to truncate text for 1-page format
    const truncateText = (text: string, maxChars: number): string => {
      if (text.length <= maxChars) return text;
      return text.substring(0, maxChars - 3).trim() + '...';
    };

    // Safety threshold for 1-page mode - stop adding sections if we're too close to bottom
    const SAFETY_MARGIN = 50; // minimum pixels to reserve at bottom (increased for extra safety)
    
    // Helper to check if we should stop rendering in 1-page mode
    const shouldStopRendering = (): boolean => {
      if (pageFormat !== '1-page') return false;
      const remaining = this.getRemainingSpace(doc);
      if (remaining < SAFETY_MARGIN) {
        console.log(`📄 1-page mode: Stopping rendering at ${remaining}px remaining (safety margin: ${SAFETY_MARGIN}px)`);
        return true;
      }
      return false;
    };

    // Header - Name and Contact Info
    doc.fontSize(spacing.nameSize)
       .font('Times-Bold')
       .text(data.fullName.toUpperCase(), { align: 'center' });

    doc.moveDown(spacing.headerName);

    // Contact Information - Single line (phone | email | location)
    const contactInfo: string[] = [];
    if (data.phone) contactInfo.push(data.phone);
    if (data.email) contactInfo.push(data.email);
    if (data.location) contactInfo.push(data.location);
    
    if (contactInfo.length > 0) {
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(contactInfo.join(' | '), { align: 'center' });
      doc.moveDown(0.1); // Small gap before LinkedIn
    }

    // LinkedIn URL on separate line below contact info, BEFORE career objective
    if (data.linkedinUrl) {
      doc.fontSize(spacing.fontSize)
         .font('Times-Roman')
         .text(`LinkedIn: ${data.linkedinUrl}`, { align: 'center' });
    }

    doc.moveDown(spacing.afterContact);

    // CAREER OBJECTIVE - positioned after LinkedIn (with space check for 1-page)
    if (data.summary && !shouldStopRendering()) {
      const summaryEstHeight = 60;
      
      // Skip summary in 1-page mode if not enough space
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, summaryEstHeight + 200)) {
        console.log('📄 1-page mode: Skipping summary due to space constraints');
      } else {
        this.addSectionHeader(doc, 'CAREER OBJECTIVE', spacing.sectionHeader);
        // For 1-page, use even shorter summary
        const maxChars = pageFormat === '1-page' 
          ? Math.min(spacing.maxSummaryChars, 300) 
          : spacing.maxSummaryChars;
        const summaryText = truncateText(data.summary.trim(), maxChars);
        doc.fontSize(spacing.fontSize)
           .font('Times-Roman')
           .text(summaryText, { align: 'justify', lineGap: spacing.lineGap });
        doc.moveDown(spacing.sectionGap);
      }
    }

    // Work Experience - limit bullet points for 1-page format
    if (data.experience && data.experience.length > 0 && !shouldStopRendering()) {
      // Skip experience in 1-page mode if not enough space for at least one entry
      const minExpHeight = 60; // minimum height for one experience entry + header
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, minExpHeight + 150)) {
        console.log('📄 1-page mode: Skipping experience section due to space constraints');
      } else {
        if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, 150)) {
          doc.addPage();
        }
        
        // In 1-page mode, dynamically limit experiences based on available space
        let maxExperiences = pageFormat === '1-page' ? 2 : data.experience.length;
        
        if (pageFormat === '1-page') {
          const remainingSpace = this.getRemainingSpace(doc);
          const expEstHeight = 50; // estimated height per experience entry (compact)
          const reserveForOtherSections = 180; // reserve for education, skills, etc.
          const spaceForExp = remainingSpace - reserveForOtherSections;
          maxExperiences = Math.max(1, Math.min(2, Math.floor(spaceForExp / expEstHeight)));
          console.log(`📄 1-page mode: Remaining ${remainingSpace}px, showing ${maxExperiences} experience(s)`);
        }
        
        this.addSectionHeader(doc, 'PROFESSIONAL EXPERIENCE', spacing.sectionHeader);
        
        // For 1-page format, dynamically limit experiences
        const experienceToShow = data.experience.slice(0, maxExperiences);
        
        // Use for...of with break instead of forEach to allow early exit
        for (let index = 0; index < experienceToShow.length; index++) {
          const exp = experienceToShow[index];
          
          // In 1-page mode, stop rendering if we're running low on space
          if (pageFormat === '1-page') {
            const entryEstHeight = 45; // estimated height per experience entry
            if (shouldStopRendering() || !this.canFitInOnePage(doc, entryEstHeight)) {
              console.log(`📄 1-page mode: Stopping experience rendering at entry ${index+1}/${experienceToShow.length}`);
              break; // Properly exit the loop
            }
          }
          
          // Check if we need a page break for this experience entry (only for 2-page)
          if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, 100)) {
            doc.addPage();
          }
          
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

          // Bullet Points - limit for 1-page format
          if (exp.bulletPoints && exp.bulletPoints.length > 0) {
            doc.moveDown(spacing.beforeBullets);
            const bulletsToShow = pageFormat === '1-page' 
              ? exp.bulletPoints.slice(0, 2) 
              : exp.bulletPoints;
            
            for (const bullet of bulletsToShow) {
              // Check space before each bullet in 1-page mode
              if (pageFormat === '1-page' && shouldStopRendering()) {
                console.log('📄 1-page mode: Stopping bullet rendering due to space constraints');
                break;
              }
              
              const bulletX = doc.x;
              const bulletY = doc.y;
              const bulletText = truncateText(bullet, spacing.maxBulletChars);
              
              doc.fontSize(spacing.fontSize)
                 .font('Times-Roman')
                 .text('•', bulletX, bulletY, { continued: false })
                 .text('   ' + bulletText, bulletX, bulletY, { 
                   width: contentWidth,
                   lineGap: spacing.lineGap,
                   indent: 15
                 });
              
              doc.moveDown(spacing.betweenBullets);
            }
          }

          if (index < experienceToShow.length - 1) {
            doc.moveDown(spacing.betweenJobs);
          }
        }
        doc.moveDown(spacing.sectionGap);
      }
    }

    // Education - Clean, no repetition (skip in 1-page if no space)
    if (data.education && data.education.length > 0 && !shouldStopRendering()) {
      const eduEstHeight = 50;
      
      if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, 100)) {
        doc.addPage();
      }
      
      // Skip education in 1-page mode if no space
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, eduEstHeight + 120)) {
        console.log('📄 1-page mode: Skipping education section due to space constraints');
      } else {
        this.addSectionHeader(doc, 'EDUCATION', spacing.sectionHeader);
        
        // For 1-page, limit to most recent education
        const educationToShow = pageFormat === '1-page' 
          ? data.education.slice(0, 1) 
          : data.education;
        
        educationToShow.forEach((edu, index) => {
          // Skip if degree is empty or just whitespace
          if (!edu.degree || edu.degree.trim().length === 0) return;
          
          // Degree - Field of Study (BOLD)
          const degreeText = edu.fieldOfStudy 
            ? `${edu.degree} – ${edu.fieldOfStudy}` 
            : edu.degree;
          
          doc.fontSize(spacing.titleSize)
             .font('Times-Bold')
             .text(degreeText);

          // Institution name - only show if not empty
          if (edu.institution && edu.institution.trim().length > 0) {
            const institutionLine = edu.institution + 
              (edu.graduationYear ? ` | ${edu.graduationYear}` : '') +
              (edu.gpa ? ` | GPA: ${edu.gpa}` : '');
            
            doc.fontSize(spacing.fontSize)
               .font('Times-Roman')
               .text(institutionLine);
          }

          // Academic achievements on same line
          if (edu.achievements && edu.achievements.length > 0) {
            const achievementsText = 'Academic Performance: ' + edu.achievements.join(', ');
            doc.fontSize(spacing.fontSize)
               .font('Times-Roman')
               .text(achievementsText);
          }

          if (index < educationToShow.length - 1) {
            doc.moveDown(spacing.betweenJobs);
          }
        });
        doc.moveDown(spacing.sectionGap);
      }
    }

    // Technical Skills (skip in 1-page if no space)
    if (data.skills && data.skills.length > 0 && !shouldStopRendering()) {
      const skillsEstHeight = 40;
      
      if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, 80)) {
        doc.addPage();
      }
      
      // Skip skills in 1-page mode if no space
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, skillsEstHeight + 80)) {
        console.log('📄 1-page mode: Skipping skills section due to space constraints');
      } else {
        this.addSectionHeader(doc, 'TECHNICAL SKILLS', spacing.sectionHeader);
        
        // For 1-page, limit number of skills
        const skillsToShow = pageFormat === '1-page' 
          ? data.skills.slice(0, 12) 
          : data.skills;
        const skillsText = skillsToShow.join(' • ');
        doc.fontSize(spacing.fontSize)
           .font('Times-Roman')
           .text(skillsText, { align: 'left', lineGap: spacing.lineGap });
        
        doc.moveDown(spacing.sectionGap);
      }
    }

    // Projects - One compact paragraph per project (skip if no space in 1-page mode)
    if (data.projects && data.projects.length > 0 && !shouldStopRendering()) {
      const projectsEstHeight = pageFormat === '1-page' ? 80 : 150;
      
      if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, projectsEstHeight)) {
        doc.addPage();
      }
      
      // Skip projects section in 1-page mode if not enough space
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, projectsEstHeight)) {
        console.log('📄 1-page mode: Skipping projects section due to space constraints');
      } else {
        this.addSectionHeader(doc, 'KEY PROJECTS', spacing.sectionHeader);
        
        // For 1-page, limit projects
        const projectsToShow = pageFormat === '1-page' 
          ? data.projects.slice(0, 1) 
          : data.projects;
        
        projectsToShow.forEach((project, index) => {
          // Project name
          doc.fontSize(spacing.titleSize)
             .font('Times-Bold')
             .text(project.name);

          // Technologies on next line - compact for 1-page
          if (project.technologies && project.technologies.length > 0) {
            const techText = pageFormat === '1-page' 
              ? project.technologies.slice(0, 4).join(', ')
              : project.technologies.join(', ');
            doc.fontSize(spacing.fontSize)
               .font('Times-Italic')
               .text(`Technologies: ${techText}`);
          }

          // Description as paragraph - truncate for 1-page
          const descText = pageFormat === '1-page' 
            ? truncateText(project.description, 150)
            : project.description;
          doc.fontSize(spacing.fontSize)
             .font('Times-Roman')
             .text(descText, { lineGap: spacing.lineGap });

          if (index < projectsToShow.length - 1) {
            doc.moveDown(spacing.betweenJobs);
          }
        });
        doc.moveDown(spacing.sectionGap);
      }
    }

    // Certifications (skip if no space in 1-page mode)
    if (data.certifications && data.certifications.length > 0 && !shouldStopRendering()) {
      const certsEstHeight = pageFormat === '1-page' ? 50 : 100;
      
      if (pageFormat === '2-page' && this.shouldAddPageBreak(doc, certsEstHeight)) {
        doc.addPage();
      }
      
      // Skip certifications section in 1-page mode if not enough space
      if (pageFormat === '1-page' && !this.canFitInOnePage(doc, certsEstHeight)) {
        console.log('📄 1-page mode: Skipping certifications section due to space constraints');
      } else {
        this.addSectionHeader(doc, 'CERTIFICATIONS', spacing.sectionHeader);
        
        // For 1-page, limit certifications
        const certsToShow = pageFormat === '1-page' 
          ? data.certifications.slice(0, 2) 
          : data.certifications;
        
        certsToShow.forEach(cert => {
          const bulletX = doc.x;
          const bulletY = doc.y;
          const certText = pageFormat === '1-page' ? truncateText(cert, 80) : cert;
          
          doc.fontSize(spacing.fontSize)
             .font('Times-Roman')
             .text('•', bulletX, bulletY)
             .text('   ' + certText, bulletX, bulletY, { 
               width: contentWidth,
               lineGap: spacing.lineGap,
               indent: 15
             });
          
          doc.moveDown(spacing.betweenBullets);
        });
      }
    }
  }

  /**
   * Add a section header with underline (Harvard style)
   */
  private addSectionHeader(doc: PDFKit.PDFDocument, title: string, fontSize: number = 11) {
    doc.fontSize(fontSize)
       .font('Times-Bold')
       .text(title);

    const endY = doc.y;
    
    // Thin underline for professional look
    this.drawLine(doc, doc.page.margins.left, endY + 1, doc.page.width - doc.page.margins.right, endY + 1);
    
    doc.moveDown(fontSize === 10 ? 0.15 : 0.3);
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
