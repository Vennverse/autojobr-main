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
  detectedLanguage?: string;
  detectedRegion?: string;
}

export class EnhancedNLPService {
  private readonly version = '3.0.0-global';
  
  // Global configuration for different regions
  private readonly globalConfig = {
    languages: {
      // Language detection patterns
      en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
      es: /\b(el|la|los|las|y|o|pero|en|con|de|para|por)\b/gi,
      fr: /\b(le|la|les|et|ou|mais|dans|avec|de|pour|par)\b/gi,
      de: /\b(der|die|das|und|oder|aber|in|mit|von|für|durch)\b/gi,
      pt: /\b(o|a|os|as|e|ou|mas|em|com|de|para|por)\b/gi,
      zh: /[\u4e00-\u9fff]/g,
      ar: /[\u0600-\u06ff]/g,
      hi: /[\u0900-\u097f]/g,
      ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g,
      ru: /[\u0400-\u04ff]/g
    },
    
    // Regional salary ranges (in USD equivalent for comparison)
    salaryRanges: {
      'north america': { min: 30000, max: 300000, currency: 'USD' },
      'europe': { min: 25000, max: 250000, currency: 'EUR' },
      'asia pacific': { min: 15000, max: 200000, currency: 'USD' },
      'latin america': { min: 12000, max: 80000, currency: 'USD' },
      'middle east': { min: 20000, max: 150000, currency: 'USD' },
      'africa': { min: 8000, max: 60000, currency: 'USD' }
    },
    
    // Education system mapping
    educationSystems: {
      'bachelor': ['bachelor', 'bachelors', 'ba', 'bs', 'bsc', 'beng', 'btech', 'licenciatura', 'licence', 'laurea'],
      'master': ['master', 'masters', 'ma', 'ms', 'msc', 'meng', 'mba', 'maestria', 'master', 'magistrale'],
      'doctorate': ['phd', 'doctorate', 'doctoral', 'dphil', 'edd', 'doctorado', 'doctorat', 'dottorato'],
      'diploma': ['diploma', 'certificate', 'cert', 'certification', 'titulo', 'diplome', 'diploma'],
      'associate': ['associate', 'aa', 'as', 'aas', 'tecnico', 'dut', 'bts']
    },
    
    // Global timezone mapping for remote work
    timezones: {
      'americas': ['PST', 'MST', 'CST', 'EST', 'AST', 'BRT', 'ART'],
      'europe_africa': ['GMT', 'CET', 'EET', 'WAT', 'CAT', 'EAT'],
      'asia_pacific': ['JST', 'KST', 'CST', 'IST', 'GST', 'AEST', 'NZST']
    }
  };

