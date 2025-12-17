import { z } from 'zod';

// Type definitions
type InterviewRound = 'phone_screen' | 'technical' | 'system_design' | 'behavioral' | 'onsite' | 'final';
type DifficultyLevel = 'entry' | 'mid' | 'senior' | 'staff' | 'principal' | 'executive';
type CompanyType = 'startup' | 'scaleup' | 'bigtech' | 'enterprise' | 'consulting' | 'finance' | 'healthcare';

interface InterviewPreparation {
  roleInsights: {
    overview: string;
    keySkills: string[];
    commonChallenges: string[];
    interviewFocus: string[];
  };
  questions: {
    behavioral: string[];
    technical: string[];
    systemDesign: string[];
    situational: string[];
    leadership: string[];
  };
  technicalTopics: {
    mustKnow: string[];
    shouldKnow: string[];
    niceToHave: string[];
  };
  tips: {
    general: string[];
    technical: string[];
    behavioral: string[];
    negotiation: string[];
    location: string[];
  };
  preparationChecklist: {
    category: string;
    items: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  resources: {
    category: string;
    items: string[];
  }[];
  timeline: string;
  redFlags: string[];
  companyTypeInsights?: {
    culture: string;
    interviewStyle: string;
    tips: string[];
  };
}

export const interviewPrepSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  companyType: z.enum(['startup', 'scaleup', 'bigtech', 'enterprise', 'consulting', 'finance', 'healthcare']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'staff', 'principal', 'executive']).optional(),
  location: z.string().optional(),
  jobDescription: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  interviewRound: z.enum(['phone_screen', 'technical', 'system_design', 'behavioral', 'onsite', 'final']).optional()
});

// Company type insights (generalizable patterns)
const COMPANY_TYPE_INSIGHTS: Record<CompanyType, any> = {
  startup: {
    culture: 'Fast-paced, high autonomy, wearing multiple hats. Emphasis on ownership and scrappiness.',
    interviewStyle: 'Practical skills, culture fit, passion, and adaptability. Often founder interview.',
    interviewProcess: ['Recruiter call', 'Technical assessment', 'Team fit interview', 'Founder/leadership round'],
    tips: [
      'Show entrepreneurial mindset and resourcefulness',
      'Demonstrate ability to work with limited resources',
      'Highlight end-to-end project ownership',
      'Express passion for the mission and problem space',
      'Be ready to discuss compensation with equity focus'
    ],
    redFlags: ['Need for structure', 'Risk aversion', 'Narrow specialization'],
    avgDuration: '1-3 weeks',
    compensationStyle: 'Lower base, higher equity, high risk/reward'
  },
  scaleup: {
    culture: 'Growth-focused, building processes, some structure emerging. Fast execution with increasing scale.',
    interviewStyle: 'Technical skills, scalability mindset, leadership potential, culture add.',
    interviewProcess: ['Screen', 'Technical rounds', 'Team interviews', 'Leadership/cross-functional'],
    tips: [
      'Show experience scaling systems or teams',
      'Demonstrate balance of speed and quality',
      'Highlight process creation and mentorship',
      'Show adaptability as company evolves',
      'Discuss growth trajectory alignment'
    ],
    redFlags: ['Rigidity', 'Inability to handle ambiguity', 'Lack of ownership'],
    avgDuration: '2-4 weeks',
    compensationStyle: 'Competitive base, meaningful equity, moderate risk'
  },
  bigtech: {
    culture: 'Technical excellence, scale-focused, structured processes. High bar for hiring.',
    interviewStyle: 'Rigorous technical, system design, behavioral with frameworks (LPs, values).',
    interviewProcess: ['Screen', 'Phone technical', 'Onsite (4-6 rounds)', 'Committee review', 'Team match'],
    tips: [
      'Practice LeetCode extensively (medium/hard)',
      'Master system design for large-scale systems',
      'Prepare STAR stories for behavioral rounds',
      'Study company values and principles deeply',
      'Demonstrate ability to think at massive scale'
    ],
    redFlags: ['Poor communication', 'Lack of depth', 'No scalability thinking'],
    avgDuration: '4-8 weeks',
    compensationStyle: 'High total comp, strong base + equity + bonus'
  },
  enterprise: {
    culture: 'Established processes, stability-focused, hierarchical. Emphasis on reliability and compliance.',
    interviewStyle: 'Technical competence, culture fit, experience with enterprise systems, communication.',
    interviewProcess: ['HR screen', 'Technical interview', 'Manager interview', 'Team interviews', 'HR final'],
    tips: [
      'Highlight experience with enterprise software/systems',
      'Show understanding of compliance and security',
      'Demonstrate stakeholder management skills',
      'Emphasize reliability and risk management',
      'Be prepared for longer decision processes'
    ],
    redFlags: ['Impatience with process', 'Risk-taking without justification', 'Poor documentation habits'],
    avgDuration: '4-8 weeks',
    compensationStyle: 'Stable base, good benefits, lower equity, pension/401k'
  },
  consulting: {
    culture: 'Client-focused, analytical, prestigious. Up-or-out culture, long hours, travel.',
    interviewStyle: 'Case interviews, problem-solving, communication, executive presence.',
    interviewProcess: ['Screen', '1st round cases (2-3)', 'Final round cases (3-5)', 'Partner interview'],
    tips: [
      'Master case interview frameworks (profitability, market entry, etc.)',
      'Practice mental math extensively',
      'Develop structured problem-solving approach',
      'Show executive presence and communication',
      'Research firm methodology and recent projects'
    ],
    redFlags: ['Unstructured thinking', 'Poor quantitative skills', 'Inability to synthesize'],
    avgDuration: '3-6 weeks',
    compensationStyle: 'High base, performance bonus, limited equity, exit ops'
  },
  finance: {
    culture: 'Performance-driven, analytical, competitive. Long hours, prestige-focused.',
    interviewStyle: 'Technical finance knowledge, modeling, market awareness, fit.',
    interviewProcess: ['Screen', 'Technical interview', 'Modeling test', 'Superday/multiple rounds'],
    tips: [
      'Master financial modeling and valuation',
      'Stay current on market news and trends',
      'Prepare to discuss recent deals or market movements',
      'Show quantitative and analytical rigor',
      'Demonstrate work ethic and resilience'
    ],
    redFlags: ['Weak technical skills', 'Poor market knowledge', 'Can\'t handle pressure'],
    avgDuration: '2-6 weeks',
    compensationStyle: 'High base + large bonus (50-100%+), limited equity'
  },
  healthcare: {
    culture: 'Patient-focused, regulated, mission-driven. Compliance and quality critical.',
    interviewStyle: 'Technical skills, understanding of healthcare domain, compliance mindset, empathy.',
    interviewProcess: ['Screen', 'Technical interview', 'Domain knowledge discussion', 'Team fit'],
    tips: [
      'Show understanding of healthcare regulations (HIPAA, FDA, etc.)',
      'Demonstrate patient-first mindset',
      'Highlight experience with healthcare systems',
      'Show attention to quality and safety',
      'Express mission alignment with healthcare impact'
    ],
    redFlags: ['Lack of domain interest', 'Disregard for compliance', 'No empathy'],
    avgDuration: '3-6 weeks',
    compensationStyle: 'Competitive base, good benefits, mission-driven culture'
  }
};

