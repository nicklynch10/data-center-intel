# Database Deployment Instructions

To deploy the database schema to Supabase:

1. Go to your Supabase project: https://app.supabase.com/project/yhcanadgjcelknnjthbk/editor

2. Click "New Query" in the SQL Editor

3. Copy and paste the entire contents of: `packages/db/migrations/0000_talented_inhumans.sql`

4. Click "Run" to execute the migration

5. Verify the tables were created by checking the Table Editor

The migration will create:
- `locations` table - Counties/states being tracked
- `data_centers` table - Data center projects
- `documents` table - Scraped documents and sources
- `scrape_tasks` table - Background task queue

## Testing the Database

After deploying, you can test with:

```sql
-- Insert test location
INSERT INTO locations (county, state) VALUES ('Loudoun', 'VA');

-- Check it was created
SELECT * FROM locations;
```