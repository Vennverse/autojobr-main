// Enhanced Custom NLP Service for Job Analysis
// Improved accuracy, comprehensive analysis, and better maintainability

interface JobAnalysisResult {
  matchScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchingSkills: SkillMatch[];
  missingSkills: SkillGap[];
  skillGaps: {
    critical: SkillGap[];
    important: SkillGap[];
    nice_to_have: SkillGap[];
  };
  seniorityLevel: string;
  workMode: string;
  jobType: string;
  roleComplexity: string;
  careerProgression: string;
  industryFit: string;
  cultureFit: string;
  applicationRecommendation: ApplicationRecommendation;
  tailoringAdvice: string[];
  interviewPrepTips: string[];
  riskFactors: string[];
  growthOpportunities: string[];
  salary?: SalaryInfo;
  extractedData: ExtractedJobData;
  analysisMetadata: AnalysisMetadata;
}

interface SkillMatch {
  skill: string;
  userSkill?: string;
  matchType: 'exact' | 'partial' | 'synonym' | 'related';
  relevance: 'high' | 'medium' | 'low';
  yearsExperience?: number;
}

interface SkillGap {
  skill: string;
  category: 'technical' | 'soft' | 'domain' | 'certification';
  priority: 'critical' | 'important' | 'nice_to_have';
  learningTime: string;
  alternatives?: string[];
}

interface ApplicationRecommendation {
  action: 'strongly_recommended' | 'recommended' | 'consider_with_preparation' | 'needs_development' | 'not_suitable';
  reasoning: string[];
  timeline?: string;
  preparationSteps?: string[];
}

interface SalaryInfo {
  min?: number;
  max?: number;
  currency: string;
  isEstimated: boolean;
  source: 'description' | 'inferred';
  marketRate?: {
    percentile: number;
    comparison: 'above' | 'at' | 'below';
  };
}

interface ExtractedJobData {
  title: string;
  normalizedTitle: string;
  company: string;
  location: string;
  isRemote: boolean;
  requiredSkills: ParsedSkill[];
  preferredSkills: ParsedSkill[];
  qualifications: Qualification[];
  benefits: string[];
  responsibilities: string[];
  teamSize?: number;
  reportingStructure?: string;
  industry?: string;
  companyStage?: string;
}

interface ParsedSkill {
  name: string;
  category: 'technical' | 'soft' | 'domain' | 'certification';
  isRequired: boolean;
  yearsRequired?: number;
  context?: string;
  alternatives?: string[];
}

interface Qualification {
  type: 'education' | 'experience' | 'certification' | 'other';
  requirement: string;
  isRequired: boolean;
  alternatives?: string[];
}

interface AnalysisMetadata {
  processingTime: number;
  textLength: number;
  extractionConfidence: number;
  version: string;
  timestamp: Date;
}

export class EnhancedNLPService {
  private readonly version = '2.0.0';

