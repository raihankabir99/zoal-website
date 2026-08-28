
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Clean URL logic from server/supabase.ts
let supabaseUrl = rawUrl.trim();
if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
if (supabaseUrl.endsWith('/rest/v1')) supabaseUrl = supabaseUrl.slice(0, -8);
if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forensicAudit() {
  console.log('--- FORENSIC DATABASE AUDIT ---');
  console.log('URL:', supabaseUrl);

  // 1. Table Counts
  const tables = [
    'zoal_blog_posts',
    'zoal_blog_categories',
    'zoal_blog_tags',
    'zoal_blog_authors',
    'zoal_blog_comments',
    'zoal_blog_views',
    'zoal_blog_schedules',
    'zoal_blog_media',
    'zoal_blog_seo'
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    } else {
      console.log(`${table}: ${count} records`);
    }
  }

  // 2. Category Schema Inspection
  console.log('\n--- CATEGORY SCHEMA INSPECTION ---');
  const { data: catSample, error: catError } = await supabase.from('zoal_blog_categories').select('*').limit(1);
  if (catError) {
    console.log('Error fetching category sample:', catError.message);
  } else if (catSample && catSample.length > 0) {
    console.log('Sample Category Columns:', Object.keys(catSample[0]));
    console.log('Sample data:', catSample[0]);
  } else {
    console.log('No categories found to inspect schema.');
  }

  // 3. RLS Inspection
  console.log('\n--- RLS VERIFICATION (Public Access Test) ---');
  const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
  
  const publicTables = ['zoal_blog_posts', 'zoal_blog_categories'];
  for (const table of publicTables) {
    const { data: publishedData, error: pubError } = await anonClient.from(table).select('id').limit(1);
    console.log(`Public read on ${table}: ${pubError ? 'FAILED (' + pubError.message + ')' : 'SUCCESS'}`);
  }

  const internalTables = ['zoal_blog_views', 'zoal_blog_schedules'];
  for (const table of internalTables) {
    const { data: internalData, error: intError } = await anonClient.from(table).select('id').limit(1);
    console.log(`Public read on ${table}: ${intError ? 'BLOCKED (' + intError.message + ')' : 'ALLOWED (SECURITY GAP!)'}`);
  }

  // 4. Data Integrity
  console.log('\n--- DATA INTEGRITY CHECK ---');
  const { data: categories } = await supabase.from('zoal_blog_categories').select('id');
  const catIds = new Set(categories?.map(c => c.id) || []);
  
  const { data: posts } = await supabase.from('zoal_blog_posts').select('id, title, category_id');
  const orphans = posts?.filter(p => p.category_id && !catIds.has(p.category_id)) || [];
  console.log(`Orphaned Posts (Invalid category_id): ${orphans.length}`);

  // 5. Inspect increment_view_count RPC
  console.log('\n--- RPC INSPECTION ---');
  // We can't easily inspect RPC definition via JS client without a custom SQL query, 
  // but we can try to call it with a fake ID to see if it exists.
  const { error: rpcErr } = await supabase.rpc('increment_view_count', { post_id: '00000000-0000-0000-0000-000000000000' });
  if (rpcErr && rpcErr.message.includes('function public.increment_view_count() does not exist')) {
    console.log('RPC increment_view_count: MISSING');
  } else {
    console.log('RPC increment_view_count: EXISTS (or failed with expected ID error)');
  }
}

forensicAudit();
