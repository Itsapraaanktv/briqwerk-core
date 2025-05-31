import type { 
  PhotoEntry, 
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
  FormData
} from './types';
import {
  MAX_PHOTO_SIZE,
  MAX_ENTRY_AGE_DAYS,
  STORAGE_KEY
} from '../../lib/constants';

/**
 * Creates a structured validation error object
 * @param code - The error code identifying the type of error
 * @param message - Human-readable error message
 * @param field - Optional field name that caused the error
 * @returns A ValidationError object
 */
export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  field?: keyof FormData | undefined
): ValidationError {
  return {
    code,
    message,
    field
  };
}

/**
 * Validates a base64 encoded photo
 * @param photo - Optional base64 encoded photo string
 * @returns Validation result indicating if photo data is valid
 */
export function validatePhoto(photo: string | undefined): ValidationResult {
  if (!photo) {
    return {
      isValid: false,
      errors: [createValidationError(
        'INVALID_PHOTO_FORMAT',
        'Invalid or missing photo data'
      )]
    };
  }

  // Check file size (base64 string length * 0.75 gives approximate byte size)
  const photoSize = Math.ceil((photo.length - 22) * 0.75);
  if (photoSize > MAX_PHOTO_SIZE) {
    return {
      isValid: false,
      errors: [createValidationError(
        'PHOTO_TOO_LARGE',
        'Photo exceeds maximum allowed size'
      )]
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a timestamp
 * @param timestamp - ISO timestamp string
 * @returns Validation result indicating if timestamp is valid
 */
export function validateTimestamp(timestamp: string): ValidationResult {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errors: [createValidationError(
        'INVALID_TIMESTAMP',
        'Invalid timestamp format'
      )]
    };
  }

  const now = new Date();
  if (date > now) {
    return {
      isValid: false,
      errors: [createValidationError(
        'FUTURE_TIMESTAMP',
        'Timestamp cannot be in the future'
      )]
    };
  }

  const maxAge = new Date(now.getTime() - (MAX_ENTRY_AGE_DAYS * 24 * 60 * 60 * 1000));
  if (date < maxAge) {
    return {
      isValid: false,
      errors: [createValidationError(
        'TOO_OLD_TIMESTAMP',
        `Entry cannot be older than ${MAX_ENTRY_AGE_DAYS} days`
      )]
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a photo entry
 * @param entry - The entry to validate
 * @returns Validation result indicating if entry is valid
 */
export function validateEntry(entry: FormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!entry.text?.trim()) {
    errors.push(createValidationError('MISSING_TEXT', 'Text is required', 'text'));
  }

  if (!entry.photo && !entry.image) {
    errors.push(createValidationError('MISSING_PHOTO', 'Photo is required', 'photo'));
  }

  if (entry.image && entry.image.size > MAX_PHOTO_SIZE) {
    errors.push(createValidationError('PHOTO_TOO_LARGE', 'Photo must be less than 10MB', 'photo'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Filters and validates entries from storage
 * @param entries - Raw entries from storage
 * @returns Array of valid PhotoEntry objects
 */
export function cleanupStorageEntries(entries: unknown): PhotoEntry[] {
  if (!Array.isArray(entries)) {
    console.warn('Ungültiges Format im localStorage: Kein Array');
    return [];
  }

  return entries.filter((entry) => {
    try {
      const validation = validateEntry(entry as FormData);
      if (!validation.isValid) {
        console.warn(
          'Ungültiger Eintrag gefunden:',
          entry,
          validation.errors
        );
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Fehler bei der Validierung eines Eintrags:', error);
      return false;
    }
  });
}

/**
 * Loads and validates entries from localStorage
 * @returns Array of valid PhotoEntry objects
 */
export function loadEntries(): PhotoEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return cleanupStorageEntries(parsed);
  } catch (error) {
    console.error('Fehler beim Laden der Einträge:', error);
    return [];
  }
}

/**
 * Saves entries to localStorage
 * @param entries - Array of PhotoEntry objects to save
 * @throws Error if saving fails
 */
export function saveEntries(entries: PhotoEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    throw new Error('Fehler beim Speichern der Einträge: ' + error);
  }
}

/**
 * Compresses an image file and creates a thumbnail
 * @param file - Image file to compress
 * @param maxWidth - Maximum width of the compressed image
 * @returns Promise with compressed image and thumbnail URLs
 */
export function compressImage(
  file: File,
  maxWidth: number = 800
): Promise<{ dataUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create full size version
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Create thumbnail version (max 200px)
        const thumbWidth = Math.min(200, width);
        const thumbHeight = (height * thumbWidth) / width;
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

        resolve({ dataUrl, thumbnailUrl });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the current geolocation position
 * @returns Promise with GeolocationPosition
 * @throws Error if geolocation is not supported or permission denied
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

/**
 * Gets the OpenStreetMap URL for given coordinates
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns OpenStreetMap URL string
 */
export function getMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
}

/**
 * Formats a date in relative time (e.g., "vor 5 Minuten")
 * @param date - Date string or Date object
 * @returns Localized relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Gerade eben';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Vor ${diffInMinutes} ${diffInMinutes === 1 ? 'Minute' : 'Minuten'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Vor ${diffInHours} ${diffInHours === 1 ? 'Stunde' : 'Stunden'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
  }

  return then.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
} 