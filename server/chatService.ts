import { db } from './db';
import { chatConversations, chatMessages, users } from '../shared/schema';
import { eq, and, desc, asc, count, sql, ne, isNull, or } from 'drizzle-orm';

export interface PaginatedMessages {
  messages: any[];
  hasMore: boolean;
  totalCount: number;
  nextCursor?: string;
}

export interface ConversationWithDetails {
  id: number;
  recruiterId: string;
  jobSeekerId: string;
  jobPostingId?: number;
  applicationId?: number;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  jobTitle?: string;
  recruiterName?: string;
  jobSeekerName?: string;
  unreadCount: number;
  lastMessage?: {
    id: number;
    message: string;
    senderId: string;
    createdAt: string;
    messageType: string;
  };
}

export class ChatService {
  // Get conversations with enhanced details and unread counts
  async getConversationsForUser(userId: string): Promise<ConversationWithDetails[]> {
    try {
      // Get conversations where user is participant
      const conversationsQuery = await db
        .select({
          id: chatConversations.id,
          recruiterId: chatConversations.recruiterId,
          jobSeekerId: chatConversations.jobSeekerId,
          jobPostingId: chatConversations.jobPostingId,
          applicationId: chatConversations.applicationId,
          lastMessageAt: chatConversations.lastMessageAt,
          isActive: chatConversations.isActive,
          createdAt: chatConversations.createdAt,
          // Get other participant's name
          recruiterFirstName: sql<string>`recruiter.first_name`,
          recruiterLastName: sql<string>`recruiter.last_name`,
          jobSeekerFirstName: sql<string>`job_seeker.first_name`,
          jobSeekerLastName: sql<string>`job_seeker.last_name`,
          // Get job title if available
          jobTitle: sql<string>`job_posting.title`,
        })
        .from(chatConversations)
        .leftJoin(users.as('recruiter'), eq(chatConversations.recruiterId, sql`recruiter.id`))
        .leftJoin(users.as('job_seeker'), eq(chatConversations.jobSeekerId, sql`job_seeker.id`))
        .leftJoin(sql`job_postings job_posting`, eq(chatConversations.jobPostingId, sql`job_posting.id`))
        .where(
          or(
            eq(chatConversations.recruiterId, userId),
            eq(chatConversations.jobSeekerId, userId)
          )
        )
        .orderBy(desc(chatConversations.lastMessageAt));

      // Get unread counts and last messages for each conversation
      const conversationsWithDetails: ConversationWithDetails[] = [];

      for (const conv of conversationsQuery) {
        // Get unread count
        const unreadCountResult = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.conversationId, conv.id),
              eq(chatMessages.isRead, false),
              ne(chatMessages.senderId, userId)
            )
          );

        // Get last message
        const lastMessageResult = await db
          .select({
            id: chatMessages.id,
            message: chatMessages.message,
            senderId: chatMessages.senderId,
            createdAt: chatMessages.createdAt,
            messageType: chatMessages.messageType,
          })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        const unreadCount = unreadCountResult[0]?.count || 0;
        const lastMessage = lastMessageResult[0];

        // Determine display names
        const recruiterName = conv.recruiterFirstName && conv.recruiterLastName 
          ? `${conv.recruiterFirstName} ${conv.recruiterLastName}`.trim()
          : 'Recruiter';
        
        const jobSeekerName = conv.jobSeekerFirstName && conv.jobSeekerLastName
          ? `${conv.jobSeekerFirstName} ${conv.jobSeekerLastName}`.trim()
          : 'Job Seeker';

