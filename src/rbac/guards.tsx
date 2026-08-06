import React from 'react';
import { Role, Permission } from './constants';
import { useAccess } from './hooks';

interface RoleGuardProps {
  role: Role;
  userRole?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role, userRole, children }) => {
  const { hasRole } = useAccess(userRole);
  return hasRole(role) ? <>{children}</> : null;
};

interface PermissionGuardProps {
  permission: Permission;
  userRole?: string;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, userRole, children }) => {
  const { hasPermission } = useAccess(userRole);
  return hasPermission(permission) ? <>{children}</> : null;
};
