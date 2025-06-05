import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AppLayout } from '@/components/AppLayout';

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Bitte gib dein aktuelles Passwort ein';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Bitte gib ein neues Passwort ein';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Das Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Bitte bestätige dein neues Passwort';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Die Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccess(false);

    const { error } = await supabase.auth.updateUser({
      password: formData.newPassword,
    });

    if (error) {
      setErrors({
        currentPassword: 'Fehler beim Ändern des Passworts. Bitte versuche es erneut.',
      });
    } else {
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Passwort ändern</h1>

        {success && (
          <div className="bg-green-50 p-4 rounded-lg text-green-700">
            Passwort erfolgreich geändert. Du wirst weitergeleitet...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Aktuelles Passwort
              </label>
              <input
                type="password"
                id="currentPassword"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className={`block w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Neues Passwort
              </label>
              <input
                type="password"
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className={`block w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className={`block w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}; 