// Role-specific comprehensive technical topics
const ROLE_TECHNICAL_TOPICS: Record<string, any> = {
  'software engineer': {
    mustKnow: [
      'Data structures: Arrays, LinkedLists, Trees, Graphs, Hash Tables, Heaps',
      'Algorithms: Sorting, Searching, BFS/DFS, Dynamic Programming',
      'Time and space complexity (Big O notation)',
      'Object-oriented programming principles (SOLID)',
      'Testing strategies (unit, integration, e2e)',
      'Version control (Git workflows, branching strategies)',
      'Debugging techniques and tools'
    ],
    shouldKnow: [
      'Design patterns (Singleton, Factory, Observer, Strategy)',
      'API design (REST, GraphQL)',
      'Database fundamentals (SQL queries, indexing)',
      'Concurrency and multithreading basics',
      'System design principles (scalability, reliability)',
      'Agile/Scrum methodologies',
      'Code review best practices'
    ],
    niceToHave: [
      'Distributed systems concepts',
      'Microservices architecture',
      'Cloud platforms (AWS, Azure, GCP)',
      'Performance optimization techniques',
      'Security best practices (OWASP)',
      'CI/CD pipelines',
      'Monitoring and observability'
    ]
  },
  'senior software engineer': {
    mustKnow: [
      'Advanced algorithms and data structures',
      'System design and architecture patterns',
      'Scalability and performance optimization',
      'Database design (normalization, sharding, replication)',
      'Microservices and distributed systems',
      'API design and versioning strategies',
      'Code quality and maintainability practices',
      'Technical leadership and mentorship'
    ],
    shouldKnow: [
      'Cloud architecture (multi-region, disaster recovery)',
      'Message queues and event-driven architecture',
      'Caching strategies (Redis, CDN, browser caching)',
      'Security architecture (auth, encryption, compliance)',
      'Monitoring, logging, and alerting systems',
      'Technical debt management',
      'Cross-functional collaboration'
    ],
    niceToHave: [
      'Machine learning integration',
      'Infrastructure as Code',
      'Cost optimization strategies',
      'Technical writing and documentation',
      'Open source contributions',
      'Conference speaking/technical blogging'
    ]
  },
  'frontend developer': {
    mustKnow: [
      'JavaScript/TypeScript fundamentals (ES6+, async/await, promises)',
      'Modern framework (React, Vue, or Angular) - deep knowledge',
      'HTML5 semantic markup and accessibility (WCAG)',
      'CSS3, Flexbox, Grid, responsive design',
      'State management (Redux, MobX, Zustand, Pinia)',
      'Browser APIs (localStorage, fetch, WebSockets)',
      'Performance optimization (lazy loading, code splitting)',
      'Cross-browser compatibility'
    ],
    shouldKnow: [
      'Build tools (Webpack, Vite, esbuild)',
      'Testing (Jest, React Testing Library, Cypress)',
      'Progressive Web Apps (PWAs)',
      'SEO best practices',
      'Web security (XSS, CSRF, CSP)',
      'Design systems and component libraries',
      'Animation libraries (Framer Motion, GSAP)'
    ],
    niceToHave: [
      'Server-Side Rendering (Next.js, Nuxt.js)',
      'WebAssembly',
      'Canvas/WebGL for graphics',
      'Mobile-first development',
      'Micro-frontends architecture',
      'Design tools (Figma, Sketch)'
    ]
  },
  'backend developer': {
    mustKnow: [
      'RESTful API design principles and best practices',
      'Database design (SQL: PostgreSQL/MySQL, NoSQL: MongoDB/DynamoDB)',
      'Authentication and authorization (JWT, OAuth2, SSO)',
      'Server-side language expertise (Node.js/Python/Java/Go)',
      'API security (rate limiting, input validation, encryption)',
      'Error handling and logging strategies',
      'Testing (unit, integration, load testing)',
      'Version control and CI/CD'
    ],
    shouldKnow: [
      'Microservices architecture patterns',
      'Message queues (RabbitMQ, Kafka, SQS)',
      'Caching strategies (Redis, Memcached)',
      'Database optimization (indexing, query optimization)',
      'API documentation (Swagger/OpenAPI)',
      'Containerization (Docker)',
      'Background job processing',
      'Websockets and real-time communication'
    ],
    niceToHave: [
      'GraphQL implementation',
      'Service mesh (Istio, Linkerd)',
      'Serverless architecture (Lambda, Cloud Functions)',
      'Event-driven architecture',
      'Database replication and sharding',
      'gRPC and Protocol Buffers'
    ]
  },
  'full stack developer': {
    mustKnow: [
      'Frontend: JavaScript/TypeScript, React/Vue/Angular',
      'Backend: Node.js/Python/Java, API design',
      'Database: SQL and NoSQL databases',
      'Full application architecture',
      'DevOps basics (deployment, CI/CD)',
      'Authentication and security',
      'Testing across the stack',
      'Performance optimization (frontend + backend)'
    ],
    shouldKnow: [
      'Cloud platforms (AWS, Azure, GCP)',
      'Containerization (Docker, Kubernetes)',
      'State management and API integration',
      'Serverless architecture',
      'Monitoring and logging',
      'Database migrations and ORM',
      'Real-time features (WebSockets)'
    ],
    niceToHave: [
      'Mobile development (React Native, Flutter)',
      'Infrastructure as Code',
      'Advanced caching strategies',
      'Message queues and event processing',
      'Multi-tenant architecture'
    ]
  },
  'data scientist': {
    mustKnow: [
      'Statistics: Hypothesis testing, distributions, regression',
      'Machine learning: Supervised and unsupervised algorithms',
      'Python: pandas, numpy, scikit-learn, matplotlib',
      'Feature engineering and selection',
      'Model evaluation metrics and validation',
      'Data cleaning and preprocessing',
      'SQL and data manipulation',
      'A/B testing and experimentation'
    ],
    shouldKnow: [
      'Deep learning fundamentals (neural networks)',
      'Big data tools (Spark, Hadoop)',
      'Cloud platforms (AWS SageMaker, Azure ML)',
      'Time series analysis',
      'Natural Language Processing basics',
      'Computer Vision basics',
      'MLOps principles',
      'Data visualization (Tableau, Power BI)'
    ],
    niceToHave: [
      'Advanced deep learning (CNNs, RNNs, Transformers)',
      'Model deployment and serving',
      'Distributed computing',
      'Bayesian statistics',
      'Causal inference',
      'AutoML tools'
    ]
  },
  'machine learning engineer': {
    mustKnow: [
      'Machine learning algorithms (deep understanding)',
      'Deep learning frameworks (PyTorch, TensorFlow)',
      'Model training, tuning, and optimization',
      'ML system design and architecture',
      'Feature engineering at scale',
      'Model evaluation and monitoring',
      'Python and software engineering practices',
      'Data pipelines and ETL processes'
    ],
    shouldKnow: [
      'MLOps and model deployment',
      'Distributed training (multi-GPU, multi-node)',
      'Model serving (TensorFlow Serving, TorchServe)',
      'Experiment tracking (MLflow, Weights & Biases)',
      'Cloud ML services (SageMaker, Vertex AI)',
      'Docker and Kubernetes for ML',
      'Model optimization (quantization, pruning)',
      'A/B testing for ML models'
    ],
    niceToHave: [
      'Reinforcement learning',
      'AutoML and neural architecture search',
      'Federated learning',
      'Model explainability (SHAP, LIME)',
      'Edge ML deployment',
      'Research paper implementation'
    ]
  },
  'devops engineer': {
    mustKnow: [
      'CI/CD pipeline design and implementation',
      'Container orchestration (Kubernetes)',
      'Infrastructure as Code (Terraform, CloudFormation, Ansible)',
      'Cloud platforms (AWS/Azure/GCP services)',
      'Linux/Unix administration',
      'Scripting (Bash, Python)',
      'Monitoring and logging (Prometheus, Grafana, ELK)',
      'Networking fundamentals'
    ],
    shouldKnow: [
      'GitOps practices (ArgoCD, Flux)',
      'Service mesh (Istio, Linkerd)',
      'Security and compliance automation',
      'Disaster recovery and backup strategies',
      'Load balancing and auto-scaling',
      'Database administration and backups',
      'Cost optimization',
      'Incident management and on-call'
    ],
    niceToHave: [
      'Multi-cloud strategies',
      'Chaos engineering',
      'FinOps practices',
      'Platform engineering',
      'SRE principles',
      'Policy as code (OPA)'
    ]
  },
  'product manager': {
    mustKnow: [
      'Product strategy and roadmapping',
      'User research and customer discovery',
      'Data analysis and metrics definition',
      'Prioritization frameworks (RICE, MoSCoW, Kano)',
      'Agile/Scrum methodologies',
      'Stakeholder management',
      'Competitive analysis',
      'Product lifecycle management'
    ],
    shouldKnow: [
      'A/B testing and experimentation',
      'SQL for data analysis',
      'Technical fundamentals (APIs, databases)',
      'Design thinking and UX principles',
      'Go-to-market strategy',
      'Business modeling and unit economics',
      'Roadmap presentation skills',
      'Cross-functional leadership'
    ],
    niceToHave: [
      'Coding basics (Python, SQL)',
      'Growth hacking techniques',
      'Machine learning product applications',
      'Platform and API product management',
      'International product strategy',
      'Product analytics tools (Mixpanel, Amplitude)'
    ]
  },
  'data engineer': {
    mustKnow: [
      'SQL advanced queries and optimization',
      'ETL/ELT pipeline design',
      'Data modeling (dimensional modeling, normalization)',
      'Programming (Python, Java, Scala)',
      'Big data technologies (Spark, Hadoop)',
      'Data warehousing (Snowflake, Redshift, BigQuery)',
      'Workflow orchestration (Airflow, Prefect)',
      'Data quality and testing'
    ],
    shouldKnow: [
      'Stream processing (Kafka, Flink)',
      'Cloud data services (AWS Glue, Azure Data Factory)',
      'Data lake architecture',
      'dbt for analytics engineering',
      'CI/CD for data pipelines',
      'Data governance and lineage',
      'Performance tuning and optimization',
      'NoSQL databases'
    ],
    niceToHave: [
      'Real-time data processing',
      'Data mesh architecture',
      'ML pipeline integration',
      'Cost optimization for data workloads',
      'Reverse ETL',
      'Data observability tools'
    ]
  },
  'ui/ux designer': {
    mustKnow: [
      'User research methods (interviews, surveys, usability testing)',
      'Wireframing and prototyping',
      'Design tools (Figma, Sketch, Adobe XD)',
      'Information architecture',
      'Interaction design principles',
      'Visual design fundamentals (color, typography, layout)',
      'Accessibility standards (WCAG)',
      'Design systems and component libraries'
    ],
    shouldKnow: [
      'User personas and journey mapping',
      'A/B testing and data-driven design',
      'Responsive and mobile-first design',
      'Animation and micro-interactions',
      'Design thinking workshops',
      'Stakeholder presentation skills',
      'Front-end basics (HTML/CSS understanding)',
      'Analytics and metrics (Google Analytics, Hotjar)'
    ],
    niceToHave: [
      'Motion design (After Effects)',
      'Front-end development (React, CSS)',
      'Service design',
      'Design operations',
      'VR/AR design',
      'Voice UI design'
    ]
  },
  'data analyst': {
    mustKnow: [
      'SQL for data querying and analysis',
      'Excel/Google Sheets advanced functions',
      'Data visualization (Tableau, Power BI, Looker)',
      'Statistical analysis basics',
      'Business metrics and KPIs',
      'Report and dashboard creation',
      'Data cleaning and preparation',
      'Stakeholder communication'
    ],
    shouldKnow: [
      'Python (pandas, matplotlib) or R',
      'A/B testing and experimentation',
      'Business intelligence concepts',
      'ETL processes understanding',
      'Descriptive statistics',
      'Cohort and funnel analysis',
      'Data storytelling',
      'Database fundamentals'
    ],
    niceToHave: [
      'Machine learning basics',
      'Advanced analytics techniques',
      'Cloud analytics platforms',
      'Programming for automation',
      'Product analytics tools (Mixpanel, Amplitude)',
      'Marketing analytics'
    ]
  },
  'business analyst': {
    mustKnow: [
      'Requirements gathering and documentation',
      'Process mapping and improvement',
      'Stakeholder management',
      'Data analysis and reporting',
      'SQL and Excel proficiency',
      'User stories and acceptance criteria',
      'Gap analysis',
      'Business case development'
    ],
    shouldKnow: [
      'Agile and waterfall methodologies',
      'BPMN or UML modeling',
      'Project management basics',
      'Change management',
      'Risk assessment',
      'Vendor evaluation',
      'Financial analysis',
      'Presentation skills'
    ],
    niceToHave: [
      'Certification (CBAP, PMI-PBA)',
      'Business intelligence tools',
      'Technical documentation',
      'API understanding',
      'Salesforce or CRM knowledge',
      'Industry domain expertise'
    ]
  },
  'qa engineer': {
    mustKnow: [
      'Manual testing techniques and methodologies',
      'Test case design and execution',
      'Bug reporting and tracking (Jira, Bugzilla)',
      'Test automation fundamentals',
      'API testing (Postman, REST Assured)',
      'SQL for database testing',
      'Agile testing practices',
      'Testing types (functional, regression, integration)'
    ],
    shouldKnow: [
      'Automation frameworks (Selenium, Cypress, Playwright)',
      'Programming (Python, JavaScript, Java)',
      'Performance testing (JMeter, LoadRunner)',
      'CI/CD integration for testing',
      'Mobile testing (Appium)',
      'Security testing basics',
      'Test strategy and planning',
      'Accessibility testing'
    ],
    niceToHave: [
      'Test-driven development (TDD)',
      'Behavior-driven development (BDD)',
      'Containerized testing environments',
      'Cloud testing platforms',
      'Load and stress testing',
      'Test data management'
    ]
  },
  'security engineer': {
    mustKnow: [
      'Network security fundamentals',
      'Security frameworks (OWASP, NIST)',
      'Vulnerability assessment and penetration testing',
      'Encryption and cryptography',
      'Identity and access management (IAM)',
      'Security monitoring and SIEM tools',
      'Incident response procedures',
      'Secure coding practices'
    ],
    shouldKnow: [
      'Cloud security (AWS/Azure/GCP)',
      'Container security (Docker, Kubernetes)',
      'Compliance standards (SOC2, ISO 27001, GDPR)',
      'Security automation and orchestration',
      'Threat intelligence and analysis',
      'Scripting (Python, Bash) for security',
      'Application security testing',
      'Network architecture and protocols'
    ],
    niceToHave: [
      'Malware analysis',
      'Forensics and investigation',
      'Red teaming',
      'Zero trust architecture',
      'DevSecOps practices',
      'Security certifications (CISSP, CEH, OSCP)'
    ]
  },
  'engineering manager': {
    mustKnow: [
      'People management and coaching',
      'Performance reviews and feedback delivery',
      'Team building and hiring',
      'Project planning and delivery',
      'Technical strategy and architecture decisions',
      'Stakeholder management',
      'Agile/Scrum leadership',
      'Conflict resolution'
    ],
    shouldKnow: [
      'Budget and resource management',
      'Technical debt prioritization',
      'Career development and mentorship',
      'Cross-functional collaboration',
      'Roadmap planning',
      'Metrics and KPIs for teams',
      'Process improvement',
      'Technical problem-solving'
    ],
    niceToHave: [
      'Executive communication',
      'Organization design',
      'Diversity and inclusion initiatives',
      'Remote team management',
      'M&A integration experience',
      'Open source community management'
    ]
  },
  'sales engineer': {
    mustKnow: [
      'Technical product knowledge (deep)',
      'Solution architecture and design',
      'Technical presentation and demos',
      'Customer requirements gathering',
      'POC/pilot execution',
      'Technical objection handling',
      'Competitive positioning',
      'Integration and API understanding'
    ],
    shouldKnow: [
      'Sales process and methodologies',
      'CRM tools (Salesforce)',
      'Proposal and RFP responses',
      'Customer technical training',
      'Pre-sales discovery',
      'Value engineering',
      'Post-sales technical support',
      'Industry domain knowledge'
    ],
    niceToHave: [
      'Coding and scripting skills',
      'Cloud certifications',
      'Public speaking and evangelism',
      'Technical writing',
      'Partner ecosystem knowledge',
      'Customer success metrics'
    ]
  },
  'technical writer': {
    mustKnow: [
      'Technical documentation writing',
      'API documentation (REST, GraphQL)',
      'User guides and tutorials',
      'Documentation tools (Markdown, Git)',
      'Information architecture',
      'Editing and proofreading',
      'Audience analysis',
      'Style guides and standards'
    ],
    shouldKnow: [
      'Docs-as-code workflows',
      'Static site generators (Docusaurus, MkDocs)',
      'Technical concepts understanding',
      'Diagrams and visual communication',
      'Video tutorials and screencasts',
      'Localization and translation',
      'SEO for documentation',
      'Content management systems'
    ],
    niceToHave: [
      'Coding basics (Python, JavaScript)',
      'API testing',
      'Technical illustration',
      'SDK and library documentation',
      'Developer relations',
      'Open source contribution'
    ]
  },
  'financial analyst': {
    mustKnow: [
      'Financial modeling (DCF, LBO, comparable analysis)',
      'Excel advanced functions (VLOOKUPs, pivot tables, macros)',
      'Financial statements analysis',
      'Valuation techniques',
      'Budget and forecast preparation',
      'Variance analysis',
      'Financial reporting',
      'Business metrics and KPIs'
    ],
    shouldKnow: [
      'PowerPoint for presentations',
      'SQL for data extraction',
      'Statistical analysis',
      'Industry research',
      'ERP systems (SAP, Oracle)',
      'Financial regulations (GAAP/IFRS)',
      'Scenario and sensitivity analysis',
      'Cost-benefit analysis'
    ],
    niceToHave: [
      'Programming (Python, R)',
      'Power BI or Tableau',
      'Bloomberg or Capital IQ',
      'Certifications (CFA, CPA)',
      'M&A analysis',
      'Capital markets knowledge'
    ]
  },
  'marketing manager': {
    mustKnow: [
      'Marketing strategy and planning',
      'Campaign management and execution',
      'Digital marketing channels (SEO, SEM, social, email)',
      'Marketing analytics and ROI measurement',
      'Customer segmentation and targeting',
      'Content marketing strategy',
      'Budget management',
      'Cross-functional collaboration'
    ],
    shouldKnow: [
      'Marketing automation (HubSpot, Marketo)',
      'Google Analytics and data analysis',
      'A/B testing and optimization',
      'Brand management',
      'Product marketing',
      'CRM tools (Salesforce)',
      'Growth hacking techniques',
      'Funnel optimization'
    ],
    niceToHave: [
      'SQL and data analysis',
      'Marketing technology stack',
      'Account-based marketing',
      'Influencer marketing',
      'International marketing',
      'Marketing certifications'
    ]
  },
  'hr manager': {
    mustKnow: [
      'Recruitment and talent acquisition',
      'Performance management systems',
      'Employee relations and conflict resolution',
      'Compensation and benefits administration',
      'HR policies and compliance',
      'Onboarding and offboarding',
      'HRIS systems (Workday, BambooHR)',
      'Employment law basics'
    ],
    shouldKnow: [
      'Organizational development',
      'Learning and development programs',
      'Diversity and inclusion initiatives',
      'Employee engagement strategies',
      'Change management',
      'Workforce planning',
      'HR analytics and metrics',
      'Succession planning'
    ],
    niceToHave: [
      'HR certifications (SHRM-CP, PHR)',
      'People analytics',
      'Compensation benchmarking',
      'M&A integration',
      'Global HR experience',
      'Leadership coaching'
    ]
  },
  'accountant': {
    mustKnow: [
      'General ledger and journal entries',
      'Account reconciliation',
      'Financial statement preparation',
      'Month-end and year-end close',
      'GAAP/IFRS principles',
      'Accounts payable/receivable',
      'Tax preparation basics',
      'Excel proficiency'
    ],
    shouldKnow: [
      'Accounting software (QuickBooks, Xero, NetSuite)',
      'Internal controls',
      'Audit preparation',
      'Cost accounting',
      'Budgeting support',
      'Fixed assets management',
      'Cash flow management',
      'Financial analysis'
    ],
    niceToHave: [
      'CPA certification',
      'ERP systems (SAP, Oracle)',
      'Process improvement',
      'Advanced Excel/VBA',
      'Data analytics',
      'Industry-specific accounting'
    ]
  },
  'sales representative': {
    mustKnow: [
      'Sales process and methodologies',
      'Prospecting and lead generation',
      'Needs assessment and discovery',
      'Product knowledge',
      'Objection handling',
      'Closing techniques',
      'CRM usage (Salesforce)',
      'Pipeline management'
    ],
    shouldKnow: [
      'Sales presentations and demos',
      'Negotiation skills',
      'Account planning',
      'Territory management',
      'Sales forecasting',
      'Relationship building',
      'Competitive analysis',
      'Contract basics'
    ],
    niceToHave: [
      'Industry certifications',
      'Social selling',
      'Sales enablement tools',
      'Technical sales skills',
      'International sales',
      'Channel partner management'
    ]
  },
  'consultant': {
    mustKnow: [
      'Problem-solving frameworks (MECE, hypothesis-driven)',
      'Case interview techniques',
      'Data analysis and synthesis',
      'Stakeholder management',
      'Presentation skills (PowerPoint)',
      'Project management',
      'Business strategy fundamentals',
      'Excel financial modeling'
    ],
    shouldKnow: [
      'Industry knowledge (varies by practice)',
      'Change management',
      'Process improvement methodologies',
      'Client relationship management',
      'Workshop facilitation',
      'Research and analysis',
      'Business writing',
      'Team collaboration'
    ],
    niceToHave: [
      'MBA or relevant certifications',
      'Programming (Python, SQL)',
      'Data visualization tools',
      'Specialized domain expertise',
      'International experience',
      'Thought leadership'
    ]
  }
};

