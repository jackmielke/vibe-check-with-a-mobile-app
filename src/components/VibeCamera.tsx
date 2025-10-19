import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCw } from "lucide-react";

interface VibeCameraProps {
  onCapture: (imageData: string) => void;
}

export const VibeCamera = ({ onCapture }: VibeCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isStarting, setIsStarting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const stopCurrentStream = () => {
    const vid = videoRef.current;
    const media = vid?.srcObject as MediaStream | null;
    media?.getTracks().forEach((t) => t.stop());
    if (vid) vid.srcObject = null;
  };

  const startCamera = async () => {
    setIsStarting(true);
    setDebugInfo(null);
    try {
      // Stop any previous stream
      stopCurrentStream();

      const tryConstraints = async (constraints: MediaStreamConstraints) => {
        return navigator.mediaDevices.getUserMedia(constraints);
      };

      let stream: MediaStream | null = null;
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { exact: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      ];

      for (const c of attempts) {
        try {
          stream = await tryConstraints(c);
          break;
        } catch (e) {
          console.warn("getUserMedia attempt failed", c, e);
        }
      }

      if (!stream) throw new Error("Could not access any camera");

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setDebugInfo(`${settings.width}x${settings.height} • ${settings.deviceId ? 'device set' : 'no id'} • facing=${facingMode}`);

      const video = videoRef.current!;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = async () => {
        try {
          await video.play();
          setIsStreaming(true);
          setIsStarting(false);
        } catch (err) {
          console.error('video.play() failed', err);
          setIsStarting(false);
        }
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions or try another browser.");
      setIsStarting(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        
        // Stop the stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
        setIsStreaming(false);
        
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-md bg-card rounded-2xl overflow-hidden border-2 border-primary/20" style={{ aspectRatio: '4/3' }}>
        {!isStreaming ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={startCamera}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Camera className="mr-2 h-5 w-5" />
              Open Camera
            </Button>
          </div>
        ) : (
          <> 
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
            />
            {/* Debug + Controls */}
            <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded bg-background/60 backdrop-blur border border-primary/30">
              {debugInfo ?? 'Starting camera...'}
            </div>
            <Button
              type="button"
              onClick={async () => {
                setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
                await startCamera();
              }}
              variant="outline"
              size="sm"
              className="absolute top-3 right-3 border-primary/40 bg-background/60 backdrop-blur"
            >
              <RotateCw className="h-4 w-4 mr-1" /> Flip
            </Button>
            <Button
              onClick={capturePhoto}
              size="lg"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow z-10"
            >
              Capture Vibe
            </Button>
          </>

        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
