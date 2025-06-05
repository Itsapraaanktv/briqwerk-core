import { useState, useRef, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Camera, MapPin, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddEntryModalProps {
  onClose: () => void;
  onSave?: () => void;
}

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

export function AddEntryModal({ onClose, onSave }: AddEntryModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
      }
    );
  };

  // Handle save
  const handleSave = () => {
    if (!image) {
      alert('Bitte wählen Sie ein Bild aus.');
      return;
    }

    if (!description.trim()) {
      alert('Bitte geben Sie eine Beschreibung ein.');
      return;
    }

    const newEntry: PhotoEntry = {
      id: uuidv4(),
      imageUrl: image,
      description: description.trim(),
      timestamp: new Date().toISOString(),
      ...(location && { location }),
    };

    // Get existing entries or initialize empty array
    const existingEntries = JSON.parse(localStorage.getItem('briqwerk_entries') || '[]');
    
    // Add new entry and save back to localStorage
    localStorage.setItem('briqwerk_entries', JSON.stringify([newEntry, ...existingEntries]));

    onSave?.();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuer Eintrag</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Image Upload */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Foto</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
              capture="environment"
            />
            
            {image ? (
              <div className="relative aspect-video">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Camera className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Klicken zum Fotografieren/Auswählen</span>
              </button>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Was wurde dokumentiert?"
            />
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Standort</label>
              <button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {location ? 'Standort aktualisieren' : 'Standort erfassen'}
              </button>
            </div>
            {location && (
              <div className="text-sm text-gray-500">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-800"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!image || !description.trim()}
          >
            Speichern
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 