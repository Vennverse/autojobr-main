import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Users, MessageCircle, ArrowLeft } from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  companyName?: string;
  profileImageUrl?: string;
}

interface Conversation {
  id: number;
  otherUserId: string;
  otherUserName: string;
  otherUserType: string;
  otherUserCompany?: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  isPending?: boolean; // For optimistic updates
}

// Simple WebSocket hook for real-time messaging  
const useWebSocket = (user: { id: string } | null | undefined) => {
  const [socket, setSocket] = useState<globalThis.WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new globalThis.WebSocket(wsUrl);

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
        const data = JSON.parse(event.data as string);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'new_message') {
          console.log('Processing new message for real-time update:', data);
          
          // Only refresh conversations list to update previews and timestamps
          queryClient.invalidateQueries({ queryKey: ['/api/simple-chat/conversations'] });
          
          // DON'T invalidate messages - this causes sent messages to disappear!
          // The optimistic update and onSuccess handler will manage message display
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
  }, [user?.id, queryClient]);

  return { socket, isConnected };
};

export default function SimpleChatPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'conversations' | 'users' | 'chat'>('conversations');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const targetUserId = urlParams.get('user');
  const preloadApplicantId = urlParams.get('applicant');
  const preloadJobId = urlParams.get('job');
  const applicationId = urlParams.get('application');

  // WebSocket connection
  const { isConnected } = useWebSocket(user);

  // Get all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/simple-chat/conversations'],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch('/api/simple-chat/conversations', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  // Get all users for directory
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<ChatUser[]>({
    queryKey: ['/api/simple-chat/users'],
    enabled: !!user?.id, // Remove view dependency - we need users for URL routing
    queryFn: async () => {
      const response = await fetch('/api/simple-chat/users', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages, error: messagesError } = useQuery<Message[]>({
    queryKey: ['/api/simple-chat/messages', selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: false, // Disabled - using WebSocket for real-time updates
    refetchOnWindowFocus: true,
    queryFn: async () => {
      console.log(`Fetching messages for conversation ${selectedConversation}`);
      const response = await fetch(`/api/simple-chat/messages/${selectedConversation}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} messages for conversation ${selectedConversation}`);
      return data;
    }
  });

  // Debug logs - Remove after testing
  useEffect(() => {
    console.log('=== CHAT DEBUG INFO ===');
    console.log('Current user:', user?.id);
    console.log('Selected conversation:', selectedConversation);
    console.log('Conversations count:', conversations.length);
    console.log('Messages count:', messages.length);
    console.log('View:', view);
    console.log('Target user ID from URL:', targetUserId);
    console.log('Messages loading:', messagesLoading);
    console.log('Messages query enabled:', !!selectedConversation);
    console.log('======================');
  }, [user, selectedConversation, conversations, messages, view, targetUserId, messagesLoading]);

  // Send message mutation with robust optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId?: number; otherUserId?: string; message: string; clientTempId?: number }) => {
      console.log('Sending message:', data); // Debug log

      if (data.conversationId) {
        // Send message to existing conversation
        const response = await fetch(`/api/simple-chat/conversations/${data.conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: data.message
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } else {
        // Create new conversation with first message
        const response = await fetch('/api/simple-chat/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            otherUserId: data.otherUserId,
            message: data.message
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      }
    },
    onMutate: async (variables: { conversationId?: number; otherUserId?: string; message: string; clientTempId?: number }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/simple-chat/messages', selectedConversation] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['/api/simple-chat/messages', selectedConversation]);

      // Create deterministic client temp id and attach to variables for later reconciliation
      const clientTempId = variables.clientTempId ?? Date.now();

      // Create optimistic message
      const optimisticMessage: Message & { clientTempId: number } = {
        id: clientTempId, // Temporary ID for React key
        senderId: user?.id || '',
        senderName: 'You',
        message: variables.message,
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        isPending: false,
        // @ts-ignore - augmenting for client only
        clientTempId
      };

      // Optimistically update to the new value
      if (selectedConversation) {
        queryClient.setQueryData<Message[]>(
          ['/api/simple-chat/messages', selectedConversation],
          (oldMessages = []) => [...oldMessages, optimisticMessage as unknown as Message]
        );
      }

      // Return a context object with the snapshot and temp id
      return { previousMessages, clientTempId, messageText: variables.message, conversationId: variables.conversationId };
    },
    onSuccess: (response: any, variables: { conversationId?: number; otherUserId?: string; message: string; clientTempId?: number }, context: { previousMessages?: Message[]; clientTempId?: number; messageText?: string; conversationId?: number } | undefined) => {
      console.log('Message sent successfully:', response); // Debug log

      // Add the server message to ensure it persists
      if (selectedConversation && response?.message) {
        queryClient.setQueryData<Message[]>(
          ['/api/simple-chat/messages', selectedConversation],
          (oldMessages = []) => {
            // Remove any duplicates and add server message
            const filteredMessages = oldMessages.filter(msg => 
              !(msg.message === variables.message && msg.senderId === user?.id && 
                Math.abs(new Date(msg.createdAt).getTime() - Date.now()) < 10000)
            );
            return [...filteredMessages, response.message];
          }
        );
      }

      // Refresh conversations list WITHOUT invalidating messages
      queryClient.invalidateQueries({ queryKey: ['/api/simple-chat/conversations'] });

      // For new conversations
      if (response?.conversationId && !selectedConversation) {
        setSelectedConversation(response.conversationId);
        setView('chat');
      }
    },
    onError: (error: unknown, variables: { conversationId?: number; otherUserId?: string; message: string; clientTempId?: number }, context: { previousMessages?: Message[]; clientTempId?: number } | undefined) => {
      console.error('Failed to send message:', error); // Debug log

      // Rollback to the previous value
      if (context?.previousMessages && selectedConversation) {
        queryClient.setQueryData<Message[]>(
          ['/api/simple-chat/messages', selectedConversation],
          context.previousMessages
        );
      }
    },
    onSettled: () => {
      // DON'T invalidate messages here - it causes the message to disappear!
    }
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/simple-chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simple-chat/conversations'] });
    },
  });

  // Auto-scroll to bottom of messages or when send mutation state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMessageMutation.isPending]);

  // Ensure user's just-typed message appears immediately in UI even before mutation starts
  // by inserting an optimistic bubble synchronously when pressing Enter/Send.

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  // Handle URL parameters - initiate chat with specific user
  useEffect(() => {
    if (!user?.id || !targetUserId || !allUsers.length) return;

    console.log('Processing URL target user:', targetUserId);
    
    // Find the target user
    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (targetUser) {
      console.log('Found target user:', targetUser);
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => conv.otherUserId === targetUserId);
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        setSelectedConversation(existingConversation.id);
        setView('chat');
      } else {
        console.log('No existing conversation, starting new one');
        // Start new conversation
        setSelectedUser(targetUser);
        setView('chat');
      }
    } else {
      console.log('Target user not found in allUsers');
    }
  }, [user?.id, targetUserId, allUsers, conversations]);

  // Handle preload for applicant chat (from job application context)
  useEffect(() => {
    if (!user?.id || !preloadApplicantId || !allUsers.length) return;

    const applicantUser = allUsers.find(u => u.id === preloadApplicantId);
    if (applicantUser) {
      const existingConversation = conversations.find(conv => conv.otherUserId === preloadApplicantId);
      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
        setView('chat');
      } else {
        setSelectedUser(applicantUser);
        setView('chat');
      }
    }
  }, [user?.id, preloadApplicantId, allUsers, conversations]);

  const handleSendMessage = () => {
    const messageToSend = newMessage.trim();
    if (!messageToSend) return;

    const clientTempId = Date.now();

    // Clear input FIRST for instant feedback
    setNewMessage('');

    // Kick off mutation - optimistic update is handled in onMutate
    if (selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        message: messageToSend,
        clientTempId
      });
    } else if (selectedUser) {
      sendMessageMutation.mutate({
        otherUserId: selectedUser.id,
        message: messageToSend,
        clientTempId
      });
    }
  };

  const startNewConversation = (user: ChatUser) => {
    setSelectedUser(user);
    setSelectedConversation(null);
    setView('chat');
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    setView('chat');
  };

  const goBack = () => {
    if (view === 'chat') {
      setView('conversations');
      setSelectedConversation(null);
      setSelectedUser(null);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p>Please log in to access chat.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Conversations or Users List */}
      {view !== 'chat' && (
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2 mb-4">
              <Button
                variant={view === 'conversations' ? 'default' : 'ghost'}
                onClick={() => setView('conversations')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chats
              </Button>
              <Button
                variant={view === 'users' ? 'default' : 'ghost'}
                onClick={() => setView('users')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                People
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={view === 'conversations' ? 'Search conversations...' : 'Search people...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            {view === 'conversations' && (
              <div className="p-2">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No conversations yet. Start chatting with someone!'}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-2"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(conversation.otherUserName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {conversation.otherUserName}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessagePreview || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {view === 'users' && (
              <div className="p-2">
                {usersLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading people...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No people found' : 'No other users available'}
                  </div>
                ) : (
                  filteredUsers.map((chatUser) => (
                    <div
                      key={chatUser.id}
                      onClick={() => startNewConversation(chatUser)}
                      className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-2"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-green-600 text-white">
                            {getInitials(chatUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{chatUser.name}</p>
                          <p className="text-xs text-gray-500">{chatUser.email}</p>
                          {chatUser.companyName && (
                            <p className="text-xs text-gray-400">{chatUser.companyName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      {view === 'chat' && (selectedConversation || selectedUser) && (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {selectedUser 
                    ? getInitials(selectedUser.name)
                    : getInitials(conversations.find(c => c.id === selectedConversation)?.otherUserName || '')
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {selectedUser?.name || conversations.find(c => c.id === selectedConversation)?.otherUserName}
                </h2>
                <p className="text-sm text-gray-500">
                  {isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-gray-50">
            {messagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                  {/* Debug info */}
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Conversation ID: {selectedConversation}</p>
                    <p>Messages array length: {messages.length}</p>
                    <p>Messages loading: {messagesLoading ? 'Yes' : 'No'}</p>
                    <p>Query enabled: {!!selectedConversation ? 'Yes' : 'No'}</p>
                    {messagesError && <p className="text-red-500">Error: {String(messagesError)}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Default View - Welcome */}
      {view === 'conversations' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Simple Chat
            </h2>
            <p className="text-gray-500 mb-4">
              Connect with job seekers and recruiters instantly
            </p>
            <Button onClick={() => setView('users')}>
              <Users className="h-4 w-4 mr-2" />
              Find People to Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}