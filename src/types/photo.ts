export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PhotoEntry {
  id: string;
  photo: string;
  text: string;
  coords?: Coordinates | undefined;
  createdAt: string;
  updatedAt: string;
  images?: string[] | undefined;
  unsynced?: boolean | undefined;
  timestamp?: string | Date | undefined; // ISO date string or Date object for sorting/timeline
  tags?: string[] | undefined;
  author?: string | undefined;
  location?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export type PhotoEntryInput = Omit<PhotoEntry, 'id' | 'createdAt' | 'updatedAt'>;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: keyof PhotoEntry | undefined;
}

export type ValidationErrorCode = 
  | 'REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'INVALID_COORDINATES'
  | 'INVALID_PHOTO'
  | 'PHOTO_TOO_LARGE'
  | 'INVALID_TIMESTAMP'
  | 'FUTURE_TIMESTAMP'
  | 'TOO_OLD_TIMESTAMP';

export interface FormData extends Omit<PhotoEntry, 'id' | 'createdAt' | 'updatedAt'> {
  image: File | null;
  createdAt?: string;
}

export interface SyncResult {
  synced: PhotoEntry[];
  timestamp: string;
  errors?: ValidationError[] | undefined;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export class SyncError extends Error {
  constructor(
    message: string,
    public code: SyncErrorCode,
    public errors?: ValidationError[] | undefined
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export type SyncErrorCode = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT';

export interface PhotoUploadResponse {
  success: boolean;
  data?: PhotoEntry | undefined;
  error?: string | undefined;
} 