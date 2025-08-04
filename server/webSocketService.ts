import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { chatService } from './chatService';

export interface WebSocketMessage {
  type: 'auth' | 'ping' | 'pong' | 'typing' | 'message_read' | 'new_message' | 'user_online' | 'user_offline' | 'error';
  userId?: string;
  conversationId?: number;
  message?: any;
  data?: any;
  isTyping?: boolean;
  error?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
  lastPing?: Date;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, Set<AuthenticatedWebSocket>>();
  private typingUsers = new Map<number, Map<string, NodeJS.Timeout>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    console.log('WebSocket service initialized');
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    console.log('New WebSocket connection');
    
    ws.isAuthenticated = false;
    ws.lastPing = new Date();

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });

    ws.on('pong', () => {
      ws.lastPing = new Date();
    });

    // Send initial connection message
    this.sendMessage(ws, {
      type: 'user_online',
      data: { message: 'Connected to chat server' }
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      switch (message.type) {
        case 'auth':
          await this.handleAuthentication(ws, message);
          break;

        case 'ping':
          this.handlePing(ws);
          break;

        case 'typing':
          await this.handleTyping(ws, message);
          break;

        case 'message_read':
          await this.handleMessageRead(ws, message);
          break;

        default:
          console.log('Unknown message type:', message.type);
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendError(ws, 'Internal server error');
    }
  }

  private async handleAuthentication(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.userId) {
      this.sendError(ws, 'User ID required for authentication');
      return;
    }

    try {
      // Here you could add additional user validation if needed
      ws.userId = message.userId;
      ws.isAuthenticated = true;

      // Add to connections map
      if (!this.connections.has(message.userId)) {
        this.connections.set(message.userId, new Set());
      }
      this.connections.get(message.userId)!.add(ws);

      // Notify user they're authenticated
      this.sendMessage(ws, {
        type: 'auth',
        data: { 
          message: 'Authentication successful',
          userId: message.userId 
        }
      });

      // Notify other users that this user is online
      this.broadcastUserStatus(message.userId, 'online');

      console.log(`User ${message.userId} authenticated via WebSocket`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  private handlePing(ws: AuthenticatedWebSocket) {
    ws.lastPing = new Date();
    this.sendMessage(ws, { type: 'pong' });
  }

  private async handleTyping(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.isAuthenticated || !ws.userId || !message.conversationId) {
      this.sendError(ws, 'Authentication required or missing conversation ID');
      return;
    }

    try {
      const conversationId = message.conversationId;
      const userId = ws.userId;
      const isTyping = message.isTyping || false;

      // Manage typing timeouts
      if (!this.typingUsers.has(conversationId)) {
        this.typingUsers.set(conversationId, new Map());
      }

      const conversationTyping = this.typingUsers.get(conversationId)!;

      if (isTyping) {
        // Clear existing timeout
        if (conversationTyping.has(userId)) {
          clearTimeout(conversationTyping.get(userId)!);
        }

        // Set new timeout to auto-clear typing status
        const timeout = setTimeout(() => {
          conversationTyping.delete(userId);
          if (conversationTyping.size === 0) {
            this.typingUsers.delete(conversationId);
          }
          
          // Broadcast typing stopped
          this.broadcastToConversation(conversationId, {
            type: 'typing',
            userId,
            conversationId,
            isTyping: false
          }, userId);
        }, 3000);

        conversationTyping.set(userId, timeout);
      } else {
        // Clear typing status
        if (conversationTyping.has(userId)) {
          clearTimeout(conversationTyping.get(userId)!);
          conversationTyping.delete(userId);
        }
        
        if (conversationTyping.size === 0) {
          this.typingUsers.delete(conversationId);
        }
      }

      // Broadcast typing status to other participants
      this.broadcastToConversation(conversationId, {
        type: 'typing',
        userId,
        conversationId,
        isTyping
      }, userId);

    } catch (error) {
      console.error('Error handling typing:', error);
      this.sendError(ws, 'Failed to handle typing indicator');
    }
  }

  private async handleMessageRead(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.isAuthenticated || !ws.userId || !message.conversationId) {
      this.sendError(ws, 'Authentication required or missing conversation ID');
      return;
    }

    try {
      await chatService.markMessagesAsRead(message.conversationId, ws.userId);

      // Broadcast read status to other participants
      this.broadcastToConversation(message.conversationId, {
        type: 'message_read',
        userId: ws.userId,
        conversationId: message.conversationId
      }, ws.userId);

    } catch (error) {
      console.error('Error handling message read:', error);
      this.sendError(ws, 'Failed to mark messages as read');
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId && ws.isAuthenticated) {
      console.log(`User ${ws.userId} disconnected from WebSocket`);

      // Remove from connections
      const userConnections = this.connections.get(ws.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.connections.delete(ws.userId);
          // Notify others that user is offline
          this.broadcastUserStatus(ws.userId, 'offline');
        }
      }

      // Clear any typing indicators for this user
      this.typingUsers.forEach((conversationTyping, conversationId) => {
        if (conversationTyping.has(ws.userId!)) {
          clearTimeout(conversationTyping.get(ws.userId!)!);
          conversationTyping.delete(ws.userId!);
          
          // Broadcast typing stopped
          this.broadcastToConversation(conversationId, {
            type: 'typing',
            userId: ws.userId,
            conversationId,
            isTyping: false
          }, ws.userId!);
        }
      });
    }
  }

  // Broadcast new message to conversation participants
  async broadcastNewMessage(conversationId: number, message: any, senderId: string) {
    try {
      // Get conversation details to find participants
      const conversation = await chatService.getConversationDetails(conversationId, senderId);
      
      const participants = [conversation.recruiterId, conversation.jobSeekerId];
      
      participants.forEach(participantId => {
        if (participantId !== senderId) {
          this.sendToUser(participantId, {
            type: 'new_message',
            conversationId,
            message,
            data: message
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting new message:', error);
    }
  }

  // Broadcast to all participants in a conversation except sender
  private async broadcastToConversation(
    conversationId: number, 
    message: WebSocketMessage, 
    excludeUserId?: string
  ) {
    try {
      // This is a simplified version - in a real app, you'd want to cache conversation participants
      // For now, we'll broadcast to all connected users except the sender
      this.connections.forEach((connections, userId) => {
        if (userId !== excludeUserId) {
          connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              this.sendMessage(ws, message);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting to conversation:', error);
    }
  }

  // Send message to specific user
  private sendToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, message);
        }
      });
    }
  }

  // Broadcast user online/offline status
  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    const message: WebSocketMessage = {
      type: status === 'online' ? 'user_online' : 'user_offline',
      userId
    };

    this.connections.forEach((connections, connectedUserId) => {
      if (connectedUserId !== userId) {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            this.sendMessage(ws, message);
          }
        });
      }
    });
  }

  // Send message to WebSocket
  private sendMessage(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  // Send error message
  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      error
    });
  }

  // Start heartbeat to detect dead connections
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 60 seconds

      this.connections.forEach((connections, userId) => {
        connections.forEach(ws => {
          if (ws.lastPing && (now.getTime() - ws.lastPing.getTime()) > timeout) {
            console.log(`Terminating inactive connection for user ${userId}`);
            ws.terminate();
          } else if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        });
      });
    }, 30000); // Check every 30 seconds
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  // Get connection count for user
  getUserConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  // Cleanup
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Clear all typing timeouts
    this.typingUsers.forEach(conversationTyping => {
      conversationTyping.forEach(timeout => clearTimeout(timeout));
    });

    // Close all connections
    this.connections.forEach(connections => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Server shutdown');
        }
      });
    });

    this.connections.clear();
    this.typingUsers.clear();

    if (this.wss) {
      this.wss.close();
    }

    console.log('WebSocket service shut down');
  }
}

export const webSocketService = new WebSocketService();