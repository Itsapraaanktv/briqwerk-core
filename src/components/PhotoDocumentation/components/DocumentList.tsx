import { useState, useCallback } from 'react';
import type { DocumentListProps } from '../types';
import { PhotoCard } from './PhotoCard';
import { Button } from '../../ui';
import { truncateText } from '../../../utils/truncateText';
import { TOOLTIP_MAX_LENGTH } from '../../../lib/constants';

export default function DocumentList({ entries, onDelete }: DocumentListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    const entry = entries[index];
    if (!entry) return; // Type-safe guard for possibly undefined entry

    switch (e.key) {
      case 'Enter':
        if (entry.photo) {
          setSelectedImage(entry.photo);
        }
        break;

      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
          onDelete(entry.id);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(Math.min(index + 1, entries.length - 1));
        break;

      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(Math.max(index - 1, 0));
        break;

      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setFocusedIndex(entries.length - 1);
        break;
    }
  }, [entries, onDelete]);

  if (!entries?.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Noch keine Einträge vorhanden</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant={viewMode === 'grid' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('grid')}
          aria-label="Rasteransicht"
          aria-pressed={viewMode === 'grid'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </Button>
        <Button
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('list')}
          aria-label="Listenansicht"
          aria-pressed={viewMode === 'list'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6'
        }
        role="grid"
        aria-label="Dokumentationsliste"
      >
        {entries.map((entry, index) => {
          if (!entry?.id || !entry?.text) return null;
          
          const tooltipText = entry.text.length > TOOLTIP_MAX_LENGTH ? entry.text : undefined;
          
          return (
            <div
              key={entry.id}
              role="gridcell"
              tabIndex={focusedIndex === index ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent, index)}
              onFocus={() => setFocusedIndex(index)}
            >
              <PhotoCard
                entry={{
                  ...entry,
                  text: truncateText(entry.text)
                }}
                tooltipText={tooltipText}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Vergrößerte Ansicht"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
} 