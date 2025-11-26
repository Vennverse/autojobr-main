import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const microsoftData: CompanyData = {
  name: "Microsoft",
  slug: "microsoft",
  description: "Microsoft is a technology giant powering cloud computing (Azure), productivity (Office 365), gaming (Xbox), and AI. With a transformation under Satya Nadella, Microsoft has become known for its growth mindset culture and work-life balance.",
  industry: "Technology / Cloud / Software",
  founded: "1975",
  headquarters: "Redmond, WA",
  employees: "220,000+",
  culture: [
    "Growth mindset over fixed mindset",
    "One Microsoft - collaboration across teams",
    "Customer obsession",
    "Diversity and inclusion",
    "Work-life balance emphasis",
    "Innovation with responsibility"
  ],
  interviewProcess: [
    {
      stage: "Online Application",
      description: "Apply through Microsoft Careers. Recruiters review resumes for relevant experience. Employee referrals are highly valued.",
      duration: "1-2 weeks",
      tips: [
        "Highlight cloud/Azure experience if applicable",
        "Include quantifiable achievements",
        "Get a referral from a current Microsoft employee"
      ]
    },
    {
      stage: "Recruiter Screen",
      description: "20-30 minute call to discuss your background, career goals, and interest in Microsoft. The recruiter assesses basic fit.",
      duration: "20-30 min",
      tips: [
        "Research Microsoft's recent initiatives (AI, Azure)",
        "Show enthusiasm for Microsoft's products",
        "Prepare questions about the team and role"
      ]
    },
    {
      stage: "Technical Phone Screen",
      description: "45-60 minute interview with a team member. Includes coding on a shared editor and discussion of past projects.",
      duration: "45-60 min",
      tips: [
        "Practice coding in a shared document",
        "Be ready to discuss your resume in depth",
        "Explain your thought process clearly"
      ]
    },
    {
      stage: "Virtual/Onsite Interview Loop",
      description: "4-5 interviews including coding, system design (for senior), and behavioral. Includes an 'As Appropriate' (AA) interview with a senior leader.",
      duration: "4-5 hours",
      tips: [
        "The AA interview is critical - show leadership potential",
        "Prepare for growth mindset questions",
        "Practice system design for Azure-scale systems",
        "Show how you've collaborated across teams"
      ]
    },
    {
      stage: "Debrief & Offer",
      description: "Interviewers meet to discuss feedback. Hiring manager makes final decision. Offers typically come within 1 week.",
      duration: "3-7 days",
      tips: [
        "Follow up with your recruiter after 1 week",
        "Be ready to negotiate - Microsoft has room for negotiation",
        "Ask about team placement and projects"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Software Engineer (SDE 1)",
      salaryRange: "$110K - $150K",
      requirements: ["CS degree or equivalent", "Coding fundamentals", "0-2 years experience"]
    },
    {
      title: "Software Engineer (SDE 2)",
      salaryRange: "$150K - $220K",
      requirements: ["2-5 years experience", "Feature ownership", "Design skills"]
    },
    {
      title: "Senior Software Engineer",
      salaryRange: "$200K - $300K",
      requirements: ["5+ years experience", "System design", "Technical leadership"]
    },
    {
      title: "Program Manager",
      salaryRange: "$130K - $200K",
      requirements: ["Technical background", "Communication skills", "Strategic thinking"]
    }
  ],
  technicalSkills: [
    "C#", "Python", "Java", "TypeScript", "Azure", "SQL Server",
    "Distributed Systems", "Machine Learning", ".NET", "Kubernetes"
  ],
  softSkills: [
    "Growth Mindset",
    "Collaboration (One Microsoft)",
    "Customer Focus",
    "Inclusive Leadership",
    "Adaptability",
    "Continuous Learning"
  ],
  interviewTips: [
    "Demonstrate growth mindset - discuss times you learned from failure",
    "Show collaboration skills - Microsoft values teamwork highly",
    "Practice designing scalable cloud systems",
    "Be prepared to discuss how you handle feedback",
    "Show passion for Microsoft products you use",
    "The AA (As Appropriate) interview is crucial - show executive presence"
  ],
  applicationTips: [
    "Apply through Microsoft Careers and seek an internal referral",
    "Highlight cloud computing experience (Azure, AWS)",
    "Show projects that demonstrate innovation",
    "Include experience with Microsoft tech stack if applicable",
    "Apply to roles in different product groups (Azure, Office, Windows)",
    "Engage with Microsoft's technical community (blogs, GitHub)"
  ],
  commonQuestions: [
    {
      question: "What is the 'As Appropriate' (AA) interview?",
      answer: "The AA is a final interview with a senior leader (usually a hiring manager's manager) who evaluates leadership potential and cultural fit. This interview can be the deciding factor."
    },
    {
      question: "What is Microsoft's growth mindset culture?",
      answer: "Inspired by Carol Dweck's research, Microsoft's growth mindset emphasizes learning from failures, embracing challenges, valuing effort, and learning from criticism rather than having a fixed view of abilities."
    },
    {
      question: "How does Microsoft's interview differ from other FAANG companies?",
      answer: "Microsoft places more emphasis on behavioral questions and growth mindset than pure algorithmic puzzles. The AA interview is unique to Microsoft. Work-life balance is also more openly discussed."
    },
    {
      question: "Can I negotiate Microsoft's offer?",
      answer: "Yes, Microsoft expects negotiation. Stock grants and signing bonuses have more flexibility than base salary, which is more level-dependent."
    }
  ],
  salaryRange: {
    entry: "$110,000+",
    mid: "$180,000+",
    senior: "$280,000+"
  },
  benefits: [
    "RSU grants", "401k matching", "Health insurance", "Parental leave",
    "Free Microsoft products", "Learning stipend", "Gym subsidies", "Volunteer time"
  ],
  hiringTimeline: "3-6 weeks"
};

export default function HowToGetHiredAtMicrosoft() {
  return <CompanyHiringGuide company={microsoftData} />;
}