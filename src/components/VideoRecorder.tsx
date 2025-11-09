import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, Circle, Square } from 'lucide-react';

export function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Live Camera Demo (for demonstration)</p>
          {isRecording && (
            <div className="flex items-center gap-2 text-critical animate-pulse">
              <Circle className="h-3 w-3 fill-critical" />
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {isCameraActive ? (
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              {isRecording && (
                <div className="absolute top-2 right-2 bg-critical text-critical-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-current animate-pulse" />
                  REC
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="sm"
                  className="flex-1"
                  variant="default"
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="sm"
                  className="flex-1"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              <Button
                onClick={stopCamera}
                size="sm"
                variant="outline"
              >
                <VideoOff className="h-4 w-4 mr-2" />
                Close Camera
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={startCamera}
            size="sm"
            className="w-full"
            variant="outline"
          >
            <Video className="h-4 w-4 mr-2" />
            Activate Camera
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          {isCameraActive 
            ? "Camera is active. This demonstrates real-time video capability." 
            : "Click to demonstrate live video assessment capability"}
        </p>
      </CardContent>
    </Card>
  );
}
