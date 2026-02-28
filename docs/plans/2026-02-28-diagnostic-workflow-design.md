# Webfetch Diagnostic Workflow Design

## Overview

End-to-end integration testing and AI diagnostic system for the webfetch CLI and Claude Code skill. Three-phase approach: CLI smoke tests (deterministic), skill test bench (AI agents), and LLM-as-judge evaluation.

**Goals:**
- Validate CLI works correctly against real sites (tier escalation, extraction, caching)
- Validate Claude agents use the webfetch skill effectively (tool selection, flags, workflows)
- Measure quality, efficiency, and adoption metrics with version-tracked scorecards
- Identify optimization opportunities via tool call analysis and judge feedback

## Architecture

```
Phase 1: CLI Smoke Tests (deterministic, no AI)
    ↓ smoke-results.json
Phase 2: Skill Test Bench (15-18 agent prompts via claude -p)
    ↓ D-01.json through D-NN.json
Phase 3: LLM-as-Judge (evaluation per prompt)
    ↓ D-01-judge.json through D-NN-judge.json
Phase 4: Assemble (TypeScript scorer)
    ↓ scorecard.md
```

## Phase 1: CLI Smoke Tests

Fast, deterministic validation that webfetch CLI works correctly against real sites. No AI involved. Catches regressions before spending money on agent prompts.

### Curated URL Corpus

~10 URLs stored in `scripts/diagnostic/fixtures/urls.json`:

| ID | URL | Tests | Expected |
|----|-----|-------|----------|
| S-01 | `https://example.com` | Direct fetch, basic HTML | Tier: direct, markdown non-empty |
| S-02 | `https://httpbin.org/html` | Direct fetch, clean HTML | Tier: direct, extraction works |
| S-03 | `https://httpbin.org/status/403` | Block detection | Graceful failure, exit code 1 |
| S-04 | `https://httpbin.org/status/429` | Rate limit detection | Graceful failure, exit code 1 |
| S-05 | `https://en.wikipedia.org/wiki/Web_scraping` | Large page, readability | Markdown > 1000 chars, title extracted |
| S-06 | A known JSON-LD page (recipe/product) | `--jsonld` flag | Valid JSON output, schema.org type present |
| S-07 | Same URL as S-01 | `--raw` flag | Raw HTML saved, .html extension |
| S-08 | Same URL as S-01 (after S-07 cache) | Cache hit | "cached" in output, no network call |
| S-09 | `https://httpbin.org/redirect/2` | Redirect following | Successful fetch after redirects |
| S-10 | A Cloudflare-protected site | Block detection + escalation | Detects cloudflare block reason |

### Validation Checks Per URL

- Exit code (0 for success, 1 for expected failures)
- Output file exists at expected path
- File content non-empty and correct format (md/html/json)
- Tier used matches expectation (from stderr output)
- Cache entry created (for successful fetches)
- Duration within reasonable bounds (< 30s)

### Script

`scripts/diagnostic/smoke.sh` — runs all URLs sequentially, outputs JSON per URL.

```bash
scripts/diagnostic/smoke.sh v1
# → docs/diagnostic/v1/smoke-results.json
```

## Phase 2: Skill Test Bench

Test whether Claude agents use the webfetch skill correctly when given real-world tasks.

### Prompt Categories (15-18 prompts)

**Tool Selection (4 prompts):**
- D-01: "Fetch the content of [simple URL]" — should use webfetch, not built-in WebFetch
- D-02: "What's the price of [product on e-commerce site]?" — should try `--jsonld` first
- D-03: "Read the docs at [stable docs URL]" — measures tool selection decision quality
- D-04: "Fetch [known-blocked site]" — should use webfetch with tier awareness

**Flag Selection (4 prompts):**
- D-05: "Get the structured product data from [recipe/product URL]" — should use `--jsonld`
- D-06: "Save the raw HTML of [URL] for later analysis" — should use `--raw`
- D-07: "Fetch [URL] but don't use cached results" — should use `--no-cache`
- D-08: "Fetch [URL] using only direct HTTP, no browser" — should use `--tier direct`

