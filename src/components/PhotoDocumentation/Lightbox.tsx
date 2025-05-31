import { useEffect } from 'react';
import type { LightboxProps } from './types';
import { Button } from '../ui';

export default function Lightbox({ isOpen, imageUrl, onClose }: LightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        <img
          src={imageUrl}
          alt="Vergrößerte Ansicht"
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="secondary"
          className="absolute top-4 right-4"
          onClick={onClose}
          aria-label="Schließen"
        >
          ✕
        </Button>
      </div>
    </div>
  );
} 