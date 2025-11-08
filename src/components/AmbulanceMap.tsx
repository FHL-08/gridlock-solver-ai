import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Navigation, Clock, MapPin, Radio } from 'lucide-react';

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
  dispatchTime?: number;
}

export function AmbulanceMap({ patientName, eta, dispatchTime }: AmbulanceMapProps) {
  const [progress, setProgress] = useState(0);
  const [currentEta, setCurrentEta] = useState(eta);

  useEffect(() => {
    if (!dispatchTime) {
      // Fallback to simple animation if no dispatch time
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
        setCurrentEta((prev) => Math.max(prev - 0.1, 0));
      }, 500);
      return () => clearInterval(interval);
    }

    // Calculate progress based on elapsed time since dispatch
    const totalDuration = eta * 60 * 1000; // Convert minutes to milliseconds
    
    // Set initial state based on elapsed time
    const initialElapsed = Date.now() - dispatchTime;
    const initialProgress = Math.min((initialElapsed / totalDuration) * 100, 100);
    const initialRemainingMs = Math.max(totalDuration - initialElapsed, 0);
    const initialRemainingMinutes = Math.ceil(initialRemainingMs / 60000);
    
    setProgress(initialProgress);
    setCurrentEta(initialRemainingMinutes);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - dispatchTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      const remainingMs = Math.max(totalDuration - elapsed, 0);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      
      setProgress(newProgress);
      setCurrentEta(remainingMinutes);
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatchTime, eta]);

  // Calculate ambulance position along the route
  const ambulanceX = 10 + (progress * 0.8);
  const ambulanceY = 70 - (progress * 0.4);

  return (
    <Card className="overflow-hidden border-2 border-critical/20">
      <div className="relative w-full aspect-video bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Street grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: 0 }} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Map content */}
        <div className="absolute inset-0 p-4 md:p-6" style={{ zIndex: 1 }}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
            <defs>
              {/* Animated route gradient */}
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset={`${progress}%`} stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset={`${progress}%`} stopColor="hsl(var(--muted-foreground))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
              </linearGradient>
              
              {/* Glow filter for ambulance */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Route path */}
            <path
              d="M 50 300 Q 200 250, 300 220 Q 400 190, 500 160 Q 600 130, 700 100"
              stroke="url(#routeGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="15,10"
            />
            
            {/* Waypoint markers */}
            <circle cx="300" cy="220" r="6" fill="hsl(var(--primary))" opacity="0.6" />
            <circle cx="500" cy="160" r="6" fill="hsl(var(--primary))" opacity="0.6" />
          </svg>

          {/* Ambulance (moving) */}
          <div 
            className="absolute transition-all duration-500 ease-linear" 
            style={{ 
              left: `${ambulanceX}%`, 
              top: `${ambulanceY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-critical/30 rounded-full animate-ping" />
              <div className="absolute w-16 h-16 bg-critical/40 rounded-full animate-pulse" />
            </div>
            
            {/* Ambulance icon */}
            <div className="relative bg-critical text-critical-foreground rounded-full p-4 shadow-2xl border-4 border-critical-foreground/20">
              <Navigation className="h-8 w-8" style={{ transform: 'rotate(45deg)' }} />
              
              {/* Speed indicator */}
              <div className="absolute -top-2 -right-2 bg-background border-2 border-critical rounded-full p-1">
                <Radio className="h-3 w-3 text-critical animate-pulse" />
              </div>
            </div>
            
            {/* Patient label */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="bg-background/95 backdrop-blur-sm px-3 py-1 rounded-full border border-critical/30 shadow-lg">
                <p className="text-xs font-semibold text-foreground">{patientName}</p>
              </div>
            </div>
          </div>

          {/* Hospital (destination) */}
          <div className="absolute" style={{ right: '8%', top: '15%' }}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-success/20 rounded-full blur-xl w-16 h-16 -translate-x-1/4 -translate-y-1/4" />
              
              {/* Hospital icon */}
              <div className="relative bg-success text-success-foreground rounded-full p-5 shadow-2xl border-4 border-success-foreground/20">
                <MapPin className="h-9 w-9" />
              </div>
              
              {/* Hospital label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-success/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-success/40 shadow-lg">
                  <p className="text-sm font-bold text-success">City Hospital</p>
                  <p className="text-xs text-muted-foreground">Emergency Bay A</p>
                </div>
              </div>
            </div>
          </div>

          {/* Distance indicator */}
          <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-border shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Distance Remaining</p>
                <p className="text-lg font-bold text-foreground">{((100 - progress) * 0.045).toFixed(1)} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-transparent p-4 border-t border-border/50" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-critical/10 p-2 rounded-full">
                <Navigation className="h-5 w-5 text-critical animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-foreground">{patientName}</p>
                <p className="text-xs text-muted-foreground">Emergency Transport - Code Red</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-critical/10 rounded-lg">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-critical"></span>
                </div>
                <span className="text-xs font-semibold text-critical">LIVE</span>
              </div>
              
              {/* ETA */}
              <div className="flex items-center gap-2 bg-critical/10 px-4 py-2 rounded-lg border border-critical/20">
                <Clock className="h-5 w-5 text-critical" />
                <div>
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-xl font-bold text-critical">{currentEta} min</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-critical to-success transition-all duration-500 ease-linear relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Dispatched</span>
            <span>{progress}% Complete</span>
            <span>Arriving</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
