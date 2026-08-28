
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(url, key);

async function runVerification() {
  console.log('--- 1. DATABASE RECORDS (zoal_homepage_heroes) ---');
  const { data: heroes, error: heroesError } = await supabase
    .from('zoal_homepage_heroes')
    .select('id, hero_title, hero_image_desktop, hero_image_mobile');

  if (heroesError) {
    console.error('Heroes Error:', heroesError);
  } else {
    console.log(JSON.stringify(heroes, null, 2));
  }

  console.log('\n--- 2. STORAGE BUCKET (banners) ---');
  const { data: files, error: storageError } = await supabase
    .storage
    .from('banners')
    .list();

  if (storageError) {
    console.error('Storage Error:', storageError);
  } else {
    console.log(JSON.stringify(files, null, 2));
  }
}

runVerification();
