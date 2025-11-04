
// AutoJobr Follow-up Automation System
class FollowUpAutomation {
  constructor() {
    this.followUpSchedule = new Map();
    this.contactedPeople = new Set();
    this.init();
  }

  init() {
    console.log('🔔 Follow-up Automation System initialized');
    this.loadFollowUpSchedule();
    this.setupFollowUpReminders();
  }

  async loadFollowUpSchedule() {
    const schedule = await chrome.storage.local.get(['followUpSchedule']);
    if (schedule.followUpSchedule) {
      this.followUpSchedule = new Map(Object.entries(schedule.followUpSchedule));
    }
  }

  async scheduleFollowUp(applicationData) {
    const { jobTitle, company, hiringTeam, appliedAt } = applicationData;
    
    if (!hiringTeam || !hiringTeam.followUpContacts) {
      console.log('No hiring team contacts available for follow-up');
      return;
    }

    // Schedule follow-ups based on best practices
    const followUpSchedule = {
      week1: { // 7 days after application
        scheduledFor: new Date(new Date(appliedAt).getTime() + 7 * 24 * 60 * 60 * 1000),
        contacts: hiringTeam.followUpContacts.filter(c => c.priority === 'high'),
        message: this.generateFollowUpMessage(jobTitle, company, 'initial')
      },
      week2: { // 14 days if no response
        scheduledFor: new Date(new Date(appliedAt).getTime() + 14 * 24 * 60 * 60 * 1000),
        contacts: hiringTeam.followUpContacts.filter(c => c.priority === 'medium'),
        message: this.generateFollowUpMessage(jobTitle, company, 'secondary')
      }
    };

    await this.saveFollowUpSchedule(applicationData.id, followUpSchedule);
    console.log(`📅 Follow-up scheduled for ${jobTitle} at ${company}`);
  }

  generateFollowUpMessage(jobTitle, company, stage) {
    const messages = {
      initial: `Hi [Name],

I recently applied for the ${jobTitle} position at ${company} and wanted to follow up on my application.

I'm very excited about the opportunity to contribute to your team and believe my skills align well with the role requirements.

Would it be possible to discuss the next steps in the hiring process?

Thank you for your time and consideration!

Best regards`,
      
      secondary: `Hi [Name],

I wanted to reach out again regarding the ${jobTitle} position at ${company}.

I remain very interested in this opportunity and would appreciate any update on the status of my application.

I'm happy to provide additional information or schedule a conversation at your convenience.

Thank you!

Best regards`
    };

    return messages[stage] || messages.initial;
  }

  async saveFollowUpSchedule(applicationId, schedule) {
    this.followUpSchedule.set(applicationId, schedule);
    
    const scheduleObj = Object.fromEntries(this.followUpSchedule);
    await chrome.storage.local.set({ followUpSchedule: scheduleObj });
  }

  setupFollowUpReminders() {
    // Check for due follow-ups every hour
    setInterval(() => {
      this.checkDueFollowUps();
    }, 60 * 60 * 1000);

    // Check immediately on load
    this.checkDueFollowUps();
  }

  async checkDueFollowUps() {
    const now = new Date();
    
    for (const [appId, schedule] of this.followUpSchedule.entries()) {
      // Check week 1 follow-up
      if (schedule.week1 && new Date(schedule.week1.scheduledFor) <= now) {
        await this.sendFollowUpReminder(appId, 'week1', schedule.week1);
      }
      
      // Check week 2 follow-up
      if (schedule.week2 && new Date(schedule.week2.scheduledFor) <= now) {
        await this.sendFollowUpReminder(appId, 'week2', schedule.week2);
      }
    }
  }

  async sendFollowUpReminder(appId, stage, followUpData) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '⏰ Follow-up Reminder',
      message: `Time to follow up on your application! ${followUpData.contacts.length} contact(s) ready.`,
      buttons: [
        { title: 'Open LinkedIn' },
        { title: 'View Contacts' }
      ],
      requireInteraction: true
    });

    // Mark as notified
    const schedule = this.followUpSchedule.get(appId);
    schedule[stage].notified = true;
    await this.saveFollowUpSchedule(appId, schedule);
  }

  async openLinkedInMessaging(contact) {
    const linkedInMessageUrl = contact.profileUrl 
      ? `${contact.profileUrl}/detail/contact-info/` 
      : 'https://www.linkedin.com/messaging/';
    
    chrome.tabs.create({ url: linkedInMessageUrl });
  }

  async copyFollowUpMessage(message, contactName) {
    const personalizedMessage = message.replace('[Name]', contactName.split(' ')[0]);
    
    await navigator.clipboard.writeText(personalizedMessage);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '✅ Message Copied!',
      message: `Follow-up message copied to clipboard. Paste it in LinkedIn.`
    });
  }
}

// Initialize follow-up automation
const followUpAutomation = new FollowUpAutomation();
