# chirp

![License](https://img.shields.io/github/license/kevinthelago/chirp) ![Last commit](https://img.shields.io/github/last-commit/kevinthelago/chirp)

# Chirp — a simple Twitter clone

## Overview

# Chirp — a simple Twitter clone

## Tech stack

# Stack

A single full-stack repo — one Next.js app handles UI, API, and data access.

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript 5.x | Type safety across UI + server. |
| Framework | Next.js 15 (App Router) | Full-stack monolith: React Server Components + Route Handlers. One repo, one deploy. |
| UI | React 19 + Tailwind CSS 4 | Utility-first styling; minimal component surface. |
| Auth | Auth.js (NextAuth v5) — Credentials provider | Email+password sessions; no external OAuth needed for v1. |
| ORM | Prisma 6 | Schema-first, typed queries, easy migrations. |
| Datastore | PostgreSQL (Neon/local) | SQLite acceptable for local dev; Postgres for parity with prod. |
| Validation | Zod | Shared input validation for server actions / route handlers. |
| Testing | Vitest (unit/integration) + Playwright (E2E smoke) | CI gate on every PR. |
| Hosting | Vercel + hosted Postgres | One-click deploy of the Next.js app. |

**Toolchain binaries:** `npm`, `npx`, `prisma`, `vitest`, `playwright`.

## Getting started

```bash
git clone https://github.com/kevinthelago/chirp.git
cd chirp
# install dependencies and run the project's build/test/dev commands
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

See [LICENSE](LICENSE).

---

_Scaffolded by base-studio-code._