import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in environment variables");
  process.exit(1);
}

const client = new Groq({ apiKey: GROQ_API_KEY });

// Groq pricing (as of 2024-2025) - Updated based on docs
const KNOWN_PRICING = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.3-70b-specdec': { input: 0.59, output: 0.79 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama3-70b-8192': { input: 0.59, output: 0.79 },
  'llama3-8b-8192': { input: 0.05, output: 0.08 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  'gemma-7b-it': { input: 0.07, output: 0.07 },
  'gemma2-9b-it': { input: 0.20, output: 0.20 },
};

// Estimate pricing for unknown models based on size
function estimatePricing(modelId) {
  // Check if we have exact pricing
  if (KNOWN_PRICING[modelId]) {
    return KNOWN_PRICING[modelId];
  }

  // Estimate based on model size patterns
  const lowerModel = modelId.toLowerCase();

  if (lowerModel.includes('70b') || lowerModel.includes('72b')) {
    return { input: 0.59, output: 0.79, estimated: true };
  } else if (lowerModel.includes('8b') || lowerModel.includes('7b') || lowerModel.includes('9b')) {
    return { input: 0.05, output: 0.08, estimated: true };
  } else if (lowerModel.includes('3b')) {
    return { input: 0.06, output: 0.06, estimated: true };
  } else if (lowerModel.includes('mixtral') || lowerModel.includes('8x7b')) {
    return { input: 0.24, output: 0.24, estimated: true };
  }

  // Default fallback
  return { input: 0.10, output: 0.10, estimated: true };
}

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: "Career Analysis",
    prompt: `Career path analysis. Return JSON only.

TARGET: Data Scientist
LOCATION: Delhi, India
TIMEFRAME: 2 years
CURRENT: Data Analyst, 3yr exp
SKILLS: Python, SQL, ML

JSON:
{
  "insights": [{"type": "path", "title": "Strategy", "content": "plan", "priority": "high", "actionItems": ["2-3 actions"]}],
  "careerPath": {"steps": [{"role": "title", "timeline": "months", "salary": "₹X-YL"}]},
  "skillGaps": [{"skill": "name", "priority": "level"}]
}`,
    maxTokens: 1200
  },
  {
    name: "Resume Analysis",
    prompt: `Analyze resume for ATS. JSON only.

RESUME: Software Engineer, 5yr exp, React/Node.js/Python. Led 3 projects.

JSON:
{
  "atsScore": 70,
  "scoreBreakdown": {"keywords": {"score": 18, "maxScore": 25}},
  "recommendations": ["top 3"]
}`,
    maxTokens: 800
  },
  {
    name: "Job Match",
    prompt: `Job match. JSON only.

JOB: Senior Dev @ Tech Corp, needs React/Node.js/AWS, 5+ yr
USER: 4yr exp, React/Node.js, basic AWS

JSON:
{"matchScore": 75, "matchingSkills": ["skills"], "missingSkills": ["skills"], "recommendation": "apply/consider/skip"}`,
    maxTokens: 500
  }
];

// Fetch all available models
async function fetchAvailableModels() {
  console.log("\n🔍 Fetching available Groq models...\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || [];

    console.log(`✅ Found ${models.length} available models\n`);

    // Sort by context window size for better organization
    models.sort((a, b) => {
      const aContext = a.context_window || 0;
      const bContext = b.context_window || 0;
      return bContext - aContext;
    });

    return models;
  } catch (error) {
    console.error(`❌ Error fetching models: ${error.message}`);
    return [];
  }
}

