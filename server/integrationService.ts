import { db } from "./db";
import { userIntegrations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EncryptionService } from "./encryptionService";
import axios from "axios";

export class IntegrationService {
  /**
   * Get a user's integration configuration
   */
  static async getUserIntegration(userId: string, integrationId: string) {
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, integrationId),
        eq(userIntegrations.isEnabled, true)
      ))
      .limit(1);
    
    if (integration.length === 0) {
      return null;
    }
    
    // Decrypt sensitive fields from config
    const config = integration[0].config as any || {};
    const decryptedConfig: any = { ...config };
    
    const sensitiveFields = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'webhookUrl'];
    for (const field of sensitiveFields) {
      if (decryptedConfig[field]) {
        decryptedConfig[field] = EncryptionService.decrypt(decryptedConfig[field]);
      }
    }
    
    return {
      ...integration[0],
      config: decryptedConfig
    };
  }

  /**
   * Send Slack notification
   */
  static async sendSlackNotification(userId: string, message: string, options?: {
    title?: string;
    color?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }) {
    const integration = await this.getUserIntegration(userId, 'slack');
    if (!integration || !integration.config?.webhookUrl) {
      console.log('Slack integration not configured for user:', userId);
      return false;
    }

    try {
      const payload: any = {
        text: options?.title || 'AutoJobr Notification',
        attachments: [{
          color: options?.color || '#36a64f',
          text: message,
          fields: options?.fields || [],
          footer: 'AutoJobr',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await axios.post(integration.config.webhookUrl, payload);
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return true;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  /**
   * Export data to Airtable
   */
  static async exportToAirtable(userId: string, tableName: string, records: any[]) {
    const integration = await this.getUserIntegration(userId, 'airtable');
    if (!integration || !integration.config?.apiKey || !integration.config?.baseId) {
      console.log('Airtable integration not configured for user:', userId);
      return false;
    }

    try {
      const baseUrl = `https://api.airtable.com/v0/${integration.config.baseId}/${tableName}`;
      
      // Airtable has a limit of 10 records per request
      const chunks = [];
      for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        await axios.post(baseUrl, {
          records: chunk.map(r => ({ fields: r }))
        }, {
          headers: {
            'Authorization': `Bearer ${integration.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return true;
    } catch (error) {
      console.error('Failed to export to Airtable:', error);
      return false;
    }
  }

  /**
   * Sync to Notion
   */
  static async syncToNotion(userId: string, databaseId: string, pages: any[]) {
    const integration = await this.getUserIntegration(userId, 'notion');
    if (!integration || !integration.config?.accessToken) {
      console.log('Notion integration not configured for user:', userId);
      return false;
    }

    try {
      for (const page of pages) {
        await axios.post(`https://api.notion.com/v1/pages`, {
          parent: { database_id: databaseId },
          properties: page
        }, {
          headers: {
            'Authorization': `Bearer ${integration.config.accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          }
        });
      }
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return true;
    } catch (error) {
      console.error('Failed to sync to Notion:', error);
      return false;
    }
  }

  /**
   * Post job to LinkedIn
   */
  static async postToLinkedIn(userId: string, jobData: {
    title: string;
    description: string;
    location?: string;
    company?: string;
  }) {
    const integration = await this.getUserIntegration(userId, 'linkedin');
    if (!integration || !integration.config?.accessToken) {
      console.log('LinkedIn integration not configured for user:', userId);
      return false;
    }

    try {
      // LinkedIn API for job postings
      await axios.post('https://api.linkedin.com/v2/jobPostings', {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        company: jobData.company
      }, {
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202404'
        }
      });
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return true;
    } catch (error) {
      console.error('Failed to post to LinkedIn:', error);
      return false;
    }
  }

  /**
   * Create Calendly meeting
   */
  static async createCalendlyMeeting(userId: string, eventData: {
    name: string;
    email: string;
    startTime: string;
    endTime: string;
  }) {
    const integration = await this.getUserIntegration(userId, 'calendly');
    if (!integration || !integration.config?.apiKey) {
      console.log('Calendly integration not configured for user:', userId);
      return { success: false, meetingUrl: null };
    }

    try {
      const response = await axios.post('https://api.calendly.com/scheduled_events', {
        name: eventData.name,
        email: eventData.email,
        start_time: eventData.startTime,
        end_time: eventData.endTime
      }, {
        headers: {
          'Authorization': `Bearer ${integration.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return { success: true, meetingUrl: response.data.resource.booking_url };
    } catch (error) {
      console.error('Failed to create Calendly meeting:', error);
      return { success: false, meetingUrl: null };
    }
  }

  /**
   * Create Zoom meeting
   */
  static async createZoomMeeting(userId: string, meetingData: {
    topic: string;
    startTime: string;
    duration: number;
    agenda?: string;
  }) {
    const integration = await this.getUserIntegration(userId, 'zoom');
    if (!integration || !integration.config?.apiKey || !integration.config?.apiSecret) {
      console.log('Zoom integration not configured for user:', userId);
      return { success: false, meetingUrl: null };
    }

    try {
      const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
        topic: meetingData.topic,
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: meetingData.duration,
        agenda: meetingData.agenda,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          audio: 'both',
          auto_recording: 'cloud'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${integration.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return { 
        success: true, 
        meetingUrl: response.data.join_url,
        meetingId: response.data.id,
        password: response.data.password
      };
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      return { success: false, meetingUrl: null };
    }
  }

  /**
   * Create Google Meet
   */
  static async createGoogleMeet(userId: string, eventData: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
  }) {
    const integration = await this.getUserIntegration(userId, 'google-workspace');
    if (!integration || !integration.config?.accessToken) {
      console.log('Google Workspace integration not configured for user:', userId);
      return { success: false, meetingUrl: null };
    }

    try {
      const response = await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.startTime },
        end: { dateTime: eventData.endTime },
        attendees: eventData.attendees?.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          conferenceDataVersion: 1
        }
      });
      
      // Update last synced
      await db.update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, integration.id));
      
      return { 
        success: true, 
        meetingUrl: response.data.hangoutLink,
        eventId: response.data.id
      };
    } catch (error) {
      console.error('Failed to create Google Meet:', error);
      return { success: false, meetingUrl: null };
    }
  }

  /**
   * Check if user has an integration enabled
   */
  static async hasIntegration(userId: string, integrationId: string): Promise<boolean> {
    const integration = await this.getUserIntegration(userId, integrationId);
    return integration !== null;
  }
}
