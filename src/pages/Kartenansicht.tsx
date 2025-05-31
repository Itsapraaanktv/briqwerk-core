import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { DocumentEntry } from './Dokumentation';

const STORAGE_KEY = 'dokumentationEintraege';

// Fix für das Marker-Icon Problem in React Leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function Kartenansicht() {
  const [searchParams] = useSearchParams();
  const highlightedEntryId = searchParams.get('entry');
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  
  // Lade Einträge aus localStorage
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(parsedEntries);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
    }
  }, []);

  // Finde den hervorgehobenen Eintrag
  const highlightedEntry = entries.find(entry => entry.id === highlightedEntryId);
  
  // Bestimme das Kartenzentrum
  const mapCenter = highlightedEntry?.coordinates || 
    entries.find(entry => entry.coordinates)?.coordinates || 
    { lat: 52.520008, lng: 13.404954 }; // Berlin als Fallback

  useEffect(() => {
    // Workaround für das CSS-Loading Problem in Vite
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Filtere Einträge mit Koordinaten
  const entriesWithLocation = entries.filter(entry => entry.coordinates);

  return (
    <div className="h-screen w-full p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">🗺️ Kartenansicht</h1>
          <Link
            to="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            📋 Zur Dokumentation
          </Link>
        </div>
        
        {entriesWithLocation.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100%-4rem)] text-gray-500">
            Keine Einträge mit Standort vorhanden.
            <Link to="/" className="ml-2 text-blue-600 hover:text-blue-800">
              Erstelle einen neuen Eintrag mit Standort
            </Link>
          </div>
        ) : (
          <div className="h-[calc(100%-4rem)] w-full">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={13}
              className="h-full w-full rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {entriesWithLocation.map(entry => (
                <Marker
                  key={entry.id}
                  position={[entry.coordinates!.lat, entry.coordinates!.lng]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="max-w-xs">
                      <p className="font-medium mb-2 text-gray-900">
                        {entry.text.length > 100 
                          ? `${entry.text.slice(0, 100)}...` 
                          : entry.text}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        🕒 {entry.timestamp}
                      </p>
                      <Link
                        to="/"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Zur Dokumentation
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
} 