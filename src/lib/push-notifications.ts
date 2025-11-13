/**
 * Push Notification Service
 * Firebase Cloud Messaging (FCM) integration for browser push notifications
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { app } from './firebase';

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Get messaging instance (browser only)
let messaging: ReturnType<typeof getMessaging> | null = null;

if (isBrowser) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isBrowser || !('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return null;
  }

  try {
    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return null;
      }
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for incoming messages when app is in foreground
 */
export function onMessageListener(callback: (payload: MessagePayload) => void) {
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
}

/**
 * Show browser notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (!isBrowser || !('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      ...options,
    });
  }
}

/**
 * Save FCM token to server (call this after getting token)
 */
export async function saveFCMTokenToServer(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, userId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return isBrowser && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isBrowser || !('Notification' in window)) {
    return null;
  }
  return Notification.permission;
}

/**
 * Example notification types
 */
export const NotificationTypes = {
  BOOKING_CONFIRMED: {
    title: '✅ Booking Confirmed',
    body: 'Your hotel booking has been confirmed!',
    icon: '/icons/booking-icon.png',
  },
  PAYMENT_SUCCESS: {
    title: '💳 Payment Successful',
    body: 'Your payment has been processed successfully.',
    icon: '/icons/payment-icon.png',
  },
  BOOKING_REMINDER: {
    title: '🔔 Check-in Reminder',
    body: 'Your check-in is tomorrow. Have a great stay!',
    icon: '/icons/reminder-icon.png',
  },
  REVIEW_REQUEST: {
    title: '⭐ Rate Your Stay',
    body: 'How was your experience? Leave a review!',
    icon: '/icons/review-icon.png',
  },
  SPECIAL_OFFER: {
    title: '🎉 Special Offer',
    body: 'Get 20% off on your next booking!',
    icon: '/icons/offer-icon.png',
  },
};
