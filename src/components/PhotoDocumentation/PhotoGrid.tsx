import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import type { PhotoEntry } from "./types";
import { ExportButtons } from "./components/ExportButtons";

export default function PhotoGrid({ photos }: { photos: PhotoEntry[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);

  if (photos.length === 0) {
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
      {/* Export Buttons */}
      <div className="px-4 mb-4">
        <ExportButtons entries={photos} />
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.photo || ''}
              alt={photo.text}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm line-clamp-2">{photo.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    !photo.unsynced
                      ? "success"
                      : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {!photo.unsynced && <CheckCircle className="h-3 w-3" />}
                  {!photo.unsynced ? "Synchronisiert" : "Ausstehend"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            <div className="space-y-4">
              {/* Photo */}
              <img
                src={selectedPhoto.photo}
                alt={selectedPhoto.text}
                className="w-full aspect-video object-contain bg-black rounded-lg"
              />

              {/* Metadata */}
              <div className="space-y-2">
                {/* Text */}
                <p className="text-gray-700">{selectedPhoto.text}</p>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {format(selectedPhoto.timestamp || selectedPhoto.createdAt, "PPp", { locale: de })}
                </div>

                {/* Location */}
                {selectedPhoto.coords && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {`${selectedPhoto.coords.latitude.toFixed(6)}, ${selectedPhoto.coords.longitude.toFixed(6)}`}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 