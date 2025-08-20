import fetch from 'node-fetch';

const jobs = [
  // Software Engineering Jobs
  {
    title: "Senior Full Stack Developer",
    companyName: "TechVision Solutions",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 120000,
    maxSalary: 180000,
    description: "We are seeking a highly skilled Senior Full Stack Developer to join our innovative team. You will be responsible for developing and maintaining web applications using modern technologies including React, Node.js, and cloud platforms.",
    requirements: "• 5+ years of experience in full stack development\n• Proficiency in React, Node.js, TypeScript\n• Experience with AWS or Azure cloud platforms\n• Strong understanding of databases (SQL and NoSQL)\n• Knowledge of microservices architecture\n• Experience with CI/CD pipelines",
    responsibilities: "• Design and develop scalable web applications\n• Collaborate with cross-functional teams\n• Mentor junior developers\n• Participate in code reviews and technical discussions\n• Implement best practices for security and performance",
    skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker"],
    benefits: "• Competitive salary and equity package\n• Health, dental, and vision insurance\n• 401(k) with company matching\n• Flexible PTO policy\n• Remote work options\n• Professional development budget"
  },
  {
    title: "DevOps Engineer",
    companyName: "CloudFirst Inc",
    location: "Austin, TX",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 90000,
    maxSalary: 140000,
    description: "Join our DevOps team to build and maintain robust infrastructure that supports our rapidly growing platform. You'll work with cutting-edge technologies and help shape our deployment strategies.",
    requirements: "• 3+ years of DevOps or infrastructure experience\n• Proficiency with Kubernetes and Docker\n• Experience with CI/CD tools (Jenkins, GitLab CI)\n• Knowledge of Infrastructure as Code (Terraform, Ansible)\n• Cloud platform experience (AWS, GCP, Azure)\n• Strong scripting skills (Python, Bash)",
    responsibilities: "• Design and implement automated deployment pipelines\n• Manage containerized applications using Kubernetes\n• Monitor system performance and reliability\n• Implement security best practices\n• Collaborate with development teams on infrastructure needs",
    skills: ["Kubernetes", "Docker", "Terraform", "AWS", "Jenkins", "Python"],
    benefits: "• Remote-first culture\n• Comprehensive health benefits\n• Stock options\n• Learning and development stipend\n• Home office setup allowance"
  },
  {
    title: "Frontend React Developer",
    companyName: "Digital Dynamics",
    location: "New York, NY",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 85000,
    maxSalary: 125000,
    description: "We're looking for a passionate Frontend Developer to create exceptional user experiences. You'll work on modern React applications that serve millions of users worldwide.",
    requirements: "• 3+ years of React development experience\n• Strong proficiency in JavaScript/TypeScript\n• Experience with state management (Redux, Context API)\n• Knowledge of modern CSS frameworks (Tailwind, Styled Components)\n• Understanding of responsive design principles\n• Experience with testing frameworks (Jest, React Testing Library)",
    responsibilities: "• Develop responsive and interactive user interfaces\n• Collaborate with UX/UI designers\n• Optimize applications for performance\n• Write comprehensive tests\n• Participate in agile development processes",
    skills: ["React", "TypeScript", "Redux", "Tailwind CSS", "Jest"],
    benefits: "• Competitive salary\n• Health and wellness benefits\n• Catered lunches\n• Professional development opportunities\n• Flexible working hours"
  },
  {
    title: "Backend Python Developer",
    companyName: "DataFlow Systems",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 110000,
    maxSalary: 160000,
    description: "Join our backend team to build scalable APIs and data processing systems. You'll work with large-scale distributed systems and help architect solutions for complex data challenges.",
    requirements: "• 5+ years of Python development experience\n• Experience with FastAPI or Django\n• Strong database skills (PostgreSQL, MongoDB)\n• Knowledge of distributed systems and microservices\n• Experience with message queues (RabbitMQ, Kafka)\n• Understanding of caching strategies (Redis, Memcached)",
    responsibilities: "• Design and implement RESTful APIs\n• Optimize database queries and performance\n• Build data processing pipelines\n• Ensure system security and scalability\n• Mentor junior developers",
    skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Kafka", "Docker"],
    benefits: "• Competitive compensation package\n• Comprehensive benefits\n• Equity participation\n• Flexible work arrangements\n• Professional growth opportunities"
  },
  {
    title: "Mobile App Developer (iOS/Android)",
    companyName: "MobileFirst Studios",
    location: "Los Angeles, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 95000,
    maxSalary: 135000,
    description: "Create innovative mobile applications that delight users. You'll work on both iOS and Android platforms using modern development frameworks and tools.",
    requirements: "• 3+ years of mobile app development experience\n• Proficiency in React Native or Flutter\n• Native iOS (Swift) or Android (Kotlin) experience\n• Understanding of mobile UI/UX principles\n• Experience with app store deployment\n• Knowledge of mobile testing frameworks",
    responsibilities: "• Develop cross-platform mobile applications\n• Optimize app performance and user experience\n• Collaborate with designers and product managers\n• Implement push notifications and analytics\n• Maintain code quality and documentation",
    skills: ["React Native", "Swift", "Kotlin", "Flutter", "Firebase"],
    benefits: "• Competitive salary and bonuses\n• Health insurance and wellness programs\n• Creative work environment\n• Latest tech equipment\n• Team building activities"
  },

  // Marketing Jobs
  {
    title: "Digital Marketing Manager",
    companyName: "GrowthLab Marketing",
    location: "Chicago, IL",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 95000,
    description: "Lead our digital marketing initiatives and drive growth through innovative campaigns. You'll manage multiple channels and work with cross-functional teams to achieve business objectives.",
    requirements: "• 4+ years of digital marketing experience\n• Proficiency in Google Analytics, Google Ads\n• Experience with social media advertising (Facebook, LinkedIn, Twitter)\n• Knowledge of SEO/SEM best practices\n• Content marketing and email marketing experience\n• Data analysis and reporting skills",
    responsibilities: "• Develop and execute digital marketing strategies\n• Manage PPC campaigns and budgets\n• Create content for various marketing channels\n• Analyze campaign performance and ROI\n• Collaborate with sales and product teams",
    skills: ["Google Analytics", "Google Ads", "SEO", "Content Marketing", "Social Media"],
    benefits: "• Performance-based bonuses\n• Health and dental insurance\n• Professional development budget\n• Flexible work schedule\n• Marketing conference attendance"
  },
  {
    title: "Content Marketing Specialist",
    companyName: "ContentCraft Agency",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 55000,
    maxSalary: 75000,
    description: "Create compelling content that drives engagement and conversions. You'll work on blog posts, social media content, email campaigns, and marketing materials for diverse clients.",
    requirements: "• 3+ years of content marketing experience\n• Excellent writing and editing skills\n• Experience with content management systems\n• Knowledge of SEO writing techniques\n• Social media management experience\n• Basic graphic design skills (Canva, Adobe Creative Suite)",
    responsibilities: "• Create blog posts, articles, and web content\n• Develop social media content calendars\n• Write email marketing campaigns\n• Optimize content for SEO\n• Collaborate with design and marketing teams",
    skills: ["Content Writing", "SEO", "WordPress", "Social Media", "Email Marketing"],
    benefits: "• Fully remote position\n• Flexible working hours\n• Health insurance coverage\n• Professional development opportunities\n• Creative freedom and autonomy"
  },
  {
    title: "Social Media Manager",
    companyName: "Brand Builders Co",
    location: "Miami, FL",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 50000,
    maxSalary: 70000,
    description: "Manage social media presence for multiple brands and build engaged communities. You'll create content, run campaigns, and analyze performance across all major platforms.",
    requirements: "• 3+ years of social media management experience\n• Proficiency in social media scheduling tools (Hootsuite, Buffer)\n• Experience with paid social advertising\n• Strong visual content creation skills\n• Knowledge of social media analytics\n• Understanding of brand voice and messaging",
    responsibilities: "• Develop social media strategies and content calendars\n• Create engaging visual and written content\n• Manage community interactions and responses\n• Run paid social media campaigns\n• Track and report on social media metrics",
    skills: ["Social Media Marketing", "Content Creation", "Paid Advertising", "Analytics"],
    benefits: "• Vibrant office culture\n• Health and wellness benefits\n• Creative workspace\n• Team lunches and events\n• Growth opportunities"
  },
  {
    title: "SEO Specialist",
    companyName: "SearchPro Digital",
    location: "Denver, CO",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 60000,
    maxSalary: 85000,
    description: "Drive organic traffic growth through strategic SEO initiatives. You'll work on technical SEO, content optimization, and link building strategies for diverse clients.",
    requirements: "• 3+ years of SEO experience\n• Proficiency in SEO tools (SEMrush, Ahrefs, Moz)\n• Technical SEO knowledge (site speed, crawling, indexing)\n• Experience with Google Search Console and Analytics\n• Understanding of keyword research and competitor analysis\n• Basic HTML/CSS knowledge",
    responsibilities: "• Conduct SEO audits and develop optimization strategies\n• Perform keyword research and competitor analysis\n• Optimize website content and meta tags\n• Build high-quality backlinks\n• Monitor and report on SEO performance",
    skills: ["SEO", "Google Analytics", "SEMrush", "Technical SEO", "Link Building"],
    benefits: "• Remote work flexibility\n• Performance bonuses\n• Health insurance\n• Professional certification support\n• Career advancement opportunities"
  },
  {
    title: "Email Marketing Specialist",
    companyName: "EmailExpert Solutions",
    location: "Boston, MA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 55000,
    maxSalary: 75000,
    description: "Design and execute email marketing campaigns that drive engagement and revenue. You'll work with automation tools and analyze campaign performance to optimize results.",
    requirements: "• 3+ years of email marketing experience\n• Proficiency in email platforms (Mailchimp, Klaviyo, SendGrid)\n• Experience with email automation and segmentation\n• HTML/CSS skills for email templates\n• A/B testing and analytics experience\n• Understanding of deliverability best practices",
    responsibilities: "• Create and manage email marketing campaigns\n• Develop automated email sequences\n• Design responsive email templates\n• Segment audiences for targeted messaging\n• Analyze campaign performance and optimize results",
    skills: ["Email Marketing", "Marketing Automation", "HTML/CSS", "Analytics"],
    benefits: "• Competitive salary\n• Comprehensive benefits package\n• Flexible work arrangements\n• Professional development budget\n• Collaborative team environment"
  },

  // Sales Jobs
  {
    title: "Enterprise Sales Executive",
    companyName: "SalesPro Enterprise",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 80000,
    maxSalary: 120000,
    description: "Drive enterprise sales for our B2B software solutions. You'll work with Fortune 500 companies to understand their needs and provide technology solutions that transform their business.",
    requirements: "• 5+ years of enterprise B2B sales experience\n• Track record of closing deals $100K+\n• Experience with CRM systems (Salesforce, HubSpot)\n• Strong presentation and negotiation skills\n• Technology or SaaS sales background preferred\n• Bachelor's degree in Business or related field",
    responsibilities: "• Identify and pursue enterprise sales opportunities\n• Conduct product demonstrations and presentations\n• Negotiate contracts and close deals\n• Build relationships with C-level executives\n• Collaborate with technical teams for solution design",
    skills: ["Enterprise Sales", "B2B Sales", "Salesforce", "Negotiation", "Presentations"],
    benefits: "• Base salary plus uncapped commission\n• Comprehensive benefits package\n• Sales incentive trips\n• Professional development programs\n• Stock options"
  },
  {
    title: "Inside Sales Representative",
    companyName: "TechSales Solutions",
    location: "Austin, TX",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "entry",
    minSalary: 45000,
    maxSalary: 65000,
    description: "Join our inside sales team to help businesses discover our software solutions. You'll work with inbound leads and conduct outbound prospecting to build a strong sales pipeline.",
    requirements: "• 1-2 years of sales experience (entry level considered)\n• Excellent communication and phone skills\n• Experience with CRM systems preferred\n• Goal-oriented and self-motivated\n• Bachelor's degree preferred\n• Technology aptitude and interest in SaaS",
    responsibilities: "• Follow up on inbound leads and qualify prospects\n• Conduct outbound prospecting calls and emails\n• Schedule demos for field sales team\n• Maintain accurate records in CRM\n• Achieve monthly and quarterly sales targets",
    skills: ["Inside Sales", "Lead Generation", "CRM", "Phone Sales", "Prospecting"],
    benefits: "• Base salary plus commission\n• Health and dental insurance\n• Career growth opportunities\n• Sales training programs\n• Team building activities"
  },
  {
    title: "Account Manager",
    companyName: "ClientFirst Services",
    location: "Chicago, IL",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 60000,
    maxSalary: 80000,
    description: "Manage and grow relationships with existing clients to ensure satisfaction and identify expansion opportunities. You'll serve as the primary point of contact for key accounts.",
    requirements: "• 3+ years of account management experience\n• Strong relationship building skills\n• Experience with client retention and upselling\n• Proficiency in CRM and account management tools\n• Excellent problem-solving abilities\n• Bachelor's degree in Business or related field",
    responsibilities: "• Manage portfolio of existing client accounts\n• Identify upselling and cross-selling opportunities\n• Resolve client issues and ensure satisfaction\n• Conduct regular business reviews with clients\n• Collaborate with internal teams to deliver solutions",
    skills: ["Account Management", "Client Relations", "Upselling", "Problem Solving"],
    benefits: "• Competitive base salary and bonuses\n• Comprehensive benefits\n• Professional development opportunities\n• Flexible work schedule\n• Client entertainment budget"
  },
  {
    title: "Business Development Representative",
    companyName: "GrowthEngine Corp",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "entry",
    minSalary: 50000,
    maxSalary: 70000,
    description: "Generate new business opportunities through strategic outreach and relationship building. You'll identify potential clients and set the foundation for future sales success.",
    requirements: "• 1-3 years of sales or business development experience\n• Strong prospecting and lead generation skills\n• Experience with sales tools (LinkedIn Sales Navigator, Outreach)\n• Excellent written and verbal communication\n• Self-motivated and results-driven\n• Bachelor's degree preferred",
    responsibilities: "• Research and identify potential business opportunities\n• Conduct outbound prospecting via phone, email, and social media\n• Qualify leads and schedule meetings for sales team\n• Maintain prospect database and track activities\n• Collaborate with marketing on lead generation campaigns",
    skills: ["Business Development", "Lead Generation", "Prospecting", "LinkedIn Sales Navigator"],
    benefits: "• Remote work flexibility\n• Base salary plus performance bonuses\n• Health insurance coverage\n• Professional development budget\n• Career advancement opportunities"
  },
  {
    title: "Sales Operations Analyst",
    companyName: "SalesOps Pro",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 95000,
    description: "Support sales team efficiency through data analysis, process optimization, and sales technology management. You'll provide insights that drive sales performance and growth.",
    requirements: "• 3+ years of sales operations or analytics experience\n• Strong analytical and data visualization skills\n• Proficiency in Salesforce and sales analytics tools\n• Excel/Google Sheets expertise\n• Experience with sales forecasting and reporting\n• SQL knowledge preferred",
    responsibilities: "• Analyze sales performance and provide insights\n• Manage sales technology stack and integrations\n• Create dashboards and reports for sales leadership\n• Optimize sales processes and workflows\n• Support sales forecasting and planning",
    skills: ["Sales Operations", "Salesforce", "Data Analysis", "Excel", "SQL"],
    benefits: "• Competitive salary and bonuses\n• Comprehensive benefits package\n• Professional development opportunities\n• Flexible work arrangements\n• Stock options"
  },

  // HR Jobs
  {
    title: "HR Business Partner",
    companyName: "PeopleFirst Solutions",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 85000,
    maxSalary: 115000,
    description: "Partner with business leaders to drive HR strategy and support organizational goals. You'll provide strategic HR guidance and help build a positive workplace culture.",
    requirements: "• 5+ years of HR business partner experience\n• Strong knowledge of employment law and HR best practices\n• Experience with performance management and employee relations\n• SHRM-CP or PHR certification preferred\n• Bachelor's degree in HR or related field\n• Change management experience",
    responsibilities: "• Partner with leadership on HR strategy and initiatives\n• Provide guidance on employee relations issues\n• Support performance management processes\n• Lead organizational change initiatives\n• Develop and implement HR policies and procedures",
    skills: ["HR Strategy", "Employee Relations", "Performance Management", "Change Management"],
    benefits: "• Competitive salary and annual bonus\n• Comprehensive benefits package\n• Professional development budget\n• Flexible work arrangements\n• Wellness programs"
  },
  {
    title: "Talent Acquisition Specialist",
    companyName: "TalentHub Recruiting",
    location: "San Diego, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 60000,
    maxSalary: 80000,
    description: "Lead end-to-end recruitment efforts to attract top talent across various roles. You'll work with hiring managers to understand needs and build strong candidate pipelines.",
    requirements: "• 3+ years of recruiting or talent acquisition experience\n• Experience with applicant tracking systems (ATS)\n• Strong sourcing skills using LinkedIn and other platforms\n• Knowledge of employment law and hiring best practices\n• Excellent interviewing and assessment skills\n• Bachelor's degree preferred",
    responsibilities: "• Partner with hiring managers to understand role requirements\n• Source candidates through various channels\n• Conduct initial candidate screenings and interviews\n• Manage candidate experience throughout hiring process\n• Build and maintain talent pipelines",
    skills: ["Recruiting", "Talent Sourcing", "ATS", "Interviewing", "LinkedIn Recruiting"],
    benefits: "• Competitive salary with recruiting bonuses\n• Health and dental insurance\n• Professional development opportunities\n• Flexible work schedule\n• Recruiting conference attendance"
  },
  {
    title: "HR Generalist",
    companyName: "CompleteCare HR",
    location: "Phoenix, AZ",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 55000,
    maxSalary: 75000,
    description: "Support all aspects of HR operations including employee relations, benefits administration, and policy implementation. You'll wear many hats in this dynamic role.",
    requirements: "• 3+ years of HR generalist experience\n• Knowledge of HRIS systems and HR processes\n• Understanding of employment law and compliance\n• Experience with benefits administration\n• Strong communication and problem-solving skills\n• Bachelor's degree in HR or related field",
    responsibilities: "• Handle employee relations issues and investigations\n• Administer benefits programs and open enrollment\n• Support onboarding and offboarding processes\n• Maintain employee records and HR documentation\n• Assist with policy development and implementation",
    skills: ["HR Operations", "Employee Relations", "Benefits Administration", "HRIS"],
    benefits: "• Comprehensive benefits package\n• Health, dental, and vision insurance\n• 401(k) with company matching\n• Professional development support\n• Collaborative work environment"
  },
  {
    title: "Learning and Development Specialist",
    companyName: "SkillBuilder Corp",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 65000,
    maxSalary: 85000,
    description: "Design and deliver training programs that support employee growth and organizational development. You'll create engaging learning experiences and measure their impact.",
    requirements: "• 3+ years of learning and development experience\n• Experience with learning management systems (LMS)\n• Instructional design and curriculum development skills\n• Knowledge of adult learning principles\n• Presentation and facilitation skills\n• Bachelor's degree in Education, HR, or related field",
    responsibilities: "• Assess training needs and develop learning solutions\n• Create training materials and online courses\n• Facilitate workshops and training sessions\n• Manage learning management system\n• Evaluate training effectiveness and ROI",
    skills: ["Training Design", "LMS", "Instructional Design", "Facilitation"],
    benefits: "• Remote work flexibility\n• Professional development budget\n• Health insurance coverage\n• Learning and certification support\n• Career growth opportunities"
  },
  {
    title: "Compensation and Benefits Analyst",
    companyName: "RewardSystems Inc",
    location: "Dallas, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 90000,
    description: "Analyze and design competitive compensation and benefits programs. You'll conduct market research and provide recommendations to ensure fair and competitive offerings.",
    requirements: "• 3+ years of compensation and benefits experience\n• Strong analytical and data analysis skills\n• Knowledge of compensation survey data and benchmarking\n• Experience with HRIS and compensation software\n• Understanding of benefits design and administration\n• Bachelor's degree in HR, Finance, or related field",
    responsibilities: "• Conduct compensation analysis and market studies\n• Design and implement compensation structures\n• Analyze benefits programs and make recommendations\n• Support annual compensation planning process\n• Ensure compliance with compensation regulations",
    skills: ["Compensation Analysis", "Benefits Design", "Data Analysis", "Market Research"],
    benefits: "• Competitive salary and annual bonus\n• Comprehensive benefits package\n• Flexible work arrangements\n• Professional certification support\n• Career advancement opportunities"
  },

  // Other Professional Roles
  {
    title: "Project Manager",
    companyName: "ProjectPro Solutions",
    location: "Atlanta, GA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 75000,
    maxSalary: 100000,
    description: "Lead cross-functional projects from initiation to completion. You'll coordinate resources, manage timelines, and ensure successful project delivery for our clients.",
    requirements: "• 4+ years of project management experience\n• PMP or similar certification preferred\n• Experience with project management tools (Jira, Asana, MS Project)\n• Strong organizational and communication skills\n• Agile and Scrum methodology experience\n• Bachelor's degree in Business or related field",
    responsibilities: "• Plan and execute projects from start to finish\n• Manage project scope, timeline, and budget\n• Coordinate cross-functional project teams\n• Communicate project status to stakeholders\n• Identify and mitigate project risks",
    skills: ["Project Management", "Agile", "Scrum", "Jira", "Risk Management"],
    benefits: "• Competitive salary and bonuses\n• Health and wellness benefits\n• Professional certification support\n• Flexible work schedule\n• Career development opportunities"
  },
  {
    title: "Data Analyst",
    companyName: "DataInsights Pro",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 95000,
    description: "Transform data into actionable insights that drive business decisions. You'll work with large datasets and create visualizations that tell compelling stories.",
    requirements: "• 3+ years of data analysis experience\n• Proficiency in SQL and data visualization tools (Tableau, Power BI)\n• Experience with Python or R for data analysis\n• Strong statistical analysis skills\n• Knowledge of database systems and data warehousing\n• Bachelor's degree in Statistics, Mathematics, or related field",
    responsibilities: "• Analyze complex datasets to identify trends and patterns\n• Create dashboards and reports for business stakeholders\n• Develop statistical models and predictive analytics\n• Collaborate with teams to understand data requirements\n• Present findings and recommendations to leadership",
    skills: ["Data Analysis", "SQL", "Python", "Tableau", "Statistics"],
    benefits: "• Fully remote position\n• Competitive salary\n• Health insurance coverage\n• Professional development budget\n• Flexible working hours"
  },
  {
    title: "UX/UI Designer",
    companyName: "DesignCraft Studio",
    location: "Portland, OR",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 80000,
    maxSalary: 110000,
    description: "Create intuitive and beautiful user experiences for web and mobile applications. You'll work closely with product teams to design solutions that delight users.",
    requirements: "• 3+ years of UX/UI design experience\n• Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)\n• Experience with user research and usability testing\n• Understanding of responsive design principles\n• Knowledge of design systems and component libraries\n• Portfolio demonstrating design process and outcomes",
    responsibilities: "• Conduct user research and create user personas\n• Design wireframes, prototypes, and high-fidelity mockups\n• Collaborate with developers on design implementation\n• Conduct usability testing and iterate on designs\n• Maintain and evolve design systems",
    skills: ["UX Design", "UI Design", "Figma", "User Research", "Prototyping"],
    benefits: "• Creative work environment\n• Health and wellness benefits\n• Design conference attendance\n• Latest design tools and equipment\n• Professional growth opportunities"
  },
  {
    title: "Product Manager",
    companyName: "InnovateTech Products",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Drive product strategy and roadmap for our flagship software platform. You'll work with engineering, design, and business teams to deliver products that solve customer problems.",
    requirements: "• 5+ years of product management experience\n• Experience with agile development methodologies\n• Strong analytical and problem-solving skills\n• Knowledge of product management tools (Jira, Confluence, Roadmunk)\n• Technical background or ability to work closely with engineers\n• MBA or technical degree preferred",
    responsibilities: "• Define product vision and strategy\n• Develop and maintain product roadmap\n• Gather and prioritize product requirements\n• Work with engineering teams on product development\n• Analyze product metrics and user feedback",
    skills: ["Product Management", "Product Strategy", "Agile", "Analytics", "Roadmapping"],
    benefits: "• Competitive salary and equity\n• Comprehensive benefits package\n• Product conference attendance\n• Innovation time and resources\n• Career advancement opportunities"
  },
  {
    title: "Business Analyst",
    companyName: "BusinessSolutions Corp",
    location: "Washington, DC",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 95000,
    description: "Bridge the gap between business needs and technical solutions. You'll analyze business processes and requirements to help drive organizational improvements.",
    requirements: "• 3+ years of business analysis experience\n• Strong analytical and problem-solving skills\n• Experience with requirements gathering and documentation\n• Knowledge of business process modeling\n• Proficiency in analysis tools (Excel, Visio, SQL)\n• Bachelor's degree in Business or related field",
    responsibilities: "• Gather and document business requirements\n• Analyze business processes and identify improvements\n• Create functional specifications and user stories\n• Facilitate stakeholder meetings and workshops\n• Support testing and implementation of solutions",
    skills: ["Business Analysis", "Requirements Gathering", "Process Improvement", "SQL"],
    benefits: "• Competitive salary\n• Health and dental insurance\n• Professional development opportunities\n• Flexible work arrangements\n• Career growth potential"
  },

  // Additional Tech Roles
  {
    title: "QA Engineer",
    companyName: "QualityFirst Testing",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 75000,
    maxSalary: 100000,
    description: "Ensure software quality through comprehensive testing strategies. You'll design test plans, execute test cases, and work with development teams to resolve issues.",
    requirements: "• 3+ years of QA testing experience\n• Experience with manual and automated testing\n• Knowledge of testing frameworks (Selenium, Cypress)\n• Understanding of API testing and tools (Postman)\n• Experience with bug tracking systems (Jira)\n• Knowledge of agile testing methodologies",
    responsibilities: "• Create comprehensive test plans and test cases\n• Execute manual and automated tests\n• Identify, document, and track software defects\n• Collaborate with developers on bug resolution\n• Participate in agile ceremonies and release planning",
    skills: ["QA Testing", "Test Automation", "Selenium", "API Testing", "Jira"],
    benefits: "• Remote work flexibility\n• Competitive salary\n• Health insurance coverage\n• Professional development budget\n• Quality tools and resources"
  },
  {
    title: "Cybersecurity Analyst",
    companyName: "SecureShield Technologies",
    location: "Washington, DC",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 85000,
    maxSalary: 115000,
    description: "Protect organizational assets through proactive security monitoring and incident response. You'll implement security measures and investigate potential threats.",
    requirements: "• 3+ years of cybersecurity experience\n• Knowledge of security frameworks (NIST, ISO 27001)\n• Experience with SIEM tools and log analysis\n• Understanding of network security and protocols\n• Security certifications (Security+, CISSP) preferred\n• Incident response and forensics experience",
    responsibilities: "• Monitor security events and investigate incidents\n• Implement and maintain security controls\n• Conduct vulnerability assessments and penetration testing\n• Develop security policies and procedures\n• Provide security training and awareness",
    skills: ["Cybersecurity", "SIEM", "Incident Response", "Vulnerability Assessment"],
    benefits: "• Government contract opportunities\n• Security clearance support\n• Comprehensive benefits\n• Certification reimbursement\n• Career advancement in security"
  },
  {
    title: "Database Administrator",
    companyName: "DataCore Systems",
    location: "Phoenix, AZ",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 90000,
    maxSalary: 125000,
    description: "Manage and optimize database systems to ensure high performance and availability. You'll work with various database technologies and support mission-critical applications.",
    requirements: "• 5+ years of database administration experience\n• Expertise in SQL Server, Oracle, or PostgreSQL\n• Experience with database performance tuning\n• Knowledge of backup and recovery procedures\n• Understanding of database security best practices\n• Cloud database experience (AWS RDS, Azure SQL) preferred",
    responsibilities: "• Install, configure, and maintain database systems\n• Monitor database performance and optimize queries\n• Implement backup and recovery strategies\n• Ensure database security and compliance\n• Support application development teams",
    skills: ["Database Administration", "SQL Server", "PostgreSQL", "Performance Tuning"],
    benefits: "• Competitive salary and bonuses\n• Health and wellness benefits\n• On-call compensation\n• Professional certification support\n• Technical training opportunities"
  },
  {
    title: "Cloud Solutions Architect",
    companyName: "CloudFirst Architecture",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 130000,
    maxSalary: 180000,
    description: "Design and implement cloud-based solutions that meet business requirements. You'll work with clients to architect scalable and secure cloud infrastructures.",
    requirements: "• 6+ years of cloud architecture experience\n• Expertise in AWS, Azure, or Google Cloud Platform\n• Experience with containerization (Docker, Kubernetes)\n• Knowledge of infrastructure as code (Terraform, CloudFormation)\n• Understanding of microservices architecture\n• Cloud certifications (AWS Solutions Architect, Azure Architect)",
    responsibilities: "• Design cloud architecture solutions for clients\n• Lead cloud migration and transformation projects\n• Implement security and compliance best practices\n• Optimize cloud costs and performance\n• Mentor junior architects and engineers",
    skills: ["Cloud Architecture", "AWS", "Kubernetes", "Terraform", "Microservices"],
    benefits: "• Senior-level compensation\n• Equity participation\n• Comprehensive benefits\n• Cloud certification reimbursement\n• Technical leadership opportunities"
  },

  // Finance and Operations
  {
    title: "Financial Analyst",
    companyName: "FinanceMax Solutions",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 70000,
    maxSalary: 95000,
    description: "Provide financial analysis and insights to support business decision-making. You'll work on budgeting, forecasting, and financial modeling for various business units.",
    requirements: "• 3+ years of financial analysis experience\n• Strong proficiency in Excel and financial modeling\n• Knowledge of accounting principles and financial statements\n• Experience with financial planning software\n• CPA or CFA certification preferred\n• Bachelor's degree in Finance or Accounting",
    responsibilities: "• Prepare financial reports and variance analysis\n• Support budgeting and forecasting processes\n• Create financial models for business initiatives\n• Analyze financial performance and trends\n• Present findings to senior management",
    skills: ["Financial Analysis", "Excel", "Financial Modeling", "Budgeting", "Forecasting"],
    benefits: "• Competitive salary and bonuses\n• Comprehensive benefits package\n• Professional certification support\n• Career advancement opportunities\n• Finance training programs"
  },
  {
    title: "Operations Manager",
    companyName: "EfficiencyPro Operations",
    location: "Chicago, IL",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 85000,
    maxSalary: 115000,
    description: "Oversee daily operations and implement process improvements to drive efficiency. You'll manage teams and ensure smooth execution of business operations.",
    requirements: "• 5+ years of operations management experience\n• Strong leadership and team management skills\n• Experience with process improvement methodologies (Lean, Six Sigma)\n• Knowledge of project management principles\n• Data analysis and reporting skills\n• Bachelor's degree in Operations or Business",
    responsibilities: "• Manage daily operations and team performance\n• Identify and implement process improvements\n• Develop operational policies and procedures\n• Monitor KPIs and operational metrics\n• Collaborate with other departments on cross-functional initiatives",
    skills: ["Operations Management", "Process Improvement", "Team Leadership", "Lean Six Sigma"],
    benefits: "• Management-level compensation\n• Health and wellness benefits\n• Leadership development programs\n• Performance bonuses\n• Career advancement opportunities"
  },

  // Customer Service and Support
  {
    title: "Customer Success Manager",
    companyName: "CustomerFirst Solutions",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 65000,
    maxSalary: 85000,
    description: "Ensure customer satisfaction and drive product adoption. You'll work closely with clients to help them achieve their goals and maximize value from our solutions.",
    requirements: "• 3+ years of customer success or account management experience\n• Strong relationship building and communication skills\n• Experience with CRM and customer success platforms\n• SaaS or technology industry experience preferred\n• Problem-solving and analytical skills\n• Bachelor's degree preferred",
    responsibilities: "• Onboard new customers and ensure successful adoption\n• Build strong relationships with key stakeholders\n• Identify expansion opportunities and reduce churn\n• Provide product training and support\n• Gather customer feedback and collaborate with product teams",
    skills: ["Customer Success", "Account Management", "Relationship Building", "SaaS"],
    benefits: "• Remote work flexibility\n• Competitive salary and bonuses\n• Health insurance coverage\n• Customer success training\n• Career growth opportunities"
  },
  {
    title: "Technical Support Specialist",
    companyName: "TechSupport Pro",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "entry",
    minSalary: 45000,
    maxSalary: 60000,
    description: "Provide technical support to customers and resolve complex technical issues. You'll troubleshoot problems and ensure excellent customer experiences.",
    requirements: "• 1-3 years of technical support experience\n• Strong troubleshooting and problem-solving skills\n• Knowledge of software applications and operating systems\n• Excellent customer service and communication skills\n• Experience with ticketing systems\n• Technical certifications preferred",
    responsibilities: "• Respond to customer support tickets and phone calls\n• Troubleshoot technical issues and provide solutions\n• Escalate complex problems to senior team members\n• Document solutions and maintain knowledge base\n• Provide product training to customers",
    skills: ["Technical Support", "Troubleshooting", "Customer Service", "Ticketing Systems"],
    benefits: "• Competitive starting salary\n• Health and dental insurance\n• Technical training opportunities\n• Career advancement path\n• Supportive team environment"
  }
];

// Function to login and create jobs using the API
async function loginAndCreateJobs() {
  console.log('Logging in as recruiter...');
  
  // Login first
  const loginResponse = await fetch('http://localhost:5000/api/auth/email/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'shubham.dubey@vennverse.com',
      password: '12345678'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }
  
  // Extract session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log(`Login successful, creating ${jobs.length} jobs...`);
  
  // Create jobs one by one
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    try {
      const response = await fetch('http://localhost:5000/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify(job)
      });
      
      if (response.ok) {
        console.log(`✅ [${i + 1}/${jobs.length}] Created: ${job.title} at ${job.companyName}`);
      } else {
        const error = await response.text();
        console.log(`❌ [${i + 1}/${jobs.length}] Failed: ${job.title} - ${error}`);
      }
    } catch (error) {
      console.log(`❌ [${i + 1}/${jobs.length}] Error: ${job.title} - ${error.message}`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n🎉 Job creation process completed! Successfully created jobs across all categories.`);
  console.log(`📊 Total jobs processed: ${jobs.length}`);
}

loginAndCreateJobs().catch(console.error);