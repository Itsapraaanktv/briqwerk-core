import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AppLayout } from '@/components/AppLayout';

interface EntryDetail {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export const EntryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEntry = async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', Number(id))
      .returns<EntryDetail>()
      .single();

    if (error) {
      console.error('Error loading entry:', error.message);
    } else if (data) {
      setEntry(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Eintrag wirklich löschen?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('entries').delete().eq('id', Number(id));
    if (error) {
      console.error('Error deleting entry:', error.message);
    } else {
      navigate('/entries');
    }
  };

  if (loading || !entry) {
    return (
      <AppLayout>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Lade Eintrag...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header with Title and Date */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">{entry.title}</h1>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 px-3 py-1 rounded-md"
          >
            Löschen
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Erstellt am: {new Date(entry.created_at).toLocaleDateString('de-DE')}
        </div>

        {/* Description */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-700">{entry.description}</p>
        </div>

        {/* Image (if available) */}
        {entry.image_url && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={entry.image_url}
              alt={entry.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* GPS Coordinates */}
        {entry.latitude !== null && entry.longitude !== null && (
          <div className="space-y-2">
            <div className="text-sm text-gray-500">
              GPS: {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
            </div>
            <div className="h-48 rounded-lg overflow-hidden shadow-sm bg-gray-100">
              {/* Map placeholder - you can integrate a map library like Leaflet here */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Kartenansicht
              </div>
            </div>
          </div>
        )}

        {/* Edit Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/entries/${id}/edit`)}
            className="w-full max-w-sm bg-gray-100 text-gray-800 py-3 rounded-lg shadow hover:bg-gray-200"
          >
            Bearbeiten
          </button>
        </div>
      </div>
    </AppLayout>
  );
}; 