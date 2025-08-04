import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useChatWebSocket, ChatMessage, ChatConversation } from '@/hooks/useChatWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  MessageCircle,
  Users,
  Clock,
  CheckCheck,
  ArrowLeft,
  Menu,
  Search,
  MoreVertical,
  Phone,
  Video,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  email: string;
  userType?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface MessageWithStatus extends ChatMessage {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string;
}

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingMessages, setPendingMessages] = useState<MessageWithStatus[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const typingTimeoutRef = useRef<number | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Parse URL parameters for direct user chat
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  
  // Update target user when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    console.log('URL changed, checking for user parameter:', userId, 'Current location:', location);
    setTargetUserId(userId);
  }, [location]);

  // Get current user
  const { user } = useAuth();

  // Initialize WebSocket connection
  const {
    connectionState,
    isConnected,
    onlineUsers,
    typingUsers,
    sendTyping,
    markAsRead,
    reconnect
  } = useChatWebSocket({
    userId: user?.id,
    enabled: !!user?.id,
    maxRetries: 5,
    retryDelay: 1000
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setShowConversationList(true);
      }
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Get conversations with optimized caching
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false, // WebSocket handles real-time updates
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create conversation mutation for direct user chat
  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      console.log('Creating conversation with user:', otherUserId);
      return apiRequest('POST', '/api/chat/conversations', { otherUserId });
    },
    onSuccess: (data: any) => {
      console.log('Conversation created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      if (data?.conversationId) {
        console.log('Setting selected conversation to:', data.conversationId);
        setSelectedConversation(data.conversationId);
        if (isMobileView) {
          setShowConversationList(false);
        }
      } else if (data?.id) {
        console.log('Setting selected conversation to:', data.id);
        setSelectedConversation(data.id);
        if (isMobileView) {
          setShowConversationList(false);
        }
      }
    },
    onError: (error: any) => {
      console.error('Failed to create conversation:', error);
    },
  });

  // Get messages for selected conversation with optimizations
  const {
    data: conversationMessages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation && !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data: ChatMessage[]) => {
      // Merge with pending messages
      const allMessages = [...data, ...pendingMessages];
      return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; tempId: string }) => {
      if (isOffline) {
        throw new Error('You are offline. Message will be sent when connection is restored.');
      }
      return apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, {
        message: messageData.message
      });
    },
    onMutate: async (messageData: { message: string; tempId: string }) => {
      // Optimistic update
      const tempMessage: MessageWithStatus = {
        id: Date.now(), // Temporary ID
        tempId: messageData.tempId,
        conversationId: selectedConversation!,
        senderId: user!.id,
        message: messageData.message,
        messageType: 'text',
        isRead: false,
        isDelivered: false,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      setPendingMessages((prev: MessageWithStatus[]) => [...prev, tempMessage]);
      return { tempMessage };
    },
    onSuccess: (data: any, variables: { message: string; tempId: string }, context: any) => {
      // Remove from pending and add real message
      setPendingMessages((prev: MessageWithStatus[]) => prev.filter((msg: MessageWithStatus) => msg.tempId !== variables.tempId));
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
    onError: (error: any, variables: { message: string; tempId: string }, context: any) => {
      // Mark message as failed
      setPendingMessages((prev: MessageWithStatus[]) =>
        prev.map((msg: MessageWithStatus) =>
          msg.tempId === variables.tempId
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
      console.error('Failed to send message:', error);
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest('POST', `/api/chat/conversations/${conversationId}/read`, {});
    },
    onSuccess: (_: any, conversationId: number) => {
      // Update the conversations cache to reset unread count
      queryClient.setQueryData(
        ['/api/chat/conversations'],
        (oldConversations: ChatConversation[] = []) =>
          oldConversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
      );
      
      // Also mark via WebSocket
      markAsRead(conversationId);
    },
  });

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id && conversationMessages.length > 0) {
      const hasUnreadMessages = conversationMessages.some(
        (message: ChatMessage) => !message.isRead && message.senderId !== user.id
      );
      
      if (hasUnreadMessages && !markAsReadMutation.isPending) {
        markAsReadMutation.mutate(selectedConversation);
      }
    }
  }, [selectedConversation, user?.id, conversationMessages, markAsReadMutation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Handle direct user chat from URL parameter
  useEffect(() => {
    console.log('Direct chat effect triggered:', {
      targetUserId,
      user: user?.id,
      userType: user?.userType,
      conversationsLoading,
      conversationsLength: conversations.length,
      createPending: createConversationMutation.isPending,
      createSuccess: createConversationMutation.isSuccess
    });

    if (targetUserId && user && !conversationsLoading) {
      console.log('Processing targetUserId:', targetUserId, 'User type:', user.userType);
      console.log('Available conversations:', conversations.length);
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        (user.userType === 'recruiter' && conv.jobSeekerId === targetUserId) ||
        (user.userType === 'job_seeker' && conv.recruiterId === targetUserId)
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        setSelectedConversation(existingConversation.id);
        if (isMobileView) {
          setShowConversationList(false);
        }
      } else if (!createConversationMutation.isPending && !createConversationMutation.isSuccess) {
        // Create new conversation
        console.log('Creating new conversation with user:', targetUserId);
        createConversationMutation.mutate(targetUserId);
      }
    }
  }, [targetUserId, user, conversations, conversationsLoading]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(selectedConversation, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      sendTyping(selectedConversation, false);
    }, 1000);
  }, [selectedConversation, isConnected, isTyping, sendTyping]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation || sendMessageMutation.isPending) {
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    sendMessageMutation.mutate({ message: newMessage, tempId });
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTyping(selectedConversation, false);
    }
  }, [newMessage, selectedConversation, sendMessageMutation, isTyping, sendTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  }, [handleSendMessage, handleTyping]);

  const getUserDisplayName = (conversation: ChatConversation) => {
    if (!user) return 'Unknown User';
    
    if (user.userType === 'recruiter') {
      return conversation.jobSeekerName || 'Job Seeker';
    } else {
      return conversation.recruiterName || 'Recruiter';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const filteredConversations = conversations.filter((conv: ChatConversation) => {
    const displayName = getUserDisplayName(conv);
    const jobTitle = conv.jobTitle || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationTitle = (conversation: ChatConversation) => {
    const displayName = getUserDisplayName(conversation);
    const jobTitle = conversation.jobTitle ? ` - ${conversation.jobTitle}` : '';
    return `${displayName}${jobTitle}`;
  };

  const handleConversationSelect = useCallback((conversationId: number) => {
    setSelectedConversation(conversationId);
    if (isMobileView) {
      setShowConversationList(false);
    }
  }, [isMobileView]);

  const handleBackToList = useCallback(() => {
    setShowConversationList(true);
    setSelectedConversation(null);
  }, []);

  const retryFailedMessage = useCallback((tempId: string) => {
    const failedMessage = pendingMessages.find((msg: MessageWithStatus) => msg.tempId === tempId);
    if (failedMessage) {
      setPendingMessages((prev: MessageWithStatus[]) => prev.filter((msg: MessageWithStatus) => msg.tempId !== tempId));
      sendMessageMutation.mutate({ message: failedMessage.message, tempId });
    }
  }, [pendingMessages, sendMessageMutation]);

  // LinkedIn-style conversation list
  const ConversationList = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations yet</p>
            <p className="text-sm">Start chatting with recruiters or job seekers!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedConversation === conversation.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getUserDisplayName(conversation).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getUserDisplayName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {conversation.jobTitle && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        {conversation.jobTitle}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        Click to start messaging
                      </p>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // LinkedIn-style message view
  const MessageView = () => {
    const selectedConv = conversations.find(c => c.id === selectedConversation);
    
    if (!selectedConversation || !selectedConv) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500">Choose a conversation to start messaging</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {isMobileView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm">
                {getUserDisplayName(selectedConv).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserDisplayName(selectedConv)}
              </h3>
              {selectedConv.jobTitle && (
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {selectedConv.jobTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              conversationMessages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${
                          isOwn 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOwn && message.isRead && (
                          <CheckCheck className="h-3 w-3 text-blue-100" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile layout with sheet
  if (isMobileView) {
    return (
      <div className="h-screen">
        {showConversationList ? (
          <ConversationList />
        ) : (
          <MessageView />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex">
      <div className="w-80 border-r border-gray-200 dark:border-gray-700">
        <ConversationList />
      </div>
      <div className="flex-1">
        <MessageView />
      </div>
    </div>
  );
}