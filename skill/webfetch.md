# webfetch — Smart Web Fetching

## When to Use webfetch

Use `webfetch` instead of the built-in WebFetch tool when:

- The site returns **403, 429, or challenge pages** (Cloudflare, Akamai, PerimeterX)
- You need **product/e-commerce data** (these sites almost always block direct fetch)
- The page requires **JavaScript rendering** to show content
- You need to **extract structured data** (JSON-LD, schema.org) from product pages
- The response would be **too large for context** — webfetch writes to files you can selectively read

**Keep using built-in WebFetch** for:
- Public documentation sites, GitHub, npm, Wikipedia
- APIs that return JSON directly
- Sites that don't block automated requests

## Core Workflow

The key pattern is **fetch to file, then selectively read**:

```bash
# 1. Fetch the page (auto-selects tier, extracts content, writes to file)
webfetch https://example.com/product-page

# 2. Read the output file (path is printed in the summary)
# Use Read tool on the .md file, or Grep to search it
```

**Never** pipe webfetch output directly into context. Always use the file path from the summary line.

## Commands

### Default: Auto Fetch
```bash
webfetch <url>                    # Auto mode: fetch → extract → save
webfetch <url> --tier stealth     # Force Patchright browser
webfetch <url> --tier unlocker    # Force Bright Data Web Unlocker
webfetch <url> --raw              # Save raw HTML (skip extraction)
webfetch <url> --jsonld           # Extract only JSON-LD structured data
webfetch <url> --output <dir>     # Custom output directory
```

### Extract: Re-process saved HTML
```bash
webfetch extract <file.html>               # Re-extract as markdown
webfetch extract <file.html> --format json  # Full extraction as JSON
webfetch extract <file.html> --format jsonld # JSON-LD only
```

### Browse: Interactive browser
```bash
webfetch browse <url>              # Launch local Patchright browser
webfetch browse <url> --brightdata # Use Bright Data Scraping Browser
```

## Auto-Escalation

By default, `webfetch <url>` automatically escalates through tiers if blocked:

**direct → browser headers → Patchright → Bright Data**

You do NOT need to manually retry with `--tier`. Just run `webfetch <url>` and it handles escalation. Use `--tier` only to **skip lower tiers** (e.g., `--tier stealth` to go straight to browser) or to **force a specific tier** for testing.

## Decision Tree

**For product/e-commerce pages:**
1. Try `--jsonld` first — ~40% embed structured data (price, name, availability)
2. If no JSON-LD, use default auto mode (readability + markdown)
3. If blocked, auto-escalation handles it — don't manually retry with `--tier`
4. For JS configurators (color pickers, size selectors), use `browse` mode

**For general/documentation pages:**
- Use default auto mode — don't use `--jsonld` (it's for structured product data)
- Auto-escalation handles any blocks automatically

**For blocked/challenge pages (403, Cloudflare, Akamai):**
- Default auto mode auto-escalates — let it work
- If you know the site needs a browser, use `--tier stealth` to skip direct tier
- Check the summary line for which tier succeeded

## Known Hard Blocks

Some sites block all fetch methods including Bright Data:
- **allrecipes.com** — blocks direct, stealth, and unlocker tiers. Use `browse` mode.

## Context Budgeting

The summary line includes an estimated token count. Use this to decide how to read the output:

- **< 2000 tokens**: Safe to Read the whole file
- **2000-8000 tokens**: Read the file but consider if you need all of it
- **> 8000 tokens**: Use Grep to search for specific information instead of reading the whole file

```bash
# Example: search for price info in a large product page
```
Then use the Grep tool on the output file path with pattern like "price|cost|\$".

## Batch Fetching

For comparing multiple products or pages:

```bash
webfetch https://site.com/product-a
webfetch https://site.com/product-b
webfetch https://site.com/product-c
```

Then use Grep across the output directory to compare specific attributes.

## Configuration

webfetch uses layered config: CLI flags > env vars > `.webfetchrc` > defaults.

Key env vars:
- `WEBFETCH_OUTPUT_DIR` — output directory (default: `/tmp/webfetch`)
- `BRIGHTDATA_API_TOKEN` — required for Bright Data tiers

## Output Structure

Files are organized by domain:
```
/tmp/webfetch/
  example.com/
    product-page-a1b2c3.md      # Extracted markdown
    product-page-a1b2c3.json    # JSON-LD (if found)
```
