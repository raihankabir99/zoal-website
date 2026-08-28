
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditData() {
  console.log('--- DATA AUDIT ---');

  // 1. Get all categories
  const { data: categories, error: catError } = await supabase
    .from('zoal_blog_categories')
    .select('*');

  if (catError) {
    console.error('Error fetching categories:', catError.message);
    return;
  }

  console.log(`Total Categories: ${categories.length}`);
  const catIds = new Set(categories.map(c => c.id));

  // 2. Get all posts
  const { data: posts, error: postError } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, category_id');

  if (postError) {
    console.error('Error fetching posts:', postError.message);
    return;
  }

  console.log(`Total Posts: ${posts.length}`);

  const orphans = posts.filter(p => p.category_id && !catIds.has(p.category_id));
  const noCategory = posts.filter(p => !p.category_id);

  console.log(`Orphaned Posts (Invalid category_id): ${orphans.length}`);
  orphans.forEach(p => console.log(` - Post: ${p.title} (ID: ${p.id}, CatID: ${p.category_id})`));

  console.log(`Posts with NO category_id: ${noCategory.length}`);

  // 3. Check Category Data Quality
  if (categories && categories.length > 0) {
    console.log('\n--- CATEGORY QUALITY ---');
    categories.forEach(c => {
      const issues = [];
      if (!c.name) issues.push('Empty name');
      if (!c.slug) issues.push('Empty slug');
      if (c.display_order === null) issues.push('Null display_order');
      if (c.is_active === null) issues.push('Null is_active');
      
      if (issues.length > 0) {
        console.log(`Category [${c.id}] ${c.name || 'UNNAMED'}:`, issues.join(', '));
      }
    });
  }
}

auditData();
