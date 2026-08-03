#!/usr/bin/env bash
# Dev helper: hit the reading-reminder cron with the bearer token from .env.
# Runs via `npm run cron:reading-reminder` so it's covered by the allowlisted
# `npm run:*` prefix — no per-command prompt for the internal $()/secret read.
#
# Usage:
#   npm run cron:reading-reminder                 # -> http://localhost:3001
#   npm run cron:reading-reminder -- <base-url>   # e.g. https://theveil.app
#
# Note: a user is only a candidate after 7 idle days, and at most once a week
# (User.reminderSentOn). Both show up as `skipped`, not `failed`.
set -euo pipefail

BASE="${1:-http://localhost:3001}"

SECRET="$(grep '^CRON_SECRET=' .env | cut -d= -f2-)"
if [ -z "${SECRET}" ]; then
  echo "CRON_SECRET not found in .env" >&2
  exit 1
fi

curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer ${SECRET}" \
  "${BASE}/api/cron/reading-reminder"
