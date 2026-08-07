import pg from 'pg';
import dotenv from 'dotenv';
import { PRODUCTS } from './src/data';

dotenv.config();

const { Client } = pg;

// Simulate frontend resolution (simplification)
function resolveProductImage(p: any) {
  // If images array exists and has a first element, use it.
  if (p.images && p.images.length > 0) return p.images[0];
  // If image_urls exists and has first, use it.
  if (p.image_urls && p.image_urls.length > 0) return p.image_urls[0];
  // Finally try image or image_url fields.
  return p.image || p.image_url || 'N/A';
}

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const ids = ['b1', 'b3', 'm1', 'm2', 'f1', 'p1', 'p2', 'custom-prod-1785966765207', 'custom-prod-1786025387655', 'custom-prod-1786071147115'];

    console.log('| Product ID | Product Name | DB Image (Raw) | Resolved Image (Simulated) | Unique? |');
    console.log('|------------|--------------|----------------|----------------------------|---------|');

    const imageMap: Record<string, string[]> = {};

    for (const id of ids) {
      const res = await client.query('SELECT name, data FROM zoal_supabase_products WHERE friendly_id = $1', [id]);
      
      let dbData = { images: [], image_urls: [], image: '', image_url: '' };
      let name = 'Unknown';
      if (res.rows.length > 0) {
        name = res.rows[0].name;
        dbData = typeof res.rows[0].data === 'string' ? JSON.parse(res.rows[0].data) : res.rows[0].data;
      }

      const resolved = resolveProductImage(dbData);
      if (resolved !== 'N/A') {
        if (!imageMap[resolved]) imageMap[resolved] = [];
        imageMap[resolved].push(id);
      }

      console.log(`| ${id} | ${name} | ${JSON.stringify(dbData.images)} | ${resolved} | ${!imageMap[resolved] || imageMap[resolved].length === 1 ? 'Yes' : 'No (' + imageMap[resolved].length + ')'} |`);
    }
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

verify();
