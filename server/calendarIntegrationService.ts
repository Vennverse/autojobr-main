
import { google } from 'googleapis';
import { db } from './db';
import { users, tasks, virtualInterviews } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class CalendarIntegrationService {
  async syncToGoogleCalendar(userId: string, event: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]?.googleCalendarToken) return;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user[0].googleCalendarToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      }
    });
  }

  async createDailyPlanningBlock(userId: string) {
    // Create daily 30-minute job search block
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await this.syncToGoogleCalendar(userId, {
      title: '🎯 Daily Job Search Focus Time',
      description: 'Dedicated time for job applications, networking, and skill development via AutoJobr',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      location: 'https://autojobr.com/dashboard'
    });
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();
