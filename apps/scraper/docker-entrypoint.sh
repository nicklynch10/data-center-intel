#!/bin/sh
set -e

# Check if running as worker or CLI
if [ "$RUN_MODE" = "worker" ]; then
  echo "Starting scraper in worker mode..."
  
  # If specific task provided via environment, run single task
  if [ -n "$TASK_ID" ] && [ -n "$COUNTY" ] && [ -n "$STATE" ]; then
    echo "Running single task: $COUNTY, $STATE (Task ID: $TASK_ID)"
    exec node dist/cli.js scrape "$COUNTY" "$STATE" --task-id "$TASK_ID"
  else
    # Otherwise run as continuous worker
    echo "Starting continuous worker..."
    exec node dist/worker.js
  fi
else
  # Run as CLI with provided arguments
  echo "Running scraper CLI..."
  exec node dist/cli.js "$@"
fi