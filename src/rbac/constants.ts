export type Role = 'customer' | 'staff' | 'manager' | 'admin' | 'owner';

export const RoleHierarchy: Record<Role, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export type Permission =
  | 'view_orders'
  | 'manage_orders'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_reports'
  | 'manage_reports'
  | 'manage_users'
  | 'manage_platform';

export interface PermissionMatrix {
  required: Permission[];
  hidden: Permission[];
  blocked: Permission[];
}

// Keep effective permissions compatible with the existing hierarchy while making
// every role's grants explicit so permission checks never infer access implicitly.
export const RolePermissions: Record<Role, PermissionMatrix> = {
  customer: {
    required: ['view_orders'],
    hidden: [],
    blocked: ['manage_platform'],
  },
  staff: {
    required: ['view_orders', 'manage_orders', 'view_inventory'],
    hidden: [],
    blocked: ['manage_platform'],
  },
  manager: {
    required: ['view_orders', 'manage_orders', 'view_inventory', 'manage_inventory', 'view_reports'],
    hidden: [],
    blocked: ['manage_platform'],
  },
  admin: {
    required: ['view_orders', 'manage_orders', 'view_inventory', 'manage_inventory', 'view_reports', 'manage_reports', 'manage_users'],
    hidden: [],
    blocked: [],
  },
  owner: {
    required: ['view_orders', 'manage_orders', 'view_inventory', 'manage_inventory', 'view_reports', 'manage_reports', 'manage_users', 'manage_platform'],
    hidden: [],
    blocked: [],
  },
};
