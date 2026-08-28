
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || 'https://jglveforpqhioxpambbq.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

const client = createClient(url, key);

async function test() {
  const start = Date.now();
  console.log('getSession() starting...');
  try {
    const { data, error } = await client.auth.getSession();
    const duration = Date.now() - start;
    console.log(`getSession() resolved in ${duration}ms`);
    console.log('Error:', error);
    console.log('Session exists:', !!data.session);
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`getSession() rejected in ${duration}ms`);
    console.error('Catch Error:', err);
  }
}

test();