  // Comprehensive skill taxonomy with categories and weights for ALL professions
  private readonly skillTaxonomy = {
    // TECHNICAL SKILLS
    programming: {
      weight: 3.0,
      skills: [
        'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 
        'scala', 'kotlin', 'swift', 'dart', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell'
      ]
    },
    frontend: {
      weight: 2.8,
      skills: [
        'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'gatsby', 'ember', 'backbone',
        'html5', 'css3', 'scss', 'sass', 'less', 'bootstrap', 'tailwind', 'materialui', 'chakraui',
        'webpack', 'vite', 'parcel', 'rollup', 'babel', 'eslint', 'prettier'
      ]
    },
    // SALES SKILLS
    sales: {
      weight: 3.0,
      skills: [
        'salesforce', 'crm', 'hubspot', 'pipedrive', 'lead generation', 'prospecting', 'cold calling',
        'lead qualification', 'sales funnel', 'account management', 'relationship building', 'negotiation',
        'closing techniques', 'consultative selling', 'solution selling', 'b2b sales', 'b2c sales',
        'inside sales', 'outside sales', 'territory management', 'sales forecasting', 'quota attainment',
        'pipeline management', 'customer retention', 'upselling', 'cross-selling', 'sales presentations',
        'demo delivery', 'proposal writing', 'contract negotiation', 'sales analytics', 'competitive analysis'
      ]
    },
    // MARKETING SKILLS
    marketing: {
      weight: 3.0,
      skills: [
        'digital marketing', 'content marketing', 'social media marketing', 'email marketing', 'seo', 'sem',
        'ppc advertising', 'google ads', 'facebook ads', 'linkedin ads', 'instagram marketing', 'twitter marketing',
        'marketing automation', 'lead nurturing', 'customer segmentation', 'market research', 'brand management',
        'product marketing', 'campaign management', 'analytics', 'google analytics', 'marketing metrics',
        'conversion optimization', 'a/b testing', 'landing page optimization', 'copywriting', 'creative direction',
        'graphic design', 'video marketing', 'influencer marketing', 'affiliate marketing', 'marketing strategy',
        'marketing planning', 'budget management', 'roi analysis', 'customer acquisition', 'retention marketing'
      ]
    },
    // HR/HUMAN RESOURCES SKILLS
    hr: {
      weight: 3.0,
      skills: [
        'recruiting', 'talent acquisition', 'interviewing', 'candidate screening', 'applicant tracking systems',
        'ats', 'workday', 'bamboohr', 'greenhouse', 'lever', 'employee relations', 'performance management',
        'compensation', 'benefits administration', 'payroll', 'hris', 'hr analytics', 'workforce planning',
        'organizational development', 'training and development', 'onboarding', 'employee engagement',
        'diversity and inclusion', 'compliance', 'employment law', 'policy development', 'conflict resolution',
        'change management', 'succession planning', 'talent management', 'employer branding', 'hr strategy',
        'exit interviews', 'retention strategies', 'hr metrics', 'people analytics', 'culture development'
      ]
    },
    // FINANCE SKILLS
    finance: {
      weight: 3.0,
      skills: [
        'financial analysis', 'financial modeling', 'budgeting', 'forecasting', 'accounting', 'bookkeeping',
        'financial reporting', 'tax preparation', 'audit', 'compliance', 'risk management', 'investment analysis',
        'portfolio management', 'trading', 'derivatives', 'fixed income', 'equity research', 'valuation',
        'mergers and acquisitions', 'corporate finance', 'treasury', 'cash flow management', 'credit analysis',
        'loan underwriting', 'financial planning', 'wealth management', 'insurance', 'banking', 'fintech',
        'excel', 'quickbooks', 'sage', 'bloomberg', 'reuters', 'sql', 'tableau', 'power bi'
      ]
    },
    // HEALTHCARE SKILLS
    healthcare: {
      weight: 3.0,
      skills: [
        'patient care', 'clinical assessment', 'medical diagnosis', 'treatment planning', 'medication administration',
        'electronic health records', 'ehr', 'epic', 'cerner', 'medical coding', 'icd-10', 'cpt', 'hipaa',
        'patient safety', 'infection control', 'medical equipment', 'laboratory procedures', 'radiology',
        'nursing', 'physician assistant', 'medical assistant', 'pharmacy', 'physical therapy', 'occupational therapy',
        'speech therapy', 'medical research', 'clinical trials', 'healthcare administration', 'medical billing',
        'healthcare analytics', 'telemedicine', 'public health', 'epidemiology', 'biostatistics'
      ]
    },
    // OPERATIONS SKILLS  
    operations: {
      weight: 2.8,
      skills: [
        'project management', 'process improvement', 'lean manufacturing', 'six sigma', 'supply chain',
        'logistics', 'inventory management', 'quality assurance', 'quality control', 'vendor management',
        'procurement', 'contract management', 'operations planning', 'capacity planning', 'resource allocation',
        'workflow optimization', 'standard operating procedures', 'continuous improvement', 'kaizen',
        'operations research', 'data analysis', 'performance metrics', 'kpi tracking', 'cost reduction',
        'efficiency optimization', 'automation', 'facility management', 'safety management', 'compliance'
      ]
    },
    // CUSTOMER SERVICE SKILLS
    customer_service: {
      weight: 2.8,
      skills: [
        'customer support', 'customer success', 'technical support', 'help desk', 'call center', 'live chat',
        'email support', 'ticket management', 'customer satisfaction', 'problem solving', 'conflict resolution',
        'active listening', 'empathy', 'communication skills', 'product knowledge', 'troubleshooting',
        'escalation management', 'customer retention', 'customer feedback', 'service recovery', 'crm systems',
        'zendesk', 'freshdesk', 'intercom', 'salesforce service cloud', 'customer journey mapping',
        'service level agreements', 'response time optimization', 'customer analytics', 'voice of customer'
      ]
    },
    // SOFT SKILLS - Universal across professions
    soft_skills: {
      weight: 2.5,
      skills: [
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking', 'creativity',
        'time management', 'organization', 'adaptability', 'flexibility', 'collaboration', 'presentation',
        'public speaking', 'writing', 'research', 'analytical thinking', 'decision making', 'emotional intelligence',
        'conflict management', 'mentoring', 'coaching', 'delegation', 'strategic thinking', 'innovation',
        'change management', 'cross-functional collaboration', 'stakeholder management', 'project coordination'
      ]
    },
    backend: {
      weight: 2.9,
      skills: [
        'nodejs', 'express', 'nestjs', 'fastify', 'koa', 'spring', 'springboot', 'django', 'flask',
        'rails', 'laravel', 'symfony', 'asp.net', 'fastapi', 'gin', 'fiber', 'actix'
      ]
    },
    database: {
      weight: 2.7,
      skills: [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
        'sqlite', 'oracle', 'mssql', 'neo4j', 'influxdb', 'firebase', 'supabase'
      ]
    },
    cloud: {
      weight: 2.9,
      skills: [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
        'gitlab ci', 'github actions', 'circleci', 'helm', 'istio', 'prometheus', 'grafana'
      ]
    },
    mobile: {
      weight: 2.6,
      skills: [
        'react native', 'flutter', 'ionic', 'xamarin', 'android', 'ios', 'swift', 'kotlin',
        'cordova', 'phonegap', 'unity', 'unreal'
      ]
    },
    dataScience: {
      weight: 3.0,
      skills: [
        'pandas', 'numpy', 'scipy', 'tensorflow', 'pytorch', 'scikit-learn', 'keras',
        'jupyter', 'tableau', 'powerbi', 'spark', 'hadoop', 'airflow', 'dbt'
      ]
    },
    testing: {
      weight: 2.3,
      skills: [
        'jest', 'cypress', 'selenium', 'playwright', 'puppeteer', 'junit', 'pytest',
        'mocha', 'jasmine', 'testng', 'cucumber', 'postman', 'insomnia'
      ]
    },
    soft: {
      weight: 2.0,
      skills: [
        'leadership', 'communication', 'teamwork', 'problem solving', 'analytical thinking',
        'creativity', 'adaptability', 'time management', 'project management', 'mentoring',
        'collaboration', 'negotiation', 'presentation', 'documentation', 'agile', 'scrum'
      ]
    },
    design: {
      weight: 2.4,
      skills: [
        'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ux design', 'ui design',
        'user research', 'wireframing', 'prototyping', 'design systems', 'accessibility'
      ]
    }
  };

