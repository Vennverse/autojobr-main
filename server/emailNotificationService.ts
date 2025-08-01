import { db } from './db';
import { chatConversations, chatMessages, users } from '../shared/schema';
import { eq, and, gte, isNull, or } from 'drizzle-orm';
// Use existing email system from the project
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

  // Start the notification service
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Check for unread messages every 10 minutes
    setInterval(() => {
      this.checkAndSendNotifications();
    }, 10 * 60 * 1000); // 10 minutes

    console.log('📧 Email notification service started');
  }

  // Check for unread messages and send notifications
  async checkAndSendNotifications() {
    try {
      console.log('🔍 Checking for unread messages...');
      
      // Get all conversations with unread messages
      const conversationsWithUnread = await db
        .select({
          conversationId: chatConversations.id,
          recruiterId: chatConversations.recruiterId,
          jobSeekerId: chatConversations.jobSeekerId,
          lastEmailNotificationAt: chatConversations.lastEmailNotificationAt,
          lastMessageAt: chatConversations.lastMessageAt,
        })
        .from(chatConversations)
        .where(eq(chatConversations.isActive, true));

      const notifications: UnreadNotification[] = [];
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      for (const conversation of conversationsWithUnread) {
        // Skip if email was sent recently (within 6 hours)
        if (conversation.lastEmailNotificationAt && 
            conversation.lastEmailNotificationAt > sixHoursAgo) {
          continue;
        }

        // Check unread messages for recruiter
        const recruiterUnread = await this.getUnreadCount(
          conversation.conversationId, 
          conversation.recruiterId
        );
        
        if (recruiterUnread.count > 0) {
          const recruiter = await this.getUser(conversation.recruiterId);
          const jobSeeker = await this.getUser(conversation.jobSeekerId);
          
          if (recruiter && jobSeeker) {
            notifications.push({
              conversationId: conversation.conversationId,
              recipientId: conversation.recruiterId,
              recipientEmail: recruiter.email,
              recipientName: `${recruiter.firstName} ${recruiter.lastName}`.trim() || recruiter.email,
              senderName: `${jobSeeker.firstName} ${jobSeeker.lastName}`.trim() || jobSeeker.email,
              unreadCount: recruiterUnread.count,
              lastMessageTime: recruiterUnread.lastMessageTime,
              userType: 'recruiter'
            });
          }
        }

        // Check unread messages for job seeker
        const jobSeekerUnread = await this.getUnreadCount(
          conversation.conversationId, 
          conversation.jobSeekerId
        );
        
        if (jobSeekerUnread.count > 0) {
          const recruiter = await this.getUser(conversation.recruiterId);
          const jobSeeker = await this.getUser(conversation.jobSeekerId);
          
          if (recruiter && jobSeeker) {
            notifications.push({
              conversationId: conversation.conversationId,
              recipientId: conversation.jobSeekerId,
              recipientEmail: jobSeeker.email,
              recipientName: `${jobSeeker.firstName} ${jobSeeker.lastName}`.trim() || jobSeeker.email,
              senderName: `${recruiter.firstName} ${recruiter.lastName}`.trim() || recruiter.email,
              unreadCount: jobSeekerUnread.count,
              lastMessageTime: jobSeekerUnread.lastMessageTime,
              userType: 'job_seeker'
            });
          }
        }
      }

      // Send notifications
      if (notifications.length > 0) {
        console.log(`📧 Sending ${notifications.length} email notifications`);
        await this.sendNotifications(notifications);
      } else {
        console.log('✅ No email notifications needed');
      }

    } catch (error) {
      console.error('❌ Error checking notifications:', error);
    }
  }

  // Get unread message count for a user in a conversation
  private async getUnreadCount(conversationId: number, userId: string) {
    const unreadMessages = await db
      .select({
        id: chatMessages.id,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.isRead, false),
        // Messages not sent by this user (messages sent TO this user)
        // We want unread messages that others sent to this user
      ))
      .orderBy(chatMessages.createdAt);

    // Filter messages that are not from this user
    const unreadFromOthers = unreadMessages.filter(msg => {
      // We need to check who sent each message to filter correctly
      // For now, we'll count all unread messages as we'll refine this in the actual query
      return true;
    });

    // Get the actual unread messages not sent by this user
    const actualUnreadMessages = await db
      .select({
        id: chatMessages.id,
        senderId: chatMessages.senderId,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.isRead, false)
      ));

    const unreadNotFromUser = actualUnreadMessages.filter(msg => msg.senderId !== userId);
    
    return {
      count: unreadNotFromUser.length,
      lastMessageTime: unreadNotFromUser.length > 0 
        ? new Date(unreadNotFromUser[unreadNotFromUser.length - 1].createdAt) 
        : new Date()
    };
  }

  // Get user details
  private async getUser(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user;
  }

  // Send email notifications
  private async sendNotifications(notifications: UnreadNotification[]) {
    for (const notification of notifications) {
      try {
        await this.sendSingleNotification(notification);
        
        // Update last email notification time
        await db
          .update(chatConversations)
          .set({ 
            lastEmailNotificationAt: new Date() 
          })
          .where(eq(chatConversations.id, notification.conversationId));

        console.log(`✅ Email sent to ${notification.recipientEmail}`);
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${notification.recipientEmail}:`, error);
      }
    }
  }

  // Send a single email notification
  private async sendSingleNotification(notification: UnreadNotification) {
    try {
      const isRecruiter = notification.userType === 'recruiter';
      const subject = `${notification.unreadCount} new message${notification.unreadCount > 1 ? 's' : ''} from ${notification.senderName}`;
      
      const dashboardUrl = isRecruiter 
        ? 'https://autojobr.com/recruiter/dashboard'
        : 'https://autojobr.com/dashboard';
      
      const chatUrl = `https://autojobr.com/chat`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message - AutoJobr</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 32px; }
            .message-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #667eea; }
            .message-count { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            .sender-name { color: #667eea; font-weight: 500; }
            .time { color: #64748b; font-size: 14px; margin-top: 8px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
            .logo { color: white; font-weight: 700; font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">AutoJobr</div>
              <h1>New Message${notification.unreadCount > 1 ? 's' : ''}</h1>
            </div>
            
            <div class="content">
              <p>Hi ${notification.recipientName},</p>
              
              <div class="message-card">
                <div class="message-count">
                  ${notification.unreadCount} new message${notification.unreadCount > 1 ? 's' : ''}
                </div>
                <div>from <span class="sender-name">${notification.senderName}</span></div>
                <div class="time">
                  ${notification.lastMessageTime.toLocaleString()}
                </div>
              </div>
              
              <p>You have unread messages waiting for you. Click below to view and respond:</p>
              
              <a href="${chatUrl}" class="cta-button">View Messages</a>
              
              <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
                You can also access your messages from your <a href="${dashboardUrl}" style="color: #667eea;">dashboard</a>.
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from AutoJobr.<br>
              We only send these when you have unread messages to keep you connected.</p>
              <p>© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Use the existing email service
      await sendEmail({
        to: notification.recipientEmail,
        subject: subject,
        html: htmlContent,
        from: 'AutoJobr Notifications'
      });

    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  // Manual trigger for testing
  async triggerNotificationCheck() {
    console.log('🔄 Manually triggering notification check...');
    await this.checkAndSendNotifications();
  }
}

export const emailNotificationService = EmailNotificationService.getInstance();