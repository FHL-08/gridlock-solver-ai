import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
}

export function AmbulanceMap({ patientName, eta }: AmbulanceMapProps) {
  const [position, setPosition] = useState({ lat: 51.5074, lng: -0.1278 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Map Placeholder with animated route */}
        <div className="h-64 bg-gradient-to-br from-primary/10 via-background to-accent/10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full p-8">
              {/* Route Path */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.3 }} />
                    <stop offset={`${progress}%`} style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                    <stop offset={`${progress}%`} style={{ stopColor: 'hsl(var(--muted))', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(var(--muted))', stopOpacity: 0.3 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M 50 180 Q 150 120, 250 140 T 450 100"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="10,5"
                />
              </svg>

              {/* Starting Point (Ambulance current position) */}
              <div 
                className="absolute animate-pulse" 
                style={{ 
                  left: `${10 + (progress * 0.8)}%`, 
                  top: `${70 - (progress * 0.3)}%`,
                  zIndex: 2 
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-critical rounded-full animate-ping opacity-75" style={{ width: '40px', height: '40px' }}></div>
                  <div className="relative bg-critical text-critical-foreground rounded-full p-2 shadow-lg">
                    <Navigation className="h-6 w-6" style={{ transform: 'rotate(45deg)' }} />
                  </div>
                </div>
              </div>

              {/* Destination (Hospital) */}
              <div className="absolute" style={{ right: '8%', top: '20%', zIndex: 2 }}>
                <div className="bg-success text-success-foreground rounded-full p-3 shadow-lg">
                  <MapPin className="h-7 w-7" />
                </div>
                <Badge className="mt-2 bg-success">Hospital</Badge>
              </div>

              {/* Waypoints */}
              <div className="absolute bg-primary/20 rounded-full p-1.5" style={{ left: '35%', top: '55%' }}>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <div className="absolute bg-primary/20 rounded-full p-1.5" style={{ left: '60%', top: '48%' }}>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-critical animate-pulse" />
              <div>
                <p className="font-semibold text-foreground">{patientName}</p>
                <p className="text-xs text-muted-foreground">En route to hospital</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-critical/10 px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4 text-critical" />
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="font-bold text-critical">{eta} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
