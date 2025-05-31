export type Entry = {
  id: string;
  user_id: string;
  note: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: Entry;
        Insert: Omit<Entry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Entry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}; 