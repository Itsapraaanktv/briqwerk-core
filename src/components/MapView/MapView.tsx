import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';

interface PhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Custom marker icon
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function MapView() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [entriesWithLocation, setEntriesWithLocation] = useState<PhotoEntry[]>([]);

  // Load entries from localStorage
  useEffect(() => {
    const storedEntries = localStorage.getItem('briqwerk_entries');
    if (storedEntries) {
      const parsedEntries = JSON.parse(storedEntries);
      setEntries(parsedEntries);
      // Filter entries with location data
      setEntriesWithLocation(parsedEntries.filter(
        (entry: PhotoEntry) => entry.location?.latitude && entry.location?.longitude
      ));
    }
  }, []);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Keine Einträge vorhanden</p>
        <p className="text-sm text-center">Fügen Sie neue Fotos mit GPS-Daten hinzu, um sie auf der Karte zu sehen.</p>
      </div>
    );
  }

  if (entriesWithLocation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Keine GPS-Daten vorhanden</p>
        <p className="text-sm text-center">Die vorhandenen Einträge enthalten keine GPS-Koordinaten.</p>
      </div>
    );
  }

  // Calculate map center (average of all locations)
  const center = entriesWithLocation.reduce(
    (acc, entry) => {
      if (entry.location) {
        acc.lat += entry.location.latitude;
        acc.lng += entry.location.longitude;
      }
      return acc;
    },
    { lat: 0, lng: 0 }
  );
  
  center.lat /= entriesWithLocation.length;
  center.lng /= entriesWithLocation.length;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {entriesWithLocation.map((entry) => (
          entry.location && (
            <Marker
              key={entry.id}
              position={[entry.location.latitude, entry.location.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="max-w-[200px]">
                  <img
                    src={entry.imageUrl}
                    alt={entry.description}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm font-medium mb-1">{entry.description}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(entry.timestamp), "PPp", { locale: de })}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
} 