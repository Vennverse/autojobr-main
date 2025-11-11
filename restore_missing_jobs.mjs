
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

// Missing jobs that need to be restored
const missingJobs = [
  {
    title: "Senior Software Engineer",
    companyName: "Vennverse",
    location: "San Francisco, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 150000,
    maxSalary: 200000,
    description: "Join Vennverse as a Senior Software Engineer and help build the future of virtual collaboration platforms. Work on cutting-edge VR/AR technologies and create immersive experiences that connect people across the globe.",
    requirements: "• 5+ years of software engineering experience\n• Strong proficiency in React, Node.js, and TypeScript\n• Experience with VR/AR technologies (Unity, WebXR)\n• Knowledge of real-time systems and WebSocket technologies\n• Understanding of 3D graphics and spatial computing",
    responsibilities: "• Design and build scalable VR/AR applications\n• Develop real-time collaboration features\n• Work on virtual world rendering and physics\n• Collaborate with design and product teams\n• Optimize performance for immersive experiences",
    skills: ["React", "Node.js", "TypeScript", "Unity", "WebXR", "3D Graphics", "VR/AR"],
    benefits: "• Competitive salary and equity package\n• Latest VR/AR equipment provided\n• Flexible work arrangements\n• Innovation time for personal projects\n• Conference attendance and learning budget"
  },
  {
    title: "Full Stack Developer",
    companyName: "TechCorp",
    location: "Austin, TX",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 120000,
    maxSalary: 160000,
    description: "Build innovative web applications at TechCorp. We're a fast-growing startup creating tools that help businesses streamline their operations through intelligent automation.",
    requirements: "• 3+ years of full stack development experience\n• Proficiency in React, Python, and PostgreSQL\n• Experience with cloud platforms (AWS preferred)\n• Knowledge of API design and microservices\n• Understanding of DevOps practices",
    responsibilities: "• Develop and maintain web applications\n• Design RESTful APIs and database schemas\n• Implement automated testing and CI/CD pipelines\n• Collaborate with product and design teams\n• Mentor junior developers",
    skills: ["React", "Python", "PostgreSQL", "AWS", "Docker", "API Design"],
    benefits: "• Remote-first culture\n• Health insurance and 401k matching\n• Professional development budget\n• Flexible PTO policy\n• Home office setup allowance"
  },
  {
    title: "Product Designer",
    companyName: "DesignStudio",
    location: "New York, NY",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 110000,
    maxSalary: 140000,
    description: "Create beautiful and intuitive user experiences at DesignStudio. Work with top brands to design digital products that millions of users love and interact with daily.",
    requirements: "• 3+ years of product design experience\n• Proficiency in Figma, Sketch, and Adobe Creative Suite\n• Strong portfolio showcasing UX/UI design work\n• Experience with design systems and prototyping\n• Understanding of user research and testing methods",
    responsibilities: "• Design user interfaces for web and mobile applications\n• Create and maintain design systems\n• Conduct user research and usability testing\n• Collaborate with engineering and product teams\n• Present design concepts to stakeholders",
    skills: ["Figma", "Sketch", "Adobe Creative Suite", "Prototyping", "User Research", "Design Systems"],
    benefits: "• Creative and collaborative work environment\n• Health and wellness benefits\n• Design tools and equipment provided\n• Professional development opportunities\n• Flexible work schedule"
  },
  {
    title: "DevOps Engineer",
    companyName: "CloudTech",
    location: "Seattle, WA",
    workMode: "remote",
    jobType: "full-time",
    experienceLevel: "senior",
    minSalary: 140000,
    maxSalary: 180000,
    description: "Join CloudTech's infrastructure team and help scale our cloud platform that serves millions of customers worldwide. Work with cutting-edge technologies and build robust, secure, and scalable systems.",
    requirements: "• 5+ years of DevOps/SRE experience\n• Strong experience with AWS, Kubernetes, and Docker\n• Proficiency in Infrastructure as Code (Terraform, CloudFormation)\n• Knowledge of monitoring and logging tools\n• Experience with CI/CD pipelines and automation",
    responsibilities: "• Design and maintain cloud infrastructure\n• Implement monitoring and alerting systems\n• Automate deployment and scaling processes\n• Ensure security and compliance standards\n• Participate in on-call rotation",
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "Python", "Monitoring", "CI/CD"],
    benefits: "• Competitive salary and equity\n• Remote work flexibility\n• Health and dental insurance\n• Learning and certification budget\n• Annual team retreats"
  },
  {
    title: "Data Scientist",
    companyName: "DataDriven",
    location: "Boston, MA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 130000,
    maxSalary: 170000,
    description: "Help DataDriven extract insights from complex datasets and build machine learning models that drive business decisions. Work with a team of data scientists and engineers to solve challenging analytical problems.",
    requirements: "• 3+ years of data science experience\n• Strong proficiency in Python, SQL, and machine learning libraries\n• Experience with statistical analysis and hypothesis testing\n• Knowledge of data visualization tools (Tableau, Power BI)\n• Understanding of big data technologies (Spark, Hadoop)",
    responsibilities: "• Analyze large datasets to identify trends and insights\n• Build and deploy machine learning models\n• Create data visualizations and reports\n• Collaborate with business stakeholders\n• Mentor junior data analysts",
    skills: ["Python", "SQL", "Machine Learning", "Statistics", "Tableau", "Spark", "TensorFlow"],
    benefits: "• Competitive compensation package\n• Flexible work arrangements\n• Health and wellness benefits\n• Conference attendance opportunities\n• Data science tools and resources"
  },
  {
    title: "Marketing Manager",
    companyName: "GrowthCo",
    location: "Los Angeles, CA",
    workMode: "hybrid",
    jobType: "full-time",
    experienceLevel: "mid",
    minSalary: 100000,
    maxSalary: 130000,
    description: "Lead marketing initiatives at GrowthCo and help drive customer acquisition and brand awareness. Work with cross-functional teams to develop and execute marketing campaigns that deliver results.",
    requirements: "• 4+ years of marketing experience\n• Strong background in digital marketing and analytics\n• Experience with marketing automation tools\n• Knowledge of SEO, SEM, and social media marketing\n• Excellent communication and project management skills",
    responsibilities: "• Develop and execute marketing campaigns\n• Analyze marketing performance and ROI\n• Manage social media and content marketing\n• Collaborate with sales and product teams\n• Lead marketing automation initiatives",
    skills: ["Digital Marketing", "Analytics", "SEO", "SEM", "Marketing Automation", "Social Media"],
    benefits: "• Marketing budget for campaigns\n• Professional development opportunities\n• Health insurance and retirement plan\n• Flexible PTO policy\n• Team building events"
  }
];

