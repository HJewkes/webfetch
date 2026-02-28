#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION="${1:?Usage: smoke.sh <version>}"
RESULTS_DIR="$PROJECT_DIR/docs/diagnostic/$VERSION"
FIXTURES="$SCRIPT_DIR/fixtures/urls.json"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

mkdir -p "$RESULTS_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0
RESULTS="[]"

count=$(jq length "$FIXTURES")
for i in $(seq 0 $((count - 1))); do
  entry=$(jq -r ".[$i]" "$FIXTURES")
  id=$(echo "$entry" | jq -r '.id')
  url=$(echo "$entry" | jq -r '.url')
  desc=$(echo "$entry" | jq -r '.description')
  flags=$(echo "$entry" | jq -r '.flags | join(" ")')
  expected_exit=$(echo "$entry" | jq -r '.expect.exit_code')
  expected_tier=$(echo "$entry" | jq -r '.expect.tier')
  expected_ext=$(echo "$entry" | jq -r '.expect.output_ext')
  min_length=$(echo "$entry" | jq -r '.expect.min_content_length')
  expect_cached=$(echo "$entry" | jq -r '.expect.expect_cached // false')

  printf "%-6s %-50s " "$id" "$desc"

  # Run webfetch
  start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  stderr_file=$(mktemp)
  stdout_file=$(mktemp)
  set +e
  npx tsx "$PROJECT_DIR/src/cli.ts" $url $flags --output "$TMPDIR" \
    >"$stdout_file" 2>"$stderr_file"
  actual_exit=$?
  set -e
  end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  duration_ms=$((end_ms - start_ms))

  stderr_content=$(cat "$stderr_file")
  stdout_content=$(cat "$stdout_file")

  # Validate
  errors=""

  # Exit code
  if [ "$actual_exit" != "$expected_exit" ]; then
    errors="${errors}exit_code: expected $expected_exit got $actual_exit; "
  fi

  # Tier (from stderr)
  if [ "$expected_tier" != "null" ]; then
    actual_tier=$(echo "$stderr_content" | grep -oE 'tier: [a-z]+' | head -1 | sed 's/tier: //' || echo "none")
    if [ "$actual_tier" != "$expected_tier" ]; then
      errors="${errors}tier: expected $expected_tier got $actual_tier; "
    fi
  fi

  # Output file
  if [ "$expected_ext" != "null" ]; then
    output_file=$(echo "$stdout_content" | grep -oE 'Saved (to|raw HTML to|JSON-LD to) .+' | head -1 | sed 's/Saved \(to\|raw HTML to\|JSON-LD to\) //' || echo "")
    if [ -z "$output_file" ] || [ ! -f "$output_file" ]; then
      errors="${errors}output_file: not found; "
    elif [ "$min_length" != "null" ]; then
      actual_length=$(wc -c < "$output_file")
      if [ "$actual_length" -lt "$min_length" ]; then
        errors="${errors}content_length: expected >=$min_length got $actual_length; "
      fi
    fi
  fi

  # Cache hit
  if [ "$expect_cached" = "true" ]; then
    if ! echo "$stdout_content" | grep -q "cached"; then
      errors="${errors}cache: expected cache hit; "
    fi
  fi

  # Record result
  if [ -z "$errors" ]; then
    printf "${GREEN}PASS${NC} (%dms)\n" "$duration_ms"
    status="pass"
    PASS=$((PASS + 1))
  else
    printf "${RED}FAIL${NC} (%dms) %s\n" "$duration_ms" "$errors"
    status="fail"
    FAIL=$((FAIL + 1))
  fi

  result=$(jq -n \
    --arg id "$id" \
    --arg url "$url" \
    --arg desc "$desc" \
    --arg status "$status" \
    --arg errors "$errors" \
    --argjson duration "$duration_ms" \
    --argjson exit_code "$actual_exit" \
    '{id: $id, url: $url, description: $desc, status: $status, errors: $errors, duration_ms: $duration, exit_code: $exit_code}')

  RESULTS=$(echo "$RESULTS" | jq --argjson r "$result" '. + [$r]')
  rm -f "$stderr_file" "$stdout_file"
done

# Write results
echo "$RESULTS" | jq '.' > "$RESULTS_DIR/smoke-results.json"

echo ""
echo "Results: $PASS passed, $FAIL failed (out of $count)"
echo "Written to: $RESULTS_DIR/smoke-results.json"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
