'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Modal } from './Modal';
import { Button } from './Button';

interface IdleTimeoutProps {
  idleTimeMinutes?: number; // Idle time before warning (default: 25 minutes)
  warningTimeSeconds?: number; // Warning countdown duration (default: 5 minutes)
}

export function IdleTimeout({ 
  idleTimeMinutes = 25, 
  warningTimeSeconds = 300 // 5 minutes
}: IdleTimeoutProps) {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningTimeSeconds);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Reset activity timer
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
    setCountdown(warningTimeSeconds);
  }, [warningTimeSeconds]);

  // Track user activity
  useEffect(() => {
    if (!session) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, resetTimer]);

  // Check for idle timeout
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const idleTimeMs = idleTimeMinutes * 60 * 1000;

      if (timeSinceLastActivity >= idleTimeMs && !showWarning) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, lastActivity, idleTimeMinutes, showWarning]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time's up - auto logout
          signOut({ callbackUrl: '/auth/signin' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (!session || !showWarning) return null;

  return (
    <Modal isOpen={showWarning} onClose={handleStayLoggedIn} size="sm">
      <div className="p-6 text-center">
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <svg
            className="h-10 w-10 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Warning Message */}
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Session Expiring Soon
        </h2>
        <p className="mb-4 text-gray-600">
          You've been inactive for a while. Your session will expire in:
        </p>

        {/* Countdown Timer */}
        <div className="mb-6">
          <div className="text-5xl font-bold text-yellow-600">
            {formatTime(countdown)}
          </div>
          <p className="mt-2 text-sm text-gray-500">minutes remaining</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-yellow-500 transition-all duration-1000"
            style={{ width: `${(countdown / warningTimeSeconds) * 100}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            className="flex-1"
          >
            Stay Logged In
          </Button>
        </div>

        {/* Info Text */}
        <p className="mt-4 text-xs text-gray-500">
          Click anywhere or press any key to stay logged in
        </p>
      </div>
    </Modal>
  );
}
