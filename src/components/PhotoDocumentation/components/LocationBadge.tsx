import React from 'react';
import { getMapUrl } from '../utils';

export interface LocationBadgeProps {
  latitude: number;
  longitude: number;
  label?: string;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  latitude,
  longitude,
  label
}) => {
  const mapUrl = getMapUrl(latitude, longitude);
  const formattedCoords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 transition-colors"
      title="In OpenStreetMap öffnen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
          clipRule="evenodd"
        />
      </svg>
      {label ? (
        <span>{label}</span>
      ) : (
        <span>{formattedCoords}</span>
      )}
    </a>
  );
}; 