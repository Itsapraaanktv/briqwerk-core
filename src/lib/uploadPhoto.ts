import { supabase } from './supabaseClient';

/**
 * Uploads a photo to Supabase storage and returns the public URL
 * @param file - The photo file to upload
 * @returns Promise resolving to the public URL of the uploaded photo
 */
export async function uploadPhoto(file: File): Promise<string> {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new Error('Nicht eingeloggt. Bitte melden Sie sich an.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Fehler beim Hochladen des Fotos.');
    }

    // Get public URL
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error('Fehler beim Abrufen der Foto-URL.');
    }

    return data.publicUrl;

  } catch (error) {
    console.error('Upload photo error:', error);
    throw error;
  }
} 