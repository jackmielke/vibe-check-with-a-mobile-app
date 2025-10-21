import { useState, useEffect } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: string;
  imageUrl?: string;
  vibeAnalysis?: string;
}

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
      setLoading(false);
      return;
    }

    if (data) {
      const entries: LeaderboardEntry[] = data.map((entry) => ({
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
          <Leaderboard entries={leaderboard} loading={loading} onBackToStart={handleBackToStart} />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
