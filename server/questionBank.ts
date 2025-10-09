interface InterviewQuestion {
  id: string;
  question: string;
  type: 'coding' | 'behavioral' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  hints: string[];
  testCases?: Array<{
    input: any;
    expected: any;
    description: string;
  }>;
  sampleAnswer?: string;
  boilerplate?: string;
  timeLimit?: number; // in minutes
  companies?: string[];
}

export const QUESTION_BANK: InterviewQuestion[] = [
  // ==================== CODING QUESTIONS - EASY ====================
  {
    id: 'c001',
    question: 'Write a function to find the maximum number in an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Consider using Math.max()', 'You can use reduce() method', 'Loop through the array and keep track of max'],
    testCases: [
      { input: [1, 5, 3, 9, 2], expected: 9, description: 'Basic array' },
      { input: [-1, -5, -3], expected: -1, description: 'All negative numbers' },
      { input: [42], expected: 42, description: 'Single element' }
    ],
    sampleAnswer: 'function solution(arr) { return Math.max(...arr); }',
    timeLimit: 15,
    companies: ['Google', 'Microsoft', 'Amazon'],
    points: 1
  },
  {
    id: 'c002',
    question: 'Implement a function to reverse a string.',
    type: 'coding',
    difficulty: 'easy',
    category: 'strings',
    hints: ['Use split(), reverse(), join()', 'Consider using a loop', 'Think about two pointers approach'],
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Basic string' },
      { input: 'a', expected: 'a', description: 'Single character' },
      { input: '', expected: '', description: 'Empty string' }
    ],
    sampleAnswer: 'function solution(str) { return str.split("").reverse().join(""); }',
    timeLimit: 10,
    companies: ['Facebook', 'Apple', 'Netflix'],
    points: 1
  },
  {
    id: 'c003',
    question: 'Check if a number is prime.',
    type: 'coding',
    difficulty: 'easy',
    category: 'math',
    hints: ['Check divisibility from 2 to sqrt(n)', 'Handle edge cases (1, 2)', 'Use modulus operator'],
    testCases: [
      { input: 17, expected: true, description: 'Prime number' },
      { input: 4, expected: false, description: 'Composite number' },
      { input: 1, expected: false, description: 'Edge case: 1' }
    ],
    sampleAnswer: 'function solution(n) { if (n <= 1) return false; for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) return false; } return true; }',
    timeLimit: 20,
    companies: ['Google', 'Amazon', 'Microsoft'],
    points: 1
  },
  {
    id: 'c004',
    question: 'Find the sum of all elements in an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Use reduce() method', 'Use a for loop', 'Initialize sum to 0'],
    testCases: [
      { input: [1, 2, 3, 4, 5], expected: 15, description: 'Positive numbers' },
      { input: [-1, -2, -3], expected: -6, description: 'Negative numbers' },
      { input: [], expected: 0, description: 'Empty array' }
    ],
    sampleAnswer: 'function solution(arr) { return arr.reduce((sum, num) => sum + num, 0); }',
    timeLimit: 10,
    companies: ['Facebook', 'Twitter', 'LinkedIn'],
    points: 1
  },
  {
    id: 'c005',
    question: 'Remove duplicates from an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Use Set data structure', 'Use filter with indexOf', 'Use Map to track seen elements'],
    testCases: [
      { input: [1, 2, 2, 3, 4, 4, 5], expected: [1, 2, 3, 4, 5], description: 'Array with duplicates' },
      { input: [1, 2, 3], expected: [1, 2, 3], description: 'No duplicates' },
      { input: [], expected: [], description: 'Empty array' }
    ],
    sampleAnswer: 'function solution(arr) { return [...new Set(arr)]; }',
    timeLimit: 15,
    companies: ['Google', 'Apple', 'Amazon'],
    points: 1
  },

  // ==================== CODING QUESTIONS - MEDIUM ====================
  {
    id: 'c101',
    question: 'Two Sum: Find two numbers in an array that sum to a target value.',
    type: 'coding',
    difficulty: 'medium',
    category: 'arrays',
    hints: ['Use a hash map for O(n) solution', 'Store complement values', 'Check if complement exists'],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], description: 'Basic two sum' },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], description: 'Different indices' },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1], description: 'Same numbers' }
    ],
    sampleAnswer: 'function solution({nums, target}) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } return []; }',
    timeLimit: 25,
    companies: ['Facebook', 'Google', 'Amazon'],
    points: 2
  },
  {
    id: 'c102',
    question: 'Valid Parentheses: Check if a string of parentheses is valid.',
    type: 'coding',
    difficulty: 'medium',
    category: 'strings',
    hints: ['Use a stack data structure', 'Match opening and closing brackets', 'Check stack is empty at end'],
    testCases: [
      { input: '()', expected: true, description: 'Simple valid' },
      { input: '()[]{} ', expected: true, description: 'Multiple types' },
      { input: '(]', expected: false, description: 'Invalid mix' }
    ],
    sampleAnswer: 'function solution(s) { const stack = []; const pairs = {")": "(", "}": "{", "]": "["}; for (let char of s) { if (char in pairs) { if (stack.pop() !== pairs[char]) return false; } else { stack.push(char); } } return stack.length === 0; }',
    timeLimit: 20,
    companies: ['Microsoft', 'Apple', 'Google'],
    points: 2
  },
  {
    id: 'c103',
    question: 'Palindrome Check: Determine if a string is a palindrome.',
    type: 'coding',
    difficulty: 'medium',
    category: 'strings',
    hints: ['Compare characters from both ends', 'Consider case sensitivity', 'Handle spaces and punctuation'],
    testCases: [
      { input: 'racecar', expected: true, description: 'Simple palindrome' },
      { input: 'hello', expected: false, description: 'Not a palindrome' },
      { input: 'A man a plan a canal Panama', expected: true, description: 'Palindrome with spaces' }
    ],
    sampleAnswer: 'function solution(s) { const cleaned = s.replace(/[^A-Za-z0-9]/g, "").toLowerCase(); return cleaned === cleaned.split("").reverse().join(""); }',
    timeLimit: 25,
    companies: ['Amazon', 'Facebook', 'Netflix'],
    points: 2
  },
  {
    id: 'c104',
    question: 'Binary Search: Implement binary search algorithm.',
    type: 'coding',
    difficulty: 'medium',
    category: 'algorithms',
    hints: ['Array must be sorted', 'Use two pointers (left, right)', 'Compare with middle element'],
    testCases: [
      { input: { arr: [1, 3, 5, 7, 9], target: 5 }, expected: 2, description: 'Target found' },
      { input: { arr: [1, 3, 5, 7, 9], target: 6 }, expected: -1, description: 'Target not found' },
      { input: { arr: [2], target: 2 }, expected: 0, description: 'Single element' }
    ],
    sampleAnswer: 'function solution({arr, target}) { let left = 0, right = arr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (arr[mid] === target) return mid; else if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; }',
    timeLimit: 30,
    companies: ['Google', 'Microsoft', 'Apple'],
    points: 2
  },
  {
    id: 'c105',
    question: 'Merge Two Sorted Arrays: Merge two sorted arrays into one.',
    type: 'coding',
    difficulty: 'medium',
    category: 'arrays',
    hints: ['Use two pointers', 'Compare elements from both arrays', 'Handle remaining elements'],
    testCases: [
      { input: { arr1: [1, 3, 5], arr2: [2, 4, 6] }, expected: [1, 2, 3, 4, 5, 6], description: 'Same length' },
      { input: { arr1: [1, 5, 9], arr2: [2, 3, 4, 6, 7] }, expected: [1, 2, 3, 4, 5, 6, 7, 9], description: 'Different lengths' },
      { input: { arr1: [], arr2: [1, 2, 3] }, expected: [1, 2, 3], description: 'Empty first array' }
    ],
    sampleAnswer: 'function solution({arr1, arr2}) { let result = [], i = 0, j = 0; while (i < arr1.length && j < arr2.length) { if (arr1[i] <= arr2[j]) result.push(arr1[i++]); else result.push(arr2[j++]); } return result.concat(arr1.slice(i)).concat(arr2.slice(j)); }',
    timeLimit: 30,
    companies: ['Amazon', 'Google', 'Facebook'],
    points: 2
  },

  // ==================== CODING QUESTIONS - EXTREME (1% SUCCESS RATE) ====================
  {
    id: 'c901',
    question: 'Given a stream of characters, implement a data structure that can efficiently find the K-th smallest character in the current stream. The stream can have up to 10^9 characters. Optimize for both time and space complexity.',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Consider using multiple data structures', 'Think about order statistics', 'Space-time tradeoffs are crucial'],
    testCases: [
      { input: { stream: ['d', 'a', 'c', 'b'], k: 2 }, expected: 'b', description: 'Second smallest in stream' },
      { input: { stream: ['z', 'y', 'x', 'w', 'v'], k: 1 }, expected: 'v', description: 'Smallest in descending stream' }
    ],
    sampleAnswer: 'class StreamKthSmallest { constructor(k) { this.k = k; this.heap = new MinHeap(); this.count = new Map(); } add(char) { this.count.set(char, (this.count.get(char) || 0) + 1); if (this.heap.size() < this.k) { this.heap.push(char); } else if (char < this.heap.peek()) { this.heap.pop(); this.heap.push(char); } } getKthSmallest() { return this.heap.peek(); } }',
    timeLimit: 90,
    companies: ['Google', 'Facebook', 'Microsoft'],
    points: 5
  },
  {
    id: 'c902',
    question: 'Design and implement a concurrent lock-free hash table that supports get, put, and remove operations with O(1) average time complexity. Handle hash collisions and ensure thread safety without using any locks.',
    type: 'coding',
    difficulty: 'hard',
    category: 'concurrency',
    hints: ['Compare-and-swap operations', 'Memory ordering constraints', 'ABA problem prevention'],
    testCases: [
      { input: { ops: [['put', 'key1', 'val1'], ['get', 'key1'], ['remove', 'key1']] }, expected: ['null', 'val1', 'val1'], description: 'Basic operations' }
    ],
    sampleAnswer: 'class LockFreeHashTable { constructor() { this.buckets = new Array(16).fill(null); this.size = 0; } hash(key) { let hash = 0; for (let i = 0; i < key.length; i++) { hash = ((hash << 5) - hash + key.charCodeAt(i)) & 0x7fffffff; } return hash % this.buckets.length; } put(key, value) { const index = this.hash(key); let current = this.buckets[index]; while (current && current.key !== key) { current = current.next; } if (current) { current.value = value; } else { const newNode = { key, value, next: this.buckets[index] }; this.buckets[index] = newNode; this.size++; } } }',
    timeLimit: 120,
    companies: ['Intel', 'NVIDIA', 'AMD'],
    points: 5
  },

  // ==================== CODING QUESTIONS - HARD ====================
  {
    id: 'c201',
    question: 'Longest Substring Without Repeating Characters: Find the length of the longest substring without repeating characters.',
    type: 'coding',
    difficulty: 'hard',
    category: 'strings',
    hints: ['Use sliding window technique', 'Keep track of character positions', 'Update window when duplicate found'],
    testCases: [
      { input: 'abcabcbb', expected: 3, description: 'abc' },
      { input: 'bbbbb', expected: 1, description: 'Single character' },
      { input: 'pwwkew', expected: 3, description: 'wke' }
    ],
    sampleAnswer: 'function solution(s) { let maxLength = 0, start = 0; const charIndex = new Map(); for (let end = 0; end < s.length; end++) { if (charIndex.has(s[end])) { start = Math.max(charIndex.get(s[end]) + 1, start); } charIndex.set(s[end], end); maxLength = Math.max(maxLength, end - start + 1); } return maxLength; }',
    timeLimit: 45,
    companies: ['Facebook', 'Google', 'Amazon'],
    points: 3
  },
  {
    id: 'c202',
    question: 'Median of Two Sorted Arrays: Find the median of two sorted arrays.',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Use binary search', 'Find the partition point', 'Ensure left side <= right side'],
    testCases: [
      { input: { nums1: [1, 3], nums2: [2] }, expected: 2.0, description: 'Odd total length' },
      { input: { nums1: [1, 2], nums2: [3, 4] }, expected: 2.5, description: 'Even total length' },
      { input: { nums1: [0, 0], nums2: [0, 0] }, expected: 0.0, description: 'All zeros' }
    ],
    sampleAnswer: 'function solution({nums1, nums2}) { if (nums1.length > nums2.length) return solution({nums1: nums2, nums2: nums1}); const m = nums1.length, n = nums2.length; let left = 0, right = m; while (left <= right) { const partitionX = Math.floor((left + right) / 2); const partitionY = Math.floor((m + n + 1) / 2) - partitionX; const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1]; const minRightX = partitionX === m ? Infinity : nums1[partitionX]; const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1]; const minRightY = partitionY === n ? Infinity : nums2[partitionY]; if (maxLeftX <= minRightY && maxLeftY <= minRightX) { if ((m + n) % 2 === 0) return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2; else return Math.max(maxLeftX, maxLeftY); } else if (maxLeftX > minRightY) right = partitionX - 1; else left = partitionX + 1; } }',
    timeLimit: 60,
    companies: ['Google', 'Microsoft', 'Apple'],
    points: 3
  },
  {
    id: 'c203',
    question: 'Trapping Rain Water: Calculate how much water can be trapped after raining.',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Use two pointers approach', 'Track max height on left and right', 'Water level = min(leftMax, rightMax)'],
    testCases: [
      { input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], expected: 6, description: 'Complex elevation' },
      { input: [4, 2, 0, 3, 2, 5], expected: 9, description: 'Another example' },
      { input: [3, 0, 2, 0, 4], expected: 7, description: 'Simple case' }
    ],
    sampleAnswer: 'function solution(height) { let left = 0, right = height.length - 1; let leftMax = 0, rightMax = 0; let water = 0; while (left < right) { if (height[left] < height[right]) { if (height[left] >= leftMax) leftMax = height[left]; else water += leftMax - height[left]; left++; } else { if (height[right] >= rightMax) rightMax = height[right]; else water += rightMax - height[right]; right--; } } return water; }',
    timeLimit: 50,
    companies: ['Amazon', 'Facebook', 'Google'],
    points: 3
  },

  // ==================== BEHAVIORAL QUESTIONS ====================
  {
    id: 'b001',
    question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'teamwork',
    hints: ['Use the STAR method (Situation, Task, Action, Result)', 'Focus on your actions and communication', 'Show growth and learning'],
    sampleAnswer: 'I once worked with a colleague who was consistently missing deadlines, affecting our sprint goals. I approached them privately to understand their challenges, discovered they were overwhelmed with personal issues, and offered to help redistribute some tasks. I also established regular check-ins to provide support. This improved our team\'s delivery by 40% and strengthened our working relationship.',
    timeLimit: 5,
    companies: ['Google', 'Microsoft', 'Amazon', 'Facebook'],
    points: 2
  },
  {
    id: 'b002',
    question: 'Describe a situation where you had to learn a new technology quickly. What was your approach?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'learning',
    hints: ['Show learning methodology', 'Mention resources used', 'Quantify the outcome'],
    sampleAnswer: 'When our team needed to migrate to React, I had two weeks to become proficient. I created a structured learning plan: spent mornings on documentation and tutorials, afternoons building small projects, and evenings reviewing best practices. I also joined React communities and found a mentor. This approach helped me successfully lead the migration, reducing our app\'s load time by 30%.',
    timeLimit: 5,
    companies: ['Netflix', 'Airbnb', 'Uber', 'Twitter'],
    points: 2
  },
  {
    id: 'b003',
    question: 'Tell me about a time when you disagreed with your manager. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'conflict_resolution',
    hints: ['Show respect for authority', 'Focus on facts and data', 'Demonstrate professional communication'],
    sampleAnswer: 'My manager wanted to rush a feature release without proper testing. I respectfully requested a meeting and presented data showing potential risks and customer impact. I proposed a compromise: a limited beta release to gather feedback first. This approach caught three critical bugs, and the manager appreciated my initiative. We established a new process for balancing speed with quality.',
    timeLimit: 5,
    companies: ['Apple', 'Google', 'Microsoft', 'Amazon'],
    points: 2
  },
  {
    id: 'b004',
    question: 'Describe a project where you took initiative beyond your assigned responsibilities.',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'leadership',
    hints: ['Show proactive thinking', 'Explain the impact', 'Demonstrate ownership'],
    sampleAnswer: 'While working on a client project, I noticed our deployment process was causing frequent downtime. Although it wasn\'t my responsibility, I researched CI/CD solutions and proposed implementing automated deployments. I created a proof of concept during my free time, presented it to the team, and volunteered to lead implementation. This reduced deployment time by 80% and eliminated weekend outages.',
    timeLimit: 5,
    companies: ['Facebook', 'LinkedIn', 'Spotify', 'Slack'],
    points: 2
  },
  {
    id: 'b005',
    question: 'Tell me about a time when you failed at something. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'failure_learning',
    hints: ['Be honest about the failure', 'Focus on lessons learned', 'Show how you applied learning'],
    sampleAnswer: 'I once underestimated the complexity of a database migration, causing a production outage. I immediately took ownership, communicated transparently with stakeholders, and worked with the team to restore service within 2 hours. I then conducted a thorough post-mortem, implemented better testing procedures, and created a rollback plan. This experience taught me to always have contingency plans and improved our team\'s deployment practices.',
    timeLimit: 5,
    companies: ['Amazon', 'Netflix', 'Uber', 'Airbnb'],
    points: 2
  },

  // ==================== EXTREME BEHAVIORAL QUESTIONS (1% SUCCESS RATE) ====================
  {
    id: 'b901',
    question: 'You discovered that your team\'s most critical production system has a fundamental architectural flaw that affects 10 million users daily. Fixing it requires 6 months of work and will temporarily reduce system performance by 50%. Your CEO wants the issue hidden until after a major product launch in 3 months. How do you handle this situation?',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'leadership',
    hints: ['Consider multiple stakeholders', 'Think long-term consequences', 'Balance business and technical concerns'],
    sampleAnswer: 'I would immediately document the issue comprehensively, including potential risks and impact. I\'d schedule a meeting with the CEO and CTO to present three options: (1) immediate fix with performance trade-offs, (2) phased approach with risk mitigation, (3) temporary workarounds with full disclosure. I\'d emphasize that hiding critical flaws violates engineering ethics and could lead to catastrophic failure. I\'d propose a compromise: implement immediate safety measures, communicate transparently with stakeholders about timeline, and dedicate additional resources to minimize the impact. If leadership insists on hiding the issue, I would document my objections and consider escalating to the board or seeking legal counsel, as professional integrity cannot be compromised.',
    timeLimit: 8,
    companies: ['Uber', 'Facebook', 'Boeing', 'Tesla'],
    points: 5
  },
  {
    id: 'b902', 
    question: 'Your startup is running out of funding and you have 2 months left. Your biggest potential investor wants you to fire 40% of your engineering team to extend runway, but this would cripple the product development needed to secure the next funding round. Meanwhile, a competitor has offered to acquire your team (but not the company) for enough money to pay everyone\'s salaries for a year. What is your decision-making process?',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'leadership',
    hints: ['Fiduciary responsibility', 'Team welfare', 'Strategic thinking under pressure'],
    sampleAnswer: 'I would call an emergency leadership meeting to analyze all options with complete financial transparency. First, I\'d explore alternative funding sources (bridge loans, existing investor follow-on, revenue acceleration). Second, I\'d model different scenarios: reduced team size vs. full team acquisition vs. finding new funding. I\'d consult with our legal counsel about fiduciary duties to shareholders and employees. I would then present options to the board with my recommendation based on maximum long-term value creation. If the acquisition offer provides better outcomes for the team and preserves the technology, I\'d negotiate to include intellectual property transfer. Throughout this process, I\'d communicate honestly with the team about the situation while maintaining confidentiality about ongoing negotiations. The decision would prioritize both stakeholder value and team welfare.',
    timeLimit: 8,
    companies: ['Theranos', 'WeWork', 'Quibi', 'FTX'],
    points: 5
  },

  // ==================== EXTREME FINANCE QUESTIONS (1% SUCCESS RATE) ====================
  {
    id: 'f901',
    question: 'A pension fund with $50B AUM needs to maintain a 7% annual return to meet obligations. Current portfolio: 60% equities (expected 8% return, 18% volatility), 40% bonds (expected 4% return, 6% volatility). Correlation is 0.3. The fund manager wants to add a new asset class with 12% expected return and 25% volatility, correlation 0.1 with equities and -0.2 with bonds. What is the optimal allocation to maximize Sharpe ratio while maintaining the 7% return target? Show your work with mathematical derivation.',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'finance',
    hints: ['Mean-variance optimization', 'Lagrange multipliers', 'Portfolio constraint handling'],
    sampleAnswer: 'Using modern portfolio theory, I\'d set up the Lagrangian: L = w\'Σw - λ(w\'μ - 7%) - γ(∑w - 1). Taking derivatives and solving the system of equations with the covariance matrix Σ = [[0.0324, 0.00324, 0.00045], [0.00324, 0.0036, -0.003], [0.00045, -0.003, 0.0625]] and expected returns μ = [8%, 4%, 12%]. The optimal allocation considering the constraint is approximately 45% equities, 25% bonds, 30% new asset class. This yields a portfolio return of ~7.8% with volatility of ~14.2%, significantly improving the Sharpe ratio from 0.28 to 0.41. However, I\'d recommend stress testing this allocation under different market scenarios and implementing gradually to avoid concentration risk.',
    timeLimit: 15,
    companies: ['Goldman Sachs', 'BlackRock', 'Bridgewater', 'Renaissance Technologies'],
    points: 5
  },
  {
    id: 'f902',
    question: 'You\'re valuing a biotech company with one drug in Phase III trials. The drug has a 60% chance of approval, market size is $10B, and the company could capture 15% market share. Development costs are $500M remaining. If successful, the drug launches in 2 years with a 10-year patent life. Assume 15% discount rate, 25% tax rate, and competitive generics reduce market share by 80% post-patent. The company has $200M cash, $50M debt, and 10M shares outstanding. What is your price target per share? Include a probability-weighted DCF model.',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'finance',
    hints: ['Risk-adjusted NPV', 'Probability-weighted scenarios', 'Patent cliff analysis'],
    sampleAnswer: 'Success scenario DCF: Revenue years 1-8: $1.5B * (1-growth_decline), years 9-10: $1.5B * 0.5. EBITDA margin: 85% (high margin biotech). NPV of success scenario: $4.2B. Failure scenario: -$500M development costs. Risk-adjusted NPV: 0.6 * $4.2B + 0.4 * (-$0.5B) = $2.32B. Enterprise value: $2.32B. Equity value: $2.32B + $200M cash - $50M debt = $2.47B. Price per share: $247. However, I\'d apply additional risk discounts for regulatory uncertainty (10-15%), competitive risks (5-10%), and execution risks (5%). Final target range: $190-220 per share.',
    timeLimit: 20,
    companies: ['J.P. Morgan', 'Morgan Stanley', 'Evercore', 'Centerview Partners'],
    points: 5
  },

  // ==================== SYSTEM DESIGN QUESTIONS ====================
  {
    id: 's001',
    question: 'Design a URL shortener like bit.ly. What are the key components and how would you scale it?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'web_systems',
    hints: ['Consider database design', 'Think about caching', 'Plan for high traffic', 'URL encoding strategies'],
    sampleAnswer: 'Key components: Load balancer, Web servers, Database (URL mappings), Cache (Redis), Analytics service. Use base62 encoding for short URLs, implement rate limiting, and use CDN for global distribution. For scaling: database sharding, read replicas, distributed caching, and microservices architecture.',
    timeLimit: 45,
    companies: ['Google', 'Facebook', 'Amazon', 'Twitter'],
    points: 3
  },
  {
    id: 's002',
    question: 'How would you design a chat application like WhatsApp? Focus on real-time messaging.',
    type: 'system_design',
    difficulty: 'hard',
    category: 'real_time_systems',
    hints: ['WebSocket connections', 'Message queuing', 'Database schema', 'Push notifications'],
    sampleAnswer: 'Architecture: WebSocket servers for real-time communication, message queues (Kafka/RabbitMQ), NoSQL database for message storage, Redis for session management. Implement message status tracking (sent/delivered/read), end-to-end encryption, and push notification services for offline users. Use horizontal scaling and load balancing for high availability.',
    timeLimit: 45,
    companies: ['WhatsApp', 'Facebook', 'Telegram', 'Signal'],
    points: 3
  },
  {
    id: 's003',
    question: 'Design a distributed cache system like Redis. How would you handle consistency and availability?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'distributed_systems',
    hints: ['Consistent hashing', 'Replication strategies', 'CAP theorem', 'Failure handling'],
    sampleAnswer: 'Use consistent hashing for data distribution, implement master-slave replication for high availability, use heartbeat mechanisms for failure detection. For consistency: eventual consistency with conflict resolution, write-through/write-behind caching strategies. Include monitoring, metrics collection, and automatic failover mechanisms.',
    timeLimit: 50,
    companies: ['Redis Labs', 'Amazon', 'Google', 'Microsoft'],
    points: 3
  },
  {
    id: 's004',
    question: 'Design a social media feed system like Facebook\'s news feed. How would you personalize and scale it?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'social_systems',
    hints: ['Feed generation strategies', 'Content ranking algorithms', 'Caching strategies', 'Real-time updates'],
    sampleAnswer: 'Hybrid approach: push model for active users, pull model for passive users. Use ML algorithms for content ranking, implement timeline generation service, Redis for feed caching. For scaling: content delivery networks, database sharding, and microservices. Include real-time updates via WebSockets and notification services.',
    timeLimit: 50,
    companies: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn'],
    points: 3
  },
  {
    id: 's005',
    question: 'Design a video streaming platform like YouTube. How would you handle video processing and delivery?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'media_systems',
    hints: ['Video encoding/transcoding', 'CDN usage', 'Storage systems', 'Recommendation engine'],
    sampleAnswer: 'Components: Upload service, transcoding pipeline, CDN for video delivery, metadata database, recommendation engine. Use cloud storage for video files, implement multiple quality formats, geographic content distribution. For scaling: horizontal scaling of services, caching strategies, and load balancing. Include analytics and monitoring systems.',
    timeLimit: 50,
    companies: ['YouTube', 'Netflix', 'Twitch', 'Vimeo'],
    points: 3
  }
];

