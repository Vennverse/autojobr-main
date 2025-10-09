import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);

// ==================== HARD MCQ CODING QUESTIONS (1 POINT EACH) ====================
const HARD_MCQ_CODING_QUESTIONS = [
  {
    id: 'c_mcq_001',
    question: 'What is the time complexity of the following code?\n```javascript\nfor(let i=1; i<=n; i*=2) {\n  for(let j=1; j<=n; j++) {\n    console.log(i, j);\n  }\n}\n```',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Analyze outer loop iterations', 'Count total operations', 'Outer loop is logarithmic'],
    testCases: [],
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'Outer loop runs log(n) times (i doubles each time). Inner loop runs n times for each outer iteration. Total: O(n log n)',
    timeLimit: 3,
    companies: ['Google', 'Amazon', 'Microsoft'],
    points: 1
  },
  {
    id: 'c_mcq_002',
    question: 'In JavaScript, what does `typeof null` return?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['This is a known JavaScript quirk', 'It\'s not "null"', 'Legacy bug from early JS'],
    testCases: [],
    options: ['null', 'object', 'undefined', 'number'],
    correctAnswer: 1,
    explanation: 'This is a famous JavaScript bug. `typeof null` returns "object" due to legacy reasons from the original implementation.',
    timeLimit: 2,
    companies: ['Facebook', 'Netflix', 'Twitter'],
    points: 1
  },
  {
    id: 'c_mcq_003',
    question: 'What is the output of: `console.log(0.1 + 0.2 === 0.3)`?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Floating point precision', 'Binary representation', 'Not what you expect'],
    testCases: [],
    options: ['true', 'false', 'undefined', 'NaN'],
    correctAnswer: 1,
    explanation: 'Due to floating-point precision issues, 0.1 + 0.2 = 0.30000000000000004, not exactly 0.3. This returns false.',
    timeLimit: 2,
    companies: ['Google', 'Apple', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_004',
    question: 'Which data structure provides the best average case for insert, delete, and search operations?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['Think about hash functions', 'O(1) average case', 'Collision handling'],
    testCases: [],
    options: ['Array', 'Linked List', 'Hash Table', 'Binary Search Tree'],
    correctAnswer: 2,
    explanation: 'Hash tables provide O(1) average case for insert, delete, and search operations using hash functions and collision resolution.',
    timeLimit: 3,
    companies: ['Microsoft', 'Amazon', 'Facebook'],
    points: 1
  },
  {
    id: 'c_mcq_005',
    question: 'What is the space complexity of merge sort algorithm?',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Consider auxiliary space', 'Temporary arrays needed', 'Not in-place sorting'],
    testCases: [],
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'Merge sort requires O(n) extra space for temporary arrays during the merge process, making it not an in-place sorting algorithm.',
    timeLimit: 3,
    companies: ['Google', 'Microsoft', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_006',
    question: 'In a binary search tree with n nodes, what is the worst-case time complexity for search?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['Consider unbalanced tree', 'Skewed tree scenario', 'Degenerates to linked list'],
    testCases: [],
    options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 1,
    explanation: 'In the worst case, a BST can become skewed (like a linked list), requiring O(n) time to search through all nodes.',
    timeLimit: 3,
    companies: ['Apple', 'Google', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_007',
    question: 'What is the output of: `[1, 2, 3] + [4, 5, 6]` in JavaScript?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Type coercion', 'Arrays convert to strings', 'String concatenation'],
    testCases: [],
    options: ['[1, 2, 3, 4, 5, 6]', '"1,2,34,5,6"', '[5, 7, 9]', 'Error'],
    correctAnswer: 1,
    explanation: 'Arrays are converted to strings and concatenated: "1,2,3" + "4,5,6" = "1,2,34,5,6"',
    timeLimit: 2,
    companies: ['Netflix', 'Twitter', 'LinkedIn'],
    points: 1
  },
  {
    id: 'c_mcq_008',
    question: 'Which sorting algorithm is NOT stable?',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Stable maintains relative order', 'In-place swapping', 'Non-adjacent swaps'],
    testCases: [],
    options: ['Merge Sort', 'Bubble Sort', 'Quick Sort', 'Insertion Sort'],
    correctAnswer: 2,
    explanation: 'Quick Sort is not stable because it can swap non-adjacent elements, changing the relative order of equal elements.',
    timeLimit: 3,
    companies: ['Google', 'Facebook', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_009',
    question: 'What is the output of `console.log(1 < 2 < 3)` in JavaScript?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Left to right evaluation', 'Boolean conversion', 'Chained comparisons'],
    testCases: [],
    options: ['true', 'false', 'undefined', 'Error'],
    correctAnswer: 0,
    explanation: '(1 < 2) evaluates to true, then true < 3 becomes 1 < 3 (true converts to 1), which is true.',
    timeLimit: 2,
    companies: ['Apple', 'Google', 'Microsoft'],
    points: 1
  },
  {
    id: 'c_mcq_010',
    question: 'In a min-heap with n elements, what is the time complexity to find the maximum element?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['Heap structure properties', 'Min at root', 'Max location unknown'],
    testCases: [],
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'The maximum element in a min-heap is at a leaf node, requiring O(n) time to scan all leaves to find it.',
    timeLimit: 3,
    companies: ['Amazon', 'Microsoft', 'Google'],
    points: 1
  },
  {
    id: 'c_mcq_011',
    question: 'What is the result of `"5" - 3` in JavaScript?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Type coercion', 'Numeric context', 'Subtraction operator'],
    testCases: [],
    options: ['2', '"2"', '"53"', 'NaN'],
    correctAnswer: 0,
    explanation: 'The subtraction operator coerces "5" to number 5, then 5 - 3 = 2 (number)',
    timeLimit: 2,
    companies: ['Facebook', 'Netflix', 'Uber'],
    points: 1
  },
  {
    id: 'c_mcq_012',
    question: 'Which graph algorithm uses a greedy approach to find the shortest path?',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Priority queue based', 'Non-negative edges', 'Named after Dutch scientist'],
    testCases: [],
    options: ['Bellman-Ford', 'Dijkstra\'s', 'Floyd-Warshall', 'DFS'],
    correctAnswer: 1,
    explanation: 'Dijkstra\'s algorithm uses a greedy approach with a priority queue to find shortest paths from a source vertex.',
    timeLimit: 3,
    companies: ['Google', 'Amazon', 'Microsoft'],
    points: 1
  },
  {
    id: 'c_mcq_013',
    question: 'What is `!!null` in JavaScript?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Double negation', 'Boolean conversion', 'Falsy value'],
    testCases: [],
    options: ['null', 'true', 'false', 'undefined'],
    correctAnswer: 2,
    explanation: '!null converts null to true (null is falsy), then !true becomes false.',
    timeLimit: 2,
    companies: ['Twitter', 'LinkedIn', 'Airbnb'],
    points: 1
  },
  {
    id: 'c_mcq_014',
    question: 'Which tree traversal visits nodes in sorted order for a BST?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['Left-Root-Right pattern', 'Ascending order', 'Recursive approach'],
    testCases: [],
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correctAnswer: 1,
    explanation: 'In-order traversal (left-root-right) visits BST nodes in ascending sorted order.',
    timeLimit: 3,
    companies: ['Apple', 'Google', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_015',
    question: 'What is the worst-case time complexity of QuickSort?',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Bad pivot selection', 'Unbalanced partitions', 'Already sorted array'],
    testCases: [],
    options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'QuickSort has O(n²) worst-case when the pivot selection creates unbalanced partitions (e.g., already sorted array).',
    timeLimit: 3,
    companies: ['Microsoft', 'Amazon', 'Facebook'],
    points: 1
  },
  {
    id: 'c_mcq_016',
    question: 'In JavaScript, what is the difference between `==` and `===`?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Type coercion', 'Strict equality', 'Value and type'],
    testCases: [],
    options: ['No difference', '== checks type, === checks value', '== allows type coercion, === does not', '=== is faster'],
    correctAnswer: 2,
    explanation: '== performs type coercion before comparison, while === checks both value and type without coercion (strict equality).',
    timeLimit: 2,
    companies: ['Google', 'Facebook', 'Netflix'],
    points: 1
  },
  {
    id: 'c_mcq_017',
    question: 'Which data structure is used to implement BFS (Breadth-First Search)?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['FIFO structure', 'Level by level', 'Enqueue and dequeue'],
    testCases: [],
    options: ['Stack', 'Queue', 'Heap', 'Tree'],
    correctAnswer: 1,
    explanation: 'BFS uses a Queue (FIFO) to explore nodes level by level in a graph or tree.',
    timeLimit: 3,
    companies: ['Amazon', 'Google', 'Microsoft'],
    points: 1
  },
  {
    id: 'c_mcq_018',
    question: 'What does `{} + []` evaluate to in JavaScript?',
    type: 'coding',
    difficulty: 'hard',
    category: 'javascript',
    hints: ['Empty object and array', 'Type coercion', 'Unexpected result'],
    testCases: [],
    options: ['0', '"[object Object]"', '""', 'NaN'],
    correctAnswer: 0,
    explanation: '{} is treated as a code block (not object), so +[] converts empty array to 0.',
    timeLimit: 2,
    companies: ['Twitter', 'Uber', 'Airbnb'],
    points: 1
  },
  {
    id: 'c_mcq_019',
    question: 'What is the maximum number of nodes in a binary tree of height h?',
    type: 'coding',
    difficulty: 'hard',
    category: 'data_structures',
    hints: ['Complete binary tree', 'Each level doubles', 'Geometric series'],
    testCases: [],
    options: ['2^h', '2^h - 1', '2^(h+1) - 1', '2^(h-1)'],
    correctAnswer: 2,
    explanation: 'Maximum nodes = 2^0 + 2^1 + ... + 2^h = 2^(h+1) - 1 (sum of geometric series)',
    timeLimit: 3,
    companies: ['Apple', 'Google', 'Amazon'],
    points: 1
  },
  {
    id: 'c_mcq_020',
    question: 'Which algorithm is used to detect cycles in a directed graph?',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Graph traversal', 'Track visited and recursion stack', 'DFS based'],
    testCases: [],
    options: ['Kruskal\'s', 'Prim\'s', 'DFS with colors', 'Dijkstra\'s'],
    correctAnswer: 2,
    explanation: 'DFS with three colors (white, gray, black) can detect cycles in directed graphs by tracking the recursion stack.',
    timeLimit: 3,
    companies: ['Microsoft', 'Amazon', 'Google'],
    points: 1
  }
];


