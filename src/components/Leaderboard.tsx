import { Trophy, Medal, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import vibeBotImage from "@/assets/vibe-bot.png";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: string;
  imageUrl?: string;
  vibeAnalysis?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onBackToStart: () => void;
}

export const Leaderboard = ({ entries, loading, onBackToStart }: LeaderboardProps) => {
  const [selectedEntry, setSelectedEntry] = useState<{ imageUrl: string; name: string; score: number; analysis: string; entryId: string } | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; comment_text: string; commenter_name: string | null; created_at: string }>>([]);
  const [newComment, setNewComment] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-300" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  const loadComments = async (entryId: string) => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("leaderboard_entry_id", entryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading comments:", error);
      toast({ title: "Failed to load comments", variant: "destructive" });
    } else {
      setComments(data || []);
    }
    setLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedEntry) return;

    setSubmittingComment(true);
    const { error } = await supabase
      .from("comments")
      .insert({
        leaderboard_entry_id: selectedEntry.entryId,
        comment_text: newComment.trim(),
        commenter_name: commenterName.trim() || null,
      });

    if (error) {
      console.error("Error submitting comment:", error);
      toast({ title: "Failed to submit comment", variant: "destructive" });
    } else {
      toast({ title: "Comment added!" });
      setNewComment("");
      setCommenterName("");
      await loadComments(selectedEntry.entryId);
    }
    setSubmittingComment(false);
  };

  useEffect(() => {
    if (selectedEntry) {
      loadComments(selectedEntry.entryId);
    }
  }, [selectedEntry]);

  return (
    <>
      <div className="flex flex-col items-center gap-6 w-full animate-slide-up">
        <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Vibe Leaderboard
        </h2>

        <div className="w-full max-w-md space-y-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="w-12 h-8 rounded" />
              </div>
            ))
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No vibes checked yet. Be the first!
            </div>
          ) : (
            sortedEntries.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.timestamp}`}
                className="flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => {
                  if (entry.imageUrl) {
                    const leaderboardEntry = entries.find(e => e.name === entry.name && e.timestamp === entry.timestamp);
                    setSelectedEntry({
                      imageUrl: entry.imageUrl!,
                      name: entry.name,
                      score: entry.score,
                      analysis: entry.vibeAnalysis || "No analysis available",
                      entryId: leaderboardEntry?.id || ""
                    });
                  }
                }}
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
            <div className="flex flex-col gap-6">
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

              {/* Comments Section */}
              <div className="space-y-4 border-t border-primary/20 pt-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-semibold text-foreground">Comments</h4>
                </div>

                {/* Comment Form */}
                <div className="space-y-3 bg-card/30 rounded-lg p-4 border border-primary/10">
                  <div className="space-y-2">
                    <Label htmlFor="comment">Add a comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="Anonymous"
                      value={commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="w-full"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {loadingComments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-card/30 rounded-lg p-4 border border-primary/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {comment.commenter_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground/90">{comment.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
