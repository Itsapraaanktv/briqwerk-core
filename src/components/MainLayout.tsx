import { useState } from 'react';
import PhotoGrid from './PhotoDocumentation/PhotoGrid';
import { MapView } from './MapView/MapView';
import { BottomNav } from './ui/BottomNav';
import { AddEntryModal } from './PhotoDocumentation/AddEntryModal';
import { FloatingActionButton } from './ui/FloatingActionButton';

// Build version timestamp
const BUILD_VERSION = new Date().toISOString();

export const MainLayout = () => {
  const [activeTab, setActiveTab] = useState<'docs' | 'map'>('docs');
  const [modalOpen, setModalOpen] = useState(false);
  const [entriesVersion, setEntriesVersion] = useState(0);

  // Handle new entry saved
  const handleEntrySaved = () => {
    setEntriesVersion((v: number) => v + 1); // Trigger a reload of PhotoGrid and MapView
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Build Version Indicator */}
      <div className="fixed bottom-20 right-4 text-xs text-gray-400 pointer-events-none select-none">
        Build: {BUILD_VERSION}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        {/* Documentation View */}
        <div 
          className={activeTab === 'docs' ? 'block h-full' : 'hidden'} 
          aria-hidden={activeTab !== 'docs'}
        >
          <PhotoGrid key={entriesVersion} />
        </div>

        {/* Map View */}
        <div 
          className={activeTab === 'map' ? 'block h-full' : 'hidden'} 
          aria-hidden={activeTab !== 'map'}
        >
          <MapView key={entriesVersion} />
        </div>
      </main>

      {/* Floating Action Button - only visible in docs tab */}
      {activeTab === 'docs' && (
        <FloatingActionButton onClick={() => setModalOpen(true)} />
      )}

      {/* Add Entry Modal */}
      {modalOpen && (
        <AddEntryModal 
          onClose={() => setModalOpen(false)} 
          onSave={handleEntrySaved}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
      />
    </div>
  );
}; 