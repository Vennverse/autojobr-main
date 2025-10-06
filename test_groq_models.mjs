
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in environment variables");
  process.exit(1);
}

const client = new Groq({ apiKey: GROQ_API_KEY });

// Test prompt for career analysis
const testPrompt = `Career path analysis. Return JSON only.

TARGET ROLE: Data Scientist
LOCATION: Delhi
DESIRED TIMEFRAME: 2-years
CURRENT EXPERIENCE: 3 years
CURRENT TITLE: Data Analyst
CURRENT SKILLS: Python, SQL, Excel, Power BI, Statistics, Machine Learning
RECENT PROGRESS: Completed advanced ML course

CRITICAL REQUIREMENTS:
1. Detect location and provide salaries in LOCAL currency with symbol (₹)
2. Calculate REALISTIC timelines based on user's current experience (3yr)
3. Consider location-specific market conditions and cost of living
4. Provide Delhi-specific companies and resources

JSON structure:
{
  "insights": [
    {
      "type": "path",
      "title": "Career Strategy",
      "content": "Personalized strategy for 3yr exp professional",
      "priority": "high",
      "timeframe": "2-years",
      "actionItems": ["3-4 specific actions based on current level"]
    },
    {
      "type": "skill",
      "title": "Skill Development",
      "content": "Priority skills considering current 3yr experience",
      "priority": "high",
      "timeframe": "6-9 months",
      "actionItems": ["2-3 learning actions"]
    }
  ],
  "careerPath": {
    "currentRole": "Data Analyst",
    "targetRole": "Data Scientist",
    "steps": [
      {
        "role": "Senior Data Analyst",
        "timeline": "6-9 months",
        "salaryRange": "₹8-12L",
        "requiredSkills": ["Advanced Python", "SQL", "ML basics"],
        "marketDemand": "high"
      },
      {
        "role": "Junior Data Scientist",
        "timeline": "12-15 months",
        "salaryRange": "₹12-18L",
        "requiredSkills": ["ML/DL", "Stats", "Big Data"],
        "marketDemand": "high"
      }
    ],
    "successProbability": 75
  },
  "skillGaps": [
    {
      "skill": "Deep Learning",
      "currentLevel": "beginner",
      "targetLevel": "intermediate",
      "priority": "critical",
      "timeToLearn": "3-4 months"
    }
  ]
}`;

async function testModel(modelName, modelLabel) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🤖 Testing Model: ${modelLabel} (${modelName})`);
  console.log(`${"=".repeat(80)}\n`);

  const startTime = Date.now();

  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert career advisor. Analyze career paths and provide actionable insights. Return valid JSON only."
        },
        {
          role: "user",
          content: testPrompt
        }
      ],
      model: modelName,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = completion.choices[0]?.message?.content;
    const usage = completion.usage;

    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`\n📊 Token Usage:`);
    console.log(`   - Prompt Tokens: ${usage.prompt_tokens}`);
    console.log(`   - Completion Tokens: ${usage.completion_tokens}`);
    console.log(`   - Total Tokens: ${usage.total_tokens}`);
    
    // Calculate approximate cost (Groq pricing)
    const inputCost = (usage.prompt_tokens / 1000000) * 0.05; // $0.05 per 1M input tokens
    const outputCost = (usage.completion_tokens / 1000000) * 0.08; // $0.08 per 1M output tokens
    const totalCost = inputCost + outputCost;
    
    console.log(`\n💰 Approximate Cost:`);
    console.log(`   - Input: $${inputCost.toFixed(6)}`);
    console.log(`   - Output: $${outputCost.toFixed(6)}`);
    console.log(`   - Total: $${totalCost.toFixed(6)}`);

    console.log(`\n📝 Response Preview (first 500 chars):`);
    console.log(response.substring(0, 500));
    console.log("...\n");

    // Try to parse JSON
    try {
      const parsed = JSON.parse(response);
      console.log(`✅ Valid JSON Response`);
      console.log(`   - Insights: ${parsed.insights?.length || 0}`);
      console.log(`   - Career Steps: ${parsed.careerPath?.steps?.length || 0}`);
      console.log(`   - Skill Gaps: ${parsed.skillGaps?.length || 0}`);
    } catch (e) {
      console.log(`❌ JSON Parse Error: ${e.message}`);
    }

    return {
      model: modelName,
      label: modelLabel,
      duration,
      usage,
      cost: totalCost,
      response,
      success: true
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ Error: ${error.message}`);
    console.log(`⏱️  Failed after: ${duration}ms`);

    return {
      model: modelName,
      label: modelLabel,
      duration,
      error: error.message,
      success: false
    };
  }
}

async function runTests() {
  console.log(`\n🚀 Starting Groq Model Comparison Test`);
  console.log(`📅 ${new Date().toISOString()}\n`);

  const models = [
    { name: "llama-3.3-70b-versatile", label: "Premium Model (70B)" },
    { name: "llama-3.1-8b-instant", label: "Basic Model (8B)" },
    { name: "llama-3.2-3b-preview", label: "Light Model (3B)" }
  ];

  const results = [];

  for (const model of models) {
    const result = await testModel(model.name, model.label);
    results.push(result);
    
    // Wait 2 seconds between requests to avoid rate limiting
    if (models.indexOf(model) < models.length - 1) {
      console.log("\n⏳ Waiting 2 seconds before next test...\n");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 COMPARISON SUMMARY`);
  console.log(`${"=".repeat(80)}\n`);

  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length > 0) {
    console.log(`Model Performance Comparison:\n`);
    
    successfulResults.forEach(result => {
      console.log(`${result.label}:`);
      console.log(`   ⏱️  Speed: ${result.duration}ms`);
      console.log(`   🎯 Tokens: ${result.usage.total_tokens} (${result.usage.prompt_tokens} in + ${result.usage.completion_tokens} out)`);
      console.log(`   💰 Cost: $${result.cost.toFixed(6)}`);
      console.log(`   📈 Cost per 1000 requests: $${(result.cost * 1000).toFixed(2)}`);
      console.log(``);
    });

    // Find best for different use cases
    const fastest = successfulResults.reduce((prev, curr) => 
      prev.duration < curr.duration ? prev : curr
    );
    const cheapest = successfulResults.reduce((prev, curr) => 
      prev.cost < curr.cost ? prev : curr
    );
    const mostTokens = successfulResults.reduce((prev, curr) => 
      prev.usage.completion_tokens > curr.usage.completion_tokens ? prev : curr
    );

    console.log(`\n🏆 Recommendations:\n`);
    console.log(`   ⚡ Fastest: ${fastest.label} (${fastest.duration}ms)`);
    console.log(`   💵 Cheapest: ${cheapest.label} ($${cheapest.cost.toFixed(6)})`);
    console.log(`   📝 Most Detailed: ${mostTokens.label} (${mostTokens.usage.completion_tokens} tokens)`);
  }

  console.log(`\n✅ Test completed!\n`);
}

runTests().catch(console.error);
