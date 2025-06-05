console.log('MainLayout loaded');

import { useState } from 'react';
import PhotoGrid from './PhotoDocumentation/PhotoGrid';
import { MapView } from './MapView/MapView';
import { BottomNav } from './ui/BottomNav';
import { AddEntryModal } from './PhotoDocumentation/AddEntryModal';
import { FloatingActionButton } from './ui/FloatingActionButton';

export const MainLayout = () => {
  const [activeTab, setActiveTab] = useState<'docs' | 'map'>('docs');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'docs' && <PhotoGrid photos={[]} />}
        {activeTab === 'map' && <MapView />}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setModalOpen(true)} />

      {/* Modal zum neuen Eintrag */}
      {modalOpen && <AddEntryModal onClose={() => setModalOpen(false)} />}

      {/* Bottom Navigation */}
      <BottomNav
        active={activeTab}
        onChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}; 