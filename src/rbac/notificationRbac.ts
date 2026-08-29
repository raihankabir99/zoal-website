import { EnterpriseNotification } from '../types/notification';

type NotificationUser = { id?: string; email?: string; role?: string } | null;

export function filterNotificationsByRole(
  notifications: EnterpriseNotification[],
  currentUser: NotificationUser
): EnterpriseNotification[] {
  if (!currentUser) return [];

  const userRole = (currentUser.role || 'customer').toLowerCase();
  const userId = currentUser.id || currentUser.email;
  const userEmail = currentUser.email?.toLowerCase();

  return notifications.filter((n) => {
    // Explicit user ownership always wins, but a notification explicitly
    // addressed to another user must never leak through role visibility.
    if (n.user_id) return n.user_id === userId;
    if (n.user_email) return !!userEmail && n.user_email.toLowerCase() === userEmail;

    const targetRole = (n.target_role || '').toLowerCase();
    const assignedStaffId = n.assigned_staff_id;

    if (userRole === 'customer') {
      if (targetRole && targetRole !== 'customer' && targetRole !== 'all') return false;
      if (['Inventory Alert', 'Security Alert', 'Revenue Alert', 'System Alert', 'Staff Task', 'Internal Audit'].includes(n.category)) {
        return false;
      }
      return true;
    }

    if (userRole === 'staff') {
      if (assignedStaffId && assignedStaffId !== userId) return false;
      if (targetRole === 'owner' || targetRole === 'admin') return false;
      return !targetRole || targetRole === 'staff' || targetRole === 'all';
    }

    if (userRole === 'admin' || userRole === 'manager') {
      if (assignedStaffId && assignedStaffId !== userId) return false;
      if (targetRole === 'owner') return false;
      if (targetRole === 'staff' && userRole === 'admin') return false;
      return !targetRole || targetRole === 'admin' || targetRole === 'all';
    }

    if (userRole === 'owner') return true;

    return false;
  });
}
