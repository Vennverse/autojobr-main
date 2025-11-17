
// Resume Generator Module - Handles AI resume generation
class ResumeGenerator {
  constructor(apiClient, notificationManager) {
    this.apiClient = apiClient;
    this.notificationManager = notificationManager;
    this.groqApiUrl = 'https://api.groq.com/openai/v1';
  }

  async generateResume(jobDescription, additionalRequirements, apiKey) {
    if (!jobDescription) {
      return { success: false, error: 'Job description is required' };
    }

    if (!apiKey) {
      return { success: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(`${this.groqApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume writer. Create ATS-optimized resumes tailored to job descriptions.'
            },
            {
              role: 'user',
              content: `Create a professional, ATS-optimized resume for this job:\n\nJob Description:\n${jobDescription}\n\nAdditional Requirements:\n${additionalRequirements || 'None'}\n\nProvide the resume in a clean, structured format with sections: Summary, Experience, Skills, Education.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const resumeContent = data.choices[0]?.message?.content;

      if (!resumeContent) {
        throw new Error('No resume content generated');
      }

      return { success: true, resume: resumeContent };
    } catch (error) {
      console.error('Resume generation error:', error);
      return { success: false, error: error.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.ResumeGenerator = ResumeGenerator;
}
