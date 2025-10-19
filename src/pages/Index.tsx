import { useState, useEffect } from "react";
import vibeBotImage from "@/assets/vibe-bot.png";
import { VibeCamera } from "@/components/VibeCamera";
import { VibeScore } from "@/components/VibeScore";
import { Leaderboard } from "@/components/Leaderboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Screen = "welcome" | "camera" | "score" | "leaderboard";

interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: string;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [vibeAnalysis, setVibeAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load leaderboard from database on mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
      return;
    }

    if (data) {
      const entries: LeaderboardEntry[] = data.map((entry) => ({
        name: entry.name,
        score: entry.score,
        timestamp: entry.created_at,
      }));
      setLeaderboard(entries);
    }
  };

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setIsAnalyzing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-vibe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze vibe");
      }

      const data = await response.json();
      setVibeScore(data.score);
      setVibeAnalysis(data.analysis);
      setScreen("score");
    } catch (error) {
      console.error("Error analyzing vibe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze vibe. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitToLeaderboard = async (name: string) => {
    const { error } = await supabase
      .from("leaderboard")
      .insert({
        name,
        score: vibeScore,
        vibe_analysis: vibeAnalysis,
      });

    if (error) {
      console.error("Error adding to leaderboard:", error);
      toast.error("Failed to add to leaderboard");
      return;
    }

    toast.success("Added to leaderboard!");
    await loadLeaderboard();
    setScreen("leaderboard");
  };

  const handleRetry = () => {
    setScreen("camera");
    setCapturedImage(null);
    setVibeScore(0);
    setVibeAnalysis("");
  };

  const handleBackToStart = () => {
    setScreen("welcome");
    setCapturedImage(null);
    setVibeScore(0);
    setVibeAnalysis("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl animate-pulse-glow" />
      
      <div className="relative z-10 w-full max-w-2xl">
        {screen === "welcome" && (
          <div className="flex flex-col items-center gap-8 animate-scale-in">
            <img
              src={vibeBotImage}
              alt="Vibe Check Bot"
              className="w-64 h-64 rounded-full object-cover border-4 border-primary shadow-glow animate-pulse-glow"
            />
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Vibe Check
              </h1>
              <p className="text-2xl text-foreground/80">
                Let me get your Vibe Check
              </p>
            </div>
            <button
              onClick={() => setScreen("camera")}
              className="text-xl px-8 py-4 bg-gradient-primary hover:opacity-90 transition-all rounded-full font-semibold text-primary-foreground shadow-strong hover:shadow-glow hover:scale-105"
            >
              Start Vibe Check
            </button>
          </div>
        )}

        {screen === "camera" && (
          <div className="animate-slide-up">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-6">
                <img
                  src={vibeBotImage}
                  alt="Analyzing"
                  className="w-48 h-48 rounded-full object-cover border-4 border-primary animate-pulse-glow"
                />
                <p className="text-2xl text-foreground/80 animate-pulse">
                  Analyzing your vibe...
                </p>
              </div>
            ) : (
              <VibeCamera onCapture={handleCapture} />
            )}
          </div>
        )}

        {screen === "score" && (
          <VibeScore
            score={vibeScore}
            analysis={vibeAnalysis}
            onSubmit={handleSubmitToLeaderboard}
            onRetry={handleRetry}
          />
        )}

        {screen === "leaderboard" && (
          <Leaderboard entries={leaderboard} onBackToStart={handleBackToStart} />
        )}
      </div>
    </div>
  );
};

export default Index;
