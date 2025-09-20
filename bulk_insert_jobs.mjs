import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { jobPostings } from './shared/schema.ts';
import { eq, and } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql, { schema: { jobPostings } });

// Admin user details
const ADMIN_USER_ID = 'user-1758023269899-edltdmjgu';
const ADMIN_EMAIL = 'shubham.dubey@autojobr.com';

// Batch processing configuration
const BATCH_SIZE = 23; // Process 23 jobs per batch to avoid timeouts
const BATCH_DELAY = 2000; // 2 seconds delay between batches

// Jobs data from bulk_job_creation.mjs (complete array)

// Function to map job data to database schema
function mapJobToSchema(job) {
  return {
    recruiterId: ADMIN_USER_ID,
    title: job.title,
    description: job.description + (job.companyWebsite ? `\n\nCompany Website: ${job.companyWebsite}` : ''),
    companyName: job.companyName,
    companyLogo: null, // Not provided in source data
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    skills: job.skills,
    qualifications: job.requirements, // Map requirements to qualifications
    minSalary: job.minSalary,
    maxSalary: job.maxSalary,
    salaryRange: job.minSalary && job.maxSalary ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}` : null,
    currency: "USD",
    benefits: job.benefits,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    isPromoted: false,
    promotedUntil: null,
    shareableLink: null,
    isActive: true,
    applicationsCount: 0,
    viewsCount: 0
  };
}

// Function to check if job already exists (by title and company)
async function jobExists(title, companyName) {
  try {
    const existing = await db
      .select({ id: jobPostings.id })
      .from(jobPostings)
      .where(and(
        eq(jobPostings.title, title),
        eq(jobPostings.companyName, companyName),
        eq(jobPostings.recruiterId, ADMIN_USER_ID)
      ))
      .limit(1);
    
    return existing.length > 0;
  } catch (error) {
    console.error(`❌ Error checking if job exists: ${error.message}`);
    return false; // If error, assume it doesn't exist to avoid skipping
  }
}

// Function to insert a single job
async function insertJob(job) {
  try {
    // Check if job already exists
    if (await jobExists(job.title, job.companyName)) {
      console.log(`⚠️  Job already exists: ${job.title} at ${job.companyName} - Skipping`);
      return { success: false, reason: 'duplicate', job: job };
    }

    // Map job data to database schema
    const jobData = mapJobToSchema(job);
    
    // Insert job into database
    const result = await db
      .insert(jobPostings)
      .values(jobData)
      .returning({ id: jobPostings.id, title: jobPostings.title });
    
    console.log(`✅ Successfully inserted: ${job.title} at ${job.companyName} (ID: ${result[0].id})`);
    return { success: true, result: result[0], job: job };
    
  } catch (error) {
    console.error(`❌ Failed to insert ${job.title} at ${job.companyName}: ${error.message}`);
    return { success: false, error: error.message, job: job };
  }
}

// Function to process jobs in batches
async function processBatch(batch, batchNumber, totalBatches) {
  console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)...`);
  
  const batchResults = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };
  
  // Process all jobs in current batch in parallel
  const batchPromises = batch.map(job => insertJob(job));
  const results = await Promise.all(batchPromises);
  
  // Analyze results
  results.forEach(result => {
    if (result.success) {
      batchResults.success++;
    } else if (result.reason === 'duplicate') {
      batchResults.duplicates++;
    } else {
      batchResults.failed++;
      batchResults.errors.push({
        job: `${result.job.title} at ${result.job.companyName}`,
        error: result.error
      });
    }
  });
  
  console.log(`   ✅ Successful: ${batchResults.success}`);
  console.log(`   ⚠️  Duplicates: ${batchResults.duplicates}`);
  console.log(`   ❌ Failed: ${batchResults.failed}`);
  
  return batchResults;
}

