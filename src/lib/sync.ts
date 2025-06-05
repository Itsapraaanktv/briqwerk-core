import { supabase } from './supabaseClient';

interface PhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  } | undefined;
}

interface SupabasePhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  last_modified: string;
}

const LAST_SYNC_KEY = 'briqwerk_last_sync';
const ENTRIES_KEY = 'briqwerk_entries';

export async function syncEntriesBidirectional(): Promise<{
  success: boolean;
  message: string;
  syncedCount?: number;
}> {
  try {
    // 1. Get local entries
    const localEntries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]') as PhotoEntry[];
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);

    // 2. Get remote entries that were modified since last sync
    const { data: remoteEntries, error: fetchError } = await supabase
      .from('photo_entries')
      .select('*')
      .gt('last_modified', lastSync || '1970-01-01');

    if (fetchError) throw fetchError;

    // 3. Transform local entries to Supabase format
    const localFormatted = localEntries.map(entry => ({
      id: entry.id,
      imageUrl: entry.imageUrl,
      description: entry.description,
      timestamp: entry.timestamp,
      latitude: entry.location?.latitude || null,
      longitude: entry.location?.longitude || null,
      last_modified: new Date().toISOString()
    }));

    // 4. Upload local entries
    const { error: uploadError } = await supabase
      .from('photo_entries')
      .upsert(localFormatted, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (uploadError) throw uploadError;

    // 5. Transform and merge remote entries into local storage
    if (remoteEntries) {
      const remoteFormatted = remoteEntries.map((entry: SupabasePhotoEntry) => ({
        id: entry.id,
        imageUrl: entry.imageUrl,
        description: entry.description,
        timestamp: entry.timestamp,
        location: entry.latitude && entry.longitude ? {
          latitude: entry.latitude,
          longitude: entry.longitude
        } : undefined
      }));

      // Merge remote entries with local ones, preferring remote versions
      const mergedEntries = [...localEntries];
      remoteFormatted.forEach((remoteEntry: PhotoEntry) => {
        const index = mergedEntries.findIndex(e => e.id === remoteEntry.id);
        if (index >= 0) {
          mergedEntries[index] = remoteEntry;
        } else {
          mergedEntries.push(remoteEntry);
        }
      });

      // Save merged entries back to localStorage
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(mergedEntries));
    }

    // 6. Update last sync timestamp
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);

    const totalSynced = (remoteEntries?.length || 0) + localEntries.length;
    return {
      success: true,
      message: `${totalSynced} Einträge erfolgreich synchronisiert`,
      syncedCount: totalSynced
    };

  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: 'Fehler bei der Synchronisation: ' + (error as Error).message
    };
  }
} 