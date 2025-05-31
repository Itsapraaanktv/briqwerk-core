import { useEffect, useCallback } from 'react';
import type { LightboxProps } from '../types';

export default function Lightbox({ isOpen, imageUrl, onClose }: LightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      role="dialog"
      aria-modal="true"
      aria-label="Bildvorschau"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full p-4">
        <button
          className="absolute top-4 right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={onClose}
          aria-label="Schließen"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Vergrößerte Ansicht"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
} 