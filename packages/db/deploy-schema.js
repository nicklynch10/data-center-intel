import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '../../.env.local') });

async function deploySchema() {
  const migrationSQL = readFileSync('./migrations/0000_talented_inhumans.sql', 'utf-8');
  
  // Clean up the SQL by removing statement-breakpoint comments
  const cleanSQL = migrationSQL.replace(/--> statement-breakpoint/g, '');
  
  const projectRef = 'yhcanadgjcelknnjthbk';
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!apiKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not found');
    process.exit(1);
  }

  console.log('Deploying schema to Supabase...');
  
  try {
    // Execute SQL via Supabase REST API
    const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: cleanSQL })
    });

    if (!response.ok) {
      // Try alternative approach - direct SQL endpoint
      console.log('Trying alternative deployment method...');
      
      // Split into individual statements
      const statements = cleanSQL.split(';').filter(s => s.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim() + ';';
        if (!stmt || stmt === ';') continue;
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // For now, we'll output the SQL for manual execution
        console.log('Statement:', stmt.substring(0, 50) + '...');
      }
      
      console.log('\nSchema deployment requires manual execution via Supabase Dashboard.');
      console.log('Please run the migration file in the SQL Editor.');
      return;
    }

    console.log('Schema deployed successfully!');
  } catch (error) {
    console.error('Deployment error:', error);
    console.log('\nPlease deploy manually via Supabase Dashboard SQL Editor.');
  }
}

deploySchema();