import { useRef, useState } from "react";
import vibeBotImage from "@/assets/vibe-bot.png";
import { VibeCamera } from "@/components/VibeCamera";
import { VibeScore } from "@/components/VibeScore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { playTap, playSuccess } from "@/lib/sfx";

type Screen = "welcome" | "camera" | "score";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [vibeAnalysis, setVibeAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const tapsRef = useRef<number[]>([]);

  const handleSecretTap = () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current, now].filter((t) => now - t < 2000);
    if (tapsRef.current.length >= 4) {
      tapsRef.current = [];
      playTap();
      toast.success("🌿 Snoop mode unlocked");
      setTimeout(() => navigate("/high"), 400);
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
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitToLeaderboard = async (name: string) => {
    try {
      let imageUrl: string | null = null;

      // Upload the photo to Supabase storage
      if (capturedImage) {
        try {
          const base64Data = capturedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vibe-photos')
            .upload(fileName, blob);

          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('vibe-photos')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        } catch (error) {
          console.error("Error processing photo:", error);
        }
      }

      const { error } = await supabase
        .from("leaderboard")
        .insert({
          name,
          score: vibeScore,
          vibe_analysis: vibeAnalysis,
          image_url: imageUrl,
        });

      if (error) {
        console.error("Error adding to leaderboard:", error);
        toast.error("Failed to add to leaderboard");
        return;
      }

      // Send push notifications to all subscribers
      // Notifications are handled via realtime subscription on the leaderboard page

      playSuccess();
      toast.success("Added to leaderboard!");
      navigate("/leaderboard");
    } catch (error) {
      console.error("Error in handleSubmitToLeaderboard:", error);
      toast.error("Failed to submit to leaderboard");
    }
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
              onClick={handleSecretTap}
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
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { playTap(); setScreen("camera"); }}
                className="text-xl px-8 py-4 bg-gradient-primary hover:opacity-90 transition-all rounded-full font-semibold text-primary-foreground shadow-strong hover:shadow-glow hover:scale-105"
              >
                Start Vibe Check
              </button>
              <button
                onClick={() => { playTap(); navigate("/leaderboard"); }}
                className="text-lg px-6 py-3 bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all rounded-full font-semibold text-foreground hover:scale-105"
              >
                View Leaderboard
              </button>
            </div>
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
            imageUrl={capturedImage}
            onSubmit={handleSubmitToLeaderboard}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