  // Global comprehensive skill taxonomy with categories and weights for ALL professions worldwide
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
    // EDUCATION & TRAINING SKILLS
    education: {
      weight: 3.0,
      skills: [
        'curriculum development', 'lesson planning', 'classroom management', 'student assessment', 'educational technology',
        'learning management systems', 'lms', 'moodle', 'blackboard', 'canvas', 'google classroom', 'zoom',
        'instructional design', 'pedagogy', 'differentiated instruction', 'special education', 'inclusive education',
        'educational psychology', 'child development', 'adult learning', 'training delivery', 'e-learning',
        'blended learning', 'online teaching', 'virtual classroom', 'educational research', 'data analysis',
        'student engagement', 'parent communication', 'behavior management', 'literacy', 'numeracy',
        'stem education', 'language teaching', 'esl', 'tesol', 'tefl', 'multilingual education'
      ]
    },
    // LEGAL & COMPLIANCE SKILLS
    legal: {
      weight: 3.0,
      skills: [
        'legal research', 'contract law', 'corporate law', 'employment law', 'intellectual property', 'litigation',
        'legal writing', 'case management', 'compliance', 'regulatory affairs', 'risk assessment', 'due diligence',
        'arbitration', 'mediation', 'negotiation', 'legal analysis', 'statutory interpretation', 'precedent research',
        'client counseling', 'court procedures', 'discovery', 'depositions', 'legal technology', 'e-discovery',
        'document review', 'contract drafting', 'legal project management', 'ethics', 'professional responsibility',
        'international law', 'tax law', 'real estate law', 'family law', 'criminal law', 'immigration law'
      ]
    },
    // CONSTRUCTION & ENGINEERING SKILLS
    construction: {
      weight: 3.0,
      skills: [
        'project management', 'construction management', 'civil engineering', 'mechanical engineering', 'electrical engineering',
        'structural engineering', 'autocad', 'revit', 'solidworks', 'sketchup', 'bim', 'building information modeling',
        'blueprints', 'technical drawings', 'surveying', 'site supervision', 'quality control', 'safety management',
        'osha compliance', 'risk assessment', 'cost estimation', 'scheduling', 'resource planning', 'budgeting',
        'contract administration', 'vendor management', 'material procurement', 'equipment operation', 'heavy machinery',
        'construction safety', 'building codes', 'permits', 'inspections', 'problem solving', 'team leadership'
      ]
    },
    // MANUFACTURING & PRODUCTION SKILLS
    manufacturing: {
      weight: 3.0,
      skills: [
        'lean manufacturing', 'six sigma', 'quality control', 'process improvement', 'production planning',
        'inventory management', 'supply chain', 'logistics', 'warehouse management', 'equipment maintenance',
        'preventive maintenance', 'troubleshooting', 'root cause analysis', 'statistical process control', 'spc',
        'iso standards', 'iso 9001', 'gmp', 'good manufacturing practices', 'safety protocols', 'osha',
        'machine operation', 'cnc programming', 'plc programming', 'automation', 'robotics', 'industrial engineering',
        'continuous improvement', 'kaizen', '5s methodology', 'productivity optimization', 'cost reduction'
      ]
    },
    // RETAIL & HOSPITALITY SKILLS
    retail_hospitality: {
      weight: 2.8,
      skills: [
        'customer service', 'sales techniques', 'pos systems', 'inventory management', 'merchandising',
        'visual merchandising', 'store operations', 'cash handling', 'loss prevention', 'team leadership',
        'staff training', 'scheduling', 'hospitality management', 'hotel operations', 'front desk operations',
        'reservation systems', 'event planning', 'food service', 'restaurant management', 'bar operations',
        'kitchen management', 'food safety', 'haccp', 'wine knowledge', 'beverage service', 'guest relations',
        'housekeeping', 'maintenance coordination', 'revenue management', 'customer satisfaction', 'complaint resolution'
      ]
    },
    // TRANSPORTATION & LOGISTICS SKILLS
    transportation: {
      weight: 2.8,
      skills: [
        'logistics management', 'supply chain optimization', 'route planning', 'fleet management', 'freight coordination',
        'shipping documentation', 'customs clearance', 'international trade', 'warehouse operations', 'inventory control',
        'distribution management', 'transportation planning', 'load optimization', 'delivery scheduling', 'tracking systems',
        'gps navigation', 'commercial driving', 'cdl', 'dot regulations', 'safety compliance', 'vehicle maintenance',
        'cargo handling', 'hazmat certification', 'import export', 'incoterms', 'bill of lading', 'freight forwarding'
      ]
    },
    // REAL ESTATE SKILLS
    real_estate: {
      weight: 2.8,
      skills: [
        'property valuation', 'market analysis', 'real estate law', 'contract negotiation', 'property management',
        'tenant relations', 'lease administration', 'property maintenance', 'real estate marketing', 'lead generation',
        'client relations', 'property inspection', 'appraisal', 'mortgage knowledge', 'financing options',
        'investment analysis', 'cash flow analysis', 'property development', 'zoning regulations', 'building codes',
        'real estate technology', 'mls systems', 'crm systems', 'property photography', 'virtual tours',
        'market research', 'competitive analysis', 'closing procedures', 'title insurance', 'escrow management'
      ]
    },
    // MEDIA & COMMUNICATIONS SKILLS
    media_communications: {
      weight: 2.8,
      skills: [
        'content creation', 'copywriting', 'journalism', 'public relations', 'media relations', 'press releases',
        'social media management', 'content marketing', 'brand management', 'creative writing', 'editing',
        'proofreading', 'video production', 'audio production', 'photography', 'graphic design', 'web design',
        'digital marketing', 'seo', 'content strategy', 'storytelling', 'crisis communications', 'internal communications',
        'event management', 'campaign management', 'analytics', 'media planning', 'advertising', 'broadcast journalism',
        'print journalism', 'online journalism', 'interview skills', 'research skills', 'fact checking'
      ]
    },
    // AGRICULTURE & ENVIRONMENTAL SKILLS
    agriculture_environment: {
      weight: 2.8,
      skills: [
        'crop management', 'soil science', 'irrigation systems', 'pest control', 'livestock management',
        'agricultural technology', 'precision agriculture', 'farm equipment operation', 'sustainable farming',
        'organic farming', 'environmental science', 'environmental monitoring', 'environmental compliance',
        'waste management', 'water treatment', 'air quality monitoring', 'environmental assessment',
        'sustainability practices', 'renewable energy', 'climate science', 'conservation', 'biodiversity',
        'ecosystem management', 'environmental regulations', 'environmental impact assessment', 'green technology'
      ]
    },
    // GOVERNMENT & PUBLIC SERVICE SKILLS
    public_service: {
      weight: 2.8,
      skills: [
        'public administration', 'policy analysis', 'government relations', 'regulatory compliance', 'public policy',
        'community engagement', 'stakeholder management', 'grant writing', 'program management', 'budget management',
        'public speaking', 'presentation skills', 'report writing', 'data analysis', 'research methods',
        'project coordination', 'intergovernmental relations', 'legislative affairs', 'public safety', 'emergency management',
        'disaster response', 'crisis management', 'social services', 'case management', 'client advocacy',
        'community outreach', 'volunteer coordination', 'nonprofit management', 'fundraising', 'donor relations'
      ]
    },
    // SPORTS & FITNESS SKILLS
    sports_fitness: {
      weight: 2.6,
      skills: [
        'personal training', 'fitness coaching', 'exercise physiology', 'nutrition counseling', 'sports science',
        'athletic performance', 'injury prevention', 'rehabilitation', 'sports psychology', 'team coaching',
        'program design', 'fitness assessment', 'group fitness', 'specialized training', 'equipment maintenance',
        'safety protocols', 'first aid', 'cpr certification', 'sports management', 'event coordination',
        'facility management', 'membership sales', 'customer retention', 'health education', 'wellness programs',
        'physical therapy', 'massage therapy', 'sports medicine', 'biomechanics', 'kinesiology'
      ]
    },
    // ARTS & CREATIVE SKILLS
    arts_creative: {
      weight: 2.6,
      skills: [
        'graphic design', 'web design', 'ui/ux design', 'visual arts', 'fine arts', 'digital art', 'illustration',
        'photography', 'videography', 'video editing', 'audio production', 'music production', 'sound design',
        'animation', '3d modeling', 'game design', 'creative writing', 'screenwriting', 'storytelling',
        'art direction', 'creative direction', 'brand design', 'packaging design', 'print design', 'typography',
        'color theory', 'composition', 'adobe creative suite', 'photoshop', 'illustrator', 'indesign',
        'after effects', 'premiere pro', 'sketch', 'figma', 'cinema 4d', 'blender', 'unity', 'unreal engine'
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

  // Enhanced global synonym mapping with context awareness and multilingual support
  private readonly skillSynonyms = new Map([
    // Technical Skills
    ['javascript', ['js', 'ecmascript', 'es6', 'es2020', 'vanilla js', 'node.js', 'nodejs']],
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
    ['machine learning', ['ml', 'artificial intelligence', 'ai', 'deep learning', 'neural networks']],
    ['continuous integration', ['ci/cd', 'devops']],
    ['version control', ['git', 'github', 'gitlab', 'bitbucket']],
    ['api', ['rest api', 'restful', 'graphql', 'grpc']],
    ['microservices', ['micro-services', 'service oriented architecture', 'soa']],
    ['test driven development', ['tdd', 'unit testing', 'integration testing']],
    ['agile', ['scrum', 'kanban', 'sprint planning']],
    
    // Business Skills
    ['customer service', ['customer support', 'client service', 'customer care', 'help desk']],
    ['sales', ['business development', 'revenue generation', 'account management']],
    ['marketing', ['digital marketing', 'brand management', 'promotional activities']],
    ['project management', ['program management', 'project coordination', 'project planning']],
    ['business analysis', ['requirements analysis', 'process analysis', 'data analysis']],
    
    // Professional Certifications & Standards
    ['pmp', ['project management professional', 'project management certification']],
    ['six sigma', ['lean six sigma', 'process improvement', 'quality management']],
    ['iso 9001', ['quality management system', 'iso certification']],
    ['osha', ['occupational safety', 'workplace safety', 'safety compliance']],
    ['gdpr', ['data protection', 'privacy compliance', 'data privacy']],
    
    // Industry-Specific Terms
    ['healthcare', ['medical', 'clinical', 'patient care', 'health services']],
    ['finance', ['financial services', 'banking', 'accounting', 'fintech']],
    ['education', ['teaching', 'training', 'instruction', 'academic']],
    ['legal', ['law', 'litigation', 'compliance', 'regulatory']],
    ['construction', ['building', 'engineering', 'architecture', 'infrastructure']],
    ['manufacturing', ['production', 'operations', 'industrial', 'factory']],
    
    // Global/Regional Variations
    ['cv', ['resume', 'curriculum vitae']],
    ['uni', ['university', 'college', 'higher education']],
    ['maths', ['mathematics', 'math']],
    ['centre', ['center']],
    ['colour', ['color']],
    ['organisation', ['organization']],
    ['analyse', ['analyze']],
    ['realise', ['realize']],
    
    // Language Skills
    ['english', ['esl', 'english as second language', 'english proficiency']],
    ['spanish', ['español', 'castellano']],
    ['french', ['français', 'francais']],
    ['german', ['deutsch']],
    ['chinese', ['mandarin', '中文', 'putonghua']],
    ['japanese', ['日本語', 'nihongo']],
    ['arabic', ['العربية', 'عربي']],
    ['portuguese', ['português']],
    ['russian', ['русский']],
    ['hindi', ['हिन्दी']]
  ]);

  // Global job title normalization patterns with international variations
  private readonly titleNormalization = new Map([
    // Seniority Levels
    [/senior|sr\.?\s+|snr\s+/i, 'Senior '],
    [/junior|jr\.?\s+|jnr\s+/i, 'Junior '],
    [/lead\s+|team\s+lead/i, 'Lead '],
    [/principal\s+/i, 'Principal '],
    [/staff\s+/i, 'Staff '],
    [/executive\s+|exec\s+/i, 'Executive '],
    [/director\s+|dir\s+/i, 'Director '],
    [/manager\s+|mgr\s+/i, 'Manager '],
    [/coordinator\s+|coord\s+/i, 'Coordinator '],
    [/associate\s+|assoc\s+/i, 'Associate '],
    [/assistant\s+|asst\s+/i, 'Assistant '],
    [/intern|internship|trainee/i, 'Intern '],
    
    // Technical Roles
    [/software\s+engineer|swe/i, 'Software Engineer'],
    [/full\s*stack|fullstack/i, 'Full Stack'],
    [/front\s*end|frontend/i, 'Frontend'],
    [/back\s*end|backend/i, 'Backend'],
    [/dev\s*ops|devops/i, 'DevOps'],
    [/data\s+scientist/i, 'Data Scientist'],
    [/data\s+engineer/i, 'Data Engineer'],
    [/data\s+analyst/i, 'Data Analyst'],
    [/machine\s+learning\s+engineer|ml\s+engineer/i, 'ML Engineer'],
    [/product\s+manager|pm/i, 'Product Manager'],
    [/ui\s*ux\s+designer|ux\s+designer|ui\s+designer/i, 'UX/UI Designer'],
    [/quality\s+assurance|qa\s+engineer|test\s+engineer/i, 'QA Engineer'],
    [/security\s+engineer|cybersecurity\s+analyst/i, 'Security Engineer'],
    [/cloud\s+engineer|cloud\s+architect/i, 'Cloud Engineer'],
    [/systems\s+administrator|sysadmin/i, 'Systems Administrator'],
    [/database\s+administrator|dba/i, 'Database Administrator'],
    
    // Business Roles
    [/business\s+analyst|ba/i, 'Business Analyst'],
    [/business\s+development|bd\s+manager/i, 'Business Development'],
    [/account\s+manager|am/i, 'Account Manager'],
    [/sales\s+representative|sales\s+rep/i, 'Sales Representative'],
    [/customer\s+success|cs\s+manager/i, 'Customer Success Manager'],
    [/human\s+resources|hr\s+manager/i, 'HR Manager'],
    [/financial\s+analyst/i, 'Financial Analyst'],
    [/marketing\s+manager/i, 'Marketing Manager'],
    [/operations\s+manager/i, 'Operations Manager'],
    
    // Healthcare Roles
    [/registered\s+nurse|rn/i, 'Registered Nurse'],
    [/physician\s+assistant|pa/i, 'Physician Assistant'],
    [/medical\s+assistant|ma/i, 'Medical Assistant'],
    [/physical\s+therapist|pt/i, 'Physical Therapist'],
    [/occupational\s+therapist|ot/i, 'Occupational Therapist'],
    
    // Education Roles  
    [/elementary\s+teacher|primary\s+teacher/i, 'Elementary Teacher'],
    [/secondary\s+teacher|high\s+school\s+teacher/i, 'Secondary Teacher'],
    [/special\s+education\s+teacher/i, 'Special Education Teacher'],
    [/instructional\s+designer/i, 'Instructional Designer'],
    
    // International Variations
    [/programme\s+manager/i, 'Program Manager'],
    [/colour\s+specialist/i, 'Color Specialist'],
    [/analyse/i, 'Analyst'],
    [/centre\s+manager/i, 'Center Manager']
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

  // Global industry classification patterns with comprehensive coverage
  private readonly industryPatterns = new Map([
    // Technology
    [/fintech|financial\s+technology|banking\s+technology|payments|trading\s+technology|insurtech/i, 'Financial Technology'],
    [/saas|enterprise\s+software|b2b\s+software|productivity\s+software|collaboration\s+tools/i, 'Enterprise Software'],
    [/edtech|education\s+technology|e-learning|online\s+learning|learning\s+management/i, 'Education Technology'],
    [/healthtech|medical\s+technology|telemedicine|digital\s+health|health\s+tech/i, 'Health Technology'],
    [/proptech|real\s+estate\s+technology|property\s+technology/i, 'Property Technology'],
    [/agtech|agriculture\s+technology|farming\s+technology/i, 'Agriculture Technology'],
    
    // Traditional Industries
    [/healthcare|medical|hospital|clinical|pharmaceutical|pharma|biotech|biotechnology/i, 'Healthcare & Life Sciences'],
    [/finance|banking|investment|wealth\s+management|asset\s+management|insurance/i, 'Financial Services'],
    [/retail|e.?commerce|marketplace|shopping|consumer\s+goods|fmcg/i, 'Retail & E-commerce'],
    [/manufacturing|production|industrial|automotive|aerospace|chemicals/i, 'Manufacturing & Industrial'],
    [/construction|engineering|architecture|infrastructure|real\s+estate|property/i, 'Construction & Real Estate'],
    [/energy|oil|gas|renewable\s+energy|utilities|power|solar|wind/i, 'Energy & Utilities'],
    [/telecommunications|telecom|networking|internet\s+service\s+provider|isp/i, 'Telecommunications'],
    [/transportation|logistics|shipping|freight|supply\s+chain|delivery/i, 'Transportation & Logistics'],
    [/hospitality|hotel|restaurant|tourism|travel|leisure|entertainment/i, 'Hospitality & Tourism'],
    [/agriculture|farming|food\s+production|agribusiness/i, 'Agriculture & Food'],
    
    // Professional Services
    [/consulting|professional\s+services|advisory|management\s+consulting/i, 'Consulting & Professional Services'],
    [/legal|law\s+firm|litigation|corporate\s+law/i, 'Legal Services'],
    [/accounting|audit|tax|financial\s+advisory|cpa/i, 'Accounting & Finance'],
    [/marketing|advertising|public\s+relations|pr|digital\s+agency/i, 'Marketing & Advertising'],
    [/human\s+resources|hr\s+services|recruitment|staffing/i, 'Human Resources Services'],
    
    // Media & Creative
    [/media|broadcasting|journalism|publishing|content\s+creation/i, 'Media & Publishing'],
    [/gaming|game\s+development|video\s+games|esports/i, 'Gaming & Entertainment'],
    [/design|creative\s+agency|graphic\s+design|web\s+design/i, 'Design & Creative Services'],
    [/film|television|tv|movie|production|streaming/i, 'Film & Television'],
    
    // Public & Non-Profit
    [/government|public\s+sector|municipal|federal|state|local\s+government/i, 'Government & Public Sector'],
    [/non.?profit|ngo|charity|foundation|social\s+services/i, 'Non-Profit & Social Services'],
    [/education|school|university|college|academic|k-12/i, 'Education'],
    [/research|r&d|laboratory|scientific\s+research/i, 'Research & Development'],
    
    // Company Size & Stage
    [/startup|early.stage|seed\s+stage|series\s+[a-c]|pre.ipo/i, 'Startup'],
    [/fortune\s+500|large\s+corporation|multinational|enterprise|big\s+tech/i, 'Large Enterprise'],
    [/sme|small\s+medium\s+enterprise|mid.size|medium\s+business/i, 'Small to Medium Enterprise'],
    [/family\s+business|privately\s+held|private\s+company/i, 'Private Company'],
    [/public\s+company|publicly\s+traded|listed\s+company/i, 'Public Company']
  ]);

  async analyzeJob(jobDescription: string, userProfile: any): Promise<JobAnalysisResult> {
    const startTime = performance.now();

    try {
      // Detect language and region for global processing
      const detectedLanguage = this.detectLanguage(jobDescription);
      const detectedRegion = this.detectRegion(jobDescription, userProfile);
      
      console.log(`🌍 Global NLP Analysis - Language: ${detectedLanguage}, Region: ${detectedRegion}`);

      // Extract and parse job data with global context
      const extractedData = this.extractJobData(jobDescription, detectedLanguage, detectedRegion);

      // Normalize user profile data with cultural considerations
      const normalizedProfile = this.normalizeUserProfile(userProfile, detectedRegion);

      // Calculate comprehensive match score with global weighting
      const matchAnalysis = this.calculateEnhancedMatchScore(
        normalizedProfile, 
        extractedData,
        detectedLanguage,
        detectedRegion
      );

      // Generate detailed recommendations with cultural context
      const recommendations = this.generateRecommendations(
        matchAnalysis, 
        extractedData, 
        normalizedProfile,
        detectedLanguage,
        detectedRegion
      );

      // Calculate analysis metadata with global stats
      const processingTime = performance.now() - startTime;
      const analysisMetadata: AnalysisMetadata = {
        processingTime,
        textLength: jobDescription.length,
        extractionConfidence: this.calculateExtractionConfidence(extractedData),
        version: this.version,
        timestamp: new Date(),
        detectedLanguage,
        detectedRegion
      };

      return {
        ...matchAnalysis,
        ...recommendations,
        extractedData,
        analysisMetadata
      };
    } catch (error) {
      console.error('Global job analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Language detection using pattern matching
  private detectLanguage(text: string): string {
    const languageScores: Record<string, number> = {};
    
    for (const [lang, pattern] of Object.entries(this.globalConfig.languages)) {
      const matches = text.match(pattern);
      languageScores[lang] = matches ? matches.length : 0;
    }
    
    // Return language with highest score, default to English
    const detectedLang = Object.entries(languageScores)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'en';
    
    return detectedLang;
  }
  
  // Region detection based on various indicators
  private detectRegion(jobDescription: string, userProfile?: any): string {
    const text = jobDescription.toLowerCase();
    
    // Check for explicit region mentions
    if (/\b(usa|united states|america|us|north america)\b/i.test(text)) return 'north america';
    if (/\b(europe|eu|european union|uk|germany|france|spain|italy)\b/i.test(text)) return 'europe';
    if (/\b(asia|china|japan|india|singapore|australia|apac)\b/i.test(text)) return 'asia pacific';
    if (/\b(latin america|south america|brazil|mexico|argentina)\b/i.test(text)) return 'latin america';
    if (/\b(middle east|uae|saudi|dubai|qatar)\b/i.test(text)) return 'middle east';
    if (/\b(africa|south africa|nigeria|kenya)\b/i.test(text)) return 'africa';
    
    // Check user profile for region hints
    if (userProfile?.location) {
      const userLocation = userProfile.location.toLowerCase();
      if (/\b(usa|canada|mexico)\b/i.test(userLocation)) return 'north america';
      if (/\b(uk|germany|france|spain|italy|netherlands)\b/i.test(userLocation)) return 'europe';
      if (/\b(china|japan|india|singapore|australia|korea)\b/i.test(userLocation)) return 'asia pacific';
      if (/\b(brazil|argentina|chile|colombia)\b/i.test(userLocation)) return 'latin america';
      if (/\b(uae|saudi|qatar|kuwait)\b/i.test(userLocation)) return 'middle east';
      if (/\b(nigeria|south africa|kenya|egypt)\b/i.test(userLocation)) return 'africa';
    }
    
    // Default to North America if no clear indicators
    return 'north america';
  }

  private extractJobData(jobDescription: string, language: string = 'en', region: string = 'north america'): ExtractedJobData {
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
        // Determine if required based on context with global considerations
        const isRequired = this.isSkillRequired(pattern, text, sections);
        const yearsRequired = this.extractYearsRequired(pattern, text);
        const context = this.extractSkillContext(pattern, text);

        return { isRequired, yearsRequired, context };
      }
    }

    return null;
  }

  // Enhanced global skill requirement detection with multilingual support
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

  private normalizeUserProfile(userProfile: any, region: string = 'north america'): any {
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

  private calculateEnhancedMatchScore(userProfile: any, extractedData: ExtractedJobData, language: string = 'en', region: string = 'north america'): any {
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

  private generateRecommendations(matchAnalysis: any, extractedData: ExtractedJobData, userProfile: any, language: string = 'en', region: string = 'north america'): any {
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

  /**
   * Extract structured profile data from resume text to enhance job compatibility analysis
   */
  extractProfileFromResumeText(resumeText: string): any {
    if (!resumeText || resumeText.trim().length < 50) {
      return { skills: [], workExperience: [], education: [] };
    }

    const text = resumeText.toLowerCase();
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract skills from resume text
    const extractedSkills: any[] = [];
    for (const [category, categoryData] of Object.entries(this.skillTaxonomy)) {
      for (const skill of categoryData.skills) {
        const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (skillRegex.test(resumeText)) {
          extractedSkills.push({
            skillName: skill.charAt(0).toUpperCase() + skill.slice(1),
            proficiencyLevel: "intermediate", // Default proficiency
            yearsExperience: this.estimateSkillExperience(resumeText, skill),
            category: category
          });
        }
      }
    }

    // Extract work experience from resume text
    const workExperience = this.extractWorkExperienceFromText(resumeText);

    // Extract education from resume text  
    const education = this.extractEducationFromText(resumeText);

    // Extract years of experience
    const yearsExperience = this.extractTotalYearsExperience(resumeText);

    // Extract professional title
    const professionalTitle = this.extractProfessionalTitleFromText(resumeText);

    return {
      skills: extractedSkills.slice(0, 20), // Limit to top 20 skills
      workExperience,
      education,
      yearsExperience,
      professionalTitle,
      summary: this.extractSummaryFromText(resumeText)
    };
  }

  private estimateSkillExperience(resumeText: string, skill: string): number {
    // Look for years mentioned near the skill
    const skillContext = this.getContextAroundSkill(resumeText, skill);
    const yearMatch = skillContext.match(/(\d+)\s*(?:years?|yrs?)/i);
    return yearMatch ? Math.min(parseInt(yearMatch[1]), 15) : 1;
  }

  private getContextAroundSkill(text: string, skill: string): string {
    const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
    if (skillIndex === -1) return '';
    
    const start = Math.max(0, skillIndex - 100);
    const end = Math.min(text.length, skillIndex + skill.length + 100);
    return text.slice(start, end);
  }

  private extractWorkExperienceFromText(resumeText: string): any[] {
    const workExperience: any[] = [];
    const lines = resumeText.split('\n');
    
    // Look for common work experience patterns
    const experienceSection = this.findSection(lines, ['experience', 'work', 'employment', 'career']);
    if (experienceSection.length > 0) {
      let currentJob: any = {};
      
      for (const line of experienceSection) {
        // Look for job titles (often followed by @ or at)
        const jobTitleMatch = line.match(/^([^@\-\|]+?)(?:\s*[@\-\|]\s*(.+?))?(?:\s*\|\s*(.+?))?$/);
        if (jobTitleMatch && line.length > 10 && line.length < 100) {
          if (currentJob.position) {
            workExperience.push(currentJob);
          }
          currentJob = {
            position: jobTitleMatch[1].trim(),
            company: jobTitleMatch[2]?.trim() || 'Unknown Company',
            description: []
          };
        } else if (currentJob.position && line.trim().length > 5) {
          // Add to description if we have a current job
          if (!currentJob.description) currentJob.description = [];
          currentJob.description.push(line.trim());
        }
      }
      
      if (currentJob.position) {
        workExperience.push(currentJob);
      }
    }
    
    return workExperience.slice(0, 5); // Limit to 5 most recent jobs
  }

  private extractEducationFromText(resumeText: string): any[] {
    const education: any[] = [];
    const lines = resumeText.split('\n');
    
    const educationSection = this.findSection(lines, ['education', 'academic', 'degree', 'university', 'college']);
    
    for (const line of educationSection) {
      // Look for degree patterns
      const degreePattern = /(bachelor|master|phd|doctorate|associate|diploma|certificate|b\.?[a-z]\.?|m\.?[a-z]\.?|ph\.?d\.?)/i;
      if (degreePattern.test(line) && line.length > 5) {
        const parts = line.split(/\s*[@\-\|]\s*/);
        education.push({
          degree: parts[0]?.trim() || 'Degree',
          institution: parts[1]?.trim() || 'Institution',
          fieldOfStudy: this.extractFieldOfStudy(line)
        });
      }
    }
    
    return education.slice(0, 3); // Limit to 3 education entries
  }

  private extractTotalYearsExperience(resumeText: string): number {
    // Look for total years experience mentions
    const experienceMatch = resumeText.match(/(?:over|more than|about|\+)?\s*(\d+)\s*(?:\+)?\s*years?\s*(?:of)?\s*(?:professional|work|total)?\s*experience/i);
    if (experienceMatch) {
      return parseInt(experienceMatch[1]);
    }
    
    // Estimate from work experience dates
    const dateMatches = resumeText.match(/\b(19|20)\d{2}\b/g);
    if (dateMatches && dateMatches.length >= 2) {
      const years = dateMatches.map(y => parseInt(y)).sort((a, b) => b - a);
      const yearRange = years[0] - years[years.length - 1];
      return Math.min(yearRange, 30); // Cap at 30 years
    }
    
    return 2; // Default estimate
  }

  private extractProfessionalTitleFromText(resumeText: string): string {
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for title in first few lines after name
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 60 && 
          !line.includes('@') && !line.includes('phone') && !line.includes('email')) {
        // Check if it contains job-related keywords
        const jobKeywords = ['engineer', 'developer', 'manager', 'analyst', 'specialist', 'consultant', 'director', 'lead', 'senior', 'junior'];
        if (jobKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
          return line;
        }
      }
    }
    
    return 'Professional';
  }

  private extractSummaryFromText(resumeText: string): string {
    const lines = resumeText.split('\n');
    const summarySection = this.findSection(lines, ['summary', 'objective', 'profile', 'about']);
    
    if (summarySection.length > 0) {
      return summarySection.slice(0, 3).join(' ').substring(0, 300);
    }
    
    // Fallback: use first paragraph that's not contact info
    for (const line of lines.slice(0, 10)) {
      if (line.length > 50 && !line.includes('@') && !line.includes('phone')) {
        return line.substring(0, 300);
      }
    }
    
    return 'Professional with diverse experience';
  }

  private extractFieldOfStudy(educationLine: string): string {
    const fields = ['computer science', 'engineering', 'business', 'marketing', 'finance', 'psychology', 'biology', 'chemistry', 'physics', 'mathematics'];
    const line = educationLine.toLowerCase();
    
    for (const field of fields) {
      if (line.includes(field)) {
        return field.charAt(0).toUpperCase() + field.slice(1);
      }
    }
    
    return 'General Studies';
  }

  private findSection(lines: string[], keywords: string[]): string[] {
    const sectionLines: string[] = [];
    let inSection = false;
    let sectionStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      // Check if this line is a section header
      const isHeader = keywords.some(keyword => {
        return line.includes(keyword) && line.length < 50;
      });
      
      if (isHeader) {
        inSection = true;
        sectionStartIndex = i;
        continue;
      }
      
      // Check if we've reached another section
      const isAnotherSection = inSection && (
        line.includes('education') || line.includes('experience') || 
        line.includes('skills') || line.includes('projects') ||
        line.includes('certifications')
      ) && line.length < 50 && i > sectionStartIndex + 2;
      
      if (isAnotherSection) {
        break;
      }
      
      if (inSection && line.length > 0) {
        sectionLines.push(lines[i].trim());
      }
    }
    
    return sectionLines;
  }
}

// Global NLP service instance with comprehensive profession and region support
export const customNLPService = new EnhancedNLPService();