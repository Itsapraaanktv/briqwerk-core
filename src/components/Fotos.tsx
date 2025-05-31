import { useState, useRef } from 'react';

interface PhotoData {
  id: string;
  imageUrl: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function Fotos() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird von Ihrem Browser nicht unterstützt.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get current location
      const position = await getCurrentPosition();
      
      // Create URL for image preview
      const imageUrl = URL.createObjectURL(file);
      
      // Create new photo entry
      const newPhoto: PhotoData = {
        id: crypto.randomUUID(),
        imageUrl,
        timestamp: new Date().toLocaleString('de-DE'),
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      };

      setPhotos(prev => [newPhoto, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Fotos Upload</h1>
      
      {/* Upload Section */}
      <div className="mb-8">
        <label 
          htmlFor="photo-upload"
          className="block w-full p-4 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <span className="text-gray-600">
            {isLoading ? 'Wird verarbeitet...' : 'Klicken oder Foto hierher ziehen'}
          </span>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            ref={fileInputRef}
            disabled={isLoading}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="border rounded-lg overflow-hidden shadow-sm">
            <img 
              src={photo.imageUrl} 
              alt={`Uploaded at ${photo.timestamp}`}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Zeitpunkt:</span> {photo.timestamp}
              </p>
              {photo.location && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Standort:</span><br />
                  Lat: {photo.location.latitude.toFixed(6)}<br />
                  Lng: {photo.location.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 