  // Enhanced synonym mapping with context awareness
  private readonly skillSynonyms = new Map([
    ['javascript', ['js', 'ecmascript', 'es6', 'es2020', 'vanilla js']],
    ['typescript', ['ts']],
    ['react', ['reactjs', 'react.js', 'jsx', 'tsx']],
    ['angular', ['angularjs', 'angular2+', 'angular cli']],
    ['vue', ['vuejs', 'vue.js', 'nuxt']],
    ['node', ['nodejs', 'node.js']],
    ['postgresql', ['postgres', 'psql']],
    ['mongodb', ['mongo', 'nosql']],
    ['amazon web services', ['aws']],
    ['google cloud platform', ['gcp', 'google cloud']],
    ['microsoft azure', ['azure']],
    ['machine learning', ['ml', 'artificial intelligence', 'ai']],
    ['continuous integration', ['ci/cd', 'devops']],
    ['version control', ['git', 'github', 'gitlab', 'bitbucket']],
    ['api', ['rest api', 'restful', 'graphql', 'grpc']],
    ['microservices', ['micro-services', 'service oriented architecture', 'soa']],
    ['test driven development', ['tdd', 'unit testing', 'integration testing']],
    ['agile', ['scrum', 'kanban', 'sprint planning']]
  ]);

  // Job title normalization patterns
  private readonly titleNormalization = new Map([
    [/senior|sr\.?\s+/i, 'Senior '],
    [/junior|jr\.?\s+/i, 'Junior '],
    [/lead\s+/i, 'Lead '],
    [/principal\s+/i, 'Principal '],
    [/staff\s+/i, 'Staff '],
    [/software\s+engineer/i, 'Software Engineer'],
    [/full\s*stack/i, 'Full Stack'],
    [/front\s*end/i, 'Frontend'],
    [/back\s*end/i, 'Backend'],
    [/dev\s*ops/i, 'DevOps'],
    [/data\s+scientist/i, 'Data Scientist'],
    [/product\s+manager/i, 'Product Manager']
  ]);

