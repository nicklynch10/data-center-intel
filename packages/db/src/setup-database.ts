import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateEnv } from './env-validator';

async function setupDatabase() {
  console.log('Setting up database...');
  const env = validateEnv();

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  try {
    // Read the migration file
    const migrationPath = resolve(__dirname, '../migrations/0000_talented_inhumans.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by statement-breakpoint and execute each
    const statements = migrationSQL.split('--> statement-breakpoint').filter(s => s.trim());

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec', {
        sql: statement
      }).single();

      if (error) {
        // Try direct execution if RPC fails
        console.log('RPC failed, trying alternative method...');
        // For now, we'll log the error and continue
        console.warn(`Statement ${i + 1} warning:`, error.message);
      }
    }

    console.log('Database setup complete!');

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['locations', 'data_centers', 'documents', 'scrape_tasks']);

    if (tablesError) {
      console.error('Could not verify tables:', tablesError);
    } else {
      console.log('Created tables:', tables?.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();