// Main execution function
async function main() {
  console.log('🚀 Starting bulk job insertion...');
  console.log(`📊 Total jobs to process: ${jobs.length}`);
  console.log(`👤 Admin user: ${ADMIN_EMAIL} (${ADMIN_USER_ID})`);
  console.log(`📦 Batch size: ${BATCH_SIZE} jobs per batch`);
  console.log(`⏱️  Batch delay: ${BATCH_DELAY}ms between batches\n`);
  
  // Create batches
  const batches = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push(jobs.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Created ${batches.length} batches\n`);
  
  // Track overall results
  const overallResults = {
    totalJobs: jobs.length,
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    startTime: new Date(),
    endTime: null
  };
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processBatch(batches[i], i + 1, batches.length);
    
    // Update overall results
    overallResults.successful += batchResults.success;
    overallResults.failed += batchResults.failed;
    overallResults.duplicates += batchResults.duplicates;
    overallResults.errors.push(...batchResults.errors);
    
    // Add delay between batches (except for the last one)
    if (i < batches.length - 1) {
      console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  overallResults.endTime = new Date();
  const duration = (overallResults.endTime - overallResults.startTime) / 1000;
  
  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 BULK JOB INSERTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
  console.log(`📊 Total jobs processed: ${overallResults.totalJobs}`);
  console.log(`✅ Successfully inserted: ${overallResults.successful}`);
  console.log(`⚠️  Duplicates skipped: ${overallResults.duplicates}`);
  console.log(`❌ Failed insertions: ${overallResults.failed}`);
  console.log(`📈 Success rate: ${((overallResults.successful / overallResults.totalJobs) * 100).toFixed(1)}%`);
  
  if (overallResults.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    overallResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.job}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Job insertion process completed!');
  console.log('Users can now browse and apply to these jobs through the application.');
}

// Execute the script
main()
  .catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  })
  .finally(() => {
    // Close database connection
    sql.end();
  });const jobs = [
  // ====== SOFTWARE ENGINEERING JOBS ======
  {
    title: "Senior Software Engineer",
    companyName: "Stripe",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 280000,
    description: "Join Stripe's engineering team to build the economic infrastructure for the internet. You'll work on systems that process billions of dollars in transactions and help millions of businesses around the world accept payments, send payouts, and manage their businesses online. As a Senior Software Engineer, you'll design and implement scalable solutions that power financial services for companies of all sizes.",
    requirements: "• 5+ years of software engineering experience\n• Strong proficiency in one or more: Ruby, Python, Go, Java, or Scala\n• Experience with distributed systems and high-scale architectures\n• Knowledge of databases, caching, and message queuing systems\n• Understanding of security principles and best practices\n• Experience with cloud platforms (AWS, GCP) and containerization",
    responsibilities: "• Design and build scalable backend systems and APIs\n• Collaborate with product managers and designers on new features\n• Participate in code reviews and maintain high code quality standards\n• Debug production issues and optimize system performance\n• Mentor junior engineers and contribute to team growth\n• Work with cross-functional teams to deliver business-critical projects",
    skills: ["Ruby", "Python", "Go", "PostgreSQL", "Redis", "Kubernetes", "AWS"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health, dental, and vision insurance\n• $3,000 annual learning and development budget\n• Flexible PTO and parental leave\n• Home office setup stipend\n• Commuter benefits and wellness programs",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Frontend Engineer",
    companyName: "Figma",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Help build the future of design tools at Figma. We're looking for a Frontend Engineer to work on our web application that serves millions of designers and developers worldwide. You'll be responsible for creating intuitive user interfaces and ensuring exceptional performance in complex web applications. Join us in making design accessible to everyone.",
    requirements: "• 3+ years of frontend development experience\n• Expert-level JavaScript/TypeScript and modern ES6+\n• Strong experience with React and component-based architecture\n• Knowledge of CSS, HTML, and responsive design principles\n• Experience with performance optimization and accessibility\n• Understanding of design systems and component libraries",
    responsibilities: "• Build and maintain high-performance web applications\n• Collaborate closely with designers to implement pixel-perfect UIs\n• Optimize application performance and user experience\n• Write comprehensive tests and maintain code quality\n• Participate in design and architecture discussions\n• Contribute to Figma's design system and component library",
    skills: ["React", "TypeScript", "CSS", "HTML", "WebGL", "Node.js"],
    benefits: "• Competitive compensation with equity upside\n• Full health benefits including mental health support\n• Flexible work arrangements and unlimited PTO\n• Annual learning stipend and conference attendance\n• Premium design tools and latest MacBook Pro\n• Catered meals and team building events",
    companyWebsite: "https://figma.com/careers"
  },
  {
    title: "DevOps Engineer",
    companyName: "Atlassian",
    location: "Austin, TX",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Join Atlassian's Infrastructure team to help scale our products that serve over 200,000 customers worldwide. As a DevOps Engineer, you'll work on improving developer productivity, system reliability, and deployment processes. You'll be part of building and maintaining the infrastructure that powers Jira, Confluence, Bitbucket, and other Atlassian products.",
    requirements: "• 3+ years of DevOps or infrastructure engineering experience\n• Strong experience with containerization (Docker, Kubernetes)\n• Proficiency with CI/CD tools and practices\n• Experience with Infrastructure as Code (Terraform, CloudFormation)\n• Knowledge of monitoring and logging tools (Datadog, Splunk)\n• AWS or other cloud platform expertise",
    responsibilities: "• Design and implement scalable deployment pipelines\n• Manage containerized applications in Kubernetes environments\n• Monitor system performance and implement reliability improvements\n• Automate infrastructure provisioning and management\n• Collaborate with development teams on deployment strategies\n• Participate in incident response and on-call rotation",
    skills: ["Kubernetes", "Docker", "Terraform", "AWS", "Jenkins", "Python", "Monitoring"],
    benefits: "• Remote-first culture with flexible working hours\n• Comprehensive health and wellness benefits\n• ShipIt Days for innovation and learning\n• Annual personal development budget\n• Home office setup allowance\n• Stock options and performance bonuses",
    companyWebsite: "https://atlassian.com/company/careers"
  },
  {
    title: "Full Stack Engineer",
    companyName: "Notion",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Build the future of productivity tools at Notion. We're looking for a Full Stack Engineer to work on features that help millions of users organize their work and life. You'll work across our entire stack, from React frontends to Node.js backends, helping create the building blocks for productivity that teams and individuals love to use.",
    requirements: "• 3+ years of full stack development experience\n• Strong proficiency in React and modern JavaScript/TypeScript\n• Backend experience with Node.js, Python, or similar\n• Knowledge of databases (PostgreSQL preferred)\n• Experience with real-time systems and WebSocket technologies\n• Understanding of system design and scalability principles",
    responsibilities: "• Develop features across the full stack from UI to database\n• Build real-time collaborative editing and sync systems\n• Optimize application performance and user experience\n• Design and implement APIs and data models\n• Work closely with product and design teams\n• Participate in code reviews and technical discussions",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "WebSocket", "AWS"],
    benefits: "• Competitive salary and meaningful equity\n• Comprehensive health benefits and wellness stipend\n• Flexible PTO and sabbatical program\n• Learning and development budget\n• Top-tier equipment and workspace setup\n• Team retreats and company offsites",
    companyWebsite: "https://notion.so/careers"
  },
  {
    title: "Backend Engineer",
    companyName: "Discord",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 250000,
    description: "Help build the platform where millions of people hang out every day. Discord's backend systems handle billions of messages and connect hundreds of millions of users worldwide. As a Backend Engineer, you'll work on systems that need to be fast, reliable, and scalable. Join us in building the future of online communities and communication.",
    requirements: "• 5+ years of backend engineering experience\n• Strong proficiency in Python, Go, Rust, or similar systems languages\n• Experience with distributed systems and microservices\n• Knowledge of database systems and data modeling\n• Understanding of real-time systems and WebSocket technologies\n• Experience with high-scale, low-latency systems",
    responsibilities: "• Design and build scalable backend services and APIs\n• Optimize system performance for real-time communication\n• Work on voice and video calling infrastructure\n• Implement features for communities and social interactions\n• Debug and resolve production issues\n• Collaborate with frontend and mobile teams",
    skills: ["Python", "Go", "PostgreSQL", "Redis", "Cassandra", "Docker", "Kubernetes"],
    benefits: "• Competitive compensation and equity package\n• Remote-first with flexible work arrangements\n• Comprehensive health and wellness benefits\n• Unlimited PTO and mental health days\n• Annual company retreat and team offsites\n• Learning stipend and conference attendance",
    companyWebsite: "https://discord.com/careers"
  },
  {
    title: "Mobile Engineer (iOS)",
    companyName: "Airbnb",
    location: "Los Angeles, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 150000,
    maxSalary: 190000,
    description: "Create magical mobile experiences for millions of Airbnb users around the world. As an iOS Engineer, you'll work on features that help people discover and book unique places to stay, from treehouses to castles. You'll collaborate with a world-class team of designers, product managers, and engineers to build features that create a world where anyone can belong anywhere.",
    requirements: "• 3+ years of iOS development experience\n• Expert knowledge of Swift and iOS SDK\n• Experience with UIKit, SwiftUI, and iOS design patterns\n• Knowledge of RESTful APIs and mobile architecture patterns\n• Understanding of performance optimization and memory management\n• Experience with testing frameworks and CI/CD for mobile",
    responsibilities: "• Develop and maintain iOS applications with millions of users\n• Collaborate with design and product teams on new features\n• Optimize app performance and user experience\n• Write comprehensive tests and maintain code quality\n• Participate in code reviews and technical discussions\n• Work on A/B testing and feature experimentation",
    skills: ["Swift", "iOS SDK", "UIKit", "SwiftUI", "Core Data", "XCTest"],
    benefits: "• Competitive salary with equity and bonuses\n• Annual Airbnb travel credit ($2,000 annually)\n• Comprehensive health benefits and wellness programs\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee resource groups and belonging initiatives",
    companyWebsite: "https://airbnb.com/careers"
  },
  {
    title: "Site Reliability Engineer",
    companyName: "Dropbox",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 260000,
    description: "Ensure Dropbox remains reliable and performant for over 700 million users worldwide. As an SRE, you'll work on the infrastructure and systems that keep our services running 24/7. You'll be responsible for maintaining high availability, implementing monitoring and alerting, and working on capacity planning for one of the world's largest cloud storage platforms.",
    requirements: "• 5+ years of SRE, DevOps, or infrastructure experience\n• Strong programming skills in Python, Go, or similar languages\n• Experience with large-scale distributed systems\n• Knowledge of monitoring, logging, and alerting systems\n• Experience with cloud platforms and containerization\n• Understanding of networking, security, and database systems",
    responsibilities: "• Design and implement monitoring and alerting systems\n• Participate in on-call rotation and incident response\n• Work on capacity planning and performance optimization\n• Automate operational tasks and improve system reliability\n• Collaborate with engineering teams on reliability requirements\n• Conduct post-incident reviews and implement improvements",
    skills: ["Python", "Go", "Kubernetes", "AWS", "Prometheus", "Grafana", "Linux"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Professional development budget and sabbaticals\n• Dropbox storage and productivity tools\n• Volunteer time off and charitable giving match",
    companyWebsite: "https://dropbox.com/jobs"
  },
  {
    title: "Software Engineer - Infrastructure",
    companyName: "Twilio",
    location: "Denver, CO",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Build the communications infrastructure that powers millions of applications worldwide. At Twilio, you'll work on systems that handle billions of API requests daily, enabling developers to build voice, messaging, and video applications. Join our infrastructure team to work on challenging problems in distributed systems, real-time communications, and global scalability.",
    requirements: "• 3+ years of software engineering experience\n• Strong background in distributed systems and microservices\n• Proficiency in Java, Python, or similar languages\n• Experience with cloud platforms and containerization\n• Knowledge of databases and data storage solutions\n• Understanding of network protocols and real-time systems",
    responsibilities: "• Design and build scalable infrastructure systems\n• Work on messaging, voice, and video communication platforms\n• Optimize system performance for global scale\n• Implement monitoring and observability solutions\n• Collaborate with product engineering teams\n• Participate in on-call rotation and incident response",
    skills: ["Java", "Python", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Redis"],
    benefits: "• Flexible remote work with home office stipend\n• Comprehensive health and wellness benefits\n• Twilio.org volunteer time and charitable giving\n• Learning and development programs\n• Stock purchase plan and equity awards\n• Inclusive culture and employee resource groups",
    companyWebsite: "https://twilio.com/company/jobs"
  },
  {
    title: "Frontend Engineer",
    companyName: "Slack",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Shape the future of workplace communication at Slack. We're building tools that help teams work better together, and we need talented frontend engineers to create intuitive, performant user interfaces. You'll work on features used by millions of people daily, from real-time messaging to workflow automation, helping transform how work gets done.",
    requirements: "• 5+ years of frontend engineering experience\n• Expert-level JavaScript/TypeScript and modern frameworks\n• Strong experience with React and component architecture\n• Knowledge of performance optimization and accessibility\n• Experience with real-time applications and WebSocket\n• Understanding of design systems and user experience principles",
    responsibilities: "• Build and maintain Slack's web and desktop applications\n• Develop real-time messaging and collaboration features\n• Work on workflow automation and integration tools\n• Optimize application performance and accessibility\n• Collaborate with design and product teams\n• Mentor junior engineers and lead technical initiatives",
    skills: ["React", "TypeScript", "CSS", "WebSocket", "Electron", "Node.js"],
    benefits: "• Competitive compensation with equity upside\n• Comprehensive health benefits and mental health support\n• Flexible work arrangements and unlimited PTO\n• Learning stipend and professional development\n• Employee discount programs and wellness benefits\n• Inclusive culture and diversity initiatives",
    companyWebsite: "https://slack.com/careers"
  },
  {
    title: "Security Engineer",
    companyName: "Okta",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 185000,
    maxSalary: 240000,
    description: "Protect the identity infrastructure that secures thousands of organizations worldwide. At Okta, you'll work on cutting-edge security technologies including identity management, zero trust architecture, and threat detection. Join our security team to help build and maintain one of the world's leading identity platforms while keeping our customers and their users safe.",
    requirements: "• 5+ years of cybersecurity or software engineering experience\n• Strong knowledge of identity and access management (IAM)\n• Experience with security frameworks and compliance standards\n• Knowledge of cryptography and secure coding practices\n• Experience with cloud security and threat modeling\n• Understanding of zero trust architecture principles",
    responsibilities: "• Design and implement security features and controls\n• Conduct security reviews and threat modeling\n• Work on identity and access management systems\n• Develop security monitoring and detection capabilities\n• Collaborate with engineering teams on secure development\n• Respond to security incidents and conduct investigations",
    skills: ["Python", "Java", "AWS", "Security", "IAM", "Cryptography", "SAML", "OAuth"],
    benefits: "• Remote-first culture with flexible schedules\n• Comprehensive health and wellness benefits\n• Professional development and security certifications\n• Stock options and performance bonuses\n• Home office setup and technology stipend\n• Diversity and inclusion programs",
    companyWebsite: "https://okta.com/company/careers"
  },
  {
    title: "Backend Engineer",
    companyName: "Roblox",
    location: "San Mateo, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Build the platform that powers millions of user-generated games and experiences. At Roblox, you'll work on systems that support a massive multiplayer platform where users create, share, and play games together. Join our backend team to work on challenging distributed systems problems while helping connect billions of people through shared experiences.",
    requirements: "• 3+ years of backend development experience\n• Strong proficiency in C++, Go, Python, or Lua\n• Experience with distributed systems and real-time applications\n• Knowledge of game development concepts and multiplayer systems\n• Understanding of databases and caching technologies\n• Experience with cloud platforms and microservices",
    responsibilities: "• Develop backend systems for multiplayer gaming platform\n• Work on user-generated content and virtual economy systems\n• Build APIs for game creation tools and social features\n• Optimize system performance for real-time gameplay\n• Collaborate with game developers and product teams\n• Implement safety and moderation systems",
    skills: ["C++", "Lua", "Go", "MySQL", "Redis", "AWS", "Docker"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee game development programs\n• Diverse and inclusive workplace culture",
    companyWebsite: "https://roblox.com/careers"
  },
  {
    title: "Platform Engineer",
    companyName: "HashiCorp",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 230000,
    description: "Build the infrastructure automation tools that power the cloud. At HashiCorp, you'll work on products like Terraform, Vault, and Consul that help organizations adopt cloud infrastructure safely and efficiently. Join our platform team to work on distributed systems that manage critical infrastructure for thousands of companies worldwide.",
    requirements: "• 5+ years of platform or infrastructure engineering experience\n• Strong proficiency in Go and distributed systems\n• Deep knowledge of cloud platforms (AWS, GCP, Azure)\n• Experience with Infrastructure as Code and automation tools\n• Understanding of security and secrets management\n• Knowledge of service mesh and networking technologies",
    responsibilities: "• Develop and maintain HashiCorp's core infrastructure products\n• Work on distributed consensus algorithms and data stores\n• Build cloud provider integrations and APIs\n• Optimize system performance and reliability\n• Collaborate with open source community\n• Design secure and scalable architecture patterns",
    skills: ["Go", "Terraform", "Vault", "Consul", "AWS", "Kubernetes", "Networking"],
    benefits: "• Remote-first company with global presence\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Learning and conference attendance budget\n• Home office setup and coworking stipends\n• Open source contribution time",
    companyWebsite: "https://hashicorp.com/jobs"
  },
  {
    title: "Full Stack Engineer",
    companyName: "Pinterest",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Help people discover and do what they love at Pinterest. We're building a visual discovery platform that inspires billions of people worldwide. As a Full Stack Engineer, you'll work on features that help users find ideas for their projects and interests, from home décor to recipes to fashion. Join us in building a positive corner of the internet.",
    requirements: "• 3+ years of full stack development experience\n• Proficiency in Python, Java, or similar backend languages\n• Strong frontend skills with React or similar frameworks\n• Experience with large-scale web applications\n• Knowledge of databases and caching systems\n• Understanding of machine learning concepts (preferred)",
    responsibilities: "• Develop features across the full technology stack\n• Work on recommendation and discovery algorithms\n• Build user-facing features for web and mobile platforms\n• Optimize application performance and user experience\n• Collaborate with design, product, and data science teams\n• Participate in A/B testing and feature experimentation",
    skills: ["Python", "React", "Java", "MySQL", "Redis", "AWS", "Machine Learning"],
    benefits: "• Competitive salary with equity and bonuses\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development programs\n• Employee resource groups and inclusion initiatives\n• Commuter benefits and wellness stipends",
    companyWebsite: "https://pinterest.com/careers"
  },
  {
    title: "Software Engineer - Search",
    companyName: "Elastic",
    location: "Amsterdam, Netherlands",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 250000,
    description: "Build search and analytics solutions that power mission-critical applications worldwide. At Elastic, you'll work on the Elasticsearch engine and ecosystem that helps organizations search, analyze, and visualize their data in real time. Join our search engineering team to work on distributed search algorithms and help make data useful for organizations everywhere.",
    requirements: "• 5+ years of software engineering experience\n• Strong proficiency in Java and distributed systems\n• Deep knowledge of search algorithms and information retrieval\n• Experience with large-scale data processing systems\n• Understanding of performance optimization and scalability\n• Knowledge of machine learning and natural language processing",
    responsibilities: "• Develop and optimize Elasticsearch search algorithms\n• Work on distributed indexing and query processing\n• Implement machine learning features for search relevance\n• Optimize performance for large-scale deployments\n• Collaborate with product and field engineering teams\n• Contribute to open source Elasticsearch project",
    skills: ["Java", "Elasticsearch", "Lucene", "Machine Learning", "Distributed Systems", "Performance Optimization"],
    benefits: "• Fully distributed company with flexible work\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Annual company meetups and team gatherings\n• Learning and development budget\n• Open source contribution time",
    companyWebsite: "https://elastic.co/about/careers"
  },
  {
    title: "DevOps Engineer",
    companyName: "GitLab",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Help build the DevOps platform that enables collaboration and productivity for development teams worldwide. At GitLab, you'll work on CI/CD pipelines, infrastructure automation, and deployment systems that serve millions of developers. Join our all-remote team to work on the future of software development and delivery.",
    requirements: "• 3+ years of DevOps or platform engineering experience\n• Strong experience with CI/CD pipelines and automation\n• Proficiency with containerization (Docker, Kubernetes)\n• Experience with Infrastructure as Code (Terraform, Ansible)\n• Knowledge of monitoring, logging, and observability\n• Understanding of security and compliance practices",
    responsibilities: "• Design and maintain CI/CD infrastructure and pipelines\n• Work on GitLab's deployment and release systems\n• Implement monitoring and observability solutions\n• Automate infrastructure provisioning and management\n• Collaborate with development teams on platform improvements\n• Participate in incident response and system reliability",
    skills: ["Ruby", "Go", "Docker", "Kubernetes", "Terraform", "GCP", "Prometheus"],
    benefits: "• All-remote company with flexible working hours\n• Comprehensive health and wellness benefits\n• Home office setup and coworking allowances\n• Learning and development budget\n• Equity participation and performance bonuses\n• Family and friends annual meetup budget",
    companyWebsite: "https://gitlab.com/company/careers"
  },
  {
    title: "Senior Software Engineer",
    companyName: "Cloudflare",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 185000,
    maxSalary: 240000,
    description: "Help build a better internet at Cloudflare. We operate one of the world's largest networks, handling over 25 million HTTP requests per second. As a Senior Software Engineer, you'll work on systems that protect and accelerate millions of websites, APIs, and applications. Join us in our mission to help build a better internet for everyone.",
    requirements: "• 5+ years of systems programming experience\n• Strong proficiency in Go, Rust, C, or C++\n• Experience with distributed systems and networking\n• Knowledge of internet protocols (HTTP, TCP, DNS)\n• Understanding of security and performance optimization\n• Experience with high-scale, low-latency systems",
    responsibilities: "• Develop edge computing and content delivery systems\n• Work on DDoS protection and security services\n• Build APIs and services for developer platform\n• Optimize network performance and reliability\n• Collaborate with product and research teams\n• Participate in on-call rotation and incident response",
    skills: ["Go", "Rust", "C++", "Networking", "Security", "Linux", "Distributed Systems"],
    benefits: "• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee assistance programs and mental health support\n• Diverse and inclusive workplace initiatives",
    companyWebsite: "https://cloudflare.com/careers"
  },
  {
    title: "Software Engineer - Backend",
    companyName: "Confluent",
    location: "Palo Alto, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Build the data streaming platform that powers real-time applications at scale. At Confluent, you'll work on Apache Kafka and the surrounding ecosystem that helps organizations harness the power of real-time data. Join our engineering team to work on distributed systems that process trillions of messages daily for companies worldwide.",
    requirements: "• 3+ years of backend engineering experience\n• Strong proficiency in Java, Scala, or similar languages\n• Experience with distributed systems and streaming technologies\n• Knowledge of Apache Kafka or similar message brokers\n• Understanding of data processing and analytics systems\n• Experience with cloud platforms and microservices",
    responsibilities: "• Develop and maintain Confluent Cloud services\n• Work on Apache Kafka core and ecosystem projects\n• Build APIs and tools for data streaming platform\n• Optimize system performance and reliability\n• Collaborate with product and field engineering teams\n• Contribute to open source Apache Kafka project",
    skills: ["Java", "Scala", "Apache Kafka", "Distributed Systems", "AWS", "Kubernetes"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Conference attendance and speaking opportunities\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://confluent.io/careers"
  },
  {
    title: "Mobile Engineer (Android)",
    companyName: "Robinhood",
    location: "Menlo Park, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Democratize finance for all by building mobile-first investment tools. At Robinhood, you'll work on Android applications that help millions of users invest in stocks, ETFs, options, and crypto. Join our mobile team to create intuitive financial experiences that make investing accessible to everyone, from first-time investors to experienced traders.",
    requirements: "• 3+ years of Android development experience\n• Expert knowledge of Kotlin and Android SDK\n• Experience with modern Android architecture (MVVM, Clean Architecture)\n• Knowledge of financial APIs and real-time data systems\n• Understanding of security best practices for financial apps\n• Experience with testing frameworks and CI/CD for mobile",
    responsibilities: "• Develop and maintain Robinhood's Android applications\n• Work on trading, investing, and portfolio management features\n• Implement real-time market data and notifications\n• Optimize app performance and user experience\n• Collaborate with design and product teams\n• Ensure security and compliance for financial transactions",
    skills: ["Kotlin", "Android SDK", "Jetpack Compose", "RxJava", "Retrofit", "Room"],
    benefits: "• Competitive salary with equity and bonuses\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Investment accounts and financial wellness programs\n• Learning and development opportunities\n• Employee resource groups and inclusion initiatives",
    companyWebsite: "https://robinhood.com/careers"
  },
  {
    title: "Platform Engineer",
    companyName: "Snowflake",
    location: "San Mateo, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 270000,
    description: "Build the cloud data platform that enables organizations to mobilize their data. At Snowflake, you'll work on the architecture and systems that power one of the fastest-growing enterprise software companies. Join our platform team to work on distributed database systems, query optimization, and cloud infrastructure that processes exabytes of data daily.",
    requirements: "• 5+ years of distributed systems engineering experience\n• Strong proficiency in C++, Java, or similar systems languages\n• Deep knowledge of database internals and query processing\n• Experience with cloud platforms and distributed computing\n• Understanding of storage systems and data formats\n• Knowledge of performance optimization and scalability",
    responsibilities: "• Develop core database engine and query processing systems\n• Work on distributed storage and compute architecture\n• Optimize query performance and resource utilization\n• Build cloud platform integrations and APIs\n• Collaborate with product and field engineering teams\n• Design scalable solutions for enterprise customers",
    skills: ["C++", "Java", "Distributed Systems", "Database Internals", "AWS", "Performance Optimization"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development programs\n• Stock options and employee stock purchase plan\n• Inclusive culture and employee resource groups",
    companyWebsite: "https://snowflake.com/careers"
  },
  {
    title: "Software Engineer - Growth",
    companyName: "Canva",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Help empower the world to design by working on growth initiatives at Canva. We're building tools that make design simple and accessible for everyone, from social media graphics to presentations. As a Growth Engineer, you'll work on features that help new users discover Canva's capabilities and become successful creators.",
    requirements: "• 3+ years of software engineering experience\n• Strong proficiency in React, TypeScript, and modern web technologies\n• Experience with A/B testing and experimentation platforms\n• Knowledge of growth metrics and user acquisition funnels\n• Understanding of user experience and conversion optimization\n• Experience with data analysis and user behavior tracking",
    responsibilities: "• Build features to improve user onboarding and activation\n• Work on A/B testing infrastructure and experimentation\n• Develop referral and viral growth mechanisms\n• Optimize conversion funnels and user engagement\n• Collaborate with product, design, and data science teams\n• Analyze user behavior and implement data-driven improvements",
    skills: ["React", "TypeScript", "Python", "A/B Testing", "Analytics", "Growth Hacking"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup allowance\n• Diversity and inclusion programs",
    companyWebsite: "https://canva.com/careers"
  },

  // ====== DATA & AI JOBS ======
  {
    title: "Senior Data Scientist",
    companyName: "Databricks",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 280000,
    description: "Drive data science initiatives at Databricks, the company that created Apache Spark and is building the data and AI platform for the cloud. You'll work on machine learning systems that help customers extract insights from massive datasets. Join our data science team to work on cutting-edge problems in distributed machine learning, feature engineering, and model deployment at scale.",
    requirements: "• 5+ years of data science and machine learning experience\n• PhD or Masters in Computer Science, Statistics, or related field\n• Strong proficiency in Python, R, and SQL\n• Experience with Apache Spark, MLflow, and distributed computing\n• Deep knowledge of machine learning algorithms and statistics\n• Experience with cloud platforms and big data technologies",
    responsibilities: "• Develop machine learning models and algorithms for data platform\n• Work on automated machine learning and model optimization\n• Build data science tools and libraries for customer use\n• Conduct research on distributed machine learning systems\n• Collaborate with engineering teams on product features\n• Present findings to technical and business stakeholders",
    skills: ["Python", "Apache Spark", "MLflow", "Machine Learning", "Statistics", "AWS"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Conference attendance and speaking opportunities\n• Stock options and equity participation",
    companyWebsite: "https://databricks.com/company/careers"
  },
  {
    title: "Machine Learning Engineer",
    companyName: "Spotify",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 240000,
    description: "Shape the future of music discovery and recommendations at Spotify. We're building ML systems that help over 400 million users discover new music and podcasts they'll love. As an ML Engineer, you'll work on recommendation algorithms, natural language processing for audio content, and personalization systems that power the world's largest audio streaming platform.",
    requirements: "• 5+ years of machine learning engineering experience\n• Strong proficiency in Python, TensorFlow, or PyTorch\n• Experience with recommendation systems and personalization\n• Knowledge of distributed computing and big data frameworks\n• Understanding of audio processing and natural language processing\n• Experience with cloud platforms and MLOps practices",
    responsibilities: "• Develop and deploy recommendation algorithms for music and podcasts\n• Work on personalization systems and user modeling\n• Build machine learning infrastructure and deployment pipelines\n• Optimize model performance for real-time serving\n• Collaborate with product and engineering teams\n• Conduct A/B testing and measure impact of ML features",
    skills: ["Python", "TensorFlow", "Recommendation Systems", "Big Data", "Audio Processing", "GCP"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Spotify Premium subscription and merchandise credits\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://spotify.com/careers"
  },
  {
    title: "Data Engineer",
    companyName: "DoorDash",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Build the data infrastructure that powers local commerce at DoorDash. We're connecting millions of consumers with local merchants and Dashers, processing billions of data points to optimize delivery logistics, pricing, and marketplace dynamics. Join our data engineering team to work on real-time data systems that make local commerce more accessible and efficient.",
    requirements: "• 3+ years of data engineering experience\n• Strong proficiency in Python, SQL, and data processing frameworks\n• Experience with Apache Kafka, Spark, or similar streaming technologies\n• Knowledge of data warehousing and ETL/ELT processes\n• Understanding of distributed systems and cloud platforms\n• Experience with data modeling and schema design",
    responsibilities: "• Build and maintain data pipelines and ETL processes\n• Work on real-time streaming data systems\n• Design and implement data models for analytics\n• Optimize data infrastructure for performance and cost\n• Collaborate with data scientists and analytics teams\n• Ensure data quality and reliability across systems",
    skills: ["Python", "SQL", "Apache Kafka", "Apache Spark", "AWS", "Data Modeling"],
    benefits: "• Competitive salary with equity and bonuses\n• Comprehensive health and wellness benefits\n• DashPass subscription and meal allowances\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://doordash.com/careers"
  },
  {
    title: "Applied Research Scientist",
    companyName: "JetBrains",
    location: "Munich, Germany",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 250000,
    description: "Advance the state of the art in developer tools and programming languages at JetBrains. We're building intelligent IDEs and development tools used by millions of developers worldwide. As an Applied Research Scientist, you'll work on machine learning for code analysis, automated refactoring, and intelligent code completion systems that help developers be more productive.",
    requirements: "• PhD in Computer Science or related field with 3+ years industry experience\n• Strong background in machine learning and natural language processing\n• Experience with program analysis and compiler technologies\n• Knowledge of software engineering and developer tools\n• Proficiency in Java, Kotlin, Python, or similar languages\n• Publication record in top-tier conferences preferred",
    responsibilities: "• Research and develop ML models for code analysis and generation\n• Work on intelligent code completion and refactoring systems\n• Collaborate with product teams to integrate research into IDEs\n• Publish research findings in academic conferences and journals\n• Build prototypes and validate research concepts\n• Stay current with latest advances in ML for software engineering",
    skills: ["Machine Learning", "NLP", "Program Analysis", "Java", "Kotlin", "Research"],
    benefits: "• Remote-first culture with flexible working hours\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Conference attendance and research publication support\n• Learning and development budget\n• JetBrains tools licenses and hardware allowance",
    companyWebsite: "https://jetbrains.com/careers"
  },
  {
    title: "Data Scientist - Growth",
    companyName: "Instacart",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Drive growth through data-driven insights at Instacart, the leading grocery marketplace in North America. You'll work on understanding customer behavior, optimizing marketing campaigns, and building models that help millions of families get groceries delivered. Join our growth data science team to work on problems spanning user acquisition, retention, and lifetime value optimization.",
    requirements: "• 3+ years of data science experience, preferably in growth or marketing\n• Strong proficiency in Python, R, and SQL\n• Experience with A/B testing and causal inference\n• Knowledge of statistical modeling and machine learning\n• Understanding of digital marketing and user acquisition\n• Experience with data visualization and stakeholder communication",
    responsibilities: "• Analyze user behavior and identify growth opportunities\n• Design and analyze A/B tests for marketing and product experiments\n• Build predictive models for customer lifetime value and churn\n• Work on marketing mix modeling and attribution analysis\n• Collaborate with marketing, product, and engineering teams\n• Present insights and recommendations to leadership",
    skills: ["Python", "SQL", "A/B Testing", "Statistical Modeling", "Marketing Analytics", "Causal Inference"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Instacart+ membership and grocery credits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and inclusion initiatives",
    companyWebsite: "https://instacart.com/careers"
  },
  {
    title: "ML Platform Engineer",
    companyName: "Coinbase",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 250000,
    description: "Build the machine learning infrastructure that powers the cryptoeconomy at Coinbase. We're creating financial services for the digital currency ecosystem, and ML is critical for fraud detection, risk management, and customer experience. Join our ML platform team to build systems that enable data scientists to deploy models safely and efficiently at scale.",
    requirements: "• 5+ years of ML platform or infrastructure engineering experience\n• Strong proficiency in Python, Go, or similar languages\n• Experience with ML deployment and serving infrastructure\n• Knowledge of containerization, orchestration, and cloud platforms\n• Understanding of MLOps practices and model monitoring\n• Experience with distributed computing and data processing",
    responsibilities: "• Build and maintain ML model deployment and serving infrastructure\n• Develop MLOps tools for model training, validation, and monitoring\n• Work on feature stores and data pipeline systems\n• Optimize ML inference performance and cost\n• Collaborate with data scientists and engineering teams\n• Ensure security and compliance for ML systems",
    skills: ["Python", "MLOps", "Kubernetes", "Docker", "AWS", "Machine Learning Infrastructure"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Cryptocurrency learning and earning opportunities\n• Learning and development budget\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://coinbase.com/careers"
  },
  {
    title: "Data Analytics Engineer",
    companyName: "MongoDB",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 125000,
    maxSalary: 165000,
    description: "Build analytics systems that help MongoDB customers optimize their database performance and operations. We're the leading modern database platform, serving millions of developers and thousands of enterprises. As a Data Analytics Engineer, you'll work on systems that process telemetry data, provide performance insights, and help customers optimize their MongoDB deployments.",
    requirements: "• 3+ years of data engineering or analytics experience\n• Strong proficiency in Python, SQL, and data processing frameworks\n• Experience with MongoDB or other NoSQL databases\n• Knowledge of data warehousing and business intelligence tools\n• Understanding of database performance and optimization\n• Experience with cloud platforms and distributed systems",
    responsibilities: "• Build data pipelines for MongoDB Atlas telemetry and metrics\n• Develop analytics dashboards and performance monitoring tools\n• Work on database performance analysis and optimization recommendations\n• Create data models for customer usage and billing analytics\n• Collaborate with product and engineering teams\n• Support customer success and sales teams with data insights",
    skills: ["Python", "SQL", "MongoDB", "Data Analytics", "BI Tools", "AWS"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• MongoDB certification and training programs\n• Employee resource groups and community involvement",
    companyWebsite: "https://mongodb.com/careers"
  },
  {
    title: "Senior Data Scientist - Personalization",
    companyName: "Pinterest",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 185000,
    maxSalary: 235000,
    description: "Build personalization systems that help billions of people discover ideas and inspiration on Pinterest. We're using computer vision, natural language processing, and recommendation systems to understand user intent and surface the most relevant content. Join our personalization team to work on ML systems that power visual search, recommendations, and content understanding.",
    requirements: "• 5+ years of data science experience with focus on personalization\n• Strong proficiency in Python, TensorFlow, or PyTorch\n• Experience with recommendation systems and computer vision\n• Knowledge of deep learning and neural network architectures\n• Understanding of large-scale ML systems and A/B testing\n• Experience with image and text processing techniques",
    responsibilities: "• Develop recommendation algorithms for home feed and search results\n• Work on computer vision models for image understanding and search\n• Build personalization systems based on user behavior and preferences\n• Optimize ranking and retrieval systems for content discovery\n• Collaborate with product and engineering teams\n• Conduct experiments and measure impact of personalization features",
    skills: ["Python", "Computer Vision", "Recommendation Systems", "Deep Learning", "TensorFlow", "A/B Testing"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Employee resource groups and inclusion initiatives\n• Conference attendance and speaking opportunities",
    companyWebsite: "https://pinterest.com/careers"
  },
  {
    title: "Research Scientist - NLP",
    companyName: "Zoom",
    location: "San Jose, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 270000,
    description: "Advance the state of the art in natural language processing for video communications at Zoom. We're building AI-powered features like real-time transcription, meeting summaries, and smart scheduling that make video communications more accessible and productive. Join our NLP research team to work on speech recognition, language understanding, and conversation analytics.",
    requirements: "• PhD in Computer Science, NLP, or related field\n• 3+ years of NLP research experience in industry or academia\n• Strong proficiency in Python, TensorFlow, or PyTorch\n• Experience with speech recognition and language models\n• Knowledge of transformer architectures and modern NLP techniques\n• Publication record in top-tier NLP conferences preferred",
    responsibilities: "• Research and develop NLP models for meeting transcription and analysis\n• Work on real-time speech recognition and language understanding\n• Build conversation analytics and meeting intelligence features\n• Collaborate with product teams to integrate research into products\n• Publish research findings and represent Zoom at conferences\n• Stay current with latest advances in NLP and speech technologies",
    skills: ["NLP", "Speech Recognition", "Deep Learning", "Python", "Research", "Language Models"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Research publication and conference support\n• Learning and development opportunities\n• Employee resource groups and wellness programs",
    companyWebsite: "https://zoom.com/careers"
  },
  {
    title: "Data Engineer - Real-time Systems",
    companyName: "Redis Labs",
    location: "Mountain View, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 225000,
    description: "Build real-time data systems that power applications at Redis, the home of the Redis in-memory database. We're helping organizations build real-time applications with sub-millisecond latency requirements. As a Data Engineer, you'll work on streaming data platforms, time-series databases, and analytics systems that process millions of operations per second.",
    requirements: "• 5+ years of data engineering experience with real-time systems\n• Strong proficiency in Python, Go, or Java\n• Experience with Redis, Apache Kafka, and streaming technologies\n• Knowledge of time-series data and analytics systems\n• Understanding of distributed systems and performance optimization\n• Experience with cloud platforms and containerization",
    responsibilities: "• Build real-time data streaming and processing systems\n• Work on time-series analytics and monitoring platforms\n• Develop data pipelines for high-throughput, low-latency applications\n• Optimize Redis deployments for performance and scalability\n• Collaborate with product and field engineering teams\n• Support customer implementations of real-time data systems",
    skills: ["Redis", "Apache Kafka", "Python", "Time-series Data", "Streaming", "Performance Optimization"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Conference attendance and Redis certification programs\n• Employee resource groups and community involvement",
    companyWebsite: "https://redis.com/careers"
  },
  {
    title: "Staff Data Scientist",
    companyName: "Peloton",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 210000,
    maxSalary: 280000,
    description: "Drive data science initiatives at Peloton, the global fitness technology company. We're using data to personalize fitness experiences, optimize content recommendations, and help members achieve their health and wellness goals. As a Staff Data Scientist, you'll lead cross-functional projects that impact millions of connected fitness enthusiasts worldwide.",
    requirements: "• 7+ years of data science experience with leadership responsibilities\n• Advanced degree in Statistics, Computer Science, or related field\n• Strong proficiency in Python, R, and advanced statistical methods\n• Experience with time-series analysis and user behavior modeling\n• Knowledge of A/B testing and causal inference\n• Experience leading data science projects and mentoring junior scientists",
    responsibilities: "• Lead data science initiatives for personalized fitness recommendations\n• Develop models for member engagement and retention optimization\n• Work on content optimization and instructor/music recommendations\n• Design and analyze experiments for product and marketing teams\n• Mentor junior data scientists and establish best practices\n• Present insights and recommendations to executive leadership",
    skills: ["Python", "Statistics", "Time-series Analysis", "A/B Testing", "Machine Learning", "Leadership"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Complimentary Peloton membership and equipment\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee resource groups and wellness programs",
    companyWebsite: "https://onepeloton.com/careers"
  },

  // ====== PRODUCT & DESIGN JOBS ======
  {
    title: "Senior Product Manager",
    companyName: "Slack",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 250000,
    description: "Shape the future of workplace communication at Slack. We're building the digital headquarters for teams around the world, and we need a Senior Product Manager to drive innovation in collaboration tools. You'll work on features that help millions of people work better together, from messaging and file sharing to workflow automation and integrations.",
    requirements: "• 5+ years of product management experience in B2B software\n• Strong background in collaboration or communication tools\n• Experience with enterprise software and SaaS platforms\n• Data-driven approach to product decisions and A/B testing\n• Excellent communication and stakeholder management skills\n• Technical background or ability to work closely with engineering teams",
    responsibilities: "• Define product strategy and roadmap for key Slack features\n• Work with engineering and design teams to deliver new capabilities\n• Conduct user research and gather customer feedback\n• Analyze product metrics and usage data to inform decisions\n• Collaborate with sales, marketing, and customer success teams\n• Present product vision and updates to leadership and stakeholders",
    skills: ["Product Management", "B2B SaaS", "User Research", "Data Analysis", "Strategic Planning"],
    benefits: "• Competitive salary with equity and performance bonuses\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Professional development and leadership training\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://slack.com/careers"
  },
  {
    title: "Senior UX Designer",
    companyName: "Figma",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 160000,
    maxSalary: 220000,
    description: "Design the future of design tools at Figma. We're building collaborative design software that enables teams to create, prototype, and iterate together in real time. As a Senior UX Designer, you'll work on core product experiences that serve millions of designers, developers, and product teams worldwide. Help us make design more accessible and collaborative.",
    requirements: "• 5+ years of UX/product design experience\n• Strong portfolio showcasing complex product design work\n• Experience with design tools and prototyping software\n• Knowledge of user research methodologies and usability testing\n• Understanding of front-end development and design systems\n• Experience designing for collaborative or creative tools preferred",
    responsibilities: "• Design user experiences for Figma's core design tools\n• Create prototypes and conduct user testing sessions\n• Collaborate with product managers and engineers on feature development\n• Contribute to Figma's design system and component library\n• Conduct user research and synthesize insights\n• Present design concepts and rationale to stakeholders",
    skills: ["UX Design", "Product Design", "Prototyping", "User Research", "Design Systems", "Collaboration"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Premium design tools and latest equipment\n• Learning and development budget\n• Creative workspace and team design events",
    companyWebsite: "https://figma.com/careers"
  },
  {
    title: "Product Manager - Growth",
    companyName: "Notion",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 150000,
    maxSalary: 190000,
    description: "Drive growth initiatives at Notion, the all-in-one workspace for notes, docs, and collaboration. We're helping teams organize their work and life in one place, and we need a Growth Product Manager to optimize user acquisition, activation, and retention. Join us to work on features that help millions of users discover and adopt Notion's powerful capabilities.",
    requirements: "• 3+ years of product management experience with focus on growth\n• Strong analytical skills and experience with growth metrics\n• Knowledge of user acquisition, conversion, and retention strategies\n• Experience with A/B testing and experimentation platforms\n• Understanding of viral mechanics and referral systems\n• Data-driven approach to product development",
    responsibilities: "• Define and execute growth strategy for user acquisition and activation\n• Design and optimize user onboarding and first-time user experience\n• Work on viral features and referral mechanisms\n• Analyze user behavior and identify conversion opportunities\n• Collaborate with marketing, design, and engineering teams\n• Run growth experiments and measure impact on key metrics",
    skills: ["Growth Product Management", "Analytics", "A/B Testing", "User Acquisition", "Conversion Optimization"],
    benefits: "• Competitive salary and meaningful equity\n• Comprehensive health benefits and wellness stipend\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Premium productivity tools and equipment\n• Team retreats and company offsites",
    companyWebsite: "https://notion.so/careers"
  },
  {
    title: "Principal Product Designer",
    companyName: "Stripe",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 260000,
    description: "Lead design initiatives at Stripe, the infrastructure that powers commerce on the internet. We're building payment systems, financial tools, and business platforms used by millions of companies worldwide. As a Principal Product Designer, you'll lead complex design projects that span multiple products and help shape the future of internet commerce.",
    requirements: "• 7+ years of product design experience with leadership responsibilities\n• Strong portfolio showcasing complex B2B and fintech design work\n• Experience with design systems and scaling design across products\n• Knowledge of payments, financial services, or developer tools\n• Leadership experience and ability to mentor other designers\n• Strong communication skills and stakeholder management experience",
    responsibilities: "• Lead end-to-end design for complex, multi-product initiatives\n• Set design vision and strategy for key product areas\n• Collaborate with engineering, product, and business stakeholders\n• Mentor and guide junior and senior designers\n• Contribute to Stripe's design system and design culture\n• Conduct user research and advocate for user needs",
    skills: ["Product Design", "Design Leadership", "Design Systems", "Fintech", "User Research", "Mentoring"],
    benefits: "• Competitive total compensation package\n• Remote-first culture with flexible working arrangements\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup and coworking stipends\n• Annual company retreats and design team events",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Product Manager - Platform",
    companyName: "Atlassian",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 215000,
    description: "Build the platform capabilities that power Atlassian's suite of products including Jira, Confluence, and Bitbucket. We're creating developer and integration platforms that help teams work better together. As a Platform Product Manager, you'll work on APIs, integrations, and platform services that enable thousands of apps and integrations in our marketplace.",
    requirements: "• 5+ years of product management experience with platform products\n• Strong technical background and understanding of APIs and integrations\n• Experience with developer ecosystems and platform strategies\n• Knowledge of B2B SaaS and enterprise software\n• Data-driven approach to product decisions\n• Experience working with engineering teams on technical products",
    responsibilities: "• Define platform strategy and roadmap for Atlassian's developer platform\n• Work with engineering teams to deliver APIs and platform capabilities\n• Partner with marketplace and ecosystem teams on integrations\n• Gather feedback from developers and third-party partners\n• Analyze platform usage and performance metrics\n• Present platform vision to leadership and developer community",
    skills: ["Platform Product Management", "APIs", "Developer Ecosystem", "Technical Product Management", "B2B"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and ShipIt days\n• Learning and development budget\n• Conference attendance and speaking opportunities\n• Employee resource groups and volunteer programs",
    companyWebsite: "https://atlassian.com/company/careers"
  },
  {
    title: "Product Designer",
    companyName: "Airbnb",
    location: "Los Angeles, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Design experiences that help create a world where anyone can belong anywhere at Airbnb. We're building a platform that connects millions of travelers with unique places to stay and experiences to enjoy. As a Product Designer, you'll work on features that help guests discover and book accommodations while ensuring hosts can successfully share their spaces.",
    requirements: "• 3+ years of product design experience\n• Strong portfolio showcasing user-centered design work\n• Experience with design tools (Figma, Sketch) and prototyping\n• Knowledge of user research and usability testing\n• Understanding of mobile and web design principles\n• Experience with marketplace or travel products preferred",
    responsibilities: "• Design user experiences for booking and discovery features\n• Create prototypes and conduct user testing sessions\n• Collaborate with product managers and engineers on feature development\n• Contribute to Airbnb's design system and component library\n• Conduct user research with guests and hosts\n• Present design concepts and iterate based on feedback",
    skills: ["Product Design", "User Research", "Prototyping", "Design Systems", "Mobile Design", "Marketplace"],
    benefits: "• Competitive salary with equity and performance bonuses\n• Annual Airbnb travel credit ($2,000 annually)\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and belonging initiatives",
    companyWebsite: "https://airbnb.com/careers"
  },
  {
    title: "Senior Product Manager - AI",
    companyName: "Dropbox",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 230000,
    description: "Lead AI product initiatives at Dropbox, where we're building intelligent features that help people organize, find, and collaborate on their work. As a Senior AI Product Manager, you'll work on machine learning features like smart search, document understanding, and automated workflows that make Dropbox more intelligent and helpful for our users.",
    requirements: "• 5+ years of product management experience with AI/ML products\n• Strong understanding of machine learning and AI technologies\n• Experience with document processing and knowledge management\n• Knowledge of search and information retrieval systems\n• Data-driven approach to product development\n• Experience with B2B and consumer products",
    responsibilities: "• Define AI product strategy and roadmap for intelligent features\n• Work with ML engineers and data scientists on model development\n• Design user experiences for AI-powered features\n• Analyze usage patterns and measure AI feature impact\n• Collaborate with engineering, design, and research teams\n• Present AI initiatives to leadership and stakeholders",
    skills: ["AI Product Management", "Machine Learning", "Search", "Document Processing", "Data Analysis"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Dropbox storage and productivity tools\n• Employee resource groups and volunteer programs",
    companyWebsite: "https://dropbox.com/jobs"
  },
  {
    title: "UX Researcher",
    companyName: "Discord",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Understand how millions of people communicate and build communities on Discord. As a UX Researcher, you'll conduct studies to inform product decisions for voice chat, text messaging, and community features. Help us design experiences that bring people together and create belonging in digital spaces for gamers, creators, and communities worldwide.",
    requirements: "• 3+ years of UX research experience\n• Strong background in qualitative and quantitative research methods\n• Experience with user interviews, surveys, and usability testing\n• Knowledge of research tools and data analysis techniques\n• Understanding of gaming, social, or communication products\n• Excellent communication and presentation skills",
    responsibilities: "• Conduct user research studies for product and design teams\n• Plan and execute qualitative and quantitative research projects\n• Analyze user behavior and synthesize insights from data\n• Present research findings and recommendations to stakeholders\n• Collaborate with designers, product managers, and engineers\n• Build user research capabilities and best practices",
    skills: ["UX Research", "User Interviews", "Usability Testing", "Data Analysis", "Research Methods"],
    benefits: "• Competitive salary and equity package\n• Remote-first with flexible work arrangements\n• Comprehensive health and wellness benefits\n• Unlimited PTO and mental health days\n• Learning and development budget\n• Gaming and community event stipends",
    companyWebsite: "https://discord.com/careers"
  },
  {
    title: "Product Manager - Monetization",
    companyName: "Twilio",
    location: "Denver, CO",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Drive monetization strategy at Twilio, the leading customer engagement platform. We're helping businesses communicate with their customers through voice, messaging, and video. As a Monetization Product Manager, you'll work on pricing, billing, and revenue optimization features that help Twilio scale while providing value to our developer and enterprise customers.",
    requirements: "• 3+ years of product management experience with monetization focus\n• Strong analytical skills and experience with pricing strategy\n• Knowledge of SaaS business models and billing systems\n• Experience with B2B platforms and developer products\n• Understanding of usage-based pricing and metering\n• Data-driven approach to product decisions",
    responsibilities: "• Define monetization strategy and pricing for Twilio products\n• Work on billing, usage tracking, and revenue optimization features\n• Analyze customer usage patterns and pricing sensitivity\n• Collaborate with sales, finance, and engineering teams\n• Design pricing experiments and measure revenue impact\n• Present monetization initiatives to leadership",
    skills: ["Product Management", "Monetization", "Pricing Strategy", "Analytics", "B2B SaaS", "Revenue Optimization"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development programs\n• Twilio.org volunteer time and charitable giving\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://twilio.com/company/jobs"
  },
  {
    title: "Design Systems Lead",
    companyName: "HashiCorp",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 155000,
    maxSalary: 205000,
    description: "Lead the design systems initiative at HashiCorp, the infrastructure automation company. We're building tools like Terraform, Vault, and Consul that help organizations adopt cloud infrastructure. As a Design Systems Lead, you'll create and maintain design systems that ensure consistency across our product portfolio while enabling teams to move quickly.",
    requirements: "• 5+ years of design experience with 2+ years in design systems\n• Strong portfolio showcasing design systems and component libraries\n• Experience with design tokens, component APIs, and documentation\n• Knowledge of front-end development (HTML, CSS, JavaScript)\n• Understanding of accessibility and inclusive design principles\n• Experience working with distributed teams",
    responsibilities: "• Lead design system strategy and implementation across products\n• Create and maintain component libraries and design tokens\n• Collaborate with designers and engineers on system adoption\n• Establish design system governance and contribution guidelines\n• Conduct design system training and workshops\n• Measure design system impact and usage across teams",
    skills: ["Design Systems", "Component Libraries", "Design Tokens", "Accessibility", "Documentation", "Leadership"],
    benefits: "• Remote-first company with global presence\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Learning and conference attendance budget\n• Home office setup and coworking stipends\n• Open source contribution time",
    companyWebsite: "https://hashicorp.com/jobs"
  },

  // ====== SALES & MARKETING JOBS ======
  {
    title: "Enterprise Sales Executive",
    companyName: "Snowflake",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Drive enterprise sales for Snowflake's cloud data platform. We're the leader in cloud data warehousing, helping organizations mobilize their data with our innovative architecture. As an Enterprise Sales Executive, you'll work with Fortune 500 companies to understand their data challenges and provide solutions that transform their analytics capabilities.",
    requirements: "• 5+ years of enterprise B2B software sales experience\n• Track record of closing deals $500K+ annually\n• Experience selling to C-level executives and technical decision makers\n• Knowledge of data, analytics, or cloud infrastructure preferred\n• Strong presentation and negotiation skills\n• Bachelor's degree in Business or related field",
    responsibilities: "• Manage full sales cycle for enterprise accounts ($1M+ deals)\n• Build relationships with C-level executives and IT leaders\n• Conduct product demonstrations and technical deep-dives\n• Collaborate with solution engineers and professional services\n• Negotiate enterprise contracts and pricing\n• Exceed annual sales quotas and revenue targets",
    skills: ["Enterprise Sales", "B2B Sales", "Data Analytics", "Cloud Software", "Salesforce", "Executive Relationships"],
    benefits: "• Base salary plus uncapped commission (OTE $300K+)\n• Comprehensive health and wellness benefits\n• Sales incentive trips and recognition programs\n• Stock options and equity participation\n• Professional development and sales training\n• Flexible work arrangements",
    companyWebsite: "https://snowflake.com/careers"
  },
  {
    title: "Growth Marketing Manager",
    companyName: "Canva",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Drive user acquisition and growth at Canva, the visual communication platform that empowers everyone to design. We're helping millions of users create graphics, presentations, and marketing materials. As a Growth Marketing Manager, you'll work on campaigns and experiments that drive user acquisition, activation, and retention across global markets.",
    requirements: "• 3+ years of growth marketing or digital marketing experience\n• Strong analytical skills and experience with growth metrics\n• Knowledge of paid advertising platforms (Google, Facebook, TikTok)\n• Experience with A/B testing and experimentation\n• Understanding of user acquisition funnels and lifecycle marketing\n• Data-driven approach to marketing optimization",
    responsibilities: "• Develop and execute user acquisition campaigns across channels\n• Design and run growth experiments to optimize conversion rates\n• Analyze campaign performance and user behavior data\n• Work on lifecycle marketing and user engagement campaigns\n• Collaborate with product, design, and analytics teams\n• Present growth insights and recommendations to leadership",
    skills: ["Growth Marketing", "Paid Advertising", "A/B Testing", "Analytics", "User Acquisition", "Lifecycle Marketing"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup allowance\n• Diversity and inclusion programs",
    companyWebsite: "https://canva.com/careers"
  },
  {
    title: "Sales Engineer",
    companyName: "Databricks",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 160000,
    maxSalary: 220000,
    description: "Bridge the gap between technology and business value at Databricks. We're the company behind Apache Spark and the unified analytics platform for big data and machine learning. As a Sales Engineer, you'll work with enterprise customers to demonstrate technical capabilities, design solutions, and help them realize value from their data and AI initiatives.",
    requirements: "• 5+ years of technical sales or solutions engineering experience\n• Strong background in big data, machine learning, or cloud platforms\n• Experience with Apache Spark, Python, SQL, and data processing\n• Knowledge of data science and machine learning workflows\n• Excellent presentation and customer-facing skills\n• Technical degree in Computer Science, Engineering, or related field",
    responsibilities: "• Conduct technical product demonstrations and proof-of-concepts\n• Design data and AI solutions for enterprise customers\n• Support sales team throughout the technical sales cycle\n• Lead technical discussions with customer engineering teams\n• Create technical content and solution documentation\n• Provide customer feedback to product and engineering teams",
    skills: ["Technical Sales", "Apache Spark", "Machine Learning", "Python", "Data Engineering", "Solution Architecture"],
    benefits: "• Competitive total compensation package (base + commission)\n• Comprehensive health and wellness benefits\n• Stock options and equity participation\n• Learning and development budget\n• Conference attendance and speaking opportunities\n• Flexible work arrangements and unlimited PTO",
    companyWebsite: "https://databricks.com/company/careers"
  },
  {
    title: "Content Marketing Manager",
    companyName: "GitLab",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 150000,
    description: "Drive content marketing initiatives at GitLab, the world's largest all-remote company and leading DevOps platform. We're helping development teams collaborate and deliver software faster. As a Content Marketing Manager, you'll create content that educates developers, showcases our platform capabilities, and drives adoption of GitLab's integrated DevOps solution.",
    requirements: "• 3+ years of content marketing experience, preferably B2B tech\n• Strong writing and storytelling skills with technical accuracy\n• Knowledge of DevOps, software development, or developer tools\n• Experience with content management systems and marketing automation\n• Understanding of SEO and content optimization\n• Remote work experience and self-management skills",
    responsibilities: "• Create technical content including blog posts, whitepapers, and guides\n• Develop content strategy for developer and IT decision-maker audiences\n• Collaborate with product marketing and developer relations teams\n• Manage content calendar and editorial workflow\n• Optimize content for SEO and lead generation\n• Measure content performance and engagement metrics",
    skills: ["Content Marketing", "Technical Writing", "SEO", "DevOps", "Developer Marketing", "B2B Marketing"],
    benefits: "• All-remote company with flexible working hours\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup and coworking allowances\n• Annual company meetups and team gatherings",
    companyWebsite: "https://gitlab.com/company/careers"
  },
  {
    title: "Digital Marketing Specialist",
    companyName: "Warby Parker",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 90000,
    maxSalary: 130000,
    description: "Drive digital marketing initiatives at Warby Parker, the eyewear brand that's transforming the industry with better vision, better style, and better value. We're a direct-to-consumer company with retail locations nationwide. As a Digital Marketing Specialist, you'll work on campaigns that drive online and offline customer acquisition while building brand awareness.",
    requirements: "• 3+ years of digital marketing experience\n• Strong experience with Google Ads, Facebook Ads, and paid social\n• Knowledge of email marketing and marketing automation platforms\n• Experience with e-commerce and retail marketing\n• Understanding of customer acquisition and lifetime value metrics\n• Creative thinking and ability to work in fast-paced environment",
    responsibilities: "• Manage paid advertising campaigns across Google and social platforms\n• Develop email marketing campaigns and automated sequences\n• Create and optimize landing pages for campaign conversion\n• Analyze campaign performance and provide optimization recommendations\n• Collaborate with creative and brand teams on campaign assets\n• Support omnichannel marketing initiatives",
    skills: ["Digital Marketing", "Paid Advertising", "Email Marketing", "E-commerce", "Analytics", "Campaign Optimization"],
    benefits: "• Competitive salary and performance bonuses\n• Comprehensive health and vision benefits\n• Free eyewear and employee discounts\n• Flexible work arrangements and generous PTO\n• Professional development and learning opportunities\n• Employee volunteer programs and community involvement",
    companyWebsite: "https://warbyparker.com/careers"
  },
  {
    title: "Account Executive",
    companyName: "Okta",
    location: "Chicago, IL",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 150000,
    description: "Drive new business growth at Okta, the leading identity and access management platform. We're helping organizations secure their workforce and customers with our identity solutions. As an Account Executive, you'll work with mid-market and enterprise prospects to understand their identity challenges and demonstrate how Okta can help them achieve zero trust security.",
    requirements: "• 3+ years of B2B software sales experience\n• Track record of meeting or exceeding sales quotas\n• Experience selling to IT and security decision makers\n• Knowledge of cybersecurity or identity management preferred\n• Strong prospecting and lead generation skills\n• Bachelor's degree in Business or related field",
    responsibilities: "• Generate new business opportunities through prospecting and networking\n• Conduct product demonstrations and technical presentations\n• Manage sales pipeline and forecast accurately\n• Negotiate contracts and close deals\n• Collaborate with solution engineers and customer success teams\n• Achieve quarterly and annual sales targets",
    skills: ["B2B Sales", "Cybersecurity", "Identity Management", "Salesforce", "Prospecting", "Solution Selling"],
    benefits: "• Base salary plus commission (OTE $200K+)\n• Comprehensive health and wellness benefits\n• Stock options and equity participation\n• Sales incentive programs and recognition\n• Professional development and security training\n• Flexible work arrangements and unlimited PTO",
    companyWebsite: "https://okta.com/company/careers"
  },
  {
    title: "Marketing Operations Manager",
    companyName: "Confluent",
    location: "Palo Alto, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Drive marketing operations excellence at Confluent, the data streaming platform built by the creators of Apache Kafka. We're helping organizations harness real-time data to build applications and analytics. As a Marketing Operations Manager, you'll optimize marketing processes, manage marketing technology, and provide insights that drive growth and efficiency.",
    requirements: "• 5+ years of marketing operations experience\n• Strong experience with marketing automation platforms (Marketo, HubSpot)\n• Knowledge of CRM systems (Salesforce) and data management\n• Experience with marketing analytics and attribution modeling\n• Understanding of B2B marketing and lead management processes\n• Data analysis skills and proficiency with Excel/SQL",
    responsibilities: "• Manage marketing automation and lead management processes\n• Optimize marketing campaigns and conversion funnels\n• Implement marketing technology stack and integrations\n• Create marketing dashboards and performance reports\n• Support demand generation and field marketing teams\n• Ensure data quality and lead scoring accuracy",
    skills: ["Marketing Operations", "Marketing Automation", "Salesforce", "Data Analysis", "Campaign Optimization", "B2B Marketing"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Conference attendance and Apache Kafka training\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://confluent.io/careers"
  },
  {
    title: "Customer Marketing Manager",
    companyName: "Zoom",
    location: "San Jose, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 115000,
    maxSalary: 155000,
    description: "Drive customer advocacy and expansion at Zoom, the communications platform that connects people everywhere. We're helping millions of users stay connected through video, phone, and messaging solutions. As a Customer Marketing Manager, you'll work on programs that showcase customer success, drive expansion revenue, and build advocacy among our user base.",
    requirements: "• 3+ years of customer marketing or customer success experience\n• Strong experience with customer advocacy and reference programs\n• Knowledge of B2B SaaS and enterprise software\n• Experience with customer segmentation and lifecycle marketing\n• Excellent communication and relationship building skills\n• Understanding of customer expansion and upselling strategies",
    responsibilities: "• Develop customer advocacy and reference programs\n• Create customer success stories and case studies\n• Design customer expansion and upselling campaigns\n• Manage customer advisory boards and user communities\n• Collaborate with customer success and sales teams\n• Measure program impact on customer retention and expansion",
    skills: ["Customer Marketing", "Customer Advocacy", "Case Studies", "B2B SaaS", "Expansion Revenue", "Community Building"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Zoom communication tools and latest technology\n• Learning and development opportunities\n• Employee resource groups and wellness programs",
    companyWebsite: "https://zoom.com/careers"
  },
  {
    title: "Performance Marketing Manager",
    companyName: "Casper",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 105000,
    maxSalary: 145000,
    description: "Drive performance marketing initiatives at Casper, the sleep company that's revolutionizing the mattress industry. We're building a sleep brand that helps people get better rest through innovative products and sleep wellness. As a Performance Marketing Manager, you'll optimize paid campaigns across channels to drive customer acquisition and revenue growth.",
    requirements: "• 3+ years of performance marketing experience\n• Strong experience with Google Ads, Facebook Ads, and paid social\n• Knowledge of e-commerce and direct-to-consumer marketing\n• Experience with attribution modeling and marketing analytics\n• Understanding of customer acquisition costs and lifetime value\n• Creative and analytical mindset with testing orientation",
    responsibilities: "• Manage performance marketing campaigns across paid channels\n• Optimize ad spend allocation and bidding strategies\n• Create and test ad creative and landing page experiences\n• Analyze campaign performance and provide optimization insights\n• Collaborate with creative and brand teams on campaign assets\n• Report on customer acquisition metrics and ROI",
    skills: ["Performance Marketing", "Paid Advertising", "E-commerce", "Analytics", "Conversion Optimization", "Customer Acquisition"],
    benefits: "• Competitive salary and performance bonuses\n• Comprehensive health and wellness benefits\n• Casper products and employee discounts\n• Flexible work arrangements and generous PTO\n• Professional development and learning opportunities\n• Wellness programs and sleep health initiatives",
    companyWebsite: "https://casper.com/careers"
  },
  {
    title: "Senior Marketing Manager",
    companyName: "Allbirds",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Drive marketing initiatives at Allbirds, the sustainable footwear brand that's better for your feet and the planet. We're building a global lifestyle brand focused on natural materials and environmental responsibility. As a Senior Marketing Manager, you'll work on integrated campaigns that drive brand awareness, customer acquisition, and engagement across multiple channels.",
    requirements: "• 5+ years of marketing experience with brand and performance focus\n• Strong experience with integrated marketing campaigns\n• Knowledge of sustainable/mission-driven brand marketing\n• Experience with e-commerce and retail marketing\n• Understanding of brand positioning and customer segmentation\n• Creative campaign development and execution skills",
    responsibilities: "• Develop integrated marketing campaigns across channels\n• Create brand storytelling and sustainability messaging\n• Manage campaign budgets and performance optimization\n• Collaborate with creative, PR, and retail marketing teams\n• Analyze campaign performance and customer insights\n• Support new product launches and seasonal campaigns",
    skills: ["Brand Marketing", "Integrated Campaigns", "Sustainability Marketing", "E-commerce", "Creative Development", "Customer Insights"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Allbirds products and sustainable living stipends\n• Flexible work arrangements and unlimited PTO\n• Professional development and conference attendance\n• Environmental impact and volunteer programs",
    companyWebsite: "https://allbirds.com/pages/careers"
  },

  // ====== OPERATIONS JOBS ======
  {
    title: "Senior Operations Manager",
    companyName: "DoorDash",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Lead operations initiatives at DoorDash, the leading last-mile logistics platform. We're connecting consumers with local merchants and Dashers, facilitating millions of deliveries worldwide. As a Senior Operations Manager, you'll work on marketplace operations, logistics optimization, and growth initiatives that help local commerce thrive in communities everywhere.",
    requirements: "• 5+ years of operations management experience\n• Strong analytical and problem-solving skills\n• Experience with marketplace or two-sided platform operations\n• Knowledge of logistics, supply chain, or delivery operations\n• Data-driven approach to operations optimization\n• Leadership experience and ability to manage cross-functional projects",
    responsibilities: "• Optimize marketplace operations and merchant/Dasher experience\n• Lead initiatives to improve delivery efficiency and customer satisfaction\n• Analyze operational metrics and identify improvement opportunities\n• Collaborate with product, engineering, and business development teams\n• Manage operational projects and process improvements\n• Support new market launches and expansion initiatives",
    skills: ["Operations Management", "Marketplace Operations", "Logistics", "Data Analysis", "Process Improvement", "Project Management"],
    benefits: "• Competitive salary with equity and performance bonuses\n• Comprehensive health and wellness benefits\n• DashPass subscription and meal allowances\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://doordash.com/careers"
  },
  {
    title: "People Operations Manager",
    companyName: "Stripe",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Build world-class people operations at Stripe, the financial infrastructure for the internet. We're scaling rapidly and need exceptional people operations to support our global workforce. As a People Operations Manager, you'll work on employee lifecycle management, HR technology, and programs that help Stripe maintain its high-performance culture as we grow.",
    requirements: "• 5+ years of HR or people operations experience\n• Strong experience with HRIS systems and HR technology\n• Knowledge of employment law and compliance across multiple countries\n• Experience with scaling operations in high-growth technology companies\n• Excellent project management and process design skills\n• Global or distributed team experience preferred",
    responsibilities: "• Manage employee lifecycle processes from hire to promotion to departure\n• Implement and optimize HR technology and systems\n• Ensure compliance with global employment law and regulations\n• Design and improve people operations processes and workflows\n• Support managers and employees with HR-related questions\n• Analyze people data and provide insights to leadership",
    skills: ["People Operations", "HRIS", "Employment Law", "Global HR", "Process Design", "Compliance"],
    benefits: "• Competitive total compensation package\n• Remote-first culture with flexible working arrangements\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup and coworking stipends\n• Annual company retreats and team offsites",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Finance Manager",
    companyName: "Coinbase",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 145000,
    maxSalary: 185000,
    description: "Drive financial operations at Coinbase, the leading cryptocurrency exchange. We're building the cryptoeconomy and need strong financial management to support our growth and compliance requirements. As a Finance Manager, you'll work on financial planning, analysis, and operations for a rapidly evolving industry with unique regulatory and accounting challenges.",
    requirements: "• 5+ years of finance experience, preferably in fintech or financial services\n• Strong analytical and financial modeling skills\n• Knowledge of accounting principles and financial reporting\n• Experience with financial planning and analysis (FP&A)\n• Understanding of regulatory compliance and risk management\n• CPA or advanced finance degree preferred",
    responsibilities: "• Lead financial planning and analysis for business units\n• Develop financial models and forecasts for strategic initiatives\n• Support monthly and quarterly financial reporting processes\n• Analyze business performance and provide insights to leadership\n• Work on regulatory compliance and audit requirements\n• Collaborate with accounting, legal, and business teams",
    skills: ["Financial Planning & Analysis", "Financial Modeling", "Accounting", "Regulatory Compliance", "Risk Management", "Fintech"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Cryptocurrency learning and earning opportunities\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://coinbase.com/careers"
  },
  {
    title: "Customer Success Manager",
    companyName: "Slack",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Drive customer success at Slack, the digital headquarters for teams around the world. We're helping organizations transform how they work and communicate. As a Customer Success Manager, you'll work with enterprise customers to ensure they achieve their goals with Slack, driving adoption, expansion, and renewal of our collaboration platform.",
    requirements: "• 3+ years of customer success or account management experience\n• Strong experience with B2B SaaS and enterprise software\n• Knowledge of collaboration tools and workplace productivity\n• Excellent communication and relationship building skills\n• Data-driven approach to customer health and success metrics\n• Experience with customer expansion and upselling",
    responsibilities: "• Manage relationships with strategic enterprise customers\n• Drive product adoption and usage across customer organizations\n• Identify expansion opportunities and collaborate with sales teams\n• Conduct business reviews and success planning sessions\n• Resolve customer issues and coordinate with support teams\n• Measure customer health metrics and success outcomes",
    skills: ["Customer Success", "Account Management", "B2B SaaS", "Relationship Building", "Product Adoption", "Expansion Revenue"],
    benefits: "• Competitive salary with performance bonuses and equity\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and inclusion programs\n• Professional development and leadership training",
    companyWebsite: "https://slack.com/careers"
  },
  {
    title: "Legal Counsel",
    companyName: "Airbnb",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 260000,
    description: "Provide legal support for Airbnb's mission to create a world where anyone can belong anywhere. We're a global marketplace connecting travelers with hosts, and we need strong legal counsel to navigate complex regulatory environments, partnership agreements, and business operations. Join our legal team to work on cutting-edge issues in the sharing economy.",
    requirements: "• JD from accredited law school and bar admission\n• 5+ years of experience in corporate law or relevant practice area\n• Experience with technology companies, marketplaces, or sharing economy\n• Knowledge of regulatory compliance and government relations\n• Strong contract negotiation and drafting skills\n• International legal experience preferred",
    responsibilities: "• Provide legal counsel on business operations and strategic initiatives\n• Draft and negotiate commercial agreements and partnerships\n• Support regulatory compliance and government relations efforts\n• Work on product legal issues and terms of service updates\n• Collaborate with business teams on legal risk assessment\n• Manage external counsel relationships and legal projects",
    skills: ["Corporate Law", "Contract Negotiation", "Regulatory Compliance", "Technology Law", "Commercial Agreements", "Risk Assessment"],
    benefits: "• Competitive total compensation package\n• Annual Airbnb travel credit ($2,000 annually)\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Professional development and continuing legal education\n• Employee resource groups and belonging initiatives",
    companyWebsite: "https://airbnb.com/careers"
  },
  {
    title: "Business Operations Analyst",
    companyName: "Roblox",
    location: "San Mateo, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 115000,
    maxSalary: 155000,
    description: "Drive business operations analysis at Roblox, the platform that's powering the next generation of human co-experience. We're building a metaverse where millions of users create, share, and play together. As a Business Operations Analyst, you'll work on data analysis, process optimization, and strategic projects that help Roblox scale and grow.",
    requirements: "• 3+ years of business operations or analytics experience\n• Strong analytical and data analysis skills\n• Proficiency with SQL, Excel, and data visualization tools\n• Experience with business process improvement and optimization\n• Knowledge of gaming or platform business models\n• Strong communication and presentation skills",
    responsibilities: "• Analyze business performance and operational metrics\n• Support strategic planning and business development initiatives\n• Design and implement process improvements across teams\n• Create dashboards and reports for leadership\n• Collaborate with product, engineering, and business teams\n• Lead cross-functional projects and operational improvements",
    skills: ["Business Analysis", "Data Analysis", "SQL", "Process Improvement", "Strategic Planning", "Project Management"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee game development programs\n• Diverse and inclusive workplace culture",
    companyWebsite: "https://roblox.com/careers"
  },
  {
    title: "Talent Acquisition Partner",
    companyName: "Notion",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 150000,
    description: "Build exceptional teams at Notion, the all-in-one workspace that's helping millions of people organize their work and life. We're scaling rapidly and need a talented recruiter to help us find and hire the best people. As a Talent Acquisition Partner, you'll work on full-cycle recruiting across engineering, product, and business functions.",
    requirements: "• 3+ years of full-cycle recruiting experience\n• Strong experience recruiting for technology companies\n• Knowledge of engineering, product, and business role recruiting\n• Excellent sourcing skills and candidate relationship building\n• Experience with applicant tracking systems and recruiting tools\n• Understanding of diversity and inclusion in hiring practices",
    responsibilities: "• Manage full-cycle recruiting for assigned roles and teams\n• Source candidates through various channels and build talent pipelines\n• Conduct initial screenings and coordinate interview processes\n• Partner with hiring managers on role requirements and candidate evaluation\n• Provide exceptional candidate experience throughout hiring process\n• Contribute to recruiting strategy and process improvements",
    skills: ["Full-cycle Recruiting", "Sourcing", "Candidate Experience", "ATS", "Interview Process", "Talent Pipeline"],
    benefits: "• Competitive salary and meaningful equity\n• Comprehensive health benefits and wellness stipend\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Premium productivity tools and equipment\n• Team retreats and company offsites",
    companyWebsite: "https://notion.so/careers"
  },
  {
    title: "Program Manager",
    companyName: "Pinterest",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Drive strategic programs at Pinterest, the visual discovery platform that inspires billions of people worldwide. We're building a positive corner of the internet where people find ideas for their projects and interests. As a Program Manager, you'll work on cross-functional initiatives that help Pinterest achieve its mission and business goals.",
    requirements: "• 5+ years of program or project management experience\n• Strong experience managing cross-functional programs\n• Knowledge of technology product development and launch processes\n• Excellent communication and stakeholder management skills\n• Data-driven approach to program planning and measurement\n• Experience with consumer internet or social media companies",
    responsibilities: "• Lead strategic cross-functional programs from planning to execution\n• Coordinate between engineering, product, design, and business teams\n• Develop program timelines, milestones, and success metrics\n• Communicate program status and updates to leadership\n• Identify and mitigate program risks and dependencies\n• Drive process improvements and operational excellence",
    skills: ["Program Management", "Cross-functional Leadership", "Strategic Planning", "Stakeholder Management", "Process Improvement", "Risk Management"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development programs\n• Employee resource groups and inclusion initiatives\n• Home office setup and wellness stipends",
    companyWebsite: "https://pinterest.com/careers"
  },
  {
    title: "Security Operations Manager",
    companyName: "Cloudflare",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 155000,
    maxSalary: 205000,
    description: "Lead security operations at Cloudflare, the company that's helping build a better internet. We operate one of the world's largest networks, protecting millions of websites and applications from cyber threats. As a Security Operations Manager, you'll work on incident response, threat detection, and security program management for our global infrastructure.",
    requirements: "• 5+ years of cybersecurity and security operations experience\n• Strong background in incident response and threat detection\n• Knowledge of security frameworks and compliance standards\n• Experience with security tools and technologies (SIEM, IDS/IPS, etc.)\n• Leadership experience and ability to manage security teams\n• Understanding of cloud security and network security principles",
    responsibilities: "• Lead security incident response and threat hunting activities\n• Manage security operations center (SOC) and security team\n• Develop security policies, procedures, and playbooks\n• Coordinate with engineering teams on security architecture\n• Oversee security compliance and audit activities\n• Present security metrics and updates to leadership",
    skills: ["Security Operations", "Incident Response", "Threat Detection", "Security Management", "Compliance", "Team Leadership"],
    benefits: "• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Security certification and training support\n• Diverse and inclusive workplace initiatives",
    companyWebsite: "https://cloudflare.com/careers"
  },
  {
    title: "Strategic Partnerships Manager",
    companyName: "Twilio",
    location: "Denver, CO",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Drive strategic partnerships at Twilio, the leading customer engagement platform. We're building the communications infrastructure for the digital economy, and partnerships are crucial for our ecosystem growth. As a Strategic Partnerships Manager, you'll identify, negotiate, and manage partnerships that drive mutual value and business growth.",
    requirements: "• 5+ years of business development or partnerships experience\n• Strong experience with technology partnerships and ecosystems\n• Knowledge of API platforms and developer ecosystems\n• Excellent negotiation and relationship management skills\n• Understanding of B2B SaaS business models\n• Track record of successful partnership development",
    responsibilities: "• Identify and evaluate strategic partnership opportunities\n• Negotiate partnership agreements and commercial terms\n• Manage ongoing partner relationships and success metrics\n• Collaborate with product, engineering, and marketing teams\n• Develop go-to-market strategies for partner integrations\n• Present partnership updates and metrics to leadership",
    skills: ["Strategic Partnerships", "Business Development", "Partnership Management", "Negotiation", "Ecosystem Development", "Relationship Management"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development programs\n• Twilio.org volunteer time and charitable giving\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://twilio.com/company/jobs"
  },

  // ====== ADDITIONAL SOFTWARE ENGINEERING JOBS ======
  {
    title: "Staff Software Engineer",
    companyName: "Databricks",
    location: "Mountain View, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 220000,
    maxSalary: 300000,
    description: "Lead engineering initiatives at Databricks, the unified analytics platform for big data and machine learning. As a Staff Engineer, you'll work on distributed systems that process massive datasets and build the next generation of data platforms. Help us democratize data and AI for organizations worldwide.",
    requirements: "• 7+ years of software engineering experience\n• Expert-level knowledge of distributed systems\n• Strong proficiency in Scala, Java, or Python\n• Experience with Apache Spark or similar big data frameworks\n• Deep understanding of database systems and query optimization\n• Leadership experience and mentoring capabilities",
    responsibilities: "• Architect and build large-scale distributed systems\n• Lead technical initiatives across multiple teams\n• Mentor senior engineers and set technical standards\n• Drive performance optimization and scalability improvements\n• Collaborate with product teams on technical roadmap\n• Represent Databricks in the open source community",
    skills: ["Scala", "Apache Spark", "Distributed Systems", "Big Data", "Cloud Platforms", "Leadership"],
    benefits: "• Industry-leading compensation package\n• Comprehensive health and wellness benefits\n• Equity participation and performance bonuses\n• Learning and development budget ($5,000 annually)\n• Conference speaking opportunities\n• Flexible work arrangements",
    companyWebsite: "https://databricks.com/company/careers"
  },
  {
    title: "Frontend Engineer - React",
    companyName: "Spotify",
    location: "Boston, MA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 125000,
    maxSalary: 165000,
    description: "Build the web experiences that connect millions of users to their favorite music and podcasts. At Spotify, you'll work on our web player, desktop app, and internal tools used by artists, labels, and content creators. Help us create interfaces that make audio discovery magical and accessible to everyone.",
    requirements: "• 3+ years of frontend development experience\n• Expert knowledge of React and modern JavaScript\n• Experience with TypeScript and modern build tools\n• Understanding of audio/media APIs and streaming\n• Knowledge of accessibility and internationalization\n• Experience with testing frameworks and CI/CD",
    responsibilities: "• Develop and maintain Spotify's web applications\n• Build features for music discovery and playback\n• Optimize performance for global scale and diverse devices\n• Collaborate with designers on pixel-perfect implementations\n• Work on accessibility and internationalization features\n• Contribute to Spotify's design system and component library",
    skills: ["React", "TypeScript", "Audio APIs", "Testing", "Performance Optimization", "Accessibility"],
    benefits: "• Competitive salary and equity package\n• Spotify Premium and exclusive music perks\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Music and podcast creation allowances\n• Employee concerts and music events",
    companyWebsite: "https://spotify.com/careers"
  },
  {
    title: "Backend Engineer - Payments",
    companyName: "Robinhood",
    location: "Menlo Park, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 225000,
    description: "Build the payment systems that power commission-free investing. At Robinhood, you'll work on high-scale financial infrastructure that processes billions of dollars in transactions. Join our payments team to work on ACH, wire transfers, and instant deposits that help democratize access to financial markets.",
    requirements: "• 5+ years of backend engineering experience\n• Strong knowledge of payment systems and financial infrastructure\n• Experience with high-volume, low-latency systems\n• Understanding of financial regulations and compliance\n• Proficiency in Python, Go, or similar languages\n• Knowledge of database design and distributed systems",
    responsibilities: "• Design and build payment processing systems\n• Ensure PCI compliance and financial security\n• Optimize transaction processing for speed and reliability\n• Work on fraud detection and prevention systems\n• Collaborate with compliance and risk teams\n• Monitor and maintain 24/7 financial services",
    skills: ["Python", "Payment Systems", "Financial Services", "Security", "Compliance", "Distributed Systems"],
    benefits: "• Competitive compensation and equity package\n• Comprehensive health and financial wellness benefits\n• Commission-free trading and investment accounts\n• Learning and development opportunities\n• Financial planning and 401(k) matching\n• Stock purchase program",
    companyWebsite: "https://robinhood.com/careers"
  },
  {
    title: "iOS Engineer",
    companyName: "DoorDash",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Build the mobile experiences that connect millions of consumers with local merchants. At DoorDash, you'll work on iOS apps for consumers, Dashers, and merchants, creating seamless experiences for on-demand delivery. Help us empower local economies and make delivery accessible to everyone.",
    requirements: "• 3+ years of iOS development experience\n• Expert knowledge of Swift and iOS SDK\n• Experience with location services and real-time features\n• Knowledge of offline capabilities and data synchronization\n• Understanding of performance optimization for mobile\n• Experience with push notifications and background processing",
    responsibilities: "• Develop consumer and Dasher iOS applications\n• Build real-time tracking and location features\n• Optimize app performance and battery usage\n• Implement offline capabilities and data sync\n• Work on push notifications and background tasks\n• Collaborate with backend teams on API design",
    skills: ["Swift", "iOS SDK", "Location Services", "Real-time Features", "Performance Optimization", "Push Notifications"],
    benefits: "• Competitive salary and equity package\n• DashPass subscription and meal credits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Employee resource groups and volunteer opportunities\n• Professional development and conference attendance",
    companyWebsite: "https://doordash.com/careers"
  },
  {
    title: "Platform Engineer - Infrastructure",
    companyName: "GitLab",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 215000,
    description: "Build the infrastructure platform that powers GitLab's all-in-one DevOps solution. As an all-remote company, we're building the future of work while helping development teams collaborate and ship code faster. Join our infrastructure team to work on scalable systems that serve millions of developers worldwide.",
    requirements: "• 5+ years of platform or infrastructure engineering experience\n• Strong experience with Kubernetes and container orchestration\n• Knowledge of GitLab CI/CD and DevOps practices\n• Proficiency in Go, Ruby, or Python\n• Experience with monitoring and observability tools\n• Understanding of security and compliance for developer tools",
    responsibilities: "• Build and maintain GitLab's infrastructure platform\n• Work on CI/CD pipeline optimization and scalability\n• Implement monitoring and alerting for platform services\n• Design self-service tools for development teams\n• Collaborate with security team on platform hardening\n• Contribute to open source GitLab project",
    skills: ["Kubernetes", "Go", "Ruby", "CI/CD", "Monitoring", "DevOps"],
    benefits: "• All-remote company with ultimate flexibility\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Home office and coworking allowances\n• Learning and development budget\n• Annual team meetups and GitLab Commit conference",
    companyWebsite: "https://gitlab.com/company/careers"
  },
  {
    title: "Full Stack Engineer - Growth",
    companyName: "Instacart",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Drive growth initiatives at Instacart, the leading grocery marketplace in North America. You'll work on features that help customers discover products, optimize their shopping experience, and increase order frequency. Join our growth team to build experiences that make grocery shopping effortless for millions of families.",
    requirements: "• 3+ years of full stack development experience\n• Strong proficiency in React and Python\n• Experience with A/B testing and experimentation platforms\n• Knowledge of e-commerce and marketplace dynamics\n• Understanding of growth metrics and user acquisition\n• Experience with data analysis and user behavior tracking",
    responsibilities: "• Build growth features across web and mobile platforms\n• Design and implement A/B testing infrastructure\n• Work on user onboarding and activation flows\n• Develop recommendation and personalization systems\n• Analyze user behavior and optimize conversion funnels\n• Collaborate with product, design, and data science teams",
    skills: ["React", "Python", "A/B Testing", "Growth Engineering", "Data Analysis", "E-commerce"],
    benefits: "• Competitive salary and equity package\n• Instacart+ membership and grocery credits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and community involvement",
    companyWebsite: "https://instacart.com/careers"
  },
  {
    title: "Security Engineer - Cloud",
    companyName: "MongoDB",
    location: "Austin, TX",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Secure MongoDB's cloud database platform used by millions of developers and thousands of enterprises worldwide. As a Security Engineer, you'll work on cloud security, identity management, and threat detection for MongoDB Atlas. Help us build secure-by-default database services that protect customer data at scale.",
    requirements: "• 5+ years of cybersecurity experience with cloud focus\n• Strong knowledge of cloud security (AWS, GCP, Azure)\n• Experience with identity and access management (IAM)\n• Understanding of database security and encryption\n• Knowledge of security monitoring and incident response\n• Experience with security automation and infrastructure as code",
    responsibilities: "• Design and implement cloud security architecture\n• Build security monitoring and threat detection systems\n• Work on identity and access management for MongoDB Atlas\n• Conduct security reviews and vulnerability assessments\n• Implement encryption and data protection measures\n• Collaborate with engineering teams on secure development practices",
    skills: ["Cloud Security", "IAM", "Database Security", "Threat Detection", "Security Automation", "Encryption"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• MongoDB University and certification programs\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://mongodb.com/careers"
  },
  {
    title: "Engineering Manager",
    companyName: "Zoom",
    location: "San Jose, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 270000,
    description: "Lead engineering teams at Zoom, the communications platform that connects people everywhere. We're building the future of video communications, and we need strong engineering leaders to scale our teams and technology. Join us to manage talented engineers while contributing to products that help billions of people stay connected.",
    requirements: "• 7+ years of software engineering experience with 2+ years management\n• Strong technical background in distributed systems or real-time communications\n• Experience managing and growing engineering teams\n• Knowledge of video/audio technologies and protocols\n• Excellent communication and leadership skills\n• Experience with agile development and delivery practices",
    responsibilities: "• Manage and mentor a team of senior software engineers\n• Drive technical roadmap and architecture decisions\n• Collaborate with product managers on feature planning\n• Ensure high-quality delivery and engineering excellence\n• Support career growth and development of team members\n• Represent engineering in cross-functional initiatives",
    skills: ["Engineering Leadership", "Team Management", "Video Technology", "Distributed Systems", "Agile", "Mentoring"],
    benefits: "• Industry-leading compensation and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Management development programs\n• Zoom communication tools and latest technology\n• Employee resource groups and leadership training",
    companyWebsite: "https://zoom.com/careers"
  },

  // ====== ADDITIONAL DATA & AI JOBS ======
  {
    title: "Data Scientist - Recommendations",
    companyName: "Netflix",
    location: "Los Gatos, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 190000,
    maxSalary: 260000,
    description: "Build recommendation systems that help millions of members discover their next favorite show or movie. At Netflix, you'll work on machine learning algorithms that power our recommendation engine, using viewing data, content metadata, and user behavior to create personalized experiences that delight our global audience.",
    requirements: "• 5+ years of data science experience with focus on recommendations\n• PhD or Masters in Computer Science, Statistics, or related field\n• Strong proficiency in Python, R, and machine learning frameworks\n• Experience with recommendation systems and collaborative filtering\n• Knowledge of deep learning and neural network architectures\n• Understanding of A/B testing and experimentation",
    responsibilities: "• Develop and improve Netflix's recommendation algorithms\n• Build models for content discovery and personalization\n• Conduct A/B tests to measure recommendation effectiveness\n• Analyze member behavior and viewing patterns\n• Collaborate with engineering teams on model deployment\n• Research new techniques in recommendation systems",
    skills: ["Machine Learning", "Recommendation Systems", "Python", "Deep Learning", "A/B Testing", "Statistics"],
    benefits: "• Top-tier compensation and equity package\n• Unlimited Netflix subscription and content access\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee screenings and content events",
    companyWebsite: "https://netflix.com/careers"
  },
  {
    title: "ML Engineer - Computer Vision",
    companyName: "Tesla",
    location: "Palo Alto, CA",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 250000,
    description: "Build the computer vision systems that power Tesla's Autopilot and Full Self-Driving capabilities. You'll work on neural networks that process visual data from millions of vehicles, helping create the future of autonomous transportation. Join our AI team to work on cutting-edge problems in real-world computer vision.",
    requirements: "• 5+ years of machine learning engineering experience\n• Strong background in computer vision and deep learning\n• Proficiency in Python, PyTorch, or TensorFlow\n• Experience with large-scale data processing and distributed training\n• Knowledge of automotive systems and autonomous driving preferred\n• Understanding of real-time inference and edge computing",
    responsibilities: "• Develop computer vision models for autonomous driving\n• Work on neural network architectures for multi-camera systems\n• Optimize models for real-time inference on vehicle hardware\n• Process and analyze data from Tesla's fleet\n• Collaborate with hardware and software teams\n• Research new approaches in autonomous vehicle perception",
    skills: ["Computer Vision", "Deep Learning", "PyTorch", "Autonomous Driving", "Neural Networks", "Edge Computing"],
    benefits: "• Competitive salary and Tesla stock options\n• Comprehensive health and wellness benefits\n• Tesla vehicle purchase program and charging\n• Learning and development opportunities\n• Cutting-edge research environment\n• Employee shuttle and onsite amenities",
    companyWebsite: "https://tesla.com/careers"
  },
  {
    title: "Data Engineer - Streaming",
    companyName: "Twitch",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Build the data infrastructure that powers live streaming for millions of creators and viewers. At Twitch, you'll work on real-time data systems that process billions of events, enabling analytics, recommendations, and monetization features that help the creator economy thrive.",
    requirements: "• 3+ years of data engineering experience\n• Strong proficiency in Python, Java, or Scala\n• Experience with streaming data platforms (Kafka, Kinesis)\n• Knowledge of big data frameworks (Spark, Flink)\n• Understanding of real-time analytics and event processing\n• Experience with AWS and cloud data services",
    responsibilities: "• Build real-time data pipelines for streaming analytics\n• Work on event processing systems for live video data\n• Develop data infrastructure for creator monetization\n• Optimize data processing for low-latency requirements\n• Collaborate with data scientists on feature engineering\n• Monitor and maintain high-availability data systems",
    skills: ["Streaming Data", "Apache Kafka", "Apache Spark", "Real-time Analytics", "AWS", "Event Processing"],
    benefits: "• Competitive salary and equity package\n• Twitch Prime and gaming benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Gaming equipment and creator support\n• Employee resource groups and gaming events",
    companyWebsite: "https://twitch.tv/jobs"
  },
  {
    title: "Applied Scientist - NLP",
    companyName: "Amazon",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 185000,
    maxSalary: 245000,
    description: "Drive natural language processing innovations at Amazon, working on Alexa, search, and customer experience features. You'll develop NLP models that understand and generate human language at scale, helping millions of customers interact with Amazon's services more naturally and effectively.",
    requirements: "• PhD in Computer Science, NLP, or related field\n• 3+ years of NLP research experience in industry or academia\n• Strong proficiency in Python and deep learning frameworks\n• Experience with transformer models and large language models\n• Knowledge of speech recognition and text-to-speech systems\n• Publication record in top-tier NLP conferences preferred",
    responsibilities: "• Research and develop NLP models for Alexa and customer features\n• Work on language understanding and dialogue systems\n• Build text generation and summarization capabilities\n• Collaborate with product teams to integrate NLP features\n• Publish research findings and represent Amazon at conferences\n• Mentor junior scientists and establish research directions",
    skills: ["NLP", "Deep Learning", "Language Models", "Speech Processing", "Python", "Research"],
    benefits: "• Competitive total compensation package\n• Amazon stock and employee purchase program\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and career development\n• Research publication and conference support\n• Amazon Prime and employee discounts",
    companyWebsite: "https://amazon.jobs"
  },
  {
    title: "Data Analyst - Business Intelligence",
    companyName: "Shopify",
    location: "Ottawa, Canada",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 95000,
    maxSalary: 135000,
    description: "Drive data-driven decision making at Shopify, the commerce platform that powers millions of merchants worldwide. You'll work on business intelligence, reporting, and analytics that help our merchants succeed and inform Shopify's product and business strategy.",
    requirements: "• 3+ years of data analysis or business intelligence experience\n• Strong proficiency in SQL and data visualization tools\n• Experience with business intelligence platforms (Tableau, Looker)\n• Knowledge of e-commerce metrics and merchant analytics\n• Understanding of statistical analysis and hypothesis testing\n• Excellent communication and stakeholder management skills",
    responsibilities: "• Develop dashboards and reports for business stakeholders\n• Analyze merchant behavior and platform usage patterns\n• Support product teams with data insights and recommendations\n• Build data models for business intelligence and reporting\n• Conduct analysis for strategic initiatives and growth projects\n• Present findings to leadership and cross-functional teams",
    skills: ["SQL", "Business Intelligence", "Tableau", "Data Visualization", "Statistical Analysis", "E-commerce Analytics"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup and wellness stipends\n• Employee resource groups and community involvement",
    companyWebsite: "https://shopify.com/careers"
  },
  {
    title: "Research Scientist - Reinforcement Learning",
    companyName: "OpenAI",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 220000,
    maxSalary: 300000,
    description: "Advance the field of artificial intelligence through cutting-edge research in reinforcement learning. At OpenAI, you'll work on developing AI systems that can learn and adapt, contributing to our mission of ensuring artificial general intelligence benefits all of humanity.",
    requirements: "• PhD in Computer Science, Machine Learning, or related field\n• 3+ years of reinforcement learning research experience\n• Strong publication record in top-tier ML conferences\n• Proficiency in Python and deep learning frameworks\n• Experience with large-scale distributed training\n• Understanding of AI safety and alignment principles",
    responsibilities: "• Conduct cutting-edge research in reinforcement learning\n• Develop novel algorithms and training techniques\n• Collaborate on large-scale AI model development\n• Publish research findings in academic conferences\n• Contribute to AI safety and alignment initiatives\n• Mentor junior researchers and interns",
    skills: ["Reinforcement Learning", "Deep Learning", "AI Research", "Python", "Distributed Training", "AI Safety"],
    benefits: "• Top-tier compensation and equity package\n• Comprehensive health and wellness benefits\n• Research publication and conference support\n• Learning and development opportunities\n• AI research resources and computing access\n• Mission-driven work environment",
    companyWebsite: "https://openai.com/careers"
  },

  // ====== ADDITIONAL PRODUCT & DESIGN JOBS ======
  {
    title: "Senior Product Manager - Platform",
    companyName: "Stripe",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 270000,
    description: "Drive platform strategy at Stripe, building the economic infrastructure for the internet. You'll work on developer APIs, SDKs, and tools that enable millions of businesses to accept payments and manage their financial operations. Help us expand what's possible in internet commerce.",
    requirements: "• 5+ years of product management experience with platform products\n• Strong technical background and understanding of APIs\n• Experience with payments, fintech, or developer tools\n• Knowledge of platform ecosystems and developer experience\n• Data-driven approach to product decisions\n• Excellent communication and stakeholder management skills",
    responsibilities: "• Define platform product strategy and roadmap\n• Work with engineering teams to deliver developer tools and APIs\n• Gather feedback from developers and integrate partner requirements\n• Analyze platform usage metrics and developer adoption\n• Collaborate with business development on platform partnerships\n• Present platform vision to leadership and external stakeholders",
    skills: ["Platform Product Management", "Developer Tools", "APIs", "Fintech", "Technical Product Management", "Platform Strategy"],
    benefits: "• Industry-leading total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget ($3,000 annually)\n• Home office setup and commuter benefits\n• Annual company retreats and team offsites",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Principal Product Designer",
    companyName: "Airbnb",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 240000,
    description: "Lead design initiatives at Airbnb, creating experiences that help people belong anywhere. As a Principal Designer, you'll work on complex user experiences that span multiple touchpoints, from discovery and booking to hosting and travel experiences. Help us design a world where travel creates meaningful connections.",
    requirements: "• 7+ years of product design experience with leadership responsibilities\n• Strong portfolio showcasing complex, multi-platform design work\n• Experience with travel, marketplace, or platform products\n• Leadership experience and ability to influence cross-functional teams\n• Deep understanding of user research and design strategy\n• Experience with design systems and scaling design across products",
    responsibilities: "• Lead design strategy for major product initiatives\n• Set design vision and standards across product areas\n• Collaborate with executives and leadership on product direction\n• Mentor and guide design team members\n• Conduct user research and advocate for user needs\n• Present design work to stakeholders and represent design org",
    skills: ["Product Design Leadership", "Design Strategy", "User Research", "Design Systems", "Marketplace Design", "Cross-functional Leadership"],
    benefits: "• Competitive total compensation package\n• Annual Airbnb travel credit ($2,000 annually)\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and belonging initiatives",
    companyWebsite: "https://airbnb.com/careers"
  },
  {
    title: "Product Manager - AI",
    companyName: "Notion",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Drive AI product development at Notion, building intelligent features that help users organize and work more effectively. You'll work on AI-powered writing assistance, smart templates, and automation features that make Notion more helpful and productive for millions of users worldwide.",
    requirements: "• 5+ years of product management experience\n• Strong understanding of AI/ML technologies and applications\n• Experience with productivity tools or knowledge management\n• Knowledge of natural language processing and AI user experiences\n• Data-driven approach to product development\n• Experience with B2B and consumer product strategies",
    responsibilities: "• Define AI product strategy and roadmap for Notion\n• Work with ML engineers and researchers on AI feature development\n• Design user experiences for AI-powered productivity features\n• Analyze usage patterns and measure AI feature impact\n• Collaborate with design and engineering teams on implementation\n• Present AI initiatives to leadership and gather stakeholder feedback",
    skills: ["AI Product Management", "Machine Learning", "Productivity Tools", "User Experience", "Product Strategy", "Data Analysis"],
    benefits: "• Competitive salary and meaningful equity\n• Comprehensive health benefits and wellness stipend\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Premium productivity tools and equipment\n• Team retreats and company offsites",
    companyWebsite: "https://notion.so/careers"
  },
  {
    title: "Senior UX Researcher",
    companyName: "Pinterest",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Lead user research initiatives at Pinterest, the visual discovery platform that inspires billions of people worldwide. You'll conduct research that informs product decisions, validates design concepts, and helps us understand how people discover and save ideas for their projects and interests.",
    requirements: "• 5+ years of UX research experience\n• Strong background in qualitative and quantitative research methods\n• Experience with consumer internet products and social platforms\n• Knowledge of research tools and statistical analysis\n• Excellent communication and presentation skills\n• Experience with international and cross-cultural research",
    responsibilities: "• Lead end-to-end research for major product initiatives\n• Design and conduct user studies, surveys, and behavioral analysis\n• Synthesize research insights and present findings to stakeholders\n• Collaborate with product, design, and data science teams\n• Establish research best practices and methodologies\n• Mentor junior researchers and build research capabilities",
    skills: ["UX Research", "User Studies", "Statistical Analysis", "Research Methods", "Data Analysis", "International Research"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development programs\n• Home office setup and wellness stipends\n• Employee resource groups and inclusion initiatives",
    companyWebsite: "https://pinterest.com/careers"
  },

  // ====== ADDITIONAL SALES & MARKETING JOBS ======
  {
    title: "Account Executive - Enterprise",
    companyName: "Databricks",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Drive enterprise sales for Databricks' unified analytics platform. You'll work with Fortune 500 companies to help them harness the power of their data with our big data and machine learning solutions. Join our sales team to help organizations transform their data into competitive advantages.",
    requirements: "• 5+ years of enterprise B2B software sales experience\n• Track record of closing deals $1M+ annually\n• Experience selling to CTOs, CDOs, and technical decision makers\n• Knowledge of big data, analytics, or machine learning preferred\n• Strong presentation and negotiation skills\n• Bachelor's degree in Business or technical field",
    responsibilities: "• Manage full sales cycle for enterprise accounts ($2M+ deals)\n• Build relationships with C-level executives and data leaders\n• Conduct technical demonstrations with data science teams\n• Collaborate with solution engineers on proof-of-concepts\n• Negotiate enterprise contracts and multi-year agreements\n• Exceed annual sales quotas and revenue targets",
    skills: ["Enterprise Sales", "Big Data Sales", "Technical Sales", "Executive Relationships", "Contract Negotiation", "Salesforce"],
    benefits: "• Base salary plus uncapped commission (OTE $350K+)\n• Comprehensive health and wellness benefits\n• Sales incentive trips and recognition programs\n• Stock options and equity participation\n• Professional development and sales training\n• Flexible work arrangements and unlimited PTO",
    companyWebsite: "https://databricks.com/company/careers"
  },
  {
    title: "Growth Marketing Lead",
    companyName: "Discord",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Drive user acquisition and growth at Discord, where millions of people hang out every day. You'll work on campaigns that help communities discover Discord and grow their membership. Join our growth team to expand Discord's reach and help more people connect around shared interests.",
    requirements: "• 5+ years of growth marketing experience\n• Strong background in user acquisition and community growth\n• Experience with social media and community platforms\n• Knowledge of performance marketing and attribution modeling\n• Understanding of gaming and creator communities\n• Data-driven approach to marketing optimization",
    responsibilities: "• Develop user acquisition strategies across multiple channels\n• Launch community growth campaigns and viral features\n• Optimize conversion funnels and user onboarding\n• Analyze user behavior and identify growth opportunities\n• Collaborate with product, design, and data teams\n• Manage relationships with external marketing partners",
    skills: ["Growth Marketing", "Community Marketing", "User Acquisition", "Social Media", "Performance Marketing", "Analytics"],
    benefits: "• Competitive salary and equity package\n• Remote-first with flexible work arrangements\n• Comprehensive health and wellness benefits\n• Unlimited PTO and mental health days\n• Gaming equipment and community event stipends\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://discord.com/careers"
  },
  {
    title: "Content Marketing Lead",
    companyName: "Figma",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Lead content marketing at Figma, creating educational and inspirational content for the global design community. You'll develop content strategies that help designers learn, create, and collaborate better while showcasing Figma's capabilities and building our brand in the design industry.",
    requirements: "• 5+ years of content marketing experience\n• Strong background in design, creative, or developer tools\n• Excellent writing and storytelling skills\n• Experience with content strategy and editorial planning\n• Knowledge of design community and industry trends\n• Understanding of SEO and content performance analytics",
    responsibilities: "• Develop content strategy for design and developer audiences\n• Create educational content including tutorials, case studies, and guides\n• Manage editorial calendar and content production workflows\n• Collaborate with design team on visual storytelling\n• Build relationships with design influencers and community leaders\n• Measure content performance and optimize for engagement",
    skills: ["Content Strategy", "Design Marketing", "Technical Writing", "SEO", "Community Building", "Editorial Planning"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Premium design tools and latest equipment\n• Learning and development budget\n• Creative workspace and design community events",
    companyWebsite: "https://figma.com/careers"
  },

  // ====== ADDITIONAL OPERATIONS JOBS ======
  {
    title: "Head of Operations",
    companyName: "Stripe",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 220000,
    maxSalary: 300000,
    description: "Lead operations strategy at Stripe, the financial infrastructure for the internet. You'll oversee business operations, process optimization, and operational excellence initiatives that help Stripe scale globally while maintaining our high standards for reliability and customer experience.",
    requirements: "• 8+ years of operations management experience\n• Strong background in scaling high-growth technology companies\n• Experience with financial services or payments operations\n• Knowledge of process optimization and operational efficiency\n• Leadership experience managing large, cross-functional teams\n• MBA or equivalent advanced business education preferred",
    responsibilities: "• Develop and execute operations strategy across all business functions\n• Lead process optimization and operational efficiency initiatives\n• Manage cross-functional operations teams and programs\n• Ensure compliance with financial regulations and standards\n• Drive operational excellence in customer support and reliability\n• Present operational metrics and strategy to executive leadership",
    skills: ["Operations Leadership", "Process Optimization", "Financial Operations", "Strategic Planning", "Team Management", "Compliance"],
    benefits: "• Top-tier compensation and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Leadership development programs\n• Executive coaching and professional development\n• Annual company retreats and team offsites",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Vice President of Engineering",
    companyName: "Coinbase",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 300000,
    maxSalary: 400000,
    description: "Lead engineering organization at Coinbase, the leading cryptocurrency exchange. You'll oversee engineering strategy, technology roadmap, and team development for a platform that serves millions of customers worldwide. Help us build the cryptoeconomy and increase economic freedom globally.",
    requirements: "• 10+ years of engineering experience with 5+ years in leadership\n• Strong background in financial services, fintech, or high-scale systems\n• Experience managing large engineering organizations (100+ engineers)\n• Knowledge of cryptocurrency, blockchain, or financial technology\n• Proven track record of scaling engineering teams and technology\n• MBA or advanced technical degree preferred",
    responsibilities: "• Lead engineering strategy and technology roadmap\n• Manage engineering organization and VP-level direct reports\n• Drive engineering excellence and technical innovation\n• Collaborate with product and business leaders on company strategy\n• Ensure security, compliance, and scalability of platform\n• Represent engineering organization to board and investors",
    skills: ["Engineering Leadership", "Technology Strategy", "Team Scaling", "Fintech", "Security", "Executive Leadership"],
    benefits: "• Executive-level compensation and equity package\n• Comprehensive health and wellness benefits\n• Cryptocurrency learning and earning opportunities\n• Executive coaching and leadership development\n• Flexible work arrangements and unlimited PTO\n• Board meeting participation and strategy involvement",
    companyWebsite: "https://coinbase.com/careers"
  },

  // ====== MORE SOFTWARE ENGINEERING JOBS ======
  {
    title: "Senior Backend Engineer",
    companyName: "Elastic",
    location: "Remote",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 230000,
    description: "Build search and analytics solutions at Elastic, makers of Elasticsearch, Kibana, and the Elastic Stack. Work on distributed search systems that power mission-critical applications for thousands of organizations worldwide. Help make data usable in real time.",
    requirements: "• 5+ years of backend development experience\n• Strong proficiency in Java and distributed systems\n• Experience with Elasticsearch or other search technologies\n• Knowledge of performance optimization and scalability\n• Understanding of data processing and indexing\n• Experience with cloud platforms and microservices",
    responsibilities: "• Develop core Elasticsearch features and optimizations\n• Work on distributed indexing and query processing\n• Build APIs and integrations for the Elastic ecosystem\n• Optimize performance for large-scale deployments\n• Collaborate with open source community\n• Support customer implementations and use cases",
    skills: ["Java", "Elasticsearch", "Distributed Systems", "Search", "Performance Optimization", "Open Source"],
    benefits: "• Fully distributed company with flexible work\n• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Open source contribution time\n• Annual company meetups",
    companyWebsite: "https://elastic.co/about/careers"
  },
  {
    title: "Frontend Engineer",
    companyName: "JetBrains",
    location: "Prague, Czech Republic",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 85000,
    maxSalary: 125000,
    description: "Build developer tools that millions of programmers use every day. At JetBrains, you'll work on IDEs like IntelliJ IDEA, WebStorm, and PyCharm, creating interfaces that help developers be more productive and write better code.",
    requirements: "• 3+ years of frontend development experience\n• Strong proficiency in JavaScript/TypeScript and modern frameworks\n• Experience with desktop application development\n• Knowledge of developer tools and IDE functionality\n• Understanding of code analysis and language processing\n• Experience with cross-platform development",
    responsibilities: "• Develop user interfaces for JetBrains IDEs\n• Work on code editor features and developer productivity tools\n• Build plugin systems and extensibility frameworks\n• Optimize performance for large codebases\n• Collaborate with language and analysis teams\n• Support developer community and plugin ecosystem",
    skills: ["JavaScript", "TypeScript", "Desktop Development", "Developer Tools", "Code Analysis", "Plugin Systems"],
    benefits: "• Remote-first culture with flexible hours\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• JetBrains tools licenses and development resources\n• Learning and conference attendance budget\n• Employee relocation assistance",
    companyWebsite: "https://jetbrains.com/careers"
  },
  {
    title: "DevOps Engineer",
    companyName: "Redis Labs",
    location: "Mountain View, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 125000,
    maxSalary: 165000,
    description: "Build and maintain the infrastructure for Redis Enterprise and Redis Cloud. Work on systems that provide sub-millisecond latency for mission-critical applications used by thousands of companies worldwide.",
    requirements: "• 3+ years of DevOps or infrastructure experience\n• Strong experience with Redis and in-memory databases\n• Knowledge of container orchestration (Kubernetes, Docker)\n• Experience with cloud platforms (AWS, GCP, Azure)\n• Understanding of high-availability and disaster recovery\n• Proficiency in scripting and automation (Python, Bash)",
    responsibilities: "• Build and maintain Redis Cloud infrastructure\n• Implement monitoring and alerting for database clusters\n• Automate deployment and scaling operations\n• Ensure high availability and disaster recovery\n• Optimize performance for low-latency workloads\n• Support customer deployments and troubleshooting",
    skills: ["Redis", "Kubernetes", "DevOps", "Cloud Infrastructure", "Monitoring", "High Availability"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements\n• Learning and development budget\n• Redis certification programs\n• Employee stock purchase plan",
    companyWebsite: "https://redis.com/careers"
  },
  {
    title: "Mobile Engineer (React Native)",
    companyName: "Shopify",
    location: "Toronto, Canada",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 105000,
    maxSalary: 145000,
    description: "Build mobile commerce experiences that help millions of merchants sell their products. At Shopify, you'll work on mobile apps for merchants and consumers, creating tools that make commerce better for everyone.",
    requirements: "• 3+ years of mobile development experience\n• Strong proficiency in React Native\n• Experience with iOS and Android development\n• Knowledge of e-commerce and payment systems\n• Understanding of offline capabilities and performance optimization\n• Experience with mobile testing and deployment",
    responsibilities: "• Develop Shopify's mobile applications for merchants and consumers\n• Build e-commerce features and payment integrations\n• Optimize app performance and user experience\n• Implement offline capabilities and data synchronization\n• Work on push notifications and background processing\n• Collaborate with design and backend teams",
    skills: ["React Native", "iOS", "Android", "E-commerce", "Payment Systems", "Mobile Optimization"],
    benefits: "• Remote-first culture with flexible arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup allowance\n• Employee resource groups",
    companyWebsite: "https://shopify.com/careers"
  },
  {
    title: "Staff Software Engineer - Platform",
    companyName: "Confluent",
    location: "Palo Alto, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 210000,
    maxSalary: 280000,
    description: "Lead platform engineering at Confluent, building the data streaming platform based on Apache Kafka. Work on systems that handle trillions of events daily for companies worldwide, enabling real-time data processing at massive scale.",
    requirements: "• 7+ years of distributed systems engineering experience\n• Deep expertise in Apache Kafka and stream processing\n• Strong proficiency in Java, Scala, or similar languages\n• Experience with cloud platforms and microservices\n• Leadership experience and ability to influence technical direction\n• Understanding of data processing and event-driven architectures",
    responsibilities: "• Lead technical initiatives for Confluent Cloud platform\n• Architect scalable streaming data infrastructure\n• Drive performance optimization and reliability improvements\n• Mentor senior engineers and establish technical standards\n• Collaborate with product teams on platform roadmap\n• Represent Confluent in Apache Kafka community",
    skills: ["Apache Kafka", "Distributed Systems", "Java", "Scala", "Stream Processing", "Technical Leadership"],
    benefits: "• Industry-leading compensation and equity\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Conference speaking and Apache Kafka contributions\n• Stock options and performance bonuses",
    companyWebsite: "https://confluent.io/careers"
  },

  // ====== MORE DATA & AI JOBS ======
  {
    title: "Senior Data Scientist - Personalization",
    companyName: "Spotify",
    location: "Stockholm, Sweden",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Shape music discovery at Spotify by building personalization algorithms that help users discover their next favorite song. Work on recommendation systems, playlist generation, and audio analysis that powers the world's largest music streaming platform.",
    requirements: "• 5+ years of data science experience in personalization\n• Strong proficiency in Python, TensorFlow, or PyTorch\n• Experience with recommendation systems and collaborative filtering\n• Knowledge of audio processing and music information retrieval\n• Understanding of large-scale machine learning systems\n• Experience with A/B testing and experimental design",
    responsibilities: "• Develop recommendation algorithms for music and podcast discovery\n• Build personalization models for playlists and radio stations\n• Work on audio analysis and content understanding\n• Design and analyze experiments to improve user experience\n• Collaborate with product and engineering teams\n• Research new techniques in music recommendation",
    skills: ["Machine Learning", "Recommendation Systems", "Audio Processing", "Python", "TensorFlow", "Music Technology"],
    benefits: "• Competitive salary and equity package\n• Spotify Premium and music industry perks\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Music creation tools and studio access\n• Employee concerts and music festivals",
    companyWebsite: "https://spotify.com/careers"
  },
  {
    title: "ML Engineer - Computer Vision",
    companyName: "Uber",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 235000,
    description: "Build computer vision systems for Uber's autonomous vehicle and delivery platforms. Work on perception, mapping, and safety systems that help millions of rides and deliveries happen safely every day.",
    requirements: "• 5+ years of machine learning engineering experience\n• Strong background in computer vision and deep learning\n• Proficiency in Python, PyTorch, or TensorFlow\n• Experience with autonomous systems or robotics\n• Knowledge of real-time processing and edge deployment\n• Understanding of safety-critical system development",
    responsibilities: "• Develop computer vision models for autonomous vehicles\n• Work on object detection, tracking, and scene understanding\n• Build mapping and localization systems\n• Optimize models for real-time inference\n• Collaborate with safety and platform teams\n• Research advances in autonomous driving perception",
    skills: ["Computer Vision", "Deep Learning", "Autonomous Vehicles", "PyTorch", "Real-time Systems", "Safety Engineering"],
    benefits: "• Competitive total compensation package\n• Uber credits and transportation benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups",
    companyWebsite: "https://uber.com/careers"
  },
  {
    title: "Data Engineer - Real-time Analytics",
    companyName: "Twitch",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Build real-time analytics systems that power live streaming experiences for millions of creators and viewers. Work on data infrastructure that processes billions of events and enables real-time insights for the gaming and creator economy.",
    requirements: "• 3+ years of data engineering experience\n• Strong proficiency in Python, Java, or Scala\n• Experience with streaming platforms (Kafka, Kinesis, Pulsar)\n• Knowledge of real-time processing frameworks (Flink, Storm)\n• Understanding of time-series data and analytics\n• Experience with AWS and distributed systems",
    responsibilities: "• Build real-time streaming data pipelines\n• Work on analytics for live video and chat systems\n• Develop metrics and monitoring for creator economy\n• Optimize data processing for low-latency requirements\n• Collaborate with product and data science teams\n• Support real-time features and recommendations",
    skills: ["Streaming Data", "Real-time Analytics", "Apache Kafka", "Python", "AWS", "Time-series Data"],
    benefits: "• Competitive salary and equity package\n• Twitch Prime and gaming benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Gaming equipment allowance\n• Employee gaming tournaments and events",
    companyWebsite: "https://twitch.tv/jobs"
  },
  {
    title: "Senior ML Engineer",
    companyName: "Lyft",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Build machine learning systems that optimize ridesharing and transportation at Lyft. Work on demand prediction, route optimization, and pricing algorithms that help millions of riders and drivers connect efficiently.",
    requirements: "• 5+ years of ML engineering experience\n• Strong proficiency in Python and ML frameworks\n• Experience with large-scale distributed systems\n• Knowledge of optimization and operations research\n• Understanding of geospatial data and mapping\n• Experience with real-time prediction systems",
    responsibilities: "• Develop demand forecasting and supply optimization models\n• Work on dynamic pricing and route optimization algorithms\n• Build real-time matching systems for riders and drivers\n• Optimize ML models for latency and throughput\n• Collaborate with product and operations teams\n• Research advances in transportation and logistics",
    skills: ["Machine Learning", "Optimization", "Geospatial Data", "Python", "Distributed Systems", "Real-time Processing"],
    benefits: "• Competitive salary and equity package\n• Lyft ride credits and transportation benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://lyft.com/careers"
  },
  {
    title: "Applied Research Scientist",
    companyName: "Adobe",
    location: "San Jose, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 240000,
    description: "Advance the state of AI in creative tools at Adobe. Work on computer vision, generative models, and creative AI that helps millions of designers, photographers, and content creators bring their ideas to life.",
    requirements: "• PhD in Computer Science, ML, or related field\n• 3+ years of AI research experience in industry\n• Strong background in computer vision or generative models\n• Proficiency in Python and deep learning frameworks\n• Experience with creative tools and digital media\n• Publication record in top-tier AI conferences",
    responsibilities: "• Research AI techniques for creative applications\n• Develop generative models for image and video creation\n• Work on computer vision for photo and design tools\n• Collaborate with product teams on AI feature integration\n• Publish research and represent Adobe at conferences\n• Mentor junior researchers and establish research directions",
    skills: ["AI Research", "Computer Vision", "Generative Models", "Creative Technology", "Deep Learning", "Digital Media"],
    benefits: "• Competitive total compensation package\n• Adobe Creative Cloud and product access\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Research publication and conference support\n• Employee creative challenges and showcases",
    companyWebsite: "https://adobe.com/careers"
  },

  // ====== MORE PRODUCT & DESIGN JOBS ======
  {
    title: "Senior Product Manager - Growth",
    companyName: "Pinterest",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 210000,
    description: "Drive growth initiatives at Pinterest, the visual discovery platform that inspires billions of people worldwide. Lead product strategies that help users discover ideas and inspire their projects while building a thriving creator and advertiser ecosystem.",
    requirements: "• 5+ years of product management experience with focus on growth\n• Strong background in consumer internet and social platforms\n• Experience with recommendation systems and content discovery\n• Data-driven approach to product development and experimentation\n• Knowledge of advertising and monetization strategies\n• Excellent communication and leadership skills",
    responsibilities: "• Define growth strategy for user acquisition and engagement\n• Work on content discovery and recommendation features\n• Drive initiatives for creator and advertiser growth\n• Analyze user behavior and optimize conversion funnels\n• Collaborate with engineering, design, and data science teams\n• Present growth metrics and strategy to executive leadership",
    skills: ["Growth Product Management", "Consumer Internet", "Recommendation Systems", "A/B Testing", "Creator Economy", "Data Analysis"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development programs\n• Employee resource groups and inclusion initiatives\n• Pinterest credits and creative tools access",
    companyWebsite: "https://pinterest.com/careers"
  },
  {
    title: "Principal UX Designer",
    companyName: "Slack",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 235000,
    description: "Lead UX design at Slack, the digital headquarters for teams worldwide. Design experiences that help people work better together, from messaging and file sharing to workflow automation and enterprise integrations.",
    requirements: "• 7+ years of UX design experience with leadership responsibilities\n• Strong portfolio showcasing complex B2B product design\n• Experience with collaboration tools and enterprise software\n• Knowledge of design systems and cross-platform consistency\n• Leadership experience and ability to influence product strategy\n• Understanding of accessibility and international design considerations",
    responsibilities: "• Lead UX strategy for major Slack features and initiatives\n• Design collaboration experiences for teams and enterprises\n• Establish design principles and maintain design system consistency\n• Collaborate with product and engineering on technical feasibility\n• Conduct user research and usability testing\n• Mentor design team and represent design organization",
    skills: ["UX Design Leadership", "B2B Product Design", "Design Systems", "Collaboration Tools", "User Research", "Enterprise Software"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Professional development and leadership training\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://slack.com/careers"
  },
  {
    title: "Product Manager - API Platform",
    companyName: "Twilio",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 155000,
    maxSalary: 200000,
    description: "Drive API platform strategy at Twilio, the leading communications platform. Build developer tools and APIs that enable millions of developers to integrate voice, messaging, and video into their applications.",
    requirements: "• 5+ years of product management experience with developer platforms\n• Strong technical background and understanding of APIs\n• Experience with communications or infrastructure products\n• Knowledge of developer ecosystems and API design\n• Data-driven approach to product decisions\n• Excellent technical communication skills",
    responsibilities: "• Define API platform product strategy and roadmap\n• Work with engineering teams to deliver developer tools\n• Gather feedback from developer community and enterprise customers\n• Analyze API usage metrics and developer adoption\n• Collaborate with developer relations and marketing teams\n• Present platform vision to leadership and external stakeholders",
    skills: ["API Product Management", "Developer Platforms", "Communications APIs", "Technical Product Management", "Developer Experience", "B2B SaaS"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development programs\n• Twilio.org volunteer time and charitable giving\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://twilio.com/company/jobs"
  },
  {
    title: "Senior Product Designer",
    companyName: "Discord",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Design experiences that bring people together on Discord. Work on features that help millions of people communicate, play games, and build communities around shared interests. Help us create a platform where everyone can find their people.",
    requirements: "• 5+ years of product design experience\n• Strong portfolio showcasing social and community products\n• Experience with gaming, voice chat, or real-time communication\n• Knowledge of accessibility and inclusive design practices\n• Understanding of community dynamics and social features\n• Experience with design systems and component libraries",
    responsibilities: "• Design social features and community building tools\n• Work on voice and video communication experiences\n• Create gaming integrations and activity features\n• Collaborate with product managers and engineers\n• Conduct user research with gamers and community leaders\n• Contribute to Discord's design system and visual identity",
    skills: ["Product Design", "Social Products", "Community Design", "Voice/Video UX", "Gaming", "Design Systems"],
    benefits: "• Competitive salary and equity package\n• Remote-first with flexible work arrangements\n• Comprehensive health and wellness benefits\n• Unlimited PTO and mental health days\n• Gaming equipment and community event budgets\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://discord.com/careers"
  },

  // ====== MORE SALES & MARKETING JOBS ======
  {
    title: "Enterprise Account Executive",
    companyName: "Snowflake",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Drive enterprise sales for Snowflake's cloud data platform in the financial services sector. Work with Fortune 500 companies to transform their data and analytics capabilities with our innovative cloud architecture.",
    requirements: "• 5+ years of enterprise software sales experience\n• Track record of closing deals $1M+ annually in financial services\n• Experience selling to C-level executives and technical stakeholders\n• Knowledge of data, analytics, or cloud infrastructure\n• Strong presentation and relationship building skills\n• Bachelor's degree in Business or technical field",
    responsibilities: "• Manage enterprise accounts in financial services sector\n• Build relationships with C-level executives and data leaders\n• Conduct technical demonstrations and proof-of-concepts\n• Collaborate with solutions engineers on customer implementations\n• Negotiate multi-year enterprise agreements\n• Exceed annual sales quotas ($5M+ territory)",
    skills: ["Enterprise Sales", "Financial Services", "Data Analytics Sales", "Executive Relationships", "Technical Sales", "Cloud Platforms"],
    benefits: "• Base salary plus uncapped commission (OTE $400K+)\n• Comprehensive health and wellness benefits\n• Sales incentive trips and President's Club recognition\n• Stock options and equity participation\n• Professional development and sales training\n• Flexible work arrangements and expense account",
    companyWebsite: "https://snowflake.com/careers"
  },
  {
    title: "Growth Marketing Manager",
    companyName: "Robinhood",
    location: "Menlo Park, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Drive user acquisition and growth at Robinhood, democratizing access to financial markets. Work on campaigns that help first-time investors discover commission-free trading while building financial literacy and confidence.",
    requirements: "• 3+ years of growth marketing experience\n• Strong background in fintech or financial services marketing\n• Experience with performance marketing and paid acquisition\n• Knowledge of financial regulations and compliance requirements\n• Understanding of user acquisition funnels and lifecycle marketing\n• Data-driven approach to campaign optimization",
    responsibilities: "• Develop user acquisition strategies across digital channels\n• Launch educational campaigns about investing and financial literacy\n• Optimize conversion funnels and onboarding experiences\n• Analyze campaign performance and user behavior data\n• Collaborate with product, design, and compliance teams\n• Manage relationships with advertising partners and agencies",
    skills: ["Growth Marketing", "Fintech Marketing", "User Acquisition", "Financial Services", "Performance Marketing", "Compliance"],
    benefits: "• Competitive salary and equity package\n• Commission-free trading and investment accounts\n• Comprehensive health and financial wellness benefits\n• Learning and development opportunities\n• Financial planning resources and 401(k) matching\n• Employee stock purchase program",
    companyWebsite: "https://robinhood.com/careers"
  },
  {
    title: "Sales Engineer",
    companyName: "MongoDB",
    location: "Austin, TX",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Bridge technology and business value at MongoDB, the leading modern database platform. Help enterprise customers understand how MongoDB can solve their data challenges and modernize their applications.",
    requirements: "• 3+ years of technical sales or solutions engineering experience\n• Strong background in databases, cloud platforms, or software architecture\n• Experience with MongoDB or other NoSQL databases preferred\n• Knowledge of application development and data modeling\n• Excellent presentation and customer-facing skills\n• Technical degree in Computer Science or Engineering",
    responsibilities: "• Conduct technical product demonstrations and workshops\n• Design database solutions for enterprise customer use cases\n• Support sales team throughout technical evaluation process\n• Lead proof-of-concept implementations and migrations\n• Create technical content and solution documentation\n• Provide customer feedback to product and engineering teams",
    skills: ["Technical Sales", "MongoDB", "Database Design", "Solution Architecture", "Enterprise Sales", "Cloud Platforms"],
    benefits: "• Competitive salary plus commission and equity\n• Comprehensive health and wellness benefits\n• MongoDB certification and training programs\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://mongodb.com/careers"
  },
  {
    title: "Digital Marketing Manager",
    companyName: "Peloton",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 150000,
    description: "Drive digital marketing initiatives at Peloton, the global fitness technology company. Create campaigns that inspire people to achieve their fitness goals through our connected fitness experiences and community.",
    requirements: "• 3+ years of digital marketing experience\n• Strong background in fitness, wellness, or lifestyle brands\n• Experience with performance marketing and social advertising\n• Knowledge of influencer marketing and community building\n• Understanding of subscription business models\n• Creative mindset with strong analytical skills",
    responsibilities: "• Develop digital marketing campaigns for Peloton products and services\n• Manage social media advertising and influencer partnerships\n• Create content marketing strategies for fitness and wellness\n• Optimize campaigns for member acquisition and retention\n• Analyze campaign performance and member engagement metrics\n• Collaborate with content, design, and product teams",
    skills: ["Digital Marketing", "Fitness Marketing", "Social Media", "Influencer Marketing", "Content Strategy", "Performance Marketing"],
    benefits: "• Competitive salary and performance bonuses\n• Complimentary Peloton membership and equipment\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee fitness challenges and wellness programs",
    companyWebsite: "https://onepeloton.com/careers"
  },

  // ====== MORE OPERATIONS JOBS ======
  {
    title: "Senior Operations Manager",
    companyName: "Instacart",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Lead operations initiatives at Instacart, optimizing the grocery marketplace that connects millions of customers with personal shoppers. Work on logistics, quality, and efficiency improvements that make grocery delivery faster and more reliable.",
    requirements: "• 5+ years of operations management experience\n• Strong background in marketplace or logistics operations\n• Experience with supply chain optimization and demand forecasting\n• Knowledge of quality management and process improvement\n• Data-driven approach to operations optimization\n• Leadership experience managing cross-functional teams",
    responsibilities: "• Optimize marketplace operations for efficiency and quality\n• Lead initiatives to improve shopper experience and retention\n• Work on demand forecasting and supply chain optimization\n• Manage quality programs and customer satisfaction metrics\n• Collaborate with product, engineering, and business teams\n• Drive operational improvements across multiple markets",
    skills: ["Operations Management", "Marketplace Operations", "Supply Chain", "Quality Management", "Process Improvement", "Data Analysis"],
    benefits: "• Competitive salary and equity package\n• Instacart+ membership and grocery delivery credits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://instacart.com/careers"
  },
  {
    title: "Chief of Staff",
    companyName: "Figma",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 240000,
    description: "Support executive leadership at Figma, the collaborative design platform. Work directly with the CEO and leadership team on strategic initiatives, operational excellence, and company growth as we scale our impact on the design industry.",
    requirements: "• 5+ years of strategy, operations, or chief of staff experience\n• Strong background in high-growth technology companies\n• Experience with strategic planning and executive support\n• Excellent communication and project management skills\n• Knowledge of design tools or creative industry preferred\n• MBA or equivalent business experience",
    responsibilities: "• Support CEO and executive team on strategic initiatives\n• Manage special projects and cross-functional programs\n• Facilitate leadership meetings and strategic planning sessions\n• Analyze business performance and market opportunities\n• Coordinate between different business functions and teams\n• Represent leadership in internal and external meetings",
    skills: ["Executive Support", "Strategic Planning", "Project Management", "Business Analysis", "Cross-functional Leadership", "Operations"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Premium design tools and latest equipment\n• Learning and development budget\n• Executive coaching and leadership development",
    companyWebsite: "https://figma.com/careers"
  },
  {
    title: "Customer Success Director",
    companyName: "Zoom",
    location: "San Jose, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 160000,
    maxSalary: 220000,
    description: "Lead customer success at Zoom, ensuring enterprise customers achieve maximum value from our communications platform. Build and manage customer success programs that drive adoption, expansion, and renewal for our largest accounts.",
    requirements: "• 7+ years of customer success or account management experience\n• Strong background in enterprise software and B2B SaaS\n• Experience managing large customer success teams\n• Knowledge of video communications or collaboration tools\n• Data-driven approach to customer health and success metrics\n• Leadership experience and executive communication skills",
    responsibilities: "• Lead enterprise customer success organization and strategy\n• Manage customer success managers and account teams\n• Drive customer adoption, expansion, and renewal programs\n• Establish customer health metrics and success frameworks\n• Collaborate with sales, product, and support teams\n• Present customer insights and metrics to executive leadership",
    skills: ["Customer Success Leadership", "Enterprise Software", "Team Management", "B2B SaaS", "Account Expansion", "Executive Communication"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Leadership development and executive coaching\n• Zoom communication tools and latest technology\n• Employee resource groups and professional development",
    companyWebsite: "https://zoom.com/careers"
  },
  {
    title: "Finance Director",
    companyName: "DoorDash",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 230000,
    description: "Lead financial planning and analysis at DoorDash, supporting our mission to empower local economies. Work on financial strategy, forecasting, and business performance analysis for our rapidly growing marketplace.",
    requirements: "• 7+ years of finance experience with leadership responsibilities\n• Strong background in FP&A and financial modeling\n• Experience with marketplace or technology company finance\n• Knowledge of unit economics and business metrics\n• Leadership experience managing finance teams\n• MBA or CPA preferred",
    responsibilities: "• Lead financial planning and analysis for business units\n• Develop financial models and forecasts for strategic initiatives\n• Manage annual budgeting and quarterly planning processes\n• Analyze business performance and provide insights to leadership\n• Support M&A activities and investment decisions\n• Lead finance team and establish financial processes",
    skills: ["Financial Planning & Analysis", "Financial Modeling", "Marketplace Finance", "Team Leadership", "Strategic Finance", "Business Analytics"],
    benefits: "• Competitive salary and equity package\n• DashPass subscription and meal allowances\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://doordash.com/careers"
  },
  {
    title: "VP of People",
    companyName: "Canva",
    location: "Sydney, Australia",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 250000,
    description: "Lead people strategy at Canva, empowering the world to design while building an inclusive and high-performing global team. Drive people initiatives that support our mission and help team members thrive in a creative, collaborative environment.",
    requirements: "• 8+ years of HR leadership experience\n• Strong background in scaling global technology companies\n• Experience with diversity, equity, and inclusion initiatives\n• Knowledge of international employment law and global HR\n• Leadership experience managing large people operations teams\n• Understanding of creative industries and design culture",
    responsibilities: "• Lead people strategy and organizational development\n• Manage global people operations and HR teams\n• Drive diversity, equity, and inclusion initiatives\n• Develop talent management and leadership development programs\n• Ensure compliance with international employment regulations\n• Partner with executives on people strategy and culture",
    skills: ["People Leadership", "Global HR", "Diversity & Inclusion", "Organizational Development", "Talent Management", "Employment Law"],
    benefits: "• Competitive total compensation package\n• Canva Pro subscription and design resources\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and generous leave policies\n• Learning and development budget\n• Employee resource groups and volunteer programs",
    companyWebsite: "https://canva.com/careers"
  },

  // ====== ADDITIONAL HIGH-LEVEL POSITIONS ======
  {
    title: "Engineering Director",
    companyName: "Stripe",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 250000,
    maxSalary: 350000,
    description: "Lead engineering teams at Stripe, building the economic infrastructure for the internet. Drive technical strategy and team development for payment systems that process hundreds of billions in transactions annually.",
    requirements: "• 8+ years of engineering experience with 3+ years in leadership\n• Strong background in distributed systems and financial technology\n• Experience managing multiple engineering teams (50+ engineers)\n• Knowledge of payment systems, fintech, or financial services\n• Proven track record of scaling engineering organizations\n• Excellent technical and people leadership skills",
    responsibilities: "• Lead engineering organization for key product areas\n• Drive technical roadmap and architecture decisions\n• Manage engineering managers and senior technical leaders\n• Collaborate with product and business teams on strategy\n• Ensure engineering excellence and system reliability\n• Represent engineering in executive leadership meetings",
    skills: ["Engineering Leadership", "Distributed Systems", "Fintech", "Team Scaling", "Technical Strategy", "Executive Leadership"],
    benefits: "• Top-tier total compensation package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Executive coaching and leadership development\n• Equity participation and performance bonuses\n• Annual company retreats and team offsites",
    companyWebsite: "https://stripe.com/jobs"
  },
  {
    title: "Principal Data Scientist",
    companyName: "Airbnb",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 200000,
    maxSalary: 280000,
    description: "Lead data science initiatives at Airbnb, using data to improve experiences for millions of hosts and guests worldwide. Work on search ranking, pricing optimization, and trust & safety systems that power our global marketplace.",
    requirements: "• 7+ years of data science experience with leadership responsibilities\n• PhD or Masters in Statistics, Computer Science, or related field\n• Expert knowledge of machine learning and statistical modeling\n• Experience with marketplace or two-sided platform data science\n• Strong proficiency in Python, R, and big data technologies\n• Leadership experience and ability to influence product strategy",
    responsibilities: "• Lead data science strategy for key product areas\n• Develop machine learning models for search, pricing, and recommendations\n• Mentor data scientists and establish best practices\n• Collaborate with product and engineering teams on data-driven features\n• Present insights and recommendations to executive leadership\n• Drive data science research and methodological innovations",
    skills: ["Data Science Leadership", "Machine Learning", "Marketplace Analytics", "Statistical Modeling", "Python", "Big Data"],
    benefits: "• Competitive total compensation package\n• Annual Airbnb travel credit ($2,000 annually)\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and belonging initiatives",
    companyWebsite: "https://airbnb.com/careers"
  },
  {
    title: "Head of Product",
    companyName: "Discord",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 220000,
    maxSalary: 320000,
    description: "Lead product strategy at Discord, where millions of people hang out every day. Drive product vision for communities, communication, and social features that bring people together around shared interests and activities.",
    requirements: "• 8+ years of product management experience with leadership role\n• Strong background in social platforms, gaming, or community products\n• Experience managing large product management teams\n• Knowledge of real-time communication and social features\n• Data-driven approach to product strategy and user research\n• Excellent communication and executive presence",
    responsibilities: "• Lead product organization and strategy for Discord platform\n• Manage product managers and drive product roadmap\n• Define product vision for community and social features\n• Collaborate with engineering, design, and business teams\n• Analyze user behavior and community dynamics\n• Present product strategy to board and executive leadership",
    skills: ["Product Leadership", "Social Products", "Community Platforms", "Gaming", "Product Strategy", "Team Management"],
    benefits: "• Competitive total compensation package\n• Remote-first with flexible work arrangements\n• Comprehensive health and wellness benefits\n• Unlimited PTO and mental health days\n• Gaming equipment and community event budgets\n• Employee resource groups and inclusion programs",
    companyWebsite: "https://discord.com/careers"
  },

  // ====== FINAL BATCH - MORE JOBS TO REACH 200+ ======
  {
    title: "Software Engineer - Backend",
    companyName: "Warby Parker",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Build the technology that's transforming the eyewear industry at Warby Parker. Work on e-commerce platforms, inventory management, and customer experience systems that help people see better and look great. Join our team to make vision care accessible and affordable for everyone.",
    requirements: "• 3+ years of backend development experience\n• Strong proficiency in Python, Ruby, or similar languages\n• Experience with e-commerce and retail technology\n• Knowledge of payment processing and inventory systems\n• Understanding of database design and optimization\n• Experience with REST APIs and microservices",
    responsibilities: "• Develop e-commerce backend systems and APIs\n• Work on inventory management and supply chain technology\n• Build customer experience and recommendation features\n• Optimize payment processing and checkout flows\n• Collaborate with product and design teams\n• Maintain high-availability retail systems",
    skills: ["Python", "Ruby", "E-commerce", "Payment Processing", "Inventory Management", "REST APIs"],
    benefits: "• Competitive salary and performance bonuses\n• Comprehensive health and vision benefits\n• Free eyewear and employee discounts\n• Flexible work arrangements and generous PTO\n• Professional development opportunities\n• Employee volunteer programs",
    companyWebsite: "https://warbyparker.com/careers"
  },
  {
    title: "Data Scientist - Marketing",
    companyName: "Casper",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 115000,
    maxSalary: 155000,
    description: "Use data science to improve sleep and transform the mattress industry at Casper. Work on customer segmentation, marketing attribution, and product optimization that helps people get better rest. Join our data team to make sleep accessible to everyone.",
    requirements: "• 3+ years of data science experience\n• Strong proficiency in Python, R, and SQL\n• Experience with marketing analytics and attribution modeling\n• Knowledge of customer segmentation and lifetime value\n• Understanding of A/B testing and statistical analysis\n• Experience with e-commerce and consumer products",
    responsibilities: "• Analyze customer behavior and purchase patterns\n• Build marketing attribution and ROI models\n• Work on product optimization and recommendation systems\n• Design and analyze A/B tests for marketing campaigns\n• Collaborate with marketing and product teams\n• Create dashboards and reports for business stakeholders",
    skills: ["Python", "R", "Marketing Analytics", "Customer Segmentation", "A/B Testing", "E-commerce Analytics"],
    benefits: "• Competitive salary and performance bonuses\n• Casper products and sleep wellness benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and generous PTO\n• Learning and development opportunities\n• Employee sleep health programs",
    companyWebsite: "https://casper.com/careers"
  },
  {
    title: "Product Manager - Sustainability",
    companyName: "Allbirds",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Drive sustainability initiatives at Allbirds, the sustainable footwear company that's better for your feet and the planet. Work on product features, supply chain transparency, and environmental impact measurement that help build a more sustainable future.",
    requirements: "• 3+ years of product management experience\n• Strong background in sustainability or environmental technology\n• Experience with supply chain and manufacturing processes\n• Knowledge of sustainable materials and product development\n• Understanding of carbon footprint and lifecycle assessment\n• Passion for environmental impact and climate change",
    responsibilities: "• Define product strategy for sustainability initiatives\n• Work on supply chain transparency and traceability features\n• Build carbon footprint tracking and reporting tools\n• Collaborate with sustainability and operations teams\n• Analyze environmental impact metrics and reporting\n• Drive sustainable product innovation and development",
    skills: ["Product Management", "Sustainability", "Supply Chain", "Environmental Impact", "Carbon Footprint", "Sustainable Materials"],
    benefits: "• Competitive salary and equity package\n• Allbirds products and sustainable living stipends\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Professional development and conference attendance\n• Environmental impact and volunteer programs",
    companyWebsite: "https://allbirds.com/pages/careers"
  },
  {
    title: "Frontend Engineer - Mobile Web",
    companyName: "Uber",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Build mobile web experiences that connect millions of riders with drivers worldwide. At Uber, you'll work on responsive web applications that work seamlessly across devices, helping people get rides, order food, and access transportation when they need it most.",
    requirements: "• 3+ years of frontend development experience\n• Strong proficiency in React and modern JavaScript\n• Experience with mobile-first and responsive design\n• Knowledge of performance optimization for mobile web\n• Understanding of geolocation and mapping APIs\n• Experience with real-time features and WebSocket",
    responsibilities: "• Develop mobile web applications for Uber's rider platform\n• Build responsive interfaces that work across all devices\n• Optimize web performance for mobile networks and devices\n• Implement real-time tracking and location features\n• Collaborate with design and backend teams\n• Work on A/B testing and conversion optimization",
    skills: ["React", "Mobile Web", "Responsive Design", "Performance Optimization", "Geolocation APIs", "Real-time Features"],
    benefits: "• Competitive salary and equity package\n• Uber credits for rides and food delivery\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee transportation benefits",
    companyWebsite: "https://uber.com/careers"
  },
  {
    title: "DevOps Engineer - Infrastructure",
    companyName: "Lyft",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 155000,
    maxSalary: 205000,
    description: "Build and maintain the infrastructure that powers Lyft's ridesharing platform. Work on systems that handle millions of rides daily, ensuring high availability and performance for our drivers and passengers worldwide.",
    requirements: "• 5+ years of DevOps or infrastructure experience\n• Strong experience with AWS and cloud infrastructure\n• Knowledge of Kubernetes and container orchestration\n• Experience with monitoring and observability tools\n• Understanding of high-availability and disaster recovery\n• Proficiency in Python, Go, or similar languages",
    responsibilities: "• Build and maintain cloud infrastructure for ridesharing platform\n• Implement CI/CD pipelines and deployment automation\n• Monitor system performance and reliability metrics\n• Ensure high availability for mission-critical services\n• Collaborate with engineering teams on infrastructure needs\n• Support incident response and system reliability",
    skills: ["AWS", "Kubernetes", "DevOps", "Infrastructure", "Monitoring", "High Availability"],
    benefits: "• Competitive salary and equity package\n• Lyft ride credits and transportation benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://lyft.com/careers"
  },
  {
    title: "ML Engineer - Fraud Detection",
    companyName: "Square",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Build machine learning systems that protect millions of businesses from fraud. At Square, you'll work on real-time fraud detection, risk assessment, and payment security systems that help small businesses accept payments safely and confidently.",
    requirements: "• 5+ years of ML engineering experience\n• Strong background in fraud detection or financial ML\n• Experience with real-time ML systems and streaming data\n• Knowledge of anomaly detection and risk modeling\n• Understanding of payment systems and financial regulations\n• Proficiency in Python and ML frameworks",
    responsibilities: "• Develop real-time fraud detection and prevention systems\n• Build risk models for payment processing and merchant onboarding\n• Work on anomaly detection and behavioral analysis\n• Optimize ML models for low-latency fraud scoring\n• Collaborate with risk and compliance teams\n• Research advances in fraud detection and financial ML",
    skills: ["Machine Learning", "Fraud Detection", "Real-time Systems", "Risk Modeling", "Anomaly Detection", "Financial Services"],
    benefits: "• Competitive salary and equity package\n• Square payment processing benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and financial wellness programs",
    companyWebsite: "https://square.com/careers"
  },
  {
    title: "Senior UX Designer - Accessibility",
    companyName: "Microsoft",
    location: "Seattle, WA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 145000,
    maxSalary: 195000,
    description: "Lead accessibility design initiatives at Microsoft, ensuring our products are usable by everyone. Work on inclusive design principles and accessibility features that help people with disabilities access technology and achieve more.",
    requirements: "• 5+ years of UX design experience with accessibility focus\n• Deep knowledge of accessibility standards (WCAG, ADA, Section 508)\n• Experience with assistive technologies and inclusive design\n• Understanding of disability types and accessibility challenges\n• Strong portfolio showcasing accessible design work\n• Experience with design systems and accessibility guidelines",
    responsibilities: "• Lead accessibility design for Microsoft products and services\n• Develop inclusive design guidelines and best practices\n• Conduct accessibility audits and usability testing\n• Collaborate with engineering teams on accessibility implementation\n• Educate product teams on accessibility and inclusive design\n• Advocate for users with disabilities and accessibility needs",
    skills: ["Accessibility Design", "Inclusive Design", "WCAG", "Assistive Technology", "UX Research", "Design Systems"],
    benefits: "• Competitive total compensation package\n• Microsoft products and technology benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and accessibility programs",
    companyWebsite: "https://microsoft.com/careers"
  },
  {
    title: "Backend Engineer - Payments",
    companyName: "Square",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Build payment processing systems that help millions of businesses accept payments. At Square, you'll work on financial infrastructure that processes billions of dollars in transactions, helping small businesses grow and succeed.",
    requirements: "• 3+ years of backend development experience\n• Strong knowledge of payment systems and financial services\n• Experience with high-volume, low-latency systems\n• Understanding of PCI compliance and financial security\n• Proficiency in Java, Go, or similar languages\n• Knowledge of database design and distributed systems",
    responsibilities: "• Develop payment processing APIs and services\n• Build features for point-of-sale and e-commerce payments\n• Ensure PCI compliance and financial data security\n• Optimize transaction processing for speed and reliability\n• Work on merchant onboarding and underwriting systems\n• Collaborate with risk and compliance teams",
    skills: ["Payment Systems", "Financial Services", "Java", "Go", "PCI Compliance", "Distributed Systems"],
    benefits: "• Competitive salary and equity package\n• Square payment processing and financial benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee resource groups and financial literacy programs",
    companyWebsite: "https://square.com/careers"
  },
  {
    title: "Product Manager - Developer Tools",
    companyName: "GitHub",
    location: "San Francisco, CA",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 215000,
    description: "Drive product strategy for GitHub's developer tools and platform. Work on features that help millions of developers build, ship, and maintain software more efficiently. Join us to shape the future of software development.",
    requirements: "• 5+ years of product management experience with developer tools\n• Strong technical background and understanding of software development\n• Experience with version control, CI/CD, and DevOps workflows\n• Knowledge of developer ecosystems and open source software\n• Data-driven approach to product decisions\n• Excellent communication and stakeholder management skills",
    responsibilities: "• Define product strategy for GitHub's development platform\n• Work with engineering teams to deliver developer productivity features\n• Gather feedback from developer community and enterprise customers\n• Analyze usage metrics and developer workflow patterns\n• Collaborate with design and engineering on user experience\n• Present product roadmap to leadership and developer community",
    skills: ["Developer Tools", "Product Management", "Software Development", "CI/CD", "DevOps", "Open Source"],
    benefits: "• Remote-first culture with flexible working arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• GitHub Pro features and developer tools access\n• Employee resource groups and open source contribution time",
    companyWebsite: "https://github.com/about/careers"
  },
  {
    title: "Data Engineer - Analytics Platform",
    companyName: "Palantir",
    location: "Palo Alto, CA",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 180000,
    maxSalary: 240000,
    description: "Build data platforms that help organizations make better decisions with their data. At Palantir, you'll work on large-scale data processing and analytics systems used by government agencies and Fortune 500 companies worldwide.",
    requirements: "• 5+ years of data engineering experience\n• Strong proficiency in Java, Python, or Scala\n• Experience with big data frameworks (Spark, Hadoop, Kafka)\n• Knowledge of distributed systems and data processing\n• Understanding of data modeling and warehouse design\n• Security clearance preferred but not required",
    responsibilities: "• Build large-scale data processing and analytics platforms\n• Work on data integration and ETL pipelines\n• Develop real-time streaming and batch processing systems\n• Optimize data infrastructure for performance and scalability\n• Collaborate with government and enterprise customers\n• Ensure data security and compliance requirements",
    skills: ["Big Data", "Apache Spark", "Java", "Python", "Data Processing", "Security"],
    benefits: "• Competitive total compensation package\n• Comprehensive health and wellness benefits\n• Stock options and equity participation\n• Learning and development opportunities\n• Security clearance sponsorship available\n• Mission-driven work with government and enterprise clients",
    companyWebsite: "https://palantir.com/careers"
  },
  {
    title: "iOS Engineer - Fintech",
    companyName: "Plaid",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Build iOS applications that connect millions of people to their financial data. At Plaid, you'll work on mobile SDKs and applications that help fintech companies build better financial experiences for their users.",
    requirements: "• 3+ years of iOS development experience\n• Strong proficiency in Swift and iOS SDK\n• Experience with financial services or fintech applications\n• Knowledge of security best practices for financial data\n• Understanding of OAuth, API integration, and data encryption\n• Experience with SDK development and mobile frameworks",
    responsibilities: "• Develop iOS SDKs and applications for financial services\n• Build secure authentication and data connection flows\n• Work on Link SDK and financial account linking features\n• Implement security measures for sensitive financial data\n• Collaborate with fintech partners and customers\n• Optimize mobile performance for financial applications",
    skills: ["iOS Development", "Swift", "Fintech", "Security", "SDK Development", "Financial APIs"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and financial wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Financial services industry perks\n• Employee resource groups and professional development",
    companyWebsite: "https://plaid.com/careers"
  },
  {
    title: "Machine Learning Engineer - Recommendations",
    companyName: "Pinterest",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 175000,
    maxSalary: 225000,
    description: "Build recommendation systems that help billions of people discover ideas and inspiration on Pinterest. Work on machine learning algorithms that power visual search, home feed ranking, and personalized content discovery.",
    requirements: "• 5+ years of ML engineering experience with recommendations\n• Strong proficiency in Python and ML frameworks (TensorFlow, PyTorch)\n• Experience with large-scale recommendation systems\n• Knowledge of computer vision and visual search\n• Understanding of ranking algorithms and retrieval systems\n• Experience with A/B testing and ML experimentation",
    responsibilities: "• Develop recommendation algorithms for Pinterest's home feed\n• Work on visual search and image understanding systems\n• Build personalization models based on user behavior\n• Optimize recommendation systems for relevance and engagement\n• Collaborate with product and engineering teams\n• Research advances in visual recommendation systems",
    skills: ["Machine Learning", "Recommendation Systems", "Computer Vision", "Python", "Visual Search", "Personalization"],
    benefits: "• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development programs\n• Employee resource groups and inclusion initiatives\n• Pinterest creator tools and platform access",
    companyWebsite: "https://pinterest.com/careers"
  },
  {
    title: "Full Stack Engineer - E-commerce",
    companyName: "Shopify",
    location: "Ottawa, Canada",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 150000,
    description: "Build e-commerce solutions that help millions of merchants sell their products online. At Shopify, you'll work on platform features, payment processing, and merchant tools that make commerce better for everyone.",
    requirements: "• 3+ years of full stack development experience\n• Strong proficiency in Ruby on Rails and React\n• Experience with e-commerce and payment systems\n• Knowledge of database design and optimization\n• Understanding of web performance and scalability\n• Experience with GraphQL and REST APIs",
    responsibilities: "• Develop e-commerce platform features and merchant tools\n• Work on checkout, payments, and order management systems\n• Build admin interfaces and merchant dashboards\n• Optimize platform performance and scalability\n• Collaborate with product and design teams\n• Support merchant onboarding and success features",
    skills: ["Ruby on Rails", "React", "E-commerce", "Payment Systems", "GraphQL", "Full Stack Development"],
    benefits: "• Remote-first culture with flexible arrangements\n• Competitive salary and equity package\n• Comprehensive health and wellness benefits\n• Learning and development budget\n• Home office setup allowance\n• Employee resource groups and merchant discounts",
    companyWebsite: "https://shopify.com/careers"
  },
  {
    title: "Security Engineer - Application Security",
    companyName: "Okta",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 170000,
    maxSalary: 220000,
    description: "Protect identity infrastructure at Okta, the leading identity and access management platform. Work on application security, secure development practices, and security tools that help keep millions of users and their data safe.",
    requirements: "• 5+ years of application security experience\n• Strong knowledge of secure coding practices and OWASP\n• Experience with security testing tools and methodologies\n• Understanding of identity and access management systems\n• Knowledge of cloud security and DevSecOps practices\n• Experience with penetration testing and vulnerability assessment",
    responsibilities: "• Conduct security reviews and threat modeling for applications\n• Build security tools and automation for development teams\n• Perform penetration testing and vulnerability assessments\n• Work on secure development lifecycle and security training\n• Collaborate with engineering teams on security best practices\n• Respond to security incidents and conduct investigations",
    skills: ["Application Security", "Secure Coding", "Penetration Testing", "OWASP", "Identity Security", "DevSecOps"],
    benefits: "• Competitive compensation and equity package\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Security certification and training support\n• Professional development budget\n• Employee resource groups and security community involvement",
    companyWebsite: "https://okta.com/company/careers"
  },
  {
    title: "Product Designer - Mobile",
    companyName: "Uber",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 125000,
    maxSalary: 165000,
    description: "Design mobile experiences that connect millions of riders with drivers worldwide. At Uber, you'll work on iOS and Android applications that help people get transportation, food delivery, and freight services when they need them most.",
    requirements: "• 3+ years of product design experience with mobile focus\n• Strong portfolio showcasing mobile app design work\n• Experience with iOS and Android design systems\n• Knowledge of user research and usability testing\n• Understanding of accessibility and inclusive design\n• Experience with prototyping tools and design systems",
    responsibilities: "• Design mobile experiences for Uber's rider and driver apps\n• Create user flows and interactions for transportation services\n• Work on accessibility and internationalization features\n• Collaborate with product managers and engineers\n• Conduct user research and usability testing\n• Contribute to Uber's mobile design system",
    skills: ["Mobile Design", "iOS Design", "Android Design", "User Research", "Prototyping", "Accessibility"],
    benefits: "• Competitive salary and equity package\n• Uber credits for rides and food delivery\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development opportunities\n• Employee transportation benefits and commuter programs",
    companyWebsite: "https://uber.com/careers"
  },
  {
    title: "DevOps Engineer - Site Reliability",
    companyName: "Netflix",
    location: "Los Gatos, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 225000,
    description: "Ensure Netflix is always available for millions of viewers worldwide. Work on site reliability, infrastructure automation, and monitoring systems that keep our streaming service running 24/7 across the globe.",
    requirements: "• 5+ years of DevOps or SRE experience\n• Strong experience with AWS and cloud infrastructure\n• Knowledge of monitoring and observability tools\n• Experience with high-availability and disaster recovery\n• Understanding of CDN and video streaming infrastructure\n• Proficiency in Python, Go, or similar languages",
    responsibilities: "• Build and maintain Netflix's global streaming infrastructure\n• Implement monitoring and alerting for video streaming services\n• Work on disaster recovery and business continuity\n• Optimize CDN performance and video delivery\n• Collaborate with engineering teams on reliability requirements\n• Participate in on-call rotation and incident response",
    skills: ["Site Reliability Engineering", "AWS", "CDN", "Video Streaming", "Monitoring", "High Availability"],
    benefits: "• Top-tier compensation and equity package\n• Unlimited Netflix subscription and content access\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee content screenings and industry events",
    companyWebsite: "https://netflix.com/careers"
  },
  {
    title: "Data Scientist - Growth Analytics",
    companyName: "Lyft",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Drive growth through data-driven insights at Lyft. Work on user acquisition, retention, and marketplace optimization that helps millions of riders and drivers connect more efficiently in cities worldwide.",
    requirements: "• 3+ years of data science experience with growth focus\n• Strong proficiency in Python, R, and SQL\n• Experience with A/B testing and causal inference\n• Knowledge of marketplace dynamics and two-sided platforms\n• Understanding of user acquisition and retention analytics\n• Experience with geospatial data and location analytics",
    responsibilities: "• Analyze user behavior and identify growth opportunities\n• Design and analyze A/B tests for product and marketing experiments\n• Build models for demand forecasting and supply optimization\n• Work on pricing and incentive optimization\n• Collaborate with product, marketing, and operations teams\n• Create dashboards and reports for growth metrics",
    skills: ["Data Science", "A/B Testing", "Growth Analytics", "Marketplace Analytics", "Python", "Geospatial Data"],
    benefits: "• Competitive salary and equity package\n• Lyft ride credits and transportation benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://lyft.com/careers"
  },
  {
    title: "Backend Engineer - API Platform",
    companyName: "Twitch",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 155000,
    maxSalary: 205000,
    description: "Build API platforms that power live streaming experiences for millions of creators and viewers. At Twitch, you'll work on scalable backend systems that handle billions of requests and enable the creator economy to thrive.",
    requirements: "• 5+ years of backend development experience\n• Strong proficiency in Go, Java, or similar languages\n• Experience with API design and microservices architecture\n• Knowledge of real-time systems and streaming data\n• Understanding of high-scale, low-latency systems\n• Experience with GraphQL and REST API development",
    responsibilities: "• Build and maintain Twitch's API platform and services\n• Design APIs for creators, viewers, and third-party developers\n• Work on real-time chat and streaming infrastructure\n• Optimize API performance for global scale\n• Collaborate with frontend and mobile teams\n• Support developer ecosystem and API integrations",
    skills: ["Backend Development", "API Design", "Go", "Microservices", "Real-time Systems", "GraphQL"],
    benefits: "• Competitive salary and equity package\n• Twitch Prime and gaming benefits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Gaming equipment allowance\n• Employee gaming tournaments and creator support programs",
    companyWebsite: "https://twitch.tv/jobs"
  },
  {
    title: "Principal Engineer - Architecture",
    companyName: "Databricks",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 240000,
    maxSalary: 320000,
    description: "Lead architecture initiatives at Databricks, building the unified analytics platform for big data and machine learning. Drive technical strategy for distributed systems that process exabytes of data for thousands of organizations worldwide.",
    requirements: "• 8+ years of distributed systems engineering experience\n• Deep expertise in big data and analytics platforms\n• Strong proficiency in Scala, Java, and Apache Spark\n• Experience with cloud platforms and data lake architectures\n• Leadership experience influencing technical direction\n• Understanding of machine learning and data processing at scale",
    responsibilities: "• Define technical architecture for Databricks platform\n• Lead cross-team technical initiatives and system design\n• Drive performance optimization and scalability improvements\n• Mentor senior engineers and establish engineering standards\n• Collaborate with product and business teams on technical roadmap\n• Represent Databricks in technical community and conferences",
    skills: ["System Architecture", "Apache Spark", "Distributed Systems", "Big Data", "Technical Leadership", "Cloud Platforms"],
    benefits: "• Industry-leading total compensation package\n• Comprehensive health and wellness benefits\n• Equity participation and performance bonuses\n• Learning and development budget ($5,000 annually)\n• Conference speaking opportunities and thought leadership\n• Flexible work arrangements and sabbatical programs",
    companyWebsite: "https://databricks.com/company/careers"
  },
  {
    title: "Senior Marketing Manager - Performance",
    companyName: "DoorDash",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 135000,
    maxSalary: 175000,
    description: "Drive performance marketing at DoorDash, optimizing customer acquisition for our food delivery marketplace. Work on campaigns that connect millions of consumers with local restaurants while building efficient marketing channels.",
    requirements: "• 5+ years of performance marketing experience\n• Strong background in marketplace or two-sided platform marketing\n• Experience with paid advertising platforms (Google, Facebook, etc.)\n• Knowledge of attribution modeling and marketing analytics\n• Understanding of unit economics and customer lifetime value\n• Data-driven approach to campaign optimization",
    responsibilities: "• Develop performance marketing strategies for consumer acquisition\n• Manage paid advertising campaigns across multiple channels\n• Optimize marketing spend allocation and bidding strategies\n• Analyze campaign performance and customer acquisition metrics\n• Collaborate with product, analytics, and creative teams\n• Test new marketing channels and growth opportunities",
    skills: ["Performance Marketing", "Paid Advertising", "Marketing Analytics", "Customer Acquisition", "Marketplace Marketing", "Attribution Modeling"],
    benefits: "• Competitive salary and equity package\n• DashPass subscription and meal delivery credits\n• Comprehensive health and wellness benefits\n• Flexible work arrangements and unlimited PTO\n• Learning and development budget\n• Employee resource groups and volunteer opportunities",
    companyWebsite: "https://doordash.com/careers"
  },
  {
    title: "Staff Software Engineer - Security",
    companyName: "Coinbase",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 210000,
    maxSalary: 280000,
    description: "Lead security engineering at Coinbase, protecting the cryptoeconomy and customer funds. Work on security infrastructure, threat detection, and compliance systems that secure billions of dollars in digital assets.",
    requirements: "• 7+ years of security engineering experience\n• Strong background in financial services or cryptocurrency security\n• Experience with security architecture and threat modeling\n• Knowledge of cryptography and blockchain security\n• Understanding of regulatory compliance (SOX, PCI, etc.)\n• Leadership experience and ability to influence security culture",
    responsibilities: "• Lead security architecture and infrastructure initiatives\n• Build threat detection and incident response systems\n• Work on cryptocurrency custody and wallet security\n• Ensure compliance with financial regulations and security standards\n• Collaborate with engineering teams on secure development practices\n• Drive security awareness and training programs",
    skills: ["Security Engineering", "Cryptography", "Blockchain Security", "Financial Services", "Compliance", "Threat Detection"],
    benefits: "• Top-tier compensation and equity package\n• Comprehensive health and wellness benefits\n• Cryptocurrency learning and earning opportunities\n• Flexible work arrangements and unlimited PTO\n• Security certification and training support\n• Employee resource groups and professional development",
    companyWebsite: "https://coinbase.com/careers"
  },
  {
    title: "Senior Data Engineer - Real-time",
    companyName: "Tesla",
    location: "Palo Alto, CA",
    workMode: "onsite",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 165000,
    maxSalary: 215000,
    description: "Build real-time data systems that power Tesla's autonomous driving and energy products. Work on data infrastructure that processes millions of vehicle telemetry events and enables machine learning for self-driving cars.",
    requirements: "• 5+ years of data engineering experience with real-time focus\n• Strong proficiency in Python, Java, or Scala\n• Experience with streaming platforms (Kafka, Kinesis, Pulsar)\n• Knowledge of time-series data and automotive systems\n• Understanding of machine learning data pipelines\n• Experience with high-throughput, low-latency systems",
    responsibilities: "• Build real-time data pipelines for vehicle telemetry\n• Work on data infrastructure for autonomous driving ML models\n• Process and analyze time-series data from millions of vehicles\n• Optimize data systems for low-latency requirements\n• Collaborate with ML and autonomous driving teams\n• Ensure data quality and reliability for safety-critical systems",
    skills: ["Real-time Data", "Apache Kafka", "Time-series Data", "Python", "Automotive Systems", "ML Data Pipelines"],
    benefits: "• Competitive salary and Tesla stock options\n• Tesla vehicle purchase program and charging benefits\n• Comprehensive health and wellness benefits\n• Learning and development opportunities\n• Cutting-edge technology and research environment\n• Employee shuttle and onsite amenities",
    companyWebsite: "https://tesla.com/careers"
  }
];