  // Experience level patterns with more nuanced matching
  private readonly experienceLevels = new Map([
    [/(intern|internship|trainee|graduate|entry.level|0.1\s+years?)/i, 'Entry Level'],
    [/(junior|associate|1.3\s+years?)/i, 'Junior Level'],
    [/(mid.level|intermediate|3.5\s+years?)/i, 'Mid Level'],
    [/(senior|5.8\s+years?)/i, 'Senior Level'],
    [/(lead|principal|staff|8\+\s+years?)/i, 'Lead Level'],
    [/(manager|director|head\s+of|vp|cto|ceo)/i, 'Management Level']
  ]);

  // Work mode detection with confidence scoring
  private readonly workModePatterns = new Map([
    [/(100%\s+)?remote|work\s+from\s+home|wfh|distributed|anywhere/i, 'Remote'],
    [/hybrid|flexible|mix|part.remote|some\s+remote/i, 'Hybrid'],
    [/on.?site|office|in.person|colocation|headquarters/i, 'Onsite'],
    [/contract|freelance|consulting|temporary|temp|project.based/i, 'Contract']
  ]);

  // Industry classification patterns
  private readonly industryPatterns = new Map([
    [/fintech|financial|banking|payments|trading|insurance/i, 'Financial Technology'],
    [/healthcare|medical|biotech|pharma|telemedicine/i, 'Healthcare & Biotech'],
    [/e.?commerce|retail|marketplace|shopping/i, 'E-commerce & Retail'],
    [/gaming|game|entertainment|media|streaming/i, 'Gaming & Entertainment'],
    [/education|edtech|learning|university|school/i, 'Education Technology'],
    [/saas|enterprise|b2b|productivity|collaboration/i, 'Enterprise Software'],
    [/startup|early.stage|series\s+[a-c]/i, 'Startup'],
    [/fortune\s+500|enterprise|large\s+corporation/i, 'Enterprise']
  ]);