// Location-specific interview insights
const LOCATION_INSIGHTS: Record<string, any> = {
  'us': {
    interviewStyle: 'Direct communication, focus on individual achievements, behavioral questions common',
    culturalNotes: [
      'Emphasize personal accomplishments and "I" statements',
      'Be confident and assertive',
      'Direct eye contact expected',
      'Salary negotiation is standard practice',
      'Follow-up thank you emails expected'
    ],
    commonFormat: 'Phone screen → Technical rounds → Onsite/Virtual → Offer',
    avgDuration: '3-6 weeks',
    negotiationTips: [
      'Research market rates on Levels.fyi and Glassdoor',
      'Negotiate total compensation (base + equity + bonus)',
      'Consider cost of living in target location',
      'Sign-on bonuses are negotiable',
      'Remote work arrangements negotiable'
    ]
  },
  'india': {
    interviewStyle: 'Mix of technical depth and cultural fit, often multiple rounds with hierarchy',
    culturalNotes: [
      'Show respect for seniority and hierarchy',
      'Balance confidence with humility',
      'Long-term commitment valued',
      'Family background questions may arise',
      'Educational pedigree important'
    ],
    commonFormat: 'HR screen → Technical → Manager → Director/VP → Offer',
    avgDuration: '2-4 weeks',
    negotiationTips: [
      'Negotiate fixed vs variable pay split',
      'Ask about ESOPs/stock options',
      'Discuss work-from-home policies',
      'Consider relocation allowances',
      'Performance bonuses are standard'
    ]
  },
  'europe': {
    interviewStyle: 'Balanced approach, emphasis on work-life balance and team fit',
    culturalNotes: [
      'More reserved communication style',
      'Team-oriented language ("we" over "I")',
      'Work-life balance highly valued',
      'Benefits and vacation important',
      'Cultural fit weighted heavily'
    ],
    commonFormat: 'Phone screen → Technical → Team fit → HR/Final',
    avgDuration: '3-5 weeks',
    negotiationTips: [
      'Focus on total package including benefits',
      'Vacation days are negotiable',
      'Consider pension contributions',
      'Remote work increasingly common',
      'Equity less common than US'
    ]
  },
  'uk': {
    interviewStyle: 'Professional, emphasis on competency-based questions',
    culturalNotes: [
      'Professional but friendly demeanor',
      'Understated confidence preferred',
      'Clear communication valued',
      'Diversity and inclusion important',
      'Questions about right to work'
    ],
    commonFormat: 'Phone screen → Competency-based interview → Technical → Final',
    avgDuration: '3-5 weeks',
    negotiationTips: [
      'Salary benchmarks similar to US tech hubs',
      'Consider pension matching',
      'Private healthcare often included',
      'Season ticket loans available',
      'Bonus structures common in finance'
    ]
  },
  'canada': {
    interviewStyle: 'Similar to US but more collaborative emphasis',
    culturalNotes: [
      'Polite and collaborative approach',
      'Team player mentality valued',
      'Diversity highly valued',
      'Bilingual skills bonus (French)',
      'Immigration-friendly'
    ],
    commonFormat: 'Similar to US process',
    avgDuration: '3-5 weeks',
    negotiationTips: [
      'Salaries 10-15% lower than US but check CAD rates',
      'Strong benefits packages',
      'Stock options increasingly common',
      'Remote work widely accepted',
      'Relocation support available'
    ]
  },
  'singapore': {
    interviewStyle: 'Professional, efficiency-focused, multi-stage process',
    culturalNotes: [
      'Punctuality critical',
      'Formal and respectful communication',
      'Meritocracy valued',
      'Regional experience beneficial',
      'English proficiency expected'
    ],
    commonFormat: 'HR → Technical → Manager → Regional lead',
    avgDuration: '2-4 weeks',
    negotiationTips: [
      'Tax advantages make take-home attractive',
      'Consider housing allowances',
      'Flight allowances for expats',
      'CPF contributions (for citizens/PRs)',
      'Annual leave typically 14-21 days'
    ]
  },
  'australia': {
    interviewStyle: 'Casual but professional, work-life balance focus',
    culturalNotes: [
      'Casual and friendly approach',
      'Work-life balance important',
      'Team fit heavily weighted',
      'Direct communication appreciated',
      'Tall poppy syndrome - avoid arrogance'
    ],
    commonFormat: 'Phone screen → Technical → Team interview → Offer',
    avgDuration: '2-4 weeks',
    negotiationTips: [
      'Strong base salaries',
      'Superannuation (9.5-11% on top of salary)',
      '4 weeks annual leave standard',
      'Remote work increasingly common',
      'Salary sacrifice arrangements available'
    ]
  },
  'uae': {
    interviewStyle: 'Formal, emphasis on experience and credentials',
    culturalNotes: [
      'Formal and respectful approach',
      'Appearance and presentation matter',
      'Experience and credentials valued',
      'Relationship building important',
      'Cultural sensitivity critical'
    ],
    commonFormat: 'HR → Technical → Manager → Senior management',
    avgDuration: '3-6 weeks',
    negotiationTips: [
      'Tax-free salaries (major benefit)',
      'Housing allowances common',
      'Flight allowances for family',
      'Education allowances for children',
      'End-of-service gratuity'
    ]
  }
};

