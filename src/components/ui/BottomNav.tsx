import { Map, Image } from 'lucide-react';

type Tab = 'docs' | 'map';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex items-center justify-around border-t border-gray-200 bg-white py-2">
      <button
        onClick={() => onChange('docs')}
        className={`flex flex-col items-center p-2 ${
          active === 'docs' ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <Image className="h-6 w-6" />
        <span className="text-xs mt-1">Fotos</span>
      </button>
      <button
        onClick={() => onChange('map')}
        className={`flex flex-col items-center p-2 ${
          active === 'map' ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <Map className="h-6 w-6" />
        <span className="text-xs mt-1">Karte</span>
      </button>
    </nav>
  );
} 