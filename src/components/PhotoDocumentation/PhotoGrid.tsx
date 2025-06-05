import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Calendar, AlertCircle } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";
import { ExportPanel } from './ExportPanel';

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

export default function PhotoGrid() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PhotoEntry | null>(null);

  // Load entries from localStorage
  useEffect(() => {
    const storedEntries = localStorage.getItem('briqwerk_entries');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Keine Fotos vorhanden</p>
        <p className="text-sm">Fügen Sie neue Fotos hinzu, um sie hier zu sehen.</p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => setSelectedEntry(entry)}
          >
            <img
              src={entry.imageUrl}
              alt={entry.description}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm line-clamp-2">{entry.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(entry.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                </span>
                {entry.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    GPS
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <PhotoLightbox 
        entry={selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
      />

      {/* Export Panel */}
      <div className="mt-8">
        <ExportPanel />
      </div>
    </>
  );
} 