// Experience level adjustments
const EXPERIENCE_LEVEL_INSIGHTS: Record<DifficultyLevel, any> = {
  entry: {
    focus: ['Fundamentals', 'Learning potential', 'Cultural fit', 'Passion'],
    questions: ['Why this role?', 'Tell me about a project', 'How do you learn?', 'Team collaboration'],
    tips: [
      'Show enthusiasm and eagerness to learn',
      'Highlight relevant projects and coursework',
      'Demonstrate problem-solving approach',
      'Ask questions about mentorship and growth',
      'Be honest about what you don\'t know'
    ]
  },
  mid: {
    focus: ['Technical depth', 'Independent execution', 'Impact', 'Team collaboration'],
    questions: ['Past projects', 'Technical challenges', 'Collaboration', 'Trade-off decisions'],
    tips: [
      'Show ownership of end-to-end projects',
      'Quantify your impact with metrics',
      'Discuss technical decisions and trade-offs',
      'Demonstrate cross-functional collaboration',
      'Show continuous learning'
    ]
  },
  senior: {
    focus: ['Technical leadership', 'Mentorship', 'System design', 'Business impact'],
    questions: ['Architecture decisions', 'Team leadership', 'Complex problems', 'Strategic thinking'],
    tips: [
      'Emphasize technical leadership and influence',
      'Show mentorship and team development',
      'Discuss system design and scalability',
      'Connect technical decisions to business impact',
      'Demonstrate strategic thinking'
    ]
  },
  staff: {
    focus: ['Technical vision', 'Cross-team impact', 'Technical strategy', 'Organizational influence'],
    questions: ['Org-level impact', 'Technical strategy', 'Influence without authority', 'Complex trade-offs'],
    tips: [
      'Show organization-wide technical impact',
      'Demonstrate technical vision and strategy',
      'Discuss influencing across teams',
      'Highlight architectural decisions at scale',
      'Show business and technical balance'
    ]
  },
  principal: {
    focus: ['Company-wide impact', 'Technical direction', 'Industry influence', 'Strategic leadership'],
    questions: ['Technical direction', 'Industry trends', 'Organizational change', 'Long-term vision'],
    tips: [
      'Demonstrate company-wide technical leadership',
      'Show external influence (speaking, writing)',
      'Discuss multi-year technical strategy',
      'Balance technical depth with business acumen',
      'Highlight organizational transformation'
    ]
  },
  executive: {
    focus: ['Strategic vision', 'Team building', 'Business impact', 'Leadership philosophy'],
    questions: ['Leadership style', 'Org building', 'Strategic decisions', 'Crisis management'],
    tips: [
      'Show proven leadership and team building',
      'Discuss strategic business decisions',
      'Highlight P&L or budget responsibility',
      'Demonstrate executive presence',
      'Share leadership philosophy and values'
    ]
  }
};

