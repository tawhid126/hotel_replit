'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { ChatWindow } from './ChatWindow';
import { api } from '~/utils/trpc';
import { useSession } from 'next-auth/react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { data: session } = useSession();

  // Get unread count
  const { data: unreadCount } = api.chat.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 z-50 ${
            isMinimized ? 'hidden' : 'block'
          }`}
        >
          <ChatWindow onClose={closeChat} onMinimize={() => setIsMinimized(true)} />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
