# Architecture

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    BROWSER (React SPA)                       │
│              content-catalyst/  — port 8080                  │
│                                                              │
│  LoginPage → AuthContext (localStorage)                      │
│  TrendsPage → fetch /api/trends/combined  (LIVE)             │
│  Dashboard / Queue / Publishing / Analytics (UI MOCKUPS)     │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP (localhost:5000)
┌──────────────────────────▼───────────────────────────────────┐
│                  EXPRESS SERVER  — port 5000                  │
│                     server/index.js                           │
│                                                              │
│  /api/auth    ──► authController.js                          │
│  /api/trends  ──► trendController.js                         │
│                        │                                      │
│     ┌──────────────────┼─────────────────────┐               │
│     │                  │                     │               │
│  trendService.js  redditService.js  deepseekService.js       │
│  (Google Trends)  (Reddit API)      (AI Analysis)            │
│                   cacheService.js                            │
│                   (Supabase cache)                           │
│                                                              │
│  cronJob.js  ──►  runs refreshAll() every midnight           │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─► SerpAPI      (Google Trends)
       ├─► Reddit API   (public, no auth)
       ├─► DeepSeek API (AI)
       └─► Supabase     (DB: users, trends_cache)
```

## Request Flow: Combined Trends (Main Endpoint)

```
GET /api/trends/combined?geo=US&category=all
        │
        ├─► Check Supabase Cache (trends_cache table)
        │      ├─ Found + not expired → return { fromCache: true, ... }
        │      └─ Missing / expired → live fetch
        │
        └─► Parallel Live Fetch:
              ├─ Google Trends via SerpAPI
              ├─ Reddit: worldnews, technology, business, science (hot + rising)
              ├─ Reddit: r/all hot
              └─ Reddit: r/popular hot
              │
              └─► Merge & Score:
                    ├─ Deduplicate by title prefix
                    ├─ Filter: score >= 100, upvoteRatio >= 0.6
                    ├─ Compute: velocityScore, debateScore, compositeScore
                    ├─ Classify: BREAKING / HOT_DEBATE / HOT_STORY / VIRAL / EVERGREEN / MONITOR / SKIP
                    ├─ Pick top 8 for topPicks
                    └─ Pick top 25 usable Google trends
                    │
                    └─► Upsert to Supabase (6-hour TTL) → Return response
```

## Frontend Routing

```
App.tsx
├── / (root)      → ProtectedRoute → AppLayout
│   ├── /         → Dashboard
│   ├── /trends   → TrendsPage  ← only page with live API calls
│   ├── /content  → ContentQueuePage
│   ├── /publishing → PublishingPage
│   ├── /article  → ArticlePage
│   ├── /analytics → AnalyticsPage
│   ├── /integrations → IntegrationsPage
│   └── /settings → SettingsPage
├── /login        → LoginPage
└── *             → NotFound
```

## Caching Strategy

- **Store:** Supabase `trends_cache` table
- **TTL:** 6 hours from `fetched_at`
- **Key format:** `"GEO_CATEGORY"` (e.g., `"US_TECH"`)
- **Warm-up:** cron job runs at midnight daily for all geo+category combos
- **Bypass:** `?force=true` query param on `/combined` endpoint

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18.3.1 |
| Language | TypeScript 5.8.3 |
| Bundler | Vite 5.4.19 |
| Routing | React Router DOM 6.30.1 |
| Styling | Tailwind CSS 3.4.17 |
| UI Library | Shadcn UI (Radix UI primitives) |
| Forms | React Hook Form 7.61.1 |
| Data Fetching | TanStack React Query 5.83.0 |
| Charts | Recharts 2.15.4 |
| Notifications | Sonner 1.7.4 |
| Validation | Zod 3.25.76 |
| Icons | Lucide React 0.462.0 |
| Testing | Vitest 3.2.4 |

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Express 5.2.1 |
| Language | JavaScript (Node.js) |
| Database | Supabase (PostgreSQL) |
| HTTP Client | Axios 1.13.6 |
| Scheduling | node-cron 4.2.1 |
| Auth | JWT (jsonwebtoken 9.0.3) |
| Dev Server | Nodemon 3.1.14 |
