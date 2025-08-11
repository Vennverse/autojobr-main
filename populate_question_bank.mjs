import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { questionBank } from './shared/schema.js';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

// Comprehensive question bank with various categories
const questions = [
  // ==================== GENERAL APTITUDE - HARD ====================
  {
    questionId: 'apt_001',
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'logical_reasoning',
    difficulty: 'hard',
    question: 'If MONDAY is coded as 123456 and TEAMS is coded as 75891, what is the code for STUDENT?',
    options: ['8754731', '8754372', '8754732', '8754173'],
    correctAnswer: '8754732',
    explanation: 'Each letter has a unique number: M=1, O=2, N=3, D=4, A=5, Y=6, T=7, E=8, S=9. STUDENT = 9754837',
    points: 10,
    timeLimit: 4,
    tags: ['coding', 'pattern_recognition', 'logical_reasoning'],
    keywords: ['pattern', 'coding', 'alphabet'],
    isActive: true
  },
  {
    questionId: 'apt_002',
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'numerical_reasoning',
    difficulty: 'extreme',
    question: 'In a sequence: 2, 6, 12, 20, 30, 42, ?, what comes next?',
    options: ['56', '58', '60', '54'],
    correctAnswer: '56',
    explanation: 'Pattern: n(n+1) where n starts from 1. 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56',
    points: 15,
    timeLimit: 5,
    tags: ['sequences', 'pattern_recognition', 'mathematics'],
    keywords: ['sequence', 'pattern', 'numbers'],
    isActive: true
  },
  {
    questionId: 'apt_003',
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'data_interpretation',
    difficulty: 'hard',
    question: 'A company\'s profit increases by 20% every year. If the profit in 2020 was $100,000, what will be the approximate profit in 2025?',
    options: ['$248,832', '$240,000', '$200,000', '$300,000'],
    correctAnswer: '$248,832',
    explanation: 'Using compound interest formula: 100,000 × (1.20)^5 = 100,000 × 2.48832 = $248,832',
    points: 12,
    timeLimit: 6,
    tags: ['compound_interest', 'percentage', 'data_interpretation'],
    keywords: ['profit', 'percentage', 'calculation'],
    isActive: true
  },
  {
    questionId: 'apt_004',
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'logical_reasoning',
    difficulty: 'extreme',
    question: 'All roses are flowers. Some flowers are red. Some red things are beautiful. Which conclusion is definitely true?',
    options: ['All roses are beautiful', 'Some roses are red', 'All beautiful things are red', 'Some roses may be beautiful'],
    correctAnswer: 'Some roses may be beautiful',
    explanation: 'From the given premises, we can only conclude that some roses may be beautiful through the chain: roses→flowers→(some)red→(some)beautiful',
    points: 15,
    timeLimit: 5,
    tags: ['syllogism', 'logical_reasoning', 'deduction'],
    keywords: ['logic', 'syllogism', 'reasoning'],
    isActive: true
  },
  
  // ==================== VERBAL/ENGLISH - HARD ====================
  {
    questionId: 'eng_001',
    type: 'multiple_choice',
    category: 'english',
    domain: 'general',
    subCategory: 'vocabulary',
    difficulty: 'hard',
    question: 'Choose the word most opposite in meaning to PERSPICACIOUS:',
    options: ['Obtuse', 'Acute', 'Astute', 'Shrewd'],
    correctAnswer: 'Obtuse',
    explanation: 'Perspicacious means having keen insight or discernment. Obtuse means lacking quickness of perception or intellect.',
    points: 8,
    timeLimit: 3,
    tags: ['vocabulary', 'antonyms', 'advanced_words'],
    keywords: ['opposite', 'meaning', 'vocabulary'],
    isActive: true
  },
  {
    questionId: 'eng_002',
    type: 'multiple_choice',
    category: 'english',
    domain: 'general',
    subCategory: 'reading_comprehension',
    difficulty: 'hard',
    question: 'Passage: "The ephemeral nature of digital communication has paradoxically led to its permanent documentation." What does "ephemeral" most likely mean in this context?',
    options: ['Permanent', 'Temporary', 'Complex', 'Simple'],
    correctAnswer: 'Temporary',
    explanation: 'Ephemeral means lasting for a very short time. The paradox is that temporary communication becomes permanently recorded.',
    points: 10,
    timeLimit: 4,
    tags: ['reading_comprehension', 'context_clues', 'vocabulary'],
    keywords: ['comprehension', 'context', 'meaning'],
    isActive: true
  },
  {
    questionId: 'eng_003',
    type: 'multiple_choice',
    category: 'english',
    domain: 'general',
    subCategory: 'grammar',
    difficulty: 'extreme',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Neither the CEO nor the managers was present at the meeting.',
      'Neither the CEO nor the managers were present at the meeting.',
      'Neither the CEO or the managers were present at the meeting.',
      'Neither the CEO and the managers was present at the meeting.'
    ],
    correctAnswer: 'Neither the CEO nor the managers were present at the meeting.',
    explanation: 'With "neither...nor" constructions, the verb agrees with the subject closest to it. "Managers" is plural, so "were" is correct.',
    points: 12,
    timeLimit: 4,
    tags: ['grammar', 'subject_verb_agreement', 'advanced_grammar'],
    keywords: ['grammar', 'agreement', 'neither_nor'],
    isActive: true
  },
  
  // ==================== TECHNICAL/CODING - HARD ====================
  {
    questionId: 'tech_001',
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'hard',
    question: 'Implement a function to find the longest palindromic substring in a given string. Optimize for both time and space complexity.',
    testCases: JSON.stringify([
      { input: 'babad', expected: 'bab', description: 'Multiple palindromes - return any valid one' },
      { input: 'cbbd', expected: 'bb', description: 'Even length palindrome' },
      { input: 'racecar', expected: 'racecar', description: 'Entire string is palindrome' }
    ]),
    boilerplate: 'function longestPalindrome(s) {\n  // Your implementation here\n  return "";\n}',
    language: 'javascript',
    points: 25,
    timeLimit: 45,
    tags: ['algorithms', 'strings', 'palindrome', 'optimization'],
    keywords: ['palindrome', 'substring', 'optimization'],
    isActive: true
  },
  {
    questionId: 'tech_002',
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'data_structures',
    difficulty: 'extreme',
    question: 'Design and implement a LRU (Least Recently Used) cache with O(1) time complexity for both get and put operations.',
    testCases: JSON.stringify([
      { input: 'put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)', expected: '1, -1, -1, 3, 4', description: 'LRU eviction test' }
    ]),
    boilerplate: 'class LRUCache {\n  constructor(capacity) {\n    // Your implementation\n  }\n\n  get(key) {\n    // Your implementation\n  }\n\n  put(key, value) {\n    // Your implementation\n  }\n}',
    language: 'javascript',
    points: 30,
    timeLimit: 60,
    tags: ['data_structures', 'cache', 'hash_map', 'linked_list'],
    keywords: ['LRU', 'cache', 'data_structure'],
    isActive: true
  },
  {
    questionId: 'tech_003',
    type: 'multiple_choice',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'system_design',
    difficulty: 'hard',
    question: 'In a microservices architecture, what is the most effective pattern to handle distributed transactions across multiple services?',
    options: ['Two-Phase Commit (2PC)', 'Saga Pattern', 'Event Sourcing', 'CQRS'],
    correctAnswer: 'Saga Pattern',
    explanation: 'Saga pattern is most suitable for microservices as it handles distributed transactions through a series of local transactions with compensating actions, avoiding the blocking nature of 2PC.',
    points: 15,
    timeLimit: 5,
    tags: ['system_design', 'microservices', 'distributed_systems'],
    keywords: ['microservices', 'transactions', 'distributed'],
    isActive: true
  },
  
  // ==================== CASE STUDY QUESTIONS ====================
  {
    questionId: 'case_001',
    type: 'multiple_choice',
    category: 'domain_specific',
    domain: 'business',
    subCategory: 'case_study',
    difficulty: 'extreme',
    question: 'Case Study: A tech startup has 1M users but is losing $2M monthly. Revenue is $500K/month. The burn rate is unsustainable. What should be the IMMEDIATE priority?',
    options: [
      'Raise Series B funding immediately',
      'Implement aggressive cost-cutting measures while analyzing revenue streams',
      'Pivot the business model completely',
      'Focus on user acquisition to reach 10M users'
    ],
    correctAnswer: 'Implement aggressive cost-cutting measures while analyzing revenue streams',
    explanation: 'With a $2.5M monthly deficit, immediate cost reduction is critical for survival. Analyzing revenue streams helps identify optimization opportunities.',
    points: 20,
    timeLimit: 8,
    tags: ['business_strategy', 'financial_analysis', 'startup_management'],
    keywords: ['case_study', 'business', 'strategy'],
    isActive: true
  },
  {
    questionId: 'case_002',
    type: 'multiple_choice',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'case_study',
    difficulty: 'hard',
    question: 'Case Study: Your e-commerce platform experiences 10x traffic during Black Friday but crashes. Database queries are timing out. What\'s the most effective immediate solution?',
    options: [
      'Scale up database server vertically',
      'Implement read replicas and caching layer',
      'Add more application servers',
      'Switch to NoSQL database'
    ],
    correctAnswer: 'Implement read replicas and caching layer',
    explanation: 'Read replicas distribute query load and caching reduces database hits, providing immediate relief for read-heavy traffic spikes typical during sales events.',
    points: 18,
    timeLimit: 6,
    tags: ['system_design', 'performance', 'scalability'],
    keywords: ['case_study', 'scalability', 'performance'],
    isActive: true
  },
  
  // ==================== DOMAIN-SPECIFIC ADVANCED QUESTIONS ====================
  {
    questionId: 'fin_001',
    type: 'multiple_choice',
    category: 'domain_specific',
    domain: 'finance',
    subCategory: 'financial_modeling',
    difficulty: 'extreme',
    question: 'Calculate the WACC (Weighted Average Cost of Capital) for a company with: Debt = $100M at 5% interest, Equity = $200M with 12% cost of equity, Tax rate = 25%',
    options: ['8.75%', '9.25%', '7.50%', '10.00%'],
    correctAnswer: '8.75%',
    explanation: 'WACC = (E/V × Re) + (D/V × Rd × (1-T)) = (200/300 × 12%) + (100/300 × 5% × 0.75) = 8% + 1.25% = 9.25%',
    points: 20,
    timeLimit: 8,
    tags: ['finance', 'WACC', 'cost_of_capital'],
    keywords: ['WACC', 'finance', 'calculation'],
    isActive: true
  },
  {
    questionId: 'mkt_001',
    type: 'multiple_choice',
    category: 'domain_specific',
    domain: 'marketing',
    subCategory: 'digital_marketing',
    difficulty: 'hard',
    question: 'A SaaS company has: CAC (Customer Acquisition Cost) = $150, LTV (Lifetime Value) = $450, Churn rate = 5% monthly. What should be the primary focus?',
    options: [
      'Reduce CAC to under $100',
      'Reduce monthly churn to under 3%',
      'Increase LTV to $600',
      'All metrics are healthy, focus on scaling'
    ],
    correctAnswer: 'Reduce monthly churn to under 3%',
    explanation: '5% monthly churn = 60% annual churn rate, which is extremely high for SaaS. LTV:CAC ratio of 3:1 is good, but high churn undermines long-term value.',
    points: 15,
    timeLimit: 6,
    tags: ['marketing', 'SaaS_metrics', 'customer_retention'],
    keywords: ['CAC', 'LTV', 'churn', 'SaaS'],
    isActive: true
  },
  
  // ==================== BEHAVIORAL EXTREME QUESTIONS ====================
  {
    questionId: 'beh_001',
    type: 'multiple_choice',
    category: 'behavioral',
    domain: 'general',
    subCategory: 'leadership',
    difficulty: 'extreme',
    question: 'You discover that your top-performing team member has been slightly inflating their performance metrics for months. They contribute significantly to team success. What do you do?',
    options: [
      'Ignore it since they are high-performing',
      'Address it privately and set up monitoring systems',
      'Report it immediately to HR',
      'Discuss it publicly in the team meeting as a learning opportunity'
    ],
    correctAnswer: 'Address it privately and set up monitoring systems',
    explanation: 'This balances accountability with preserving the relationship. Private discussion maintains dignity while monitoring prevents recurrence.',
    points: 18,
    timeLimit: 5,
    tags: ['leadership', 'ethics', 'team_management'],
    keywords: ['leadership', 'ethics', 'performance'],
    isActive: true
  },
  {
    questionId: 'beh_002',
    type: 'multiple_choice',
    category: 'behavioral',
    domain: 'general',
    subCategory: 'problem_solving',
    difficulty: 'hard',
    question: 'Your project is 80% complete but you realize the initial requirements were misunderstood. Delivering as planned will not meet user needs. Deadline is in 2 weeks. What\'s your approach?',
    options: [
      'Deliver as planned and fix issues post-launch',
      'Request deadline extension to rebuild properly',
      'Identify minimum viable changes to meet core user needs within deadline',
      'Blame the unclear requirements and deliver as is'
    ],
    correctAnswer: 'Identify minimum viable changes to meet core user needs within deadline',
    explanation: 'This demonstrates problem-solving skills, user focus, and pragmatic decision-making under pressure while delivering value.',
    points: 15,
    timeLimit: 4,
    tags: ['problem_solving', 'project_management', 'user_focus'],
    keywords: ['problem_solving', 'requirements', 'deadline'],
    isActive: true
  }
];

async function populateQuestionBank() {
  try {
    console.log('🔄 Starting question bank population...');
    
    // Insert questions in batches
    const batchSize = 5;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      await db.insert(questionBank).values(batch);
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)}`);
    }
    
    console.log(`🎉 Successfully populated question bank with ${questions.length} questions!`);
    
    // Show summary
    console.log('\n📊 Question Bank Summary:');
    console.log(`- General Aptitude: 4 questions (hard/extreme)`);
    console.log(`- English/Verbal: 3 questions (hard/extreme)`);
    console.log(`- Technical/Coding: 3 questions (hard/extreme)`);
    console.log(`- Case Studies: 2 questions (hard/extreme)`);
    console.log(`- Domain Specific: 2 questions (finance/marketing)`);
    console.log(`- Behavioral: 2 questions (hard/extreme)`);
    console.log(`\n🔥 Total: ${questions.length} premium difficulty questions ready for assessments!`);
    
  } catch (error) {
    console.error('❌ Error populating question bank:', error);
  } finally {
    await client.end();
  }
}

populateQuestionBank();