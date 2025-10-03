
import { z } from 'zod';

export const interviewPrepSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  jobDescription: z.string().optional(),
  requirements: z.array(z.string()).optional()
});

// Company-specific insights database
const COMPANY_INSIGHTS: Record<string, any> = {
  google: {
    culture: 'Data-driven, innovative, collaborative. Focus on solving big problems at scale.',
    interviewStyle: 'Coding questions, system design, behavioral (Googleyness)',
    keyValues: ['Innovation', 'User focus', 'Think big', 'Collaboration'],
    tips: 'Practice algorithms and system design. Show passion for technology and user impact.'
  },
  meta: {
    culture: 'Move fast, build things, impact-focused. High autonomy and ownership.',
    interviewStyle: 'Coding, system design, product sense, behavioral',
    keyValues: ['Move fast', 'Be bold', 'Focus on impact', 'Build awesome things'],
    tips: 'Demonstrate speed and impact. Show product thinking and user empathy.'
  },
  amazon: {
    culture: 'Customer-obsessed, ownership-driven, frugal, results-oriented.',
    interviewStyle: 'LP-based behavioral, coding, system design',
    keyValues: ['Customer obsession', 'Ownership', 'Invent and simplify', 'Bias for action'],
    tips: 'Master Amazon Leadership Principles. Use STAR method for behavioral questions.'
  },
  microsoft: {
    culture: 'Growth mindset, inclusive, customer-focused, innovation.',
    interviewStyle: 'Technical depth, problem-solving, collaboration',
    keyValues: ['Growth mindset', 'Customer focus', 'Diversity', 'Innovation'],
    tips: 'Show learning agility. Demonstrate collaborative problem-solving.'
  },
  apple: {
    culture: 'Excellence, design-focused, secretive, detail-oriented.',
    interviewStyle: 'Technical expertise, design thinking, culture fit',
    keyValues: ['Excellence', 'Innovation', 'User experience', 'Privacy'],
    tips: 'Show attention to detail. Demonstrate passion for great user experiences.'
  }
};

// Role-specific technical topics
const ROLE_TECHNICAL_TOPICS: Record<string, string[]> = {
  'software engineer': [
    'Data structures (arrays, trees, graphs, hash tables)',
    'Algorithms (sorting, searching, dynamic programming)',
    'Object-oriented design principles',
    'Time and space complexity analysis',
    'System design basics (scalability, databases)',
    'Testing and debugging strategies',
    'Version control (Git workflow)'
  ],
  'frontend developer': [
    'JavaScript/TypeScript fundamentals',
    'React/Vue/Angular framework patterns',
    'CSS layout and responsive design',
    'Browser APIs and DOM manipulation',
    'State management (Redux, MobX)',
    'Performance optimization techniques',
    'Accessibility (WCAG standards)'
  ],
  'backend developer': [
    'RESTful API design',
    'Database design (SQL vs NoSQL)',
    'Authentication and authorization',
    'Microservices architecture',
    'Caching strategies (Redis, Memcached)',
    'Message queues (RabbitMQ, Kafka)',
    'API security and rate limiting'
  ],
  'data scientist': [
    'Statistical analysis and hypothesis testing',
    'Machine learning algorithms (supervised/unsupervised)',
    'Feature engineering techniques',
    'Model evaluation metrics',
    'Python libraries (pandas, scikit-learn)',
    'Data visualization best practices',
    'A/B testing and experimentation'
  ],
  'devops engineer': [
    'CI/CD pipeline design',
    'Container orchestration (Kubernetes)',
    'Infrastructure as Code (Terraform, CloudFormation)',
    'Monitoring and logging (Prometheus, ELK)',
    'Cloud platforms (AWS, Azure, GCP)',
    'Security and compliance automation',
    'Disaster recovery planning'
  ]
};

export class InterviewPrepService {
  
