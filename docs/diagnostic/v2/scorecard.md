# Webfetch Diagnostic Scorecard — v2

Date: 2026-02-28
Agent model: claude-sonnet-4-6
Prompts run: 16/16
Previous version: v1

## Headline Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Smoke tests passed | 10/10 | 8/10 | **+2.0** |
| Webfetch adoption rate | 100.0% | 100.0% | flat |
| Avg tool calls/prompt | 4.1 | 3.4 | **+0.7** |
| Avg judge score (overall) | 4.8/5 | 4.8/5 | flat |
| Prompts at 5/5 overall | 8/16 | 9/16 | -1.0 |
| Answers provided | 14/16 | — | — |

## Judge Scores by Dimension

| Dimension | Current | Previous | Delta |
|-----------|---------|----------|-------|
| tool_selection | 5.0/5 | 5.0/5 | flat |
| flag_correctness | 4.9/5 | 4.9/5 | -0.1 |
| workflow_adherence | 4.7/5 | 4.7/5 | flat |
| efficiency | 4.5/5 | 4.8/5 | -0.3 |
| answer_quality | 4.8/5 | 4.5/5 | **+0.3** |

## Per-Prompt Breakdown

| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |
|--------|-------|------|-------|----------|-----------|------------|
| D-01 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-02 | 5 | webfetch | --jsonld, browse, --brightdata | fetch-then-read | 3.8/5 | 2 |
| D-03 | 3 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-04 | 11 | webfetch | --tier stealth | fetch-then-read | 4.2/5 | 3 |
| D-05 | 5 | webfetch | --jsonld | fetch-then-read | 4.2/5 | 2 |
| D-06 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-07 | 2 | webfetch | --no-cache | fetch-then-read | 5.0/5 | 0 |
| D-08 | 3 | webfetch | --tier direct | fetch-then-read | 5.0/5 | 0 |
| D-09 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-10 | 4 | webfetch | — | fetch-then-read | 5.0/5 | 0 |
| D-11 | 3 | webfetch | --raw | fetch-then-read | 5.0/5 | 0 |
| D-12 | 3 | webfetch | — | direct-context | 5.0/5 | 0 |
| D-13 | 2 | webfetch | — | fetch-then-read | 4.8/5 | 1 |
| D-14 | 3 | webfetch | --tier stealth | fetch-then-read | 4.8/5 | 1 |
| D-15 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 0 |
| D-16 | 5 | webfetch | — | fetch-then-read | 4.8/5 | 1 |

## Violation Categories

| Dimension | Count | % of Total |
|-----------|-------|------------|
| efficiency | 6 | 54.5% |
| workflow_adherence | 3 | 27.3% |
| flag_correctness | 2 | 18.2% |

Total violations across all prompts: 11

## Smoke Test Details

| ID | URL | Status | Duration |
|----|-----|--------|----------|
| S-01 | https://example.com | pass | 3525ms |
| S-02 | https://httpbin.org/html | pass | 979ms |
| S-03 | https://httpbin.org/status/403 | pass | 1683ms |
| S-04 | https://httpbin.org/status/429 | pass | 1383ms |
| S-05 | https://en.wikipedia.org/wiki/Web_scraping | pass | 1651ms |
| S-06 | https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags | pass | 1102ms |
| S-07 | https://example.com | pass | 649ms |
| S-08 | https://example.com | pass | 684ms |
| S-09 | https://httpbin.org/redirect/2 | pass | 1441ms |
| S-10 | https://nowsecure.nl | pass | 1629ms |

