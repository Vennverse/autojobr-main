import CompanyHiringGuide, { CompanyData } from "./company-hiring-guide";

const googleData: CompanyData = {
  name: "Google",
  slug: "google",
  description: "Google is one of the world's most desirable employers, known for innovative products, exceptional benefits, and a culture that values creativity and impact. Getting hired at Google requires preparation, but it's achievable with the right approach.",
  industry: "Technology / Internet",
  founded: "1998",
  headquarters: "Mountain View, CA",
  employees: "180,000+",
  culture: [
    "Data-driven decision making (Googleyness)",
    "Innovation and 20% time for personal projects",
    "Flat organizational structure",
    "Diverse and inclusive workplace",
    "Focus on user impact and solving big problems",
    "Collaborative team environment"
  ],
  interviewProcess: [
    {
      stage: "Online Application",
      description: "Submit your resume through Google Careers. Use keywords from the job description and highlight quantifiable achievements. Referrals significantly increase your chances.",
      duration: "1-2 weeks",
      tips: [
        "Tailor your resume with metrics (e.g., 'Increased efficiency by 40%')",
        "Apply to multiple relevant roles",
        "Get a referral from a current Googler if possible"
      ]
    },
    {
      stage: "Recruiter Screen",
      description: "A 30-45 minute call with a recruiter to discuss your background, interest in Google, and role fit. They'll explain the interview process and timeline.",
      duration: "30-45 min",
      tips: [
        "Research Google's products and recent news",
        "Prepare your 'Tell me about yourself' pitch",
        "Have specific questions about the role ready"
      ]
    },
    {
      stage: "Technical Phone Screen",
      description: "For technical roles: 45-60 minute coding interview via Google Meet with a shared document. You'll solve 1-2 algorithm problems while explaining your thought process.",
      duration: "45-60 min",
      tips: [
        "Practice coding in a Google Doc (no IDE autocomplete)",
        "Think out loud and communicate your approach",
        "Ask clarifying questions before coding"
      ]
    },
    {
      stage: "Onsite Interviews (Virtual or In-Person)",
      description: "4-5 rounds of interviews including coding, system design (for senior roles), and behavioral/Googleyness interviews. Each is 45 minutes.",
      duration: "4-5 hours",
      tips: [
        "Practice LeetCode medium/hard problems",
        "Study system design for senior roles",
        "Prepare STAR stories for behavioral questions",
        "Show intellectual humility and collaboration"
      ]
    },
    {
      stage: "Hiring Committee Review",
      description: "Your interview feedback is reviewed by a hiring committee of senior Googlers. This committee makes the hiring recommendation independent of the interviewers.",
      duration: "1-2 weeks",
      tips: [
        "The HC looks at all signals holistically",
        "Strong performance in one area can offset a weaker area",
        "They value growth potential and learning ability"
      ]
    },
    {
      stage: "Team Matching & Offer",
      description: "Once approved, you'll be matched with teams that have openings. You may have 'host matching' calls with potential teams before receiving an offer.",
      duration: "1-4 weeks",
      tips: [
        "Research teams you're interested in",
        "Ask about the team's projects and culture",
        "Negotiate your offer - Google expects it"
      ]
    }
  ],
  popularRoles: [
    {
      title: "Software Engineer (L3)",
      salaryRange: "$150K - $200K",
      requirements: ["CS degree or equivalent", "Data structures & algorithms", "1-3 years experience"]
    },
    {
      title: "Senior Software Engineer (L5)",
      salaryRange: "$250K - $350K",
      requirements: ["5+ years experience", "System design expertise", "Technical leadership"]
    },
    {
      title: "Product Manager",
      salaryRange: "$180K - $280K",
      requirements: ["MBA or technical background", "Product sense", "Data analysis skills"]
    },
    {
      title: "Data Scientist",
      salaryRange: "$170K - $250K",
      requirements: ["Statistics/ML expertise", "Python/SQL proficiency", "PhD preferred"]
    }
  ],
  technicalSkills: [
    "Data Structures", "Algorithms", "System Design", "Python", "Java", "C++",
    "SQL", "Distributed Systems", "Machine Learning", "Cloud (GCP)"
  ],
  softSkills: [
    "Googleyness (intellectual humility, collaboration)",
    "Problem-solving mindset",
    "Clear communication",
    "Leadership without authority",
    "Adaptability"
  ],
  interviewTips: [
    "Master LeetCode medium and hard problems - practice at least 150 problems",
    "Study the STAR method for behavioral questions",
    "Practice coding in a Google Doc without auto-complete",
    "Research Google's products and be ready to discuss improvements",
    "Show enthusiasm for Google's mission to organize the world's information",
    "Demonstrate intellectual humility - say 'I don't know' when appropriate"
  ],
  applicationTips: [
    "Get a referral from a current Googler - it significantly increases response rate",
    "Quantify all achievements on your resume with metrics",
    "Apply to multiple roles that match your skills",
    "Include relevant side projects and open source contributions",
    "Highlight any experience with large-scale systems",
    "Tailor your resume for each specific role"
  ],
  commonQuestions: [
    {
      question: "How long does the Google interview process take?",
      answer: "The entire process typically takes 4-8 weeks from application to offer. The onsite loop is usually completed in one day, but hiring committee review and team matching can take additional weeks."
    },
    {
      question: "What is Googleyness?",
      answer: "Googleyness refers to qualities Google values in candidates: intellectual humility, conscientiousness, comfort with ambiguity, ability to collaborate effectively, and being generally pleasant to work with."
    },
    {
      question: "Can I reapply if I fail the Google interview?",
      answer: "Yes, you can reapply after 6-12 months. Use this time to improve your technical skills and address feedback from your previous interview."
    },
    {
      question: "Is a referral necessary to get hired at Google?",
      answer: "While not required, referrals significantly increase your chances of getting an interview. Referrals are reviewed faster and bypass some initial screening."
    }
  ],
  salaryRange: {
    entry: "$150,000+",
    mid: "$200,000+",
    senior: "$300,000+"
  },
  benefits: [
    "Unlimited PTO", "401k matching", "Free meals", "On-site gym",
    "Parental leave", "Learning stipend", "Stock grants", "Health insurance"
  ],
  hiringTimeline: "4-8 weeks"
};

export default function HowToGetHiredAtGoogle() {
  return <CompanyHiringGuide company={googleData} />;
}