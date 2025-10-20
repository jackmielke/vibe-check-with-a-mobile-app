import { Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import vibeBotImage from "@/assets/vibe-bot.png";

interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: string;
  imageUrl?: string;
  vibeAnalysis?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBackToStart: () => void;
}

export const Leaderboard = ({ entries, onBackToStart }: LeaderboardProps) => {
  const [selectedEntry, setSelectedEntry] = useState<{ imageUrl: string; name: string; score: number; analysis: string } | null>(null);
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-300" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  return (
    <>
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
                className="flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => entry.imageUrl && setSelectedEntry({
                  imageUrl: entry.imageUrl!,
                  name: entry.name,
                  score: entry.score,
                  analysis: entry.vibeAnalysis || "No analysis available"
                })}
              >
                <div className="w-12 flex justify-center">{getMedalIcon(index)}</div>
                {entry.imageUrl && (
                  <img
                    src={entry.imageUrl}
                    alt={`${entry.name}'s vibe`}
                    className="w-16 h-16 rounded-lg object-cover border border-primary/20"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{entry.name}</p>
                  {entry.vibeAnalysis && (
                    <p className="text-sm text-muted-foreground italic line-clamp-2">
                      "{entry.vibeAnalysis}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary shrink-0">{entry.score}</div>
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

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <div className="flex flex-col gap-4">
              <img
                src={selectedEntry.imageUrl}
                alt="Full size vibe check"
                className="w-full max-h-[50vh] object-contain rounded-lg"
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-foreground">{selectedEntry.name}</h3>
                  <span className="text-3xl font-bold text-primary">{selectedEntry.score}</span>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <img 
                      src={vibeBotImage} 
                      alt="Vibe Bot" 
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                    />
                    <p className="text-foreground/90 leading-relaxed flex-1">{selectedEntry.analysis}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
