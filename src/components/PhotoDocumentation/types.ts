import type { PhotoEntry } from '@/types/photo';

export type { PhotoEntry };

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FormData {
  text: string;
  photo: string;
  coords?: Coordinates | undefined;
  image: File | null;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  unsynced?: boolean;
  timestamp?: string;
}

export interface PhotoUploadFormProps {
  onSubmit: (entry: FormData) => void;
  initialData?: Partial<FormData>;
  isSubmitting?: boolean;
  error?: string | null;
}

export interface DocumentListProps {
  entries: PhotoEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<PhotoEntry>) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onEntryClick?: (entry: PhotoEntry) => void;
  isSyncing: boolean;
  lastSync: string | null;
  onSync: () => void;
}

export interface LightboxProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export interface SyncState {
  isSyncing: boolean;
  error: string | null;
  lastSync: string | null;
}

// Constants for validation
export const MAX_TEXT_LENGTH = 1000;
export const MAX_PHOTO_SIZE = 5000000; // 5MB in base64
export const MAX_ENTRY_AGE_DAYS = 365;
/** Minimum size in pixels for touch-friendly UI elements */
export const MIN_TOUCH_TARGET_SIZE = 44;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export type ValidationErrorCode = 
  | 'MISSING_PHOTO'
  | 'INVALID_PHOTO_FORMAT'
  | 'PHOTO_TOO_LARGE'
  | 'MISSING_TEXT'
  | 'TEXT_TOO_LONG'
  | 'INVALID_COORDINATES'
  | 'ENTRY_TOO_OLD'
  | 'INVALID_FORMAT'
  | 'REQUIRED_FIELD'
  | 'NETWORK_ERROR'
  | 'INVALID_PHOTO'
  | 'FILE_TOO_LARGE'
  | 'INVALID_TIMESTAMP'
  | 'FUTURE_TIMESTAMP'
  | 'TOO_OLD_TIMESTAMP';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: keyof FormData | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface SyncResult {
  synced: PhotoEntry[];
  timestamp: string;
  errors?: ValidationError[];
} 