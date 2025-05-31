import { supabase } from './supabaseClient';

export interface EntryPayload {
  note: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface UploadEntryResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}

export async function uploadEntry(data: EntryPayload): Promise<UploadEntryResponse> {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new Error('Nicht eingeloggt. Bitte melden Sie sich an.');
    }

    // Prepare entry data
    const entryData = {
      user_id: session.user.id,
      note: data.note,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      photo_url: data.photo_url || null,
      created_at: data.created_at || new Date().toISOString(),
    };

    // Insert entry
    const { data: insertedEntry, error: insertError } = await supabase
      .from('entries')
      .insert([entryData])
      .select('id')
      .single();

    if (insertError) {
      console.error('Upload error:', insertError);
      throw new Error('Fehler beim Speichern des Eintrags.');
    }

    if (!insertedEntry) {
      throw new Error('Eintrag konnte nicht erstellt werden.');
    }

    return {
      success: true,
      data: {
        id: insertedEntry.id
      }
    };

  } catch (error) {
    console.error('Upload entry error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
    };
  }
} 