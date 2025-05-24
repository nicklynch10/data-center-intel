import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';
import { validateEnv } from './env-validator';

async function main() {
  console.log('Validating environment...');
  validateEnv();

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});