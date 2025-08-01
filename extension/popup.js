// Enhanced AutoJobr Popup with Advanced Features
const API_BASE_URL = 'https://474e72d5-d02a-4881-a1b1-207472132974-00-13rhdq6o0h8j1.worf.replit.dev';

class AutoJobrPopup {
  constructor() {
    this.currentTab = null;
    this.userProfile = null;
    this.jobData = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.cache = new Map();
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Initialize UI
      this.initializeEventListeners();
      this.showLoading(true);
      
      // Check connection and authentication
      await this.checkConnection();
      await this.loadUserProfile();
      await this.analyzeCurrentPage();
      
      this.showLoading(false);
      
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize extension');
      this.showLoading(false);
    }
  }

  initializeEventListeners() {
    // Action buttons
    document.getElementById('autofillBtn').addEventListener('click', () => this.handleAutofill());
    document.getElementById('analyzeBtn').addEventListener('click', () => this.handleAnalyze());
    document.getElementById('saveJobBtn').addEventListener('click', () => this.handleSaveJob());
    document.getElementById('coverLetterBtn').addEventListener('click', () => this.handleGenerateCoverLetter());
    
    // Quick action buttons
    document.getElementById('resumeBtn').addEventListener('click', () => this.handleResumeAction());
    document.getElementById('profileBtn').addEventListener('click', () => this.handleProfileAction());
    document.getElementById('historyBtn').addEventListener('click', () => this.handleHistoryAction());
    
    // Footer actions
    document.getElementById('openDashboard').addEventListener('click', () => this.openDashboard());

    // Settings toggles
    this.initializeToggle('autofillToggle', 'autofillEnabled');
    this.initializeToggle('trackingToggle', 'trackingEnabled');
    this.initializeToggle('notificationsToggle', 'notificationsEnabled');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  initializeToggle(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    
    // Load current state
    chrome.storage.sync.get([storageKey], (result) => {
      const isEnabled = result[storageKey] !== false;
      toggle.classList.toggle('active', isEnabled);
    });

    // Handle clicks with animation
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.contains('active');
      const newState = !isActive;
      
      toggle.classList.toggle('active', newState);
      chrome.storage.sync.set({ [storageKey]: newState });
      
      // Show feedback
      this.showNotification(
        `${storageKey.replace('Enabled', '')} ${newState ? 'enabled' : 'disabled'}`,
        newState ? 'success' : 'info'
      );
    });
  }

  async checkConnection() {
    try {
      // Check server health
      const healthResponse = await this.makeApiRequest('/api/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (!healthResponse) {
        throw new Error('Server not reachable');
      }
      
      // Check authentication
      const authResponse = await this.makeApiRequest('/api/user', {
        method: 'GET'
      });
      
      this.isConnected = !!healthResponse;
      this.isAuthenticated = !!authResponse && !authResponse.error;
      
      this.updateConnectionStatus(this.isConnected, this.isAuthenticated);
      
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.updateConnectionStatus(false, false);
    }
  }

  async makeApiRequest(endpoint, options = {}) {
    try {
      // Check cache first for GET requests
      const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
      if (options.method === 'GET' && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return cached.data;
        }
      }

      // Get stored session token
      const result = await chrome.storage.local.get(['sessionToken', 'userId']);
      const sessionToken = result.sessionToken;
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        await chrome.storage.local.remove(['sessionToken', 'userId']);
        this.isAuthenticated = false;
        this.updateConnectionStatus(this.isConnected, false);
        return { error: 'Authentication required' };
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Extract session token from response headers
      const newToken = response.headers.get('X-Session-Token');
      if (newToken) {
        await chrome.storage.local.set({ sessionToken: newToken });
      }
      
      const data = await response.json();
      
      // Cache GET responses
      if (options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        return { error: 'Request timeout' };
      }
      console.error(`API request failed for ${endpoint}:`, error);
      return null;
    }
  }

  updateConnectionStatus(connected, authenticated = false) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('connectionStatus');
    
    if (connected && authenticated) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected & Authenticated';
      this.enableActionButtons();
    } else if (connected && !authenticated) {
      statusDot.classList.add('disconnected');
      statusText.innerHTML = 'Not authenticated - <button class="login-btn" id="loginBtn">Sign In</button>';
      this.disableActionButtons();
      
      // Add login button handler
      setTimeout(() => {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
      }, 100);
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Server unreachable';
      this.disableActionButtons();
    }
  }

  async handleLogin() {
    try {
      this.showNotification('Opening login page...', 'info');
      
      const loginUrl = `${API_BASE_URL}/auth/extension-login`;
      const tab = await chrome.tabs.create({ url: loginUrl });
      
      // Listen for successful authentication
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === tab.id && changeInfo.url) {
          if (changeInfo.url.includes('/auth/extension-success')) {
            const url = new URL(changeInfo.url);
            const token = url.searchParams.get('token');
            const userId = url.searchParams.get('userId');
            
            if (token && userId) {
              chrome.storage.local.set({ 
                sessionToken: token, 
                userId: userId 
              }).then(() => {
                chrome.tabs.remove(tab.id);
                this.checkConnection();
                this.loadUserProfile();
                this.showNotification('Successfully authenticated!', 'success');
              });
            }
            
            chrome.tabs.onUpdated.removeListener(listener);
          }
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
      }, 300000);
      
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Failed to open login page');
    }
  }

  async analyzeCurrentPage() {
    const pageInfo = document.getElementById('pageInfo');
    const url = this.currentTab?.url || '';
    
    // First, try to get analysis data from content script (if auto-analysis was performed)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const analysisData = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentAnalysis' }).catch(() => null);
      
      if (analysisData && analysisData.success && analysisData.analysis) {
        // Use data from automatic analysis
        this.jobData = analysisData.jobData;
        this.displayUnifiedAnalysis(analysisData.analysis, analysisData.jobData);
        this.updatePageInfoWithJob(analysisData.jobData);
        return;
      }
    } catch (error) {
      console.log('No auto-analysis data available, proceeding with manual detection');
    }
    
    // Fallback to manual site detection and analysis
    const supportedSites = [
      { domain: 'linkedin.com', name: 'LinkedIn', icon: '💼' },
      { domain: 'indeed.com', name: 'Indeed', icon: '🔍' },
      { domain: 'glassdoor.com', name: 'Glassdoor', icon: '🏢' },
      { domain: 'ziprecruiter.com', name: 'ZipRecruiter', icon: '⚡' },
      { domain: 'monster.com', name: 'Monster', icon: '👹' },
      { domain: 'dice.com', name: 'Dice', icon: '🎲' },
      { domain: 'stackoverflow.com', name: 'Stack Overflow', icon: '💻' },
      { domain: 'greenhouse.io', name: 'Greenhouse', icon: '🌱' },
      { domain: 'lever.co', name: 'Lever', icon: '⚖️' },
      { domain: 'workday.com', name: 'Workday', icon: '📅' },
      { domain: 'myworkdayjobs.com', name: 'Workday', icon: '📅' }
    ];

    const detectedSite = supportedSites.find(site => url.includes(site.domain));
    
    if (detectedSite) {
      pageInfo.className = 'page-info supported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #22c55e; color: white;">✓</div>
          <strong>${detectedSite.icon} ${detectedSite.name} detected</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Auto-fill and job analysis available</div>
      `;
      
      // Try to detect job details manually
      await this.detectJobDetails();
      
    } else {
      pageInfo.className = 'page-info unsupported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #ef4444; color: white;">!</div>
          <strong>Unsupported job board</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Navigate to a supported job board to enable auto-fill</div>
      `;
      
      this.disableActionButtons();
    }
  }

  updatePageInfoWithJob(jobData) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.className = 'page-info supported';
    pageInfo.innerHTML = `
      <div class="page-info-header">
        <div class="page-info-icon" style="background: #22c55e; color: white;">✓</div>
        <strong>Job Detected & Analyzed</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.8;">${jobData.title} at ${jobData.company}</div>
    `;
  }

  displayUnifiedAnalysis(analysis, jobData) {
    // Show job info
    const jobInfo = document.getElementById('jobInfo');
    const jobTitle = document.getElementById('jobTitle');
    const jobCompany = document.getElementById('jobCompany');
    
    jobTitle.textContent = jobData.title || 'Job Position';
    jobCompany.textContent = jobData.company || 'Company';
    jobInfo.style.display = 'block';
    
    // Display enhanced analysis results
    this.displayEnhancedAnalysisResults(analysis);
  }

  displayEnhancedAnalysisResults(analysis) {
    const scoreSection = document.getElementById('scoreSection');
    const matchScore = document.getElementById('matchScore');
    const scoreFill = document.getElementById('scoreFill');

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    matchScore.textContent = `${Math.round(score)}%`;
    
    // Animate score fill
    setTimeout(() => {
      scoreFill.style.width = `${score}%`;
    }, 100);
    
    scoreSection.style.display = 'block';

    // Update colors based on score
    let color = '#ef4444';
    if (score >= 80) color = '#22c55e';
    else if (score >= 60) color = '#f59e0b';
    else if (score >= 40) color = '#f97316';

    scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
    matchScore.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    matchScore.style.webkitBackgroundClip = 'text';
    matchScore.style.webkitTextFillColor = 'transparent';
    
    // Show detailed score explanations
    this.displayScoreExplanations(analysis);
    
    // Log analysis for debugging
    console.log('Enhanced Analysis Results:', analysis);
  }

  async detectJobDetails() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extractJobDetails'
      });

      if (response && response.success && response.jobData) {
        this.jobData = response.jobData;
        
        // Show job info
        if (this.jobData.title) {
          const jobInfo = document.getElementById('jobInfo');
          const jobTitle = document.getElementById('jobTitle');
          const jobCompany = document.getElementById('jobCompany');
          
          jobTitle.textContent = this.jobData.title;
          jobCompany.textContent = this.jobData.company || 'Company not detected';
          jobInfo.style.display = 'block';
          
          // Analyze job match if user is authenticated
          if (this.isAuthenticated && this.userProfile) {
            await this.showJobAnalysis();
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect job details:', error);
    }
  }

  async showJobAnalysis() {
    if (!this.jobData || !this.userProfile) return;

    try {
      const analysis = await this.makeApiRequest('/api/analyze-job-match', {
        method: 'POST',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (analysis && !analysis.error) {
        const scoreSection = document.getElementById('scoreSection');
        const matchScore = document.getElementById('matchScore');
        const scoreFill = document.getElementById('scoreFill');

        const score = analysis.matchScore || 0;
        matchScore.textContent = `${score}%`;
        
        // Animate score fill
        setTimeout(() => {
          scoreFill.style.width = `${score}%`;
        }, 100);
        
        scoreSection.style.display = 'block';

        // Update colors based on score
        let color = '#ef4444';
        if (score >= 80) color = '#22c55e';
        else if (score >= 60) color = '#f59e0b';
        else if (score >= 40) color = '#f97316';

        scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
        matchScore.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
        matchScore.style.webkitBackgroundClip = 'text';
        matchScore.style.webkitTextFillColor = 'transparent';
        
        // Show detailed score explanations
        this.displayScoreExplanations(analysis);
        
        // Log detailed analysis for debugging
        console.log('Job Analysis Results:', {
          matchScore: analysis.matchScore,
          factors: analysis.factors,
          recommendation: analysis.recommendation,
          userSkillsCount: analysis.userProfile?.skillsCount,
          userTitle: analysis.userProfile?.professionalTitle,
          jobTitle: this.jobData.title,
          jobCompany: this.jobData.company
        });
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
    }
  }

  displayScoreExplanations(analysis) {
    // Create or update score explanation section
    let explanationSection = document.getElementById('scoreExplanation');
    if (!explanationSection) {
      explanationSection = document.createElement('div');
      explanationSection.id = 'scoreExplanation';
      explanationSection.style.cssText = `
        margin-top: 12px;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 12px;
        display: none;
      `;
      document.getElementById('scoreSection').appendChild(explanationSection);
    }

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const matchingSkills = analysis.matchingSkills || analysis.analysis?.matchingSkills || [];
    const missingSkills = analysis.missingSkills || analysis.analysis?.missingSkills || [];
    const recommendation = analysis.applicationRecommendation || analysis.recommendation || 'review_required';
    
    explanationSection.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #e5e7eb;">
        📊 Score Breakdown
      </div>
      
      ${matchingSkills.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #22c55e; font-weight: 500; margin-bottom: 4px;">
            ✅ Matching Skills (${matchingSkills.length})
          </div>
          <div style="color: #d1d5db; font-size: 11px;">
            ${matchingSkills.slice(0, 5).join(', ')}${matchingSkills.length > 5 ? '...' : ''}
          </div>
        </div>
      ` : ''}
      
      ${missingSkills.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #f59e0b; font-weight: 500; margin-bottom: 4px;">
            ⚠️ Missing Skills (${missingSkills.length})
          </div>
          <div style="color: #d1d5db; font-size: 11px;">
            ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? '...' : ''}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="color: #e5e7eb; font-weight: 500; margin-bottom: 4px;">
          💡 Recommendation
        </div>
        <div style="color: #d1d5db; font-size: 11px;">
          ${this.getRecommendationText(recommendation, score)}
        </div>
      </div>
      
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <button id="viewDetailedAnalysis" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #e5e7eb;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          width: 100%;
        ">
          View Detailed Analysis
        </button>
      </div>
    `;

    // Add event listener for detailed analysis
    document.getElementById('viewDetailedAnalysis')?.addEventListener('click', () => {
      this.showDetailedAnalysisModal(analysis);
    });

    explanationSection.style.display = 'block';
  }

  getRecommendationText(recommendation, score) {
    switch (recommendation) {
      case 'strongly_recommended':
        return 'Excellent match! Your profile aligns very well with this role. Apply with confidence.';
      case 'recommended':
        return 'Good match! You meet most requirements. Consider applying with a tailored resume.';
      case 'consider_with_preparation':
        return 'Moderate match. Review missing skills and consider highlighting transferable experience.';
      case 'needs_development':
        return 'Skills gap identified. Consider developing key missing skills before applying.';
      case 'not_recommended':
        return 'Limited match. This role may require significant additional preparation.';
      default:
        if (score >= 70) return 'Strong match - apply now!';
        if (score >= 50) return 'Good match - consider applying';
        return 'Consider tailoring your application';
    }
  }

  showDetailedAnalysisModal(analysis) {
    // Create detailed analysis modal
    const modal = document.createElement('div');
    modal.id = 'detailedAnalysisModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      backdrop-filter: blur(5px);
    `;

    const content = this.buildDetailedAnalysisContent(analysis);
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      ">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
          <h3 style="color: #e5e7eb; margin: 0; font-size: 16px;">Detailed Job Analysis</h3>
          <button id="closeModal" style="
            background: none;
            border: none;
            color: #9ca3af;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
          ">×</button>
        </div>
        ${content}
      </div>
    `;

    document.body.appendChild(modal);

    // Add close functionality
    document.getElementById('closeModal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  buildDetailedAnalysisContent(analysis) {
    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const skillGaps = analysis.skillGaps || {};
    const seniorityLevel = analysis.seniorityLevel || 'Not specified';
    const workMode = analysis.workMode || 'Not specified';
    const tailoringAdvice = analysis.tailoringAdvice || 'Review job requirements carefully';
    const interviewTips = analysis.interviewPrepTips || 'Prepare for standard interview questions';

    return `
      <div style="color: #e5e7eb; font-size: 13px; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${this.getScoreColor(score)}, ${this.getScoreColor(score)}dd);
            margin: 0 auto 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
          ">
            ${Math.round(score)}%
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">Overall Match Score</div>
          <div style="font-size: 11px; opacity: 0.8;">Based on comprehensive analysis</div>
        </div>

        ${skillGaps.critical && skillGaps.critical.length > 0 ? `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(239,68,68,0.1); border-radius: 6px; border-left: 3px solid #ef4444;">
            <div style="font-weight: 600; color: #ef4444; margin-bottom: 4px;">🚨 Critical Skills Gap</div>
            <div style="font-size: 11px; opacity: 0.9;">${skillGaps.critical.join(', ')}</div>
          </div>
        ` : ''}

        ${skillGaps.important && skillGaps.important.length > 0 ? `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(245,158,11,0.1); border-radius: 6px; border-left: 3px solid #f59e0b;">
            <div style="font-weight: 600; color: #f59e0b; margin-bottom: 4px;">⚠️ Important Skills</div>
            <div style="font-size: 11px; opacity: 0.9;">${skillGaps.important.join(', ')}</div>
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
            <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">Seniority Level</div>
            <div style="font-weight: 500;">${seniorityLevel}</div>
          </div>
          <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
            <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">Work Mode</div>
            <div style="font-weight: 500;">${workMode}</div>
          </div>
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: rgba(34,197,94,0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
          <div style="font-weight: 600; color: #22c55e; margin-bottom: 4px;">💡 Tailoring Advice</div>
          <div style="font-size: 11px; opacity: 0.9;">${tailoringAdvice}</div>
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: rgba(59,130,246,0.1); border-radius: 6px; border-left: 3px solid #3b82f6;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">🎯 Interview Tips</div>
          <div style="font-size: 11px; opacity: 0.9;">${interviewTips}</div>
        </div>
      </div>
    `;
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) return;

    try {
      const profile = await this.makeApiRequest('/api/extension/profile');
      if (profile && !profile.error) {
        this.userProfile = profile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async handleAutofill() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to use auto-fill');
      return;
    }

    if (!this.userProfile) {
      this.showError('User profile not loaded');
      return;
    }

    this.showLoading(true);

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'startAutofill',
        userProfile: this.userProfile
      });

      if (response && response.success) {
        this.showNotification(
          `✅ Auto-filled ${response.fieldsFilled}/${response.fieldsFound} fields!`,
          'success'
        );
        
        // Track the application
        await this.trackApplication();
      } else {
        throw new Error(response?.error || 'Auto-fill failed');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      this.showError('Auto-fill failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAnalyze() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to analyze jobs');
      return;
    }

    this.showLoading(true);

    try {
      await this.detectJobDetails();
      await this.showJobAnalysis();
      this.showNotification('✅ Job analysis completed!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Job analysis failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleSaveJob() {
    if (!this.isAuthenticated || !this.jobData) {
      this.showError('Please ensure you\'re authenticated and on a job page');
      return;
    }

    this.showLoading(true);

    try {
      const result = await this.makeApiRequest('/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          description: this.jobData.description,
          source: 'extension'
        })
      });

      if (result && !result.error) {
        this.showNotification('✅ Job saved successfully!', 'success');
      } else {
        throw new Error(result?.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showError('Failed to save job. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleGenerateCoverLetter() {
    if (!this.isAuthenticated || !this.jobData) {
      this.showError('Please ensure you\'re authenticated and on a job page');
      return;
    }

    this.showLoading(true);

    try {
      const result = await this.makeApiRequest('/api/generate-cover-letter', {
        method: 'POST',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (result && !result.error) {
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied!', 'success');
        
        // Try to fill cover letter field
        chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'fillCoverLetter',
          coverLetter: result.coverLetter
        });
        
      } else {
        throw new Error(result?.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showError('Failed to generate cover letter. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleResumeAction() {
    this.showNotification('Resume optimization coming soon!', 'info');
  }

  async handleProfileAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/profile`
    });
  }

  async handleHistoryAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }

  async trackApplication() {
    if (!this.jobData) return;

    try {
      await this.makeApiRequest('/api/extension/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          source: 'extension',
          status: 'applied'
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          this.handleAutofill();
          break;
        case '2':
          e.preventDefault();
          this.handleAnalyze();
          break;
        case '3':
          e.preventDefault();
          this.handleSaveJob();
          break;
        case '4':
          e.preventDefault();
          this.handleGenerateCoverLetter();
          break;
      }
    }
  }

  enableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  disableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
  }

  showLoading(show = true) {
    const content = document.querySelector('.content');
    const loading = document.getElementById('loading');
    
    if (show) {
      content.style.display = 'none';
      loading.style.display = 'block';
    } else {
      content.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }

  openDashboard() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrPopup();
});