#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
npx wait-on tcp:db:5432 -t 60000

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Try to run migrations
echo "Running database migrations..."
if ! npx prisma migrate deploy; then
    echo "Migration failed, attempting to create initial schema..."
    
    # Create initial schema if migrations fail
    npx prisma db push --accept-data-loss
    
    # Mark the migration as applied
    npx prisma migrate resolve --applied "init"
fi

# Start the application
echo "Starting the application..."
exec "$@"