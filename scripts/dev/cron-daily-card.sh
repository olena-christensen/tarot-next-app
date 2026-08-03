#!/usr/bin/env bash
# Dev helper: hit the daily-card cron with the bearer token from .env.
# Runs via `npm run cron:daily-card` so it's covered by the allowlisted
# `npm run:*` prefix — no per-command prompt for the internal $()/secret read.
#
# Usage:
#   npm run cron:daily-card                 # -> http://localhost:3001
#   npm run cron:daily-card -- <base-url>   # e.g. https://theveil.app
#
# Note: User.dailyCardSentOn makes a same-day rerun a no-op (reported as
# `duplicate`). Clear that column for a user to re-test on the same day.
set -euo pipefail

BASE="${1:-http://localhost:3001}"

SECRET="$(grep '^CRON_SECRET=' .env | cut -d= -f2-)"
if [ -z "${SECRET}" ]; then
  echo "CRON_SECRET not found in .env" >&2
  exit 1
fi

curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer ${SECRET}" \
  "${BASE}/api/cron/daily-card"