export class InterviewPrepService {

  generatePreparation(data: z.infer<typeof interviewPrepSchema>): InterviewPreparation {
    const {
      jobTitle,
      company = '',
      companyType = 'bigtech',
      experienceLevel = 'mid',
      location = 'us',
      jobDescription = '',
      requirements = [],
      interviewRound = 'technical'
    } = data;

    // Get role-specific insights
    const roleInsights = this.getRoleInsights(jobTitle);

    // Get technical topics for role
    const technicalTopics = this.getTechnicalTopics(jobTitle);

    // Generate questions based on role, experience, and round
    const questions = this.generateQuestions(jobTitle, experienceLevel, interviewRound, requirements);

    // Generate comprehensive tips
    const tips = this.generateTips(jobTitle, companyType, experienceLevel, location);

    // Generate preparation checklist
    const preparationChecklist = this.generateChecklist(jobTitle, experienceLevel, interviewRound);

    // Generate resources
    const resources = this.generateResources(jobTitle, experienceLevel);

    // Get company type insights
    const companyTypeInsights = this.getCompanyTypeInsights(companyType, company);

    // Timeline estimation
    const timeline = this.estimateTimeline(companyType, experienceLevel);

    // Red flags to avoid
    const redFlags = this.getRedFlags(jobTitle, experienceLevel, companyType);

    // Get location-specific insights
    const locationInsights = this.getLocationInsights(location);

    return {
      roleInsights,
      questions,
      technicalTopics,
      tips: {
        ...tips,
        location: locationInsights.culturalNotes,
        negotiation: locationInsights.negotiationTips
      },
      preparationChecklist,
      resources,
      timeline,
      redFlags,
      companyTypeInsights
    };
  }

  private getRoleInsights(jobTitle: string): any {
    const roleLower = jobTitle.toLowerCase();

    const insights: Record<string, any> = {
      'engineer': {
        overview: 'Technical role focused on building and maintaining software systems. Emphasis on coding, problem-solving, and system design.',
        keySkills: ['Programming', 'Data structures', 'Algorithms', 'System design', 'Problem-solving'],
        commonChallenges: ['Coding under pressure', 'Explaining technical concepts', 'System design at scale'],
        interviewFocus: ['Coding proficiency', 'Problem-solving approach', 'Communication', 'Technical depth']
      },
      'data': {
        overview: 'Data-focused role involving analysis, modeling, and deriving insights. Strong analytical and statistical skills required.',
        keySkills: ['Statistics', 'SQL', 'Python/R', 'Data visualization', 'Business acumen'],
        commonChallenges: ['Explaining complex analysis', 'SQL optimization', 'Statistical concepts', 'Stakeholder communication'],
        interviewFocus: ['Analytical thinking', 'Statistical knowledge', 'SQL proficiency', 'Business impact']
      },
      'product': {
        overview: 'Product role focused on strategy, roadmap, and user experience. Balance of technical, business, and user empathy.',
        keySkills: ['Product strategy', 'User research', 'Prioritization', 'Stakeholder management', 'Data analysis'],
        commonChallenges: ['Product sense questions', 'Prioritization decisions', 'Stakeholder conflicts', 'Metrics definition'],
        interviewFocus: ['Product thinking', 'User empathy', 'Prioritization', 'Execution ability']
      },
      'design': {
        overview: 'Design role focused on user experience and interface design. Portfolio and design thinking critical.',
        keySkills: ['User research', 'Prototyping', 'Visual design', 'Interaction design', 'Design systems'],
        commonChallenges: ['Portfolio presentation', 'Design critiques', 'Balancing user needs vs business', 'Design systems'],
        interviewFocus: ['Portfolio quality', 'Design process', 'User empathy', 'Collaboration']
      },
      'management': {
        overview: 'Leadership role focused on team development, delivery, and strategy. People and execution skills critical.',
        keySkills: ['People management', 'Technical strategy', 'Stakeholder management', 'Delivery', 'Coaching'],
        commonChallenges: ['Leadership scenarios', 'Conflict resolution', 'Performance management', 'Strategic thinking'],
        interviewFocus: ['Leadership style', 'Team building', 'Delivery track record', 'Strategic thinking']
      },
      'sales': {
        overview: 'Revenue-generating role focused on customer acquisition and relationship management. Quota attainment critical.',
        keySkills: ['Prospecting', 'Negotiation', 'Relationship building', 'Product knowledge', 'Closing'],
        commonChallenges: ['Role play scenarios', 'Objection handling', 'Quota attainment stories', 'Sales process'],
        interviewFocus: ['Sales track record', 'Communication skills', 'Persistence', 'Relationship building']
      },
      'marketing': {
        overview: 'Growth-focused role involving strategy, campaigns, and analytics. ROI and metrics-driven.',
        keySkills: ['Marketing strategy', 'Campaign management', 'Analytics', 'Content creation', 'ROI measurement'],
        commonChallenges: ['Campaign results', 'ROI justification', 'Creative vs data-driven', 'Channel expertise'],
        interviewFocus: ['Marketing strategy', 'Data-driven approach', 'Creativity', 'Results orientation']
      },
      'finance': {
        overview: 'Financial analysis and planning role. Strong quantitative and business acumen required.',
        keySkills: ['Financial modeling', 'Analysis', 'Forecasting', 'Business partnering', 'Excel'],
        commonChallenges: ['Technical assessments', 'Modeling tests', 'Business scenario analysis', 'Market knowledge'],
        interviewFocus: ['Technical skills', 'Business acumen', 'Communication', 'Attention to detail']
      },
      'hr': {
        overview: 'People operations role focused on talent, culture, and employee experience.',
        keySkills: ['Recruiting', 'Employee relations', 'Compliance', 'Organizational development', 'Data analysis'],
        commonChallenges: ['Scenario-based questions', 'Conflict resolution', 'Compliance knowledge', 'Change management'],
        interviewFocus: ['People skills', 'Business partnership', 'Problem-solving', 'Cultural awareness']
      }
    };

    // Find matching insight
    for (const [key, insight] of Object.entries(insights)) {
      if (roleLower.includes(key)) {
        return insight;
      }
    }

    return insights['engineer']; // Default
  }

