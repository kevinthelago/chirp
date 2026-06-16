# Chirp

![CI](https://github.com/kevinthelago/chirp/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/github/license/kevinthelago/chirp)
![Last commit](https://img.shields.io/github/last-commit/kevinthelago/chirp)

A simple Twitter-like social network. Post chirps, follow people, like posts.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x |
| Framework | Next.js 15 (App Router — RSC + Route Handlers) |
| UI | React 19 + Tailwind CSS 4 |
| Auth | Auth.js v5 (NextAuth) — Credentials provider (email + password) |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon in production; local Postgres for dev) |
| Validation | Zod |
| Unit tests | Vitest 2 |
| E2E tests | Playwright |
| Hosting | Vercel + Vercel Postgres |

---

## Architecture

```
chirp/
├── app/
│   ├── (auth)/          # /login, /signup — public auth pages
│   ├── (app)/           # Authenticated shell: home feed, settings
│   ├── [handle]/        # Public profile page
│   ├── explore/         # Search / trending page
│   └── actions/         # Server Actions (auth, chirps, follow, likes, profile)
├── components/          # Shared React components (ChirpCard, Composer, …)
├── lib/
│   ├── db.ts            # Prisma client singleton
│   ├── auth.ts          # Auth.js config
│   ├── chirp.ts         # Chirp helpers
│   ├── feed.ts          # Home feed query
│   ├── explore.ts       # Explore / search query
│   └── follow.ts        # Follow helpers
├── prisma/
│   └── schema.prisma    # Data model (User, Chirp, Follow, Like)
├── tests/
│   ├── helpers/         # Factories, rollback harness
│   ├── unit/            # Auth and feed-ordering unit tests
│   ├── integration/     # Chirp, Follow, Like, Feed integration tests
│   └── e2e/             # Playwright smoke: signup→post→follow→feed→like
├── vitest.config.ts
├── playwright.config.ts
└── vercel.json
```

### Data model

```
User ─┬─< Chirp >─< Like >─ User
      └─< Follow (follower ↔ following) >─ User
```

Key schema constraints:
- `Follow(followerId, followingId)` — unique composite; prevents duplicate follows.
- `Like(userId, chirpId)` — unique composite; prevents duplicate likes.
- Cascade deletes: deleting a User removes their Chirps, Follows, and Likes.

---

## Getting started

### Prerequisites

- Node.js ≥ 22
- PostgreSQL 14+ (local) **or** a [Neon](https://neon.tech) connection string

### Install

```bash
git clone https://github.com/kevinthelago/chirp.git
cd chirp
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for Auth.js session tokens — `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Yes | Full URL of the app (e.g. `http://localhost:3000` locally) |

### Database

```bash
npm run db:migrate   # Apply migrations (dev — creates migration files)
npm run db:generate  # Regenerate the Prisma client after schema changes
npm run db:studio    # Open Prisma Studio in the browser
```

### Dev server

```bash
npm run dev
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm test` | Run Vitest unit + integration tests |
| `npm run test:coverage` | Vitest with v8 coverage report |
| `npm run e2e` | Run Playwright E2E smoke tests |
| `npm run e2e:ui` | Open Playwright UI mode |

---

## Running tests

### Unit + integration (Vitest)

Tests require a Postgres database. Point `DATABASE_URL` at a **test-specific** instance — the setup will run `prisma migrate deploy` and then clean all tables between every test.

```bash
# With a local Postgres instance:
DATABASE_URL="postgresql://user:pass@localhost:5432/chirp_test" npm test

# Or set it in .env.test:
echo 'DATABASE_URL="postgresql://..."' > .env.test
npm test
```

**Test-DB / transaction-rollback harness.** Each test runs inside an `afterEach` that deletes all rows in FK-safe order (`Like → Chirp → Follow → User`), giving each test a clean slate without paying the cost of full schema resets. For pure-function tests that accept a `Prisma.TransactionClient`, `tests/helpers/db.ts` provides a `withRollback()` helper that wraps the test body in a Prisma interactive transaction and throws at the end to guarantee rollback.

### E2E (Playwright)

Requires the app to be running. Locally, `playwright.config.ts` starts `npm run dev` automatically.

```bash
# Make sure DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL are set, then:
npm run e2e
```

In CI the app is pre-built and started before Playwright runs (see `.github/workflows/ci.yml`).

---

## CI pipeline

`.github/workflows/ci.yml` runs on every push to `develop` or `main`, and on PRs targeting those branches.

| Job | Description |
|---|---|
| `static` | `next lint` + `tsc --noEmit` |
| `unit` | Vitest unit + integration against a Postgres 16 service container |
| `e2e` | Playwright smoke test against a built production Next.js server |
| `compliance` | GDPR / SOC2 / ISO 27001 scan — blocks on `medium`+ findings |
| `cycles` | Import cycle detection via `madge` — zero tolerance |

All jobs are required to pass before a PR can be merged.

---

## Compliance

The app stores PII (email addresses) and password hashes. The CI compliance gate runs three lenses:

| Lens | Why |
|---|---|
| GDPR | Email addresses are personal data |
| SOC2 | Password hashes — credential storage controls |
| ISO 27001 | Baseline information security |

**Threshold: `medium`** — any finding at severity `medium`, `high`, or `critical` fails the gate.

Run the full compliance scan locally with the Compliance MCP tool (`scan_project` + `compliance_gate`). The MCP server is pre-wired in `.mcp.json`.

---

## Complexity hotspots

The Complexity Analyzer MCP server (`find_hotspots`) is wired into the dev environment via `.mcp.json`. Run it to surface algorithmic hot spots before code review.

Known areas to watch as the codebase grows:

| Area | Risk |
|---|---|
| `lib/feed.ts` — `getFeed()` | Fan-out query across followed users; add pagination + index on `(authorId, createdAt)` (already in schema) |
| `app/explore/**` — search | Full-text or ILIKE queries can be O(n) without a Postgres index |
| `app/actions/auth.ts` — `register` | `bcrypt.hash` is intentionally slow (cost factor 10); run it in a Worker if latency matters |

---

## Dependency graph

Import cycles are blocked by the CI `cycles` job. In development, the Dependency Graph MCP tool (`detect_cycles`) provides richer analysis including symbol-level cycle paths.

---

## Deploying to Vercel

1. Push to `main` (via the `develop → main` PR).
2. Vercel picks up the `vercel.json` build command: `prisma generate && prisma migrate deploy && next build`.
3. Set the three environment variables in the Vercel dashboard:
   - `DATABASE_URL` — Vercel Postgres or Neon connection string
   - `NEXTAUTH_SECRET` — generate with `openssl rand -hex 32`
   - `NEXTAUTH_URL` — your production URL (e.g. `https://chirp.vercel.app`)

Migrations run automatically as part of every deploy via `prisma migrate deploy`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

See [LICENSE](LICENSE).
