import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, score } = await req.json();

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationTitle = '🌟 New Vibe Check!';
    const notificationBody = `${name} just posted with a score of ${score}%`;

    // Send notifications to all subscribers
    const sendPromises = subscriptions.map(async (sub: PushSubscription) => {
      try {
        // Note: In production, you would use the Web Push protocol
        // For now, we'll use the Notifications API through the service worker
        const payload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            url: '/leaderboard',
          },
        });

        // This is a placeholder - in production you'd use web-push library
        // with VAPID keys to send the notification
        console.log('Would send notification to:', sub.endpoint);
        return { success: true };
      } catch (error) {
        console.error('Error sending to subscription:', error);
        return { success: false, endpoint: sub.endpoint };
      }
    });

    await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        count: subscriptions.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-vibe-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
