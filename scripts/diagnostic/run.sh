#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Defaults
VERSION=""
PHASE=""
SKIP_SMOKE=false
CONCURRENCY=3

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase) PHASE="$2"; shift 2 ;;
    --skip-smoke) SKIP_SMOKE=true; shift ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: run.sh <version> [--phase smoke|test-bench|judge|assemble] [--skip-smoke] [--concurrency N]"
      exit 0 ;;
    *)
      if [ -z "$VERSION" ]; then VERSION="$1"; shift
      else echo "Unknown argument: $1"; exit 1; fi ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "Usage: run.sh <version> [options]"
  exit 1
fi

RESULTS_DIR="$PROJECT_DIR/docs/diagnostic/$VERSION"
BENCH_DIR="$RESULTS_DIR/test-bench"
PROMPTS_DIR="$SCRIPT_DIR/prompts/test-bench"
SKILL_PATH="$PROJECT_DIR/skill/webfetch.md"
OUTPUT_DIR=$(mktemp -d)
trap 'rm -rf "$OUTPUT_DIR"' EXIT

mkdir -p "$BENCH_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

phase_header() {
  echo ""
  echo -e "${BOLD}═══ Phase: $1 ═══${NC}"
  echo ""
}

# --- Phase 1: Smoke ---
run_smoke() {
  phase_header "Smoke Tests"
  if [ "$SKIP_SMOKE" = true ]; then
    echo "Skipping smoke tests (--skip-smoke)"
    return
  fi
  bash "$SCRIPT_DIR/smoke.sh" "$VERSION"
}

# --- Phase 2: Test Bench ---
run_test_bench() {
  phase_header "Test Bench"
  local prompts=("$PROMPTS_DIR"/D-*.md)
  local total=${#prompts[@]}
  local running=0
  local completed=0

  for prompt_file in "${prompts[@]}"; do
    local id
    id=$(basename "$prompt_file" .md)
    local out_file="$BENCH_DIR/$id.json"

    # Template substitution
    local templated
    templated=$(sed \
      -e "s|{{VERSION}}|$VERSION|g" \
      -e "s|{{SKILL_PATH}}|$SKILL_PATH|g" \
      -e "s|{{PROJECT_DIR}}|$PROJECT_DIR|g" \
      -e "s|{{OUTPUT_DIR}}|$OUTPUT_DIR|g" \
      "$prompt_file")

    echo -e "[${completed}/${total}] ${YELLOW}$id${NC}: $(head -1 "$prompt_file" | sed 's/^# //')"

    # Spawn agent in background
    (
      env -u CLAUDECODE claude -p \
        --model sonnet \
        --output-format json \
        --permission-mode bypassPermissions \
        --no-session-persistence \
        "$templated" > "$out_file" 2>/dev/null
      echo -e "  ${GREEN}✓${NC} $id complete"
    ) &

    running=$((running + 1))
    if [ "$running" -ge "$CONCURRENCY" ]; then
      wait -n 2>/dev/null || true
      running=$((running - 1))
      completed=$((completed + 1))
    fi
  done

  # Wait for remaining
  wait
  echo -e "\n${GREEN}Test bench complete: $total prompts${NC}"
}

# --- Phase 3: Judge ---
run_judge() {
  phase_header "Judge Evaluation"

  for result_file in "$BENCH_DIR"/D-*.json; do
    # Skip judge files
    [[ "$result_file" == *-judge.json ]] && continue

    local id
    id=$(basename "$result_file" .json)
    local judge_file="$BENCH_DIR/${id}-judge.json"
    local prompt_file="$PROMPTS_DIR/${id}.md"

    echo -e "  Judging ${YELLOW}$id${NC}..."

    # Extract expected behavior from prompt
    local expected
    expected=$(grep -A1 'Expected:' "$prompt_file" 2>/dev/null | head -10 || echo "See prompt for expected behavior")

    # Write a combined prompt file for claude
    local combined_prompt
    combined_prompt=$(mktemp)
    cat > "$combined_prompt" << JUDGE_EOF
You are evaluating how well a Claude agent used the webfetch CLI tool.

## Task Given to Agent

$(cat "$prompt_file")

## Agent's Full Output

$(cat "$result_file")

## Webfetch Skill Reference

$(cat "$SKILL_PATH")

## Expected Behavior

$expected

## Evaluation Instructions

Rate each dimension 1-5:
1. Tool Selection - Did the agent choose webfetch via Bash instead of built-in WebFetch?
2. Flag Correctness - Did it use the right CLI flags for the task?
3. Workflow Adherence - Did it follow fetch-to-file-then-read pattern?
4. Efficiency - Were tool calls minimal and purposeful?
5. Answer Quality - Was the final response accurate and complete?

Return ONLY a JSON object:
{
  "scores": {"tool_selection": N, "flag_correctness": N, "workflow_adherence": N, "efficiency": N, "answer_quality": N},
  "violations": [{"dimension": "...", "description": "..."}],
  "strengths": ["..."],
  "summary": "..."
}
JUDGE_EOF

    env -u CLAUDECODE claude -p \
      --model sonnet \
      --output-format json \
      --permission-mode bypassPermissions \
      --no-session-persistence \
      "$(cat "$combined_prompt")" > "$judge_file" 2>/dev/null

    rm -f "$combined_prompt"
    echo -e "  ${GREEN}✓${NC} $id judged"
  done

  echo -e "\n${GREEN}Judge evaluation complete${NC}"
}

# --- Phase 4: Assemble ---
run_assemble() {
  phase_header "Assemble Scorecard"
  npx tsx "$SCRIPT_DIR/assemble.ts" "$VERSION"
}

# --- Main ---
echo -e "${BOLD}Webfetch Diagnostic — $VERSION${NC}"
echo "Concurrency: $CONCURRENCY"
echo "Results: $RESULTS_DIR"

if [ -n "$PHASE" ]; then
  case "$PHASE" in
    smoke) run_smoke ;;
    test-bench) run_test_bench ;;
    judge) run_judge ;;
    assemble) run_assemble ;;
    *) echo "Unknown phase: $PHASE"; exit 1 ;;
  esac
else
  run_smoke
  run_test_bench
  run_judge
  run_assemble
fi

echo ""
echo -e "${GREEN}${BOLD}Diagnostic $VERSION complete.${NC}"
echo "Scorecard: $RESULTS_DIR/scorecard.md"
