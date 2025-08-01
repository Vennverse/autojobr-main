import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatConversation {
  id: number;
  recruiterId: string;
  jobSeekerId: string;
  lastMessageAt: string;
  recruiterName?: string;
  jobSeekerName?: string;
  unreadCount?: number;
}

export default function SimpleChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        if (message.type === 'new_message') {
          // OPTIMIZATION: Update cache directly instead of invalidating
          if (selectedConversation && message.conversationId === selectedConversation) {
            queryClient.setQueryData(
              [`/api/chat/conversations/${selectedConversation}/messages`],
              (oldMessages: any[] = []) => [...oldMessages, message.data]
            );
          }
          
          // OPTIMIZATION: Update conversation unread count directly
          queryClient.setQueryData(
            ['/api/chat/conversations'],
            (oldConversations: any[] = []) => oldConversations.map(conv => 
              conv.id === message.conversationId 
                ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user?.id, selectedConversation, queryClient]);

  // Get conversations - only fetch once
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Get messages for selected conversation
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 30 * 1000, // Consider messages fresh for 30 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest(`/api/chat/conversations/${selectedConversation}/messages`, 'POST', { 
        message: messageData.message 
      });
    },
    onSuccess: () => {
      setNewMessage('');
      // Immediately invalidate queries to show the message
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/conversations'] 
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({ message: newMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUserDisplayName = (conversation: ChatConversation) => {
    if (!user) return 'Unknown User';
    
    if (user.userType === 'recruiter') {
      return conversation.jobSeekerName || 'Job Seeker';
    } else {
      return conversation.recruiterName || 'Recruiter';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access chat.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex">
      {/* Conversations List */}
      <Card className="w-1/3 mr-4 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
            {isConnected && (
              <span className="text-xs text-green-500 ml-auto">● Connected</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(getUserDisplayName(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{getUserDisplayName(conversation)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden">
        {selectedConversation ? (
          <>
            <CardHeader>
              <CardTitle>
                Chat with {conversations.find(c => c.id === selectedConversation) ? 
                  getUserDisplayName(conversations.find(c => c.id === selectedConversation)!) : 
                  'User'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100vh-200px)]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}