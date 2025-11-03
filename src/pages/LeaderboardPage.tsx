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
}

export type ViewMode = "recent" | "alltime";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("recent");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
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
          };
          
          setLeaderboard(prev => [newEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFilter, viewMode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    let query = supabase
      .from("leaderboard")
      .select("*")
      .limit(100);
    
    // Apply date filter if set (only for all-time view)
    if (dateFilter && viewMode === "alltime") {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
