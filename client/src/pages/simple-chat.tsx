import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle } from 'lucide-react';

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
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  createdAt: string;
}

export default function SimpleChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Parse URL parameter for target user
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('user');

  console.log('Chat page loaded with target user:', targetUserId);

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
      console.log('Creating conversation with:', otherUserId);
      return apiRequest('POST', '/api/chat/conversations', { otherUserId });
    },
    onSuccess: (data: any) => {
      console.log('Conversation created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      if (data?.id) {
        setSelectedConversation(data.id);
      } else if (data?.conversationId) {
        setSelectedConversation(data.conversationId);
      }
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    },
  });

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, { message: messageData.message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
  });

  // Handle direct user chat from URL parameter
  useEffect(() => {
    console.log('Effect triggered:', { targetUserId, user: user?.id, conversationsLoading, conversationsLength: conversations.length });
    
    if (targetUserId && user && !conversationsLoading) {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        (user.userType === 'recruiter' && conv.jobSeekerId === targetUserId) ||
        (user.userType === 'job_seeker' && conv.recruiterId === targetUserId)
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        setSelectedConversation(existingConversation.id);
      } else if (!createConversationMutation.isPending) {
        console.log('Creating new conversation...');
        createConversationMutation.mutate(targetUserId);
      }
    }
  }, [targetUserId, user, conversations, conversationsLoading]);

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

  if (!user) {
    return <div className="p-4">Please log in to access chat.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        Messages
      </h1>

      {targetUserId && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Starting conversation with user: {targetUserId}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsLoading ? (
              <p>Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-gray-500">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedConversation === conv.id 
                        ? 'bg-blue-100' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium">{getUserDisplayName(conv)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation 
                ? `Chat ${selectedConversation}` 
                : 'Select a conversation'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-64 overflow-y-auto border rounded p-3 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded max-w-xs ${
                          message.senderId === user.id
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-gray-200'
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a conversation to start messaging</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify({
              targetUserId,
              userId: user?.id,
              userType: user?.userType,
              conversationsCount: conversations.length,
              selectedConversation,
              messagesCount: messages.length,
              messages: messages.slice(0, 3), // Show first 3 messages
              messagesLoading,
              messagesError: messagesError?.message,
              createPending: createConversationMutation.isPending,
              createError: createConversationMutation.error?.message
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}