// Function to map job data to database schema
function mapJobToSchema(job) {
  return {
    recruiterId: ADMIN_USER_ID,
    title: job.title,
    description: job.description,
    companyName: job.companyName,
    companyLogo: null,
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    skills: job.skills,
    qualifications: job.requirements,
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

// Function to check if job already exists
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
    return false;
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

// Main execution function
async function main() {
  console.log('🚀 Restoring missing job postings...');
  console.log(`📊 Jobs to restore: ${missingJobs.length}`);
  console.log(`👤 Admin user: ${ADMIN_USER_ID}\n`);
  
  const results = {
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };
  
  // Process each job
  for (const job of missingJobs) {
    const result = await insertJob(job);
    
    if (result.success) {
      results.successful++;
    } else if (result.reason === 'duplicate') {
      results.duplicates++;
    } else {
      results.failed++;
      results.errors.push({
        job: `${result.job.title} at ${result.job.companyName}`,
        error: result.error
      });
    }
  }
  
  // Print final summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 JOB RESTORATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`📊 Total jobs processed: ${missingJobs.length}`);
  console.log(`✅ Successfully restored: ${results.successful}`);
  console.log(`⚠️  Duplicates skipped: ${results.duplicates}`);
  console.log(`❌ Failed restorations: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.job}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Job restoration process completed!');
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
  });
