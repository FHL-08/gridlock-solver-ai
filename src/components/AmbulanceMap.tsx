import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Clock, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
}

export function AmbulanceMap({ patientName, eta }: AmbulanceMapProps) {
  const [progress, setProgress] = useState(0);
  
  // Hospital location (destination)
  const hospitalLocation: [number, number] = [51.5074, -0.1278];
  
  // Calculate ambulance starting position (simulate coming from southwest)
  const startLocation: [number, number] = [51.4874, -0.1578];
  
  // Create route path with waypoints
  const routePath: [number, number][] = [
    startLocation,
    [51.4924, -0.1478],
    [51.4974, -0.1378],
    [51.5024, -0.1328],
    hospitalLocation,
  ];

  // Calculate current ambulance position based on progress
  const getCurrentPosition = (): [number, number] => {
    const segmentCount = routePath.length - 1;
    const progressIndex = Math.min(Math.floor((progress / 100) * segmentCount), segmentCount - 1);
    const segmentProgress = ((progress / 100) * segmentCount) % 1;
    
    const start = routePath[progressIndex];
    const end = routePath[progressIndex + 1] || routePath[progressIndex];
    
    const lat = start[0] + (end[0] - start[0]) * segmentProgress;
    const lng = start[1] + (end[1] - start[1]) * segmentProgress;
    
    return [lat, lng];
  };

  const currentPosition = getCurrentPosition();

  // Custom ambulance icon
  const ambulanceIcon = L.divIcon({
    className: 'custom-ambulance-icon',
    html: `
      <div style="position: relative;">
        <div style="position: absolute; inset: 0; background: hsl(var(--critical)); border-radius: 50%; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75; width: 40px; height: 40px;"></div>
        <div style="position: relative; background: hsl(var(--critical)); color: hsl(var(--critical-foreground)); border-radius: 50%; padding: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  // Custom hospital icon
  const hospitalIcon = L.divIcon({
    className: 'custom-hospital-icon',
    html: `
      <div style="background: hsl(var(--success)); color: hsl(var(--success-foreground)); border-radius: 50%; padding: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="relative h-64">
        <MapContainer
          center={[51.4974, -0.1428] as [number, number]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route path */}
          <Polyline
            positions={routePath}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
          
          {/* Completed route path */}
          <Polyline
            positions={routePath.slice(0, Math.ceil((progress / 100) * routePath.length))}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 4,
              opacity: 1,
            }}
          />
          
          {/* Ambulance marker */}
          <Marker position={currentPosition} icon={ambulanceIcon as any}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{patientName}</p>
                <p className="text-muted-foreground">En route</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Hospital marker */}
          <Marker position={hospitalLocation} icon={hospitalIcon as any}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Hospital</p>
                <p className="text-muted-foreground">Destination</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4 pointer-events-none">
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
