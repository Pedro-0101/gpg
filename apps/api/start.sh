#!/bin/sh
echo "==> Running database migrations..."
npx prisma migrate deploy || echo "==> Migration warning (continuing anyway)"
echo "==> Starting server..."
exec node dist/server.js
