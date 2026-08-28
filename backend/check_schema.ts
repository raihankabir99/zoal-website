
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('--- STARTING SCHEMA & DATA AUDIT ---');

  // 1. Check Categories Table Structure & Data
  console.log('\nChecking zoal_blog_categories...');
  const { data: categories, error: catError } = await supabase
    .from('zoal_blog_categories')
    .select('*');

  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log(`Total categories found: ${categories?.length || 0}`);
    if (categories && categories.length > 0) {
      console.log('First category sample:', JSON.stringify(categories[0], null, 2));
      
      const columns = Object.keys(categories[0]);
      console.log('Available columns:', columns.join(', '));
      
      const missingRequired = ['display_order', 'is_active', 'icon', 'name_ar'].filter(c => !columns.includes(c));
      if (missingRequired.length > 0) {
        console.log('MISSING COLUMNS from Migration 036:', missingRequired.join(', '));
      } else {
        console.log('ALL Migration 036 columns verified.');
      }
    } else {
      console.log('No category data found. Cannot verify columns via select * sample.');
      // Attempt a descriptive query if possible, or just report empty.
    }
  }

  // 2. Check Posts Table category_id references
  console.log('\nChecking zoal_blog_posts category_id references...');
  const { data: posts, error: postError } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, category_id');

  if (postError) {
    console.error('Error fetching posts:', postError);
  } else {
    console.log(`Total posts found: ${posts?.length || 0}`);
    const orphans = posts?.filter(p => p.category_id && !categories?.find(c => c.id === p.category_id));
    console.log(`Orphan category references: ${orphans?.length || 0}`);
    if (orphans && orphans.length > 0) {
      console.log('Orphan samples:', orphans.slice(0, 5));
    }
  }

  console.log('\n--- AUDIT COMPLETE ---');
}

runAudit();
