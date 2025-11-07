import { db } from "../server/db";
import { users, userProfiles, education, workExperience, userSkills, resumes } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createDemoAccounts() {
  console.log("🚀 Creating demo accounts for YC Demo...");

  const password = "YCdemo@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const jobSeekerId = `user-${Date.now()}-jobseeker`;
  const recruiterId = `user-${Date.now()}-recruiter`;

  await db.delete(users).where(eq(users.email, "jobseeker@gmail.com"));
  await db.delete(users).where(eq(users.email, "recruiter@autojobr.com"));
  
  console.log("✅ Cleaned up existing demo accounts");

  const jobSeekerUser = await db.insert(users).values({
    id: jobSeekerId,
    email: "jobseeker@gmail.com",
    firstName: "Alex",
    lastName: "Chen",
    password: hashedPassword,
    userType: "job_seeker",
    availableRoles: "job_seeker",
    currentRole: "job_seeker",
    emailVerified: true,
    subscriptionStatus: "active",
    planType: "premium",
    aiModelTier: "premium",
    hasUsedPremiumTrial: true,
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    freeRankingTestsRemaining: 999,
  }).returning();

  console.log("✅ Created job seeker account:", jobSeekerUser[0].email);

  await db.insert(userProfiles).values({
    userId: jobSeekerId,
    fullName: "Alex Chen",
    phone: "+1 (555) 123-4567",
    professionalTitle: "Senior Full Stack Software Engineer",
    location: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/alexchen",
    githubUrl: "https://github.com/alexchen",
    portfolioUrl: "https://alexchen.dev",
    dateOfBirth: "1995-06-15",
    gender: "Male",
    nationality: "United States",
    currentAddress: "123 Market Street, Apt 4B",
    city: "San Francisco",
    state: "California",
    zipCode: "94102",
    country: "United States",
    willingToRelocate: true,
    preferredWorkMode: "hybrid",
    desiredSalaryMin: 150000,
    desiredSalaryMax: 200000,
    salaryCurrency: "USD",
    noticePeriod: "2_weeks",
    currentlyEmployed: true,
    workAuthorization: "citizen",
    requiresSponsorship: false,
    highestDegree: "Bachelor of Science",
    majorFieldOfStudy: "Computer Science",
    graduationYear: 2018,
    gpa: "3.8",
    summary: "Experienced full-stack engineer with 6+ years building scalable web applications. Specialized in React, Node.js, and cloud architecture. Passionate about creating user-centric products and leading engineering teams.",
    yearsExperience: 6,
    onboardingCompleted: true,
    profileCompletion: 100,
    freeInterviewsRemaining: 50,
    premiumInterviewsRemaining: 100,
  });

  console.log("✅ Created job seeker profile");

  await db.insert(education).values([
    {
      userId: jobSeekerId,
      institution: "Stanford University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      graduationYear: 2018,
      gpa: "3.8",
      startDate: new Date("2014-09-01"),
      endDate: new Date("2018-06-15"),
      achievements: [
        "Dean's List all 4 years",
        "CS Departmental Honors",
        "Hackathon Winner - TreeHacks 2017",
        "Teaching Assistant for CS106A"
      ]
    },
    {
      userId: jobSeekerId,
      institution: "Mission High School",
      degree: "High School Diploma",
      fieldOfStudy: "General Studies",
      graduationYear: 2014,
      gpa: "4.0",
      startDate: new Date("2010-09-01"),
      endDate: new Date("2014-06-01"),
      achievements: [
        "Valedictorian",
        "National Merit Scholar"
      ]
    }
  ]);

  console.log("✅ Added education history");

  await db.insert(workExperience).values([
    {
      userId: jobSeekerId,
      company: "Meta",
      position: "Senior Software Engineer",
      location: "Menlo Park, CA",
      startDate: new Date("2021-03-01"),
      endDate: new Date("2024-01-31"),
      isCurrent: false,
      description: "Led development of core infrastructure for WhatsApp Web, improving performance by 40% and serving 2B+ users globally.",
      achievements: [
        "Architected and deployed microservices handling 100M+ daily active users",
        "Reduced page load time by 40% through React optimization and CDN improvements",
        "Mentored 5 junior engineers and conducted technical interviews",
        "Led cross-functional team of 8 engineers on major product launch"
      ]
    },
    {
      userId: jobSeekerId,
      company: "Stripe",
      position: "Software Engineer",
      location: "San Francisco, CA",
      startDate: new Date("2018-07-01"),
      endDate: new Date("2021-02-28"),
      isCurrent: false,
      description: "Built and maintained payment processing systems handling billions in transactions.",
      achievements: [
        "Developed fraud detection ML pipeline reducing chargebacks by 25%",
        "Implemented real-time analytics dashboard processing 1M+ events/second",
        "Contributed to open-source Stripe SDK used by 100K+ developers",
        "Achieved 99.99% uptime on mission-critical payment APIs"
      ]
    },
    {
      userId: jobSeekerId,
      company: "Google",
      position: "Software Engineering Intern",
      location: "Mountain View, CA",
      startDate: new Date("2017-06-01"),
      endDate: new Date("2017-08-31"),
      isCurrent: false,
      description: "Summer internship on Google Maps team working on location services.",
      achievements: [
        "Built geolocation API feature now used in Google Maps",
        "Improved location accuracy by 15% using ML clustering",
        "Presented project to VP of Engineering"
      ]
    }
  ]);

  console.log("✅ Added work experience");

  await db.insert(userSkills).values([
    { userId: jobSeekerId, skillName: "JavaScript", proficiencyLevel: "expert", yearsExperience: 6 },
    { userId: jobSeekerId, skillName: "TypeScript", proficiencyLevel: "expert", yearsExperience: 5 },
    { userId: jobSeekerId, skillName: "React", proficiencyLevel: "expert", yearsExperience: 6 },
    { userId: jobSeekerId, skillName: "Node.js", proficiencyLevel: "expert", yearsExperience: 6 },
    { userId: jobSeekerId, skillName: "Python", proficiencyLevel: "advanced", yearsExperience: 4 },
    { userId: jobSeekerId, skillName: "PostgreSQL", proficiencyLevel: "advanced", yearsExperience: 5 },
    { userId: jobSeekerId, skillName: "AWS", proficiencyLevel: "advanced", yearsExperience: 4 },
    { userId: jobSeekerId, skillName: "Docker", proficiencyLevel: "advanced", yearsExperience: 4 },
    { userId: jobSeekerId, skillName: "GraphQL", proficiencyLevel: "advanced", yearsExperience: 3 },
    { userId: jobSeekerId, skillName: "MongoDB", proficiencyLevel: "intermediate", yearsExperience: 3 },
    { userId: jobSeekerId, skillName: "Redis", proficiencyLevel: "intermediate", yearsExperience: 2 },
    { userId: jobSeekerId, skillName: "Kubernetes", proficiencyLevel: "intermediate", yearsExperience: 2 }
  ]);

  console.log("✅ Added skills");

  const recruiterUser = await db.insert(users).values({
    id: recruiterId,
    email: "recruiter@autojobr.com",
    firstName: "Sarah",
    lastName: "Johnson",
    password: hashedPassword,
    userType: "recruiter",
    availableRoles: "recruiter",
    currentRole: "recruiter",
    emailVerified: true,
    companyName: "TechCorp Inc.",
    companyWebsite: "https://techcorp.example.com",
    subscriptionStatus: "active",
    planType: "premium",
    aiModelTier: "premium",
    hasUsedPremiumTrial: true,
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    freeRankingTestsRemaining: 999,
  }).returning();

  console.log("✅ Created recruiter account:", recruiterUser[0].email);

  await db.insert(userProfiles).values({
    userId: recruiterId,
    fullName: "Sarah Johnson",
    phone: "+1 (555) 987-6543",
    professionalTitle: "Senior Technical Recruiter",
    location: "New York, NY",
    linkedinUrl: "https://linkedin.com/in/sarahjohnson",
    currentAddress: "456 Broadway, Suite 800",
    city: "New York",
    state: "New York",
    zipCode: "10013",
    country: "United States",
    summary: "Senior technical recruiter with 8+ years experience placing top engineering talent at Fortune 500 companies and high-growth startups. Specialized in full-stack, ML, and DevOps roles.",
    yearsExperience: 8,
    onboardingCompleted: true,
    profileCompletion: 100,
  });

  console.log("✅ Created recruiter profile");

  await db.insert(education).values([
    {
      userId: recruiterId,
      institution: "New York University",
      degree: "Bachelor of Arts",
      fieldOfStudy: "Human Resources Management",
      graduationYear: 2016,
      gpa: "3.9",
      startDate: new Date("2012-09-01"),
      endDate: new Date("2016-05-15"),
      achievements: [
        "Summa Cum Laude",
        "HR Society President",
        "Dean's List all semesters"
      ]
    }
  ]);

  console.log("✅ Added recruiter education");

  await db.insert(workExperience).values([
    {
      userId: recruiterId,
      company: "TechCorp Inc.",
      position: "Senior Technical Recruiter",
      location: "New York, NY",
      startDate: new Date("2020-01-01"),
      isCurrent: true,
      description: "Leading technical recruiting efforts for engineering and product teams.",
      achievements: [
        "Placed 150+ engineers at top tech companies",
        "Reduced time-to-hire by 35% through process optimization",
        "Built pipeline of 500+ qualified candidates",
        "Achieved 95% offer acceptance rate"
      ]
    },
    {
      userId: recruiterId,
      company: "LinkedIn",
      position: "Technical Recruiter",
      location: "San Francisco, CA",
      startDate: new Date("2017-06-01"),
      endDate: new Date("2019-12-31"),
      isCurrent: false,
      description: "Recruited software engineers for LinkedIn's core product teams.",
      achievements: [
        "Hired 50+ engineers across various specializations",
        "Developed sourcing strategies that increased qualified applicants by 60%",
        "Partnered with hiring managers to define role requirements"
      ]
    }
  ]);

  console.log("✅ Added recruiter work experience");

  await db.insert(userSkills).values([
    { userId: recruiterId, skillName: "Technical Recruiting", proficiencyLevel: "expert", yearsExperience: 8 },
    { userId: recruiterId, skillName: "Boolean Search", proficiencyLevel: "expert", yearsExperience: 8 },
    { userId: recruiterId, skillName: "LinkedIn Recruiting", proficiencyLevel: "expert", yearsExperience: 8 },
    { userId: recruiterId, skillName: "Candidate Assessment", proficiencyLevel: "expert", yearsExperience: 8 },
    { userId: recruiterId, skillName: "Salary Negotiation", proficiencyLevel: "advanced", yearsExperience: 6 },
    { userId: recruiterId, skillName: "Applicant Tracking Systems", proficiencyLevel: "advanced", yearsExperience: 7 }
  ]);

  console.log("✅ Added recruiter skills");

  console.log("\n🎉 Demo accounts created successfully!");
  console.log("\n📧 Job Seeker Account:");
  console.log("   Email: jobseeker@gmail.com");
  console.log("   Password: YCdemo@123");
  console.log("   Name: Alex Chen");
  console.log("   Plan: Premium");
  console.log("\n📧 Recruiter Account:");
  console.log("   Email: recruiter@autojobr.com");
  console.log("   Password: YCdemo@123");
  console.log("   Name: Sarah Johnson");
  console.log("   Plan: Premium");
  console.log("\n✨ Both accounts have complete profiles with education, work experience, and skills!");
}

createDemoAccounts()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error creating demo accounts:", error);
    process.exit(1);
  });
