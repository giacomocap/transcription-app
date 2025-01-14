#!/bin/sh

# Generate Prisma client (in case of schema changes)
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start the application
exec "$@"
