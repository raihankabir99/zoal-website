export interface EnterpriseNotification {
  id: string;
  user_id?: string;
  user_email?: string;
  assigned_staff_id?: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  archived?: boolean;
  timestamp: string;
  roles?: string[];
  target_role?: 'customer' | 'staff' | 'admin' | 'owner' | 'all';
  action_url?: string;
  metadata?: Record<string, any>;
}

export type NotificationCategory = string;

export interface NotificationAuditReport {
  totalCount: number;
  readCount: number;
  unreadCount: number;
  archivedCount: number;
  averageLatencyMs: number | null;
  alertsProcessed: number | null;
  realtimeScore: number | null;
  coveragePercentage: number | null;
  totalEventsProcessed: number | null;
}
