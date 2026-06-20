import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { VibeCamera } from "@/components/VibeCamera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import snoopImage from "@/assets/snoop.png";
import { playScoreSound, playTap, playSuccess } from "@/lib/sfx";

type Screen = "intro" | "camera" | "result";

interface HighResult {
  highness: number;
  substance: string;
  dosage: string;
  snoop_quote: string;
  eye_analysis: string;
}

interface HighCheckRow {
  id: string;
  name: string;
  score: number;
  state: string | null;
  dosage: string | null;
  snoop_quote: string | null;
  image_url: string | null;
  created_at: string;
}

const SHARE_URL = "https://vibe-check-with-a.lovable.app/high";
const OG_IMAGE = `${SHARE_URL.replace(/\/high$/, "")}/og-high.jpg`;

const HighPage = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("intro");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<HighResult | null>(null);

  const handleCapture = async (imageData: string) => {
    setImageUrl(imageData);
    setAnalyzing(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-high`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Snoop couldn't tell, try again");
      }
      const data = (await res.json()) as HighResult;
      setResult(data);
      setScreen("result");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Analysis failed");
      setImageUrl(null);
      setScreen("intro");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-green-950 relative">
      <Helmet>
        <title>How High R U? — Snoop checks your vibe</title>
        <meta
          name="description"
          content="Snap a selfie and let Snoop tell you what state you're in — caffeinated, sober, lifted, or somewhere in between."
        />
        <link rel="canonical" href={SHARE_URL} />
        <meta property="og:title" content="How High R U? — Snoop checks your vibe" />
        <meta property="og:description" content="Snoop reads your eyes and rates your current state. Fo shizzle." />
        <meta property="og:url" content={SHARE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How High R U? — Snoop checks your vibe" />
        <meta name="twitter:description" content="Snoop reads your eyes and rates your state. Fo shizzle." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl bg-gradient-to-tr from-green-500 via-purple-500 to-emerald-400 animate-pulse-glow" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        {screen === "intro" && !analyzing && (
          <>
            <IntroScreen
              onStart={() => {
                playTap();
                setScreen("camera");
              }}
              onBack={() => {
                playTap();
                navigate("/");
              }}
            />
            <HighLeaderboard />
          </>
        )}

        {screen === "camera" && !analyzing && (
          <VibeCamera onCapture={handleCapture} />
        )}

        {analyzing && <AnalyzingScreen />}

        {screen === "result" && result && imageUrl && (
          <ResultScreen
            result={result}
            imageUrl={imageUrl}
            onRetry={() => {
              setResult(null);
              setImageUrl(null);
              setScreen("camera");
            }}
            onDone={() => {
              setResult(null);
              setImageUrl(null);
              setScreen("intro");
            }}
          />
        )}
      </div>
    </div>
  );
};

const IntroScreen = ({ onStart, onBack }: { onStart: () => void; onBack: () => void }) => (
  <div className="flex flex-col items-center gap-6 text-center animate-scale-in pt-4">
    <img
      src={snoopImage}
      alt="Snoop"
      width={1024}
      height={1024}
      loading="lazy"
      className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-4 border-green-400 shadow-[0_0_60px_rgba(74,222,128,0.6)]"
    />
    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-purple-300 bg-clip-text text-transparent">
      How High R U?
    </h1>
    <p className="text-lg text-green-100/90 max-w-md">
      Snoop peeps your eyes and tells you what state you're in — caffeinated, sober, lifted, hungover, whatever the vibe says. Strictly for laughs.
    </p>
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <Button
        onClick={onStart}
        className="text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white rounded-full font-bold shadow-lg"
      >
        🌿 Let Snoop Check
      </Button>
      <Button
        onClick={onBack}
        variant="ghost"
        className="text-green-200/70 hover:text-white"
      >
        Nah, take me back
      </Button>
    </div>
  </div>
);

const PHRASES = [
  "Snoop is peepin' them eyes...",
  "Readin' the vibe...",
  "Consultin' the homies...",
  "Calculatin' dosage...",
];

const AnalyzingScreen = () => {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % PHRASES.length;
      setPhrase(PHRASES[i]);
    }, 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-6 text-center py-16">
      <img
        src={snoopImage}
        alt="Snoop analyzing"
        width={1024}
        height={1024}
        loading="lazy"
        className="w-48 h-48 rounded-full object-cover border-4 border-green-400 animate-pulse-glow"
      />
      <p className="text-2xl text-green-100 animate-pulse">{phrase}</p>
    </div>
  );
};

const ResultScreen = ({
  result,
  imageUrl,
  onRetry,
  onDone,
}: {
  result: HighResult;
  imageUrl: string;
  onRetry: () => void;
  onDone: () => void;
}) => {
  const [display, setDisplay] = useState(0);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    playScoreSound(result.highness);
    const steps = 60;
    const inc = result.highness / steps;
    let s = 0;
    const id = setInterval(() => {
      s++;
      setDisplay(Math.min(Math.round(inc * s), result.highness));
      if (s >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [result.highness]);

  const level =
    result.highness >= 85 ? "🚀 MAX VIBES"
    : result.highness >= 65 ? "🌿 LIT"
    : result.highness >= 40 ? "😎 CRUISING"
    : result.highness >= 15 ? "🍵 MELLOW"
    : "👶 FACTORY SETTINGS";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      let uploadedUrl: string | null = null;
      const base64 = imageUrl.split(",")[1];
      if (base64) {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const fileName = `high-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { data: up, error: upErr } = await supabase.storage
          .from("vibe-photos")
          .upload(fileName, blob);
        if (!upErr && up) {
          uploadedUrl = supabase.storage.from("vibe-photos").getPublicUrl(fileName).data.publicUrl;
        }
      }
      const { error } = await supabase.from("high_checks").insert({
        name: name.trim(),
        score: result.highness,
        state: result.substance,
        dosage: result.dosage,
        snoop_quote: result.snoop_quote,
        eye_analysis: result.eye_analysis,
        image_url: uploadedUrl,
      });
      if (error) throw error;
      playSuccess();
      toast.success("Posted to the High Board");
      setSubmitted(true);
      setTimeout(onDone, 800);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't post, try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 animate-slide-up pt-4">
      <div className="relative w-full max-w-sm">
        <img
          src={imageUrl}
          alt="You"
          className="w-full aspect-square object-cover rounded-2xl border-2 border-green-400/50"
        />
        <img
          src={snoopImage}
          alt="Snoop reacting"
          width={1024}
          height={1024}
          loading="lazy"
          className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full border-4 border-green-400 object-cover animate-scale-in shadow-[0_0_30px_rgba(74,222,128,0.8)]"
        />
      </div>

      <div className="text-center mt-4">
        <p className="text-sm uppercase tracking-widest text-green-300">Intensity</p>
        <h2 className="text-7xl font-bold bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent animate-pulse-glow">
          {display}%
        </h2>
        <p className="text-xl font-bold text-green-200 mt-1">{level}</p>
      </div>

      <div className="w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30 space-y-3">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-green-400/70">State</p>
            <p className="text-lg font-bold text-white">{result.substance}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-green-400/70">Dosage</p>
            <p className="text-lg font-bold text-white">{result.dosage}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-green-500/20">
          <p className="text-xs uppercase text-green-400/70 mb-1">Eye Read</p>
          <p className="text-sm text-green-100/90">{result.eye_analysis}</p>
        </div>
        <div className="pt-3 border-t border-green-500/20">
          <p className="text-xs uppercase text-green-400/70 mb-1">Snoop says</p>
          <p className="text-base italic text-white">"{result.snoop_quote}"</p>
        </div>
      </div>

      {!submitted && (
        <form onSubmit={submit} className="w-full max-w-md space-y-3">
          <Input
            type="text"
            placeholder="Your name for the High Board"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="bg-black/40 border-green-500/30 text-white placeholder:text-green-200/40 text-center"
          />
          <div className="flex gap-3">
            <Button type="button" onClick={() => { playTap(); onRetry(); }} variant="outline" className="flex-1 border-green-500/40 text-green-100 hover:bg-green-500/10">
              Run It Back
            </Button>
            <Button type="submit" disabled={!name.trim() || submitting} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              {submitting ? "Posting..." : "Post to High Board"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const HighLeaderboard = () => {
  const [rows, setRows] = useState<HighCheckRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("high_checks")
        .select("id,name,score,state,dosage,snoop_quote,image_url,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (active && !error) setRows((data ?? []) as HighCheckRow[]);
    })();

    const ch = supabase
      .channel("high-checks-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "high_checks" }, (payload) => {
        setRows((prev) => [payload.new as HighCheckRow, ...(prev ?? [])].slice(0, 50));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="text-2xl font-bold text-green-200">🌿 High Board</h2>
        <p className="text-xs uppercase tracking-widest text-green-400/60">Live feed</p>
      </div>
      {!rows && <p className="text-green-300/60 text-center py-8">Loading the homies...</p>}
      {rows && rows.length === 0 && (
        <p className="text-green-300/60 text-center py-8">No checks yet. Be the first, nephew.</p>
      )}
      <ul className="space-y-3">
        {rows?.map((r) => (
          <li key={r.id} className="flex gap-3 items-center bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-green-500/20">
            {r.image_url ? (
              <img src={r.image_url} alt={r.name} loading="lazy" className="w-14 h-14 rounded-lg object-cover border border-green-400/30" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-green-900/40 flex items-center justify-center text-2xl">🌿</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-white truncate">{r.name}</p>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">
                  {Math.round(Number(r.score))}%
                </span>
              </div>
              <p className="text-xs uppercase text-green-400/70 truncate">{r.state ?? "unknown vibe"} · {r.dosage ?? ""}</p>
              {r.snoop_quote && (
                <p className="text-xs text-green-100/70 italic truncate">"{r.snoop_quote}"</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default HighPage;