import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AppLayout } from '@/components/AppLayout';

interface EntryFormValues {
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  imageFile: File | null;
}

interface EntryDetail {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const EntryFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [values, setValues] = useState<EntryFormValues>({
    title: '',
    description: '',
    latitude: null,
    longitude: null,
    imageFile: null,
  });
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load existing entry data if in edit mode
  const fetchEntry = async () => {
    if (!id) return;
    setLoading(true);

    const { data: entry, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', Number(id))
      .single();

    if (error) {
      console.error('Error loading entry:', error.message);
    } else if (entry) {
      const typedEntry = entry as EntryDetail;
      setValues({
        title: typedEntry.title,
        description: typedEntry.description,
        latitude: typedEntry.latitude,
        longitude: typedEntry.longitude,
        imageFile: null,
      });
      setExistingImageUrl(typedEntry.image_url);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isEditMode) {
      fetchEntry();
    }
  }, [id]);

  // Input handlers
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setValues((prev) => ({ ...prev, imageFile: file || null }));
  };

  const handleCoordinateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : null,
    }));
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl: string | null = existingImageUrl;

    // 1) Upload image if a new one is selected
    if (values.imageFile) {
      const fileExt = values.imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('entry-images')
        .upload(filePath, values.imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError.message);
      } else {
        const { data } = supabase.storage.from('entry-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
    }

    // 2) Insert or update entry
    const entryData = {
      title: values.title,
      description: values.description,
      latitude: values.latitude,
      longitude: values.longitude,
      image_url: imageUrl,
    };

    if (isEditMode && id) {
      const { error: updateError } = await supabase
        .from('entries')
        .update(entryData)
        .eq('id', Number(id));

      if (updateError) {
        console.error('Error updating entry:', updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('entries')
        .insert(entryData);

      if (insertError) {
        console.error('Error creating entry:', insertError.message);
      }
    }

    setLoading(false);
    navigate('/entries');
  };

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Lade Formular...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={values.title}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Titel eingeben"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              id="description"
              value={values.description}
              onChange={handleChange}
              rows={4}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Beschreibung eingeben..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
            {existingImageUrl && !values.imageFile && (
              <div className="mb-2">
                <img
                  src={existingImageUrl}
                  alt="Aktuelles Bild"
                  className="h-40 w-full object-cover rounded-lg shadow-sm"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600"
            />
          </div>

          {/* GPS Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GPS-Koordinaten
            </label>
            <div className="flex space-x-4">
              <input
                type="number"
                name="latitude"
                id="latitude"
                value={values.latitude ?? ''}
                onChange={handleCoordinateChange}
                step="any"
                placeholder="Breitengrad"
                className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              <input
                type="number"
                name="longitude"
                id="longitude"
                value={values.longitude ?? ''}
                onChange={handleCoordinateChange}
                step="any"
                placeholder="Längengrad"
                className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Koordinaten manuell eingeben oder später auf der Karte auswählen
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isEditMode ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}; 