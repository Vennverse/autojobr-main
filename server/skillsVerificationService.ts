import { storage } from "./storage";
import { groqService } from "./groqService";
import { codeExecutionService } from "./codeExecutionService";
import { pistonService } from "./pistonService";
import { aiDetectionService } from "./aiDetectionService";
import { proctorService } from "./proctorService";
import { fileStorage } from "./fileStorage";
import { promises as fs } from 'fs';
import path from 'path';

interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  type: 'web_development' | 'data_analysis' | 'mobile_app' | 'api_development' | 'ui_design' | 'system_architecture';
  difficulty: 'junior' | 'mid' | 'senior' | 'lead';
  estimatedTime: number; // hours
  technologies: string[];
  deliverables: ProjectDeliverable[];
  evaluationCriteria: EvaluationCriteria[];
  resources: ProjectResource[];
}

interface ProjectDeliverable {
  id: string;
  name: string;
  type: 'code' | 'documentation' | 'design' | 'presentation' | 'demo';
  required: boolean;
  description: string;
  acceptedFormats: string[];
  maxFileSize?: number; // MB
}

interface EvaluationCriteria {
  category: string;
  weight: number; // percentage
  subcriteria: {
    name: string;
    description: string;
    maxScore: number;
  }[];
}

interface ProjectResource {
  type: 'documentation' | 'api_key' | 'dataset' | 'design_assets' | 'starter_code';
  name: string;
  url?: string;
  content?: string;
  accessInstructions?: string;
}

interface ProjectSubmission {
  deliverableId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  uploadedAt: Date;
  metadata: {
    fileSize: number;
    checksum: string;
    codeAnalysis?: any;
  };
}

interface SkillsVerificationResult {
  overallScore: number;
  categoryScores: { [category: string]: number };
  technicalCompetency: {
    codeQuality: number;
    problemSolving: number;
    bestPractices: number;
    performance: number;
    security: number;
  };
  projectManagement: {
    timeManagement: number;
    deliveryQuality: number;
    communicationQuality: number;
    documentationQuality: number;
  };
  innovation: {
    creativityScore: number;
    implementationNovelty: number;
    userExperience: number;
  };
  feedback: string;
  recommendations: string[];
  hiringRecommendation: 'strong_hire' | 'hire' | 'conditional' | 'no_hire';
  skillGaps: string[];
  certificationLevel: 'entry' | 'competent' | 'proficient' | 'expert';
}

export class SkillsVerificationService {
  private projectsPath = './uploads/skills-verification';
  private projectTemplates: ProjectTemplate[] = [];

  constructor() {
    this.ensureProjectsDirectory();
    this.initializeProjectTemplates();
  }

