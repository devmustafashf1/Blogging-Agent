# Database Schema

Database: **Supabase (PostgreSQL)**
Client: `@supabase/supabase-js` v2

---

## Table: `users`

Stores registered user accounts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, auto-generated |
| `name` | TEXT | Display name |
| `email` | TEXT | Unique, used for login |
| `password` | TEXT | Stored plain-text (⚠️ security issue — bcryptjs imported but unused) |

**Auth:** Login compares `password` directly (no hashing). JWT is **not** issued on login — user object returned directly and stored in localStorage via `AuthContext`.

---

## Table: `trends_cache`

Caches combined Google + Reddit trend data to avoid repeated API calls.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `cache_key` | TEXT | Unique key — format: `"GEO_CATEGORY"` (e.g., `"US_TECH"`, `"GB_ALL"`) |
| `geo` | TEXT | Region code: US, GB, PK, IN, CA |
| `category` | TEXT | Category: all, tech, news |
| `subreddits` | TEXT | Comma-separated subreddits used for this fetch |
| `top_picks` | JSONB | Array of top 8 blog-worthy topics (scored + classified) |
| `google_trends` | JSONB | Array of top 25 Google trends (scored + categorized) |
| `summary` | JSONB | Stats object (counts, sources, etc.) |
| `fetched_at` | TIMESTAMPTZ | When the cache was populated |
| `expires_at` | TIMESTAMPTZ | `fetched_at + 6 hours` — checked on each read |

**Cache key examples:** `US_ALL`, `US_TECH`, `US_NEWS`, `GB_ALL`, `PK_TECH`

**TTL Logic (cacheService.js):**
```js
// On read: if now > expires_at → cache miss → live fetch
// On write: expires_at = new Date(Date.now() + 6 * 60 * 60 * 1000)
// Upsert on conflict: cache_key column
```

---

## top_picks Item Shape (JSONB)

Each item in the `top_picks` array:

```json
{
  "source": "reddit | google",
  "title": "string",
  "score": 1500,
  "upvoteRatio": 0.95,
  "numComments": 300,
  "subreddit": "technology",
  "url": "https://reddit.com/...",
  "createdAt": "ISO date",
  "ageHours": 4.5,
  "velocityScore": 85,
  "debateScore": 12,
  "compositeScore": 92,
  "classification": "BREAKING | HOT_DEBATE | HOT_STORY | VIRAL | EVERGREEN | MONITOR | SKIP"
}
```

---

## google_trends Item Shape (JSONB)

Each item in the `google_trends` array:

```json
{
  "rank": 1,
  "title": "Trending Topic Name",
  "category": "TECH | CELEBRITY_NEWS | POLITICS | SCIENCE | HEALTH | ...",
  "blogScore": 7,
  "articles": [],
  "estimatedVolume": 5000000,
  "isUsable": true,
  "suggestedAngle": "How X changes Y forever"
}
```

---

## Supabase Client

**Config file:** `server/config/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

The same client instance is imported across all service files.
