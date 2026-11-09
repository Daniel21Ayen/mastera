import React from 'react';
import { AdminRole } from '@mastera/contracts';

export interface RoleScopeGateProps {
  currentRole: AdminRole;
  allowedRoles: AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders UI elements based on the authoritative Section 4.2 role-permission matrix.
 */
export function RoleScopeGate({
  currentRole,
  allowedRoles,
  children,
  fallback = null,
}: RoleScopeGateProps): React.ReactElement | null {
  if (!allowedRoles.includes(currentRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
