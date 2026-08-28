import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Ensure we have the correct URL format
const rawUrl = process.env.SUPABASE_URL || '';
const url = rawUrl.includes('/rest/v1') ? rawUrl.replace('/rest/v1', '') : rawUrl;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function audit() {
  console.log('--- DATABASE DATA AUDIT ---');

  // 1. Fetch Categories
  const { data: categories, error: catErr } = await supabase
    .from('zoal_blog_categories')
    .select('*');

  if (catErr) {
    console.error('Error fetching categories:', catErr);
  } else {
    console.log(`Total Categories: ${categories?.length || 0}`);
    if (categories && categories.length > 0) {
      console.log('Sample Category Columns:', Object.keys(categories[0]));
      
      // Check for duplicates
      const nameSet = new Set();
      const slugSet = new Set();
      const duplicateNames = [];
      const duplicateSlugs = [];
      const missingArabic = [];
      const invalidIcons = [];
      const allowedIcons = ['coffee', 'bakery', 'fashion', 'business', 'lifestyle', 'news'];

      categories.forEach(c => {
        if (nameSet.has(c.name)) duplicateNames.push(c.name);
        nameSet.add(c.name);

        if (slugSet.has(c.slug)) duplicateSlugs.push(c.slug);
        slugSet.add(c.slug);

        if (!c.name_ar) missingArabic.push(c.name);
        if (c.icon && !allowedIcons.includes(c.icon)) invalidIcons.push({ name: c.name, icon: c.icon });
      });

      console.log('Duplicate Names:', duplicateNames);
      console.log('Duplicate Slugs:', duplicateSlugs);
      console.log('Categories missing name_ar:', missingArabic.length);
      console.log('Invalid Icons:', invalidIcons);
    }
  }

  // 2. Fetch Posts & Check Integrity
  const { data: posts, error: postErr } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, category_id');

  if (postErr) {
    console.error('Error fetching posts:', postErr);
  } else {
    console.log(`Total Posts: ${posts?.length || 0}`);
    if (posts && posts.length > 0) {
      const categoryIds = new Set(categories?.map(c => c.id) || []);
      const orphans = posts.filter(p => p.category_id && !categoryIds.has(p.category_id));
      const nullCategories = posts.filter(p => !p.category_id);

      console.log('Orphan category references:', orphans.length);
      if (orphans.length > 0) {
        console.log('Orphan Samples:', orphans.slice(0, 5));
      }
      console.log('Posts with NULL category_id:', nullCategories.length);
    }
  }
}

audit();