  async analyzeJob(jobDescription: string, userProfile: any): Promise<JobAnalysisResult> {
    const startTime = performance.now();

    try {
      // Extract and parse job data
      const extractedData = this.extractJobData(jobDescription);

      // Normalize user profile data
      const normalizedProfile = this.normalizeUserProfile(userProfile);

      // Calculate comprehensive match score
      const matchAnalysis = this.calculateEnhancedMatchScore(
        normalizedProfile, 
        extractedData
      );

      // Generate detailed recommendations
      const recommendations = this.generateRecommendations(
        matchAnalysis, 
        extractedData, 
        normalizedProfile
      );

      // Calculate analysis metadata
      const processingTime = performance.now() - startTime;
      const analysisMetadata: AnalysisMetadata = {
        processingTime,
        textLength: jobDescription.length,
        extractionConfidence: this.calculateExtractionConfidence(extractedData),
        version: this.version,
        timestamp: new Date()
      };

      return {
        ...matchAnalysis,
        ...recommendations,
        extractedData,
        analysisMetadata
      };
    } catch (error) {
      console.error('Job analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractJobData(jobDescription: string): ExtractedJobData {
    const text = jobDescription.toLowerCase();
    const originalText = jobDescription;

    // Extract title with improved patterns
    const title = this.extractTitle(originalText);
    const normalizedTitle = this.normalizeTitle(title);

    // Extract company with better detection
    const company = this.extractCompany(originalText);

    // Extract location and remote status
    const { location, isRemote } = this.extractLocationInfo(originalText);

    // Extract skills with categorization
    const { requiredSkills, preferredSkills } = this.extractSkills(originalText);

    // Extract qualifications with structured parsing
    const qualifications = this.extractQualifications(originalText);

    // Extract additional job details
    const benefits = this.extractBenefits(originalText);
    const responsibilities = this.extractResponsibilities(originalText);
    const teamSize = this.extractTeamSize(originalText);
    const industry = this.detectIndustry(originalText);

    return {
      title,
      normalizedTitle,
      company,
      location,
      isRemote,
      requiredSkills,
      preferredSkills,
      qualifications,
      benefits,
      responsibilities,
      teamSize,
      industry
    };
  }

  private extractTitle(text: string): string {
    const patterns = [
      /(?:job\s+title|position|role):\s*([^\n\r]+)/i,
      /(?:hiring|seeking|looking\s+for)(?:\s+an?\s+)?([^\n\r]+?)(?:\s*(?:at|with|for|in))/i,
      /^([^\n\r]+?)(?:\s*[-–—]\s*|$)/m,
      /we['']?re\s+hiring\s+an?\s+([^\n\r]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 100) {
          return title;
        }
      }
    }

    return 'Software Engineer'; // fallback
  }

  private normalizeTitle(title: string): string {
    let normalized = title;

    for (const [pattern, replacement] of this.titleNormalization) {
      normalized = normalized.replace(pattern, replacement);
    }

    return normalized.trim();
  }

  private extractCompany(text: string): string {
    const patterns = [
      /(?:company|organization|employer):\s*([^\n\r]+)/i,
      /(?:join|at)\s+([A-Z][a-zA-Z\s&.,'-]+?)(?:\s+(?:as|in|for|where|and)|\s*[,.]|\s*$)/,
      /^([A-Z][a-zA-Z\s&.,'-]+?)\s+is\s+(?:hiring|seeking|looking)/m,
      /about\s+([A-Z][a-zA-Z\s&.,'-]+?):/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length > 2 && company.length < 50) {
          return company;
        }
      }
    }

    return 'Technology Company';
  }

  private extractLocationInfo(text: string): { location: string; isRemote: boolean } {
    const remotePatterns = [
      /100%\s+remote/i,
      /fully\s+remote/i,
      /work\s+from\s+(?:home|anywhere)/i,
      /location[:\s]*remote/i
    ];

    const isRemote = remotePatterns.some(pattern => pattern.test(text));

    if (isRemote) {
      return { location: 'Remote', isRemote: true };
    }

    const locationPatterns = [
      /location[:\s]*([^\n\r]+)/i,
      /based\s+in[:\s]*([^\n\r]+)/i,
      /office\s+in[:\s]*([^\n\r]+)/i,
      /([A-Za-z\s,]+,\s*(?:CA|NY|TX|FL|IL|WA|MA|CO|OR|GA|NC|VA|AZ|PA|OH|MI|MN|WI|IN|TN|MO|MD|NJ|CT|UT|NV|ID|KS|AR|MS|AL|LA|OK|SC|KY|IA|WV|NH|VT|ME|RI|DE|MT|ND|SD|WY|AK|HI))/,
      /(?:san francisco|new york|los angeles|chicago|boston|seattle|austin|denver|atlanta|miami|dallas|houston|phoenix|philadelphia|portland|nashville|charlotte|columbus|indianapolis|detroit|memphis|baltimore|milwaukee|albuquerque|tucson|fresno|sacramento|kansas city|colorado springs|omaha|raleigh|miami|virginia beach|oakland|minneapolis|tulsa|cleveland|wichita|arlington)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        if (location.length > 2 && location.length < 100) {
          return { location, isRemote: false };
        }
      }
    }

    return { location: 'Not specified', isRemote: false };
  }

  private extractSkills(text: string): { requiredSkills: ParsedSkill[]; preferredSkills: ParsedSkill[] } {
    const requiredSkills: ParsedSkill[] = [];
    const preferredSkills: ParsedSkill[] = [];

    // Split text into sections for better context
    const sections = this.splitIntoSections(text);

    for (const [category, skillData] of Object.entries(this.skillTaxonomy)) {
      for (const skill of skillData.skills) {
        const skillInfo = this.findSkillInText(skill, text, sections);
        if (skillInfo) {
          const parsedSkill: ParsedSkill = {
            name: skill,
            category: this.categorizeSkill(skill),
            isRequired: skillInfo.isRequired,
            yearsRequired: skillInfo.yearsRequired,
            context: skillInfo.context,
            alternatives: this.getSkillAlternatives(skill)
          };

          if (skillInfo.isRequired) {
            requiredSkills.push(parsedSkill);
          } else {
            preferredSkills.push(parsedSkill);
          }
        }
      }
    }

    return { requiredSkills, preferredSkills };
  }

  private splitIntoSections(text: string): Map<string, string> {
    const sections = new Map<string, string>();

    const sectionPatterns = [
      { name: 'requirements', pattern: /(?:requirements?|qualifications?|must.haves?):(.*?)(?=\n\s*[A-Z]|\n\s*$|$)/is },
      { name: 'preferred', pattern: /(?:preferred|nice.to.have|plus|bonus|desired):(.*?)(?=\n\s*[A-Z]|\n\s*$|$)/is },
      { name: 'responsibilities', pattern: /(?:responsibilities|duties|you.will):(.*?)(?=\n\s*[A-Z]|\n\s*$|$)/is },
      { name: 'skills', pattern: /(?:skills?|technologies?|tools?):(.*?)(?=\n\s*[A-Z]|\n\s*$|$)/is }
    ];

    for (const { name, pattern } of sectionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        sections.set(name, match[1].trim());
      }
    }

    return sections;
  }

  private findSkillInText(skill: string, text: string, sections: Map<string, string>): {
    isRequired: boolean;
    yearsRequired?: number;
    context?: string;
  } | null {
    const skillRegex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
    const synonyms = this.skillSynonyms.get(skill) || [];

    // Check main skill and synonyms
    const patterns = [skill, ...synonyms];

    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${this.escapeRegex(pattern)}\\b`, 'gi');

      if (regex.test(text)) {
        // Determine if required based on context
        const isRequired = this.isSkillRequired(pattern, text, sections);
        const yearsRequired = this.extractYearsRequired(pattern, text);
        const context = this.extractSkillContext(pattern, text);

        return { isRequired, yearsRequired, context };
      }
    }

    return null;
  }

  private isSkillRequired(skill: string, text: string, sections: Map<string, string>): boolean {
    const requiredSection = sections.get('requirements');
    if (requiredSection) {
      const regex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
      if (regex.test(requiredSection)) {
        return true;
      }
    }

    // Check for required indicators near the skill
    const requiredIndicators = [
      'required', 'must have', 'essential', 'mandatory', 'critical',
      'need', 'expect', 'should have'
    ];

    const skillRegex = new RegExp(
      `(?:${requiredIndicators.join('|')}).*?\\b${this.escapeRegex(skill)}\\b|\\b${this.escapeRegex(skill)}\\b.*?(?:${requiredIndicators.join('|')})`,
      'gi'
    );

    return skillRegex.test(text);
  }

  private extractYearsRequired(skill: string, text: string): number | undefined {
    const yearsPattern = new RegExp(
      `\\b${this.escapeRegex(skill)}\\b.*?(\\d+)\\+?\\s*years?|\\b(\\d+)\\+?\\s*years?.*?\\b${this.escapeRegex(skill)}\\b`,
      'gi'
    );

    const match = text.match(yearsPattern);
    if (match) {
      const years = parseInt(match[1] || match[2]);
      return isNaN(years) ? undefined : years;
    }

    return undefined;
  }

  private extractSkillContext(skill: string, text: string): string | undefined {
    const contextPattern = new RegExp(
      `([^.!?]*\\b${this.escapeRegex(skill)}\\b[^.!?]*)`,
      'gi'
    );

    const match = text.match(contextPattern);
    if (match && match[0]) {
      return match[0].trim().substring(0, 200);
    }

    return undefined;
  }

  private categorizeSkill(skill: string): 'technical' | 'soft' | 'domain' | 'certification' {
    for (const [category, skillData] of Object.entries(this.skillTaxonomy)) {
      if (skillData.skills.includes(skill)) {
        if (category === 'soft') return 'soft';
        return 'technical';
      }
    }

    // Check for certifications
    if (/aws|azure|gcp|cisco|oracle|microsoft|google|certified/i.test(skill)) {
      return 'certification';
    }

    return 'domain';
  }

  private getSkillAlternatives(skill: string): string[] {
    return this.skillSynonyms.get(skill) || [];
  }

  private extractQualifications(text: string): Qualification[] {
    const qualifications: Qualification[] = [];

    const patterns = [
      {
        type: 'education' as const,
        pattern: /(?:bachelor|master|phd|degree|diploma|university|college)/gi,
        context: /([^.!?]*(?:bachelor|master|phd|degree|diploma|university|college)[^.!?]*)/gi
      },
      {
        type: 'experience' as const,
        pattern: /(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)/gi,
        context: /([^.!?]*\d+\+?\s*years?\s*(?:of\s+)?(?:experience|exp)[^.!?]*)/gi
      },
      {
        type: 'certification' as const,
        pattern: /(?:certified|certification|license|accredited)/gi,
        context: /([^.!?]*(?:certified|certification|license|accredited)[^.!?]*)/gi
      }
    ];

    for (const { type, context } of patterns) {
      const matches = text.match(context);
      if (matches) {
        for (const match of matches) {
          const isRequired = this.isQualificationRequired(match);
          qualifications.push({
            type,
            requirement: match.trim(),
            isRequired,
            alternatives: this.findQualificationAlternatives(match)
          });
        }
      }
    }

    return qualifications;
  }

  private isQualificationRequired(qualification: string): boolean {
    const requiredIndicators = ['required', 'must', 'mandatory', 'essential'];
    const preferredIndicators = ['preferred', 'desired', 'plus', 'bonus'];

    const lowerQual = qualification.toLowerCase();

    const hasRequired = requiredIndicators.some(indicator => lowerQual.includes(indicator));
    const hasPreferred = preferredIndicators.some(indicator => lowerQual.includes(indicator));

    return hasRequired && !hasPreferred;
  }

  private findQualificationAlternatives(qualification: string): string[] {
    const alternatives: string[] = [];

    if (/bachelor/i.test(qualification)) {
      alternatives.push('Equivalent work experience', 'Associate degree + experience');
    }

    if (/master/i.test(qualification)) {
      alternatives.push('Bachelor + additional experience', 'Relevant certifications');
    }

    return alternatives;
  }

  private extractBenefits(text: string): string[] {
    const benefitKeywords = [
      'health insurance', 'dental insurance', 'vision insurance', 'medical coverage',
      '401k', '401(k)', 'retirement plan', 'pension', 'rrsp',
      'pto', 'paid time off', 'vacation days', 'sick leave', 'personal days',
      'work from home', 'remote work', 'flexible hours', 'flexible schedule',
      'equity', 'stock options', 'esop', 'shares', 'ownership',
      'bonus', 'performance bonus', 'annual bonus', 'quarterly bonus',
      'professional development', 'training budget', 'conference budget',
      'tuition reimbursement', 'education assistance', 'learning stipend',
      'gym membership', 'wellness program', 'mental health support',
      'parental leave', 'maternity leave', 'paternity leave',
      'unlimited vacation', 'unlimited pto', 'sabbatical'
    ];

    const benefits: string[] = [];
    const lowerText = text.toLowerCase();

    for (const benefit of benefitKeywords) {
      if (lowerText.includes(benefit.toLowerCase())) {
        benefits.push(benefit);
      }
    }

    return Array.from(new Set(benefits));
  }

  private extractResponsibilities(text: string): string[] {
    const responsibilityPatterns = [
      /(?:responsibilities|duties|you will|your role):(.*?)(?=\n\s*[A-Z]|\n\s*$|$)/is,
      /(?:^|\n)\s*[•\-*]\s*([^•\-*\n]+)/gm
    ];

    const responsibilities: string[] = [];

    for (const pattern of responsibilityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const responsibility = match.replace(/^[•\-*\s]+/, '').trim();
          if (responsibility.length > 10 && responsibility.length < 200) {
            responsibilities.push(responsibility);
          }
        }
      }
    }

    return responsibilities.slice(0, 10); // Limit to prevent bloat
  }

  private extractTeamSize(text: string): number | undefined {
    const teamPatterns = [
      /team\s+of\s+(\d+)/i,
      /(\d+)\s*person\s+team/i,
      /(\d+)\s*member\s+team/i,
      /join\s+(?:our\s+)?(\d+)\s*person/i
    ];

    for (const pattern of teamPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const size = parseInt(match[1]);
        if (size > 0 && size < 1000) {
          return size;
        }
      }
    }

    return undefined;
  }

  private detectIndustry(text: string): string | undefined {
    for (const [pattern, industry] of this.industryPatterns) {
      if (pattern.test(text)) {
        return industry;
      }
    }

    return undefined;
  }

  private normalizeUserProfile(userProfile: any): any {
    return {
      skills: this.normalizeUserSkills(userProfile.skills || []),
      workExperience: userProfile.workExperience || [],
      education: userProfile.education || [],
      yearsExperience: userProfile.yearsExperience || 0,
      summary: userProfile.summary || ''
    };
  }

  private normalizeUserSkills(skills: any[]): string[] {
    return skills.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (skill && skill.skillName) return skill.skillName.toLowerCase();
      if (skill && skill.name) return skill.name.toLowerCase();
      return '';
    }).filter(skill => skill.length > 0);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private calculateEnhancedMatchScore(userProfile: any, extractedData: ExtractedJobData): any {
    let baseScore = 40;
    let skillScore = 0;
    let experienceScore = 0;
    const matchingSkills: SkillMatch[] = [];
    const missingSkills: SkillGap[] = [];

    // Calculate skill matching score
    const userSkills = userProfile.skills || [];
    const jobSkills = extractedData.requiredSkills || [];

    if (jobSkills.length > 0 && userSkills.length > 0) {
      let skillMatches = 0;
      
      for (const jobSkill of jobSkills) {
        const skillName = typeof jobSkill === 'string' ? jobSkill : jobSkill.name;
        const userMatch = userSkills.find((userSkill: string) => 
          userSkill.toLowerCase().includes(skillName.toLowerCase()) ||
          skillName.toLowerCase().includes(userSkill.toLowerCase())
        );

        if (userMatch) {
          skillMatches++;
          matchingSkills.push({
            skill: skillName,
            userSkill: userMatch,
            matchType: 'exact',
            relevance: 'high'
          });
        } else {
          missingSkills.push({
            skill: skillName,
            category: 'technical',
            priority: 'important',
            learningTime: '1-3 months'
          });
        }
      }

      skillScore = (skillMatches / jobSkills.length) * 40;
    }

    // Calculate experience score
    const jobExperience = extractedData.qualifications?.find(q => q.type === 'experience')?.value || 0;
    const userExperience = userProfile.yearsExperience || 0;

    if (jobExperience > 0) {
      if (userExperience >= jobExperience) {
        experienceScore = 20;
      } else if (userExperience >= jobExperience * 0.7) {
        experienceScore = 15;
      } else if (userExperience >= jobExperience * 0.5) {
        experienceScore = 10;
      } else {
        experienceScore = 5;
      }
    } else {
      experienceScore = 15; // Default if no experience requirement
    }

    const finalScore = Math.min(100, Math.round(baseScore + skillScore + experienceScore));

    return {
      matchScore: finalScore,
      confidenceLevel: finalScore >= 80 ? 'high' : finalScore >= 60 ? 'medium' : 'low',
      matchingSkills,
      missingSkills,
      skillGaps: {
        critical: missingSkills.filter(s => s.priority === 'critical'),
        important: missingSkills.filter(s => s.priority === 'important'),
        nice_to_have: missingSkills.filter(s => s.priority === 'nice_to_have')
      }
    };
  }

  private generateRecommendations(matchAnalysis: any, extractedData: ExtractedJobData, userProfile: any): any {
    const { matchScore } = matchAnalysis;
    
    let applicationRecommendation: ApplicationRecommendation;
    const tailoringAdvice: string[] = [];
    const interviewPrepTips: string[] = [];

    if (matchScore >= 80) {
      applicationRecommendation = {
        action: 'strongly_recommended',
        reasoning: ['High skill match', 'Experience level appropriate'],
        timeline: 'Apply immediately'
      };
    } else if (matchScore >= 65) {
      applicationRecommendation = {
        action: 'recommended',
        reasoning: ['Good overall match', 'Some skill gaps can be filled'],
        timeline: 'Apply within 1 week'
      };
    } else if (matchScore >= 50) {
      applicationRecommendation = {
        action: 'consider_with_preparation',
        reasoning: ['Moderate match', 'Requires skill development'],
        timeline: 'Prepare for 2-4 weeks before applying'
      };
    } else {
      applicationRecommendation = {
        action: 'needs_development',
        reasoning: ['Significant skill gaps', 'Experience requirements not met'],
        timeline: 'Develop skills for 3-6 months'
      };
    }

    // Generate tailoring advice
    tailoringAdvice.push('Highlight relevant experience in your resume');
    if (matchAnalysis.matchingSkills.length > 0) {
      tailoringAdvice.push('Emphasize your matching skills: ' + matchAnalysis.matchingSkills.slice(0, 3).map((s: any) => s.skill).join(', '));
    }

    // Generate interview prep tips
    interviewPrepTips.push('Research the company culture and values');
    interviewPrepTips.push('Prepare examples that demonstrate your relevant skills');
    if (extractedData.industry) {
      interviewPrepTips.push(`Study ${extractedData.industry} industry trends`);
    }

    return {
      seniorityLevel: this.extractSeniorityLevel(extractedData.title),
      workMode: extractedData.isRemote ? 'Remote' : 'On-site',
      jobType: 'Full-time', // Default
      roleComplexity: matchScore >= 70 ? 'Suitable' : 'Challenging',
      careerProgression: 'Good growth opportunity',
      industryFit: extractedData.industry || 'Technology',
      cultureFit: 'Research company culture',
      applicationRecommendation,
      tailoringAdvice,
      interviewPrepTips,
      riskFactors: matchScore < 60 ? ['Skill gaps may impact performance'] : [],
      growthOpportunities: ['Professional development', 'Skill enhancement']
    };
  }

  private extractSeniorityLevel(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('lead')) return 'Senior Level';
    if (titleLower.includes('junior') || titleLower.includes('associate')) return 'Junior Level';
    if (titleLower.includes('mid') || titleLower.includes('intermediate')) return 'Mid Level';
    return 'Mid Level';
  }

  private calculateExtractionConfidence(extractedData: ExtractedJobData): number {
    let confidence = 50;
    
    if (extractedData.title && extractedData.title.length > 5) confidence += 15;
    if (extractedData.company && extractedData.company.length > 2) confidence += 10;
    if (extractedData.requiredSkills && extractedData.requiredSkills.length > 0) confidence += 15;
    if (extractedData.qualifications && extractedData.qualifications.length > 0) confidence += 10;
    
    return Math.min(100, confidence);
  }
}

// Export singleton instance for use in routes
export const customNLPService = new EnhancedNLPService();