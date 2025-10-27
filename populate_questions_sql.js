import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);

const basicQuestions = [
  // Aptitude questions
  {
    questionId: 'apt_001',
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'logical_reasoning',
    difficulty: 'medium',
    question: 'If all roses are flowers and some flowers are red, which conclusion is necessarily true?',
    options: ['All roses are red', 'Some roses are red', 'No roses are red', 'Some roses may be red'],
    correctAnswer: '3',
    explanation: 'The statement allows for the possibility that some roses may be red, but does not guarantee it.',
    points: 3,
    timeLimit: 2,
    tags: ['logical_reasoning', 'syllogism'],
    keywords: ['logic', 'deduction']
  },
  {
    questionId: 'apt_002',
    type: 'multiple_choice', 
    category: 'general_aptitude',
    domain: 'general',
    subCategory: 'numerical_ability',
    difficulty: 'medium',
    question: 'If 35% of a number is 140, what is 60% of that number?',
    options: ['240', '280', '320', '360'],
    correctAnswer: '0',
    explanation: 'If 35% = 140, then 100% = 400. So 60% of 400 = 240',
    points: 3,
    timeLimit: 2,
    tags: ['percentage', 'basic_math'],
    keywords: ['percentage', 'calculation']
  },
  {
    questionId: 'apt_003',
    type: 'multiple_choice',
    category: 'general_aptitude', 
    domain: 'general',
    subCategory: 'pattern_recognition',
    difficulty: 'medium',
    question: 'Find the missing number in the sequence: 2, 6, 18, 54, ?',
    options: ['162', '108', '144', '216'],
    correctAnswer: '0',
    explanation: 'Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162',
    points: 3,
    timeLimit: 2,
    tags: ['number_series', 'pattern_recognition'], 
    keywords: ['sequence', 'multiplication']
  },
  // English questions
  {
    questionId: 'eng_001',
    type: 'multiple_choice',
    category: 'english',
    domain: 'general',
    subCategory: 'grammar',
    difficulty: 'medium',
    question: 'Choose the correct sentence:',
    options: [
      'Neither of the students have completed their assignment.',
      'Neither of the students has completed their assignment.',
      'Neither of the students have completed his assignment.',
      'Neither of the students has completed his assignment.'
    ],
    correctAnswer: '3',
    explanation: '"Neither" is singular, so it takes "has". Since we do not know the gender, "his" is grammatically correct in formal English.',
    points: 3,
    timeLimit: 2,
    tags: ['subject_verb_agreement', 'pronouns'],
    keywords: ['grammar', 'agreement', 'neither']
  },
  {
    questionId: 'eng_002',
    type: 'multiple_choice',
    category: 'english',
    domain: 'general', 
    subCategory: 'vocabulary',
    difficulty: 'medium',
    question: 'What does "ubiquitous" mean?',
    options: ['Rare and unusual', 'Present everywhere', 'Very expensive', 'Difficult to understand'],
    correctAnswer: '1',
    explanation: '"Ubiquitous" means present, appearing, or found everywhere.',
    points: 3,
    timeLimit: 1,
    tags: ['vocabulary', 'word_meaning'],
    keywords: ['ubiquitous', 'everywhere', 'present']
  }
];

async function populateQuestions() {
  try {
    console.log('🚀 Populating question bank with initial questions...');
    
    for (const q of basicQuestions) {
      try {
        const result = await client`
          INSERT INTO question_bank (
            question_id, type, category, domain, sub_category, difficulty, 
            question, options, correct_answer, explanation, points, time_limit, 
            tags, keywords, is_active
          ) VALUES (
            ${q.questionId}, ${q.type}, ${q.category}, ${q.domain}, ${q.subCategory}, ${q.difficulty},
            ${q.question}, ${q.options}, ${q.correctAnswer}, ${q.explanation}, ${q.points}, ${q.timeLimit},
            ${q.tags}, ${q.keywords}, true
          )
          ON CONFLICT (question_id) DO NOTHING
          RETURNING question_id
        `;
        
        if (result.length > 0) {
          console.log('✅ Added question:', q.questionId);
        } else {
          console.log('⏭️ Question already exists:', q.questionId);
        }
      } catch (error) {
        console.error('❌ Error adding question', q.questionId, ':', error.message);
      }
    }
    
    // Check total questions
    const total = await client`SELECT COUNT(*) FROM question_bank WHERE is_active = true`;
    console.log('📊 Total questions in bank:', total[0].count);
    
  } catch (error) {
    console.error('Failed to populate questions:', error);
  } finally {
    await client.end();
  }
}

populateQuestions();
