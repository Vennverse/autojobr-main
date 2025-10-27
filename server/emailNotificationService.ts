import { db } from './db';
import { sendEmail } from './emailService';

interface UnreadNotification {
  conversationId: number;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  unreadCount: number;
  lastMessageTime: Date;
  userType: string;
}

class EmailNotificationService {
  private static instance: EmailNotificationService;
  private isRunning = false;

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log('📧 Email notification service started (stub mode)');
  }

  async checkAndSendNotifications() {
    // Stub implementation - to be completed when schema is finalized
    console.log('Email notifications check skipped (stub mode)');
  }

  sendTemplateEmail(email: string, template: string, data: any) {
    // Stub implementation
    console.log(`Template email would be sent to ${email}`);
    return Promise.resolve({ success: true });
  }

  sendRejectionEmail(email: string, name: string, jobTitle: string, reason?: string) {
    // Stub implementation
    console.log(`Rejection email would be sent to ${email}`);
    return Promise.resolve({ success: true });
  }
}

export const emailNotificationService = EmailNotificationService.getInstance();
