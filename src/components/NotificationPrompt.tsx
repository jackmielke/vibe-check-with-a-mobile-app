import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export function NotificationPrompt() {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if notifications are supported, not subscribed, and permission not denied
    if (isSupported && !isSubscribed && permission !== 'denied') {
      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    }
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Notifications enabled! You\'ll get alerts for new vibe checks.');
      setShowPrompt(false);
      localStorage.setItem('notification-prompt-seen', 'true');
    } else {
      toast.error('Failed to enable notifications. Please check your browser settings.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 
      bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-sm
      border border-purple-500/30 rounded-lg p-4 shadow-xl animate-in slide-in-from-bottom-5">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <Bell className="w-5 h-5 text-purple-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">Stay in the loop!</h3>
          <p className="text-white/80 text-sm mb-3">
            Get notified when new vibe checks are posted
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Enable
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