// Helper functions for question selection
export function getQuestionsByType(type: 'coding' | 'behavioral' | 'system_design'): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.type === type);
}

export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.difficulty === difficulty);
}

export function getQuestionsByCategory(category: string): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.category === category);
}

export function getQuestionsByCompany(company: string): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.companies?.includes(company));
}

export async function getRandomQuestions(
  type: 'coding' | 'behavioral' | 'system_design',
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Promise<InterviewQuestion[]> {
  try {
    // Try to get from database first
    const { storage } = await import('./storage');
    const dbQuestions = await storage.getQuestionBankQuestions({ 
      type: type === 'coding' ? 'coding' : type, 
      difficulty, 
      limit: count 
    });
    
    if (dbQuestions.length > 0) {
      console.log(`✅ Found ${dbQuestions.length} questions in database for ${type}/${difficulty}`);
      return dbQuestions.map(q => ({
        id: q.questionId,
        question: q.question,
        type: q.type as 'coding' | 'behavioral' | 'system_design',
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category || 'general',
        hints: q.tags ? JSON.parse(q.tags) : [],
        testCases: q.testCases ? JSON.parse(q.testCases) : [],
        sampleAnswer: q.explanation || '',
        boilerplate: q.boilerplate || undefined,
        timeLimit: q.timeLimit || 15
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch from database, using fallback questions:', error);
  }
  
  // Fallback to static questions
  const filtered = QUESTION_BANK.filter(q => q.type === type && q.difficulty === difficulty);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return QUESTION_BANK.find(q => q.id === id);
}

// Export the question bank data for external use
export const questionBank = QUESTION_BANK;

// Generate test questions helper functions
export async function generateTestQuestions(
  type: 'coding' | 'behavioral' | 'system_design',
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Promise<InterviewQuestion[]> {
  return await getRandomQuestions(type, difficulty, count);
}

export function getQuestionsByDomain(domain: string): InterviewQuestion[] {
  return getQuestionsByCategory(domain);
}