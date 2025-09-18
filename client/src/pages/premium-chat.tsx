import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  MessageCircle, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  Building2,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  userType?: string;
  firstName?: string;
  lastName?: string;
}

interface ChatConversation {
  id: number;
  recruiterId: string;
  jobSeekerId: string;
  recruiterName?: string;
  jobSeekerName?: string;
  jobTitle?: string;
  unreadCount?: number;
  lastMessageAt?: string;
  isActive: boolean;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
}

export default function PremiumChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  // Parse URL parameter for target user
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('user');

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Get conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest('/api/chat/conversations', 'POST', { otherUserId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      if (data?.id) {
        setSelectedConversation(data.id);
      } else if (data?.conversationId) {
        setSelectedConversation(data.conversationId);
      }
    },
  });

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest(`/api/chat/conversations/${selectedConversation}/messages`, 'POST', { 
        message: messageData.message 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
      scrollToBottom();
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest(`/api/chat/conversations/${conversationId}/read`, 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
  });

  // Auto-create conversation for URL parameter
  useEffect(() => {
    if (targetUserId && user && !conversationsLoading) {
      const existingConversation = conversations.find(conv => 
        (user.userType === 'recruiter' && conv.jobSeekerId === targetUserId) ||
        (user.userType === 'job_seeker' && conv.recruiterId === targetUserId)
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
      } else if (!createConversationMutation.isPending) {
        createConversationMutation.mutate(targetUserId);
      }
    }
  }, [targetUserId, user, conversations, conversationsLoading]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      const timer = setTimeout(() => {
        markAsReadMutation.mutate(selectedConversation);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation, user?.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({ message: newMessage });
  };

  const getUserDisplayName = (conversation: ChatConversation) => {
    if (!user) return 'Unknown';
    return user.userType === 'recruiter' 
      ? conversation.jobSeekerName || 'Job Seeker'
      : conversation.recruiterName || 'Recruiter';
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.senderId !== user?.id) return null;
    
    if (message.isRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    } else if (message.isDelivered) {
      return <CheckCheck className="h-4 w-4 text-gray-400" />;
    } else {
      return <Check className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);
  const filteredConversations = conversations.filter(conv => 
    getUserDisplayName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to access your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Conversations */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400">Start a new conversation</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedConversation === conv.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    )}
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getUserInitials(getUserDisplayName(conv))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {getUserDisplayName(conv)}
                        </p>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {conv.jobTitle || 'General conversation'}
                        </p>
                        {conv.unreadCount && conv.unreadCount > 0 && (
                          <Badge 
                            variant="default" 
                            className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center"
                            data-testid={`unread-count-${conv.id}`}
                          >
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {selectedConv ? getUserInitials(getUserDisplayName(selectedConv)) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConv ? getUserDisplayName(selectedConv) : 'Loading...'}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs bg-gray-200 dark:bg-gray-700 rounded-lg p-3 animate-pulse">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No messages yet</p>
                    <p className="text-gray-400">Start your conversation below</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.senderId === user.id;
                    const showTime = index === 0 || 
                      new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000; // 5 minutes
                    
                    return (
                      <div key={message.id}>
                        {showTime && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.message}</p>
                          </div>
                        </div>
                        
                        {isOwn && (
                          <div className="flex justify-end items-center space-x-1 px-2">
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {getMessageStatus(message)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-end space-x-3">
                <Button variant="ghost" size="sm" className="mb-2">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="pr-12 py-3 rounded-full border-gray-300 dark:border-gray-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    data-testid="input-message"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Messages
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Select a conversation to start messaging or create a new conversation with someone.
              </p>
              <Button>
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}