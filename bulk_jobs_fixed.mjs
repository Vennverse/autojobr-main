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
  }
];

// Add 28 more jobs to reach 30+ total
const additionalJobs = [
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
  }
];

// Combine all jobs
const allJobs = [...jobs, ...additionalJobs];

async function loginAndCreateJobs() {
  console.log('Logging in as recruiter...');
  
  // Login first
  const loginResponse = await fetch('http://localhost:5000/api/auth/email/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'shubhamdubexskd2001@gmail.com',
      password: '12345678'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }
  
  // Extract session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Login successful, creating jobs...');
  
  // Create jobs one by one
  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
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
        console.log(`✅ [${i + 1}/${allJobs.length}] Created: ${job.title} at ${job.companyName}`);
      } else {
        const error = await response.text();
        console.log(`❌ [${i + 1}/${allJobs.length}] Failed: ${job.title} - ${error}`);
      }
    } catch (error) {
      console.log(`❌ [${i + 1}/${allJobs.length}] Error: ${job.title} - ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n🎉 Job creation process completed! Attempted to create ${allJobs.length} jobs.`);
}

loginAndCreateJobs().catch(console.error);
