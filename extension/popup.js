// Enhanced AutoJobr Extension Popup Script with Task Management
class AutoJobrPopup {
  constructor() {
    this.isAuthenticated = false;
    this.userProfile = null;
    this.tasks = [];
    this.currentTab = 'tasks';
    this.init();
  }

  async init() {
    await this.checkAuthentication();
    this.setupEventListeners();
    this.setupTabNavigation();
    await this.loadTasks();
    await this.checkResumeStatus();
    this.updateUI();
  }

  async checkAuthentication() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getUserProfile'
      });

      if (response && response.success && response.profile) {
        this.isAuthenticated = true;
        this.userProfile = response.profile;
        document.getElementById('status').textContent = `Welcome back, ${response.profile.firstName || 'User'}!`;
      } else {
        document.getElementById('status').textContent = 'Please sign in to access features';
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.isAuthenticated = false;
      document.getElementById('status').textContent = 'Authentication error';
    }
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific data
        if (tabName === 'tasks') {
          this.loadTasks();
        } else if (tabName === 'resume') {
          this.checkResumeStatus();
        }
      });
    });
  }

  setupEventListeners() {
    // Task management actions
    document.getElementById('create-task-btn').addEventListener('click', () => {
      this.createQuickTask();
    });

    document.getElementById('follow-up-btn').addEventListener('click', () => {
      this.createFollowUpTask();
    });

    // Resume actions
    document.getElementById('get-active-resume-btn').addEventListener('click', () => {
      this.checkResumeStatus();
    });

    document.getElementById('upload-to-form-btn').addEventListener('click', () => {
      this.uploadResumeToForm();
    });

    // Page-specific actions
    document.getElementById('detect-resume-fields-btn').addEventListener('click', () => {
      this.detectResumeFields();
    });

    document.getElementById('create-page-task-btn').addEventListener('click', () => {
      this.createTaskForCurrentPage();
    });

    // Legacy autofill
    document.getElementById('autofill-btn').addEventListener('click', () => {
      this.triggerAutofill();
    });

    // Footer links
    document.getElementById('open-dashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://autojobr.com/applications' });
    });

    document.getElementById('open-settings').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://autojobr.com/profile' });
    });
  }

  async loadTasks() {
    if (!this.isAuthenticated) {
      this.displayTasksError('Please sign in to view tasks');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getUserTasks'
      });

      if (response && response.success) {
        this.tasks = response.tasks || [];
        this.displayTasks();
      } else {
        this.displayTasksError('Failed to load tasks');
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.displayTasksError('Error loading tasks');
    }
  }

  displayTasks() {
    const taskList = document.getElementById('task-list');
    const taskStats = document.getElementById('task-stats');
    
    if (!this.tasks || this.tasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">No tasks yet</div>
          <button class="action-btn primary" onclick="popup.createQuickTask()">Create Your First Task</button>
        </div>
      `;
      taskStats.style.display = 'none';
      return;
    }

    // Calculate stats
    const pending = this.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const overdue = this.tasks.filter(t => {
      if (!t.dueDateTime || t.status === 'completed') return false;
      return new Date(t.dueDateTime) < new Date();
    }).length;

    // Update stats
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('overdue-count').textContent = overdue;
    taskStats.style.display = 'grid';

    // Display task list
    taskList.innerHTML = this.tasks.map(task => this.createTaskItem(task)).join('');

    // Add click listeners for task checkboxes
    taskList.querySelectorAll('.task-checkbox').forEach((checkbox, index) => {
      checkbox.addEventListener('click', () => {
        this.toggleTask(this.tasks[index]);
      });
    });
  }

  createTaskItem(task) {
    const isCompleted = task.status === 'completed';
    const isOverdue = task.dueDateTime && new Date(task.dueDateTime) < new Date() && !isCompleted;
    
    return `
      <div class="task-item">
        <div class="task-checkbox ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
        </div>
        <div class="task-content">
          <div class="task-title ${isCompleted ? 'completed' : ''}">${task.title}</div>
          <div class="task-meta">
            <span class="task-priority ${task.priority || 'medium'}">${task.priority || 'medium'}</span>
            ${task.dueDateTime ? `<span>${new Date(task.dueDateTime).toLocaleDateString()}</span>` : ''}
            ${isOverdue ? '<span style="color: #dc2626;">⚠️ Overdue</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  displayTasksError(message) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = `<div class="error">${message}</div>`;
    document.getElementById('task-stats').style.display = 'none';
  }

  async toggleTask(task) {
    if (task.status === 'completed') return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'completeTask',
        taskId: task.id
      });

      if (response && response.success) {
        await this.loadTasks(); // Refresh task list
        this.showNotification('Task completed! 🎉');
      } else {
        this.showNotification('Failed to complete task', 'error');
      }
    } catch (error) {
      console.error('Toggle task error:', error);
      this.showNotification('Error completing task', 'error');
    }
  }

  async createQuickTask() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to create tasks', 'error');
      return;
    }

    const title = prompt('Task title:');
    if (!title) return;

    const description = prompt('Task description (optional):') || '';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'createQuickTask',
        title,
        description,
        relatedUrl: ''
      });

      if (response && response.success) {
        await this.loadTasks();
        this.showNotification('Task created successfully!');
      } else {
        this.showNotification('Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Create task error:', error);
      this.showNotification('Error creating task', 'error');
    }
  }

  async createFollowUpTask() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to create tasks', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'createFollowUpTask'
      });

      if (response && response.success) {
        await this.loadTasks();
        this.showNotification('Follow-up task created!');
      } else {
        this.showNotification('Could not create follow-up task. Make sure you\'re on a job page.', 'error');
      }
    } catch (error) {
      console.error('Create follow-up task error:', error);
      this.showNotification('Error creating follow-up task', 'error');
    }
  }

  async createTaskForCurrentPage() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to create tasks', 'error');
      return;
    }

    const title = prompt('Task title for this page:');
    if (!title) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'createTaskForCurrentPage',
        title,
        description: `Task created for: ${tab.title}`
      });

      if (response && response.success) {
        await this.loadTasks();
        this.showNotification('Page task created!');
      } else {
        this.showNotification('Failed to create page task', 'error');
      }
    } catch (error) {
      console.error('Create page task error:', error);
      this.showNotification('Error creating page task', 'error');
    }
  }

  async checkResumeStatus() {
    const statusDiv = document.getElementById('resume-status');
    statusDiv.innerHTML = '<div class="loading">Checking resume status...</div>';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getActiveResume'
      });

      if (response && response.success) {
        statusDiv.innerHTML = `
          <div style="color: #10b981;">
            ✅ Active resume found
            <div style="margin-top: 8px; font-size: 11px; color: #666;">
              Ready for automatic upload to job applications
            </div>
          </div>
        `;
      } else {
        statusDiv.innerHTML = `
          <div style="color: #f59e0b;">
            ⚠️ No active resume found
            <div style="margin-top: 8px; font-size: 11px; color: #666;">
              Please upload a resume in the dashboard first
            </div>
          </div>
        `;
      }
    } catch (error) {
      statusDiv.innerHTML = `
        <div style="color: #dc2626;">
          ❌ Error checking resume status
        </div>
      `;
    }
  }

  async uploadResumeToForm() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to upload resume', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'uploadResumeToForm'
      });

      if (response && response.success) {
        this.showNotification('Resume uploaded to form! 📄');
      } else {
        this.showNotification(response.error || 'Failed to upload resume. Make sure you\'re on a job application page.', 'error');
      }
    } catch (error) {
      console.error('Upload resume error:', error);
      this.showNotification('Error uploading resume', 'error');
    }
  }

  async detectResumeFields() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'detectResumeFields'
      });

      if (response && response.success) {
        this.showNotification(`Found ${response.count} resume upload field(s)!`);
      } else {
        this.showNotification('No resume upload fields found on this page', 'error');
      }
    } catch (error) {
      console.error('Detect resume fields error:', error);
      this.showNotification('Error detecting resume fields', 'error');
    }
  }

  async triggerAutofill() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to use autofill', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startAutofill',
        userProfile: this.userProfile
      });
      this.showNotification('Autofill started! 🤖');
    } catch (error) {
      this.showNotification('Autofill failed. Make sure you\'re on a job application page.', 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
      color: ${type === 'error' ? '#dc2626' : '#065f46'};
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateUI() {
    // UI is updated by individual methods
  }
}

// Initialize popup when DOM is loaded
let popup;
document.addEventListener('DOMContentLoaded', () => {
  popup = new AutoJobrPopup();
});