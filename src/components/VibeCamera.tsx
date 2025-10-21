import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VibeCameraProps {
  onCapture: (imageData: string) => void;
}

export const VibeCamera = ({ onCapture }: VibeCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const { toast } = useToast();

  const getStreamWithFallbacks = async (mode: "user" | "environment"): Promise<MediaStream | null> => {
    // Try with high quality settings but no aspect ratio forcing
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      return stream;
    } catch (error) {
      console.warn("Failed with ideal resolution:", error);
    }

    // Try with just facingMode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: mode } }
      });
      return stream;
    } catch (error) {
      console.warn("Failed with facingMode:", error);
    }

    // Final fallback - any camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      });
      return stream;
    } catch (error) {
      console.error("All camera attempts failed:", error);
      return null;
    }
  };

  const startCamera = async () => {
    setShowPermissionPrompt(false);
    
    try {
      const stream = await getStreamWithFallbacks(facingMode);
      
      if (!stream || !videoRef.current) {
        throw new Error("Failed to get camera stream");
      }

      videoRef.current.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });

      await videoRef.current.play();
      setIsStreaming(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      setShowPermissionPrompt(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const flipCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(() => startCamera(), 100);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
          title: "Please wait",
          description: "Camera is still loading...",
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        // Flip the image for front camera
        if (facingMode === "user") {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.95);
        
        stopCamera();
        onCapture(imageData);
      }
    }
  };

  if (showPermissionPrompt) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Camera Access</h2>
            <p className="text-muted-foreground">
              We need access to your camera to capture your vibe check photo
            </p>
          </div>
          <Button
            onClick={startCamera}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 transition-opacity w-full"
          >
            Allow Camera Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ 
      position: 'fixed',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full"
          style={{ 
            objectFit: 'cover',
            transform: facingMode === "user" ? "scaleX(-1)" : "none"
          }}
        />
      </div>
      
      {isStreaming && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 safe-top">
            <div className="flex justify-between items-center p-4">
              <div className="w-10" /> {/* Spacer for symmetry */}
              <Button
                onClick={flipCamera}
                size="icon"
                variant="ghost"
                className="bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white border-none rounded-full"
              >
                <RefreshCw className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Bottom capture area */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 safe-bottom">
            <div className="flex justify-center items-center">
              <button
                onClick={capturePhoto}
                className="relative w-20 h-20 rounded-full border-[6px] border-white bg-transparent hover:scale-95 transition-transform active:scale-90"
                aria-label="Capture photo"
              >
                <div className="absolute inset-2 rounded-full bg-white"></div>
              </button>
            </div>
          </div>
        </>
      )}

      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
            <p className="text-xl text-white">Starting camera...</p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
