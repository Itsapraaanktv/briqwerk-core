import { useState } from 'react';
import PhotoUploadForm from './PhotoUploadForm';
import DocumentList from './DocumentList';
import { usePhotoEntries } from './hooks/usePhotoEntries';
import { usePhotoSync } from './hooks/usePhotoSync';

export default function PhotoDocumentation() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { entries, addEntry, deleteEntry, updateEntry } = usePhotoEntries();
  const { isSyncing, lastSync, sync } = usePhotoSync(entries, updateEntry);

  return (
    <div className="space-y-8">
      <PhotoUploadForm onSubmit={addEntry} />
      <DocumentList
        entries={entries}
        onDelete={deleteEntry}
        onUpdate={updateEntry}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSyncing={isSyncing}
        lastSync={lastSync}
        onSync={sync}
      />
    </div>
  );
}

export { default as PhotoUploadForm } from './PhotoUploadForm';
export { default as DocumentList } from './DocumentList';
export type { PhotoEntry } from './types';
export * from './ExportPanel'; 