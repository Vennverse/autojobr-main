import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Clock, MessageCircle, User, Bot } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id?: number;
  sender: 'candidate' | 'interviewer';
  content: string;
  timestamp: string;
  messageIndex?: number;
}

interface InterviewState {
  sessionId: string;
  currentQuestionCount: number;
  totalQuestions: number;
  timeRemaining: number;
  status: string;
}

function ChatInterview() {
  const [, params] = useRoute('/chat-interview/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = params?.sessionId;

  console.log('🎭 ChatInterview component mounted with sessionId:', sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLocation('/virtual-interview-start');
      return;
    }
    loadMessages();
  }, [sessionId]);

  // Timer countdown effect
  useEffect(() => {
    if (!interview || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [interview, timeRemaining]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/chat-interview/${sessionId}/messages`, 'GET');
      
      setInterview({
        sessionId: sessionId!,
        currentQuestionCount: response.currentQuestionCount,
        totalQuestions: response.totalQuestions,
        timeRemaining: response.timeRemaining,
        status: response.status
      });
      
      setMessages(response.messages || []);
      setTimeRemaining(response.timeRemaining || 1800);

      // If interview is completed, redirect to completion
      if (response.status === 'completed') {
        setLocation(`/virtual-interview-complete/${sessionId}`);
      }

    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load interview chat",
        variant: "destructive",
      });
      setLocation('/virtual-interview-start');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !interview || sending) return;

    const messageToSend = currentMessage.trim();
    
    try {
      setSending(true);
      
      // Add user message to chat immediately for better UX
      const userMessage: ChatMessage = {
        sender: 'candidate',
        content: messageToSend,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');

      const response = await apiRequest(`/api/chat-interview/${sessionId}/message`, 'POST', {
        message: messageToSend
      });

      // Add AI interviewer response
      const aiMessage: ChatMessage = {
        sender: 'interviewer',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Update interview state
      setInterview(prev => prev ? {
        ...prev,
        currentQuestionCount: response.currentQuestionCount || prev.currentQuestionCount,
        timeRemaining: response.timeRemaining || prev.timeRemaining
      } : null);

      setTimeRemaining(response.timeRemaining || timeRemaining);

      // Check if interview is complete
      if (response.shouldEndInterview || response.isComplete) {
        setTimeout(() => {
          setLocation(`/virtual-interview-complete/${sessionId}`);
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      
      // Remove the user message we added optimistically
      setMessages(prev => prev.slice(0, -1));
      setCurrentMessage(messageToSend); // Restore the original message
    } finally {
      setSending(false);
    }
  };

  const handleTimeUp = async () => {
    toast({
      title: "Time's Up!",
      description: "Your interview time has expired.",
      variant: "default",
    });
    
    try {
      await apiRequest(`/api/chat-interview/${sessionId}/complete`, 'POST');
      setLocation(`/virtual-interview-complete/${sessionId}`);
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-center text-gray-600 dark:text-gray-400">
              Loading your interview chat...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                AI Interview Chat
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
                <div>
                  Question {interview?.currentQuestionCount || 0} of {interview?.totalQuestions || 5}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Messages */}
        <Card className="mb-4 h-96 overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.sender}-${index}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.sender === 'candidate' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'candidate' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.sender === 'candidate' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.sender === 'candidate'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'candidate' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response here... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[60px] resize-none"
                disabled={sending}
                data-testid="message-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || sending}
                className="self-end px-4 py-2"
                data-testid="send-button"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
              Interview Guidelines:
            </h4>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Answer questions based on your own knowledge and experience</li>
              <li>• The AI interviewer will not provide hints or answers</li>
              <li>• Be specific and provide examples when possible</li>
              <li>• You can ask for clarification about the question</li>
              <li>• The interview will progress automatically after each response</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ChatInterview;