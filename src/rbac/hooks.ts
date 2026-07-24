import { Role, RoleHierarchy, RolePermissions, Permission } from './constants';

export const useAccess = (userRole?: string) => {
  const role = (userRole || 'customer') as Role;

  const hasRole = (requiredRole: Role) => {
    return RoleHierarchy[role] >= RoleHierarchy[requiredRole];
  };

  const getAllPermissions = (currentRole: Role): Permission[] => {
    const roles: Role[] = ['customer', 'staff', 'manager', 'admin', 'owner'];
    const currentHierarchy = RoleHierarchy[currentRole];
    let allPermissions: Permission[] = [];
    
    roles.forEach(r => {
      if (RoleHierarchy[r] <= currentHierarchy) {
        allPermissions = [...allPermissions, ...RolePermissions[r].required];
      }
    });
    return Array.from(new Set(allPermissions));
  };

  const hasPermission = (permission: Permission) => {
    // 1. Check if blocked for current role
    if (RolePermissions[role].blocked.includes(permission)) return false;
    
    // 2. Check if explicitly allowed (required) or inherited
    const allPermissions = getAllPermissions(role);
    return allPermissions.includes(permission);
  };
  
  const isHidden = (permission: Permission) => {
    return RolePermissions[role].hidden.includes(permission);
  };

  return { hasRole, hasPermission, isHidden, role };
};
