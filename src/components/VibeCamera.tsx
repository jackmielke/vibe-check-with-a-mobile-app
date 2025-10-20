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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight }
        }
      });
      return stream;
    } catch (error) {
      console.warn("Failed with facingMode constraint:", error);
    }

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
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      />
      
      {isStreaming && (
        <>
          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-10">
            <div className="flex justify-between items-center">
              <Button
                onClick={flipCamera}
                size="icon"
                variant="ghost"
                className="bg-background/50 backdrop-blur-sm hover:bg-background/70"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Bottom capture button */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background/80 to-transparent z-10">
            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-primary-foreground bg-gradient-primary hover:scale-110 transition-transform shadow-glow flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary-foreground"></div>
              </button>
            </div>
          </div>
        </>
      )}

      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground">Starting camera...</p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
