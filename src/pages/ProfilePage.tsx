import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AppLayout } from '@/components/AppLayout';

interface Profile {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Load profile data on mount
  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // In this example, we're reading from the Auth user object (user_metadata).
    // If you have a separate 'profiles' table, you would join it here.
    setProfile({
      id: user.id,
      email: user.email!,
      user_metadata: {
        first_name: (user.user_metadata as any).first_name,
        last_name: (user.user_metadata as any).last_name,
        avatar_url: (user.user_metadata as any).avatar_url,
      },
    });
    setFirstName((user.user_metadata as any).first_name || '');
    setLastName((user.user_metadata as any).last_name || '');

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      console.error('Error saving profile:', error.message);
    } else if (user) {
      fetchProfile();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading || !profile) {
    return (
      <AppLayout>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Lade Profil...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center space-y-4">
          {profile.user_metadata.avatar_url ? (
            <img
              src={profile.user_metadata.avatar_url}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              {/* Placeholder Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm-5 8c0-2.21 1.79-4 4-4s4 1.79 4 4H7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <button
            onClick={() => alert('Upload-Funktionalität hier implementieren')}
            className="text-sm text-primary hover:underline"
          >
            Profilbild ändern
          </button>
        </div>

        {/* Form for First and Last Name */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Vorname
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Vorname"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nachname
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Nachname"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              value={profile.email}
              disabled
              className="block w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            Speichern
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-gray-800">Passwort</h2>
          <button
            onClick={() => navigate('/profile/change-password')}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Passwort ändern
          </button>
        </div>

        {/* Email Notifications (Example Checkboxes) */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-gray-800">E-Mail-Benachrichtigungen</h2>
          <div className="flex items-center">
            <input type="checkbox" id="newsletter" className="h-4 w-4 text-primary" />
            <label htmlFor="newsletter" className="ml-2 text-sm text-gray-700">
              Newsletter abonnieren
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="updates" className="h-4 w-4 text-primary" defaultChecked />
            <label htmlFor="updates" className="ml-2 text-sm text-gray-700">
              Update-Mails erhalten
            </label>
          </div>
          <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            Speichern
          </button>
        </div>

        {/* Delete Account */}
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <button
            onClick={async () => {
              const wantsDelete = window.confirm('Möchtest du deinen Account wirklich löschen?');
              if (wantsDelete) {
                const { error } = await supabase.auth.admin.deleteUser(profile.id);
                if (error) {
                  console.error('Error deleting user:', error.message);
                } else {
                  await supabase.auth.signOut();
                  navigate('/login');
                }
              }
            }}
            className="text-red-600 hover:underline"
          >
            Account löschen
          </button>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Abmelden
          </button>
        </div>
      </div>
    </AppLayout>
  );
}; 