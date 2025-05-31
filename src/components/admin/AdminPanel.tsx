import { useState, useEffect } from 'react';
import { AdminOnly } from '../RoleBasedAccess';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { AssignRoleModal } from './AssignRoleModal';
import type { UserRole } from '@/hooks/useUserRole';

interface User {
  id: string;
  email: string;
  role?: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Fetch all users from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (authError) throw authError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine user data with roles
      const usersWithRoles = authUsers.map(user => ({
        ...user,
        role: userRoles.find(role => role.user_id === user.id)?.role || undefined
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Fehler',
        description: 'Benutzer konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .rpc('toggle_user_status', {
          user_id: userId,
          new_status: !currentStatus
        });

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: `Benutzer wurde ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`,
        variant: 'default'
      });

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminOnly fallback={<div>Keine Berechtigung für diese Seite.</div>}>
      <div className="p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => fetchUsers()}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        {isLoading ? (
          <div>Lädt...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Letzter Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'bauleiter' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'gewerk' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {user.role || 'Keine Rolle'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="ml-2 text-sm text-blue-600 hover:text-blue-900"
                      >
                        Ändern
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {user.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : 'Nie'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Rolle zuweisen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUser && (
          <AssignRoleModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={fetchUsers}
            userId={selectedUser.id}
            currentRole={selectedUser.role || 'gewerk'}
            userEmail={selectedUser.email}
          />
        )}
      </div>
    </AdminOnly>
  );
} 