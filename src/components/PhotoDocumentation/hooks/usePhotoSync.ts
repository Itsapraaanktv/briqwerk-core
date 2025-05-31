/**
 * Custom hook for managing photo synchronization
 * Note: SyncStatus type was removed as it's not used in this hook anymore
 */
import { useState, useCallback } from 'react';
import type { PhotoEntry } from '../types';
import { syncEntries } from '../syncUtils';

export interface UsePhotoSyncResult {
  isSyncing: boolean;
  syncError: Error | null;
  lastSync: string | null;
  sync: () => Promise<void>;
}

export function usePhotoSync(
  entries: PhotoEntry[],
  updateEntry: (id: string, data: Partial<PhotoEntry>) => void
): UsePhotoSyncResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const unsyncedEntries = entries.filter(entry => entry.unsynced);
      if (unsyncedEntries.length === 0) {
        setLastSync(new Date().toISOString());
        return;
      }

      const { synced, timestamp } = await syncEntries(unsyncedEntries);
      
      // Update synced entries
      entries.forEach(entry => {
        const syncedEntry = entry.unsynced ? synced.find(s => s.id === entry.id) || entry : entry;
        if (syncedEntry !== entry) {
          updateEntry(entry.id, { 
            ...syncedEntry,
            unsynced: false 
          });
        }
      });

      setLastSync(timestamp);
    } catch (error) {
      setSyncError(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [entries, updateEntry, isSyncing]);

  return {
    isSyncing,
    syncError,
    lastSync,
    sync
  };
} 