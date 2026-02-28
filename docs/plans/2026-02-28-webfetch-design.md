# webfetch — Smart Web Fetching Toolkit

**Date:** 2026-02-28
**Status:** Approved
**Form:** CLI tool + Claude Code skill
**Language:** TypeScript / Node.js
**Repo:** ~/Documents/projects/webfetch (open-sourceable)

## Problem

Claude Code's built-in `WebFetch` makes direct HTTP requests with no proxy, anti-bot bypass, or content filtering. Many e-commerce and content sites (Pottery Barn, Perigold, West Elm) return 403s or challenge pages. The Bright Data MCP server works but:

- Dumps entire pages (nav, footer, boilerplate) into context, wasting tokens
- No smart routing — hits Bright Data for every request even when direct fetch would work
- No file-based output — forces all content into conversation context
- No content extraction — returns raw markdown with no structure

## Solution

A standalone CLI tool that fetches web pages with automatic tier escalation, extracts clean content, and writes to files. Paired with a Claude Code skill that teaches Claude how to use it effectively.

## Architecture

### Tier Escalation Engine

```
Tier 0: Direct fetch (undici)
  ~50ms, free, works for ~40% of sites
  Detect: HTTP 200 + real content? → Success
  Detect: 403, 429, challenge page, empty body? → Escalate

Tier 1: Direct fetch + browser-like headers
  Same as Tier 0 but with TLS fingerprint spoofing,
  realistic User-Agent, Accept headers
  Catches sites that block on missing headers but don't need JS rendering

Tier 2: Patchright (stealth headless browser)
  ~2-5s, free (local), handles JS rendering + basic anti-bot
  Wait for DOM content, extract after hydration
  Detect: Cloudflare challenge, Akamai block? → Escalate

Tier 3: Bright Data Web Unlocker
  ~3-10s, $0.0015/request, managed anti-bot
  REST API: POST api.brightdata.com/request
  Returns rendered HTML

Tier 4: Bright Data Scraping Browser (interactive)
  ~10-30s, most expensive, full browser control
  Connect Patchright via CDP to wss://brd.superproxy.io:9222
  For clicking through configurators, filling forms, etc.
  Only triggered explicitly via --interact flag
```

### Block Detection

Not just status codes — structural HTML analysis:

- **Cloudflare:** `<title>Just a moment</title>`, challenge scripts
- **Akamai:** `Reference #` pattern, short body with redirect
- **PerimeterX:** `_px` cookies, challenge iframe
- **Generic:** body < 1KB with no semantic content, meta refresh to challenge URL

### Domain Memory

After a successful fetch, cache which tier worked for that domain. Next time, skip cheaper tiers known to fail. Stored in `domains.json`.

## Content Extraction Pipeline

After fetching raw HTML, apply in order:

1. **JSON-LD / schema.org extraction** — Parse `<script type="application/ld+json">` tags. If `schema.org/Product` found, save as `.json`. ~40% of e-commerce sites have this — free structured data, no extraction needed.

2. **Defuddle content extraction** — Strip nav, footer, sidebar, ads. Preserve main content, tables, lists, code blocks. Returns clean HTML + metadata (title, author, date).

3. **Markdown conversion** — `node-html-markdown` for speed. Strip remaining boilerplate. Output: clean, LLM-friendly markdown.

4. **Token estimation** — Rough char/4 estimate. Report in CLI output so Claude/user knows context cost before reading.

## CLI Interface

### Auto mode (happy path)

```bash
webfetch <url>
# Fetches, auto-escalates, extracts, saves to file
# Output: "Saved to /tmp/webfetch/potterybarn.com/layton-abc.md (2.4KB, ~600 tokens)"

webfetch <url> --raw
# Save raw HTML instead of extracted markdown

webfetch <url> --jsonld
# Extract only JSON-LD structured data (skip markdown)

webfetch <url> --output ./my-dir/
# Custom output directory
```

### Manual tier control

```bash
webfetch fetch <url> --tier direct|stealth|unlocker|browser
# Force a specific tier, skip auto-escalation
```

### Re-extraction

```bash
webfetch extract <file.html> [--format md|json|jsonld]
# Re-run extraction on an already-fetched file
```

### Interactive browsing

```bash
webfetch browse <url>
# Launch Patchright for interactive use (Tier 2)

webfetch browse <url> --brightdata
# Interactive via Bright Data Scraping Browser (Tier 4)
# For JS configurators, form filling, etc.
```

### Cache management

```bash
webfetch cache list
webfetch cache clear [domain]
webfetch cache stats
```

### Configuration

```bash
webfetch config show
webfetch config set brightdata.token <token>
webfetch config set output.dir /custom/path
```

## Output Structure

```
/tmp/webfetch/                            # Default root (configurable)
├── potterybarn.com/
│   ├── layton-leather-swivel-a1b2.md     # Extracted markdown
│   ├── layton-leather-swivel-a1b2.json   # JSON-LD product data (if found)
│   └── layton-leather-swivel-a1b2.raw.html  # Raw HTML (if --raw)
├── perigold.com/
│   └── hannah-swivel-stool-c3d4.md
├── cache.json                            # URL → file mapping + TTL + tier used
└── domains.json                          # Domain → known-working tier cache
```

