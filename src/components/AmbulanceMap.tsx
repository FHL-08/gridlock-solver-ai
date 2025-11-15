import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Navigation, Clock, MapPin, Radio, Gauge, AlertTriangle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
  dispatchTime?: number;
  reverseDirection?: boolean;
  onArrival?: () => void;
}

// Mapbox access token from environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXphcmludGgiLCJhIjoiY21pMGNhYWhvMGQyazJpc2Zieml5bjBkZSJ9.mi_-IPUB0BRSs54GLuHOsQ';

// Helper function to format time
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function AmbulanceMap({ patientName, eta, dispatchTime, reverseDirection = false, onArrival }: AmbulanceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const ambulanceMarker = useRef<mapboxgl.Marker | null>(null);
  const [progress, setProgress] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // London coordinates for realistic UK emergency scenario
  const hospitalCoords: [number, number] = reverseDirection ? [-0.1276, 51.5074] : [-0.1478, 51.5155];
  const patientCoords: [number, number] = reverseDirection ? [-0.1478, 51.5155] : [-0.1276, 51.5074];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Uber-style navigation theme
      center: hospitalCoords,
      zoom: 13,
      pitch: 45, // 3D perspective like Uber
      bearing: 0,
      antialias: true
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      if (!map.current) return;

      // Add 3D building layer for realism
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 12,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });

      // Add route layer (will be updated with actual route)
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [hospitalCoords, patientCoords]
          }
        }
      });

      // Route line - traveled portion (animated)
      map.current.addLayer({
        'id': 'route-traveled',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#3B82F6', // Primary blue
          'line-width': 6,
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, '#3B82F6',
            0.5, '#8B5CF6',
            1, '#10B981'
          ]
        }
      });

      // Route line - untraveled (grayed out)
      map.current.addLayer({
        'id': 'route-untraveled',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#6B7280',
          'line-width': 4,
          'line-opacity': 0.3,
          'line-dasharray': [2, 2]
        }
      });

      // Add markers for hospital and patient
      const hospitalMarkerEl = document.createElement('div');
      hospitalMarkerEl.className = 'hospital-marker';
      hospitalMarkerEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-green-500/30 rounded-full blur-md w-10 h-10 -translate-x-1/4 -translate-y-1/4 animate-pulse"></div>
          <div class="relative bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      `;

      const patientMarkerEl = document.createElement('div');
      patientMarkerEl.className = 'patient-marker';
      patientMarkerEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500/30 rounded-full blur-md w-10 h-10 -translate-x-1/4 -translate-y-1/4 animate-pulse"></div>
          <div class="relative bg-blue-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      `;

      new mapboxgl.Marker(reverseDirection ? hospitalMarkerEl : patientMarkerEl)
        .setLngLat(hospitalCoords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(reverseDirection ? 'Hospital' : patientName))
        .addTo(map.current);

      new mapboxgl.Marker(reverseDirection ? patientMarkerEl : hospitalMarkerEl)
        .setLngLat(patientCoords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(reverseDirection ? patientName : 'Hospital'))
        .addTo(map.current);

      // Create custom ambulance marker
      const ambulanceEl = document.createElement('div');
      ambulanceEl.className = 'ambulance-marker';
      ambulanceEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div>
            <div class="absolute w-10 h-10 bg-red-500/30 rounded-full animate-pulse"></div>
          </div>
          <div class="relative bg-red-600 text-white rounded-full p-3 shadow-2xl border-3 border-white ring-2 ring-red-400">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style="transform: rotate(45deg)">
              <path d="M12 2L4 7v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V7l-8-5z"/>
            </svg>
            <div class="absolute -top-1 -right-1 bg-white border-2 border-red-600 rounded-full p-0.5">
              <div class="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      `;

      ambulanceMarker.current = new mapboxgl.Marker(ambulanceEl)
        .setLngLat(hospitalCoords)
        .addTo(map.current);

      // Fit bounds to show full route
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(hospitalCoords);
      bounds.extend(patientCoords);
      map.current.fitBounds(bounds, { padding: 80, pitch: 45, bearing: 0 });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update progress based on dispatch time
  useEffect(() => {
    if (!dispatchTime) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 500);
      return () => clearInterval(interval);
    }

    const totalDuration = eta * 60 * 1000;
    const initialElapsed = Date.now() - dispatchTime;
    const initialProgress = Math.min((initialElapsed / totalDuration) * 100, 100);
    
    setProgress(initialProgress);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - dispatchTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
      
      // Calculate speed (km/h) based on progress change
      const speed = Math.min(45 + Math.random() * 25, 80); // 45-70 km/h realistic ambulance speed
      setCurrentSpeed(speed);
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatchTime, eta]);

  // Animate ambulance marker along route
  useEffect(() => {
    if (!ambulanceMarker.current || progress === 0) return;

    const t = progress / 100;
    
    // Interpolate position between hospital and patient
    const lng = hospitalCoords[0] + (patientCoords[0] - hospitalCoords[0]) * t;
    const lat = hospitalCoords[1] + (patientCoords[1] - hospitalCoords[1]) * t;
    
    ambulanceMarker.current.setLngLat([lng, lat]);

    // Update camera to follow ambulance (Uber-style tracking)
    if (map.current && mapLoaded) {
      map.current.easeTo({
        center: [lng, lat],
        zoom: 14.5,
        pitch: 55,
        bearing: reverseDirection ? 225 : 45,
        duration: 1000
      });
    }
  }, [progress, mapLoaded]);

  // Trigger arrival callback
  useEffect(() => {
    if (progress >= 100 && !hasArrived && onArrival) {
      setHasArrived(true);
      onArrival();
    }
  }, [progress, hasArrived, onArrival]);

  const totalSeconds = eta * 60;
  const remainingSeconds = Math.max(totalSeconds * (1 - progress / 100), 0);
  const totalDistance = 4.5;
  const remainingDistance = totalDistance * (1 - progress / 100);

  return (
    <Card className="overflow-hidden border-2 border-critical/20 glass-strong shadow-2xl">
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Mapbox container */}
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Top Info Bar - Uber style */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 to-black/40 backdrop-blur-md border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600/20 p-2 rounded-xl border border-red-500/30 backdrop-blur-sm">
                <Navigation className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-base text-white drop-shadow-lg">{patientName}</p>
                <p className="text-xs text-gray-300">Emergency Transport • Code Red</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Speed indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                <Gauge className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-300">Speed</p>
                  <p className="text-sm font-bold text-white">{currentSpeed.toFixed(0)} km/h</p>
                </div>
              </div>
              
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 rounded-xl border border-red-500/30 backdrop-blur-sm">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar - Uber style stats */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-black/40 backdrop-blur-md border-t border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            {/* Distance */}
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-sm flex-1 mr-2">
              <Navigation className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-300 uppercase tracking-wide">Distance</p>
                <p className="text-lg font-bold text-white">{remainingDistance.toFixed(1)} km</p>
              </div>
            </div>
            
            {/* ETA */}
            <div className="flex items-center gap-3 bg-red-600/20 px-4 py-2 rounded-xl border border-red-500/30 backdrop-blur-sm flex-1">
              <Clock className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-xs text-gray-300 uppercase tracking-wide">ETA</p>
                <p className="text-lg font-bold text-red-400">{formatTime(remainingSeconds)}</p>
              </div>
            </div>
          </div>
          
          {/* Progress bar - Uber style */}
          <div className="relative">
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" 
                     style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
              <span className="font-medium">Dispatched</span>
              <span className="font-bold text-white">{progress.toFixed(0)}%</span>
              <span className="font-medium">Arriving</span>
            </div>
          </div>

          {/* Emergency alert */}
          {progress > 90 && (
            <div className="mt-3 flex items-center gap-2 bg-yellow-600/20 px-3 py-2 rounded-lg border border-yellow-500/30 backdrop-blur-sm animate-pulse">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-semibold text-yellow-400">Arriving Soon - Prepare for Patient Handoff</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
