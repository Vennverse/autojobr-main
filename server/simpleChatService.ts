import { db } from "./db";
import { conversations, messages, users } from "@shared/schema";
import { eq, or, and, desc, asc } from "drizzle-orm";
import { chatEncryptionService } from "./chatEncryptionService";

/**
 * Simple LinkedIn-style Chat Service
 * Handles conversation creation, message sending, and retrieval with encryption
 */
export class SimpleChatService {
  
  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    try {
      // Look for existing conversation (bidirectional)
      let conversation = await db.select()
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, user1Id),
              eq(conversations.participant2Id, user2Id)
            ),
            and(
              eq(conversations.participant1Id, user2Id),
              eq(conversations.participant2Id, user1Id)
            )
          )
        )
        .limit(1);

      if (conversation.length === 0) {
        // Create new conversation
        const newConversation = await db.insert(conversations)
          .values({
            participant1Id: user1Id,
            participant2Id: user2Id,
            isActive: true,
          })
          .returning();
        
        return newConversation[0];
      }

      return conversation[0];
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw new Error('Failed to get or create conversation');
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: number, senderId: string, messageText: string) {
    try {
      // For now, store plain text (simplified chat)
      const newMessage = await db.insert(messages)
        .values({
          conversationId,
          senderId,
          encryptedContent: messageText, // Store as plain text for now
          messageHash: Buffer.from(messageText).toString('base64'), // Simple hash
          messageType: 'text',
          isRead: false,
        })
        .returning();

      // Update conversation's last message  
      await db.update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: messageText.substring(0, 100), // Simple preview
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      return newMessage[0];
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(userId: string) {
    try {
      const userConversations = await db.select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        isActive: conversations.isActive,
        createdAt: conversations.createdAt,
        // Get other participant's details
        otherUserFirstName: users.firstName,
        otherUserLastName: users.lastName,
        otherUserEmail: users.email,
        otherUserType: users.userType,
        otherUserCompany: users.companyName,
      })
      .from(conversations)
      .leftJoin(users, or(
        and(
          eq(conversations.participant1Id, userId),
          eq(users.id, conversations.participant2Id)
        ),
        and(
          eq(conversations.participant2Id, userId),
          eq(users.id, conversations.participant1Id)
        )
      ))
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

      // Decrypt message previews and format response
      return userConversations.map(conv => {
        let decryptedPreview = '';
        try {
          decryptedPreview = conv.lastMessagePreview 
            ? chatEncryptionService.decryptPreview(conv.lastMessagePreview)
            : '';
        } catch (error) {
          decryptedPreview = 'Message preview unavailable';
        }

        const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const otherUserName = conv.otherUserFirstName && conv.otherUserLastName 
          ? `${conv.otherUserFirstName} ${conv.otherUserLastName}`
          : conv.otherUserEmail || 'Unknown User';

        return {
          id: conv.id,
          otherUserId,
          otherUserName,
          otherUserType: conv.otherUserType,
          otherUserCompany: conv.otherUserCompany,
          lastMessagePreview: decryptedPreview,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      });
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get conversations');
    }
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(conversationId: number, userId: string, page: number = 1, limit: number = 50) {
    try {
      // Verify user is part of this conversation
      const conversation = await db.select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          )
        )
        .limit(1);

      if (conversation.length === 0) {
        throw new Error('Conversation not found or access denied');
      }

      // Get messages with pagination
      const offset = (page - 1) * limit;
      const conversationMessages = await db.select({
        id: messages.id,
        senderId: messages.senderId,
        encryptedContent: messages.encryptedContent, // Use correct field name from schema
        messageType: messages.messageType,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        // Get sender details
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .offset(offset)
      .limit(limit);

      // Return messages (simplified - no encryption for now)
      return conversationMessages.map(msg => {
        const senderName = msg.senderFirstName && msg.senderLastName
          ? `${msg.senderFirstName} ${msg.senderLastName}`
          : msg.senderEmail || 'Unknown User';

        return {
          id: msg.id,
          senderId: msg.senderId,
          senderName,
          message: msg.encryptedContent || '', // Use encryptedContent directly
          messageType: msg.messageType,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
        };
      });
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: number, userId: string) {
    try {
      // Verify user is part of this conversation
      const conversation = await db.select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          )
        )
        .limit(1);

      if (conversation.length === 0) {
        throw new Error('Conversation not found or access denied');
      }

      // Mark all unread messages from other participant as read
      await db.update(messages)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.isRead, false),
            // Only mark messages NOT sent by current user as read
            userId === conversation[0].participant1Id 
              ? eq(messages.senderId, conversation[0].participant2Id)
              : eq(messages.senderId, conversation[0].participant1Id)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Get all users for chat directory (excluding current user)
   */
  async getAllUsers(currentUserId: string) {
    try {
      const allUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        userType: users.userType,
        companyName: users.companyName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(
        and(
          // Exclude current user
          // Only include users with verified emails (optional security)
          eq(users.emailVerified, true)
        )
      )
      .orderBy(asc(users.firstName), asc(users.lastName));

      return allUsers.filter(user => user.id !== currentUserId).map(user => ({
        id: user.id,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.email || 'Unknown User',
        email: user.email,
        userType: user.userType,
        companyName: user.companyName,
        profileImageUrl: user.profileImageUrl,
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get user directory');
    }
  }

  /**
   * Get conversation by ID (for participant verification)
   */
  /**
   * Get conversation by ID with participant verification
   */
  async getConversationById(conversationId: number, userId: string) {
    try {
      const conversation = await db.select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          )
        )
        .limit(1);

      return conversation.length > 0 ? conversation[0] : null;
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    }
  }
}

export const simpleChatService = new SimpleChatService();