import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';

interface Settings {
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
  };
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    language: 'de',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
    privacy: {
      showProfile: true,
      showLocation: false,
    },
  });

  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async () => {
    setLoading(true);
    // Here you would typically save the settings to your backend
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated API call
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Einstellungen</h1>

        {/* Language and Theme */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-gray-800">Darstellung</h2>

          {/* Language Selection */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Sprache
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          {/* Theme Selection */}
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
              Design
            </label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-gray-800">Benachrichtigungen</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">
                  E-Mail-Benachrichtigungen
                </label>
                <p className="text-sm text-gray-500">Erhalte wichtige Updates per E-Mail</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="push-notifications" className="text-sm font-medium text-gray-700">
                  Push-Benachrichtigungen
                </label>
                <p className="text-sm text-gray-500">Erhalte Benachrichtigungen auf deinem Gerät</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="inapp-notifications" className="text-sm font-medium text-gray-700">
                  In-App-Benachrichtigungen
                </label>
                <p className="text-sm text-gray-500">Zeige Benachrichtigungen in der App an</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="inapp-notifications"
                  checked={settings.notifications.inApp}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, inApp: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-gray-800">Datenschutz</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="show-profile" className="text-sm font-medium text-gray-700">
                  Profil öffentlich sichtbar
                </label>
                <p className="text-sm text-gray-500">Andere können dein Profil sehen</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="show-profile"
                  checked={settings.privacy.showProfile}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showProfile: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="show-location" className="text-sm font-medium text-gray-700">
                  Standort teilen
                </label>
                <p className="text-sm text-gray-500">Zeige deinen Standort in Einträgen an</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="show-location"
                  checked={settings.privacy.showLocation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showLocation: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}; 