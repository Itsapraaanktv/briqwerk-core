import { supabase } from './supabaseClient';

interface PhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface SupabasePhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

export async function uploadEntriesToSupabase(): Promise<void> {
  try {
    // Load entries from localStorage
    const storedEntries = localStorage.getItem('briqwerk_entries');
    if (!storedEntries) {
      console.log('Keine Einträge zum Hochladen gefunden.');
      return;
    }

    const entries: PhotoEntry[] = JSON.parse(storedEntries);
    console.log(`${entries.length} Einträge zum Hochladen gefunden.`);

    // Transform entries to match Supabase schema
    const supabaseEntries: SupabasePhotoEntry[] = entries.map(entry => ({
      id: entry.id,
      imageUrl: entry.imageUrl,
      description: entry.description,
      timestamp: entry.timestamp,
      latitude: entry.location?.latitude || null,
      longitude: entry.location?.longitude || null
    }));

    // Upload to Supabase with upsert (insert or update)
    const { error } = await supabase
      .from('photo_entries')
      .upsert(supabaseEntries, {
        onConflict: 'id',
        ignoreDuplicates: true
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Upload erfolgreich! ${supabaseEntries.length} Einträge synchronisiert.`);
    return;

  } catch (error) {
    console.error('❌ Fehler beim Upload zu Supabase:', error);
    throw error;
  }
} 