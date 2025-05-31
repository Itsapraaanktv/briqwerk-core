import { Link, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { AdminOnly, BauleiterAndAbove } from './RoleBasedAccess';
import { useUserRole } from '@/hooks/useUserRole';

const navItems = [
  { path: '/', icon: '🏠', label: 'Start', desktopLabel: 'Startseite' },
  { path: '/fotos', icon: '📸', label: 'Fotos', desktopLabel: 'Fotos aufnehmen' },
  { path: '/dokumentation', icon: '📝', label: 'Doku', desktopLabel: 'Dokumentation' },
  { path: '/kartenansicht', icon: '🗺️', label: 'Karte', desktopLabel: 'Kartenansicht' }
];

export function Navigation() {
  const location = useLocation();
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center h-16 px-4 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex-1 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-1">
            <span className="text-2xl mr-2" role="img" aria-hidden="true">🧱</span>
            <h1 className="text-xl font-bold text-gray-900">BriqWerk</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                  ${location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span role="img" aria-hidden="true">{item.icon}</span>
                <span>{item.desktopLabel}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Synchronisieren"
            >
              <span role="img" aria-hidden="true">🔄</span>
              <span className="ml-2">Sync</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <BottomNav />

      {/* Desktop top spacer */}
      <div className="hidden md:block h-16" aria-hidden="true" />

      <nav className="space-y-2">
        {/* Alle Benutzer sehen diese Links */}
        <a href="/dashboard" className="block p-2 hover:bg-gray-100">
          Dashboard
        </a>
        <a href="/profile" className="block p-2 hover:bg-gray-100">
          Profil
        </a>

        {/* Nur Bauleiter und Admin sehen diese Links */}
        <BauleiterAndAbove>
          <a href="/team" className="block p-2 hover:bg-gray-100">
            Team verwalten
          </a>
          <a href="/reports" className="block p-2 hover:bg-gray-100">
            Berichte
          </a>
        </BauleiterAndAbove>

        {/* Nur Admin sieht diese Links */}
        <AdminOnly>
          <a href="/admin" className="block p-2 hover:bg-gray-100 text-blue-600">
            Admin Dashboard
          </a>
          <a href="/settings" className="block p-2 hover:bg-gray-100 text-blue-600">
            System Einstellungen
          </a>
          <a href="/user-management" className="block p-2 hover:bg-gray-100 text-blue-600">
            Benutzerverwaltung
          </a>
        </AdminOnly>

        {/* Rollenspezifische Begrüßung */}
        <div className="p-2 mt-4 text-sm text-gray-600">
          Angemeldet als: {role || 'Benutzer'}
        </div>
      </nav>
    </>
  );
} 