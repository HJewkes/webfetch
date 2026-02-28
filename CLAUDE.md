# webfetch

Smart web fetching CLI with tiered escalation and content extraction.

## Development

```bash
npm test              # Run unit tests
npm run typecheck     # Type check
npm run build         # Build to dist/
npx tsx src/cli.ts    # Run CLI in dev mode
```

## Architecture

- `src/fetch/` — Tiered fetchers (direct, patchright, brightdata) + router
- `src/extract/` — Content pipeline (JSON-LD, Defuddle readability, markdown)
- `src/detect/` — Block detection (Cloudflare, Akamai, PerimeterX)
- `src/output/` — File writer with domain-based directory structure
- `src/cache/` — URL and domain tier caching
- `src/cli.ts` — Commander CLI entry point
- `src/config.ts` — Layered config (CLI flags > env vars > .webfetchrc > defaults)

## Key Conventions

- `TierName` is defined in `src/fetch/types.ts` — import from there
- `VERSION` is read from `package.json` via `src/index.ts` — never hardcode
- Tests use vitest; mock external services (undici, patchright), not internal modules
- Patchright tests are integration tests excluded from CI (require browser install)
