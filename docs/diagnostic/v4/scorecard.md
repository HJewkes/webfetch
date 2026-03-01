# Webfetch Diagnostic Scorecard — v4

Date: 2026-03-01
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: v3

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/11 | 10/11 | flat |
| Webfetch adoption rate | 100.0% | 100.0% | flat |
| Avg tool calls/prompt | 3.6 | 3.3 | **+0.3** |
| Avg judge score (overall) | 4.9/5 | 4.9/5 | flat |
| Prompts at 5/5 overall | 12/16 | 11/16 | **+1.0** |
| Answers provided | 15/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | 5.0/5 | flat |
| flag_correctness | 5.0/5 | 4.9/5 | **+0.1** |
| workflow_adherence | 5.0/5 | 4.9/5 | **+0.1** |
| efficiency | 4.8/5 | 4.8/5 | flat |
| answer_quality | 4.8/5 | 4.8/5 | flat |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 5 | webfetch | browse, --brightdata | fetch-failed | 4.4/5 | 2 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 3 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-05 | 3 | webfetch | --jsonld | fetch-then-read | 4.8/5 | 1 |
| D-06 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 3 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 3 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-10 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-11 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-12 | 4 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 2 | webfetch | — | fetch-failed | 5.0/5 | 0 |
| D-14 | 2 | webfetch | --tier stealth | fetch-failed | 5.0/5 | 0 |
| D-15 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-16 | 7 | webfetch | — | fetch-then-read | 5.0/5 | 0 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| efficiency | 3 | 60.0% |
| answer_quality | 2 | 40.0% |

Total violations across all prompts: 5

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 3381ms |
| S-02 | https://httpbin.org/html | pass | 1098ms |
| S-03 | https://httpbin.org/status/403 | pass | 1193ms |
| S-04 | https://httpbin.org/status/429 | pass | 1216ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 1864ms |
| S-06 | https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags | pass | 1316ms |
| S-07 | https://example.com | pass | 832ms |
| S-08 | https://example.com | pass | 767ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 2005ms |
| S-10 | https://nowsecure.nl | pass | 1735ms |
| S-11 | https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/ | fail | 4955ms |