  private async ensureProjectsDirectory() {
    try {
      await fs.mkdir(this.projectsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating projects directory:', error);
    }
  }

  private initializeProjectTemplates(): void {
    this.projectTemplates = [
      {
        id: 'web_ecommerce_junior',
        title: 'E-commerce Product Catalog',
        description: 'Build a responsive product catalog with search and filtering functionality',
        type: 'web_development',
        difficulty: 'junior',
        estimatedTime: 8,
        technologies: ['HTML', 'CSS', 'JavaScript', 'React'],
        deliverables: [
          {
            id: 'source_code',
            name: 'Source Code',
            type: 'code',
            required: true,
            description: 'Complete source code for the product catalog',
            acceptedFormats: ['zip', 'tar.gz']
          },
          {
            id: 'demo_video',
            name: 'Demo Video',
            type: 'demo',
            required: true,
            description: 'Screen recording demonstrating functionality',
            acceptedFormats: ['mp4', 'webm'],
            maxFileSize: 100
          },
          {
            id: 'documentation',
            name: 'Technical Documentation',
            type: 'documentation',
            required: true,
            description: 'Setup instructions and technical decisions',
            acceptedFormats: ['md', 'pdf', 'txt']
          }
        ],
        evaluationCriteria: [
          {
            category: 'Technical Implementation',
            weight: 40,
            subcriteria: [
              { name: 'Code Quality', description: 'Clean, readable, maintainable code', maxScore: 25 },
              { name: 'Functionality', description: 'All requirements implemented correctly', maxScore: 25 },
              { name: 'Best Practices', description: 'Following industry standards', maxScore: 20 },
              { name: 'Performance', description: 'Optimized loading and responsiveness', maxScore: 15 },
              { name: 'Security', description: 'Basic security considerations', maxScore: 15 }
            ]
          },
          {
            category: 'User Experience',
            weight: 25,
            subcriteria: [
              { name: 'Design Quality', description: 'Visual appeal and consistency', maxScore: 40 },
              { name: 'Usability', description: 'Intuitive navigation and interaction', maxScore: 35 },
              { name: 'Responsiveness', description: 'Mobile and desktop compatibility', maxScore: 25 }
            ]
          },
          {
            category: 'Project Management',
            weight: 20,
            subcriteria: [
              { name: 'Documentation Quality', description: 'Clear setup and usage instructions', maxScore: 50 },
              { name: 'Code Organization', description: 'Logical file structure and naming', maxScore: 30 },
              { name: 'Git Usage', description: 'Meaningful commits and branching', maxScore: 20 }
            ]
          },
          {
            category: 'Innovation',
            weight: 15,
            subcriteria: [
              { name: 'Creative Solutions', description: 'Novel approaches to requirements', maxScore: 60 },
              { name: 'Extra Features', description: 'Value-added functionality beyond requirements', maxScore: 40 }
            ]
          }
        ],
        resources: [
          {
            type: 'design_assets',
            name: 'Product Images and Mockups',
            content: 'Sample product images and design mockups provided',
            accessInstructions: 'Download from project resources section'
          },
          {
            type: 'documentation',
            name: 'API Documentation',
            content: 'Mock API endpoints for product data',
            url: 'https://api.example.com/docs'
          }
        ]
      },
      {
        id: 'api_microservice_mid',
        title: 'User Management Microservice',
        description: 'Design and implement a RESTful microservice for user management with authentication',
        type: 'api_development',
        difficulty: 'mid',
        estimatedTime: 12,
        technologies: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Docker'],
        deliverables: [
          {
            id: 'api_source',
            name: 'API Source Code',
            type: 'code',
            required: true,
            description: 'Complete microservice implementation',
            acceptedFormats: ['zip', 'tar.gz']
          },
          {
            id: 'api_docs',
            name: 'API Documentation',
            type: 'documentation',
            required: true,
            description: 'OpenAPI/Swagger documentation',
            acceptedFormats: ['json', 'yaml', 'md']
          },
          {
            id: 'deployment_config',
            name: 'Deployment Configuration',
            type: 'code',
            required: true,
            description: 'Docker compose and deployment scripts',
            acceptedFormats: ['yml', 'yaml', 'sh']
          },
          {
            id: 'test_suite',
            name: 'Test Suite',
            type: 'code',
            required: true,
            description: 'Unit and integration tests',
            acceptedFormats: ['js', 'ts', 'json']
          }
        ],
        evaluationCriteria: [
          {
            category: 'API Design',
            weight: 30,
            subcriteria: [
              { name: 'RESTful Design', description: 'Proper REST principles and HTTP methods', maxScore: 30 },
              { name: 'Error Handling', description: 'Comprehensive error responses', maxScore: 25 },
              { name: 'Authentication', description: 'Secure JWT implementation', maxScore: 25 },
              { name: 'Validation', description: 'Input validation and sanitization', maxScore: 20 }
            ]
          },
          {
            category: 'Code Quality',
            weight: 25,
            subcriteria: [
              { name: 'Architecture', description: 'Clean separation of concerns', maxScore: 35 },
              { name: 'Code Style', description: 'Consistent formatting and naming', maxScore: 25 },
              { name: 'Error Handling', description: 'Robust error management', maxScore: 20 },
              { name: 'Performance', description: 'Efficient database queries and caching', maxScore: 20 }
            ]
          },
          {
            category: 'Testing & Documentation',
            weight: 25,
            subcriteria: [
              { name: 'Test Coverage', description: 'Comprehensive unit and integration tests', maxScore: 40 },
              { name: 'API Documentation', description: 'Clear and complete API docs', maxScore: 35 },
              { name: 'Setup Instructions', description: 'Easy deployment and setup', maxScore: 25 }
            ]
          },
          {
            category: 'DevOps & Security',
            weight: 20,
            subcriteria: [
              { name: 'Containerization', description: 'Proper Docker implementation', maxScore: 30 },
              { name: 'Security Best Practices', description: 'OWASP compliance and security headers', maxScore: 40 },
              { name: 'Monitoring', description: 'Logging and health check endpoints', maxScore: 30 }
            ]
          }
        ],
        resources: [
          {
            type: 'documentation',
            name: 'Database Schema',
            content: 'Recommended user data structure and relationships'
          },
          {
            type: 'api_key',
            name: 'External Service Keys',
            content: 'Test API keys for email service integration',
            accessInstructions: 'Keys provided via secure channel after project start'
          }
        ]
      },
      {
        id: 'data_dashboard_senior',
        title: 'Executive Analytics Dashboard',
        description: 'Build a real-time analytics dashboard with complex data visualizations and insights',
        type: 'data_analysis',
        difficulty: 'senior',
        estimatedTime: 16,
        technologies: ['Python', 'Pandas', 'Plotly', 'Streamlit', 'PostgreSQL'],
        deliverables: [
          {
            id: 'dashboard_app',
            name: 'Dashboard Application',
            type: 'code',
            required: true,
            description: 'Complete dashboard application with all features',
            acceptedFormats: ['zip', 'tar.gz']
          },
          {
            id: 'data_pipeline',
            name: 'Data Processing Pipeline',
            type: 'code',
            required: true,
            description: 'ETL pipeline for data ingestion and processing',
            acceptedFormats: ['py', 'sql', 'json']
          },
          {
            id: 'insights_report',
            name: 'Executive Insights Report',
            type: 'presentation',
            required: true,
            description: 'Business insights and recommendations',
            acceptedFormats: ['pdf', 'pptx']
          },
          {
            id: 'technical_architecture',
            name: 'Technical Architecture Document',
            type: 'documentation',
            required: true,
            description: 'System design and data flow documentation',
            acceptedFormats: ['md', 'pdf']
          }
        ],
        evaluationCriteria: [
          {
            category: 'Data Engineering',
            weight: 30,
            subcriteria: [
              { name: 'Data Pipeline', description: 'Efficient ETL processes', maxScore: 30 },
              { name: 'Data Quality', description: 'Validation and cleansing', maxScore: 25 },
              { name: 'Performance', description: 'Query optimization and caching', maxScore: 25 },
              { name: 'Scalability', description: 'Design for large datasets', maxScore: 20 }
            ]
          },
          {
            category: 'Analytics & Insights',
            weight: 25,
            subcriteria: [
              { name: 'Statistical Analysis', description: 'Appropriate statistical methods', maxScore: 30 },
              { name: 'Business Insights', description: 'Actionable business recommendations', maxScore: 40 },
              { name: 'Data Storytelling', description: 'Clear narrative and presentation', maxScore: 30 }
            ]
          },
          {
            category: 'Visualization & UX',
            weight: 25,
            subcriteria: [
              { name: 'Chart Selection', description: 'Appropriate visualization types', maxScore: 25 },
              { name: 'Interactivity', description: 'User-friendly interactive features', maxScore: 35 },
              { name: 'Design Quality', description: 'Professional appearance and layout', maxScore: 40 }
            ]
          },
          {
            category: 'Technical Architecture',
            weight: 20,
            subcriteria: [
              { name: 'System Design', description: 'Scalable and maintainable architecture', maxScore: 40 },
              { name: 'Code Quality', description: 'Clean, documented, and testable code', maxScore: 35 },
              { name: 'Documentation', description: 'Comprehensive technical documentation', maxScore: 25 }
            ]
          }
        ],
        resources: [
          {
            type: 'dataset',
            name: 'Sample Business Data',
            content: 'Realistic sales, marketing, and operational data',
            accessInstructions: 'Dataset available in CSV and JSON formats'
          },
          {
            type: 'documentation',
            name: 'Business Requirements',
            content: 'Detailed dashboard requirements and user personas'
          }
        ]
      }
    ];
  }

  async createSkillsVerification(
    candidateId: string,
    recruiterId: string,
    jobId: number,
    projectTemplateId: string,
    customizations?: {
      timeLimit?: number;
      additionalRequirements?: string;
      resources?: ProjectResource[];
    }
  ): Promise<any> {
    const template = this.projectTemplates.find(t => t.id === projectTemplateId);
    if (!template) throw new Error('Project template not found');

    // Apply customizations
    const finalTemplate = { ...template };
    if (customizations?.timeLimit) {
      finalTemplate.estimatedTime = customizations.timeLimit;
    }
    if (customizations?.resources) {
      finalTemplate.resources.push(...customizations.resources);
    }

    const verification = await storage.createSkillsVerification({
      candidateId,
      recruiterId,
      jobId,
      projectTemplateId,
      projectTemplate: JSON.stringify(finalTemplate),
      status: 'assigned',
      timeLimit: finalTemplate.estimatedTime,
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      customizations: customizations ? JSON.stringify(customizations) : null
    });

    // Create project workspace
    const workspacePath = path.join(this.projectsPath, `project_${verification.id}`);
    await fs.mkdir(workspacePath, { recursive: true });

    return { verification, template: finalTemplate };
  }

  async startProject(verificationId: number): Promise<string> {
    const verification = await storage.getSkillsVerification(verificationId);
    if (!verification) throw new Error('Verification not found');

    const sessionId = `skills_${verificationId}_${Date.now()}`;

    // Initialize monitoring
    await proctorService.initializeSession(sessionId, verification.candidateId, {
      sessionType: 'skills_verification',
      securityLevel: 'medium', // Less intrusive for project work
      enableActivityTracking: true,
      enablePeriodicCheckins: true
    });

    await storage.updateSkillsVerification(verificationId, {
      sessionId,
      status: 'in_progress',
      startedAt: new Date()
    });

    return sessionId;
  }

  async uploadDeliverable(
    verificationId: number,
    deliverableId: string,
    file: Buffer,
    fileName: string,
    metadata: any
  ): Promise<void> {
    const verification = await storage.getSkillsVerification(verificationId);
    if (!verification) throw new Error('Verification not found');

    const template: ProjectTemplate = JSON.parse(verification.projectTemplate);
    const deliverable = template.deliverables.find(d => d.id === deliverableId);
    if (!deliverable) throw new Error('Deliverable not found');

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!sanitizedFileName || sanitizedFileName === '.' || sanitizedFileName === '..') {
      throw new Error('Invalid filename');
    }

    // Validate file extension
    const fileExtension = path.extname(sanitizedFileName).substring(1).toLowerCase();
    
    // Normalize accepted formats (remove dots and handle compound extensions)
    const normalizedFormats = deliverable.acceptedFormats.map(format => format.replace('.', ''));
    
    if (!normalizedFormats.includes(fileExtension)) {
      throw new Error(`File format not accepted. Allowed: ${deliverable.acceptedFormats.join(', ')}`);
    }

    if (deliverable.maxFileSize && file.length > deliverable.maxFileSize * 1024 * 1024) {
      throw new Error(`File too large. Maximum size: ${deliverable.maxFileSize}MB`);
    }

    // Save file with sanitized name
    const workspacePath = path.join(this.projectsPath, `project_${verificationId}`);
    const filePath = path.join(workspacePath, `${deliverableId}_${sanitizedFileName}`);
    await fs.writeFile(filePath, file);

    // Analyze code if it's a code deliverable
    let codeAnalysis = null;
    if (deliverable.type === 'code' && ['js', 'ts', 'py', 'java', 'cpp'].includes(fileExtension)) {
      codeAnalysis = await this.analyzeCode(filePath, fileExtension);
    }

    // Store submission
    const submission: ProjectSubmission = {
      deliverableId,
      filePath,
      fileName,
      fileType: fileExtension,
      uploadedAt: new Date(),
      metadata: {
        fileSize: file.length,
        checksum: this.calculateChecksum(file),
        codeAnalysis
      }
    };

    await storage.createDeliverableSubmission({
      verificationId,
      deliverableId,
      filePath,
      fileName,
      fileType: fileExtension,
      fileSize: file.length,
      checksum: submission.metadata.checksum,
      codeAnalysis: codeAnalysis ? JSON.stringify(codeAnalysis) : null,
      uploadedAt: new Date()
    });
  }

