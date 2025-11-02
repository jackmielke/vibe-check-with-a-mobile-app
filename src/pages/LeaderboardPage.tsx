import { useState, useEffect } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: string;
  imageUrl?: string;
  vibeAnalysis?: string;
  photoSource?: 'camera' | 'upload';
}

export type TimeFilter = "today" | "week" | "month" | "all";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();

    // Listen for new leaderboard entries
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard'
        },
        (payload) => {
          console.log('New vibe check posted:', payload);
          
          // Add the new entry to the leaderboard
          const newEntry: LeaderboardEntry = {
            id: payload.new.id,
            name: payload.new.name,
            score: payload.new.score,
            timestamp: payload.new.created_at,
            imageUrl: payload.new.image_url || undefined,
            vibeAnalysis: payload.new.vibe_analysis || undefined,
            photoSource: (payload.new.photo_source === 'camera' || payload.new.photo_source === 'upload') 
              ? payload.new.photo_source 
              : undefined,
          };
          
          setLeaderboard(prev => [newEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    const now = new Date();
    let dateFilter: Date | null = null;
    
    switch (timeFilter) {
      case "today":
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }
    
    let query = supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (dateFilter) {
      query = query.gte("created_at", dateFilter.toISOString());
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
      setLoading(false);
      return;
    }

    if (data) {
      const entries: LeaderboardEntry[] = data.map((entry) => ({
        id: entry.id,
        name: entry.name,
        score: entry.score,
        timestamp: entry.created_at,
        imageUrl: entry.image_url || undefined,
        vibeAnalysis: entry.vibe_analysis || undefined,
        photoSource: (entry.photo_source === 'camera' || entry.photo_source === 'upload') 
          ? entry.photo_source 
          : undefined,
      }));
      setLeaderboard(entries);
    }
    setLoading(false);
  };

  const handleBackToStart = () => {
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl animate-pulse-glow pointer-events-none" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <Leaderboard 
            entries={leaderboard} 
            loading={loading} 
            onBackToStart={handleBackToStart}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
