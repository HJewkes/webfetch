# Webfetch Diagnostic Scorecard — v6

Date: 2026-03-01
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: v5

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/11 | 10/11 | flat |
| Webfetch adoption rate | 100.0% | 100.0% | flat |
| Avg tool calls/prompt | 3.3 | 3.4 | -0.1 |
| Avg judge score (overall) | 4.9/5 | 4.8/5 | **+0.1** |
| Prompts at 5/5 overall | 13/16 | 9/16 | **+4.0** |
| Answers provided | 15/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | 5.0/5 | flat |
| flag_correctness | 4.9/5 | 4.9/5 | **+0.1** |
| workflow_adherence | 4.9/5 | 4.9/5 | **+0.1** |
| efficiency | 4.8/5 | 4.5/5 | **+0.3** |
| answer_quality | 4.9/5 | 4.8/5 | **+0.1** |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 3 | webfetch | --jsonld | fetch-failed | 4.6/5 | 2 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 4 | webfetch | — | fetch-then-read | 4.2/5 | 2 |
| D-05 | 3 | webfetch | --jsonld | fetch-then-read | 4.6/5 | 2 |
| D-06 | 2 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 2 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 2 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-10 | 5 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-11 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-12 | 3 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 2 | webfetch | — | fetch-failed | 5.0/5 | 0 |
| D-14 | 2 | webfetch | --tier stealth | fetch-failed | 5.0/5 | 0 |
| D-15 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-16 | 7 | webfetch | — | fetch-then-read | 5.0/5 | 0 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| efficiency | 3 | 50.0% |
| answer_quality | 1 | 16.7% |
| flag_correctness | 1 | 16.7% |
| workflow_adherence | 1 | 16.7% |

Total violations across all prompts: 6

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 3478ms |
| S-02 | https://httpbin.org/html | pass | 959ms |
| S-03 | https://httpbin.org/status/403 | pass | 1137ms |
| S-04 | https://httpbin.org/status/429 | pass | 1090ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 1598ms |
| S-06 | https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags | pass | 1022ms |
| S-07 | https://example.com | pass | 622ms |
| S-08 | https://example.com | pass | 618ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 2150ms |
| S-10 | https://nowsecure.nl | pass | 1567ms |
| S-11 | https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/ | fail | 4758ms |

