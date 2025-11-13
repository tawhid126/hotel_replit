'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import {
  requestNotificationPermission,
  getFCMToken,
  onMessageListener,
  isNotificationSupported,
  getNotificationPermission,
  showNotification,
} from '~/lib/push-notifications';
import toast from 'react-hot-toast';
import type { MessagePayload } from 'firebase/messaging';

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setSupported(isNotificationSupported());
    
    // Get current permission
    setPermission(getNotificationPermission());

    // Set up foreground message listener
    const unsubscribe = onMessageListener((payload: MessagePayload) => {
      console.log('Received foreground message:', payload);
      
      // Show notification
      if (payload.notification) {
        showNotification(
          payload.notification.title || 'New Notification',
          {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icons/icon-192x192.png',
            data: payload.data,
          }
        );

        // Show toast
        toast.success(payload.notification.body || 'You have a new notification');
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleEnableNotifications = async () => {
    if (!supported) {
      toast.error('Notifications are not supported in your browser');
      return;
    }

    setLoading(true);

    try {
      // Request permission
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setPermission('granted');
        
        // Get FCM token
        const token = await getFCMToken();
        
        if (token) {
          setFcmToken(token);
          
          // TODO: Save token to database via tRPC
          // await saveFCMTokenToServer(token, userId);
          
          toast.success('Notifications enabled successfully!');
          
          // Show test notification
          showNotification('Notifications Enabled! 🎉', {
            body: 'You will now receive updates about your bookings.',
            icon: '/icons/icon-192x192.png',
          });
        } else {
          toast.error('Failed to get notification token');
        }
      } else {
        setPermission('denied');
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from StayComfort!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
    toast.success('Test notification sent!');
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔕</div>
            <p className="text-gray-600 mb-2">
              Push notifications are not supported in your browser
            </p>
            <p className="text-sm text-gray-500">
              Try using Chrome, Firefox, or Edge for the best experience
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Push Notifications</span>
          {permission === 'granted' && (
            <Badge className="bg-green-100 text-green-700">
              ✓ Enabled
            </Badge>
          )}
          {permission === 'denied' && (
            <Badge className="bg-red-100 text-red-700">
              ✗ Blocked
            </Badge>
          )}
          {permission === 'default' && (
            <Badge className="bg-gray-100 text-gray-700">
              Not Set
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <p className="text-gray-600">
            Get instant updates about your bookings, payments, and special offers directly in your
            browser.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">What you'll receive:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Booking confirmations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Payment receipts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Check-in reminders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Special offers and discounts</span>
            </li>
          </ul>
        </div>

        {/* Permission Status */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Status:</span>
            <span className="text-gray-600 capitalize">{permission || 'Unknown'}</span>
          </div>
          
          {fcmToken && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Device Token:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block overflow-x-auto">
                {fcmToken.slice(0, 50)}...
              </code>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {permission !== 'granted' && (
            <Button
              onClick={handleEnableNotifications}
              disabled={loading || permission === 'denied'}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enabling...
                </>
              ) : (
                <>
                  <span className="mr-2">🔔</span>
                  Enable Notifications
                </>
              )}
            </Button>
          )}

          {permission === 'granted' && (
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="flex-1"
            >
              <span className="mr-2">🧪</span>
              Send Test Notification
            </Button>
          )}
        </div>

        {/* Help Text */}
        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Notifications Blocked:</strong> You have blocked notifications for this site.
              To enable them, click the lock icon in your browser's address bar and allow
              notifications.
            </p>
          </div>
        )}

        {/* Browser Compatibility Note */}
        <div className="text-xs text-gray-500 mt-4">
          <p>
            <strong>Note:</strong> Push notifications work best on Chrome, Firefox, and Edge
            browsers. Safari support may be limited.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
