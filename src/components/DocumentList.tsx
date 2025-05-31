import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentEntry } from '../types';
import { components } from '../styles/design-system';

interface DocumentListProps {
  entries: DocumentEntry[];
  onDelete?: (id: string) => void;
}

export default function DocumentList({ entries, onDelete }: DocumentListProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={expandedImage}
              alt="Vergrößerte Ansicht"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Einträge */}
      <div className={components.grid.docs}>
        {entries.map(entry => (
          <article
            key={entry.id}
            className={`${components.card} hover:shadow-md transition-shadow`}
          >
            {/* Bild (wenn vorhanden) */}
            {entry.photo && (
              <div className="relative -mt-4 -mx-4 md:-mx-6 mb-4">
                <img
                  src={entry.photo}
                  alt=""
                  className="w-full h-48 object-cover cursor-pointer rounded-t-lg"
                  onClick={() => entry.photo && setExpandedImage(entry.photo)}
                />
                {entry.coordinates && (
                  <Link
                    to={`/kartenansicht?entry=${entry.id}`}
                    className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <span role="img" aria-hidden="true">📍</span>
                    Auf Karte
                  </Link>
                )}
              </div>
            )}

            {/* Text und Metadaten */}
            <div className="space-y-3">
              <p className="whitespace-pre-wrap text-gray-800">{entry.text}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                <time dateTime={entry.timestamp}>
                  {entry.timestamp}
                </time>

                {onDelete && (
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Löschen"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-medium">Noch keine Einträge vorhanden</p>
          <p className="text-sm">Füge einen neuen Eintrag mit Foto hinzu</p>
        </div>
      )}
    </div>
  );
} 