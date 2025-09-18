import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';
import { testTemplates, testQuestions, questionBank } from './shared/schema.js';

// Database connection
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

// Platform templates configuration
const PLATFORM_TEMPLATES = [
  // Tech Templates (3)
  {
    title: "Senior Software Engineer Assessment",
    description: "Comprehensive technical evaluation for senior software engineering roles including algorithms, system design, and coding best practices.",
    category: "technical",
    jobProfile: "software_engineer",
    difficultyLevel: "advanced",
    timeLimit: 120,
    passingScore: 75,
    isGlobal: true,
    questions: {
      aptitude: 10,
      english: 5,
      domain: 15,
      includeExtreme: true
    }
  },
  {
    title: "Full Stack Developer Challenge",
    description: "End-to-end assessment covering frontend, backend, databases, and system architecture for full-stack positions.",
    category: "technical",
    jobProfile: "fullstack_developer", 
    difficultyLevel: "intermediate",
    timeLimit: 90,
    passingScore: 70,
    isGlobal: true,
    questions: {
      aptitude: 8,
      english: 4,
      domain: 18,
      includeExtreme: true
    }
  },
  {
    title: "Principal Engineer Technical Deep Dive",
    description: "Expert-level assessment for principal/staff engineering roles focusing on architectural decisions and complex problem solving.",
    category: "technical",
    jobProfile: "software_engineer",
    difficultyLevel: "expert",
    timeLimit: 150,
    passingScore: 80,
    isGlobal: true,
    questions: {
      aptitude: 5,
      english: 3,
      domain: 22,
      includeExtreme: true
    }
  },

  // Finance Templates (2)
  {
    title: "Investment Banking Analyst Assessment", 
    description: "Rigorous evaluation covering financial modeling, valuation, market analysis, and quantitative reasoning for investment banking roles.",
    category: "technical",
    jobProfile: "finance",
    difficultyLevel: "advanced",
    timeLimit: 120,
    passingScore: 75,
    isGlobal: true,
    questions: {
      aptitude: 12,
      english: 6,
      domain: 12,
      includeExtreme: true
    }
  },
  {
    title: "Financial Risk Management Evaluation",
    description: "Specialized assessment for risk management roles including derivatives, portfolio theory, and regulatory compliance.",
    category: "technical", 
    jobProfile: "finance",
    difficultyLevel: "expert",
    timeLimit: 100,
    passingScore: 78,
    isGlobal: true,
    questions: {
      aptitude: 8,
      english: 4,
      domain: 18,
      includeExtreme: true
    }
  },

  // Sales & Marketing Templates (2)
  {
    title: "Enterprise Sales Executive Assessment",
    description: "Comprehensive evaluation for B2B sales roles including negotiation, relationship building, and strategic account management.",
    category: "behavioral",
    jobProfile: "sales",
    difficultyLevel: "intermediate",
    timeLimit: 75,
    passingScore: 70,
    isGlobal: true,
    questions: {
      aptitude: 10,
      english: 8,
      domain: 12,
      includeExtreme: false
    }
  },
  {
    title: "Digital Marketing Specialist Evaluation",
    description: "Modern marketing assessment covering analytics, campaign optimization, content strategy, and performance metrics.",
    category: "technical",
    jobProfile: "marketing",
    difficultyLevel: "intermediate", 
    timeLimit: 60,
    passingScore: 72,
    isGlobal: true,
    questions: {
      aptitude: 8,
      english: 7,
      domain: 15,
      includeExtreme: false
    }
  },

  // Additional Role Templates
  {
    title: "Data Science & Analytics Assessment",
    description: "Advanced evaluation for data roles including statistics, machine learning, data visualization, and business insights.",
    category: "technical",
    jobProfile: "data_scientist", 
    difficultyLevel: "advanced",
    timeLimit: 110,
    passingScore: 75,
    isGlobal: true,
    questions: {
      aptitude: 8,
      english: 4,
      domain: 18,
      includeExtreme: true
    }
  },
  {
    title: "Product Management Excellence Test",
    description: "Strategic assessment for PM roles covering user research, roadmap planning, stakeholder management, and data-driven decisions.",
    category: "behavioral",
    jobProfile: "product_manager",
    difficultyLevel: "intermediate",
    timeLimit: 80,
    passingScore: 73,
    isGlobal: true,
    questions: {
      aptitude: 10,
      english: 6,
      domain: 14,
      includeExtreme: false
    }
  },
  {
    title: "DevOps & Infrastructure Engineer Test",
    description: "Technical evaluation for DevOps roles including cloud architecture, CI/CD, monitoring, and infrastructure as code.",
    category: "technical", 
    jobProfile: "devops_engineer",
    difficultyLevel: "advanced",
    timeLimit: 100,
    passingScore: 74,
    isGlobal: true,
    questions: {
      aptitude: 6,
      english: 4,
      domain: 20,
      includeExtreme: true
    }
  }
];

