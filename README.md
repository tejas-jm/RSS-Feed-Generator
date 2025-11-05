# RSS Feed Generator

A self-hosted, visual builder for turning any website into continuously updating RSS, Atom, or JSON feeds. Paste a URL, pick the elements you care about, preview the parsed items, and publish production-ready feeds that stay fresh via a built-in scheduler.

## Features

- 🖱️ **Visual selector builder** – load any page in a sandboxed iframe, highlight elements, and map them to feed fields with attribute and absolute-URL options.
- 🔄 **Multi-format feeds** – serve RSS 2.0, Atom 1.0, and JSON Feed 1.1 simultaneously with HTTP caching (ETag / `304 Not Modified`).
- ⏱️ **Automatic refresh** – configure cron expressions per feed; jobs run through a Node-based scheduler.
- 🧩 **Extensible mapping** – support for title, link, description, date parsing, images, authors, categories, tags, and custom fields.
- 🔐 **Admin-only dashboard** – credential-based authentication via NextAuth plus a clean dashboard for managing feeds.
- 🕸️ **Robust scraping** – Playwright-powered fetching with robots.txt awareness, Cheerio parsing, chrono-based date normalization, and absolute URL resolution.
- 🧠 **Caching & dedupe** – Redis-backed cache for fetched HTML and rendered feeds, with link/hash dedupe strategies.
- 🐳 **Production-ready** – Dockerfile and Docker Compose stack (Next.js app + Redis), Prisma ORM with SQLite (default) or Postgres, seeded demo feed, and automated tests.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-inspired components, lucide icons.
- **Backend:** Next.js Route Handlers, Prisma ORM, Playwright, Cheerio, node-cron scheduler, Redis caching.
- **Auth:** NextAuth credentials provider with configurable admin user.

## Getting started (local development)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   - `DATABASE_PROVIDER` defaults to `sqlite`. For Postgres set it to `postgresql` and update `DATABASE_URL` accordingly.
   - Update admin credentials and secrets as needed.
3. **Apply database schema & seed demo feed**
   ```bash
   npx prisma migrate deploy
   npm run prisma:generate
   npx prisma db seed
   ```
4. **Run the app**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) and sign in with the admin credentials from your environment file.

### Tests

- **Unit tests** (parser + templates):
  ```bash
  npm test
  ```
- **End-to-end pipeline test** (Playwright):
  ```bash
  npm run test:e2e
  ```

## Docker deployment

1. Ensure Docker and Docker Compose are installed.
2. Build and start the stack:
   ```bash
   docker-compose up --build
   ```
3. The application will be available at [http://localhost:3000](http://localhost:3000). Redis runs on port `6379`, and SQLite data is persisted in the `sqlite-data` volume.

### Environment variables

Key variables available for customization:

| Variable | Description |
| --- | --- |
| `DATABASE_PROVIDER` | `sqlite` (default) or `postgresql`. |
| `DATABASE_URL` | Connection string for the selected provider. |
| `REDIS_URL` | Redis connection string for caching. |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT/session encryption. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for dashboard access. |
| `ALLOW_ROBOTS` | When `false`, bypass robots.txt checks (development). |
| `MAX_CONCURRENCY` | Maximum simultaneous scraping tasks. |
| `REQUEST_TIMEOUT_MS` | Playwright navigation timeout. |
| `USER_AGENT` | Custom user agent for fetch requests. |
| `PUBLIC_BASE_URL` | Optional base URL used when generating absolute feed URLs. |

## Workflow overview

1. **Fetch & sanitize** – Playwright grabs the target page (with robots.txt respect) and stores a sanitized snapshot.
2. **Map fields** – Users click elements to capture selectors, choose attributes, and set transforms or absolute URL resolution.
3. **Preview** – Cheerio + chrono parse the snapshot into structured items; previews show both data rows and rendered feed markup.
4. **Persist** – Feed configuration is saved via Prisma, schedules are registered automatically, and on each run items are deduplicated and stored.
5. **Serve** – Public endpoints expose `/feeds/:id.rss`, `/feeds/:id.atom`, and `/feeds/:id.json` with Redis-backed caching and HTTP conditional responses.

## Using feeds in automation tools

Feeds are exposed with opaque IDs suitable for tools like n8n or Feedly. After saving a feed, copy the format-specific URLs and paste them into your automation workflow. Endpoints return `304 Not Modified` when nothing changes, reducing downstream polling costs.

## Development tips

- Scheduler registration happens lazily on the first API call. When running locally, visit the dashboard after starting to ensure jobs are registered.
- To adjust Playwright browser installation in Docker, modify the `npx playwright install --with-deps chromium` line in the Dockerfile.
- For Postgres deployments, run `npx prisma migrate deploy` with `DATABASE_PROVIDER=postgresql` and update the connection string before starting the server.

## License

[MIT](LICENSE)
