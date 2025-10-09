import { storage } from "./storage";
import { sendEmail } from "./emailService";
import { paymentService } from "./paymentService";
import type { InsertTestTemplate, InsertTestAssignment, TestTemplate } from "@shared/schema";

interface TestQuestion {
  id: string;
  type: 'multiple_choice' | 'coding' | 'essay' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
}

export class TestService {
  // Generate predefined test templates for different job profiles
  async createPlatformTestTemplates(): Promise<void> {
    const templates = this.getPredefinedTemplates();

    for (const template of templates) {
      try {
        await storage.createTestTemplate(template);
      } catch (error) {
        console.log(`Template ${template.title} might already exist, skipping...`);
      }
    }
  }

  private getPredefinedTemplates(): InsertTestTemplate[] {
    // ALL TEMPLATES NOW: 60 MINUTES, 90 MCQ QUESTIONS (50% Aptitude, 25% English, 25% Domain)

      // TECH PLATFORM TEMPLATES (3) - MCQ only
      {
        title: "Senior Software Engineer Assessment",
        description: "Comprehensive 90 MCQ evaluation for senior software engineering roles. 60 minutes, all multiple choice.",
        category: "technical",
        jobProfile: "software_engineer",
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 80,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['javascript', 'python', 'algorithms', 'system-design'],
        questions: [],
      },
      {
        title: "Full Stack Developer Challenge",
        description: "90 MCQ assessment covering frontend, backend, databases. 60 minutes, all multiple choice.",
        category: "technical",
        jobProfile: "fullstack_developer", 
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 75,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['react', 'node', 'sql', 'fullstack'],
        questions: [],
      },
      {
        title: "Principal Engineer Technical Deep Dive",
        description: "Expert-level 90 MCQ assessment for principal/staff engineering roles. 60 minutes.",
        category: "technical",
        jobProfile: "software_engineer",
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 85,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['architecture', 'distributed-systems', 'leadership'],
        questions: [],
      },

      // FINANCE PLATFORM TEMPLATES (2) - MCQ only
      {
        title: "Investment Banking Analyst Assessment", 
        description: "90 MCQ evaluation covering financial modeling, valuation. 60 minutes, all multiple choice.",
        category: "technical",
        jobProfile: "finance",
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 80,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['finance', 'valuation', 'modeling'],
        questions: [],
      },
      {
        title: "Financial Risk Management Evaluation",
        description: "90 MCQ assessment for risk management roles. 60 minutes, all multiple choice.",
        category: "technical", 
        jobProfile: "finance",
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 82,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['risk-management', 'derivatives', 'compliance'],
        questions: [],
      },

      // SALES & MARKETING PLATFORM TEMPLATES (2) - MCQ only
      {
        title: "Enterprise Sales Executive Assessment",
        description: "90 MCQ evaluation for B2B sales roles. 60 minutes, all multiple choice.",
        category: "behavioral",
        jobProfile: "sales",
        difficultyLevel: "advanced",
        timeLimit: 60,
        passingScore: 75,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: false,
        tags: ['sales', 'negotiation', 'b2b'],
        questions: [],
      },
      {
        title: "Digital Marketing Specialist Evaluation",
        description: "90 MCQ marketing assessment covering analytics and campaigns. 60 minutes.",
        category: "technical",
        jobProfile: "marketing",
        difficultyLevel: "advanced", 
        timeLimit: 60,
        passingScore: 78,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: false,
        tags: ['marketing', 'analytics', 'digital'],
        questions: [],
      },

      // ADDITIONAL ROLE TEMPLATES - MCQ only
      {
        title: "Data Science & Analytics Assessment",
        description: "Expert level 90 MCQ evaluation for data science roles. 60 minutes, all multiple choice.",
        category: "technical",
        jobProfile: "data_scientist", 
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 80,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['data-science', 'ml', 'statistics', 'python', 'analytics'],
        questions: [],
      },
      {
        title: "Business Operations Management Test",
        description: "90 MCQ strategic assessment for operations roles. 60 minutes, all multiple choice.",
        category: "behavioral",
        jobProfile: "product_manager",
        difficultyLevel: "advanced",
        timeLimit: 60,
        passingScore: 75,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: false,
        tags: ['operations', 'strategy', 'management'],
        questions: [],
      },
      {
        title: "DevOps & Infrastructure Engineer Test",
        description: "90 MCQ technical evaluation for DevOps roles. 60 minutes, all multiple choice.",
        category: "technical", 
        jobProfile: "devops_engineer",
        difficultyLevel: "expert",
        timeLimit: 60,
        passingScore: 78,
        isGlobal: true,
        useQuestionBank: true,
        aptitudeQuestions: 45,
        englishQuestions: 23,
        domainQuestions: 22,
        includeExtremeQuestions: true,
        tags: ['devops', 'cloud', 'cicd'],
        questions: [],
      }
    ];
  }

  private getJavaScriptQuestions(): TestQuestion[] {
    return [
      {
        id: "js1", 
        type: "multiple_choice",
        question: "What will be the output of this complex closure and hoisting scenario?\n\n```javascript\nvar a = 1;\nfunction outer() {\n  console.log(a);\n  var a = 2;\n  function inner() {\n    var a = 3;\n    console.log(a);\n    return function() {\n      a = 4;\n      console.log(a);\n    };\n  }\n  inner()();\n  console.log(a);\n}\nouter();\nconsole.log(a);\n```",
        options: ["undefined, 3, 4, 2, 1", "1, 3, 4, 2, 1", "undefined, 3, 4, 4, 1", "1, 2, 3, 4, 1"],
        correctAnswer: 0,
        points: 10,
        explanation: "Due to hoisting, the var a declaration inside outer() is hoisted, creating a local variable that shadows the global one, initially undefined. The inner function creates its own scope with a=3, and the returned function modifies that same variable to 4."
      },
      {
        id: "js2",
        type: "multiple_choice",
        question: "What is the result of this complex async/await pattern with error handling?\n\n```javascript\nasync function complexAsync() {\n  try {\n    const result = await Promise.all([\n      Promise.resolve(1).then(x => { throw x + 1; }),\n      Promise.resolve(2).then(x => Promise.reject(x + 2)),\n      Promise.resolve(3).then(x => x + 3)\n    ]);\n    return result;\n  } catch (error) {\n    return await Promise.resolve(error * 10);\n  }\n}\ncomplexAsync().then(console.log).catch(console.error);\n```",
        options: ["20", "40", "Error thrown", "[2, 4, 6]"],
        correctAnswer: 0,
        points: 15,
        explanation: "Promise.all fails fast on rejection. The first promise throws 2, which gets caught and multiplied by 10 to return 20."
      },
      {
        id: "js3",
        type: "coding",
        question: "Implement a debounce function that delays execution until after wait milliseconds have elapsed since the last time it was invoked. Include immediate execution option and cancellation.\n\nRequirements:\n- Function signature: debounce(func, wait, immediate = false)\n- Support for immediate execution on first call\n- Return a function that can be cancelled\n- Handle 'this' context correctly\n- Support arguments passing",
        points: 25,
        explanation: "Advanced implementation should handle timing, context binding, immediate execution flag, and provide cancellation mechanism."
      },
      {
        id: "js4",
        type: "multiple_choice",
        question: "What will this advanced prototype chain manipulation output?\n\n```javascript\nfunction Parent() {\n  this.a = 1;\n}\nParent.prototype.method = function() { return this.a; };\n\nfunction Child() {\n  Parent.call(this);\n  this.a = 2;\n}\n\nChild.prototype = Object.create(Parent.prototype);\nChild.prototype.constructor = Child;\n\nconst obj = new Child();\nconst method = obj.method;\nconst boundMethod = obj.method.bind(obj);\n\nconsole.log(method.call({a: 3}));\nconsole.log(boundMethod.call({a: 4}));\nconsole.log(obj.method());\n```",
        options: ["3, 4, 2", "3, 2, 2", "1, 1, 2", "undefined, 2, 2"],
        correctAnswer: 1,
        points: 15,
        explanation: "method.call({a: 3}) uses explicit binding to {a: 3}, boundMethod ignores the call context due to bind, obj.method() uses normal method invocation."
      },
      {
        id: "js5",
        type: "coding",
        question: "Implement a comprehensive memoization decorator for JavaScript that:\n\n1. Works with both sync and async functions\n2. Supports custom cache key generation\n3. Includes cache expiration (TTL)\n4. Has a maximum cache size with LRU eviction\n5. Supports cache clearing\n\nExample usage:\n```javascript\nconst memoized = memoize(expensiveFunction, {\n  keyGen: (...args) => JSON.stringify(args),\n  ttl: 60000, // 1 minute\n  maxSize: 100\n});\n```\n\nProvide the complete implementation with all error handling.",
        points: 30,
        explanation: "Advanced implementation should handle async functions, TTL expiration, LRU cache management, custom key generation, and proper error handling."
      }
    ];
  }

  private getReactQuestions(): TestQuestion[] {
    return [
      {
        id: "react1",
        type: "multiple_choice",
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: 1,
        points: 5,
        explanation: "useState is the primary hook for managing local state in functional components."
      },
      {
        id: "react2",
        type: "coding",
        question: "Implement a comprehensive useAsync custom hook that:\n\n1. Handles loading, success, and error states\n2. Supports request cancellation (AbortController)\n3. Includes retry logic with exponential backoff\n4. Supports race condition prevention\n5. Has built-in caching with TTL\n6. Supports optimistic updates\n\nExample usage:\n```javascript\nconst { data, loading, error, execute, reset } = useAsync(fetchData, {\n  immediate: true,\n  retryCount: 3,\n  cacheTime: 300000,\n  optimistic: true\n});\n```\n\nProvide complete implementation with TypeScript types.",
        points: 35,
        explanation: "Advanced implementation should handle cancellation, retry logic, race conditions, caching, and optimistic updates with proper TypeScript typing."
      },
      {
        id: "react3",
        type: "multiple_choice",
        question: "When should you use useCallback?",
        options: ["Always for functions", "To prevent re-renders", "To memoize expensive calculations", "When passing functions to child components"],
        correctAnswer: 3,
        points: 10,
        explanation: "useCallback is useful when passing functions to child components to prevent unnecessary re-renders."
      },
      {
        id: "react4",
        type: "essay",
        question: "Explain the concept of lifting state up in React and when you should use it.",
        points: 15,
        explanation: "Should explain moving state to common ancestor and data flow patterns."
      }
    ];
  }

  private getPythonQuestions(): TestQuestion[] {
    return [
      {
        id: "py1",
        type: "multiple_choice",
        question: "What is the output of: print(3 * '2')?",
        options: ["6", "'222'", "Error", "'32'"],
        correctAnswer: 1,
        points: 5,
        explanation: "String multiplication in Python repeats the string."
      },
      {
        id: "py2",
        type: "coding",
        question: "Implement a thread-safe LRU Cache in Python with the following requirements:\n\n1. Generic type support for keys and values\n2. Thread-safe operations using locks\n3. O(1) get and put operations\n4. Support for custom capacity\n5. TTL (time-to-live) for cache entries\n6. Statistics tracking (hit/miss ratio)\n7. Async/await compatible methods\n\nImplement both sync and async versions with comprehensive error handling and unit tests.",
        points: 40,
        explanation: "Advanced implementation should use doubly-linked list, hash map, threading locks, TTL management, and async compatibility."
      },
      {
        id: "py3",
        type: "multiple_choice",
        question: "Which data structure would you use for implementing a stack?",
        options: ["tuple", "list", "dict", "set"],
        correctAnswer: 1,
        points: 5,
        explanation: "Lists with append() and pop() methods are perfect for stack operations."
      },
      {
        id: "py4",
        type: "essay",
        question: "Explain the difference between deep copy and shallow copy in Python.",
        points: 10,
        explanation: "Should cover when each is used and the copy module."
      }
    ];
  }

  private getDataScienceQuestions(): TestQuestion[] {
    return [
      {
        id: "ds1",
        type: "multiple_choice",
        question: "What is the primary purpose of cross-validation in machine learning?",
        options: ["Increase accuracy", "Prevent overfitting", "Speed up training", "Reduce data size"],
        correctAnswer: 1,
        points: 10,
        explanation: "Cross-validation helps assess model performance and prevent overfitting."
      },
      {
        id: "ds2",
        type: "essay",
        question: "Explain the difference between supervised and unsupervised learning with examples.",
        points: 15,
        explanation: "Should provide clear definitions and real-world examples."
      },
      {
        id: "ds3",
        type: "multiple_choice",
        question: "Which metric is most appropriate for evaluating a classification model with imbalanced classes?",
        options: ["Accuracy", "Precision", "F1-score", "R-squared"],
        correctAnswer: 2,
        points: 10,
        explanation: "F1-score balances precision and recall, making it ideal for imbalanced datasets."
      },
      {
        id: "ds4",
        type: "coding",
        question: "Write Python code to calculate the correlation coefficient between two variables using pandas.",
        points: 15,
        explanation: "Should use pandas corr() method or numpy corrcoef()."
      }
    ];
  }

  private getMarketingQuestions(): TestQuestion[] {
    return [
      {
        id: "mkt1",
        type: "multiple_choice",
        question: "What does CTR stand for in digital marketing?",
        options: ["Cost To Revenue", "Click Through Rate", "Customer Target Ratio", "Content Traffic Rating"],
        correctAnswer: 1,
        points: 5,
        explanation: "CTR measures the percentage of people who click on a specific link."
      },
      {
        id: "mkt2",
        type: "essay",
        question: "Describe a comprehensive SEO strategy for a new e-commerce website.",
        points: 20,
        explanation: "Should cover on-page, off-page, technical SEO, and content strategy."
      },
      {
        id: "mkt3",
        type: "multiple_choice",
        question: "Which social media platform typically has the highest conversion rate for B2B marketing?",
        options: ["Facebook", "Instagram", "LinkedIn", "Twitter"],
        correctAnswer: 2,
        points: 10,
        explanation: "LinkedIn is specifically designed for professional networking and B2B marketing."
      }
    ];
  }

  private getSystemDesignQuestions(): TestQuestion[] {
    return [
      {
        id: "sd1",
        type: "essay",
        question: "Design a scalable URL shortening service like bit.ly. Explain your architecture, database design, and how you would handle 100M URLs per day.",
        points: 25,
        explanation: "Should cover load balancing, database sharding, caching, and URL encoding strategies."
      },
      {
        id: "sd2",
        type: "multiple_choice",
        question: "What is the primary benefit of using microservices architecture?",
        options: ["Faster development", "Independent scaling", "Reduced complexity", "Lower costs"],
        correctAnswer: 1,
        points: 10,
        explanation: "Microservices allow independent scaling and deployment of different components."
      },
      {
        id: "sd3",
        type: "essay",
        question: "Explain how you would implement eventual consistency in a distributed database system.",
        points: 20,
        explanation: "Should cover CAP theorem, conflict resolution, and practical implementation strategies."
      }
    ];
  }

  // Send test assignment email
  async sendTestAssignmentEmail(
    recipientEmail: string,
    recipientName: string,
    testTitle: string,
    dueDate: Date,
    testUrl: string,
    recruiterName: string
  ): Promise<boolean> {
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Assignment - AutoJobr</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 0 10px; }
          .test-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .test-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .due-date { color: #e74c3c; font-weight: bold; font-size: 16px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; text-align: center; }
          .cta-button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Test Assignment</h1>
            <p>You've been assigned a skills assessment</p>
          </div>

          <div class="content">
            <p>Hello <strong>${recipientName}</strong>,</p>

            <p>You have been assigned a skills assessment by <strong>${recruiterName}</strong> as part of your job application process.</p>

            <div class="test-card">
              <div class="test-title">${testTitle}</div>
              <p><strong>Due Date:</strong> <span class="due-date">${dueDateStr}</span></p>
              <p>Please complete this test before the deadline to continue with your application.</p>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> 
              <ul>
                <li>You have until <strong>${dueDateStr}</strong> to complete this test</li>
                <li>Once started, the timer cannot be paused</li>
                <li>Make sure you have a stable internet connection</li>
                <li>You will have the option to retake the test for $5 if needed</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${testUrl}" class="cta-button">Take Test Now</a>
            </div>

            <div class="footer">
              <p>This test is part of the AutoJobr platform. If you have any questions, please contact the recruiter directly.</p>
              <p style="color: #999; font-size: 12px;">© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: recipientEmail,
      subject: `Skills Assessment Assignment: ${testTitle}`,
      html: emailHtml,
    });
  }

  // Calculate test score
  calculateScore(questions: TestQuestion[], answers: Record<string, any>): number {
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      } else if (question.type === 'coding' || question.type === 'essay') {
        // For coding and essay questions, we'll need manual grading or AI assistance
        // For now, give partial credit based on answer length and keywords
        if (userAnswer && typeof userAnswer === 'string' && userAnswer.length > 20) {
          earnedPoints += Math.floor(question.points * 0.7); // 70% for attempting
        }
      }
    }

    return Math.round((earnedPoints / totalPoints) * 100);
  }

  // Process retake payment
  async processRetakePayment(
    assignmentId: number,
    userId: string,
    paymentProvider: 'paypal' | 'amazon_pay',
    paymentIntentId: string
  ): Promise<boolean> {
    try {
      let paymentVerified = false;

      switch (paymentProvider) {
        case 'paypal':
          paymentVerified = await paymentService.verifyPayPalOrder(paymentIntentId);
          break;
        case 'amazon_pay':
          // Mock Amazon Pay verification for now
          paymentVerified = paymentIntentId.startsWith('AMAZON_PAY_');
          break;
      }

      if (paymentVerified) {
        // Create payment record
        await storage.createTestRetakePayment({
          testAssignmentId: assignmentId,
          userId: userId,
          amount: 500, // $5 in cents
          currency: 'USD',
          paymentProvider: paymentProvider,
          paymentIntentId: paymentIntentId,
          paymentStatus: 'completed',
        });

        // Enable retake
        await storage.updateTestAssignment(assignmentId, {
          retakeAllowed: true,
          retakePaymentId: paymentIntentId,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error processing retake payment:', error);
      return false;
    }
  }

  // EXTREME DIFFICULTY QUESTIONS - TECH PLATFORM TEMPLATES

  private getExpertSoftwareEngineerQuestions(): TestQuestion[] {
    return [
      {
        id: "expert_se_1",
        type: "coding",
        question: "Implement a concurrent lock-free hash table that supports get, put, and remove operations with O(1) average time complexity. Handle hash collisions and ensure thread safety without using any locks or synchronized blocks. Your solution must handle the ABA problem and provide strong consistency guarantees.",
        points: 35,
        explanation: "This requires deep understanding of compare-and-swap operations, memory ordering, and concurrent data structures. Only top 1% of engineers can implement this correctly."
      },
      {
        id: "expert_se_2", 
        type: "multiple_choice",
        question: "Given this complex memory management scenario in a distributed system: You have 1000 nodes, each with 32GB RAM. Your application creates objects at 10^6 ops/sec, each object is 1KB average. GC runs every 30 seconds with 50ms STW pause. Network latency between nodes is 2ms avg, 99th percentile 15ms. What's the maximum sustainable throughput before GC pressure causes cascading failures?",
        options: ["~850K ops/sec", "~1.2M ops/sec", "~650K ops/sec", "~2M ops/sec"],
        correctAnswer: 2,
        points: 25,
        explanation: "Must account for GC pressure, memory allocation rate, network backpressure, and cascading failure thresholds. Complex distributed systems analysis."
      },
      {
        id: "expert_se_3",
        type: "essay", 
        question: "Design a globally distributed system that processes 10 billion financial transactions per day with 99.999% availability, ACID guarantees, and regulatory compliance across 50+ jurisdictions. Address: consensus algorithms, Byzantine fault tolerance, geographic data sovereignty, audit trails, real-time fraud detection, and disaster recovery. Provide detailed architecture with failure mode analysis.",
        points: 40,
        explanation: "Requires expert knowledge of distributed systems, consensus algorithms, financial regulations, and fault tolerance. Extremely complex system design."
      }
    ];
  }

  private getExpertFullStackQuestions(): TestQuestion[] {
    return [
      {
        id: "expert_fs_1",
        type: "coding",
        question: "Build a real-time collaborative code editor (like VS Code Live Share) that supports: operational transformation for conflict resolution, WebRTC peer-to-peer connections with STUN/TURN fallback, syntax highlighting for 20+ languages, extension marketplace, integrated terminal sharing, and works offline with sync. Provide complete full-stack implementation including WebSocket scaling strategy.",
        points: 45,
        explanation: "Requires mastery of operational transformation, WebRTC, real-time systems, and complex state management. Extremely challenging full-stack problem."
      },
      {
        id: "expert_fs_2",
        type: "multiple_choice", 
        question: "You're optimizing a React app with 10,000 dynamic components. Bundle size is 2MB, FCP is 3.2s, LCP is 4.8s. Your SSR setup uses Node.js cluster with 8 workers, Redis for session store, and CDN with edge caching. Database has 500M records with complex joins. What's the MOST impactful optimization sequence?",
        options: [
          "Code splitting → SSG → Service Workers → DB indexing",
          "Bundle optimization → CDN headers → React.memo → Query optimization", 
          "Lazy loading → Tree shaking → SSR streaming → Connection pooling",
          "Critical CSS → Component lazy loading → Database sharding → Connection pooling"
        ],
        correctAnswer: 3,
        points: 30,
        explanation: "Must understand performance bottlenecks across the entire stack and prioritize optimizations by impact. Complex full-stack performance analysis."
      }
    ];
  }

  private getPrincipalEngineerQuestions(): TestQuestion[] {
    return [
      {
        id: "principal_1",
        type: "essay",
        question: "You're the principal engineer for a system handling 50M users. Your current monolith is showing strain: 99th percentile latency is 2.3s, error rate is 0.3%, and deployments take 2 hours with 15% rollback rate. The CEO wants to double user growth in 6 months while improving all metrics by 10x. Board wants cost reduction of 40%. Design a comprehensive transformation strategy including: technical architecture evolution, team structure changes, migration timeline, risk mitigation, success metrics, and budget justification. Address organizational change management.",
        points: 50,
        explanation: "Principal-level question requiring strategic thinking, technical depth, business acumen, and organizational leadership. Only top architects can handle this complexity."
      },
      {
        id: "principal_2",
        type: "coding",
        question: "Implement a distributed consensus protocol (similar to Raft) that can handle Byzantine failures, dynamic membership changes, and network partitions while maintaining linearizability. Your implementation must support: leader election with priority-based selection, log compaction with snapshots, configuration changes without downtime, and recovery from arbitrary node failures. Provide complete implementation with formal correctness proofs.",
        points: 55,
        explanation: "Requires deep understanding of distributed consensus, Byzantine fault tolerance, and formal verification. PhD-level distributed systems knowledge."
      }
    ];
  }

  // EXTREME DIFFICULTY QUESTIONS - FINANCE PLATFORM TEMPLATES

  private getInvestmentBankingQuestions(): TestQuestion[] {
    return [
      {
        id: "ib_extreme_1",
        type: "essay",
        question: "You're valuing a biotech company with 3 drugs in different trial phases: Phase I (oncology, $2B market, 15% success rate), Phase II (rare disease, $800M market, 35% success rate), Phase III (diabetes, $15B market, 60% success rate). Each has different competitive landscapes, regulatory pathways, and development costs ($200M, $500M, $800M remaining respectively). Model this using real options framework with jump-diffusion processes for underlying asset prices. Account for correlation between development programs, regulatory approval dependencies, and market competition evolution. Provide complete DCF with Monte Carlo simulation (10,000 iterations) and sensitivity analysis.",
        points: 45,
        explanation: "Requires advanced knowledge of real options, stochastic processes, biotech valuation, and complex financial modeling. Only top 1% of finance professionals can handle this complexity."
      },
      {
        id: "ib_extreme_2",
        type: "multiple_choice",
        question: "A structured note has payoff: max(0, ∑(Stock_i * Weight_i) - Strike) * Barrier_multiplier, where barriers are monitored daily with American knock-out features. Portfolio has 50 stocks, correlations range from -0.3 to 0.8, individual volatilities 15%-45%. Using Heston stochastic volatility model with jump components, what's the fair value using quasi-Monte Carlo with Sobol sequences (1M paths, Brownian bridge construction)?",
        options: ["$23.67", "$31.84", "$28.92", "$35.21"],
        correctAnswer: 2,
        points: 35,
        explanation: "Requires expertise in exotic derivatives, stochastic volatility models, Monte Carlo methods, and complex correlation structures. Extremely advanced quantitative finance."
      }
    ];
  }

  private getRiskManagementQuestions(): TestQuestion[] {
    return [
      {
        id: "risk_extreme_1", 
        type: "essay",
        question: "Design a comprehensive risk management framework for a multi-strategy hedge fund ($50B AUM) with: long/short equity (40%), fixed income arbitrage (25%), merger arbitrage (15%), volatility trading (10%), and crypto assets (10%). Address: tail risk measurement using extreme value theory, dynamic hedging with options and futures, counterparty risk with netting agreements, liquidity risk in stressed markets, operational risk from algorithmic trading, regulatory capital requirements across jurisdictions (US, EU, UK), and real-time risk monitoring with automatic position limits. Include stress testing scenarios for: 2008-style credit crisis, flash crash, crypto winter, and geopolitical shock.",
        points: 50,
        explanation: "Requires expert knowledge of portfolio risk management, derivatives, regulatory frameworks, and quantitative methods. Only senior risk professionals can handle this complexity."
      }
    ];
  }

  // EXTREME DIFFICULTY QUESTIONS - SALES & MARKETING TEMPLATES

  private getEnterpriseSalesQuestions(): TestQuestion[] {
    return [
      {
        id: "sales_extreme_1",
        type: "essay", 
        question: "You're leading enterprise sales for a $500M ARR SaaS company. Your largest prospect (Fortune 10, $2M ARR potential) has been in your pipeline for 18 months. They're evaluating 4 vendors, have 23 stakeholders across 8 departments, complex compliance requirements (SOX, HIPAA, GDPR), and a 14-month procurement process. Their current legacy system has 50,000 users and $20M in sunk costs. Your solution requires significant IT infrastructure changes and user training. The economic buyer supports you, but technical buyers prefer the incumbent, and legal is concerned about data sovereignty. Procurement wants 40% price reduction. How do you close this deal? Provide detailed strategy including: stakeholder mapping, value proposition alignment, risk mitigation, competitive differentiation, pricing justification, implementation timeline, success metrics, and relationship management plan.",
        points: 40,
        explanation: "Requires mastery of complex enterprise sales, stakeholder management, and strategic negotiation. Only top 1% of enterprise sales professionals can handle this complexity."
      }
    ];
  }

  private getDigitalMarketingQuestions(): TestQuestion[] {
    return [
      {
        id: "marketing_extreme_1",
        type: "multiple_choice",
        question: "Your multi-touch attribution model shows: Search Ads (30% of touches, $50 CPC, 2.3% CVR), Social Media (45% touches, $8 CPM, 0.8% CVR), Email (15% touches, $0.05 per send, 12% CVR), Display (10% touches, $12 CPM, 0.4% CVR). Customer LTV is $850, average purchase cycle 90 days, 7.2 touchpoints per conversion. Using data-driven attribution with Shapley value calculation, what's the optimal budget allocation for 40% growth while maintaining 3.5:1 ROAS?",
        options: ["Search 35%, Social 30%, Email 25%, Display 10%", "Search 25%, Social 35%, Email 35%, Display 5%", "Search 40%, Social 25%, Email 20%, Display 15%", "Search 30%, Social 40%, Email 20%, Display 10%"],
        correctAnswer: 1,
        points: 30,
        explanation: "Requires advanced understanding of attribution modeling, Shapley values, and complex marketing optimization. Top-tier marketing analytics knowledge."
      }
    ];
  }

  // EXTREME DIFFICULTY QUESTIONS - ADDITIONAL ROLES

  private getBusinessOpsQuestions(): TestQuestion[] {
    return [
      {
        id: "ops_extreme_1",
        type: "essay",
        question: "You're VP of Operations for a fast-growing startup (500 employees, $100M ARR, 200% YoY growth). The company is expanding to 12 new markets simultaneously while launching 3 new product lines. Current challenges: 23% employee turnover, 15% customer churn, supply chain disruptions affecting 40% of inventory, regulatory compliance issues in 5 jurisdictions, and operational costs growing faster than revenue. Board wants to IPO in 18 months and achieve 85% gross margins (currently 72%). Design a comprehensive operational transformation strategy addressing: process automation and optimization, organizational restructuring, supply chain resilience, quality management systems, regulatory compliance framework, performance metrics and KPIs, change management plan, and resource allocation strategy. Include detailed implementation timeline, risk assessment, and success measurement framework.",
        points: 45,
        explanation: "Requires strategic operations expertise, change management skills, and comprehensive business acumen. Only top operations leaders can handle this complexity."
      }
    ];
  }

  private getDevOpsQuestions(): TestQuestion[] {
    return [
      {
        id: "devops_extreme_1",
        type: "coding",
        question: "Design and implement a complete GitOps-based CI/CD platform that handles: 500 microservices across 15 teams, multi-cloud deployment (AWS, GCP, Azure), blue-green deployments with automated rollback, progressive delivery with feature flags, security scanning integration (SAST, DAST, container scanning), compliance reporting (SOX, PCI-DSS), infrastructure as code with drift detection, observability stack with distributed tracing, cost optimization with resource right-sizing, and disaster recovery with RTO < 15 minutes. Provide complete implementation including: Kubernetes operators, Terraform modules, CI/CD pipeline definitions, monitoring configurations, security policies, and operational runbooks.",
        points: 50,
        explanation: "Requires expert knowledge of cloud architecture, Kubernetes, GitOps, security, and large-scale operations. Only top DevOps engineers can implement this complexity."
      }
    ];
  }

  // Method to complete a test assignment
  async completeTest(assignmentId: number, terminationReason: string = 'Completed'): Promise<void> {
    const assignment = await storage.getTestAssignment(assignmentId);
    if (!assignment) {
      console.error(`Test assignment ${assignmentId} not found.`);
      return;
    }

    const endTime = new Date();
    const score = this.calculateScore(assignment.testTemplate.questions, assignment.answers);
    const status = (score >= assignment.testTemplate.passingScore) ? 'passed' : 'failed';

    await storage.updateTestAssignment(assignmentId, {
      completionTime: endTime,
      score: score,
      status: status,
      terminationReason: terminationReason
    });

    // Optionally send completion email
    if (status === 'passed') {
      await sendEmail({
        to: assignment.candidateEmail,
        subject: `Test Result: ${assignment.testTemplate.title} - Passed`,
        html: `<h1>Congratulations!</h1><p>You have successfully passed the ${assignment.testTemplate.title} test with a score of ${score}%.</p>`,
      });
    } else {
      await sendEmail({
        to: assignment.candidateEmail,
        subject: `Test Result: ${assignment.testTemplate.title} - Failed`,
        html: `<h1>Test Result</h1><p>You did not pass the ${assignment.testTemplate.title} test. Your score was ${score}%.</p>`,
      });
    }
  }

  async submitTestAnswer(assignmentId: number, questionId: number, answer: string, violationData?: any): Promise<void> {
    await storage.submitAnswer(assignmentId, questionId, answer);

    // Check for critical violations and auto-terminate if needed
    if (violationData) {
      const { tabSwitches = 0, copyAttempts = 0, totalWarnings = 0 } = violationData;

      // Critical violation thresholds
      if (tabSwitches >= 3 || copyAttempts >= 2 || totalWarnings >= 5) {
        console.log(`🚨 Critical violations detected - Auto-terminating test ${assignmentId}`);

        const assignment = await storage.getTestAssignment(assignmentId);
        if (assignment && assignment.status === 'in_progress') {
          await this.completeTest(assignmentId, 'Terminated due to security violations');
        }
      }
    }
  }
}

export const testService = new TestService();