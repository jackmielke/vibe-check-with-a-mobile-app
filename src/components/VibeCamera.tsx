import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VibeCameraProps {
  onCapture: (imageData: string) => void;
}

export const VibeCamera = ({ onCapture }: VibeCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const getStreamWithFallbacks = async (mode: "user" | "environment"): Promise<MediaStream | null> => {
    // Attempt 1: Try with ideal constraints
    try {
      console.log("Attempting camera with facingMode:", mode);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      console.log("Camera opened successfully with facingMode");
      return stream;
    } catch (error) {
      console.warn("Failed with facingMode constraint:", error);
    }

    // Attempt 2: Try without facingMode
    try {
      console.log("Attempting camera without facingMode");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      });
      console.log("Camera opened successfully without facingMode");
      return stream;
    } catch (error) {
      console.warn("Failed with basic constraints:", error);
    }

    // Attempt 3: Try with device enumeration
    try {
      console.log("Attempting camera with device enumeration");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error("No video devices found");
      }

      // Try to find the right camera
      let targetDevice = videoDevices[0];
      if (mode === "environment") {
        targetDevice = videoDevices.find(d => d.label.toLowerCase().includes('back')) || videoDevices[videoDevices.length - 1];
      } else {
        targetDevice = videoDevices.find(d => d.label.toLowerCase().includes('front')) || videoDevices[0];
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: targetDevice.deviceId }
      });
      console.log("Camera opened with device:", targetDevice.label);
      return stream;
    } catch (error) {
      console.error("All camera attempts failed:", error);
      return null;
    }
  };

  const startCamera = async () => {
    setIsStarting(true);
    
    try {
      const stream = await getStreamWithFallbacks(facingMode);
      
      if (!stream || !videoRef.current) {
        throw new Error("Failed to get camera stream");
      }

      videoRef.current.srcObject = stream;
      
      // Wait for metadata to load
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              const { videoWidth, videoHeight } = videoRef.current;
              const tracks = stream.getVideoTracks();
              const settings = tracks[0]?.getSettings();
              setDebugInfo(`${videoWidth}x${videoHeight} | ${settings?.facingMode || 'unknown'} | ${tracks[0]?.label || 'unknown device'}`);
            }
            resolve();
          };
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
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setDebugInfo("");
  };

  const flipCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    // Wait a bit before starting new stream
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

      // Ensure video has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video dimensions not ready, waiting...");
        toast({
          title: "Please wait",
          description: "Camera is still loading...",
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        
        stopCamera();
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-md bg-card rounded-2xl overflow-hidden border-2 border-primary/20" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {!isStreaming && !isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Button
              onClick={startCamera}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Camera className="mr-2 h-5 w-5" />
              Open Camera
            </Button>
          </div>
        )}

        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Starting camera...</p>
            </div>
          </div>
        )}
        
        {isStreaming && (
          <>
            <Button
              onClick={capturePhoto}
              size="lg"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow z-10"
            >
              Capture Vibe
            </Button>
            
            <Button
              onClick={flipCamera}
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4 z-10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {debugInfo && (
              <div className="absolute top-4 left-4 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground z-10">
                {debugInfo}
              </div>
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
