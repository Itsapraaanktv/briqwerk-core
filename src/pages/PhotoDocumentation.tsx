import { useState, useEffect } from 'react';
import type { DocumentEntry } from '../types';
import { components, typography } from '../styles/design-system';
import PhotoUploadForm from '../components/PhotoUploadForm';
import DocumentList from '../components/DocumentList';

const STORAGE_KEY = 'dokumentationEintraege';

export default function PhotoDocumentation() {
  const [entries, setEntries] = useState<DocumentEntry[]>(() => {
    try {
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      return savedEntries ? JSON.parse(savedEntries) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      return [];
    }
  });

  // Speichere Änderungen im localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge:', error);
    }
  }, [entries]);

  const handleAddEntry = (newEntry: Omit<DocumentEntry, 'id' | 'timestamp'>) => {
    const entry: DocumentEntry = {
      ...newEntry,
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setEntries(prev => [entry, ...prev]);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  return (
    <div className={components.pageContainer}>
      <div className="py-6 md:py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className={typography.h1}>
            📸 Foto-Dokumentation
          </h1>
          <p className={typography.body}>
            Füge neue Fotos mit Beschreibung hinzu oder sieh dir bestehende Einträge an.
          </p>
        </div>

        {/* Upload-Formular */}
        <div className={components.card}>
          <PhotoUploadForm onSubmit={handleAddEntry} />
        </div>

        {/* Liste der Einträge */}
        <DocumentList
          entries={entries}
          onDelete={handleDeleteEntry}
        />
      </div>
    </div>
  );
} 