# Copilot Instructions — BloggingAgent (AI Content Pro)

This file provides complete project context for AI assistants. Read the referenced files for detailed information on each area.

---

## What This Project Is

**BloggingAgent** is a full-stack AI-powered content discovery platform. It automatically aggregates trending topics from Google Trends and Reddit, scores them for blog potential using custom algorithms, caches results in Supabase, and uses DeepSeek AI to generate blog briefs and content angles.

**See:** [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

---

## Repository Structure

```
BloggingAgent/
├── content-catalyst/     # React + TypeScript frontend (port 8080)
│   └── src/
│       ├── pages/        # 10 pages — only TrendsPage is live
│       ├── components/   # AppLayout, AppSidebar, TopBar + 60+ Shadcn UI components
│       ├── contexts/     # AuthContext (localStorage-based auth state)
│       └── hooks/        # use-toast, use-mobile
│
├── server/               # Node.js + Express backend (port 5000)
│   ├── config/           # Supabase client
│   ├── controllers/      # authController, trendController
│   ├── routes/           # authRoutes, trendRoutes
│   ├── middleware/        # JWT authMiddleware (unused on most routes)
│   ├── services/         # trendService, redditService, deepseekService, cacheService
│   ├── cronJob.js        # Midnight cache refresh
│   └── index.js          # Express entry point
│
└── .github/              # Project documentation (this folder)
```

---

## Key Documentation

| File | What it covers |
|------|---------------|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Goals, what works, what's a mockup, external services |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, request flow, tech stack, caching strategy |
| [API_REFERENCE.md](API_REFERENCE.md) | All REST endpoints with params, request/response shapes |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Supabase tables (`users`, `trends_cache`), JSONB column shapes |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | Pages, components, auth context, state management, styling |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md) | Services, controllers, cron job, scoring algorithms |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Setup, env vars, scripts, DB creation SQL, debugging commands |

---

## Critical Context for AI Assistance

### The Main Data Flow
```
User visits /trends
  → TrendsPage calls GET /api/trends/combined?geo=US&category=all
  → Server checks Supabase trends_cache (6-hour TTL)
  → Cache hit: return cached data
  → Cache miss: fetch Google Trends (SerpAPI) + Reddit (public API) in parallel
               → score + classify → save to cache → return
```

### What Pages Are Live vs Mockup
- **Live:** `/login`, `/trends`
- **Mockup only (no backend):** `/`, `/content`, `/publishing`, `/article`, `/analytics`, `/integrations`, `/settings`

### Important Naming Quirk
The SerpAPI environment variable has a typo: `SURPAPI_KEY` (not `SERPAPI_KEY`). This is used consistently across `server/.env`, `trendService.js`, and `deepseekService.js`. Do not "fix" this typo without updating all references.

### Auth Architecture
- Frontend stores plain user object in `localStorage` via `AuthContext`
- No JWT token issued or stored
- Backend JWT middleware exists (`authMiddleware.js`) but is not applied to trend routes — they are publicly accessible
- Passwords stored as plain text in Supabase (bcryptjs imported but unused in `authController.js`)

### Backend Service Design
- Services (`trendService.js`, `redditService.js`, etc.) are pure functions — they take plain arguments and return data, no Express objects
- Controllers (`trendController.js`) handle `req`/`res` and call services
- All services import the same Supabase client from `server/config/supabase.js`

### Cache Key Format
`buildKey(geo, category)` returns uppercase `GEO_CATEGORY` — e.g., `US_ALL`, `GB_TECH`, `IN_NEWS`

### AI Endpoint Timeouts
DeepSeek AI calls can take 60–90 seconds. The server applies a 120-second timeout to `/analyze` and `/brief` routes. Frontend should handle long loading states.

### Scoring & Classification
Reddit posts are scored with three metrics:
- `velocityScore` — engagement rate relative to post age
- `debateScore` — comment-to-upvote ratio (controversy signal)
- `compositeScore` — weighted combination

Posts are classified as: `BREAKING`, `HOT_DEBATE`, `HOT_STORY`, `VIRAL`, `EVERGREEN`, `MONITOR`, or `SKIP`

Google Trends are scored 0–10 with `blogScore` based on category (tech/science score higher), article count, and estimated volume.

---

## When Adding New Features

1. **New API endpoint:** Add route in `server/routes/trendRoutes.js`, handler in `server/controllers/trendController.js`, logic in a service file
2. **New frontend page:** Add component in `content-catalyst/src/pages/`, add route in `src/App.tsx`, add nav link in `AppSidebar.tsx`
3. **New cached data:** Update `cacheService.js` and the `trends_cache` table schema
4. **New external API:** Create a new service file in `server/services/`, add API key to `.env`

---

## Development Commands

```bash
# Backend
cd server && npm run dev          # port 5000

# Frontend
cd content-catalyst && npm run dev  # port 8080

# Test API endpoints
curl http://localhost:5000/api/trends/debug/serpapi
curl http://localhost:5000/api/trends/debug/reddit
curl "http://localhost:5000/api/trends/combined?geo=US&category=all"

# Force cache refresh
curl -X POST http://localhost:5000/api/trends/resync \
  -H "Content-Type: application/json" \
  -d '{"geo":"US","category":"all"}'
```
