import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useChatWebSocket, ChatMessage, ChatConversation } from '@/hooks/useChatWebSocket';

// UI Components
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

export default function ImprovedChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingMessages, setPendingMessages] = useState<MessageWithStatus[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
      const conversationId = data?.conversationId || data?.id;
      if (conversationId) {
        console.log('Setting selected conversation to:', conversationId);
        setSelectedConversation(conversationId);
        if (isMobileView) {
          setShowConversationList(false);
        }
      }
    },
    onError: (error: any) => {
      console.error('Failed to create conversation:', error);
    },
  });

  // Get messages for selected conversation with pagination
  const { 
    data: conversationMessages = [], 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages', messagesPage],
    enabled: !!selectedConversation && !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => {
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
    onMutate: async (messageData) => {
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

      setPendingMessages(prev => [...prev, tempMessage]);
      return { tempMessage };
    },
    onSuccess: (data, variables, context) => {
      // Remove from pending and add real message
      setPendingMessages(prev => prev.filter(msg => msg.tempId !== variables.tempId));
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
    onError: (error, variables, context) => {
      // Mark message as failed
      setPendingMessages(prev => 
        prev.map(msg => 
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
    onSuccess: (_, conversationId) => {
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Handle direct user chat from URL parameter
  useEffect(() => {
    if (targetUserId && user && !conversationsLoading) {
      console.log('Processing targetUserId:', targetUserId, 'User type:', user.userType);
      
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
      } else if (!createConversationMutation.isPending) {
        // Create new conversation
        console.log('Creating new conversation with user:', targetUserId);
        createConversationMutation.mutate(targetUserId);
      }
    }
  }, [targetUserId, user, conversations, conversationsLoading, createConversationMutation, isMobileView]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id && conversationMessages.length > 0) {
      const hasUnreadMessages = conversationMessages.some(
        message => !message.isRead && message.senderId !== user.id
      );
      
      if (hasUnreadMessages && !markAsReadMutation.isPending) {
        markAsReadMutation.mutate(selectedConversation);
      }
    }
  }, [selectedConversation, user?.id, conversationMessages, markAsReadMutation]);

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

  const getUserDisplayName = useCallback((conversation: ChatConversation) => {
    if (!user) return 'Unknown User';
    
    if (user.userType === 'recruiter') {
      return conversation.jobSeekerName || 'Job Seeker';
    } else {
      return conversation.recruiterName || 'Recruiter';
    }
  }, [user]);

  const getUserInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  }, []);

  const formatMessageTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  }, []);

  const filteredConversations = conversations.filter(conv => {
    const displayName = getUserDisplayName(conv);
    const jobTitle = conv.jobTitle || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleConversationSelect = useCallback((conversationId: number) => {
    setSelectedConversation(conversationId);
    setMessagesPage(1);
    setHasMoreMessages(true);
    if (isMobileView) {
      setShowConversationList(false);
    }
  }, [isMobileView]);

  const handleBackToList = useCallback(() => {
    setShowConversationList(true);
    setSelectedConversation(null);
  }, []);

  const retryFailedMessage = useCallback((tempId: string) => {
    const failedMessage = pendingMessages.find(msg => msg.tempId === tempId);
    if (failedMessage) {
      setPendingMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      sendMessageMutation.mutate({ message: failedMessage.message, tempId });
    }
  }, [pendingMessages, sendMessageMutation]);

  // Connection status indicator
  const ConnectionStatus = () => {
    if (isOffline) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">You're offline</span>
        </div>
      );
    }

    if (connectionState.status === 'connecting' || connectionState.status === 'reconnecting') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border-b border-yellow-200">
          <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
          <span className="text-sm text-yellow-700">
            {connectionState.status === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
          </span>
        </div>
      );
    }

    if (connectionState.status === 'error') {
      return (
        <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">Connection failed</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={reconnect}
            className="h-6 text-xs"
          >
            Retry
          </Button>
        </div>
      );
    }

    return null;
  };

  // Message status indicator
  const MessageStatus = ({ message }: { message: MessageWithStatus }) => {
    if (message.senderId !== user?.id) return null;

    switch (message.status) {
      case 'sending':
        return <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />;
      case 'failed':
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => message.tempId && retryFailedMessage(message.tempId)}
            className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
          >
            <AlertCircle className="h-3 w-3" />
          </Button>
        );
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        if (message.isRead) {
          return <CheckCheck className="h-3 w-3 text-blue-500" />;
        } else if (message.isDelivered) {
          return <CheckCheck className="h-3 w-3 text-gray-400" />;
        } else {
          return <Check className="h-3 w-3 text-gray-400" />;
        }
    }
  };

  // Typing indicator component
  const TypingIndicator = ({ conversationId }: { conversationId: number }) => {
    const typingInConversation = typingUsers.get(conversationId);
    if (!typingInConversation || typingInConversation.size === 0) return null;

    const typingUsersList = Array.from(typingInConversation);
    const displayText = typingUsersList.length === 1 
      ? 'is typing...' 
      : `${typingUsersList.length} people are typing...`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500"
      >
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{displayText}</span>
      </motion.div>
    );
  };

  // LinkedIn-style conversation list
  const ConversationList = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <ConnectionStatus />
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h2>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 text-center text-gray-500">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations yet</p>
            <p className="text-sm">Start chatting with recruiters or job seekers!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => {
              const isUserOnline = onlineUsers.has(
                user?.userType === 'recruiter' ? conversation.jobSeekerId : conversation.recruiterId
              );
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedConversation === conversation.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getUserInitials(getUserDisplayName(conversation))}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
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
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Enhanced message view
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

    const isUserOnline = onlineUsers.has(
      user?.userType === 'recruiter' ? selectedConv.jobSeekerId : selectedConv.recruiterId
    );

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <ConnectionStatus />
        
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
            
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {getUserInitials(getUserDisplayName(selectedConv))}
                </AvatarFallback>
              </Avatar>
              {isUserOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserDisplayName(selectedConv)}
              </h3>
              <div className="flex items-center gap-2">
                {selectedConv.jobTitle && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                    {selectedConv.jobTitle}
                  </p>
                )}
                {isUserOnline && (
                  <span className="text-xs text-green-600">Online</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
          <div className="space-y-4">
            {messagesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {conversationMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    conversationMessages[index - 1]?.senderId !== message.senderId
                  );
                  
                  return (
                    <motion.div
                      key={message.id || message.tempId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {showAvatar && !isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gray-500 text-white text-xs">
                              {getUserInitials(getUserDisplayName(selectedConv))}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
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
                            <MessageStatus message={message} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                <AnimatePresence>
                  <TypingIndicator conversationId={selectedConversation} />
                </AnimatePresence>
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex space-x-2">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isOffline ? "You're offline..." : "Type a message..."}
              className="flex-1"
              disabled={sendMessageMutation.isPending || isOffline}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending || isOffline}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Connection status in input area */}
          {!isConnected && !isOffline && (
            <div className="flex items-center justify-center mt-2 text-xs text-yellow-600">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Connecting...
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile layout with enhanced UX
  if (isMobileView) {
    return (
      <div className="h-screen">
        <AnimatePresence mode="wait">
          {showConversationList ? (
            <motion.div
              key="conversations"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ConversationList />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <MessageView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop layout with enhanced features
  return (
    <div className="h-screen flex">
      <motion.div
        className="w-80 border-r border-gray-200 dark:border-gray-700"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ConversationList />
      </motion.div>
      <motion.div
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <MessageView />
      </motion.div>
    </div>
  );
}