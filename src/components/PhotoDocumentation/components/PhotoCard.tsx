import React from 'react';
import { Card, Badge, Button } from '../../ui';
import type { PhotoEntry } from '../types';
import { LocationBadge } from './LocationBadge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatRelativeTime, getMapUrl } from '../utils';
import { haversine } from '@/lib/geo';

interface PhotoCardProps {
  entry: PhotoEntry;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  tooltipText?: string | undefined;
  onDelete: (id: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  entry,
  userLocation,
  tooltipText,
  onDelete
}) => {
  const { id, text, photo, coords, createdAt, updatedAt, unsynced } = entry;
  
  // Formatiere die Zeitstempel
  const formattedCreatedAt = format(new Date(createdAt), "dd.MM.yyyy – HH:mm 'Uhr'", { locale: de });
  const formattedUpdatedAt = updatedAt 
    ? format(new Date(updatedAt), "dd.MM.yyyy – HH:mm 'Uhr'", { locale: de })
    : null;

  const relativeTime = formatRelativeTime(createdAt);
  const mapUrl = coords ? getMapUrl(coords.latitude, coords.longitude) : undefined;

  // Calculate distance if both user location and photo location are available
  let distance: number | null = null;
  if (userLocation && coords) {
    distance = haversine(
      coords.latitude,
      coords.longitude,
      userLocation.latitude,
      userLocation.longitude
    );
  }

  return (
    <Card className="overflow-hidden">
      {photo && (
        <div className="relative">
          <img
            src={photo}
            alt={text || 'Dokumentationsfoto'}
            className="w-full h-48 object-cover"
          />
          {unsynced && (
            <Badge
              variant="warning"
              className="absolute top-2 right-2"
            >
              🕓 Nicht synchronisiert
            </Badge>
          )}
        </div>
      )}

      <div className="p-4">
        <p 
          className="text-gray-700 dark:text-gray-200 mb-2"
          title={tooltipText}
        >
          {text}
        </p>
        
        {/* Zeitstempel */}
        <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <time 
            dateTime={createdAt}
            className="flex items-center gap-1"
          >
            <span className="text-gray-400 dark:text-gray-500">📅</span>
            {formattedCreatedAt}
          </time>
          
          {formattedUpdatedAt && formattedUpdatedAt !== formattedCreatedAt && (
            <time 
              dateTime={updatedAt}
              className="flex items-center gap-1 text-xs"
            >
              <span className="text-gray-400 dark:text-gray-500">✏️</span>
              Bearbeitet am {formattedUpdatedAt}
            </time>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={createdAt}>{relativeTime}</time>
          {coords && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              📍 Karte
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-auto">
          {coords && (
            <LocationBadge
              latitude={coords.latitude}
              longitude={coords.longitude}
            />
          )}
          {distance !== null && (
            <div className="text-xs text-gray-500">
              {distance < 1
                ? `${Math.round(distance * 1000)}m entfernt`
                : `${distance.toFixed(1)}km entfernt`}
            </div>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            aria-label="Eintrag löschen"
            className={unsynced ? 'opacity-50 cursor-not-allowed' : ''}
            disabled={unsynced}
            title={unsynced ? 'Löschen erst nach Synchronisation möglich' : 'Eintrag löschen'}
          >
            Löschen
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PhotoCard; 