  private getTechnicalTopics(jobTitle: string): any {
    const roleLower = jobTitle.toLowerCase();

    // Find exact match
    if (ROLE_TECHNICAL_TOPICS[roleLower]) {
      return ROLE_TECHNICAL_TOPICS[roleLower];
    }

    // Fuzzy match
    for (const [role, topics] of Object.entries(ROLE_TECHNICAL_TOPICS)) {
      if (roleLower.includes(role) || role.includes(roleLower)) {
        return topics;
      }
    }

    // Default to software engineer
    return ROLE_TECHNICAL_TOPICS['software engineer'];
  }

  private generateQuestions(
    jobTitle: string,
    experienceLevel: DifficultyLevel,
    interviewRound: InterviewRound,
    requirements: string[]
  ): any {
    const questions = {
      behavioral: this.getBehavioralQuestions(experienceLevel),
      technical: this.getTechnicalQuestions(jobTitle, experienceLevel),
      systemDesign: this.getSystemDesignQuestions(jobTitle, experienceLevel),
      situational: this.getSituationalQuestions(jobTitle, experienceLevel),
      leadership: this.getLeadershipQuestions(experienceLevel)
    };

    return questions;
  }

  private getBehavioralQuestions(level: DifficultyLevel): string[] {
    const baseQuestions = [
      'Tell me about yourself and walk me through your background',
      'Why are you interested in this role?',
      'What are your greatest strengths and weaknesses?',
      'Tell me about a challenging project you worked on',
      'Describe a time when you had to work with a difficult team member',
      'How do you handle failure or setbacks?',
      'Where do you see yourself in 5 years?',
      'Why are you leaving your current role?'
    ];

    const levelQuestions: Record<DifficultyLevel, string[]> = {
      entry: [
        'What interests you about this field?',
        'Describe a project you\'re proud of from school or internship',
        'How do you approach learning new technologies?',
        'Tell me about a time you worked in a team'
      ],
      mid: [
        'Describe your most impactful project',
        'Tell me about a time you had to make a difficult technical decision',
        'How do you prioritize competing tasks?',
        'Describe a time you went above and beyond'
      ],
      senior: [
        'Tell me about a time you mentored someone',
        'Describe how you handle technical debt',
        'How do you influence without authority?',
        'Tell me about a time you led a major initiative'
      ],
      staff: [
        'Describe your approach to technical strategy',
        'How do you drive org-wide technical improvements?',
        'Tell me about a time you influenced company direction',
        'How do you balance technical depth with breadth?'
      ],
      principal: [
        'Describe your technical vision for the company',
        'How do you influence industry direction?',
        'Tell me about transformational change you drove',
        'How do you evaluate and adopt new technologies?'
      ],
      executive: [
        'Describe your leadership philosophy',
        'How do you build and scale high-performing teams?',
        'Tell me about a strategic decision that impacted the business',
        'How do you handle crisis situations?'
      ]
    };

    return [...baseQuestions, ...levelQuestions[level]];
  }

  private getTechnicalQuestions(jobTitle: string, level: DifficultyLevel): string[] {
    const roleLower = jobTitle.toLowerCase();

    const questions: string[] = [];

    if (roleLower.includes('engineer') || roleLower.includes('developer')) {
      questions.push(
        'Explain the difference between a stack and a queue',
        'How would you design a URL shortener?',
        'What is the time complexity of your solution?',
        'Explain how garbage collection works',
        'What are the differences between SQL and NoSQL databases?',
        'How would you optimize a slow database query?',
        'Explain RESTful API design principles',
        'What is your approach to writing testable code?'
      );

      if (level !== 'entry') {
        questions.push(
          'How would you handle millions of requests per second?',
          'Explain microservices architecture trade-offs',
          'How do you approach system observability?',
          'Describe your experience with distributed systems'
        );
      }
    }

    if (roleLower.includes('data scientist') || roleLower.includes('ml')) {
      questions.push(
        'Explain the bias-variance tradeoff',
        'How do you handle imbalanced datasets?',
        'Walk me through your approach to feature engineering',
        'What metrics would you use to evaluate a classification model?',
        'Explain overfitting and how to prevent it',
        'Describe A/B testing methodology',
        'How do you handle missing data?',
        'Explain the difference between bagging and boosting'
      );
    }

    if (roleLower.includes('product')) {
      questions.push(
        'How do you prioritize features?',
        'Walk me through how you would improve [product]',
        'How do you define success metrics for a feature?',
        'How do you handle conflicting stakeholder requests?',
        'Describe your approach to user research',
        'How do you make decisions with incomplete data?'
      );
    }

    return questions;
  }

  private getSystemDesignQuestions(jobTitle: string, level: DifficultyLevel): string[] {
    if (level === 'entry') {
      return [
        'Design a basic URL shortener',
        'Design a simple chat application',
        'Design a to-do list application'
      ];
    }

    const questions = [
      'Design Twitter/X feed system',
      'Design Instagram',
      'Design Uber ride-matching system',
      'Design a rate limiter',
      'Design a distributed cache',
      'Design a notification system',
      'Design YouTube video streaming',
      'Design a search autocomplete system',
      'Design Dropbox/Google Drive',
      'Design a payment system'
    ];

    return questions;
  }

  private getSituationalQuestions(jobTitle: string, level: DifficultyLevel): string[] {
    return [
      'How would you handle a disagreement with your manager?',
      'What would you do if you missed a deadline?',
      'How would you handle a production outage?',
      'What would you do if a teammate wasn\'t pulling their weight?',
      'How would you approach learning a new technology quickly?',
      'What would you do if you discovered a critical bug right before release?',
      'How would you handle conflicting priorities from different stakeholders?',
      'What would you do if you strongly disagreed with a technical decision?'
    ];
  }

  private getLeadershipQuestions(level: DifficultyLevel): string[] {
    if (['entry', 'mid'].includes(level)) {
      return [
        'Describe a time you helped a teammate',
        'How do you give and receive feedback?',
        'Tell me about a time you took initiative'
      ];
    }

    return [
      'How do you build and scale high-performing teams?',
      'Describe your approach to mentoring and coaching',
      'How do you handle underperformance?',
      'Tell me about a time you had to make a difficult people decision',
      'How do you create team culture?',
      'Describe your approach to performance reviews',
      'How do you handle team conflicts?',
      'What\'s your philosophy on delegation?'
    ];
  }

