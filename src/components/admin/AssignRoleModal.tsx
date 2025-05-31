import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { UserRole } from '@/hooks/useUserRole';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string | undefined;
  currentRole: UserRole;
  userEmail: string | undefined;
}

export function AssignRoleModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  currentRole,
  userEmail
}: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'gewerk');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userId || !selectedRole) return;

    try {
      setIsLoading(true);

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      let error;
      if (existingRole) {
        // Update existing role
        ({ error } = await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', userId));
      } else {
        // Insert new role
        ({ error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: selectedRole }]));
      }

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Rolle wurde erfolgreich zugewiesen',
        variant: 'default'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht zugewiesen werden',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/30 z-50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
          <h2 className="text-lg font-semibold mb-4">
            Rolle zuweisen
          </h2>
          
          {userEmail && (
            <p className="text-sm text-gray-600 mb-4">
              Benutzer: {userEmail}
            </p>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle auswählen
            </label>
            <select
              value={selectedRole || ''}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="gewerk">Gewerk</option>
              <option value="bauleiter">Bauleiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 