**Workflow Patterns (4 prompts):**
- D-09: "Research [topic] from [URL], summarize the key points" — should fetch to file, then selectively read
- D-10: "Compare product listings from [URL-A] and [URL-B]" — should fetch both to files, then compare
- D-11: "This page was fetched earlier, re-extract just the markdown" — should use `webfetch extract`
- D-12: "What URLs have we fetched recently?" — should use `webfetch cache list`

**Error Recovery (2 prompts):**
- D-13: "Fetch [URL that will fail on direct]" — should recognize block and suggest escalation
- D-14: "Fetch [URL], oh it was blocked, try again with a higher tier" — should use `--tier` flag

**Context Budgeting (2 prompts):**
- D-15: "Fetch this very long page and tell me about section X" — should fetch to file, use Grep/Read selectively
- D-16: "Fetch these 5 URLs and summarize each" — should fetch all to files first, then read individually

### Execution

Each prompt runs via `claude -p` with:
- `--model sonnet`
- `--output-format json`
- `--permission-mode bypassPermissions`
- `--no-session-persistence`

Batched by configurable concurrency (default 3).

### Structured Output

Each agent returns JSON:
```json
{
  "id": "D-01",
  "version": "v1",
  "tool_used": "webfetch|WebFetch|other",
  "command_run": "webfetch https://example.com",
  "flags_used": ["--jsonld"],
  "files_written": ["example.com/page-abc123.md"],
  "workflow": "fetch-then-read|direct-context|other",
  "tool_calls_total": 8,
  "webfetch_calls": 3,
  "read_calls": 2,
  "other_calls": 3,
  "answer_provided": true,
  "notes": "Chose --jsonld because task asked for product data"
}
```

## Phase 3: LLM-as-Judge

Evaluate each test bench result across quality dimensions that can't be checked programmatically.

### Judge Dimensions (1-5 scale)

| Dimension | What it measures |
|-----------|-----------------|
| **Tool Selection** | Did the agent choose webfetch over WebFetch at the right time? |
| **Flag Correctness** | Did it use the right flags for the task? |
| **Workflow Adherence** | Did it follow fetch-to-file-then-read vs dumping into context? |
| **Efficiency** | Were tool calls minimal and purposeful? No redundant fetches? |
| **Answer Quality** | Was the final response to the user's task accurate and complete? |

### Judge Prompt Template

Located at `scripts/diagnostic/prompts/judge.md`:

```markdown
You are evaluating how well a Claude agent used the webfetch CLI tool.

## Task Given to Agent
{{PROMPT_TEXT}}

## Agent's Tool Calls & Output
{{AGENT_OUTPUT}}

## Webfetch Skill Reference
{{SKILL_CONTENT}}

## Expected Behavior
{{EXPECTED_BEHAVIOR}}

Rate each dimension 1-5 and explain your reasoning.
Return structured JSON.
```

### Judge Output

```json
{
  "scores": {
    "tool_selection": 5,
    "flag_correctness": 4,
    "workflow_adherence": 3,
    "efficiency": 4,
    "answer_quality": 5
  },
  "violations": [
    {"dimension": "workflow_adherence", "description": "Read entire 8000-token file instead of using Grep"}
  ],
  "strengths": ["Correctly chose --jsonld for product page"],
  "summary": "Agent used webfetch correctly but didn't follow context budgeting."
}
```

### Execution

- Model: sonnet
- Sequential (each judgment is fast)

## Phase 4: Assembler & Scorecard

### Script

`scripts/diagnostic/assemble.ts` — TypeScript, runs via `npx tsx`.

### Key Metrics

| Metric | Target | Source |
|--------|--------|--------|
| Smoke tests passed | 100% | Phase 1 |
| Webfetch adoption rate | >90% | Phase 2 (webfetch_calls / total tool calls) |
| Correct flag usage | >80% | Phase 3 judge |
| Workflow adherence avg | >4.0/5 | Phase 3 judge |
| Efficiency avg | >4.0/5 | Phase 3 judge |
| Answer quality avg | >4.0/5 | Phase 3 judge |
| Avg tool calls/prompt | <12 | Phase 2 |
| Prompts at 5/5 overall | >40% | Phase 3 judge |