  private generateTips(
    jobTitle: string,
    companyType: CompanyType,
    experienceLevel: DifficultyLevel,
    location: string
  ): any {
    const roleLower = jobTitle.toLowerCase();

    const generalTips = [
      'Research the company thoroughly - products, culture, recent news',
      'Prepare 3-5 thoughtful questions to ask interviewers',
      'Practice your elevator pitch (60-second intro)',
      'Review your resume and be ready to discuss every point',
      'Prepare STAR method stories (Situation, Task, Action, Result)',
      'Test your tech setup 30 minutes before virtual interviews',
      'Dress appropriately for the company culture',
      'Arrive 10-15 minutes early (or join virtual calls 5 min early)',
      'Bring notepad, pen, and extra resumes (for in-person)',
      'Send thank-you emails within 24 hours'
    ];

    const technicalTips = [
      'Practice coding problems daily (LeetCode, HackerRank)',
      'Think out loud during technical interviews',
      'Ask clarifying questions before jumping into solutions',
      'Discuss trade-offs and alternatives',
      'Write clean, readable code with good variable names',
      'Test your code with example inputs',
      'Optimize your solution and discuss time/space complexity',
      'Be honest when you don\'t know something'
    ];

    if (roleLower.includes('senior') || roleLower.includes('staff') || roleLower.includes('principal')) {
      technicalTips.push(
        'Prepare system design examples from your experience',
        'Be ready to discuss technical leadership and mentorship',
        'Show strategic thinking beyond just implementation',
        'Discuss trade-offs at scale and organizational impact'
      );
    }

    const behavioralTips = [
      'Use the STAR method for all behavioral questions',
      'Quantify your impact with specific metrics',
      'Be honest about failures and what you learned',
      'Show growth mindset and continuous learning',
      'Demonstrate collaboration and teamwork',
      'Be specific - avoid generic or vague answers',
      'Show enthusiasm and passion for the role',
      'Be authentic - don\'t try to be someone you\'re not'
    ];

    return {
      general: generalTips,
      technical: technicalTips,
      behavioral: behavioralTips
    };
  }

  private generateChecklist(
    jobTitle: string,
    experienceLevel: DifficultyLevel,
    interviewRound: InterviewRound
  ): any[] {
    const checklists = [
      {
        category: 'Research & Preparation',
        priority: 'high' as const,
        items: [
          'Research company mission, values, and culture',
          'Study recent company news and product launches',
          'Review job description and match your experience',
          'Research interviewers on LinkedIn',
          'Prepare your elevator pitch (60 seconds)',
          'Prepare 5-7 questions to ask interviewers'
        ]
      },
      {
        category: 'Technical Preparation',
        priority: 'high' as const,
        items: [
          'Review fundamental data structures and algorithms',
          'Practice 20-30 coding problems (LeetCode)',
          'Study system design patterns and principles',
          'Review your past projects in detail',
          'Prepare to explain technical decisions you made',
          'Practice whiteboarding or online coding'
        ]
      },
      {
        category: 'Behavioral Preparation',
        priority: 'high' as const,
        items: [
          'Prepare 5-7 STAR stories covering different scenarios',
          'Prepare examples of: leadership, failure, conflict, innovation',
          'Review your resume and be ready to discuss everything',
          'Prepare your "Why this company?" answer',
          'Prepare your "Why this role?" answer',
          'Practice answers to common questions'
        ]
      },
      {
        category: 'Logistics',
        priority: 'medium' as const,
        items: [
          'Test internet connection and backup plan',
          'Test video/audio equipment',
          'Choose quiet, well-lit location',
          'Prepare professional background',
          'Have water nearby',
          'Silence phone notifications',
          'Have resume and notes ready',
          'Plan to arrive/join 10 minutes early'
        ]
      },
      {
        category: 'Day Before',
        priority: 'high' as const,
        items: [
          'Review your preparation notes',
          'Get good night sleep',
          'Prepare outfit (professional)',
          'Confirm interview time and format',
          'Prepare questions for interviewer',
          'Review company recent news',
          'Do a mock interview if possible',
          'Stay hydrated and eat well'
        ]
      },
      {
        category: 'Follow-up',
        priority: 'medium' as const,
        items: [
          'Send thank-you email within 24 hours',
          'Mention specific discussion points',
          'Reiterate your interest in the role',
          'Address any concerns that came up',
          'Connect with interviewers on LinkedIn',
          'Note down your own reflections',
          'Follow up if no response in timeline given'
        ]
      }
    ];

    return checklists;
  }

  private generateResources(jobTitle: string, experienceLevel: DifficultyLevel): any[] {
    const resources = [
      {
        category: 'Coding Practice',
        items: [
          'LeetCode (leetcode.com) - Most popular coding practice platform',
          'HackerRank (hackerrank.com) - Coding challenges and competitions',
          'CodeSignal (codesignal.com) - Practice and company assessments',
          'AlgoExpert (algoexpert.io) - Curated problems with video explanations',
          'NeetCode (neetcode.io) - LeetCode patterns and roadmap',
          'Exercism (exercism.org) - Free coding exercises with mentorship'
        ]
      },
      {
        category: 'System Design',
        items: [
          'System Design Primer (GitHub) - Comprehensive guide',
          'Designing Data-Intensive Applications (Book by Martin Kleppmann)',
          'System Design Interview (Book by Alex Xu)',
          'Grokking the System Design Interview (educative.io)',
          'ByteByteGo (bytebytego.com) - System design newsletter',
          'High Scalability (highscalability.com) - Real-world architectures'
        ]
      },
      {
        category: 'Interview Preparation',
        items: [
          'Cracking the Coding Interview (Book by Gayle McDowell)',
          'Pramp (pramp.com) - Free peer mock interviews',
          'Interviewing.io (interviewing.io) - Anonymous mock interviews',
          'Blind (teamblind.com) - Anonymous professional network',
          'Levels.fyi - Compensation data',
          'Glassdoor - Company reviews and interview experiences'
        ]
      },
      {
        category: 'Behavioral Interview',
        items: [
          'STAR method guide',
          'Amazon Leadership Principles (if applying to Amazon)',
          'Company values and culture pages',
          'LinkedIn interview tips',
          'YouTube mock interview videos',
          'Career coaching platforms (PathMatch, Exponent)'
        ]
      }
    ];

    const roleLower = jobTitle.toLowerCase();

    if (roleLower.includes('data scientist') || roleLower.includes('ml')) {
      resources.push({
        category: 'Data Science/ML',
        items: [
          'Kaggle (kaggle.com) - Competitions and datasets',
          'Introduction to Statistical Learning (Free textbook)',
          'Elements of Statistical Learning (Advanced textbook)',
          'Fast.ai courses - Practical deep learning',
          'Coursera/Andrew Ng ML courses',
          'Papers with Code (paperswithcode.com)'
        ]
      });
    }

    if (roleLower.includes('product')) {
      resources.push({
        category: 'Product Management',
        items: [
          'Cracking the PM Interview (Book)',
          'Decode and Conquer (Book by Lewis Lin)',
          'Exponent (tryexponent.com) - PM interview prep',
          'Product School resources',
          'Mind the Product blog',
          'Lenny\'s Newsletter (lennysnewsletter.com)'
        ]
      });
    }

    if (roleLower.includes('design')) {
      resources.push({
        category: 'Design',
        items: [
          'Dribbble & Behance - Portfolio inspiration',
          'Laws of UX (lawsofux.com)',
          'Nielsen Norman Group articles',
          'Google Design resources',
          'Design Better podcast',
          'Figma community resources'
        ]
      });
    }

    return resources;
  }

  private getCompanyTypeInsights(companyType: CompanyType, companyName: string): any {
    const insights = COMPANY_TYPE_INSIGHTS[companyType];

    return {
      culture: insights.culture,
      interviewStyle: insights.interviewStyle,
      tips: insights.tips
    };
  }

  private getLocationInsights(location: string): any {
    const locationLower = location.toLowerCase();

    // Find matching location
    for (const [key, insights] of Object.entries(LOCATION_INSIGHTS)) {
      if (locationLower.includes(key) || key === 'us') {
        // Check for specific cities/regions
        if (locationLower.includes('india') || locationLower.includes('bangalore') ||
          locationLower.includes('mumbai') || locationLower.includes('delhi')) {
          return LOCATION_INSIGHTS['india'];
        } else if (locationLower.includes('uk') || locationLower.includes('london')) {
          return LOCATION_INSIGHTS['uk'];
        } else if (locationLower.includes('europe') || locationLower.includes('berlin') ||
          locationLower.includes('paris') || locationLower.includes('amsterdam')) {
          return LOCATION_INSIGHTS['europe'];
        } else if (locationLower.includes('canada') || locationLower.includes('toronto')) {
          return LOCATION_INSIGHTS['canada'];
        } else if (locationLower.includes('singapore')) {
          return LOCATION_INSIGHTS['singapore'];
        } else if (locationLower.includes('australia') || locationLower.includes('sydney')) {
          return LOCATION_INSIGHTS['australia'];
        } else if (locationLower.includes('uae') || locationLower.includes('dubai')) {
          return LOCATION_INSIGHTS['uae'];
        }
      }
    }

    return LOCATION_INSIGHTS['us']; // Default
  }

