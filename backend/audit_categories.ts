import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL!.replace('/rest/v1', '');
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function audit() {
  const { data: posts, error: postErr } = await supabase.from('zoal_blog_posts').select('*').limit(1);
  console.log('Posts:', posts);
  console.log('Post Error:', postErr);
}

audit();
