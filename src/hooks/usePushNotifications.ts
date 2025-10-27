import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      const saved = localStorage.getItem('notifications-enabled');
      setIsSubscribed(saved === 'true' && Notification.permission === 'granted');
    }
  }, []);

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        return false;
      }

      localStorage.setItem('notifications-enabled', 'true');
      setIsSubscribed(true);
      
      // Show a test notification
      new Notification('🌟 Notifications Enabled!', {
        body: "You'll get notified when new vibe checks are posted",
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      localStorage.setItem('notifications-enabled', 'false');
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
  };
}
