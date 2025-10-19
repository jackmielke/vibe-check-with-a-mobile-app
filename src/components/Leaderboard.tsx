import { Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: string;
  imageUrl?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBackToStart: () => void;
}

export const Leaderboard = ({ entries, onBackToStart }: LeaderboardProps) => {
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-300" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-slide-up">
      <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Vibe Leaderboard
      </h2>

      <div className="w-full max-w-md space-y-3">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No vibes checked yet. Be the first!
          </div>
        ) : (
          sortedEntries.map((entry, index) => (
            <div
              key={`${entry.name}-${entry.timestamp}`}
              className="flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="w-12 flex justify-center">{getMedalIcon(index)}</div>
              {entry.imageUrl && (
                <img
                  src={entry.imageUrl}
                  alt={`${entry.name}'s vibe`}
                  className="w-16 h-16 rounded-lg object-cover border border-primary/20"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{entry.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{entry.score}</div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={onBackToStart}
        className="mt-4 bg-gradient-primary hover:opacity-90 transition-opacity"
        size="lg"
      >
        Check Another Vibe
      </Button>
    </div>
  );
};
