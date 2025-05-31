export interface DocumentEntry {
  id: string;
  text: string;
  timestamp: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  photo?: string; // base64 oder blob URL
} 