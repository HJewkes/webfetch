# webfetch

Smart web fetching CLI with tiered escalation and content extraction. Designed for AI agents that need to reliably fetch web content from sites that block automated requests.

## Features

- **Tiered auto-escalation** — automatically progresses through direct fetch, browser headers, Patchright (stealth browser), and Bright Data when sites block requests
- **Content extraction** — converts HTML to clean markdown using readability extraction, or extracts JSON-LD structured data
- **File-based output** — writes results to organized files by domain, avoiding context window bloat for large pages
- **Block detection** — identifies Cloudflare, Akamai, PerimeterX challenges and soft blocks automatically
- **Caching** — remembers successful fetches and domain tier preferences to avoid redundant requests

## Installation

```bash
npm install
npx patchright install chromium  # Required for stealth browser tier
```

## Usage

```bash
# Fetch a page (auto-selects tier, extracts content, writes to file)
webfetch https://example.com/page

# Extract only JSON-LD structured data
webfetch https://example.com/product --jsonld

# Save raw HTML without extraction
webfetch https://example.com/page --raw

# Force a specific tier
webfetch https://example.com/page --tier stealth

# Skip cache
webfetch https://example.com/page --no-cache

# Re-extract from a saved HTML file
webfetch extract /tmp/webfetch/example.com/page.html

# Interactive browser for hard-blocked sites
webfetch browse https://example.com/page
webfetch browse https://example.com/page --brightdata
```

## Output

Files are organized by domain under the output directory (default: `/tmp/webfetch/`):

```
/tmp/webfetch/
  example.com/
    page-a1b2c3.md        # Extracted markdown
    page-a1b2c3.json      # JSON-LD (if found)
```

## Configuration

Layered config: CLI flags > env vars > `.webfetchrc` > defaults.

| Variable | Description | Default |
|----------|-------------|---------|
| `WEBFETCH_OUTPUT_DIR` | Output directory | `/tmp/webfetch` |
| `BRIGHTDATA_API_TOKEN` | Bright Data API token (enables unlocker/browser tiers) | — |

Create a `.webfetchrc` file in the project root for persistent config:

```json
{
  "output": { "dir": "/tmp/webfetch" },
  "tiers": { "maxAuto": "unlocker" },
  "cache": { "ttl": 3600 }
}
```

## Claude Code Skill

webfetch includes a Claude Code skill file at `skill/webfetch.md` that teaches AI agents when and how to use the CLI. To install it, symlink or copy to your skills directory:

```bash
mkdir -p ~/.claude/skills/webfetch
ln -s $(pwd)/skill/webfetch.md ~/.claude/skills/webfetch/webfetch.md
```

## Architecture

```
src/
  cli.ts              # Commander CLI entry point
  config.ts           # Layered config (CLI > env > .webfetchrc > defaults)
  fetch/              # Tiered fetchers (direct, patchright, brightdata) + router
  extract/            # Content pipeline (JSON-LD, readability, markdown)
  detect/             # Block detection (Cloudflare, Akamai, PerimeterX)
  output/             # File writer with domain-based directory structure
  cache/              # URL and domain tier caching
```

## Development

```bash
npm test              # Run unit tests
npm run typecheck     # Type check
npm run lint          # Lint with Biome
npm run format        # Format with Biome
npm run build         # Build to dist/
npx tsx src/cli.ts    # Run CLI in dev mode
```

## License

MIT
