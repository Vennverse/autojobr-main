import { Express } from "express";
import { simpleChatService } from "./simpleChatService";
import { isAuthenticated } from "./auth";
import { simpleWebSocketService } from "./simpleWebSocketService";

/**
 * Simple LinkedIn-style Chat API Routes
 * Clean, minimal API for encrypted messaging
 */
export function setupSimpleChatRoutes(app: Express) {
  console.log('🔧 Setting up Simple Chat routes...');

  /**
   * GET /api/simple-chat/users
   * Get all users for chat directory (excluding current user)
   */
  app.get('/api/simple-chat/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await simpleChatService.getAllUsers(req.user.id);
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  /**
   * GET /api/simple-chat/conversations
   * Get all conversations for the current user
   */
  app.get('/api/simple-chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const conversations = await simpleChatService.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  /**
   * POST /api/simple-chat/conversations
   * Create a new conversation and optionally send first message
   */
  app.post('/api/simple-chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const { otherUserId, message } = req.body;

      if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required' });
      }

      // Get or create conversation
      const conversation = await simpleChatService.getOrCreateConversation(req.user.id, otherUserId);

      let newMessage = null;
      if (message?.trim()) {
        // Send initial message
        newMessage = await simpleChatService.sendMessage(conversation.id, req.user.id, message.trim());
      }

      // Wrap normalized message shape consistently
      res.json({
        conversation,
        conversationId: conversation.id,
        message: newMessage ? {
          ...newMessage
        } : null
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  /**
   * GET /api/simple-chat/messages/:conversationId
   * Get messages for a specific conversation
   */
  app.get('/api/simple-chat/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const messages = await simpleChatService.getConversationMessages(conversationId, req.user.id, page, limit);
      res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.message === 'Conversation not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  /**
   * POST /api/simple-chat/conversations/:conversationId/messages
   * Send a message in a conversation
   */
  app.post('/api/simple-chat/conversations/:conversationId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { message } = req.body;

      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      if (!message?.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      const newMessage = await simpleChatService.sendMessage(conversationId, req.user.id, message.trim());
      
      // Get conversation to find the other participant for WebSocket notification
      try {
        const conversation = await simpleChatService.getConversationById(conversationId, req.user.id);
        if (conversation) {
          const otherUserId = conversation.participant1Id === req.user.id ?
            conversation.participant2Id : conversation.participant1Id;
          
          console.log(`Sending WebSocket notification from ${req.user.id} to ${otherUserId} for conversation ${conversationId}`);
          
          // Broadcast new message to both participants via WebSocket with normalized payload
          simpleWebSocketService.broadcastNewMessage(req.user.id, otherUserId, conversationId, {
            ...newMessage
          });
        } else {
          console.log('Conversation not found for WebSocket notification');
        }
      } catch (wsError) {
        console.error('WebSocket notification error:', wsError);
        // Don't fail the request if WebSocket fails
      }
      
      // Respond with consistent wrapped shape
      res.json({ message: { ...newMessage } });
    } catch (error) {
      console.error('Error sending message:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  /**
   * POST /api/simple-chat/conversations/:conversationId/read
   * Mark messages in a conversation as read
   */
  app.post('/api/simple-chat/conversations/:conversationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);

      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      await simpleChatService.markMessagesAsRead(conversationId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.message === 'Conversation not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  });

  /**
   * GET /api/simple-chat/health
   * Health check endpoint
   */
  app.get('/api/simple-chat/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'simple-chat',
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Simple Chat routes registered successfully');
  console.log('   - GET /api/simple-chat/users');
  console.log('   - GET /api/simple-chat/conversations');
  console.log('   - POST /api/simple-chat/conversations');
  console.log('   - GET /api/simple-chat/messages/:conversationId');
  console.log('   - POST /api/simple-chat/conversations/:conversationId/messages');
  console.log('   - POST /api/simple-chat/conversations/:conversationId/read');
  console.log('   - GET /api/simple-chat/health');
}