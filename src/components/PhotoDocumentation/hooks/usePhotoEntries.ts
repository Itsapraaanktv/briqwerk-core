import { useState, useCallback, useEffect } from 'react';
import type { PhotoEntry } from '../types';
import { loadEntries, saveEntries } from '../utils';
// import { syncEntry } from '../../../lib/supabaseClient';

interface UsePhotoEntriesResult {
  entries: PhotoEntry[];
  addEntry: (entry: Omit<PhotoEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updates: Partial<Omit<PhotoEntry, 'createdAt' | 'updatedAt'>>) => void;
}

export function usePhotoEntries(
  onStatusChange?: (message: string) => void
): UsePhotoEntriesResult {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);

  // Lade Einträge aus dem localStorage beim Mounten
  useEffect(() => {
    try {
      const loadedEntries = loadEntries();
      setEntries(loadedEntries);
    } catch (error: unknown) {
      console.error('Error loading entries:', error);
      onStatusChange?.('Fehler beim Laden der Einträge');
    }
  }, [onStatusChange]);

  const addEntry = useCallback((entry: Omit<PhotoEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: PhotoEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      unsynced: true,
      coords: entry.coords || undefined,
      images: entry.images || []
    };

    setEntries(prevEntries => {
      const updatedEntries = [...prevEntries, newEntry];
      try {
        saveEntries(updatedEntries);
        onStatusChange?.('Neuer Eintrag wurde gespeichert');

        // Versuche den Eintrag zu synchronisieren, wenn online
        // syncEntry(newEntry).catch((error: unknown) => {
        //   console.error('Sync error:', error);
        //   // Fehler beim Sync werden ignoriert, da der Eintrag als unsynced markiert ist
        // });

        return updatedEntries;
      } catch (error: unknown) {
        console.error('Error saving entry:', error);
        onStatusChange?.('Fehler beim Speichern des Eintrags');
        return prevEntries;
      }
    });
  }, [onStatusChange]);

  const updateEntry = useCallback((
    id: string, 
    updates: Partial<Omit<PhotoEntry, 'createdAt' | 'updatedAt'>>
  ) => {
    setEntries(prevEntries => {
      const updatedEntries = prevEntries.map(entry =>
        entry.id === id ? {
          ...entry,
          ...updates,
          updatedAt: new Date().toISOString(),
          unsynced: true,
          coords: updates.coords || entry.coords || undefined,
          images: updates.images || entry.images || []
        } : entry
      );
      try {
        saveEntries(updatedEntries);
        onStatusChange?.('Eintrag wurde aktualisiert');

        // Versuche den aktualisierten Eintrag zu synchronisieren
        const updatedEntry = updatedEntries.find(e => e.id === id);
        if (updatedEntry) {
          // syncEntry(updatedEntry).catch((error: unknown) => {
          //   console.error('Error syncing updated entry:', error);
          //   onStatusChange?.('error', error instanceof Error ? error.message : 'Unknown error');
          // });
        }

        return updatedEntries;
      } catch (error: unknown) {
        console.error('Error updating entry:', error);
        onStatusChange?.('Fehler beim Aktualisieren des Eintrags');
        return prevEntries;
      }
    });
  }, [onStatusChange]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prevEntries => {
      const updatedEntries = prevEntries.filter(entry => entry.id !== id);
      try {
        saveEntries(updatedEntries);
        onStatusChange?.('Eintrag wurde gelöscht');
        return updatedEntries;
      } catch (error) {
        console.error('Error deleting entry:', error);
        onStatusChange?.('Fehler beim Löschen des Eintrags');
        return prevEntries;
      }
    });
  }, [onStatusChange]);

  return {
    entries,
    addEntry,
    deleteEntry,
    updateEntry
  };
} 