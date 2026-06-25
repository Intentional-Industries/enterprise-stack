#!/usr/bin/env bash
# Checks all prerequisites are installed before running ./up

MISSING=0

for cmd in aws terraform docker jq node npm; do
  if command -v "$cmd" &>/dev/null; then
    echo "  $cmd: $(command -v "$cmd")"
  else
    echo "  $cmd: NOT FOUND"
    MISSING=1
  fi
done

echo ""

if [ "$MISSING" -eq 0 ]; then
  echo "All prerequisites met."
else
  echo "Install missing tools before running ./up"
  exit 1
fi
