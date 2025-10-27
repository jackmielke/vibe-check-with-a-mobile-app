import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function NotificationButton() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success('Notifications disabled');
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notifications enabled! You\'ll get alerts for new vibe checks.');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable them in your browser settings.');
      } else {
        toast.error('Failed to enable notifications. Please try again.');
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleToggle}
            variant="outline"
            size="icon"
            className="border-primary/30 hover:bg-primary/10"
          >
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSubscribed ? 'Disable notifications' : 'Enable notifications'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