### Scorecard Format

Markdown at `docs/diagnostic/v<N>/scorecard.md`:

```markdown
# Webfetch Diagnostic Scorecard — v<N>

Date: YYYY-MM-DD
Agent model: claude-sonnet-4-6
Prompts run: NN/NN
Previous version: v<N-1>

## Headline Metrics
| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/10 | 10/10 | flat |
| Webfetch adoption rate | 94% | 87% | +7pp |
| Avg tool calls/prompt | 8.2 | 10.1 | -1.9 |
| Avg judge score (overall) | 4.3/5 | 4.0/5 | +0.3 |
| ...

## Judge Scores by Dimension
| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 4.5/5 | ... | ... |
| ...

## Per-Prompt Breakdown
| Prompt | Calls | Tool | Flags | Judge (O) | Violations |
|--------|-------|------|-------|-----------|------------|
| D-01 | 6 | webfetch | -- | 5/5 | 0 |
| ...
```

### Delta Comparison

Assembler loads previous version's scorecard (if exists) and computes deltas for all metrics. Trend indicators: improving, regressing, flat.

## Orchestrator

### Script: `scripts/diagnostic/run.sh`

```bash
./scripts/diagnostic/run.sh v1                      # Full cycle (all phases)
./scripts/diagnostic/run.sh v1 --skip-smoke          # Skip Phase 1
./scripts/diagnostic/run.sh v1 --phase smoke         # Phase 1 only
./scripts/diagnostic/run.sh v1 --phase test-bench    # Phase 2 only
./scripts/diagnostic/run.sh v1 --phase judge         # Phase 3 only
./scripts/diagnostic/run.sh v1 --phase assemble      # Phase 4 only
./scripts/diagnostic/run.sh v1 --concurrency 2       # Parallel agent count
```

### Flow

1. Create `docs/diagnostic/v<N>/` directory
2. **Phase 1 (Smoke):** Run `smoke.sh`, write `smoke-results.json`
3. **Phase 2 (Test Bench):** Template-substitute prompts, spawn agents in batches, collect JSON
4. **Phase 3 (Judge):** For each test bench result, spawn judge agent, collect evaluations
5. **Phase 4 (Assemble):** Run `assemble.ts` to generate scorecard with deltas

## File Structure

```
scripts/diagnostic/
  run.sh                            # Main orchestrator
  smoke.sh                          # Phase 1 CLI validation
  assemble.ts                       # Phase 4 scorecard generator
  prompts/
    test-bench/
      D-01.md through D-16.md      # Agent task prompts
    judge.md                        # Judge evaluation template
  fixtures/
    urls.json                       # Curated URL corpus for smoke tests

docs/diagnostic/
  v1/
    smoke-results.json              # Phase 1 output
    test-bench/
      D-01.json                    # Phase 2 agent output
      D-01-judge.json              # Phase 3 judge evaluation
      ...
    scorecard.md                    # Phase 4 assembled summary
  v2/
    ...
```

## Design Decisions

1. **Curated stable URLs over local server.** Real-world testing catches real-world issues. Accept some flakiness as the cost of authenticity.

2. **Three phases, cleanly separated.** Phase 1 is free and fast. Phase 2 tests skill quality. Phase 3 adds nuanced evaluation. Each phase can run independently.

3. **No budget constraints.** Claude Max plan — optimize for quality of signal, not cost.

4. **Sonnet for agents and judge.** Cost-efficient, sufficient quality for tool-use evaluation. Matches brain/code-style precedent.

5. **Version-tracked results.** Each diagnostic run creates a `v<N>` directory. Assembler computes deltas against previous version for trend analysis.

6. **Automated + judge evaluation.** Phase 2 captures hard metrics (tool calls, files written). Phase 3 captures soft quality (was the workflow correct? was the answer good?). Together they provide complete signal.

7. **Structured JSON output from agents.** Enables automated scoring without parsing free-text. Agents instructed to return specific schema.

8. **Fresh agents with zero context.** Each test bench prompt runs in a clean session with only the skill available. Exposes all discoverability and documentation gaps.
