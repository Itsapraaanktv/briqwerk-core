import { ReactNode } from 'react';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleBasedAccess({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedAccessProps) {
  const { role, isLoading, error } = useUserRole();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (error || !role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: Omit<RoleBasedAccessProps, 'allowedRoles'>) {
  return (
    <RoleBasedAccess allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function BauleiterAndAbove({ children, fallback }: Omit<RoleBasedAccessProps, 'allowedRoles'>) {
  return (
    <RoleBasedAccess allowedRoles={['admin', 'bauleiter']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
} 