
// AI Features for Chrome Extension
// Handles AI Chat and Resume Generation

class AIFeatures {
  constructor() {
    this.baseUrl = 'https://autojobr.com';
    this.chatHistory = [];
  }

  async init() {
    console.log('🤖 Initializing AI features...');
    
    // Check user access (Premium or has API key)
    const hasAccess = await this.checkAIAccess();
    
    // Initialize AI Chat
    if (hasAccess) {
      document.getElementById('ai-chat-container').style.display = 'block';
      document.getElementById('ai-access-check').style.display = 'none';
      this.initChatListeners();
    } else {
      document.getElementById('ai-chat-container').style.display = 'none';
      document.getElementById('ai-access-check').style.display = 'block';
    }

    // Initialize Resume Generator
    this.initResumeGenerator(hasAccess);

    // Add navigation listener
    document.getElementById('go-to-integrations')?.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.querySelector('[data-tab="settings"]').classList.add('active');
      document.getElementById('settings').classList.add('active');
      // Scroll to integrations section
      setTimeout(() => {
        document.getElementById('integrations-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  async checkAIAccess() {
    try {
      const response = await fetch(`${this.baseUrl}/api/user`, {
        credentials: 'include'
      });
      
      if (!response.ok) return false;
      
      const user = await response.json();
      
      // Check if premium or has Groq API key
      const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
      
      // Check for user's own API key
      const integrationsResponse = await fetch(`${this.baseUrl}/api/integrations/list`, {
        credentials: 'include'
      });
      
      if (integrationsResponse.ok) {
        const integrations = await integrationsResponse.json();
        const hasGroqKey = integrations.some(int => int.integrationId === 'groq' && int.isEnabled);
        return isPremium || hasGroqKey;
      }
      
      return isPremium;
    } catch (error) {
      console.error('Error checking AI access:', error);
      return false;
    }
  }

  initChatListeners() {
    const sendBtn = document.getElementById('send-ai-question');
    const questionInput = document.getElementById('ai-question');
    
    sendBtn?.addEventListener('click', () => this.sendQuestion());
    questionInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendQuestion();
      }
    });
  }

  async sendQuestion() {
    const questionInput = document.getElementById('ai-question');
    const question = questionInput.value.trim();
    
    if (!question) return;

    // Add user message to chat
    this.addMessageToChat('user', question);
    questionInput.value = '';

    // Show loading
    document.getElementById('ai-loading').style.display = 'block';

    try {
      const response = await fetch(`${this.baseUrl}/api/extension/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          question,
          chatHistory: this.chatHistory.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      this.addMessageToChat('ai', data.answer);
      
      // Update chat history
      this.chatHistory.push({ role: 'user', content: question });
      this.chatHistory.push({ role: 'assistant', content: data.answer });

    } catch (error) {
      console.error('AI Chat error:', error);
      this.addMessageToChat('ai', '❌ Sorry, I encountered an error. Please try again or check your API key settings.');
    } finally {
      document.getElementById('ai-loading').style.display = 'none';
    }
  }

  addMessageToChat(type, message) {
    const chatContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'user' ? 'user-message' : 'ai-message';
    
    if (type === 'user') {
      messageDiv.innerHTML = `<strong>You:</strong> ${this.escapeHtml(message)}`;
    } else {
      messageDiv.innerHTML = `<strong>AI:</strong> ${this.escapeHtml(message)}`;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  initResumeGenerator(hasAccess) {
    const generateBtn = document.getElementById('generate-tailored-resume');
    
    if (!hasAccess) {
      document.getElementById('resume-gen-access-check').style.display = 'block';
      generateBtn.disabled = true;
      generateBtn.style.opacity = '0.5';
      return;
    }

    generateBtn?.addEventListener('click', () => this.generateTailoredResume());
  }

  async generateTailoredResume() {
    const statusDiv = document.getElementById('resume-gen-status');
    const messageEl = document.getElementById('resume-gen-message');
    const generateBtn = document.getElementById('generate-tailored-resume');
    
    // Get current job description from page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'getJobDescription' }, async (response) => {
      if (!response || !response.jobDescription) {
        messageEl.textContent = '❌ Could not extract job description. Please navigate to a job posting.';
        statusDiv.style.display = 'block';
        return;
      }

      statusDiv.style.display = 'block';
      messageEl.innerHTML = '⏳ Generating tailored resume... This may take 20-30 seconds.';
      generateBtn.disabled = true;

      try {
        const response = await fetch(`${this.baseUrl}/api/premium/ai/generate-tailored-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jobDescription: response.jobDescription,
            jobTitle: response.jobTitle || 'Position',
            targetCompany: response.company || undefined
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to generate resume');
        }

        const data = await response.json();
        
        messageEl.innerHTML = `✅ Resume generated! <a href="#" id="download-resume-link" style="color: #007bff; text-decoration: underline;">Download PDF</a>`;
        
        // Add download functionality
        document.getElementById('download-resume-link')?.addEventListener('click', async (e) => {
          e.preventDefault();
          await this.downloadResumePDF(data);
        });

      } catch (error) {
        console.error('Resume generation error:', error);
        messageEl.textContent = `❌ ${error.message}`;
      } finally {
        generateBtn.disabled = false;
      }
    });
  }

  async downloadResumePDF(resumeData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/premium/ai/download-tailored-resume-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeData: resumeData.tailoredResume,
          templateStyle: 'harvard',
          pageFormat: '2-page'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_Resume_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      document.getElementById('resume-gen-message').textContent = '✅ Resume downloaded successfully!';
    } catch (error) {
      console.error('Download error:', error);
      document.getElementById('resume-gen-message').textContent = '❌ Failed to download PDF';
    }
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
  const aiFeatures = new AIFeatures();
  aiFeatures.init();
});
