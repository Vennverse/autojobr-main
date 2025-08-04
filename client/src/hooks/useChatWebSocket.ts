import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Proper TypeScript interfaces
export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  isDelivered: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatConversation {
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
  unreadCount?: number;
}

export interface WebSocketMessage {
  type: 'auth' | 'auth_success' | 'new_message' | 'typing' | 'message_read' | 'user_online' | 'user_offline' | 'error';
  userId?: string;
  conversationId?: number;
  message?: ChatMessage;
  data?: any;
  isTyping?: boolean;
  error?: string;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  error?: string;
  retryCount: number;
  lastConnected?: Date;
}

interface UseChatWebSocketProps {
  userId?: string;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export const useChatWebSocket = ({ 
  userId, 
  enabled = true,
  maxRetries = 5,
  retryDelay = 1000
}: UseChatWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0
  });

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<string>>>(new Map());

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Optimized cache updates
  const updateConversationsCache = useCallback((conversationId: number, updates: Partial<ChatConversation>) => {
    queryClient.setQueryData(
      ['/api/chat/conversations'],
      (oldConversations: ChatConversation[] = []) => 
        oldConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, ...updates }
            : conv
        )
    );
  }, [queryClient]);

  const addMessageToCache = useCallback((message: ChatMessage) => {
    queryClient.setQueryData(
      ['/api/chat/conversations', message.conversationId, 'messages'],
      (oldMessages: ChatMessage[] = []) => {
        // Avoid duplicates
        const exists = oldMessages.some(msg => msg.id === message.id);
        if (exists) return oldMessages;
        return [...oldMessages, message];
      }
    );
  }, [queryClient]);

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    if (!mountedRef.current) return;

    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      switch (message.type) {
        case 'auth_success':
          console.log('WebSocket authentication successful');
          break;

        case 'new_message':
          if (message.message) {
            addMessageToCache(message.message);
            updateConversationsCache(message.message.conversationId, {
              lastMessageAt: message.message.createdAt,
              unreadCount: message.message.senderId !== userId ? 1 : 0
            });
          }
          break;

        case 'message_read':
          if (message.conversationId) {
            updateConversationsCache(message.conversationId, { unreadCount: 0 });
            // Update message read status in cache
            queryClient.setQueryData(
              ['/api/chat/conversations', message.conversationId, 'messages'],
              (oldMessages: ChatMessage[] = []) =>
                oldMessages.map(msg => 
                  msg.senderId === userId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
                )
            );
          }
          break;

        case 'typing':
          if (message.conversationId && message.userId && message.userId !== userId) {
            setTypingUsers((prev: Map<number, Set<string>>) => {
              const newMap = new Map(prev);
              const conversationTyping = newMap.get(message.conversationId!) || new Set<string>();
              
              if (message.isTyping) {
                conversationTyping.add(message.userId!);
              } else {
                conversationTyping.delete(message.userId!);
              }
              
              if (conversationTyping.size === 0) {
                newMap.delete(message.conversationId!);
              } else {
                newMap.set(message.conversationId!, conversationTyping);
              }
              
              return newMap;
            });

            // Auto-clear typing indicator after 3 seconds
            if (message.isTyping) {
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = window.setTimeout(() => {
                setTypingUsers((prev: Map<number, Set<string>>) => {
                  const newMap = new Map(prev);
                  const conversationTyping = newMap.get(message.conversationId!);
                  if (conversationTyping) {
                    conversationTyping.delete(message.userId!);
                    if (conversationTyping.size === 0) {
                      newMap.delete(message.conversationId!);
                    }
                  }
                  return newMap;
                });
              }, 3000);
            }
          }
          break;

        case 'user_online':
          if (message.userId && message.userId !== userId) {
            setOnlineUsers((prev: Set<string>) => new Set(prev).add(message.userId!));
          }
          break;

        case 'user_offline':
          if (message.userId) {
            setOnlineUsers((prev: Set<string>) => {
              const newSet = new Set(prev);
              newSet.delete(message.userId!);
              return newSet;
            });
          }
          break;

        case 'error':
          console.error('WebSocket error message:', message.error);
          setConnectionState((prev: ConnectionState) => ({ ...prev, error: message.error }));
          break;

        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [userId, addMessageToCache, updateConversationsCache, queryClient]);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!mountedRef.current || !userId || !enabled) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;

    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      setConnectionState((prev: ConnectionState) => ({ ...prev, status: 'connecting' }));

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connected');
        setConnectionState({
          status: 'connected',
          retryCount: 0,
          lastConnected: new Date()
        });

        // Authenticate
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'auth',
            userId: userId
          }));
        }

        startHeartbeat();
      };

      ws.current.onmessage = handleMessage;

      ws.current.onclose = (event: CloseEvent) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket disconnected:', event.code, event.reason);
        clearTimeouts();
        
        setConnectionState((prev: ConnectionState) => ({
          ...prev,
          status: prev.retryCount < maxRetries ? 'reconnecting' : 'disconnected'
        }));

        // Auto-reconnect with exponential backoff
        if (connectionState.retryCount < maxRetries && enabled) {
          const delay = retryDelay * Math.pow(2, connectionState.retryCount);
          console.log(`Reconnecting in ${delay}ms (attempt ${connectionState.retryCount + 1}/${maxRetries})`);
          
          retryTimeoutRef.current = window.setTimeout(() => {
            setConnectionState((prev: ConnectionState) => ({ ...prev, retryCount: prev.retryCount + 1 }));
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error: Event) => {
        if (!mountedRef.current) return;
        
        console.error('WebSocket error:', error);
        setConnectionState((prev: ConnectionState) => ({
          ...prev,
          status: 'error',
          error: 'Connection failed'
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState((prev: ConnectionState) => ({
        ...prev,
        status: 'error',
        error: 'Failed to create connection'
      }));
    }
  }, [userId, enabled, maxRetries, retryDelay, connectionState.retryCount, handleMessage, startHeartbeat, clearTimeouts]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    clearTimeouts();
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
    setConnectionState({ status: 'disconnected', retryCount: 0 });
    setOnlineUsers(new Set());
    setTypingUsers(new Map());
  }, [clearTimeouts]);

  // Send message with retry logic
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'userId'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ ...message, userId }));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected, attempting to reconnect...');
      if (connectionState.status === 'disconnected') {
        connect();
      }
      return false;
    }
  }, [userId, connectionState.status, connect]);

  // Send typing indicator with debouncing
  const sendTyping = useCallback((conversationId: number, isTyping: boolean) => {
    return sendMessage({
      type: 'typing',
      conversationId,
      isTyping
    });
  }, [sendMessage]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: number) => {
    return sendMessage({
      type: 'message_read',
      conversationId
    });
  }, [sendMessage]);

  // Connect when userId is available
  useEffect(() => {
    if (userId && enabled && connectionState.status === 'disconnected') {
      connect();
    }
  }, [userId, enabled, connect, connectionState.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setConnectionState((prev: ConnectionState) => ({ ...prev, retryCount: 0 }));
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  return {
    connectionState,
    isConnected: connectionState.status === 'connected',
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    connect,
    disconnect,
    reconnect
  };
};