import { Card } from '@/components/ui/card';
import { Building2, Navigation, MapPin } from 'lucide-react';

interface LocationOverviewMapProps {
  patientName: string;
  patientLocation: string;
}

export function LocationOverviewMap({ patientName, patientLocation }: LocationOverviewMapProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="relative w-full aspect-video bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Street grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: 0 }} preserveAspectRatio="none">
          <defs>
            <pattern id="location-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#location-grid)" />
        </svg>

        {/* Map content */}
        <div className="absolute inset-0 p-4 md:p-6" style={{ zIndex: 1 }}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
            <defs>
              {/* Route lines */}
              <linearGradient id="routeToHospital" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              </linearGradient>
              
              <linearGradient id="routeToPatient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Route line from patient location to hospital */}
            <path
              d="M 400 200 Q 550 150, 700 100"
              stroke="url(#routeToHospital)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10,5"
              opacity="0.6"
            />
            
            {/* Route line from ambulance to patient location */}
            <path
              d="M 150 300 Q 275 250, 400 200"
              stroke="url(#routeToPatient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10,5"
              opacity="0.6"
            />
          </svg>

          {/* Hospital (top right) */}
          <div className="absolute right-8 top-12">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl w-16 h-16 -translate-x-1/4 -translate-y-1/4" />
              
              {/* Hospital icon */}
              <div className="relative bg-primary text-primary-foreground rounded-lg p-4 shadow-2xl border-4 border-primary-foreground/20">
                <Building2 className="h-8 w-8" />
              </div>
              
              {/* Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-primary/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/40 shadow-lg">
                  <p className="text-xs font-bold text-primary">City Hospital</p>
                  <p className="text-[10px] text-muted-foreground">Emergency Bay A</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Location (center) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pulse rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-16 h-16 bg-destructive/30 rounded-full animate-ping" />
                <div className="absolute w-12 h-12 bg-destructive/40 rounded-full animate-pulse" />
              </div>
              
              {/* Center dot */}
              <div className="relative bg-destructive rounded-full p-3 shadow-2xl border-4 border-destructive-foreground/20 z-10">
                <div className="w-4 h-4 bg-destructive-foreground rounded-full" />
              </div>
              
              {/* Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                <div className="bg-destructive/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-destructive/40 shadow-lg">
                  <p className="text-xs font-bold text-destructive">{patientName}</p>
                  <p className="text-[10px] text-muted-foreground">{patientLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ambulance (bottom left) */}
          <div className="absolute left-12 bottom-16">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-success/20 rounded-full blur-xl w-16 h-16 -translate-x-1/4 -translate-y-1/4" />
              
              {/* Ambulance icon */}
              <div className="relative bg-success text-success-foreground rounded-full p-4 shadow-2xl border-4 border-success-foreground/20">
                <Navigation className="h-7 w-7" style={{ transform: 'rotate(45deg)' }} />
              </div>
              
              {/* Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-success/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-success/40 shadow-lg">
                  <p className="text-xs font-bold text-success">Ambulance</p>
                  <p className="text-[10px] text-muted-foreground">Unit A-42</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-border shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <p className="text-xs text-muted-foreground">Patient Location</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full" />
                <p className="text-xs text-muted-foreground">Ambulance</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <p className="text-xs text-muted-foreground">Hospital</p>
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-border shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location Overview</p>
                <p className="text-sm font-bold text-foreground">Emergency Scene</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
