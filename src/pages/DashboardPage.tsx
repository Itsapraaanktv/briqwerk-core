import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AppLayout } from '@/components/AppLayout';
import { Plus } from 'lucide-react';

// TypeScript interface for an entry
interface Entry {
  id: number;
  title: string;
  created_at: string;
  // Add other fields as needed (e.g. image_url, latitude, longitude, etc.)
}

// Card component for the horizontal carousel
const EntryCard: React.FC<{ entry: Entry }> = ({ entry }) => {
  return (
    <div className="flex-shrink-0 w-40 h-24 bg-white rounded-lg shadow-sm p-3 mr-4">
      <div className="text-sm font-medium text-gray-800 truncate">{entry.title}</div>
      <div className="mt-2 text-xs text-gray-500">
        {new Date(entry.created_at).toLocaleDateString('de-DE')}
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load data from Supabase
  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('id, title, created_at')
      .returns<Entry[]>()
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading entries:', error.message);
    } else if (data) {
      setEntries(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Handlers for entry actions
  const goToDetail = (id: number) => {
    navigate(`/entries/${id}`);
  };

  const goToEdit = (id: number) => {
    navigate(`/entries/${id}/edit`);
  };

  const deleteEntry = async (id: number) => {
    const confirmDelete = window.confirm('Eintrag wirklich löschen?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) {
      console.error('Error deleting entry:', error.message);
    } else {
      // Reload entries after deletion
      fetchEntries();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 1) Horizontal Card Carousel */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Zuletzt bearbeitete Einträge</h2>
          {loading ? (
            <div className="text-center text-gray-500">Lade...</div>
          ) : entries.length === 0 ? (
            <div className="text-gray-500">Keine Einträge vorhanden.</div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar py-2">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* 2) Entries Table */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Meine Einträge</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="text-gray-500">Lade Einträge...</div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Keine Einträge vorhanden.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {entry.id}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-primary font-medium cursor-pointer"
                        onClick={() => goToDetail(entry.id)}
                      >
                        {entry.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                        <button
                          onClick={() => goToDetail(entry.id)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                        >
                          Anzeigen
                        </button>
                        <button
                          onClick={() => goToEdit(entry.id)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-100"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 hover:bg-red-50"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 3) Fixed "Add" Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[calc(100%-32px)] max-w-md">
        <button
          onClick={() => navigate('/entries/new')}
          className="w-full h-14 bg-primary text-white text-lg font-medium rounded-xl shadow-lg hover:bg-primary/90 flex items-center justify-center space-x-2"
        >
          <Plus className="h-6 w-6" />
          <span>Hinzufügen</span>
        </button>
      </div>
    </AppLayout>
  );
}; 