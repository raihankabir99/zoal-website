import { getServiceSupabaseClient } from './backend/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = getServiceSupabaseClient();
  if (!client) {
    console.error('Supabase client not configured or cannot be initialized');
    return;
  }
  
  // List auth users
  const { data: { users }, error } = await client.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching auth users:', error);
    return;
  }

  console.log(`Found ${users.length} Auth users:`);
  for (const u of users) {
    console.log(`ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Metadata:`, u.user_metadata);
  }
}

run();