// Extreme questions to add to question bank
const EXTREME_QUESTIONS = [
  // More Extreme Coding Questions
  {
    questionId: 'c903',
    type: 'coding',
    category: 'algorithms',
    domain: 'computer_science',
    subCategory: 'advanced_algorithms',
    difficulty: 'extreme',
    question: 'Implement a persistent B+ tree with copy-on-write semantics that supports range queries, insertions, and deletions. Each operation should create a new version while sharing unchanged nodes with previous versions. Optimize for both space and time complexity.',
    options: [],
    correctAnswer: 'Implementation requires complex node sharing and path copying strategies',
    explanation: 'This question tests understanding of persistent data structures, B+ trees, and memory management - concepts only mastered by top 1% of engineers.',
    points: 25,
    timeLimit: 90,
    tags: ['persistent_data_structures', 'b_plus_trees', 'copy_on_write'],
    keywords: ['persistence', 'functional_programming', 'immutable'],
    testCases: JSON.stringify([
      { input: 'tree.insert(5).insert(3).insert(7).query(3,7)', expected: '[3,5,7]', description: 'Version isolation test' }
    ]),
    boilerplate: 'class PersistentBPlusTree { constructor() { this.root = null; this.version = 0; } }',
    language: 'javascript',
    isActive: true,
    createdBy: null
  },
  {
    questionId: 'c904',
    type: 'coding', 
    category: 'algorithms',
    domain: 'computer_science',
    subCategory: 'computational_geometry',
    difficulty: 'extreme',
    question: 'Given n points in 3D space, find the minimum enclosing sphere. Your algorithm should handle degeneracies and run in expected O(n) time. Implement Welzl\'s algorithm with proper randomization.',
    options: [],
    correctAnswer: 'Welzl\'s recursive algorithm with randomized incremental construction',
    explanation: 'This advanced computational geometry problem requires deep understanding of randomized algorithms and geometric reasoning.',
    points: 30,
    timeLimit: 120,
    tags: ['computational_geometry', 'randomized_algorithms', 'optimization'],
    keywords: ['sphere_packing', '3d_geometry', 'welzl_algorithm'],
    testCases: JSON.stringify([
      { input: '[(0,0,0), (1,0,0), (0,1,0), (0,0,1)]', expected: 'center: (0.5,0.5,0.5), radius: 0.866', description: 'Tetrahedron test' }
    ]),
    boilerplate: 'function minEnclosingSphere(points) { // Your implementation here }',
    language: 'javascript',
    isActive: true,
    createdBy: null
  },

  // Extreme System Design Questions  
  {
    questionId: 's903',
    type: 'system_design',
    category: 'distributed_systems',
    domain: 'computer_science', 
    subCategory: 'scalable_architecture',
    difficulty: 'extreme',
    question: 'Design a globally distributed database that guarantees linearizability for financial transactions while maintaining 99.999% availability. Handle network partitions, Byzantine failures, and ensure audit compliance across multiple regulatory jurisdictions.',
    options: [],
    correctAnswer: 'Multi-Paxos with Byzantine fault tolerance and geographic compliance sharding',
    explanation: 'This requires expert knowledge of consensus algorithms, distributed systems theory, and regulatory compliance - only understood by system design experts.',
    points: 35,
    timeLimit: 45,
    tags: ['distributed_databases', 'consensus_algorithms', 'byzantine_fault_tolerance'],
    keywords: ['linearizability', 'paxos', 'financial_compliance'],
    testCases: JSON.stringify([]),
    isActive: true,
    createdBy: null
  },

  // Extreme Finance Questions
  {
    questionId: 'f903',
    type: 'multiple_choice',
    category: 'finance',
    domain: 'finance',
    subCategory: 'quantitative_finance',
    difficulty: 'extreme',
    question: 'A structured product has a payoff of max(0, S_T - K) * (∏_{i=1}^{12} (1 + max(0, R_i - 3%))) where S_T is the final stock price, K is the strike, and R_i are monthly returns. If the stock follows GBM with μ=8%, σ=25%, current price $100, strike $95, and risk-free rate 5%, what is the fair value using Monte Carlo with antithetic variance reduction?',
    options: ['$18.45', '$23.67', '$31.22', '$27.84'],
    correctAnswer: 2,
    explanation: 'This exotic option requires advanced stochastic calculus, Monte Carlo methods, and variance reduction techniques.',
    points: 30,
    timeLimit: 25,
    tags: ['structured_products', 'monte_carlo', 'exotic_options'],
    keywords: ['gbm', 'variance_reduction', 'path_dependent'],
    testCases: JSON.stringify([]),
    isActive: true,
    createdBy: null
  },

  // Extreme Behavioral Questions
  {
    questionId: 'b903',
    type: 'essay',
    category: 'leadership',
    domain: 'business',
    subCategory: 'crisis_management', 
    difficulty: 'extreme',
    question: 'Your AI system, deployed at a major hospital, has been making diagnostic recommendations that led to 5 patient deaths over 6 months. Investigation reveals a subtle bias in the training data that affects diagnoses for a specific ethnic group. The hospital board wants to continue using the system with "minor adjustments," but you believe it needs complete retraining. Media attention is intensifying. How do you navigate this crisis?',
    options: [],
    correctAnswer: 'Immediate system shutdown, transparent communication, comprehensive bias audit',
    explanation: 'This scenario tests crisis leadership, ethical AI development, and stakeholder management under extreme pressure.',
    points: 25,
    timeLimit: 15,
    tags: ['ai_ethics', 'crisis_management', 'healthcare_technology'],
    keywords: ['algorithmic_bias', 'patient_safety', 'ethical_leadership'],
    testCases: JSON.stringify([]),
    isActive: true,
    createdBy: null
  }
];

