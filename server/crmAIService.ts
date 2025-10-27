import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use Llama 3.1 8B for cost-effective, low-token AI insights
const AI_MODEL = "llama-3.1-8b-instant";

export class CrmAIService {
  // Low-token contact insights (50-100 tokens)
  static async getContactInsight(contact: any): Promise<string> {
    const prompt = `Contact: ${contact.name}, ${contact.contactType}, ${contact.company || 'N/A'}. Last contact: ${contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'Never'}. Generate ONE actionable insight in 15 words max.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content || "Follow up to maintain relationship";
  }

  // Smart follow-up suggestions (60 tokens)
  static async suggestFollowUp(contact: any, interactions: any[]): Promise<string> {
    const lastInteraction = interactions[0];
    const prompt = `${contact.name} at ${contact.company}. Last interaction: ${lastInteraction?.interactionType || 'none'}, ${lastInteraction?.outcome || 'neutral'}. Suggest ONE specific follow-up action in 20 words.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 60,
    });

    return completion.choices[0]?.message?.content || "Schedule follow-up call next week";
  }

  // Email subject line generator (30 tokens)
  static async generateEmailSubject(contact: any, purpose: string): Promise<string> {
    const prompt = `Email to ${contact.name} about ${purpose}. Write compelling subject line, 8 words max:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: AI_MODEL,
      temperature: 0.5,
      max_tokens: 30,
    });

    return completion.choices[0]?.message?.content?.replace(/['"]/g, '') || `Following up: ${purpose}`;
  }

  // Contact priority scoring (40 tokens)
  static async prioritizeContact(contact: any): Promise<{ score: number; reason: string }> {
    const daysSinceContact = contact.lastContactDate 
      ? Math.floor((Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const prompt = `Contact: ${contact.contactType}, ${daysSinceContact} days since last touch, ${contact.tags?.length || 0} tags. Priority score 1-10 and brief reason:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: AI_MODEL,
      temperature: 0.2,
      max_tokens: 40,
    });

    const response = completion.choices[0]?.message?.content || "5: Standard follow-up";
    const score = parseInt(response.match(/\d+/)?.[0] || "5");
    const reason = response.split(':')[1]?.trim() || "Regular contact";

    return { score, reason };
  }

  // Quick message template (80 tokens)
  static async generateQuickMessage(contact: any, messageType: 'follow_up' | 'introduction' | 'thank_you'): Promise<string> {
    const templates = {
      follow_up: `Quick professional follow-up message to ${contact.name} at ${contact.company}. 25 words max:`,
      introduction: `Brief professional introduction to ${contact.name}, ${contact.jobTitle || 'professional'}. 30 words max:`,
      thank_you: `Concise thank you message to ${contact.name} for recent interaction. 20 words max:`
    };

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: templates[messageType] }],
      model: AI_MODEL,
      temperature: 0.6,
      max_tokens: 80,
    });

    return completion.choices[0]?.message?.content || "Thank you for your time. Looking forward to connecting soon.";
  }
}