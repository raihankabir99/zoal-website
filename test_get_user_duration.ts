
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || 'https://jglveforpqhioxpambbq.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

const client = createClient(url, key);

async function test() {
  const start = Date.now();
  console.log('getUser("invalid-token") starting...');
  try {
    const { data, error } = await client.auth.getUser('invalid-token');
    const duration = Date.now() - start;
    console.log(`getUser() resolved in ${duration}ms`);
    console.log('Error:', error?.message);
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`getUser() rejected in ${duration}ms`);
    console.error('Catch Error:', err.message);
  }
}

test();