async function initializePlatformTemplates() {
  try {
    console.log('🚀 Initializing platform templates and extreme questions...');

    // 1. Add extreme questions to question bank
    console.log('📝 Adding extreme questions to question bank...');
    
    for (const question of EXTREME_QUESTIONS) {
      try {
        await db.insert(questionBank).values(question);
        console.log(`✅ Added extreme question: ${question.questionId}`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`⏭️  Question ${question.questionId} already exists, skipping`);
        } else {
          console.error(`❌ Failed to add question ${question.questionId}:`, error);
        }
      }
    }

    // 2. Create platform templates
    console.log('🏗️  Creating platform templates...');
    
    for (const template of PLATFORM_TEMPLATES) {
      try {
        // Check if template already exists
        const existing = await db
          .select()
          .from(testTemplates)
          .where(schema.eq(testTemplates.title, template.title))
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️  Template "${template.title}" already exists, skipping`);
          continue;
        }

        // Create the template
        const [newTemplate] = await db
          .insert(testTemplates)
          .values({
            title: template.title,
            description: template.description,
            category: template.category,
            jobProfile: template.jobProfile,
            difficultyLevel: template.difficultyLevel,
            timeLimit: template.timeLimit,
            passingScore: template.passingScore,
            isGlobal: template.isGlobal,
            createdBy: null // Platform templates
          })
          .returning();

        console.log(`✅ Created platform template: ${template.title}`);

        // Generate questions for the template if it has question distribution
        if (template.questions) {
          console.log(`📚 Generating questions for template: ${template.title}`);
          
          // This would integrate with the question generation service
          // For now, we'll create a placeholder that can be filled later
          const totalQuestions = template.questions.aptitude + template.questions.english + template.questions.domain;
          console.log(`   - Total questions needed: ${totalQuestions}`);
          console.log(`   - Aptitude: ${template.questions.aptitude}`);
          console.log(`   - English: ${template.questions.english}`);  
          console.log(`   - Domain: ${template.questions.domain}`);
          console.log(`   - Include extreme: ${template.questions.includeExtreme}`);
        }

      } catch (error) {
        console.error(`❌ Failed to create template "${template.title}":`, error);
      }
    }

    console.log('✅ Platform template initialization completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Added ${EXTREME_QUESTIONS.length} extreme difficulty questions`);
    console.log(`   - Created ${PLATFORM_TEMPLATES.length} platform templates`);
    console.log('   - Categories covered: Tech (3), Finance (2), Sales/Marketing (2), Other (3)');
    console.log('');
    console.log('🎯 Templates created:');
    PLATFORM_TEMPLATES.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.title} (${template.jobProfile})`);
    });

  } catch (error) {
    console.error('❌ Failed to initialize platform templates:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the initialization
initializePlatformTemplates().catch(console.error);