async function testModel(modelInfo, scenario) {
  const startTime = Date.now();
  const modelId = modelInfo.id;

  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Expert career advisor. Return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: scenario.prompt
        }
      ],
      model: modelId,
      temperature: 0.2,
      max_tokens: scenario.maxTokens,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = completion.choices[0]?.message?.content;
    const usage = completion.usage;

    // Calculate cost
    const pricing = estimatePricing(modelId);
    const inputCost = (usage.prompt_tokens / 1000000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000000) * pricing.output;
    const totalCost = inputCost + outputCost;

    // Quality metrics
    let jsonValid = false;
    let parsed = null;
    let jsonError = null;
    let hasMarkdownWrapper = false;

    try {
      if (response.includes('```json') || response.includes('```')) {
        hasMarkdownWrapper = true;
      }

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : cleaned;
      parsed = JSON.parse(jsonContent);
      jsonValid = true;
    } catch (e) {
      jsonError = e.message.substring(0, 100);
    }

    const qualityMetrics = {
      jsonValid,
      hasMarkdownWrapper,
      jsonError,
      responseLength: response.length,
      completionTokens: usage.completion_tokens,
      hasLocationContext: response.toLowerCase().includes('delhi') || response.includes('₹'),
      hasCurrency: response.includes('₹') || response.includes('INR'),
      hasSpecificNumbers: /\d+/.test(response),
    };

    return {
      model: modelId,
      modelInfo,
      scenario: scenario.name,
      duration,
      usage,
      cost: totalCost,
      pricing,
      response,
      parsed,
      qualityMetrics,
      success: true
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      model: modelId,
      modelInfo,
      scenario: scenario.name,
      duration,
      error: error.message,
      success: false
    };
  }
}

