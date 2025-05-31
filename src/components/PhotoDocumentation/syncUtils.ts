import type { PhotoEntry, SyncResult, ValidationResult, ValidationError } from './types';
import { createValidationError } from './utils';

/**
 * Validates an array of photo entries before syncing
 * @param entries - Array of photo entries to validate
 * @returns Validation result indicating if entries are valid
 */
export function validateSyncEntries(entries: PhotoEntry[]): ValidationResult {
  if (!Array.isArray(entries)) {
    return {
      isValid: false,
      errors: [createValidationError('INVALID_FORMAT', 'Invalid entries format')]
    };
  }

  const errors: ValidationError[] = [];

  entries.forEach((entry, index) => {
    // Required fields
    if (!entry.photo) {
      errors.push(createValidationError('MISSING_PHOTO', `Entry ${index + 1}: Photo is required`));
    }

    if (!entry.text) {
      errors.push(createValidationError('MISSING_TEXT', `Entry ${index + 1}: Text is required`));
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Syncs photo entries with the server
 * @param entries - Array of photo entries to sync
 * @returns Promise resolving to sync result
 */
export async function syncEntries(entries: PhotoEntry[]): Promise<SyncResult> {
  // Validate entries before sync
  const validation = validateSyncEntries(entries);
  if (!validation.isValid) {
    return {
      synced: [],
      timestamp: new Date().toISOString(),
      errors: validation.errors
    };
  }

  try {
    // Simulate server sync delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, just mark entries as synced
    const synced = entries.map(entry => ({
      ...entry,
      unsynced: false
    }));

    return {
      synced,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      synced: [],
      timestamp: new Date().toISOString(),
      errors: [
        createValidationError(
          'NETWORK_ERROR',
          error instanceof Error ? error.message : 'Network error during sync'
        )
      ]
    };
  }
} 