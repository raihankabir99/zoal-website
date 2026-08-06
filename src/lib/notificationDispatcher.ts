export interface DispatchedNotification {
  type: 'cart' | 'wishlist' | 'order' | 'coupon' | 'delivery' | 'system';
  variant?: 'preview' | 'toast' | 'center';
  title: string;
  message: string;
  image?: string;
  duration?: number;
  metadata?: any;
}

type NotificationListener = (notification: DispatchedNotification) => void;

class NotificationDispatcher {
  private listeners: Set<NotificationListener> = new Set();
  private recentDispatches: { key: string; timestamp: number }[] = [];

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(notification: DispatchedNotification) {
    const now = Date.now();
    // Deduplication Key
    const key = `${notification.type}-${notification.title}-${notification.message}`;

    // Filter out items older than 2000ms
    this.recentDispatches = this.recentDispatches.filter(
      (item) => now - item.timestamp <= 2000
    );

    // Check if an identical notification was dispatched within 2000ms
    const isDuplicate = this.recentDispatches.some((item) => item.key === key);
    if (isDuplicate) {
      console.warn(`[NotificationDispatcher] Duplicate notification ignored: ${key}`);
      return;
    }

    this.recentDispatches.push({ key, timestamp: now });
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Error dispatching notification to listener:', err);
      }
    });
  }
}

export const notificationDispatcher = new NotificationDispatcher();

export function dispatchNotification(notification: DispatchedNotification) {
  notificationDispatcher.dispatch(notification);
}
