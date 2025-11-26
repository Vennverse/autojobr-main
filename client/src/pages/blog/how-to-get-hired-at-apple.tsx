import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const appleData: CompanyData = {
  name: "Apple",
  slug: "apple",
  description: "Apple is the world's most valuable company, known for creating revolutionary products like iPhone, Mac, and Apple Watch. With a focus on design excellence and user experience, Apple offers the opportunity to work on products that impact billions of people.",
  industry: "Technology / Consumer Electronics",
  founded: "1976",
  headquarters: "Cupertino, CA",
  employees: "160,000+",
  culture: [
    "Secrecy and confidentiality",
    "Design-first thinking",
    "Attention to detail",
    "Cross-functional collaboration",
    "User experience obsession",
    "Innovation through simplicity"
  ],
  interviewProcess: [
    {
      stage: "Online Application",
      description: "Apply through Apple Jobs. Apple's hiring process is highly selective and secretive. Referrals are extremely valuable here.",
      duration: "2-4 weeks",
      tips: [
        "Tailor your resume to the specific role",
        "Highlight attention to detail and design sense",
        "Get an internal referral if at all possible"
      ]
    },
    {
      stage: "Recruiter Phone Screen",
      description: "30-45 minute call with a recruiter discussing your background and interest in Apple. They may ask about salary expectations.",
      duration: "30-45 min",
      tips: [
        "Research Apple's recent product launches",
        "Be prepared to discuss why you want to work at Apple specifically",
        "Show passion for Apple products"
      ]
    },
    {
      stage: "Technical Phone Interview",
      description: "1-2 phone interviews with team members. For engineering roles, includes coding and domain-specific questions.",
      duration: "45-60 min each",
      tips: [
        "Practice coding for Apple's tech stack (Swift, Objective-C)",
        "Be ready for deep technical discussions",
        "Show how you've shipped quality products"
      ]
    },
    {
      stage: "Onsite Interview Loop",
      description: "Full-day interview (4-6 hours) with multiple team members. Includes coding, design, and behavioral interviews. Very thorough process.",
      duration: "4-6 hours",
      tips: [
        "Dress well - Apple culture values presentation",
        "Show your design sensibility even if not a designer",
        "Be prepared for scenarios about shipping products under pressure",
        "Demonstrate attention to detail in all answers"
      ]
    },
    {
      stage: "Hiring Manager Interview",
      description: "Final interview with the hiring manager who makes the ultimate decision. Focus on team fit and specific project alignment.",
      duration: "45-60 min",
      tips: [
        "Ask about the specific projects you'd work on",
        "Show long-term commitment to Apple",
        "Discuss how you handle high-pressure deadlines"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Software Engineer (ICT3)",
      salaryRange: "$140K - $180K",
      requirements: ["CS degree", "iOS/macOS development", "Swift/Objective-C"]
    },
    {
      title: "Senior Software Engineer (ICT4)",
      salaryRange: "$180K - $260K",
      requirements: ["5+ years experience", "System design", "Technical leadership"]
    },
    {
      title: "Machine Learning Engineer",
      salaryRange: "$200K - $320K",
      requirements: ["ML/AI expertise", "Python/Swift", "Research background preferred"]
    },
    {
      title: "Product Designer",
      salaryRange: "$150K - $250K",
      requirements: ["Portfolio required", "UI/UX expertise", "Attention to detail"]
    }
  ],
  technicalSkills: [
    "Swift", "Objective-C", "iOS Development", "macOS Development",
    "Metal", "Core ML", "ARKit", "C++", "Python", "System Programming"
  ],
  softSkills: [
    "Attention to Detail",
    "Design Sensibility",
    "Collaboration",
    "Discretion/Confidentiality",
    "Passion for Products",
    "User Empathy"
  ],
  interviewTips: [
    "Show genuine passion for Apple products - be specific about what you love",
    "Demonstrate attention to detail in everything you do",
    "Practice iOS/macOS development questions if interviewing for software roles",
    "Be prepared to sign strict NDAs and respect confidentiality",
    "Show how you've shipped high-quality products under pressure",
    "Design sense matters even for engineering roles"
  ],
  applicationTips: [
    "Apply directly through Apple Jobs - recruitment agencies rarely work",
    "Get a referral from a current Apple employee",
    "Build and ship an iOS/macOS app to demonstrate your skills",
    "Highlight experience with Apple technologies in your resume",
    "Show projects where you prioritized user experience",
    "Apply to specific teams you're interested in"
  ],
  commonQuestions: [
    {
      question: "How secretive is Apple really?",
      answer: "Very. Apple compartmentalizes information heavily. Even during interviews, you may not know which product you'd work on until after you're hired. NDAs are standard."
    },
    {
      question: "Does Apple hire bootcamp graduates?",
      answer: "Yes, but it's competitive. Apple values practical skills and shipped products. A polished iOS app in the App Store can be more valuable than credentials."
    },
    {
      question: "What makes Apple's interview different?",
      answer: "Apple places heavy emphasis on design thinking and attention to detail, even for non-design roles. They want people who obsess over the user experience."
    },
    {
      question: "How important is iOS experience for Apple engineering roles?",
      answer: "Very important for client-side roles. For infrastructure/services roles, general systems experience is acceptable, but familiarity with Apple ecosystem is valued."
    }
  ],
  salaryRange: {
    entry: "$140,000+",
    mid: "$200,000+",
    senior: "$300,000+"
  },
  benefits: [
    "RSU grants", "401k matching", "Health insurance", "Employee discounts",
    "Fitness centers", "Parental leave", "Education assistance", "Apple products"
  ],
  hiringTimeline: "4-8 weeks"
};

export default function HowToGetHiredAtApple() {
  return <CompanyHiringGuide company={appleData} />;
}