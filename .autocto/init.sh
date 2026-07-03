#!/bin/bash
set -e

PORT=3000
HEALTH_CHECK="http://localhost:3000"

# Check if app is already running
if nc -z localhost $PORT 2>/dev/null; then
  echo "[AutoCTO] App already running on port $PORT"
else
  echo "[AutoCTO] Starting app..."
  npm run dev &
  HARNESS_STARTED_PID=$!
  npx wait-on $HEALTH_CHECK --timeout 60000
  echo "[AutoCTO] App started (PID: $HARNESS_STARTED_PID)"
fi

# Verify health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK)
if [[ ! "$HTTP_STATUS" =~ ^2 ]]; then
  echo "[AutoCTO] Health check failed — HTTP $HTTP_STATUS from $HEALTH_CHECK"
  exit 1
fi

echo "[AutoCTO] App ready at $HEALTH_CHECK"
