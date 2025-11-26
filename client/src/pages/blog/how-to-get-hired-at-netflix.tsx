import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const netflixData: CompanyData = {
  name: "Netflix",
  slug: "netflix",
  description: "Netflix is the world's leading streaming entertainment service with over 230 million subscribers. Known for its unique culture of 'Freedom and Responsibility', Netflix pays top-of-market salaries and hires only the best in their respective fields.",
  industry: "Technology / Entertainment / Streaming",
  founded: "1997",
  headquarters: "Los Gatos, CA",
  employees: "12,000+",
  culture: [
    "Freedom and Responsibility",
    "Context, not control",
    "Highly aligned, loosely coupled",
    "Pay top of market",
    "Keeper test for all employees",
    "Radical candor and feedback"
  ],
  interviewProcess: [
    {
      stage: "Online Application & Resume Review",
      description: "Apply through Netflix Jobs. Netflix is highly selective and looks for 'stunning colleagues.' Referrals are extremely valuable.",
      duration: "1-3 weeks",
      tips: [
        "Highlight 'stunning' achievements in your resume",
        "Show evidence of high performance and impact",
        "Get a referral - Netflix trusts employee judgment"
      ]
    },
    {
      stage: "Recruiter Screen",
      description: "30-45 minute call discussing your background, interest in Netflix, and cultural fit. They'll explain Netflix's unique culture.",
      duration: "30-45 min",
      tips: [
        "Read the Netflix Culture Deck thoroughly",
        "Be prepared to discuss the 'Keeper Test'",
        "Show self-awareness and candor"
      ]
    },
    {
      stage: "Hiring Manager Screen",
      description: "45-60 minute conversation with the hiring manager about your experience, the role, and mutual fit.",
      duration: "45-60 min",
      tips: [
        "Ask deep questions about the team and challenges",
        "Show strategic thinking about the domain",
        "Demonstrate you can operate with high autonomy"
      ]
    },
    {
      stage: "Technical/Functional Interviews",
      description: "2-3 interviews with team members. For engineering: coding and system design. For other roles: functional expertise assessments.",
      duration: "2-3 hours",
      tips: [
        "Practice designing streaming systems at scale",
        "Show deep expertise in your domain",
        "Demonstrate judgment over just skills"
      ]
    },
    {
      stage: "Culture Fit Interviews",
      description: "1-2 interviews focused on Netflix culture values: judgment, communication, curiosity, courage, passion, selflessness, innovation, inclusion, integrity, impact.",
      duration: "1-2 hours",
      tips: [
        "Give specific examples of radical candor",
        "Show how you've operated with high autonomy",
        "Discuss how you handle disagreement"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Senior Software Engineer",
      salaryRange: "$300K - $450K",
      requirements: ["8+ years experience", "Distributed systems", "High autonomy"]
    },
    {
      title: "Engineering Manager",
      salaryRange: "$350K - $500K",
      requirements: ["People leadership", "Technical depth", "Strategic thinking"]
    },
    {
      title: "Data Scientist",
      salaryRange: "$250K - $380K",
      requirements: ["ML/Statistics", "Business impact", "PhD preferred"]
    },
    {
      title: "Product Manager",
      salaryRange: "$280K - $400K",
      requirements: ["Product strategy", "Data-driven", "Entertainment background helps"]
    }
  ],
  technicalSkills: [
    "Java", "Python", "Microservices", "AWS", "Distributed Systems",
    "Streaming Technologies", "Machine Learning", "Data Engineering", "Kubernetes"
  ],
  softSkills: [
    "Judgment over process",
    "Radical candor",
    "High performance mindset",
    "Self-motivation",
    "Context awareness",
    "Courage to speak up"
  ],
  interviewTips: [
    "Read the Netflix Culture Deck multiple times - it defines the interview",
    "Be prepared to discuss times you gave and received difficult feedback",
    "Show you can thrive in a 'Freedom and Responsibility' environment",
    "Netflix wants senior, high-performing individuals - show don't tell",
    "Discuss times you made decisions with incomplete information",
    "Demonstrate you don't need to be managed"
  ],
  applicationTips: [
    "Netflix typically hires senior talent - build expertise first",
    "Get a referral from a Netflix employee",
    "Show track record of exceptional performance in your resume",
    "Highlight experience with high-scale systems",
    "Apply only if you genuinely align with Netflix culture",
    "Include quantifiable business impact in your resume"
  ],
  commonQuestions: [
    {
      question: "What is the Netflix Keeper Test?",
      answer: "Managers ask: 'If this person wanted to leave, would I fight hard to keep them?' If the answer is no, Netflix provides a generous severance package. This keeps the team at 'stunning' level."
    },
    {
      question: "Does Netflix really pay top of market?",
      answer: "Yes. Netflix pays in the top 5-10% of market for each role. They don't negotiate down - they make their best offer upfront. All cash, no stock grants."
    },
    {
      question: "How does Netflix's 'Freedom and Responsibility' work?",
      answer: "Netflix gives employees maximum freedom with the expectation of maximum responsibility. There's minimal process, no vacation tracking, and high expectations for judgment and impact."
    },
    {
      question: "Is Netflix a good place for junior engineers?",
      answer: "Netflix typically hires senior talent (8+ years experience for engineering). They expect employees to hit the ground running without mentorship structures."
    }
  ],
  salaryRange: {
    entry: "N/A (Rarely hires entry-level)",
    mid: "$300,000+",
    senior: "$450,000+"
  },
  benefits: [
    "Top-of-market salary", "Unlimited PTO", "No expense reports under $5K",
    "Generous parental leave", "Health insurance", "Stock options"
  ],
  hiringTimeline: "3-6 weeks"
};

export default function HowToGetHiredAtNetflix() {
  return <CompanyHiringGuide company={netflixData} />;
}