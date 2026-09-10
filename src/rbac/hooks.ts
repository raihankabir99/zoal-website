import { Role, RoleHierarchy, RolePermissions, Permission } from './constants';

const KNOWN_ROLES = new Set<Role>(['customer', 'staff', 'manager', 'admin', 'owner']);

const normalizeRole = (userRole?: string): Role => {
  const candidate = (userRole || '').trim().toLowerCase() as Role;
  return KNOWN_ROLES.has(candidate) ? candidate : 'customer';
};

export const useAccess = (userRole?: string) => {
  const role = normalizeRole(userRole);

  const hasRole = (requiredRole: Role) => {
    const requiredLevel = RoleHierarchy[requiredRole];
    const currentLevel = RoleHierarchy[role];
    if (typeof requiredLevel !== 'number' || typeof currentLevel !== 'number') return false;
    return currentLevel >= requiredLevel;
  };

  const hasPermission = (permission: Permission) => {
    const matrix = RolePermissions[role];
    if (!matrix) return false;

    // Explicit deny always wins.
    if (matrix.blocked.includes(permission)) return false;

    // Permission grants are explicit. Do not infer permissions from role hierarchy.
    return matrix.required.includes(permission);
  };

  const isHidden = (permission: Permission) => {
    const matrix = RolePermissions[role];
    return matrix ? matrix.hidden.includes(permission) : false;
  };

  return { hasRole, hasPermission, isHidden, role };
};
