#!/usr/bin/env bash
# Dev helper: hit the renewal cron with the bearer token from .env.
# Runs via `npm run cron:renew` so it's covered by the allowlisted `npm run:*`
# prefix — no per-command permission prompt for the internal $()/secret read.
#
# Usage:
#   npm run cron:renew                 # -> http://localhost:3001
#   npm run cron:renew -- <base-url>   # e.g. a tunnel or the deployed app
set -euo pipefail

BASE="${1:-http://localhost:3001}"

SECRET="$(grep '^CRON_SECRET=' .env | cut -d= -f2-)"
if [ -z "${SECRET}" ]; then
  echo "CRON_SECRET not found in .env" >&2
  exit 1
fi

curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer ${SECRET}" \
  "${BASE}/api/cron/renew"