  private estimateTimeline(companyType: CompanyType, experienceLevel: DifficultyLevel): string {
    const baseTimelines: Record<CompanyType, string> = {
      startup: '1-3 weeks',
      scaleup: '2-4 weeks',
      bigtech: '4-8 weeks',
      enterprise: '4-8 weeks',
      consulting: '3-6 weeks',
      finance: '2-6 weeks',
      healthcare: '3-6 weeks'
    };

    const timeline = baseTimelines[companyType];

    if (['senior', 'staff', 'principal', 'executive'].includes(experienceLevel)) {
      return `${timeline} (may be longer for senior roles due to additional rounds)`;
    }

    return timeline;
  }

  private getRedFlags(jobTitle: string, experienceLevel: DifficultyLevel, companyType: CompanyType): string[] {
    const universalRedFlags = [
      'Not asking any questions to the interviewer',
      'Speaking negatively about current/past employers',
      'Being unprepared or not researching the company',
      'Arriving late without communication',
      'Poor communication skills',
      'Arrogance or inability to take feedback',
      'Not being honest about what you don\'t know',
      'Checking phone or appearing distracted'
    ];

    const roleLower = jobTitle.toLowerCase();
    const roleRedFlags: string[] = [];

    if (roleLower.includes('engineer') || roleLower.includes('developer')) {
      roleRedFlags.push(
        'Not explaining your thought process while coding',
        'Jumping to code without clarifying requirements',
        'Not testing your code or considering edge cases',
        'Unable to discuss trade-offs in technical decisions',
        'Poor code quality or unreadable code',
        'Not knowing basics of your listed skills'
      );
    }

    if (roleLower.includes('data')) {
      roleRedFlags.push(
        'Unable to explain statistical concepts clearly',
        'Not validating assumptions in analysis',
        'Overfitting models without recognition',
        'No business context in technical discussions',
        'Poor communication of complex topics'
      );
    }

    if (roleLower.includes('product')) {
      roleRedFlags.push(
        'No user empathy or customer focus',
        'Inability to prioritize or make trade-offs',
        'No data-driven decision making',
        'Poor stakeholder management stories',
        'No clear product sense or intuition'
      );
    }

    if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('manager')) {
      roleRedFlags.push(
        'No leadership or mentorship examples',
        'Inability to influence without authority',
        'Taking all credit without mentioning team',
        'No strategic thinking',
        'Poor conflict resolution examples'
      );
    }

    if (roleLower.includes('sales') || roleLower.includes('marketing')) {
      roleRedFlags.push(
        'Unable to articulate value proposition',
        'No metrics or results orientation',
        'Poor listening skills',
        'Not asking discovery questions',
        'Overselling without substance'
      );
    }

    // Company type specific
    const companyTypeFlags: Record<CompanyType, string[]> = {
      startup: [
        'Need for clear structure and process',
        'Risk aversion',
        'Not willing to wear multiple hats',
        'Focus only on compensation, not mission'
      ],
      bigtech: [
        'Poor communication of technical depth',
        'Not thinking at scale',
        'Unable to handle ambiguity',
        'No examples of impact'
      ],
      consulting: [
        'Unstructured thinking',
        'Poor quantitative skills',
        'Unable to synthesize information',
        'Weak presentation skills'
      ],
      scaleup: [
        'Rigidity or resistance to change',
        'Lack of ownership mentality',
        'Unable to balance speed and quality'
      ],
      enterprise: [
        'Impatience with process',
        'No attention to compliance/security',
        'Poor documentation habits',
        'Inability to work in structured environment'
      ],
      finance: [
        'Weak technical/modeling skills',
        'Poor market knowledge',
        'Unable to handle pressure',
        'Lack of attention to detail'
      ],
      healthcare: [
        'No empathy or patient focus',
        'Disregard for compliance',
        'Lack of domain interest',
        'Poor attention to safety'
      ]
    };

    return [...universalRedFlags, ...roleRedFlags, ...companyTypeFlags[companyType]];
  }

  async generateInterviewPrep(data: z.infer<typeof interviewPrepSchema>): Promise<InterviewPreparation> {
    try {
      const { jobTitle, company, companyType, experienceLevel, location, jobDescription, requirements, interviewRound } = data;

      // Get role-specific technical topics
      const normalizedRole = jobTitle.toLowerCase();
      const technicalTopics = ROLE_TECHNICAL_TOPICS[normalizedRole] || ROLE_TECHNICAL_TOPICS['software engineer'];

      // Get role-specific insights
      const roleInsights = this.getRoleInsights(jobTitle);

      // Generate questions based on role, experience, and round
      const questions = this.generateQuestions(jobTitle, experienceLevel, interviewRound, requirements);

      // Generate comprehensive tips
      const tips = this.generateTips(jobTitle, companyType, experienceLevel, location);

      // Generate preparation checklist
      const preparationChecklist = this.generateChecklist(jobTitle, experienceLevel, interviewRound);

      // Generate resources
      const resources = this.generateResources(jobTitle, experienceLevel);

      // Get company type insights
      const companyTypeData = this.getCompanyTypeInsights(companyType, company || '');

      // Timeline estimation
      const timeline = this.estimateTimeline(companyType, experienceLevel);

      // Red flags to avoid
      const redFlags = this.getRedFlags(jobTitle, experienceLevel, companyType);

      return {
        roleInsights,
        questions,
        technicalTopics,
        tips: {
          ...tips,
          location: this.getLocationInsights(location).culturalNotes,
          negotiation: this.getLocationInsights(location).negotiationTips
        },
        preparationChecklist,
        resources,
        timeline,
        redFlags,
        ...(companyTypeData && { companyTypeInsights: companyTypeData })
      };
    } catch (error) {
      console.error('Error generating interview prep:', error);

      // Return fallback preparation
      return {
        roleInsights: {
          overview: `Prepare for a ${data.jobTitle} position by focusing on core technical skills and behavioral competencies.`,
          keySkills: ['Communication', 'Problem-solving', 'Technical expertise', 'Team collaboration'],
          commonChallenges: ['Technical assessments', 'System design questions', 'Behavioral interviews'],
          interviewFocus: ['Past experience', 'Technical depth', 'Cultural fit', 'Problem-solving approach']
        },
        questions: {
          behavioral: [
            'Tell me about yourself and your experience.',
            'Describe a challenging project you worked on.',
            'How do you handle tight deadlines?'
          ],
          technical: [
            'Explain your approach to problem-solving.',
            'What technologies are you most comfortable with?',
            'Walk me through a recent technical challenge.'
          ],
          systemDesign: [],
          situational: [],
          leadership: []
        },
        technicalTopics: {
          mustKnow: ['Core technical skills', 'Industry fundamentals', 'Best practices'],
          shouldKnow: ['Advanced concepts', 'Tools and frameworks', 'Methodologies'],
          niceToHave: ['Emerging technologies', 'Specialized knowledge']
        },
        tips: {
          general: ['Research the company', 'Prepare STAR stories', 'Ask thoughtful questions'],
          technical: ['Review fundamentals', 'Practice coding', 'Understand trade-offs'],
          behavioral: ['Use specific examples', 'Quantify achievements', 'Show growth mindset'],
          negotiation: ['Know your worth', 'Consider total compensation', 'Be prepared to discuss'],
          location: []
        },
        preparationChecklist: [
          {
            category: 'Research',
            items: ['Company background', 'Role requirements', 'Team structure'],
            priority: 'high' as const
          },
          {
            category: 'Technical Prep',
            items: ['Review key concepts', 'Practice problems', 'Build projects'],
            priority: 'high' as const
          },
          {
            category: 'Behavioral Prep',
            items: ['Prepare stories', 'Practice answers', 'Mock interviews'],
            priority: 'medium' as const
          }
        ],
        resources: [
          {
            category: 'Learning',
            items: ['Online courses', 'Documentation', 'Books']
          }
        ],
        timeline: '2-4 weeks of preparation recommended',
        redFlags: ['Lack of preparation', 'Poor communication', 'No questions for interviewer']
      };
    }
  }
}

export const interviewPrepService = new InterviewPrepService();