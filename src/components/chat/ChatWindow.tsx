'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Send, User, Bot } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { api } from '~/utils/trpc';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ChatWindowProps {
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatWindow({ onClose, onMinimize }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'chatbot' | 'support'>('chatbot');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Chatbot conversation state
  const [chatbotMessages, setChatbotMessages] = useState<
    Array<{ role: 'user' | 'bot'; content: string; suggestions?: string[] }>
  >([
    {
      role: 'bot',
      content: "Hi! I'm here to help. What can I assist you with today?",
      suggestions: [
        'How to book a hotel?',
        'Payment methods',
        'Cancel booking',
        'Contact support',
      ],
    },
  ]);

  // Get user's chats
  const { data: myChats, refetch: refetchChats } = api.chat.getMyChats.useQuery(
    undefined,
    {
      enabled: !!session && mode === 'support',
    }
  );

  // Get current chat messages
  const { data: currentChat, refetch: refetchCurrentChat } = api.chat.getChatById.useQuery(
    { id: currentChatId! },
    {
      enabled: !!currentChatId,
      refetchInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  // Chatbot response query
  const chatbotQuery = api.support.getChatbotResponse.useQuery(
    { message },
    {
      enabled: false,
    }
  );

  // Create chat mutation
  const createChat = api.chat.createChat.useMutation({
    onSuccess: (data) => {
      setCurrentChatId(data.id);
      refetchChats();
      setMessage('');
    },
  });

  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchCurrentChat();
      setMessage('');
    },
  });

  // Mark messages as read
  const markAsRead = api.chat.markAsRead.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatbotMessages, currentChat]);

  useEffect(() => {
    if (currentChat && currentChatId) {
      markAsRead.mutate({ chatId: currentChatId });
    }
  }, [currentChat]);

  const handleSendChatbot = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setChatbotMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');

    // Get chatbot response
    const response = await chatbotQuery.refetch();
    if (response.data) {
      setChatbotMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: response.data.response,
          suggestions: response.data.suggestions,
        },
      ]);
    }
  };

  const handleSendSupport = () => {
    if (!message.trim() || !session) return;

    if (currentChatId) {
      sendMessage.mutate({
        chatId: currentChatId,
        content: message,
      });
    } else {
      createChat.mutate({
        message: message,
        subject: 'Support Request',
      });
    }
  };

  const handleSend = () => {
    if (mode === 'chatbot') {
      handleSendChatbot();
    } else {
      handleSendSupport();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleSendChatbot();
  };

  const switchToSupport = () => {
    if (!session) {
      alert('Please sign in to chat with support');
      return;
    }
    setMode('support');
  };

  return (
    <div className="flex h-[500px] w-[380px] flex-col rounded-lg bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg bg-blue-600 px-4 py-3 text-white">
        <div>
          <h3 className="font-semibold">
            {mode === 'chatbot' ? '🤖 Chat Assistant' : '💬 Support Chat'}
          </h3>
          <p className="text-xs opacity-90">
            {mode === 'chatbot' ? 'Instant answers' : 'Talk to our team'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onMinimize}
            className="rounded p-1 hover:bg-blue-700"
            aria-label="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-blue-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setMode('chatbot')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'chatbot'
              ? 'border-b-2 border-blue-600 bg-white text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🤖 Bot
        </button>
        <button
          onClick={switchToSupport}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'support'
              ? 'border-b-2 border-blue-600 bg-white text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          💬 Support
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'chatbot' ? (
          // Chatbot messages
          <div className="space-y-4">
            {chatbotMessages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex gap-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'bot' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-10">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : session ? (
          // Support chat messages
          <div className="space-y-4">
            {currentChat ? (
              currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.senderId === session.user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.senderId !== session.user.id && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      {msg.sender.image ? (
                        <img
                          src={msg.sender.image}
                          alt={msg.sender.name || 'Admin'}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.senderId === session.user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <p className="mb-4 text-sm text-gray-600">
                  Start a conversation with our support team
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Not signed in
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-600">
                Please sign in to chat with support
              </p>
              <Link href="/auth/signin">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {(mode === 'chatbot' || session) && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="sm"
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
