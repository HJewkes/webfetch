# Webfetch Diagnostic Scorecard — v3

Date: 2026-03-01
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: v2

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/11 | 10/10 | flat |
| Webfetch adoption rate | 100.0% | 100.0% | flat |
| Avg tool calls/prompt | 3.3 | 4.1 | -0.8 |
| Avg judge score (overall) | 4.9/5 | 4.8/5 | **+0.1** |
| Prompts at 5/5 overall | 11/16 | 8/16 | **+3.0** |
| Answers provided | 14/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | 5.0/5 | flat |
| flag_correctness | 4.9/5 | 4.9/5 | **+0.1** |
| workflow_adherence | 4.9/5 | 4.7/5 | **+0.2** |
| efficiency | 4.8/5 | 4.5/5 | **+0.3** |
| answer_quality | 4.8/5 | 4.8/5 | **+0.1** |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 4 | webfetch | browse, --brightdata | fetch-failed | 4.6/5 | 1 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-05 | 4 | webfetch | --brightdata | fetch-failed | 4.2/5 | 1 |
| D-06 | 2 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 2 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 3 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-10 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-11 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-12 | 3 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 2 | webfetch | — | fetch-failed | 4.8/5 | 1 |
| D-14 | 3 | webfetch | --tier stealth | fetch-failed | 5.0/5 | 0 |
| D-15 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-16 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| efficiency | 2 | 40.0% |
| workflow_adherence | 1 | 20.0% |
| flag_correctness | 1 | 20.0% |
| answer_quality | 1 | 20.0% |

Total violations across all prompts: 5

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 34043ms |
| S-02 | https://httpbin.org/html | pass | 3012ms |
| S-03 | https://httpbin.org/status/403 | pass | 4487ms |
| S-04 | https://httpbin.org/status/429 | pass | 4384ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 7301ms |
| S-06 | https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags | pass | 2920ms |
| S-07 | https://example.com | pass | 2365ms |
| S-08 | https://example.com | pass | 2266ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 3785ms |
| S-10 | https://nowsecure.nl | pass | 2462ms |
| S-11 | https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/ | fail | 4504ms |

