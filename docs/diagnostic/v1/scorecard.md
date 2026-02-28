# Webfetch Diagnostic Scorecard — v1

Date: 2026-02-28
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: none

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 8/10 | — | — |
| Webfetch adoption rate | 100.0% | — | — |
| Avg tool calls/prompt | 3.4 | — | — |
| Avg judge score (overall) | 4.8/5 | — | — |
| Prompts at 5/5 overall | 9/16 | — | — |
| Answers provided | 14/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | — | — |
| flag_correctness | 4.9/5 | — | — |
| workflow_adherence | 4.7/5 | — | — |
| efficiency | 4.8/5 | — | — |
| answer_quality | 4.5/5 | — | — |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 3 | webfetch | --jsonld | fetch-then-read | 4.0/5 | 2 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 7 | webfetch | --tier stealth, --no-cache, --raw | fetch-then-read | 4.2/5 | 2 |
| D-05 | 3 | webfetch | --jsonld | fetch-then-read | 4.4/5 | 1 |
| D-06 | 2 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 2 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 3 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 4 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-10 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-11 | 2 | webfetch | — | fetch-then-read | 4.4/5 | 2 |
| D-12 | 3 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 2 | webfetch | — | direct-context | 4.8/5 | 1 |
| D-14 | 3 | webfetch | --tier stealth | fetch-then-read | 5.0/5 | 0 |
| D-15 | 5 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-16 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| answer_quality | 4 | 40.0% |
| workflow_adherence | 3 | 30.0% |
| efficiency | 2 | 20.0% |
| flag_correctness | 1 | 10.0% |

Total violations across all prompts: 10

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 3445ms |
| S-02 | https://httpbin.org/html | pass | 988ms |
| S-03 | https://httpbin.org/status/403 | pass | 1478ms |
| S-04 | https://httpbin.org/status/429 | pass | 1120ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 1699ms |
| S-06 | https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/ | fail | 3457ms |
| S-07 | https://example.com | pass | 673ms |
| S-08 | https://example.com | pass | 685ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 1788ms |
| S-10 | https://nowsecure.nl | fail | 1291ms |

