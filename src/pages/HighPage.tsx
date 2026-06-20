import { useState } from "react";
import { VibeCamera } from "@/components/VibeCamera";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import snoopImage from "@/assets/snoop.png";
import { playScoreSound, playTap } from "@/lib/sfx";
import { useEffect } from "react";

type Screen = "intro" | "camera" | "result";

interface HighResult {
  highness: number;
  substance: string;
  dosage: string;
  snoop_quote: string;
  eye_analysis: string;
}

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
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-green-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-tr from-green-500 via-purple-500 to-emerald-400 animate-pulse-glow" />

      <div className="relative z-10 w-full max-w-2xl">
        {screen === "intro" && !analyzing && (
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
            onHome={() => navigate("/")}
          />
        )}
      </div>
    </div>
  );
};

const IntroScreen = ({ onStart, onBack }: { onStart: () => void; onBack: () => void }) => (
  <div className="flex flex-col items-center gap-6 text-center animate-scale-in">
    <img
      src={snoopImage}
      alt="Snoop"
      width={1024}
      height={1024}
      loading="lazy"
      className="w-56 h-56 rounded-full object-cover border-4 border-green-400 shadow-[0_0_60px_rgba(74,222,128,0.6)]"
    />
    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-purple-300 bg-clip-text text-transparent">
      How High R U?
    </h1>
    <p className="text-lg text-green-100/90 max-w-md">
      Snoop's gonna peep your eyes and tell you what you're on, fo shizzle. Strictly for laughs, nephew.
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

const AnalyzingScreen = () => {
  const phrases = [
    "Snoop is peepin' them eyes...",
    "Analyzin' the redness...",
    "Consultin' the homies...",
    "Calculatin' dosage...",
  ];
  const [phrase, setPhrase] = useState(phrases[0]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % phrases.length;
      setPhrase(phrases[i]);
    }, 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-6 text-center">
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
  onHome,
}: {
  result: HighResult;
  imageUrl: string;
  onRetry: () => void;
  onHome: () => void;
}) => {
  const [display, setDisplay] = useState(0);
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
    result.highness >= 85
      ? "🚀 ASTRONAUT"
      : result.highness >= 65
      ? "🌿 ZOOTED"
      : result.highness >= 40
      ? "😎 LIFTED"
      : result.highness >= 15
      ? "🍵 BUZZED"
      : "👶 SOBER";

  return (
    <div className="flex flex-col items-center gap-5 animate-slide-up">
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
        <p className="text-sm uppercase tracking-widest text-green-300">Highness Level</p>
        <h2 className="text-7xl font-bold bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent animate-pulse-glow">
          {display}%
        </h2>
        <p className="text-xl font-bold text-green-200 mt-1">{level}</p>
      </div>

      <div className="w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30 space-y-3">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-green-400/70">Suspected</p>
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

      <div className="flex gap-3 w-full max-w-md">
        <Button onClick={() => { playTap(); onRetry(); }} variant="outline" className="flex-1 border-green-500/40 text-green-100 hover:bg-green-500/10">
          Run It Back
        </Button>
        <Button onClick={() => { playTap(); onHome(); }} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          Done
        </Button>
      </div>
    </div>
  );
};

export default HighPage;