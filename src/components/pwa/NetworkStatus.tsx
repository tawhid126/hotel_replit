'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Handle online status
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      
      // Hide the "back online" message after 3 seconds
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    };

    // Handle offline status
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      // Keep offline message visible
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and status hasn't changed
  if (isOnline && !showStatus) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        showStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You are offline</span>
          </>
        )}
      </div>
    </div>
  );
}
