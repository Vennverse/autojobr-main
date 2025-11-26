import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const metaData: CompanyData = {
  name: "Meta",
  slug: "meta",
  description: "Meta (formerly Facebook) is building the future of social connection and the metaverse. With products reaching billions of users, Meta offers engineers the opportunity to work on massive-scale systems and cutting-edge technology in AI, VR/AR, and social platforms.",
  industry: "Technology / Social Media / VR/AR",
  founded: "2004",
  headquarters: "Menlo Park, CA",
  employees: "70,000+",
  culture: [
    "Move fast with stable infrastructure",
    "Focus on impact, not hours worked",
    "Be bold and take risks",
    "Be open and transparent",
    "Build social value",
    "Meta-verses thinking"
  ],
  interviewProcess: [
    {
      stage: "Online Application & Resume Review",
      description: "Apply through Meta Careers. Recruiters review for relevant experience and skills. Strong referrals get priority review.",
      duration: "1-3 weeks",
      tips: [
        "Highlight large-scale system experience",
        "Include measurable impact metrics",
        "Get a referral from a current Meta employee"
      ]
    },
    {
      stage: "Initial Recruiter Screen",
      description: "30-minute call with a recruiter to discuss your background, interest in Meta, and role expectations. They'll explain the interview process.",
      duration: "30 min",
      tips: [
        "Research Meta's current products and initiatives",
        "Prepare your career story concisely",
        "Show enthusiasm for Meta's mission"
      ]
    },
    {
      stage: "Technical Phone Screen",
      description: "45-minute coding interview using CoderPad. You'll solve 1-2 algorithm problems while sharing your screen and explaining your approach.",
      duration: "45 min",
      tips: [
        "Practice coding while talking out loud",
        "Focus on optimal solutions - Meta values efficiency",
        "Be ready to optimize your initial solution"
      ]
    },
    {
      stage: "Onsite/Virtual Loop",
      description: "Full loop consists of: 2 coding interviews, 1 system design (E5+), 1 behavioral interview. Each interview is 45 minutes.",
      duration: "3-4 hours",
      tips: [
        "Practice designing systems like News Feed, Messenger",
        "Prepare stories showing impact and leadership",
        "Meta values strong coding fundamentals",
        "Be ready to discuss trade-offs in system design"
      ]
    },
    {
      stage: "Hiring Committee & Offer",
      description: "Feedback is reviewed by a hiring committee. If approved, you'll receive a verbal offer followed by written offer with compensation details.",
      duration: "1-2 weeks",
      tips: [
        "Be patient during the review process",
        "Prepare questions about team and projects",
        "Research Meta's compensation structure (base + RSUs + bonus)"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Software Engineer (E3)",
      salaryRange: "$150K - $200K",
      requirements: ["CS degree or equivalent", "Strong coding skills", "0-2 years experience"]
    },
    {
      title: "Software Engineer (E4)",
      salaryRange: "$200K - $300K",
      requirements: ["2-5 years experience", "System ownership", "Code quality focus"]
    },
    {
      title: "Software Engineer (E5)",
      salaryRange: "$300K - $450K",
      requirements: ["5+ years experience", "System design expertise", "Technical leadership"]
    },
    {
      title: "Production Engineer",
      salaryRange: "$180K - $280K",
      requirements: ["Linux systems", "Automation", "Reliability engineering"]
    }
  ],
  technicalSkills: [
    "Data Structures", "Algorithms", "System Design", "Python", "C++",
    "React", "PHP/Hack", "Distributed Systems", "Machine Learning", "SQL"
  ],
  softSkills: [
    "Move Fast mindset",
    "Impact-driven thinking",
    "Collaborative problem-solving",
    "Openness to feedback",
    "Bold decision-making"
  ],
  interviewTips: [
    "Focus on writing clean, bug-free code quickly - Meta values efficiency",
    "Practice system design for social/messaging platforms",
    "Be prepared to discuss your most impactful projects in detail",
    "Show enthusiasm for Meta's products and mission",
    "Meta appreciates candidates who can identify and solve ambiguous problems",
    "Practice explaining your thought process while coding"
  ],
  applicationTips: [
    "Apply through Meta Careers and get an employee referral",
    "Highlight experience with large-scale distributed systems",
    "Show impact through metrics in your resume",
    "Include experience with Meta's tech stack if applicable",
    "Apply to multiple roles that match your experience",
    "Engage with Meta's engineering blog and open source projects"
  ],
  commonQuestions: [
    {
      question: "What's the difference between Meta E3, E4, E5 levels?",
      answer: "E3 is entry/junior level (0-2 years), E4 is mid-level (2-5 years), and E5 is senior (5+ years with leadership). E5+ requires system design interviews and demonstrated technical leadership."
    },
    {
      question: "How hard is Meta's coding interview?",
      answer: "Meta's coding interviews are challenging, typically LeetCode medium to hard difficulty. Focus on optimal time/space complexity and clean code. You'll need to solve 1-2 problems in 45 minutes."
    },
    {
      question: "Does Meta hire bootcamp graduates?",
      answer: "Yes, Meta hires bootcamp graduates for E3/E4 positions if they demonstrate strong coding fundamentals and problem-solving skills."
    },
    {
      question: "What is Meta's interview timeline?",
      answer: "Typically 3-5 weeks from first contact to offer. The process moves faster with referrals and for senior candidates."
    }
  ],
  salaryRange: {
    entry: "$150,000+",
    mid: "$250,000+",
    senior: "$400,000+"
  },
  benefits: [
    "RSU grants", "Annual bonus", "401k matching", "Health insurance",
    "Free meals", "Wellness programs", "Parental leave", "Learning budget"
  ],
  hiringTimeline: "3-5 weeks"
};

export default function HowToGetHiredAtMeta() {
  return <CompanyHiringGuide company={metaData} />;
}