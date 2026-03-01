# Webfetch Diagnostic Scorecard — v5

Date: 2026-03-01
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: v4

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/11 | 10/11 | flat |
| Webfetch adoption rate | 100.0% | 100.0% | flat |
| Avg tool calls/prompt | 3.4 | 3.6 | -0.2 |
| Avg judge score (overall) | 4.8/5 | 4.9/5 | -0.1 |
| Prompts at 5/5 overall | 9/16 | 12/16 | -3.0 |
| Answers provided | 15/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | 5.0/5 | flat |
| flag_correctness | 4.9/5 | 5.0/5 | -0.1 |
| workflow_adherence | 4.9/5 | 5.0/5 | -0.1 |
| efficiency | 4.5/5 | 4.8/5 | -0.3 |
| answer_quality | 4.8/5 | 4.8/5 | -0.1 |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 3 | webfetch | --jsonld | fetch-failed | 4.4/5 | 1 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 5 | webfetch | --tier stealth, --no-cache | fetch-then-read | 3.6/5 | 2 |
| D-05 | 3 | webfetch | --jsonld | fetch-then-read | 4.8/5 | 1 |
| D-06 | 2 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 2 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 3 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-10 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-11 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-12 | 3 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 3 | webfetch | — | fetch-failed | 4.6/5 | 1 |
| D-14 | 2 | webfetch | --tier stealth | fetch-failed | 5.0/5 | 0 |
| D-15 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-16 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| efficiency | 5 | 62.5% |
| answer_quality | 1 | 12.5% |
| flag_correctness | 1 | 12.5% |
| workflow_adherence | 1 | 12.5% |

Total violations across all prompts: 8

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 3596ms |
| S-02 | https://httpbin.org/html | pass | 992ms |
| S-03 | https://httpbin.org/status/403 | pass | 1656ms |
| S-04 | https://httpbin.org/status/429 | pass | 1078ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 1665ms |
| S-06 | https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags | pass | 1103ms |
| S-07 | https://example.com | pass | 633ms |
| S-08 | https://example.com | pass | 645ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 2066ms |
| S-10 | https://nowsecure.nl | pass | 1598ms |
| S-11 | https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/ | fail | 4869ms |

