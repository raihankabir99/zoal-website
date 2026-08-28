
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const fallbackUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const fallbackKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

console.log('SUPABASE_URL matches fallback:', url === fallbackUrl);
console.log('SUPABASE_ANON_KEY matches fallback:', key === fallbackKey);
console.log('SUPABASE_URL starts with https:', url.startsWith('https://'));
console.log('SUPABASE_ANON_KEY starts with eyJ:', key.startsWith('eyJ'));
console.log('SUPABASE_ANON_KEY length:', key.length);
