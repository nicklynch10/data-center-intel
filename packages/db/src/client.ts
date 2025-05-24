import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment');
}

const connectionString = `postgresql://postgres.yhcanadgjcelknnjthbk:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });

export { schema };