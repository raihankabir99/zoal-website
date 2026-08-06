import { Client } from 'pg';
import { SUPABASE_SQL_SCHEMA } from './supabase';

async function setupDatabase() {
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

    console.log('🔄 Executing production-ready ZOAL database schema...');
    
    // Execute the complete SQL Schema (tables, indexes, constraints, and RLS policies)
    await client.query(SUPABASE_SQL_SCHEMA);
    
    console.log('🎉 ZOAL Database Schema executed successfully on Supabase!');
  } catch (error: any) {
    console.error('❌ Error executing database schema:', error.message || error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

setupDatabase();
