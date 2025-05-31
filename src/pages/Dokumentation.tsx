import { useState, useEffect, useRef } from 'react';
import type { DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExportButtons } from '../components/PhotoDocumentation/components/ExportButtons';
import type { PhotoEntry } from '@/components/PhotoDocumentation/types';

export interface DocumentEntry {
  id: string;
  text: string;
  timestamp: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images: string[]; // Base64-kodierte Bilder
}

const STORAGE_KEY = 'dokumentationEintraege';
const MAX_IMAGE_SIZE = 800; // maximale Bildgröße in Pixeln

export default function Dokumentation() {
  const [entries, setEntries] = useState<DocumentEntry[]>(() => {
    // Initialer State: Versuche Einträge aus localStorage zu laden
    try {
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      return savedEntries ? JSON.parse(savedEntries) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      return [];
    }
  });
  const [currentText, setCurrentText] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [lastDeletedEntry, setLastDeletedEntry] = useState<DocumentEntry | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const entriesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speichere Einträge im localStorage wenn sie sich ändern
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge:', error);
    }
  }, [entries]);

  // Automatisches Ausblenden der Erfolgsmeldung
  useEffect(() => {
    if (exportStatus) {
      const timer = setTimeout(() => {
        setExportStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for when exportStatus is falsy
  }, [exportStatus]);

  // Bild-Verarbeitung
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.src = e.target?.result as string;
          
          await new Promise((res) => {
            img.onload = res;
          });

          // Skaliere das Bild wenn nötig
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
            if (width > height) {
              height = (height / width) * MAX_IMAGE_SIZE;
              width = MAX_IMAGE_SIZE;
            } else {
              width = (width / height) * MAX_IMAGE_SIZE;
              height = MAX_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    try {
      const imagePromises = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(processImage);

      const processedImages = await Promise.all(imagePromises);
      setCurrentImages(prev => [...prev, ...processedImages]);
    } catch (error) {
      console.error('Fehler beim Bildupload:', error);
      setExportStatus({
        type: 'error',
        message: 'Fehler beim Bildupload'
      });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await handleImageUpload(e.dataTransfer.files);
  };

  const handleAddEntry = () => {
    if (!currentText.trim()) return;

    const newEntry: DocumentEntry = {
      id: crypto.randomUUID(),
      text: currentText.trim(),
      timestamp: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      images: currentImages,
    };

    // Optional: Standort hinzufügen, wenn gewünscht
    if (isAddingLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const entryWithLocation = {
            ...newEntry,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          };
          setEntries(prev => [entryWithLocation, ...prev]);
          setIsAddingLocation(false);
        },
        (error) => {
          console.error('Fehler beim Abrufen des Standorts:', error);
          setEntries(prev => [newEntry, ...prev]);
          setIsAddingLocation(false);
        }
      );
    } else {
      setEntries(prev => [newEntry, ...prev]);
    }
    
    setCurrentText('');
    setCurrentImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (editingId) {
        handleSaveEdit();
      } else {
        handleAddEntry();
      }
    } else if (e.key === 'Escape' && editingId) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (entry: DocumentEntry) => {
    setEditingId(entry.id);
    setEditingText(entry.text);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingText.trim()) return;

    setEntries(prev => prev.map(entry =>
      entry.id === editingId
        ? {
            ...entry,
            text: editingText.trim(),
            timestamp: new Date().toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }
        : entry
    ));
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDelete = (entryToDelete: DocumentEntry) => {
    if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      setLastDeletedEntry(entryToDelete);
      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));

      // Automatisches Ausblenden der Undo-Option nach 10 Sekunden
      setTimeout(() => {
        setLastDeletedEntry(prev => 
          prev?.id === entryToDelete.id ? null : prev
        );
      }, 10000);
    }
  };

  const handleUndo = () => {
    if (lastDeletedEntry) {
      setEntries(prev => [lastDeletedEntry, ...prev]);
      setLastDeletedEntry(null);
    }
  };

  // Filtere Einträge basierend auf der Suchanfrage
  const filteredEntries = entries.filter(entry =>
    entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          📋 Dokumentation
        </h1>
        <div className="flex items-center space-x-2">
          <Link
            to="/kartenansicht"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🗺️ Zur Karte
          </Link>
          {entries.length > 0 && (
            <ExportButtons 
              entries={entries.map(entry => ({
                id: entry.id,
                text: entry.text,
                timestamp: entry.timestamp,
                coords: entry.coordinates ? {
                  latitude: entry.coordinates.lat,
                  longitude: entry.coordinates.lng
                } : undefined,
                createdAt: entry.timestamp,
                updatedAt: entry.timestamp,
                photo: entry.images[0] || '',
                images: entry.images,
                unsynced: false
              } as PhotoEntry))} 
            />
          )}
        </div>
      </div>

      {/* Export Status Notification */}
      {exportStatus && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all transform ${
            exportStatus.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          {exportStatus.message}
        </div>
      )}

      {/* Suchfeld */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Einträge durchsuchen..."
            className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
          </p>
        )}
      </div>

      {/* Undo-Banner */}
      {lastDeletedEntry && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 z-50">
          <span>Eintrag gelöscht</span>
          <button
            onClick={handleUndo}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Rückgängig machen
          </button>
        </div>
      )}

      {/* Eingabebereich */}
      <div
        className={`bg-white rounded-lg shadow-md p-6 mb-8 ${
          isDragging ? 'border-2 border-blue-500 border-dashed' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Notizen hier eingeben... (Strg + Enter zum Speichern)"
          className="w-full h-32 p-4 mb-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Bildvorschau */}
        {currentImages.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {currentImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Vorschau ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    onClick={() => setCurrentImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingLocation(prev => !prev)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isAddingLocation 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">📍</span>
              {isAddingLocation ? 'Standort wird hinzugefügt' : 'Standort hinzufügen'}
            </button>
            <label className="cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleImageUpload(e.target.files)}
                multiple
                accept="image/*"
                className="hidden"
              />
              <span className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                <span className="mr-2">🖼️</span>
                Bilder hinzufügen
              </span>
            </label>
          </div>
          <button
            onClick={handleAddEntry}
            disabled={!currentText.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">➕</span>
            Eintrag hinzufügen
          </button>
        </div>
      </div>

      {/* Liste der Einträge */}
      <div ref={entriesContainerRef} className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {entries.length === 0 
              ? 'Noch keine Einträge vorhanden. Füge deinen ersten Eintrag hinzu!'
              : 'Keine Einträge gefunden, die deiner Suche entsprechen.'}
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {editingId === entry.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editingText.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <p className="whitespace-pre-wrap text-gray-800">{entry.text}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>🕒 {entry.timestamp}</span>
                        {entry.coordinates && (
                          <Link
                            to={`/kartenansicht?entry=${entry.id}`}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <span className="mr-1">📍</span>
                            Auf Karte anzeigen
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {/* Bildergalerie */}
                  {entry.images && entry.images.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {entry.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Bild ${index + 1}`}
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(image, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 