File naming: slugified path from URL + short hash for uniqueness. Human-readable but collision-safe.

## Configuration

Layered config (highest priority wins):

1. CLI flags (`--output`, `--tier`, etc.)
2. Environment variables (`WEBFETCH_OUTPUT_DIR`, `BRIGHTDATA_API_TOKEN`)
3. `.webfetchrc` in project root or `~/.webfetchrc` (JSON)
4. Defaults

```json
{
  "output": {
    "dir": "/tmp/webfetch",
    "format": "md"
  },
  "brightdata": {
    "token": "...",
    "zone": "mcp_unlocker"
  },
  "tiers": {
    "maxAuto": "unlocker",
    "domainOverrides": {
      "potterybarn.com": "stealth",
      "amazon.com": "unlocker"
    }
  },
  "cache": {
    "ttl": 3600
  }
}
```

## Project Structure

```
webfetch/
├── src/
│   ├── cli.ts              # CLI entry point (commander)
│   ├── fetch/
│   │   ├── direct.ts       # Tier 0-1: undici direct fetch
│   │   ├── patchright.ts   # Tier 2: stealth headless browser
│   │   ├── brightdata.ts   # Tier 3-4: Web Unlocker + Scraping Browser
│   │   └── router.ts       # Escalation engine
│   ├── extract/
│   │   ├── jsonld.ts       # schema.org/Product JSON-LD extraction
│   │   ├── readability.ts  # Defuddle content extraction
│   │   └── markdown.ts     # HTML → clean markdown conversion
│   ├── detect/
│   │   └── blocker.ts      # Bot detection / challenge page detection
│   ├── cache/
│   │   └── cache.ts        # URL → file cache with TTL
│   ├── output/
│   │   └── writer.ts       # File output with smart naming
│   └── config.ts           # Config loading (env vars, .webfetchrc)
├── skill/
│   └── webfetch.md         # Claude Code skill instructions
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "undici": "^7.0.0",
    "patchright": "^1.x",
    "defuddle": "^1.x",
    "node-html-markdown": "^1.x",
    "jsdom": "^25.0.0"
  }
}
```

No Python dependencies. Bright Data integration is just REST calls via undici — no SDK needed.

## Claude Code Skill

The skill (`~/.claude/skills/webfetch/webfetch.md`) teaches Claude:

- **When to use `webfetch`** vs built-in WebFetch/WebSearch — use webfetch for sites that block, product pages, anything needing JS rendering
- **The file-based workflow** — run webfetch via Bash, then Read/Grep the output file instead of dumping content into context
- **When to use subcommands** — `--jsonld` first for product pages, `browse --brightdata` for JS configurators
- **Context budgeting** — check the token estimate in output, use Grep to search large files instead of reading whole
- **Batch patterns** — fetch multiple URLs in sequence, then compare extracted files

## Key Design Decisions

1. **CLI + Skill over MCP** — MCP forces all content through the tool result into context. A CLI writes to files, letting Claude selectively read what it needs.

2. **Patchright over playwright-extra** — Drop-in Playwright replacement with deeper CDP patches. Defeats Cloudflare/Akamai where the stealth plugin fails. Same API, strictly more capable.

3. **Defuddle over Readability** — Newer, more conservative extraction. Better code block handling, schema.org extraction baked in. Built by the Obsidian team.

4. **JSON-LD first** — ~40% of e-commerce sites embed structured product data. When present, skip all content extraction entirely — structured data is cheaper and more accurate.

5. **Domain memory** — Cache which tier works per domain. Avoids wasting time on tiers known to fail for a given site.

6. **Bright Data as Tier 4 only** — Free tiers handle most sites. Bright Data's 5K free MCP requests don't apply to direct API, so every direct API call costs money. Use sparingly.

## Research Sources

- [Crawl4AI](https://github.com/unclecode/crawl4ai) — fit-markdown, anti-bot fallback chains (50k+ stars)
- [Scrapling](https://github.com/D4Vinci/Scrapling) — tiered fetcher architecture, MCP server (18.6k stars)
- [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright) — stealth Playwright fork
- [Defuddle](https://github.com/nicholasgasior/defuddle) — content extraction from Obsidian team
- [node-html-markdown](https://www.npmjs.com/package/node-html-markdown) — fast HTML→MD conversion
- [extruct](https://github.com/scrapinghub/extruct) — JSON-LD/microdata extraction (Python reference)
- [Bright Data Web Unlocker API](https://docs.brightdata.com/scraping-automation/web-unlocker/quickstart)
- [Bright Data Scraping Browser + Playwright](https://docs.brightdata.com/scraping-automation/scraping-browser/playwright)
- [Firecrawl](https://github.com/firecrawl/firecrawl) — commercial reference for schema-first extraction
- [Bright Data MCP source](https://github.com/luminati-io/brightdata-mcp) — reference for API patterns
