import { EnterpriseNotification } from '../types/notification';

export function filterNotificationsByRole(
  notifications: EnterpriseNotification[],
  currentUser: { id?: string; email?: string; role?: string } | null
): EnterpriseNotification[] {
  if (!currentUser) return [];
  const userRole = (currentUser.role || 'customer').toLowerCase();
  const userId = currentUser.id || currentUser.email;
  const userEmail = currentUser.email?.toLowerCase();

  return notifications.filter(n => {
    // 1. Strict explicit ownership: if notification belongs to a specific user_id or user_email
    if (n.user_id && n.user_id === userId) return true;
    if (n.user_email && userEmail && n.user_email.toLowerCase() === userEmail) return true;

    // Reject if it is explicitly addressed to a different user_id or user_email
    if (n.user_id && n.user_id !== userId) return false;
    if (n.user_email && userEmail && n.user_email.toLowerCase() !== userEmail) return false;

    // 2. Customer Isolation:
    if (userRole === 'customer') {
      // Must NOT see any internal operational alerts
      if (['Inventory Alert', 'Security Alert', 'Revenue Alert', 'System Alert', 'Staff Task', 'Internal Audit'].includes(n.category)) {
        return false;
      }
      if (n.target_role && n.target_role !== 'customer' && n.target_role !== 'all') {
        return false;
      }
      return true;
    }

    // 3. Staff Isolation:
    if (userRole === 'staff') {
      // Must NOT see another staff member's private notifications
      if (n.assigned_staff_id && n.assigned_staff_id !== userId) {
        return false;
      }
      if (n.target_role === 'owner') return false;
      if (n.target_role === 'staff' || n.target_role === 'all') return true;
      return true;
    }

    // 4. Admin Isolation:
    if (userRole === 'admin') {
      // Must NOT see Owner private executive revenue alerts
      if (n.target_role === 'owner') return false;
      return true;
    }

    // 5. Owner Visibility:
    if (userRole === 'owner') {
      return true;
    }

    return true;
  });
}
