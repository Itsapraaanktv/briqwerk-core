import { uploadPhoto } from './uploadPhoto';
import { uploadEntry } from './uploadEntry';

export interface OfflineEntry {
  id: string;
  text: string;
  photo: File | string;
  coords?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'offlineEntries';

export const offlineStorage = {
  async saveEntry(entry: OfflineEntry): Promise<void> {
    const entries = this.getEntries();
    entries.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  getEntries(): OfflineEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  removeEntry(id: string): void {
    const entries = this.getEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
  },

  async syncEntries(): Promise<{
    success: number;
    failed: number;
    remaining: number;
  }> {
    if (!navigator.onLine) {
      return { success: 0, failed: 0, remaining: this.getEntries().length };
    }

    const entries = this.getEntries();
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        // Upload photo first
        const photoUrl = await uploadPhoto(entry.photo instanceof File ? entry.photo : new File([entry.photo], 'photo.jpg'));

        // Upload entry
        await uploadEntry({
          note: entry.text,
          photo_url: photoUrl,
          latitude: entry.coords?.lat ?? null,
          longitude: entry.coords?.lng ?? null,
          created_at: entry.createdAt
        });

        // Remove from offline storage after successful sync
        this.removeEntry(entry.id);
        success++;
      } catch (error) {
        console.error('Failed to sync entry:', error);
        failed++;
      }
    }

    return {
      success,
      failed,
      remaining: this.getEntries().length
    };
  },

  hasUnsyncedEntries(): boolean {
    return this.getEntries().length > 0;
  }
}; 