  generatePreparation(data: z.infer<typeof interviewPrepSchema>) {
    const { jobTitle, company, jobDescription = '', requirements = [] } = data;
    
    // Get company insights
    const companyKey = company.toLowerCase();
    const companyInfo = COMPANY_INSIGHTS[companyKey] || {
      culture: `${company} values innovation, teamwork, and results-driven performance.`,
      interviewStyle: 'Technical skills, problem-solving, and cultural fit',
      keyValues: ['Excellence', 'Innovation', 'Collaboration', 'Growth'],
      tips: 'Research the company thoroughly. Show genuine interest in their mission.'
    };
    
    // Get role-specific technical topics
    const roleLower = jobTitle.toLowerCase();
    let technicalTopics = ROLE_TECHNICAL_TOPICS[roleLower];
    
    // Fuzzy match for role
    if (!technicalTopics) {
      for (const [role, topics] of Object.entries(ROLE_TECHNICAL_TOPICS)) {
        if (roleLower.includes(role) || role.includes(roleLower)) {
          technicalTopics = topics;
          break;
        }
      }
    }
    
    // Default topics
    if (!technicalTopics) {
      technicalTopics = ROLE_TECHNICAL_TOPICS['software engineer'];
    }
    
    // Generate interview questions
    const questions = this.generateQuestions(jobTitle, company, requirements);
    
    // Generate preparation tips
    const tips = this.generateTips(companyInfo, jobTitle);
    
    return {
      companyInsights: `${company} Culture: ${companyInfo.culture}\n\nInterview Style: ${companyInfo.interviewStyle}\n\nKey Values: ${companyInfo.keyValues.join(', ')}`,
      questions,
      tips,
      technicalTopics,
      keyValues: companyInfo.keyValues,
      preparationChecklist: this.generateChecklist(jobTitle, company)
    };
  }
  
  private generateQuestions(role: string, company: string, requirements: string[]): string[] {
    const questions = [
      `Tell me about yourself and why you're interested in the ${role} position at ${company}.`,
      `What do you know about ${company} and why do you want to work here?`,
      `Describe a challenging project you've worked on and how you overcame obstacles.`,
      `How do you stay updated with the latest technology trends in your field?`,
      `Tell me about a time when you had to work with a difficult team member.`
    ];
    
    // Add technical questions based on role
    if (role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer')) {
      questions.push(
        'Explain the difference between REST and GraphQL APIs.',
        'How would you optimize a slow database query?',
        'Describe your approach to writing testable code.'
      );
    }
    
    if (role.toLowerCase().includes('senior') || role.toLowerCase().includes('lead')) {
      questions.push(
        'How do you mentor junior team members?',
        'Describe your experience with system design and architecture.',
        'How do you handle technical debt and prioritize refactoring?'
      );
    }
    
    // Add requirement-based questions
    requirements.forEach(req => {
      if (req.toLowerCase().includes('agile') || req.toLowerCase().includes('scrum')) {
        questions.push('Describe your experience with Agile development methodologies.');
      }
      if (req.toLowerCase().includes('cloud')) {
        questions.push('What cloud platforms have you worked with and what did you build?');
      }
    });
    
    return questions;
  }
  
  private generateTips(companyInfo: any, role: string): string {
    let tips = `Interview Preparation Tips:\n\n`;
    tips += `1. Research: ${companyInfo.tips}\n\n`;
    tips += `2. Practice STAR Method: Structure your behavioral answers using Situation, Task, Action, Result.\n\n`;
    tips += `3. Technical Preparation: Review fundamental concepts and practice coding problems on LeetCode/HackerRank.\n\n`;
    tips += `4. Ask Questions: Prepare 3-5 thoughtful questions about the team, projects, and company culture.\n\n`;
    tips += `5. Mock Interviews: Practice with a friend or use platforms like Pramp for realistic interview simulation.\n\n`;
    
    if (role.toLowerCase().includes('senior') || role.toLowerCase().includes('lead')) {
      tips += `6. Leadership Stories: Prepare examples of mentoring, technical leadership, and cross-team collaboration.\n\n`;
    }
    
    tips += `7. Follow-up: Send a thank-you email within 24 hours expressing your interest and highlighting key discussion points.`;
    
    return tips;
  }
  
  private generateChecklist(role: string, company: string): string[] {
    return [
      `✓ Research ${company}'s recent news, products, and culture`,
      '✓ Review job description and match your experience to requirements',
      '✓ Prepare 3-5 STAR method stories showcasing your achievements',
      '✓ Practice coding problems (easy, medium difficulty)',
      '✓ Review system design patterns and scalability concepts',
      '✓ Prepare questions to ask the interviewer',
      '✓ Test your internet connection and interview setup (if remote)',
      '✓ Dress professionally and arrive 10 minutes early',
      '✓ Bring copies of your resume and portfolio samples',
      '✓ Review your own resume to discuss any project in detail'
    ];
  }
}

export const interviewPrepService = new InterviewPrepService();