        conversationsWithDetails.push({
          id: conv.id,
          recruiterId: conv.recruiterId,
          jobSeekerId: conv.jobSeekerId,
          jobPostingId: conv.jobPostingId,
          applicationId: conv.applicationId,
          lastMessageAt: conv.lastMessageAt,
          isActive: conv.isActive,
          createdAt: conv.createdAt,
          jobTitle: conv.jobTitle,
          recruiterName,
          jobSeekerName,
          unreadCount,
          lastMessage
        });
      }

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  // Get messages with pagination
  async getMessagesForConversation(
    conversationId: number, 
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    try {
      // Verify user has access to this conversation
      const conversation = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            or(
              eq(chatConversations.recruiterId, userId),
              eq(chatConversations.jobSeekerId, userId)
            )
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new Error('Conversation not found or access denied');
      }

      // Get total count
      const totalCountResult = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId));

      const totalCount = totalCountResult[0]?.count || 0;
      const offset = (page - 1) * limit;

      // Get messages with pagination (newest first, then reverse for display)
      const messages = await db
        .select({
          id: chatMessages.id,
          conversationId: chatMessages.conversationId,
          senderId: chatMessages.senderId,
          message: chatMessages.message,
          messageType: chatMessages.messageType,
          isRead: chatMessages.isRead,
          isDelivered: chatMessages.isDelivered,
          readAt: chatMessages.readAt,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit)
        .offset(offset);

      const hasMore = offset + messages.length < totalCount;

      // Reverse messages for chronological order (oldest first)
      const sortedMessages = messages.reverse();

      return {
        messages: sortedMessages,
        hasMore,
        totalCount,
        nextCursor: hasMore ? String(page + 1) : undefined
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  // Create or get existing conversation
  async createOrGetConversation(
    currentUserId: string,
    otherUserId: string,
    jobPostingId?: number,
    applicationId?: number
  ): Promise<any> {
    try {
      // Get user types to determine roles
      const [currentUser, otherUser] = await Promise.all([
        db.select().from(users).where(eq(users.id, currentUserId)).limit(1),
        db.select().from(users).where(eq(users.id, otherUserId)).limit(1)
      ]);

      if (!currentUser.length || !otherUser.length) {
        throw new Error('One or both users not found');
      }

      let recruiterId: string;
      let jobSeekerId: string;

      // Determine roles based on user types
      if (currentUser[0].userType === 'recruiter') {
        recruiterId = currentUserId;
        jobSeekerId = otherUserId;
      } else if (otherUser[0].userType === 'recruiter') {
        recruiterId = otherUserId;
        jobSeekerId = currentUserId;
      } else {
        throw new Error('At least one user must be a recruiter');
      }

      // Check if conversation already exists
      const existingConversation = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.recruiterId, recruiterId),
            eq(chatConversations.jobSeekerId, jobSeekerId),
            jobPostingId ? eq(chatConversations.jobPostingId, jobPostingId) : isNull(chatConversations.jobPostingId)
          )
        )
        .limit(1);

      if (existingConversation.length) {
        return {
          conversationId: existingConversation[0].id,
          isNew: false,
          conversation: existingConversation[0]
        };
      }

      // Create new conversation
      const [newConversation] = await db
        .insert(chatConversations)
        .values({
          recruiterId,
          jobSeekerId,
          jobPostingId,
          applicationId,
          lastMessageAt: new Date(),
          isActive: true
        })
        .returning();

      return {
        conversationId: newConversation.id,
        isNew: true,
        conversation: newConversation
      };
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw new Error('Failed to create or get conversation');
    }
  }

  // Send message with delivery tracking
  async sendMessage(
    conversationId: number,
    senderId: string,
    message: string,
    messageType: string = 'text'
  ): Promise<any> {
    try {
      // Verify user has access to this conversation
      const conversation = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            or(
              eq(chatConversations.recruiterId, senderId),
              eq(chatConversations.jobSeekerId, senderId)
            )
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new Error('Conversation not found or access denied');
      }

      // Insert message
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          conversationId,
          senderId,
          message: message.trim(),
          messageType,
          isRead: false,
          isDelivered: true, // Assume delivered when saved to DB
        })
        .returning();

      // Update conversation's last message timestamp
      await db
        .update(chatConversations)
        .set({ 
          lastMessageAt: new Date(),
          isActive: true 
        })
        .where(eq(chatConversations.id, conversationId));

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Mark messages as read with batch update
  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    try {
      // Verify user has access to this conversation
      const conversation = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            or(
              eq(chatConversations.recruiterId, userId),
              eq(chatConversations.jobSeekerId, userId)
            )
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new Error('Conversation not found or access denied');
      }

      // Mark all unread messages from others as read
      await db
        .update(chatMessages)
        .set({
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(chatMessages.conversationId, conversationId),
            ne(chatMessages.senderId, userId),
            eq(chatMessages.isRead, false)
          )
        );

      // Update conversation timestamp
      await db
        .update(chatConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatConversations.id, conversationId));

    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Get conversation details
  async getConversationDetails(conversationId: number, userId: string): Promise<any> {
    try {
      const conversation = await db
        .select({
          id: chatConversations.id,
          recruiterId: chatConversations.recruiterId,
          jobSeekerId: chatConversations.jobSeekerId,
          jobPostingId: chatConversations.jobPostingId,
          applicationId: chatConversations.applicationId,
          lastMessageAt: chatConversations.lastMessageAt,
          isActive: chatConversations.isActive,
          createdAt: chatConversations.createdAt,
          recruiterFirstName: sql<string>`recruiter.first_name`,
          recruiterLastName: sql<string>`recruiter.last_name`,
          jobSeekerFirstName: sql<string>`job_seeker.first_name`,
          jobSeekerLastName: sql<string>`job_seeker.last_name`,
          jobTitle: sql<string>`job_posting.title`,
        })
        .from(chatConversations)
        .leftJoin(users.as('recruiter'), eq(chatConversations.recruiterId, sql`recruiter.id`))
        .leftJoin(users.as('job_seeker'), eq(chatConversations.jobSeekerId, sql`job_seeker.id`))
        .leftJoin(sql`job_postings job_posting`, eq(chatConversations.jobPostingId, sql`job_posting.id`))
        .where(
          and(
            eq(chatConversations.id, conversationId),
            or(
              eq(chatConversations.recruiterId, userId),
              eq(chatConversations.jobSeekerId, userId)
            )
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new Error('Conversation not found or access denied');
      }

      const conv = conversation[0];
      return {
        ...conv,
        recruiterName: conv.recruiterFirstName && conv.recruiterLastName 
          ? `${conv.recruiterFirstName} ${conv.recruiterLastName}`.trim()
          : 'Recruiter',
        jobSeekerName: conv.jobSeekerFirstName && conv.jobSeekerLastName
          ? `${conv.jobSeekerFirstName} ${conv.jobSeekerLastName}`.trim()
          : 'Job Seeker'
      };
    } catch (error) {
      console.error('Error getting conversation details:', error);
      throw new Error('Failed to get conversation details');
    }
  }

  // Search conversations
  async searchConversations(userId: string, query: string): Promise<ConversationWithDetails[]> {
    try {
      const conversations = await this.getConversationsForUser(userId);
      
      if (!query.trim()) {
        return conversations;
      }

      const searchTerm = query.toLowerCase();
      return conversations.filter(conv => {
        const recruiterName = conv.recruiterName?.toLowerCase() || '';
        const jobSeekerName = conv.jobSeekerName?.toLowerCase() || '';
        const jobTitle = conv.jobTitle?.toLowerCase() || '';
        const lastMessage = conv.lastMessage?.message?.toLowerCase() || '';

        return recruiterName.includes(searchTerm) ||
               jobSeekerName.includes(searchTerm) ||
               jobTitle.includes(searchTerm) ||
               lastMessage.includes(searchTerm);
      });
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw new Error('Failed to search conversations');
    }
  }

  // Get online users (this would typically be managed by WebSocket service)
  async getOnlineUsers(): Promise<string[]> {
    // This is a placeholder - in a real implementation, this would be managed
    // by the WebSocket service and stored in Redis or similar
    return [];
  }

  // Archive/deactivate conversation
  async archiveConversation(conversationId: number, userId: string): Promise<void> {
    try {
      // Verify user has access
      const conversation = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            or(
              eq(chatConversations.recruiterId, userId),
              eq(chatConversations.jobSeekerId, userId)
            )
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new Error('Conversation not found or access denied');
      }

      await db
        .update(chatConversations)
        .set({ isActive: false })
        .where(eq(chatConversations.id, conversationId));

    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw new Error('Failed to archive conversation');
    }
  }
}

export const chatService = new ChatService();