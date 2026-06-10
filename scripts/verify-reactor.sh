#!/usr/bin/env bash
# Verify the TPB Creative Reactor knowledge loop end to end against a running
# deployment (local or Vercel). Exercises: live stats -> paste ingest ->
# library search -> real agent stream. No keys needed here — it talks to the
# deployed app, which holds the keys.
#
# Usage:
#   BASE_URL=https://your-app.vercel.app ./scripts/verify-reactor.sh
#   ./scripts/verify-reactor.sh            # defaults to http://localhost:3000

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
dim()   { printf '\033[2m%s\033[0m\n' "$1"; }

check() { # name, condition (0=pass)
  if [ "$2" -eq 0 ]; then green "  PASS  $1"; PASS=$((PASS+1));
  else red "  FAIL  $1"; FAIL=$((FAIL+1)); fi
}

echo "Verifying Reactor at: $BASE_URL"
echo

# 1. Stats — is the knowledge layer live (real DB) or demo?
echo "1. Knowledge layer status"
STATS=$(curl -s "$BASE_URL/api/vault/stats")
LIVE=$(printf '%s' "$STATS" | grep -o '"live":[a-z]*' | head -1 | cut -d: -f2)
TOTAL=$(printf '%s' "$STATS" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
dim "   $STATS" | head -c 200; echo
if [ "$LIVE" = "true" ]; then
  green "  LIVE  Supabase + store reachable ($TOTAL chunks stored)"; PASS=$((PASS+1))
else
  red "  DEMO  Store not reachable — check Supabase env vars + schema.reactor.sql"; FAIL=$((FAIL+1))
fi
echo

# 2. Ingest a probe chunk — does it actually embed + persist?
echo "2. Paste-text ingest (Voyage embeddings + persistence)"
STAMP="reactor-probe-$(date +%s)"
ING=$(curl -s -X POST "$BASE_URL/api/vault/ingest" \
  -H 'Content-Type: application/json' \
  -d "{\"system\":\"vault\",\"category\":\"Verification\",\"title\":\"$STAMP\",\"content\":\"Probe: fixed-price guarantee removes the cost-blowout objection for builders.\"}")
dim "   $ING" | head -c 200; echo
STORED=$(printf '%s' "$ING" | grep -o '"stored":[a-z]*' | head -1 | cut -d: -f2)
check "ingest persisted (stored:true → Voyage + DB working)" $([ "$STORED" = "true" ] && echo 0 || echo 1)
echo

# 3. Retrieve it back via search.
echo "3. Library search (round-trip retrieval)"
sleep 1
FOUND=$(curl -s "$BASE_URL/api/vault/list?q=fixed-price%20cost-blowout&limit=5")
check "probe chunk retrievable by search" $(printf '%s' "$FOUND" | grep -q "$STAMP" && echo 0 || echo 1)
echo

# 4. Campaign Reactor stream — is the real agent firing?
echo "4. Campaign Reactor agent stream"
STREAM=$(curl -s -N -X POST "$BASE_URL/api/campaign-reactor" \
  -H 'Content-Type: application/json' \
  -d '{"angle":"Profit","outputs":["Hook"]}' --max-time 60)
check "stream emitted concept/done events" $(printf '%s' "$STREAM" | grep -qE '"type":"(concept|done)"' && echo 0 || echo 1)
echo

echo "----------------------------------------"
green "PASS: $PASS"; [ "$FAIL" -gt 0 ] && red "FAIL: $FAIL" || green "FAIL: 0"
echo
dim "Note: leftover '$STAMP' probe chunk is harmless — delete it from the Vault Library if you like."
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