  private async analyzeCode(filePath: string, language: string): Promise<any> {
    try {
      const code = await fs.readFile(filePath, 'utf-8');

      // Basic code metrics
      const lines = code.split('\n');
      const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#'));
      const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('#'));

      // Complexity analysis
      const cyclomaticComplexity = this.calculateCyclomaticComplexity(code, language);
      const maintainabilityIndex = this.calculateMaintainabilityIndex(code, language);

      // Security analysis
      const securityIssues = this.detectSecurityIssues(code, language);

      // Best practices check
      const bestPractices = this.checkBestPractices(code, language);

      return {
        metrics: {
          totalLines: lines.length,
          codeLines: codeLines.length,
          commentLines: commentLines.length,
          commentRatio: commentLines.length / Math.max(codeLines.length, 1),
          cyclomaticComplexity,
          maintainabilityIndex
        },
        quality: {
          securityIssues,
          bestPractices,
          overallScore: this.calculateCodeQualityScore({
            maintainabilityIndex,
            commentRatio: commentLines.length / Math.max(codeLines.length, 1),
            securityIssues: securityIssues.length,
            bestPracticesData: bestPractices // Pass the full object
          })
        }
      };
    } catch (error) {
      console.error('Error analyzing code:', error);
      return null;
    }
  }

  private calculateCyclomaticComplexity(code: string, language: string): number {
    // Fixed cyclomatic complexity calculation - removed 'else' patterns as they don't add complexity
    const complexityPatterns: { [key: string]: RegExp[] } = {
      javascript: [/\bif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g, /\?\s*[^:]*:/g], // Added ternary
      typescript: [/\bif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g, /\?\s*[^:]*:/g],
      python: [/\bif\b/g, /\belif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bexcept\b/g], // elif adds complexity, else doesn't
      java: [/\bif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g],
      cpp: [/\bif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g, /\?\s*[^:]*:/g]
    };

    const patterns = complexityPatterns[language] || complexityPatterns.javascript;
    let complexity = 1; // Base complexity

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  private calculateMaintainabilityIndex(code: string, language: string): number {
    // Simplified maintainability index (0-100, higher is better)
    const lines = code.split('\n').filter(line => line.trim());
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const complexity = this.calculateCyclomaticComplexity(code, language);

    // Simple formula based on various factors
    let index = 100;
    index -= Math.min(30, complexity * 2); // Complexity penalty
    index -= Math.min(20, Math.max(0, avgLineLength - 80) / 5); // Long line penalty
    index += Math.min(10, (code.match(/\/\/|#/g) || []).length / lines.length * 50); // Comment bonus

    return Math.max(0, Math.min(100, Math.round(index)));
  }

  private detectSecurityIssues(code: string, language: string): string[] {
    const issues: string[] = [];

    // Enhanced security patterns with proper regex
    const securityPatterns: { [key: string]: { pattern: RegExp; issue: string }[] } = {
      javascript: [
        { pattern: /eval\s*\(/g, issue: 'Use of eval() function (code injection risk)' },
        { pattern: /innerHTML\s*=/g, issue: 'Direct innerHTML assignment (XSS risk)' },
        { pattern: /document\.write\s*\(/g, issue: 'Use of document.write (XSS risk)' },
        { pattern: /password.*?=.*?['"][^'"]*['"]/gi, issue: 'Hardcoded password detected' }, // Fixed regex
        { pattern: /console\.log.*?password/gi, issue: 'Password logged to console' },
        { pattern: /localStorage\.setItem.*?password/gi, issue: 'Password stored in localStorage' }
      ],
      python: [
        { pattern: /exec\s*\(/g, issue: 'Use of exec() function (code injection risk)' },
        { pattern: /eval\s*\(/g, issue: 'Use of eval() function (code injection risk)' },
        { pattern: /pickle\.loads\s*\(/g, issue: 'Use of pickle.loads (deserialization risk)' },
        { pattern: /password.*?=.*?['"][^'"]*['"]/gi, issue: 'Hardcoded password detected' },
        { pattern: /os\.system\s*\(/g, issue: 'Use of os.system (command injection risk)' },
        { pattern: /subprocess\.call.*?shell\s*=\s*True/g, issue: 'Shell injection risk in subprocess' }
      ],
      java: [
        { pattern: /Runtime\.getRuntime\(\)\.exec/g, issue: 'Runtime.exec() usage (command injection risk)' },
        { pattern: /password.*?=.*?"[^"]*"/gi, issue: 'Hardcoded password detected' },
        { pattern: /PreparedStatement.*?\+/g, issue: 'Potential SQL injection in PreparedStatement' }
      ],
      cpp: [
        { pattern: /system\s*\(/g, issue: 'Use of system() function (command injection risk)' },
        { pattern: /strcpy\s*\(/g, issue: 'Use of strcpy (buffer overflow risk)' },
        { pattern: /gets\s*\(/g, issue: 'Use of gets() function (buffer overflow risk)' }
      ]
    };

    const patterns = securityPatterns[language] || securityPatterns.javascript;

    patterns.forEach(({ pattern, issue }) => {
      if (pattern.test(code)) {
        issues.push(issue);
      }
    });

    return issues;
  }

  private checkBestPractices(code: string, language: string): { passed: number; total: number; issues: string[] } {
    const issues: string[] = [];
    let passed = 0;
    let total = 0;

    const practices: { [key: string]: { check: RegExp | ((code: string) => boolean); description: string }[] } = {
      javascript: [
        { check: /const\s+/g, description: 'Uses const for constants' },
        { check: /let\s+/g, description: 'Uses let instead of var' },
        { check: (code: string) => !code.includes('var '), description: 'Avoids var declarations' },
        { check: /function\s+\w+\s*\([^)]*\)\s*{/g, description: 'Uses proper function declarations' }
      ],
      typescript: [
        { check: /const\s+/g, description: 'Uses const for constants' },
        { check: /let\s+/g, description: 'Uses let instead of var' },
        { check: (code: string) => !code.includes('var '), description: 'Avoids var declarations' },
        { check: /interface\s+\w+/g, description: 'Uses TypeScript interfaces' },
        { check: /:\s*\w+/g, description: 'Uses type annotations' }
      ],
      python: [
        { check: /def\s+\w+\s*\([^)]*\)\s*:/g, description: 'Uses proper function definitions' },
        { check: /class\s+\w+/g, description: 'Uses classes appropriately' },
        { check: (code: string) => code.includes('if __name__ == "__main__":'), description: 'Uses main guard' }
      ],
      java: [
        { check: /public\s+class\s+\w+/g, description: 'Uses proper class declarations' },
        { check: /private\s+\w+/g, description: 'Uses private fields' },
        { check: /public\s+static\s+void\s+main/g, description: 'Has main method' }
      ],
      cpp: [
        { check: /#include\s*<iostream>/g, description: 'Uses proper includes' },
        { check: /class\s+\w+/g, description: 'Uses classes' },
        { check: /namespace\s+std/g, description: 'Uses namespaces' }
      ]
    };

    const languagePractices = practices[language] || practices.javascript;

    languagePractices.forEach(({ check, description }) => {
      total++;
      if (typeof check === 'function' ? check(code) : check.test(code)) {
        passed++;
      } else {
        issues.push(description);
      }
    });

    return { passed, total, issues };
  }

  private calculateCodeQualityScore(metrics: any): number {
    let score = 100;

    // Maintainability penalty
    score -= Math.max(0, 100 - metrics.maintainabilityIndex) * 0.3;

    // Comment ratio bonus/penalty
    if (metrics.commentRatio < 0.1) score -= 10; // Too few comments
    else if (metrics.commentRatio > 0.1 && metrics.commentRatio < 0.3) score += 5; // Good ratio

    // Security issues penalty
    score -= metrics.securityIssues * 15;

    // Best practices penalty - use actual total from the check
    const bestPracticesData = metrics.bestPracticesData || { passed: 0, total: 1 };
    const practiceScore = (bestPracticesData.passed / bestPracticesData.total) * 20;
    score -= (20 - practiceScore);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateChecksum(buffer: Buffer): string {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      console.error('Error calculating checksum:', error);
      // Fallback to simple hash if crypto is not available
      return buffer.toString('base64').slice(0, 32);
    }
  }

  async submitProject(verificationId: number): Promise<SkillsVerificationResult> {
    const verification = await storage.getSkillsVerification(verificationId);
    if (!verification) throw new Error('Verification not found');

    let template: ProjectTemplate;
    try {
      template = JSON.parse(verification.projectTemplate);
    } catch (error) {
      throw new Error('Invalid project template data');
    }

    const submissions = await storage.getDeliverableSubmissions(verificationId);

    // Check if all required deliverables are submitted
    const requiredDeliverables = template.deliverables.filter(d => d.required);
    const submittedDeliverables = submissions.map(s => s.deliverableId);
    const missingDeliverables = requiredDeliverables.filter(d => !submittedDeliverables.includes(d.id));

    if (missingDeliverables.length > 0) {
      throw new Error(`Missing required deliverables: ${missingDeliverables.map(d => d.name).join(', ')}`);
    }

    // Evaluate project
    const result = await this.evaluateProject(template, submissions, verification);

    // Store results
    await storage.updateSkillsVerification(verificationId, {
      status: 'completed',
      completedAt: new Date(),
      results: JSON.stringify(result)
    });

    return result;
  }

  private async evaluateProject(
    template: ProjectTemplate,
    submissions: any[],
    verification: any
  ): Promise<SkillsVerificationResult> {
    const categoryScores: { [category: string]: number } = {};
    let totalWeightedScore = 0;

    // Evaluate each criteria category
    for (const criteria of template.evaluationCriteria) {
      const categoryScore = await this.evaluateCategory(criteria, submissions, template);
      categoryScores[criteria.category] = categoryScore;
      totalWeightedScore += categoryScore * (criteria.weight / 100);
    }

    const overallScore = Math.round(totalWeightedScore);

    // Calculate specific competency scores
    const technicalCompetency = this.calculateTechnicalCompetency(submissions);
    const projectManagement = this.calculateProjectManagement(submissions, verification);
    const innovation = this.calculateInnovation(submissions, template);

    // Generate feedback and recommendations
    const feedback = await this.generateProjectFeedback(template, categoryScores, submissions);
    const recommendations = this.generateRecommendations(categoryScores, technicalCompetency);
    const hiringRecommendation = this.determineHiringRecommendation(overallScore, categoryScores);
    const skillGaps = this.identifySkillGaps(categoryScores, template);
    const certificationLevel = this.determineCertificationLevel(overallScore, template.difficulty);

    return {
      overallScore,
      categoryScores,
      technicalCompetency,
      projectManagement,
      innovation,
      feedback,
      recommendations,
      hiringRecommendation,
      skillGaps,
      certificationLevel
    };
  }

  private async evaluateCategory(criteria: EvaluationCriteria, submissions: any[], template: ProjectTemplate): Promise<number> {
    let categoryScore = 0;
    let totalMaxScore = 0;

    for (const subcriteria of criteria.subcriteria) {
      const score = await this.evaluateSubcriteria(subcriteria, submissions, template, criteria.category);
      categoryScore += score;
      totalMaxScore += subcriteria.maxScore;
    }

    return totalMaxScore > 0 ? Math.round((categoryScore / totalMaxScore) * 100) : 0;
  }

  private async evaluateSubcriteria(subcriteria: any, submissions: any[], template: ProjectTemplate, category: string): Promise<number> {
    // This is a simplified evaluation. In production, this would involve more sophisticated analysis
    switch (subcriteria.name.toLowerCase()) {
      case 'code quality':
        return this.evaluateCodeQuality(submissions);
      case 'functionality':
        return this.evaluateFunctionality(submissions, template);
      case 'documentation quality':
        return this.evaluateDocumentation(submissions);
      case 'security':
        return this.evaluateSecurity(submissions);
      default:
        // Generic evaluation based on submission completeness and basic metrics
        return Math.floor(Math.random() * 20) + 60; // 60-80 range for demo
    }
  }

  private evaluateCodeQuality(submissions: any[]): number {
    const codeSubmissions = submissions.filter(s => s.codeAnalysis);
    if (codeSubmissions.length === 0) return 50;

    let totalScore = 0;
    codeSubmissions.forEach(submission => {
      const analysis = JSON.parse(submission.codeAnalysis);
      totalScore += analysis.quality.overallScore;
    });

    return Math.round(totalScore / codeSubmissions.length);
  }

  private evaluateFunctionality(submissions: any[], template: ProjectTemplate): number {
    // Check if demo/presentation exists and evaluate based on deliverables completeness
    const requiredDeliverables = template.deliverables.filter(d => d.required);
    const submittedDeliverables = submissions.map(s => s.deliverableId);
    const missingDeliverables = requiredDeliverables.filter(d => !submittedDeliverables.includes(d.id));

    const completionRate = ((requiredDeliverables.length - missingDeliverables.length) / requiredDeliverables.length) * 100;

    // Base score on completion rate with some randomness for demo
    return Math.min(100, Math.round(completionRate + (Math.random() * 20 - 10)));
  }

  private evaluateDocumentation(submissions: any[]): number {
    const docSubmissions = submissions.filter(s => s.fileName.includes('README') || s.fileType === 'md' || s.fileType === 'pdf');

    if (docSubmissions.length === 0) return 30;

    // Simple evaluation based on file size (proxy for comprehensiveness)
    const avgSize = docSubmissions.reduce((sum, doc) => sum + doc.fileSize, 0) / docSubmissions.length;

    if (avgSize > 5000) return 85; // Good documentation
    if (avgSize > 2000) return 70; // Adequate documentation
    if (avgSize > 500) return 55; // Minimal documentation
    return 40; // Insufficient documentation
  }

  private evaluateSecurity(submissions: any[]): number {
    const codeSubmissions = submissions.filter(s => s.codeAnalysis);
    if (codeSubmissions.length === 0) return 50;

    let totalSecurityIssues = 0;
    codeSubmissions.forEach(submission => {
      const analysis = JSON.parse(submission.codeAnalysis);
      totalSecurityIssues += analysis.quality.securityIssues.length;
    });

    // Score based on security issues found
    if (totalSecurityIssues === 0) return 95;
    if (totalSecurityIssues <= 2) return 75;
    if (totalSecurityIssues <= 5) return 55;
    return 30;
  }

  private calculateTechnicalCompetency(submissions: any[]): any {
    const codeSubmissions = submissions.filter(s => s.codeAnalysis);

    if (codeSubmissions.length === 0) {
      return {
        codeQuality: 50,
        problemSolving: 50,
        bestPractices: 50,
        performance: 50,
        security: 50
      };
    }

    let totalCodeQuality = 0;
    let totalSecurity = 0;
    let totalBestPractices = 0;

    codeSubmissions.forEach(submission => {
      const analysis = JSON.parse(submission.codeAnalysis);
      totalCodeQuality += analysis.quality.overallScore;
      totalSecurity += analysis.quality.securityIssues.length === 0 ? 100 : Math.max(0, 100 - analysis.quality.securityIssues.length * 20);
      totalBestPractices += (analysis.quality.bestPractices.passed / analysis.quality.bestPractices.total) * 100;
    });

    const count = codeSubmissions.length;

    return {
      codeQuality: Math.round(totalCodeQuality / count),
      problemSolving: Math.floor(Math.random() * 20) + 70, // Mock for demo
      bestPractices: Math.round(totalBestPractices / count),
      performance: Math.floor(Math.random() * 20) + 65, // Mock for demo
      security: Math.round(totalSecurity / count)
    };
  }

  private calculateProjectManagement(submissions: any[], verification: any): any {
    let timeSpent = 0;
    
    if (verification.completedAt && verification.startedAt) {
      try {
        const completedTime = new Date(verification.completedAt).getTime();
        const startTime = new Date(verification.startedAt).getTime();
        timeSpent = Math.max(0, (completedTime - startTime) / (1000 * 60 * 60)); // Ensure non-negative
      } catch (error) {
        console.warn('Error calculating time spent:', error);
        timeSpent = 0;
      }
    }

    const estimatedTime = verification.timeLimit || 8;
    let timeEfficiency = 100;
    
    if (timeSpent > 0 && timeSpent > estimatedTime) {
      timeEfficiency = Math.max(20, 100 - ((timeSpent - estimatedTime) / estimatedTime) * 50); // Cap minimum at 20%
    }

    const documentationSubmissions = submissions.filter(s =>
      s.fileName?.toLowerCase().includes('readme') ||
      s.fileType === 'md' ||
      s.fileType === 'pdf'
    );

    return {
      timeManagement: Math.round(timeEfficiency),
      deliveryQuality: submissions.length > 0 ? 85 : 0,
      communicationQuality: documentationSubmissions.length > 0 ? 80 : 50,
      documentationQuality: this.evaluateDocumentation(submissions)
    };
  }

  private calculateInnovation(submissions: any[], template: ProjectTemplate): any {
    const requiredDeliverables = template.deliverables.filter(d => d.required).length;
    const extraDeliverables = Math.max(0, submissions.length - requiredDeliverables);

    return {
      creativityScore: Math.min(100, 60 + extraDeliverables * 10),
      implementationNovelty: Math.floor(Math.random() * 30) + 60, // Mock for demo
      userExperience: Math.floor(Math.random() * 25) + 65 // Mock for demo
    };
  }

  private async generateProjectFeedback(template: ProjectTemplate, categoryScores: any, submissions: any[]): Promise<string> {
    let feedback = `Skills Verification Assessment - ${template.title}\n\n`;

    feedback += `Project Overview:\n`;
    feedback += `• Type: ${template.type.replace('_', ' ').toUpperCase()}\n`;
    feedback += `• Difficulty: ${template.difficulty.toUpperCase()}\n`;
    feedback += `• Technologies: ${template.technologies.join(', ')}\n`;
    feedback += `• Deliverables Submitted: ${submissions.length}\n\n`;

    feedback += `Category Performance:\n`;
    Object.entries(categoryScores).forEach(([category, score]) => {
      feedback += `• ${category}: ${score}/100\n`;
    });

    feedback += `\nKey Observations:\n`;

    // Technical feedback
    const codeSubmissions = submissions.filter(s => s.codeAnalysis);
    if (codeSubmissions.length > 0) {
      feedback += `• Code Quality: Demonstrates ${categoryScores['Technical Implementation'] >= 80 ? 'excellent' : categoryScores['Technical Implementation'] >= 60 ? 'good' : 'developing'} technical skills\n`;
    }

    // Documentation feedback
    const docSubmissions = submissions.filter(s => s.fileName.includes('README') || s.fileType === 'md' || s.fileType === 'pdf');
    if (docSubmissions.length > 0) {
      feedback += `• Documentation: ${docSubmissions.length > 0 ? 'Comprehensive documentation provided' : 'Limited documentation'}\n`;
    }

    // Innovation feedback
    const requiredCount = template.deliverables.filter(d => d.required).length;
    if (submissions.length > requiredCount) {
      feedback += `• Innovation: Went beyond requirements with additional deliverables\n`;
    }

    return feedback;
  }

  private generateRecommendations(categoryScores: any, technicalCompetency: any): string[] {
    const recommendations: string[] = [];

    // Technical recommendations
    if (technicalCompetency.codeQuality < 70) {
      recommendations.push('Focus on improving code quality and documentation');
    }
    if (technicalCompetency.security < 70) {
      recommendations.push('Study security best practices and secure coding principles');
    }
    if (technicalCompetency.bestPractices < 70) {
      recommendations.push('Practice industry coding standards and best practices');
    }

    // Category-specific recommendations
    Object.entries(categoryScores).forEach(([category, score]: [string, any]) => {
      if (score < 70) {
        switch (category.toLowerCase()) {
          case 'technical implementation':
            recommendations.push('Strengthen core technical implementation skills');
            break;
          case 'user experience':
            recommendations.push('Focus on user-centered design principles');
            break;
          case 'project management':
            recommendations.push('Improve project planning and execution skills');
            break;
        }
      }
    });

    // Positive recommendations
    if (recommendations.length === 0) {
      recommendations.push('Excellent work! Consider taking on more complex projects');
      recommendations.push('Explore leadership opportunities in technical projects');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private determineHiringRecommendation(overallScore: number, categoryScores: any): 'strong_hire' | 'hire' | 'conditional' | 'no_hire' {
    if (overallScore >= 85) return 'strong_hire';
    if (overallScore >= 75) return 'hire';
    if (overallScore >= 65) return 'conditional';
    return 'no_hire';
  }

  private identifySkillGaps(categoryScores: any, template: ProjectTemplate): string[] {
    const gaps: string[] = [];

    Object.entries(categoryScores).forEach(([category, score]: [string, any]) => {
      if (score < 70) {
        gaps.push(category);
      }
    });

    // Add technology-specific gaps based on project type
    if (categoryScores['Technical Implementation'] < 70) {
      gaps.push(...template.technologies.slice(0, 2)); // Add first 2 technologies as skill gaps
    }

    return gaps;
  }

  private determineCertificationLevel(overallScore: number, difficulty: string): 'entry' | 'competent' | 'proficient' | 'expert' {
    const difficultyMultiplier = {
      'junior': 1.0,
      'mid': 1.1,
      'senior': 1.2,
      'lead': 1.3
    };

    const adjustedScore = overallScore * (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0);

    if (adjustedScore >= 90) return 'expert';
    if (adjustedScore >= 80) return 'proficient';
    if (adjustedScore >= 70) return 'competent';
    return 'entry';
  }

  async generateProjectReport(verificationId: number): Promise<any> {
    const verification = await storage.getSkillsVerification(verificationId);
    if (!verification || !verification.results) {
      throw new Error('Verification not found or not completed');
    }

    const result: SkillsVerificationResult = JSON.parse(verification.results);
    const template: ProjectTemplate = JSON.parse(verification.projectTemplate);
    const submissions = await storage.getDeliverableSubmissions(verificationId);

    return {
      verificationId,
      candidateId: verification.candidateId,
      projectTitle: template.title,
      projectType: template.type,
      difficulty: template.difficulty,
      completionDate: verification.completedAt,
      timeSpent: verification.completedAt && verification.startedAt ?
        Math.round((new Date(verification.completedAt).getTime() - new Date(verification.startedAt).getTime()) / (1000 * 60 * 60)) : 0,
      result,
      submissions: submissions.length,
      deliverables: template.deliverables.length,
      technologies: template.technologies,
      executiveSummary: this.generateExecutiveSummary(result, template),
      detailedAnalysis: this.generateDetailedAnalysis(result, submissions)
    };
  }

  private generateExecutiveSummary(result: SkillsVerificationResult, template: ProjectTemplate): string {
    let summary = `Executive Summary - ${template.title}\n\n`;

    summary += `Overall Assessment: ${result.overallScore}/100 - ${result.hiringRecommendation.replace('_', ' ').toUpperCase()}\n\n`;

    summary += `Key Strengths:\n`;
    Object.entries(result.categoryScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .forEach(([category, score]) => {
        summary += `• ${category}: ${score}/100\n`;
      });

    summary += `\nDevelopment Areas:\n`;
    if (result.skillGaps.length > 0) {
      result.skillGaps.slice(0, 3).forEach(gap => {
        summary += `• ${gap}\n`;
      });
    } else {
      summary += `• No significant skill gaps identified\n`;
    }

    summary += `\nRecommendation: ${result.hiringRecommendation === 'strong_hire' ? 'Strongly recommend for hire' :
                                     result.hiringRecommendation === 'hire' ? 'Recommend for hire' :
                                     result.hiringRecommendation === 'conditional' ? 'Conditional hire with development plan' :
                                     'Not recommended for current role'}\n`;

    return summary;
  }

  private generateDetailedAnalysis(result: SkillsVerificationResult, submissions: any[]): any {
    return {
      technicalSkills: {
        codeQuality: result.technicalCompetency.codeQuality,
        problemSolving: result.technicalCompetency.problemSolving,
        bestPractices: result.technicalCompetency.bestPractices,
        security: result.technicalCompetency.security,
        performance: result.technicalCompetency.performance
      },
      softSkills: {
        projectManagement: result.projectManagement.timeManagement,
        communication: result.projectManagement.communicationQuality,
        documentation: result.projectManagement.documentationQuality,
        innovation: result.innovation.creativityScore
      },
      deliverableAnalysis: submissions.map(sub => ({
        name: sub.fileName,
        type: sub.fileType,
        size: sub.fileSize,
        quality: sub.codeAnalysis ? JSON.parse(sub.codeAnalysis).quality.overallScore : null
      })),
      competencyLevel: result.certificationLevel,
      careerProgression: this.generateCareerProgression(result)
    };
  }

  private generateCareerProgression(result: SkillsVerificationResult): any {
    const currentLevel = result.certificationLevel;
    const nextLevel = {
      'entry': 'competent',
      'competent': 'proficient',
      'proficient': 'expert',
      'expert': 'expert'
    }[currentLevel];

    const developmentAreas = result.skillGaps.slice(0, 3);
    const timeframe = {
      'entry': '6-12 months',
      'competent': '12-18 months',
      'proficient': '18-24 months',
      'expert': 'Continuous development'
    }[currentLevel];

    return {
      currentLevel,
      nextLevel,
      developmentAreas,
      estimatedTimeframe: timeframe,
      recommendedLearning: result.recommendations.slice(0, 3)
    };
  }

  getProjectTemplates(): ProjectTemplate[] {
    return this.projectTemplates;
  }

  getProjectTemplate(id: string): ProjectTemplate | undefined {
    return this.projectTemplates.find(t => t.id === id);
  }
}

export const skillsVerificationService = new SkillsVerificationService();