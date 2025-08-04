import { Router } from 'express';
import { chatService } from './chatService';
import { webSocketService } from './webSocketService';
import { isAuthenticated } from './auth';
import { SubscriptionService } from './subscriptionService';

const router = Router();
const subscriptionService = new SubscriptionService();

// Get conversations with pagination and enhanced details
router.get('/conversations', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { search, page = 1, limit = 20 } = req.query;

    let conversations;
    
    if (search) {
      conversations = await chatService.searchConversations(userId, search);
    } else {
      conversations = await chatService.getConversationsForUser(userId);
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedConversations = conversations.slice(startIndex, endIndex);

    res.json({
      conversations: paginatedConversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: conversations.length,
        hasMore: endIndex < conversations.length
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create or get conversation
router.post('/conversations', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId, jobPostingId, applicationId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check chat access for recruiters
    if (req.user?.userType === 'recruiter') {
      const canChat = await subscriptionService.canAccessFeature(userId, 'chatMessages');
      if (!canChat) {
        return res.status(403).json({ 
          error: 'Chat access requires premium subscription',
          upgradeRequired: true
        });
      }
    }

    const result = await chatService.createOrGetConversation(
      userId,
      otherUserId,
      jobPostingId,
      applicationId
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({ 
      error: 'Failed to create or get conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get conversation details
router.get('/conversations/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await chatService.getConversationDetails(conversationId, userId);
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get messages with pagination
router.get('/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { page = 1, limit = 50 } = req.query;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const result = await chatService.getMessagesForConversation(
      conversationId,
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send message
router.post('/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { message, messageType = 'text' } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check chat access for recruiters
    if (req.user?.userType === 'recruiter') {
      const canChat = await subscriptionService.canAccessFeature(userId, 'chatMessages');
      if (!canChat) {
        return res.status(403).json({ 
          error: 'Chat access requires premium subscription',
          upgradeRequired: true
        });
      }
    }

    // Send message
    const newMessage = await chatService.sendMessage(
      conversationId,
      userId,
      message.trim(),
      messageType
    );

    // Broadcast via WebSocket
    await webSocketService.broadcastNewMessage(conversationId, newMessage, userId);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark messages as read
router.post('/conversations/:id/read', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    await chatService.markMessagesAsRead(conversationId, userId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark messages as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Archive conversation
router.post('/conversations/:id/archive', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    await chatService.archiveConversation(conversationId, userId);
    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ 
      error: 'Failed to archive conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get online users
router.get('/online-users', isAuthenticated, async (req: any, res) => {
  try {
    const onlineUsers = webSocketService.getOnlineUsers();
    res.json({ onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch online users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for chat system
router.get('/health', (req, res) => {
  const onlineUsers = webSocketService.getOnlineUsers();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.length,
    services: {
      chatService: 'active',
      webSocketService: 'active'
    }
  });
});

export default router;