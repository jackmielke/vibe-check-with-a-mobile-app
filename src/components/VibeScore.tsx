import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

interface VibeScoreProps {
  score: number;
  analysis: string;
  imageUrl: string | null;
  onSubmit: (name: string) => void;
  onRetry: () => void;
}

export const VibeScore = ({ score, analysis, imageUrl, onSubmit, onRetry }: VibeScoreProps) => {
  const [name, setName] = useState("");
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate the score counting up
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setDisplayScore(Math.min(Math.round(increment * currentStep), score));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getVibeEmoji = (score: number) => {
    if (score >= 90) return "🔥";
    if (score >= 75) return "✨";
    if (score >= 60) return "😎";
    if (score >= 40) return "😐";
    return "💀";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-slide-up">
      {imageUrl && (
        <div className="w-full max-w-md">
          <img
            src={imageUrl}
            alt="Your vibe check"
            className="w-full h-auto rounded-xl border-2 border-primary/30 shadow-glow"
          />
        </div>
      )}
      
      <div className="text-center space-y-2">
        <div className="text-8xl animate-scale-in">{getVibeEmoji(score)}</div>
        <div className="relative">
          <h2 className="text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-pulse-glow">
            {displayScore}
          </h2>
          <Sparkles className="absolute -top-2 -right-8 h-6 w-6 text-secondary animate-pulse" />
        </div>
        <p className="text-xl text-muted-foreground">Vibe Score</p>
      </div>

      <div className="w-full max-w-md bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
        <p className="text-foreground/90 text-center leading-relaxed">{analysis}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <Input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card/50 backdrop-blur-sm border-primary/20 text-lg text-center"
          maxLength={50}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onRetry}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            Try Again
          </Button>
          <Button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            Submit to Leaderboard
          </Button>
        </div>
      </form>
    </div>
  );
};