async function runTests() {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🚀 Comprehensive Groq Model Testing`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`${"=".repeat(80)}\n`);

  // Fetch available models
  const availableModels = await fetchAvailableModels();

  if (availableModels.length === 0) {
    console.log("❌ No models available for testing\n");
    return;
  }

  // Display available models
  console.log(`📋 Available Models:\n`);
  availableModels.forEach((model, index) => {
    const pricing = estimatePricing(model.id);
    const priceLabel = pricing.estimated ? '(estimated)' : '';
    console.log(`${index + 1}. ${model.id}`);
    console.log(`   Owner: ${model.owned_by || 'N/A'}`);
    console.log(`   Context: ${(model.context_window || 0).toLocaleString()} tokens`);
    console.log(`   Pricing: $${pricing.input}/1M in, $${pricing.output}/1M out ${priceLabel}`);
    console.log(``);
  });

  const allResults = [];

  // Test each scenario
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n${"▓".repeat(80)}`);
    console.log(`📝 Testing Scenario: ${scenario.name}`);
    console.log(`${"▓".repeat(80)}\n`);

    for (const modelInfo of availableModels) {
      console.log(`🤖 Model: ${modelInfo.id}`);
      console.log(`${"-".repeat(80)}`);

      const result = await testModel(modelInfo, scenario);
      allResults.push(result);

      if (result.success) {
        const pricingNote = result.pricing.estimated ? ' (estimated)' : '';

        console.log(`⏱️  Speed: ${result.duration}ms`);
        console.log(`📊 Tokens: ${result.usage.total_tokens} (${result.usage.prompt_tokens} in + ${result.usage.completion_tokens} out)`);
        console.log(`💰 Cost: $${result.cost.toFixed(6)}${pricingNote}`);
        console.log(`📈 Per 1K: $${(result.cost * 1000).toFixed(2)}`);

        console.log(`\n🎯 Quality:`);
        console.log(`   JSON Valid: ${result.qualityMetrics.jsonValid ? '✅' : '❌'}`);
        console.log(`   Markdown Wrapper: ${result.qualityMetrics.hasMarkdownWrapper ? '⚠️' : '✅'}`);
        console.log(`   Location Context: ${result.qualityMetrics.hasLocationContext ? '✅' : '❌'}`);

        if (result.qualityMetrics.jsonError) {
          console.log(`   ⚠️  Parse Error: ${result.qualityMetrics.jsonError}`);
        }

        console.log(`\n📄 Preview (300 chars):`);
        console.log(result.response.substring(0, 300) + '...\n');
      } else {
        console.log(`❌ Error: ${result.error}`);
        console.log(`⏱️  Failed: ${result.duration}ms\n`);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // Comprehensive Analysis
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 COMPREHENSIVE ANALYSIS`);
  console.log(`${"=".repeat(80)}\n`);

  const successfulResults = allResults.filter(r => r.success);

  if (successfulResults.length === 0) {
    console.log("❌ No successful tests to analyze\n");
    return;
  }

  // Group by model
  const modelGroups = {};
  const uniqueModels = [...new Set(successfulResults.map(r => r.model))];

  uniqueModels.forEach(modelId => {
    modelGroups[modelId] = successfulResults.filter(r => r.model === modelId);
  });

  // Per-model statistics
  console.log(`📈 Model Performance Summary:\n`);

  const modelStats = [];

  for (const [modelId, results] of Object.entries(modelGroups)) {
    if (results.length === 0) continue;

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const avgCost = results.reduce((sum, r) => sum + r.cost, 0) / results.length;
    const avgTokens = results.reduce((sum, r) => sum + r.usage.total_tokens, 0) / results.length;
    const avgCompletionTokens = results.reduce((sum, r) => sum + r.usage.completion_tokens, 0) / results.length;
    const jsonSuccessRate = (results.filter(r => r.qualityMetrics.jsonValid).length / results.length) * 100;
    const hasMarkdownRate = (results.filter(r => r.qualityMetrics.hasMarkdownWrapper).length / results.length) * 100;
    const contextWindow = results[0].modelInfo.context_window || 0;

    const stats = {
      modelId,
      avgDuration,
      avgCost,
      avgTokens,
      avgCompletionTokens,
      jsonSuccessRate,
      hasMarkdownRate,
      contextWindow,
      results
    };

    modelStats.push(stats);

    console.log(`${modelId}:`);
    console.log(`   ⏱️  Avg Speed: ${avgDuration.toFixed(0)}ms`);
    console.log(`   🎯 Avg Tokens: ${avgTokens.toFixed(0)} (${avgCompletionTokens.toFixed(0)} completion)`);
    console.log(`   💰 Avg Cost: $${avgCost.toFixed(6)}`);
    console.log(`   📊 JSON Success: ${jsonSuccessRate.toFixed(0)}%`);
    console.log(`   ⚠️  Markdown Wrap: ${hasMarkdownRate.toFixed(0)}%`);
    console.log(`   📏 Context Window: ${contextWindow.toLocaleString()} tokens`);
    console.log(``);
  }

  // Sort by cost
  modelStats.sort((a, b) => a.avgCost - b.avgCost);

  // Cost comparison at scale
  console.log(`\n💵 Cost Comparison at Scale:\n`);

  const scales = [1000, 10000, 100000];
  for (const scale of scales) {
    console.log(`At ${scale.toLocaleString()} requests/month:`);
    modelStats.forEach(stat => {
      const totalCost = stat.avgCost * scale;
      console.log(`   ${stat.modelId}: $${totalCost.toFixed(2)}`);
    });
    console.log(``);
  }

  // Recommendations
  console.log(`\n🏆 Recommendations:\n`);

  const fastest = modelStats.reduce((prev, curr) => 
    prev.avgDuration < curr.avgDuration ? prev : curr
  );
  const cheapest = modelStats[0]; // Already sorted by cost
  const mostReliable = modelStats.reduce((prev, curr) => 
    prev.jsonSuccessRate > curr.jsonSuccessRate ? prev : curr
  );

  console.log(`⚡ Fastest Model: ${fastest.modelId} (${fastest.avgDuration.toFixed(0)}ms avg)`);
  console.log(`💵 Cheapest Model: ${cheapest.modelId} ($${cheapest.avgCost.toFixed(6)} per request)`);
  console.log(`🎯 Most Reliable: ${mostReliable.modelId} (${mostReliable.jsonSuccessRate.toFixed(0)}% JSON success)`);

  // Strategic recommendations
  console.log(`\n💡 Strategic Recommendations:\n`);

  const cheapModels = modelStats.filter(s => s.avgCost < 0.0001);
  const qualityModels = modelStats.filter(s => s.jsonSuccessRate >= 95);

  if (cheapModels.length > 0 && qualityModels.length > 0) {
    console.log(`For Free Tier (high volume):`);
    console.log(`   Recommended: ${cheapModels[0].modelId}`);
    console.log(`   Cost at 100K: $${(cheapModels[0].avgCost * 100000).toFixed(2)}`);
    console.log(``);

    console.log(`For Premium Tier (quality focus):`);
    const bestQuality = qualityModels.sort((a, b) => b.avgCompletionTokens - a.avgCompletionTokens)[0];
    console.log(`   Recommended: ${bestQuality.modelId}`);
    console.log(`   Cost at 100K: $${(bestQuality.avgCost * 100000).toFixed(2)}`);
    console.log(``);

    const costDiff = bestQuality.avgCost - cheapModels[0].avgCost;
    console.log(`Cost difference at 100K requests: $${(costDiff * 100000).toFixed(2)}/month`);
  }

  console.log(`\n✅ Test completed!\n`);
}

runTests().catch(console.error);