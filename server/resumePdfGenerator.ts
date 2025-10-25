import htmlPdf from 'html-pdf-node';

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
   * Generate a professional ATS-friendly resume PDF
   */
  async generatePdf(resumeData: ResumeData, templateStyle: 'modern' | 'classic' | 'harvard' = 'harvard'): Promise<Buffer> {
    const html = this.generateHtml(resumeData, templateStyle);
    
    const options = {
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.75in',
        bottom: '0.5in',
        left: '0.75in'
      }
    };
    
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    return pdfBuffer as Buffer;
  }
  
  /**
   * Generate HTML template for resume
   */
  private generateHtml(data: ResumeData, templateStyle: string): string {
    switch (templateStyle) {
      case 'harvard':
        return this.generateHarvardTemplate(data);
      case 'modern':
        return this.generateModernTemplate(data);
      case 'classic':
        return this.generateClassicTemplate(data);
      default:
        return this.generateHarvardTemplate(data);
    }
  }
  
  /**
   * Harvard/MIT/Stanford Style Resume Template
   * Single column, clean, ATS-friendly
   */
  private generateHarvardTemplate(data: ResumeData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #000000;
      background: white;
    }
    
    .container {
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #000;
      padding-bottom: 8px;
    }
    
    .name {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    
    .contact-info {
      font-size: 10pt;
      color: #333;
    }
    
    .contact-info a {
      color: #0066cc;
      text-decoration: none;
    }
    
    /* Section Headers */
    .section {
      margin-bottom: 14px;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 6px;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
    }
    
    /* Summary */
    .summary {
      margin-bottom: 4px;
      text-align: justify;
    }
    
    /* Experience */
    .experience-item, .education-item, .project-item {
      margin-bottom: 10px;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    
    .item-title {
      font-weight: bold;
    }
    
    .item-subtitle {
      font-style: italic;
      margin-bottom: 3px;
    }
    
    .item-dates {
      font-style: italic;
      white-space: nowrap;
    }
    
    .bullet-points {
      margin-left: 20px;
      margin-top: 3px;
    }
    
    .bullet-points li {
      margin-bottom: 3px;
      line-height: 1.4;
    }
    
    /* Skills */
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .skill-item {
      display: inline;
    }
    
    .skill-item:not(:last-child)::after {
      content: " • ";
    }
    
    /* Two Column Layout for Education */
    .two-column {
      display: flex;
      justify-content: space-between;
    }
    
    /* Page break control */
    .no-break {
      page-break-inside: avoid;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header -->
    <div class="header">
      <div class="name">${this.escapeHtml(data.fullName)}</div>
      <div class="contact-info">
        ${data.email}${data.phone ? ' • ' + data.phone : ''}${data.location ? ' • ' + data.location : ''}
        ${data.linkedinUrl ? '<br><a href="' + data.linkedinUrl + '">LinkedIn</a>' : ''}${data.githubUrl ? ' • <a href="' + data.githubUrl + '">GitHub</a>' : ''}${data.portfolioUrl ? ' • <a href="' + data.portfolioUrl + '">Portfolio</a>' : ''}
      </div>
    </div>
    
    ${data.summary ? `
    <!-- Summary -->
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${this.escapeHtml(data.summary)}</div>
    </div>
    ` : ''}
    
    <!-- Education -->
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <div class="section-title">Education</div>
      ${data.education.map(edu => `
        <div class="education-item no-break">
          <div class="item-header">
            <div>
              <div class="item-title">${this.escapeHtml(edu.institution)}</div>
              <div class="item-subtitle">${this.escapeHtml(edu.degree)}${edu.fieldOfStudy ? ', ' + this.escapeHtml(edu.fieldOfStudy) : ''}</div>
            </div>
            <div class="item-dates">${edu.graduationYear || ''}</div>
          </div>
          ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
          ${edu.achievements && edu.achievements.length > 0 ? `
            <ul class="bullet-points">
              ${edu.achievements.map(achievement => `<li>${this.escapeHtml(achievement)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Experience -->
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${data.experience.map(exp => `
        <div class="experience-item no-break">
          <div class="item-header">
            <div>
              <div class="item-title">${this.escapeHtml(exp.company)} - ${this.escapeHtml(exp.position)}</div>
              ${exp.location ? `<div class="item-subtitle">${this.escapeHtml(exp.location)}</div>` : ''}
            </div>
            <div class="item-dates">${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}</div>
          </div>
          ${exp.bulletPoints && exp.bulletPoints.length > 0 ? `
            <ul class="bullet-points">
              ${exp.bulletPoints.map(bullet => `<li>${this.escapeHtml(bullet)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Skills -->
    ${data.skills && data.skills.length > 0 ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-list">
        ${data.skills.map(skill => `<span class="skill-item">${this.escapeHtml(skill)}</span>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- Projects -->
    ${data.projects && data.projects.length > 0 ? `
    <div class="section">
      <div class="section-title">Projects</div>
      ${data.projects.map(project => `
        <div class="project-item no-break">
          <div class="item-title">${this.escapeHtml(project.name)}${project.url ? ' • <a href="' + project.url + '">' + project.url + '</a>' : ''}</div>
          <div>${this.escapeHtml(project.description)}</div>
          ${project.technologies ? `<div><em>Technologies: ${project.technologies.join(', ')}</em></div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Certifications -->
    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <ul class="bullet-points">
        ${data.certifications.map(cert => `<li>${this.escapeHtml(cert)}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <!-- Awards -->
    ${data.awards && data.awards.length > 0 ? `
    <div class="section">
      <div class="section-title">Awards & Achievements</div>
      <ul class="bullet-points">
        ${data.awards.map(award => `<li>${this.escapeHtml(award)}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
  </div>
</body>
</html>
    `.trim();
  }
  
  /**
   * Modern Resume Template (Alternative style)
   */
  private generateModernTemplate(data: ResumeData): string {
    // Similar structure but with modern styling
    return this.generateHarvardTemplate(data); // For now, use Harvard template
  }
  
  /**
   * Classic Resume Template (Traditional style)
   */
  private generateClassicTemplate(data: ResumeData): string {
    // Similar structure but with classic styling
    return this.generateHarvardTemplate(data); // For now, use Harvard template
  }
  
  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export const resumePdfGenerator = new ResumePdfGenerator();
