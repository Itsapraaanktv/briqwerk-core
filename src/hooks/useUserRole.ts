import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export type UserRole = 'admin' | 'bauleiter' | 'gewerk' | null;

interface UseUserRoleReturn {
  role: UserRole;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setRole(data?.role as UserRole || null);
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user role'));
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user?.id]); // Re-fetch when user ID changes

  return {
    role,
    isLoading,
    error,
    refetch: fetchRole
  };
} 