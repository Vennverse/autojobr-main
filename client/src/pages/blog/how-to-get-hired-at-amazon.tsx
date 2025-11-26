import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const amazonData: CompanyData = {
  name: "Amazon",
  slug: "amazon",
  description: "Amazon is the world's largest e-commerce company and a leader in cloud computing (AWS), AI, and logistics. Known for its fast-paced culture and Leadership Principles, Amazon offers tremendous growth opportunities for those who thrive in high-ownership environments.",
  industry: "Technology / E-commerce / Cloud",
  founded: "1994",
  headquarters: "Seattle, WA",
  employees: "1,500,000+",
  culture: [
    "Customer obsession as the #1 priority",
    "Ownership mentality - think like an owner",
    "Bias for action over perfect decisions",
    "Day 1 mentality - always innovating",
    "High bar for hiring and performance",
    "Frugality - do more with less"
  ],
  interviewProcess: [
    {
      stage: "Online Application",
      description: "Apply through Amazon Jobs. Your resume is reviewed by recruiters and hiring managers. Amazon receives millions of applications, so strong keywords matter.",
      duration: "1-2 weeks",
      tips: [
        "Use Leadership Principles language in your resume",
        "Quantify achievements with specific metrics",
        "Apply to multiple similar roles"
      ]
    },
    {
      stage: "Online Assessment (OA)",
      description: "For technical roles: 2 coding problems and a work simulation. For non-tech roles: work style assessment. Must pass to proceed.",
      duration: "90-120 min",
      tips: [
        "Practice LeetCode easy/medium problems",
        "Time yourself - speed matters",
        "Review Amazon's Leadership Principles before the work simulation"
      ]
    },
    {
      stage: "Phone Screen",
      description: "45-60 minute call with a hiring manager or team member. Includes behavioral questions based on Leadership Principles and technical questions for tech roles.",
      duration: "45-60 min",
      tips: [
        "Prepare 2-3 STAR stories for each Leadership Principle",
        "Be specific with metrics and outcomes",
        "Ask about team projects and challenges"
      ]
    },
    {
      stage: "Loop Interview (Virtual or Onsite)",
      description: "4-5 interviews of 45-60 minutes each. Includes a Bar Raiser (cross-team interviewer focused on culture fit) and deep dives into Leadership Principles.",
      duration: "4-5 hours",
      tips: [
        "Know all 16 Leadership Principles by heart",
        "Have 15+ STAR stories ready",
        "The Bar Raiser can veto - take their interview seriously",
        "Ask each interviewer what they love about Amazon"
      ]
    },
    {
      stage: "Debrief & Decision",
      description: "Interviewers meet to discuss and vote. All interviewers must agree (including Bar Raiser). Decision usually within 5 business days.",
      duration: "3-5 days",
      tips: [
        "Send thank you notes to your recruiter",
        "Be patient - the process is thorough",
        "Prepare for potential follow-up questions"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Software Development Engineer (SDE I)",
      salaryRange: "$130K - $180K",
      requirements: ["CS degree or equivalent", "Data structures & algorithms", "0-2 years experience"]
    },
    {
      title: "SDE II",
      salaryRange: "$180K - $280K",
      requirements: ["2-5 years experience", "System design skills", "Ownership of features"]
    },
    {
      title: "SDE III (Senior)",
      salaryRange: "$280K - $400K",
      requirements: ["6+ years experience", "Technical leadership", "Cross-team influence"]
    },
    {
      title: "Product Manager - Technical",
      salaryRange: "$160K - $250K",
      requirements: ["Technical background", "Customer obsession", "Data-driven decisions"]
    }
  ],
  technicalSkills: [
    "Data Structures", "Algorithms", "System Design", "Java", "Python",
    "AWS", "SQL", "NoSQL", "Distributed Systems", "APIs"
  ],
  softSkills: [
    "Customer Obsession",
    "Ownership",
    "Bias for Action",
    "Earn Trust",
    "Dive Deep",
    "Have Backbone; Disagree and Commit"
  ],
  interviewTips: [
    "Memorize all 16 Amazon Leadership Principles - they are the foundation of every interview",
    "Use the STAR method: Situation, Task, Action, Result",
    "Always quantify your impact with specific numbers",
    "Show customer obsession in every story you tell",
    "Prepare for 'Tell me about a time when...' questions",
    "Be ready to discuss failures and what you learned from them"
  ],
  applicationTips: [
    "Tailor your resume using Leadership Principle keywords",
    "Include metrics for every achievement (e.g., 'reduced costs by 25%')",
    "Apply on Monday/Tuesday for faster review",
    "Get an internal referral if possible",
    "Apply to Amazon subsidiaries too (AWS, Alexa, Prime Video)",
    "Set up job alerts for new postings"
  ],
  commonQuestions: [
    {
      question: "What are Amazon's Leadership Principles?",
      answer: "Amazon has 16 Leadership Principles that guide all hiring decisions: Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Learn and Be Curious, Hire and Develop the Best, Insist on the Highest Standards, Think Big, Bias for Action, Frugality, Earn Trust, Dive Deep, Have Backbone; Disagree and Commit, Deliver Results, Strive to be Earth's Best Employer, and Success and Scale Bring Broad Responsibility."
    },
    {
      question: "What is a Bar Raiser at Amazon?",
      answer: "A Bar Raiser is a trained interviewer from a different team who ensures hiring standards remain high. They have veto power over hiring decisions and focus on Leadership Principles fit."
    },
    {
      question: "How long does Amazon's interview process take?",
      answer: "Typically 3-6 weeks from application to offer. The loop interview is usually completed in one day, with decisions made within 5 business days."
    },
    {
      question: "Can I negotiate Amazon's offer?",
      answer: "Yes! Amazon expects negotiation. Focus on signing bonus and RSUs (stock) as base salary ranges are more fixed by level."
    }
  ],
  salaryRange: {
    entry: "$130,000+",
    mid: "$200,000+",
    senior: "$350,000+"
  },
  benefits: [
    "RSU grants", "401k matching", "Health insurance", "Parental leave",
    "Career development", "Employee discounts", "Relocation assistance"
  ],
  hiringTimeline: "3-6 weeks"
};

export default function HowToGetHiredAtAmazon() {
  return <CompanyHiringGuide company={amazonData} />;
}