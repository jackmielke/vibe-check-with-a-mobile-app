import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface VibeCameraProps {
  onCapture: (imageData: string) => void;
}

export const VibeCamera = ({ onCapture }: VibeCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly play the video - critical for mobile
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
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
      <div className="relative w-full max-w-md aspect-square bg-card rounded-2xl overflow-hidden border-2 border-primary/20">
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
              className="w-full h-full object-cover"
            />
            <Button
              onClick={capturePhoto}
              size="lg"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
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
