/**
 * LEGACY SETUP SCRIPT
 * This script is deprecated. Please use 'npm run migrate' which uses the versioned 
 * migration files in the /migrations directory.
 */
import { Client } from 'pg';

async function setupDatabase() {
  console.warn('⚠️ WARNING: This setup script is deprecated and may be destructive.');
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run legacy setup in production.');
    return;
  }
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully.');
    console.log('ℹ️ Please use "npm run migrate" instead of this script.');
  } catch (error: any) {
    console.error('❌ Error connecting to database:', error.message || error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

setupDatabase();