async function addHardMcqCodingQuestions() {
  try {
    console.log('🧠 Adding HARD MCQ CODING QUESTIONS...');
    console.log(`📊 Adding ${HARD_MCQ_CODING_QUESTIONS.length} challenging questions`);

    let successCount = 0;
    let skipCount = 0;

    for (const q of HARD_MCQ_CODING_QUESTIONS) {
      try {
        const result = await client`
          INSERT INTO question_bank (
            question_id, type, category, domain, sub_category, difficulty, 
            question, options, correct_answer, explanation, points, time_limit, 
            tags, keywords, is_active, created_by
          ) VALUES (
            ${q.id}, ${q.type}, ${q.category}, 'coding', ${q.category}, ${q.difficulty},
            ${q.question}, ${q.options}, ${q.correctAnswer}, ${q.explanation}, ${q.points}, ${q.timeLimit},
            ${q.hints.concat(q.companies)}, ${q.hints.concat(q.companies)}, true, null
          )
          ON CONFLICT (question_id) DO NOTHING
          RETURNING question_id
        `;

        if (result.length > 0) {
          successCount++;
          console.log(`✅ Added: ${q.id} - ${q.category}`);
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding ${q.id}:`, error.message);
      }
    }

    console.log('');
    console.log('🎯 HARD MCQ CODING QUESTIONS ADDED!');
    console.log(`✅ Successfully added: ${successCount} questions`);
    console.log(`⏭️ Skipped (existing): ${skipCount} questions`);
    console.log('');

  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await client.end();
  }
}

addHardMcqCodingQuestions();