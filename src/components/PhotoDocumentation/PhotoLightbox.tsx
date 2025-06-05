import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Calendar, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

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

interface PhotoLightboxProps {
  entry: PhotoEntry | null;
  onClose: () => void;
}

export default function PhotoLightbox({ entry, onClose }: PhotoLightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!entry) return null;

  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Close and Zoom Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              {isZoomed ? (
                <ZoomOut className="h-5 w-5" />
              ) : (
                <ZoomIn className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image */}
          <div 
            className={`
              relative bg-black
              ${isZoomed ? 'overflow-auto max-h-[70vh]' : 'overflow-hidden max-h-[70vh]'}
            `}
          >
            <img
              src={entry.imageUrl}
              alt={entry.description}
              className={`
                w-full h-full transition-transform duration-300
                ${isZoomed ? 'object-contain cursor-zoom-out' : 'object-contain cursor-zoom-in'}
              `}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>

          {/* Metadata */}
          <div className="p-6 space-y-4 bg-white">
            {/* Description */}
            <p className="text-gray-700 text-lg">{entry.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {/* Timestamp */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(entry.timestamp), "PPp", { locale: de })}
              </div>

              {/* Location */}
              {entry.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <a
                    href={`https://www.google.com/maps?q=${entry.location.latitude},${entry.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {`${entry.location.latitude.toFixed(6)}, ${entry.location.longitude.toFixed(6)}`}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 