import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Icon, DivIcon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Navigation, Clock, MapPin, Radio } from 'lucide-react';

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
  dispatchTime?: number;
  reverseDirection?: boolean; // When true, ambulance goes from hospital to patient
  onArrival?: () => void; // Callback when ambulance reaches destination
}

// Helper function to format time as HH:MM:SS or MM:SS
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Default coordinates - can be replaced with actual location data
const DEFAULT_PATIENT_COORDS: LatLngExpression = [51.505, -0.09]; // Example: London
const DEFAULT_HOSPITAL_COORDS: LatLngExpression = [51.515, -0.1];

export function AmbulanceMap({ patientName, eta, dispatchTime, reverseDirection = false, onArrival }: AmbulanceMapProps) {
  const [progress, setProgress] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<LatLngExpression>(
    reverseDirection ? DEFAULT_HOSPITAL_COORDS : DEFAULT_PATIENT_COORDS
  );

  useEffect(() => {
    if (!dispatchTime) {
      // Fallback to simple animation if no dispatch time
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 500);
      return () => clearInterval(interval);
    }

    // Calculate progress based on elapsed time since dispatch
    const totalDuration = eta * 60 * 1000; // Convert minutes to milliseconds
    
    // Set initial state based on elapsed time
    const initialElapsed = Date.now() - dispatchTime;
    const initialProgress = Math.min((initialElapsed / totalDuration) * 100, 100);
    
    setProgress(initialProgress);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - dispatchTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatchTime, eta]);

  // Calculate remaining time based on progress and original ETA
  const totalSeconds = eta * 60;
  const remainingSeconds = Math.max(totalSeconds * (1 - progress / 100), 0);
  
  // Calculate remaining distance based on progress (assuming 4.5km total distance)
  const totalDistance = 4.5;
  const remainingDistance = totalDistance * (1 - progress / 100);

  // Trigger arrival callback when ambulance reaches destination
  useEffect(() => {
    if (progress >= 100 && !hasArrived && onArrival) {
      setHasArrived(true);
      onArrival();
    }
  }, [progress, hasArrived, onArrival]);

  // Interpolate between start and end coordinates
  useEffect(() => {
    const startCoords = reverseDirection ? DEFAULT_HOSPITAL_COORDS : DEFAULT_PATIENT_COORDS;
    const endCoords = reverseDirection ? DEFAULT_PATIENT_COORDS : DEFAULT_HOSPITAL_COORDS;
    
    const t = progress / 100;
    const lat = (startCoords as number[])[0] + ((endCoords as number[])[0] - (startCoords as number[])[0]) * t;
    const lng = (startCoords as number[])[1] + ((endCoords as number[])[1] - (startCoords as number[])[1]) * t;
    
    setCurrentPosition([lat, lng]);
  }, [progress, reverseDirection]);

  // Create route path
  const routePath: LatLngExpression[] = reverseDirection 
    ? [DEFAULT_HOSPITAL_COORDS, DEFAULT_PATIENT_COORDS]
    : [DEFAULT_PATIENT_COORDS, DEFAULT_HOSPITAL_COORDS];

  // Create custom icons using DivIcon for better styling
  const createCustomIcon = (color: string, icon: string) => {
    return new DivIcon({
      html: `
        <div style="
          background: ${color};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          ${icon}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const ambulanceIcon = createCustomIcon('hsl(var(--critical))', `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
    </svg>
  `);

  const hospitalIcon = createCustomIcon('hsl(var(--success))', `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
    </svg>
  `);

  const patientIcon = createCustomIcon('hsl(var(--primary))', `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `);

  // Calculate center point for map
  const centerLat = ((DEFAULT_PATIENT_COORDS as number[])[0] + (DEFAULT_HOSPITAL_COORDS as number[])[0]) / 2;
  const centerLng = ((DEFAULT_PATIENT_COORDS as number[])[1] + (DEFAULT_HOSPITAL_COORDS as number[])[1]) / 2;

  return (
    <Card className="overflow-hidden border-2 border-critical/20">
      <div className="relative w-full aspect-video bg-background">
        {/* Map Container */}
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          dragging={true}
          scrollWheelZoom={false}
        >
          {/* OpenStreetMap Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Route Path */}
          <Polyline
            positions={routePath}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />

          {/* Patient Location Marker */}
          <Marker
            position={DEFAULT_PATIENT_COORDS}
            icon={patientIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">{patientName}</p>
                <p className="text-xs text-muted-foreground">Patient Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Hospital Location Marker */}
          <Marker
            position={DEFAULT_HOSPITAL_COORDS}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">City Hospital</p>
                <p className="text-xs text-muted-foreground">Emergency Bay A</p>
              </div>
            </Popup>
          </Marker>

          {/* Ambulance Marker */}
          <Marker
            position={currentPosition}
            icon={ambulanceIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">Ambulance</p>
                <p className="text-xs text-muted-foreground">En Route</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Distance indicator */}
        <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-border shadow-lg z-[1000]">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distance Remaining</p>
              <p className="text-lg font-bold text-foreground">{remainingDistance.toFixed(1)} km</p>
            </div>
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-transparent p-4 border-t border-border/50 z-[1000]">
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
                  <p className="text-xl font-bold text-critical">{formatTime(remainingSeconds)}</p>
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
            <span>Arriving</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
