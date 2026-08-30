import { useState, useEffect, useMemo, useCallback } from 'react';
import { EnterpriseNotification, NotificationAuditReport } from '../types/notification';
import { filterNotificationsByRole } from '../rbac/notificationRbac';
import { supabaseClient } from './supabaseClient';


export function useNotificationEngine(currentUser: any) {
  const [notifications, setNotifications] = useState<EnterpriseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Initial Fetch & Realtime Subscription
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const userId = currentUser.id || currentUser.email;
    const userRole = (currentUser.role || 'customer').toLowerCase();

    // 1. Initial Fetch from Supabase Table `zoal_notifications`
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        let query = supabaseClient.from('zoal_notifications').select('*').order('timestamp', { ascending: false }).limit(50);
        
        // Security filtering in query level
        if (userRole === 'customer') {
          query = query.or(`user_id.eq.${userId},user_email.eq.${currentUser.email}`);
        } else if (userRole === 'staff') {
          query = query.or(`assigned_staff_id.eq.${userId},target_role.eq.staff,target_role.eq.all`);
        } else if (userRole === 'admin') {
          query = query.or(`target_role.eq.admin,target_role.eq.all,user_id.eq.${userId}`);
        }
        
        const { data, error } = await query;

        if (error) {
          console.warn('⚠️ Supabase notifications fetch info:', error.message);
        }

        if (isMounted) {
          if (data && data.length > 0) {
            setNotifications(data as EnterpriseNotification[]);
          } else {
            setNotifications([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to fetch notifications:', err.message);
          setNotifications([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();

    // 2. Realtime Postgres Changes Subscription
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channelName = `zoal-notifs-${userId || 'anon'}-${Date.now()}-${uniqueId}`;
    let channel: any = null;
    try {
      channel = supabaseClient
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'zoal_notifications'
          },
          (payload: any) => {
            if (!isMounted) return;
            const newOrUpdated = (payload.new || {}) as EnterpriseNotification;
            
            // Verify user isolation rule before adding to state
            const allowed = filterNotificationsByRole([newOrUpdated], currentUser);
            if (allowed.length === 0 && payload.eventType !== 'DELETE') return;

            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [newOrUpdated, ...prev.filter(n => n.id !== newOrUpdated.id)]);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === newOrUpdated.id ? { ...n, ...newOrUpdated } : n));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id;
              if (deletedId) {
                setNotifications(prev => prev.filter(n => n.id !== deletedId));
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            setConnectionStatus('connected');
          }
        });
    } catch (e) {
      console.warn('Realtime channel subscription setup skipped:', e);
    }

    // 3. Cleanup on unmount / user change (Prevents memory leaks and duplicate subscriptions)
    return () => {
      isMounted = false;
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.role]);

  // Online / Offline monitors
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('connected');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filtering notifications for currentUser (Double lock security)
  const userNotifications = useMemo(() => {
    return filterNotificationsByRole(notifications, currentUser);
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read && !n.archived).length;
  }, [userNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    let previousState: EnterpriseNotification[] = [];
    setNotifications(prev => {
      previousState = prev;
      return prev.map(n => (n.id === id ? { ...n, read: true } : n));
    });
    try {
      const { error } = await supabaseClient.from('zoal_notifications').update({ read: true }).eq('id', id);
      if (error) {
        setNotifications(previousState);
        console.error('Failed to mark notification as read in DB:', error.message);
        throw error;
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in markAsRead:', e);
      throw e;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    let previousState: EnterpriseNotification[] = [];
    setNotifications(prev => {
      previousState = prev;
      return prev.map(n => ({ ...n, read: true }));
    });
    try {
      const ids = userNotifications.map(n => n.id);
      if (ids.length > 0) {
        const { error } = await supabaseClient.from('zoal_notifications').update({ read: true }).in('id', ids);
        if (error) {
          setNotifications(previousState);
          console.error('Failed to mark all notifications as read in DB:', error.message);
          throw error;
        }
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in markAllAsRead:', e);
      throw e;
    }
  }, [userNotifications]);

  const archiveNotification = useCallback(async (id: string) => {
    let previousState: EnterpriseNotification[] = [];
    setNotifications(prev => {
      previousState = prev;
      return prev.map(n => (n.id === id ? { ...n, archived: true } : n));
    });
    try {
      const { error } = await supabaseClient.from('zoal_notifications').update({ archived: true }).eq('id', id);
      if (error) {
        setNotifications(previousState);
        console.error('Failed to archive notification in DB:', error.message);
        throw error;
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in archiveNotification:', e);
      throw e;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    let previousState: EnterpriseNotification[] = [];
    setNotifications(prev => {
      previousState = prev;
      return prev.filter(n => n.id !== id);
    });
    try {
      const { error } = await supabaseClient.from('zoal_notifications').delete().eq('id', id);
      if (error) {
        setNotifications(previousState);
        console.error('Failed to delete notification from DB:', error.message);
        throw error;
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in deleteNotification:', e);
      throw e;
    }
  }, []);

  const clearAll = useCallback(async () => {
    let previousState: EnterpriseNotification[] = [];
    const idsToClear = userNotifications.map(n => n.id);
    setNotifications(prev => {
      previousState = prev;
      return prev.filter(n => !idsToClear.includes(n.id));
    });
    try {
      if (idsToClear.length > 0) {
        const { error } = await supabaseClient.from('zoal_notifications').delete().in('id', idsToClear);
        if (error) {
          setNotifications(previousState);
          console.error('Failed to clear notifications from DB:', error.message);
          throw error;
        }
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in clearAll:', e);
      throw e;
    }
  }, [userNotifications]);

  const addNotification = useCallback(async (newNotif: Partial<EnterpriseNotification>) => {
    const notifObj: EnterpriseNotification = {
      id: newNotif.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`),
      user_id: newNotif.user_id || currentUser?.id,
      user_email: newNotif.user_email || currentUser?.email,
      assigned_staff_id: newNotif.assigned_staff_id,
      title: newNotif.title || 'Notification',
      message: newNotif.message || '',
      category: newNotif.category || 'System',
      priority: newNotif.priority || 'medium',
      read: false,
      archived: false,
      timestamp: newNotif.timestamp || new Date().toISOString(),
      roles: newNotif.roles || (currentUser?.role ? [currentUser.role] : ['customer']),
      target_role: newNotif.target_role,
      action_url: newNotif.action_url,
      metadata: newNotif.metadata
    };

    let previousState: EnterpriseNotification[] = [];
    setNotifications(prev => {
      previousState = prev;
      return [notifObj, ...prev];
    });

    try {
      const { error } = await supabaseClient.from('zoal_notifications').insert([notifObj]);
      if (error) {
        setNotifications(previousState);
        console.error('Failed to insert notification into DB:', error.message);
        throw error;
      }
    } catch (e: any) {
      setNotifications(previousState);
      console.error('Error in addNotification:', e);
      throw e;
    }
  }, [currentUser]);

  const auditReport = useMemo<NotificationAuditReport>(() => {
    const totalCount = userNotifications.length;
    const readCount = userNotifications.filter(n => n.read).length;
    const unread = userNotifications.filter(n => !n.read && !n.archived).length;
    const archivedCount = userNotifications.filter(n => n.archived).length;
    
    return {
      totalCount,
      readCount,
      unreadCount: unread,
      archivedCount,
      timestamp: new Date().toISOString()
    };
  }, [userNotifications]);

  return {
    notifications: userNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
    addNotification,
    auditReport,
    soundEnabled,
    setSoundEnabled,
    isOnline,
    connectionStatus
  };
}
