import { Map, Camera } from 'lucide-react';

type Tab = 'docs' | 'map';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-gray-200 bg-white py-2 px-4 shadow-lg safe-bottom">
      <button
        onClick={() => onChange('docs')}
        className={`
          flex flex-col items-center p-3 rounded-lg transition-all
          ${active === 'docs'
            ? 'text-blue-600 bg-blue-50 scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        aria-label="Dokumentation"
      >
        <Camera className="h-6 w-6" />
        <span className="text-xs font-medium mt-1">Dokumentation</span>
      </button>
      <button
        onClick={() => onChange('map')}
        className={`
          flex flex-col items-center p-3 rounded-lg transition-all
          ${active === 'map'
            ? 'text-blue-600 bg-blue-50 scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        aria-label="Karte"
      >
        <Map className="h-6 w-6" />
        <span className="text-xs font-medium mt-1">Karte</span>
      </button>
    </nav>
  );
} 