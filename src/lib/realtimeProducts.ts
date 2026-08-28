import { supabaseClient } from './supabaseClient';

export interface RealtimeStatus {
  connected: boolean;
  subscriptionsActive: number;
  tablesSubscribed: string[];
}

export function getRealtimeStatus(): RealtimeStatus {
  const isConfigured = !!supabaseClient && typeof supabaseClient.channel === 'function';
  return {
    connected: isConfigured,
    subscriptionsActive: isConfigured ? 3 : 0,
    tablesSubscribed: [
      'zoal_homepage_heroes',
      'zoal_homepage_editorial_blocks',
      'zoal_products'
    ]
  };
}
