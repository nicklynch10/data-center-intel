#!/bin/bash
set -e

# Load environment variables
source ../../.env.local

# Read the migration SQL
MIGRATION_SQL=$(cat migrations/0000_talented_inhumans.sql)

# Create the request payload
cat > /tmp/supabase-migration.json << EOF
{
  "query": "$MIGRATION_SQL"
}
EOF

# Execute via Supabase Management API
echo "Executing database migration..."

# Note: This would normally require Supabase Management API access
# For now, we'll output instructions for manual execution

echo "
Please execute the following SQL in your Supabase SQL Editor:

1. Go to https://app.supabase.com/project/yhcanadgjcelknnjthbk/editor
2. Click 'New Query'
3. Paste the contents of migrations/0000_talented_inhumans.sql
4. Click 'Run'

The migration file is located at:
packages/db/migrations/0000_talented_inhumans.sql
"

echo "Once complete, the database will have the following tables:"
echo "- locations"
echo "- data_centers"
echo "- documents"
echo "- scrape_tasks"