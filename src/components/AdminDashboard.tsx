import { useEffect, useState } from 'react';
import { AdminOnly } from './RoleBasedAccess';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from './ui/use-toast';
import type { UserRole } from '@/hooks/useUserRole';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

type UserRoleResponse = {
  id: string;
  role: UserRole;
  created_at: string;
  user: {
    id: string;
    email: string;
  };
};

export function AdminDashboard() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role, created_at, user:user_id (id, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion nach Validierung
      const validatedData = (data as unknown as UserRoleResponse[]).filter(
        (item): item is UserRoleResponse => 
          typeof item.id === 'string' &&
          typeof item.role === 'string' &&
          ['admin', 'bauleiter', 'gewerk'].includes(item.role) &&
          typeof item.created_at === 'string' &&
          item.user &&
          typeof item.user.id === 'string' &&
          typeof item.user.email === 'string'
      );

      const formattedUsers = validatedData.map(item => ({
        id: item.user.id,
        email: item.user.email,
        role: item.role,
        created_at: item.created_at
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Benutzerrolle wurde aktualisiert",
        variant: "default"
      });

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Fehler",
        description: "Rolle konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminOnly fallback={<div>Keine Berechtigung für diese Seite.</div>}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Benutzerverwaltung</h1>
        
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
                      <select
                        value={user.role || 'gewerk'}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="gewerk">Gewerk</option>
                        <option value="bauleiter">Bauleiter</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => fetchUsers()}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Aktualisieren
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminOnly>
  );
} 