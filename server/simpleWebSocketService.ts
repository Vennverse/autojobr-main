import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

/**
 * Simple WebSocket Service for Real-time Chat
 * Handles WebSocket connections and message broadcasting
 */
export class SimpleWebSocketService {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, Set<WebSocket>>();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: Server) {
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    this.wss.on('connection', (ws, req) => {
      let userId: string | null = null;
      
      console.log('New WebSocket connection');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authenticate') {
            // Authenticate WebSocket connection
            userId = message.userId;
            if (userId) {
              if (!this.connections.has(userId)) {
                this.connections.set(userId, new Set());
              }
              this.connections.get(userId)!.add(ws);
              
              console.log(`User ${userId} authenticated on WebSocket`);
              
              // Send authentication confirmation
              ws.send(JSON.stringify({ 
                type: 'auth_success', 
                message: 'WebSocket authenticated successfully' 
              }));
            }
          }
          
          // Handle other message types if needed in future
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        // Remove connection from user's connection set
        if (userId && this.connections.has(userId)) {
          this.connections.get(userId)!.delete(ws);
          if (this.connections.get(userId)!.size === 0) {
            this.connections.delete(userId);
          }
          console.log(`User ${userId} disconnected from WebSocket`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('Simple WebSocket service initialized on /ws');
  }

  /**
   * Broadcast message to a specific user's connections
   */
  broadcastToUser(userId: string, message: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const messageStr = JSON.stringify(message);
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  /**
   * Broadcast new message notification to conversation participants
   */
  broadcastNewMessage(senderId: string, otherUserId: string, conversationId: number, messageData: any) {
    console.log(`Broadcasting new message from ${senderId} to ${otherUserId} for conversation ${conversationId}`);
    
    // Notify the other participant about the new message with normalized payload
    this.broadcastToUser(otherUserId, {
      type: 'new_message',
      conversationId,
      message: { ...messageData }
    });
    
    // Also notify the sender for their other sessions
    this.broadcastToUser(senderId, {
      type: 'new_message',
      conversationId,
      message: { ...messageData }
    });
  }

  /**
   * Get number of active connections
   */
  getConnectionCount(): number {
    let total = 0;
    this.connections.forEach(userConnections => {
      total += userConnections.size;
    });
    return total;
  }

  /**
   * Get online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connections.has(userId) && this.connections.get(userId)!.size > 0;
  }
}

export const simpleWebSocketService = new SimpleWebSocketService();