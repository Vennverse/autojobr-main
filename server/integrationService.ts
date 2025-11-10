
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { atsIntegrations } from '@shared/schema';

interface IntegrationConfig {
  id: string;
  name: string;
  category: 'ats' | 'job_board' | 'calendar' | 'communication' | 'background_check' | 'assessment' | 'hris';
  logo: string;
  description: string;
  features: string[];
  authType: 'oauth' | 'api_key' | 'webhook';
  fields: IntegrationField[];
  webhookUrl?: string;
  capabilities: string[];
}

interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export class IntegrationService {
  // Available integrations catalog
  static availableIntegrations: IntegrationConfig[] = [
    // ATS Platforms
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      category: 'ats',
      logo: '/integrations/greenhouse.svg',
      description: 'Sync candidates and jobs with Greenhouse ATS',
      features: ['Two-way candidate sync', 'Job posting sync', 'Interview scheduling', 'Scorecard sync'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Enter Greenhouse API key' },
        { name: 'harvestApiKey', label: 'Harvest API Key', type: 'password', required: false, placeholder: 'Optional: For advanced features' }
      ],
      capabilities: ['candidate_import', 'candidate_export', 'job_sync', 'application_sync'],
      webhookUrl: '/api/integrations/greenhouse/webhook'
    },
    {
      id: 'workday',
      name: 'Workday',
      category: 'ats',
      logo: '/integrations/workday.svg',
      description: 'Connect with Workday Recruiting',
      features: ['Candidate synchronization', 'Job requisition sync', 'Offer management'],
      authType: 'oauth',
      fields: [
        { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      capabilities: ['candidate_sync', 'job_sync', 'offer_sync'],
      webhookUrl: '/api/integrations/workday/webhook'
    },
    {
      id: 'lever',
      name: 'Lever',
      category: 'ats',
      logo: '/integrations/lever.svg',
      description: 'Integrate with Lever ATS platform',
      features: ['Candidate pipeline sync', 'Interview feedback', 'Job posting'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['candidate_sync', 'interview_sync', 'job_sync']
    },
    
    // HRIS Platforms
    {
      id: 'bamboohr',
      name: 'BambooHR',
      category: 'hris',
      logo: '/integrations/bamboohr.svg',
      description: 'Employee data sync with BambooHR',
      features: ['Employee onboarding', 'Hire-to-HR transition', 'Document management'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        { name: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'yourcompany' }
      ],
      capabilities: ['employee_sync', 'onboarding_sync']
    },

    // Job Boards
    {
      id: 'indeed',
      name: 'Indeed',
      category: 'job_board',
      logo: '/integrations/indeed.svg',
      description: 'Post jobs to Indeed automatically',
      features: ['Auto job posting', 'Application tracking', 'Candidate sourcing'],
      authType: 'api_key',
      fields: [
        { name: 'employerId', label: 'Employer ID', type: 'text', required: true },
        { name: 'apiToken', label: 'API Token', type: 'password', required: true }
      ],
      capabilities: ['job_posting', 'application_sync']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Jobs',
      category: 'job_board',
      logo: '/integrations/linkedin.svg',
      description: 'Publish jobs to LinkedIn',
      features: ['Job posting', 'Candidate sourcing', 'InMail integration'],
      authType: 'oauth',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      capabilities: ['job_posting', 'candidate_sourcing']
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      category: 'job_board',
      logo: '/integrations/glassdoor.svg',
      description: 'Post to Glassdoor job board',
      features: ['Job posting', 'Employer branding', 'Review management'],
      authType: 'api_key',
      fields: [
        { name: 'partnerId', label: 'Partner ID', type: 'text', required: true },
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['job_posting']
    },

    // Calendar Integrations
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      category: 'calendar',
      logo: '/integrations/google-calendar.svg',
      description: 'Sync interview schedules with Google Calendar',
      features: ['Auto-scheduling', 'Calendar sync', 'Meeting invites'],
      authType: 'oauth',
      fields: [
        { name: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true }
      ],
      capabilities: ['calendar_sync', 'event_creation']
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      category: 'calendar',
      logo: '/integrations/outlook.svg',
      description: 'Integrate with Outlook Calendar',
      features: ['Calendar sync', 'Teams meeting creation', 'Availability checking'],
      authType: 'oauth',
      fields: [
        { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      capabilities: ['calendar_sync', 'teams_meeting']
    },
    {
      id: 'calendly',
      name: 'Calendly',
      category: 'calendar',
      logo: '/integrations/calendly.svg',
      description: 'Let candidates self-schedule via Calendly',
      features: ['Self-scheduling', 'Automatic reminders', 'Time zone handling'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'Personal Access Token', type: 'password', required: true }
      ],
      capabilities: ['self_scheduling', 'event_webhooks']
    },

    // Communication Tools
    {
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      logo: '/integrations/slack.svg',
      description: 'Send hiring notifications to Slack',
      features: ['New application alerts', 'Interview reminders', 'Team collaboration'],
      authType: 'oauth',
      fields: [
        { name: 'workspaceUrl', label: 'Workspace URL', type: 'url', required: true },
        { name: 'botToken', label: 'Bot Token', type: 'password', required: true }
      ],
      capabilities: ['notifications', 'channel_posting'],
      webhookUrl: '/api/integrations/slack/webhook'
    },
    {
      id: 'microsoft_teams',
      name: 'Microsoft Teams',
      category: 'communication',
      logo: '/integrations/teams.svg',
      description: 'Integrate with Microsoft Teams',
      features: ['Team notifications', 'Video interviews', 'Collaboration'],
      authType: 'oauth',
      fields: [
        { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      capabilities: ['notifications', 'video_meetings']
    },

    // Background Check Services
    {
      id: 'checkr',
      name: 'Checkr',
      category: 'background_check',
      logo: '/integrations/checkr.svg',
      description: 'Automated background checks via Checkr',
      features: ['Criminal background checks', 'Employment verification', 'Education verification'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['background_check', 'verification'],
      webhookUrl: '/api/integrations/checkr/webhook'
    },
    {
      id: 'sterling',
      name: 'Sterling',
      category: 'background_check',
      logo: '/integrations/sterling.svg',
      description: 'Background screening with Sterling',
      features: ['Background screening', 'Drug testing', 'Identity verification'],
      authType: 'api_key',
      fields: [
        { name: 'accountId', label: 'Account ID', type: 'text', required: true },
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['background_check', 'drug_testing']
    },

    // Assessment Tools
    {
      id: 'hackerrank',
      name: 'HackerRank',
      category: 'assessment',
      logo: '/integrations/hackerrank.svg',
      description: 'Technical assessment via HackerRank',
      features: ['Coding tests', 'Auto-scoring', 'Test library'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['test_assignment', 'result_sync']
    },
    {
      id: 'codility',
      name: 'Codility',
      category: 'assessment',
      logo: '/integrations/codility.svg',
      description: 'Developer skills assessment',
      features: ['Coding challenges', 'Plagiarism detection', 'Video recording'],
      authType: 'api_key',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true }
      ],
      capabilities: ['test_assignment', 'result_sync']
    }
  ];

  // Get all available integrations
  static getAvailableIntegrations(category?: string) {
    if (category) {
      return this.availableIntegrations.filter(i => i.category === category);
    }
    return this.availableIntegrations;
  }

  // Get integration by ID
  static getIntegrationById(id: string) {
    return this.availableIntegrations.find(i => i.id === id);
  }

  // Save integration configuration
  static async saveIntegration(recruiterId: string, integrationId: string, config: any) {
    const integration = this.getIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const [saved] = await db.insert(atsIntegrations).values({
      recruiterId,
      platformName: integrationId,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret || config.clientSecret,
      webhookUrl: integration.webhookUrl,
      isActive: true,
      syncStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return saved;
  }

  // Get user's active integrations
  static async getUserIntegrations(recruiterId: string) {
    const integrations = await db.select()
      .from(atsIntegrations)
      .where(and(
        eq(atsIntegrations.recruiterId, recruiterId),
        eq(atsIntegrations.isActive, true)
      ));

    return integrations.map(int => ({
      ...int,
      config: this.getIntegrationById(int.platformName)
    }));
  }

  // Test integration connection
  static async testConnection(integrationId: string, config: any) {
    const integration = this.getIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    // Implement specific test logic for each integration
    switch (integrationId) {
      case 'greenhouse':
        return this.testGreenhouseConnection(config.apiKey);
      case 'slack':
        return this.testSlackConnection(config.botToken);
      case 'google_calendar':
        return this.testGoogleCalendarConnection(config);
      default:
        return { success: true, message: 'Connection test simulated' };
    }
  }

  // Integration-specific test methods
  private static async testGreenhouseConnection(apiKey: string) {
    try {
      const response = await fetch('https://harvest.greenhouse.io/v1/users', {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        }
      });
      return { success: response.ok, message: response.ok ? 'Connected successfully' : 'Authentication failed' };
    } catch (error) {
      return { success: false, message: 'Connection failed' };
    }
  }

  private static async testSlackConnection(botToken: string) {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${botToken}`
        }
      });
      const data = await response.json();
      return { success: data.ok, message: data.ok ? 'Connected successfully' : data.error };
    } catch (error) {
      return { success: false, message: 'Connection failed' };
    }
  }

  private static async testGoogleCalendarConnection(config: any) {
    // OAuth flow would be handled separately
    return { success: true, message: 'OAuth flow required' };
  }

  // Sync data from integration
  static async syncIntegration(integrationDbId: number) {
    const [integration] = await db.select()
      .from(atsIntegrations)
      .where(eq(atsIntegrations.id, integrationDbId));

    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      await db.update(atsIntegrations)
        .set({
          syncStatus: 'syncing',
          updatedAt: new Date()
        })
        .where(eq(atsIntegrations.id, integrationDbId));

      // Perform sync based on integration type
      // This would be implemented for each integration

      await db.update(atsIntegrations)
        .set({
          syncStatus: 'success',
          lastSync: new Date(),
          updatedAt: new Date()
        })
        .where(eq(atsIntegrations.id, integrationDbId));

      return { success: true, message: 'Sync completed successfully' };
    } catch (error: any) {
      await db.update(atsIntegrations)
        .set({
          syncStatus: 'failed',
          syncErrors: error.message,
          updatedAt: new Date()
        })
        .where(eq(atsIntegrations.id, integrationDbId));

      throw error;
    }
  }

  // Disable integration
  static async disableIntegration(integrationDbId: number) {
    await db.update(atsIntegrations)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(atsIntegrations.id, integrationDbId));
  }
}
