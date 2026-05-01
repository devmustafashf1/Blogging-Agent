# Development Guide

## Prerequisites

- Node.js 18+
- npm
- Supabase project (for DB)
- SerpAPI account (for Google Trends)
- DeepSeek API key (for AI features)

---

## Environment Setup

Create `server/.env`:

```env
PORT=5000
JWT_SECRET=<strong-random-secret>

# Supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# SerpAPI (Google Trends)
SURPAPI_KEY=<your-serpapi-key>

# DeepSeek AI
DEEPSEEK_KEY=<your-deepseek-key>
```

> ⚠️ Note: The env variable name for SerpAPI is `SURPAPI_KEY` (not `SERPAPI_KEY`) — typo in the codebase, do not change without updating `trendService.js` and `deepseekService.js`.

---

## Running Locally

### Backend
```bash
cd server
npm install
npm run dev     # nodemon with auto-reload
# OR
node index.js   # production start
```
Server available at: `http://localhost:5000`

### Frontend
```bash
cd content-catalyst
npm install
npm run dev
```
App available at: `http://localhost:8080`

Vite proxies API calls or you set the backend URL directly in the fetch calls.

---

## Scripts

### Frontend (`content-catalyst/package.json`)
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Dev server on port 8080 |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Code linting |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Watch mode tests |

### Backend (`server/package.json`)
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `nodemon index.js` | Dev server with auto-reload |
| `start` | `node index.js` | Production start |

---

## Supabase Database Setup

Create these tables in your Supabase project:

### `users`
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `trends_cache`
```sql
CREATE TABLE trends_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  geo TEXT NOT NULL,
  category TEXT NOT NULL,
  subreddits TEXT,
  top_picks JSONB,
  google_trends JSONB,
  summary JSONB,
  fetched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

---

## Project-Specific Conventions

### Backend
- Services are pure functions — no Express req/res — they receive plain arguments and return data
- Controllers handle req/res and call services
- All async operations use `try/catch` with `res.status(500).json({ error })`
- Supabase client imported from `../config/supabase.js` — single shared instance

### Frontend
- All imports use `@/` alias (maps to `src/`)
- Shadcn components from `@/components/ui/`
- Page components in `src/pages/`, layout components in `src/components/`
- Forms use React Hook Form + Zod for validation
- Server state via TanStack React Query (`useQuery`/`useMutation`)
- Notifications via `toast()` from `sonner`

---

## Debugging

### Test API connectivity
```bash
# Test SerpAPI
curl http://localhost:5000/api/trends/debug/serpapi

# Test Reddit
curl http://localhost:5000/api/trends/debug/reddit

# Test DeepSeek
curl http://localhost:5000/api/trends/debug/deepseek
```

### Force cache refresh
```bash
curl -X POST http://localhost:5000/api/trends/resync \
  -H "Content-Type: application/json" \
  -d '{"geo": "US", "category": "all"}'
```

### Check cache status
```bash
curl http://localhost:5000/api/trends/cache-status
```

### Bypass cache
```bash
curl "http://localhost:5000/api/trends/combined?geo=US&category=all&force=true"
```

---

## Known Issues

1. **Plain-text passwords** — `bcryptjs` imported in `authController.js` but not used. Hash passwords before saving.
2. **SerpAPI env var typo** — `SURPAPI_KEY` (missing E) — must match across `.env` and service files
3. **No JWT on frontend** — Auth stores user object in localStorage, no token-based protection; most API routes are publicly accessible
4. **AI endpoint timeouts** — DeepSeek can take 60–90s; browser may show request timeout for `/analyze` on slow connections
5. **Cron job starts on every server launch** — If running multiple instances, cache will be refreshed multiple times at midnight
