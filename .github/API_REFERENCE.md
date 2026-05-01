# API Reference

Base URL: `http://localhost:5000`

All protected routes require: `Authorization: Bearer <token>` header.

---

## Authentication — `/api/auth`

### POST `/api/auth/signup`
Register a new user.

**Body:**
```json
{ "name": "string", "email": "string", "password": "string" }
```

**Success (201):**
```json
{ "message": "User created", "user": { "id": "...", "name": "...", "email": "..." } }
```

**Error (400):** Email already in use.

---

### POST `/api/auth/login`
Login with email and password.

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Success (200):**
```json
{ "message": "Login successful", "user": { "id": "...", "name": "...", "email": "..." } }
```

---

## Trends — `/api/trends`

### GET `/api/trends/combined`
**Main endpoint.** Returns scored trends from Google + Reddit, served from Supabase cache when fresh.

**Query Params:**
| Param | Default | Description |
|-------|---------|-------------|
| `geo` | `US` | Region code: US, GB, PK, IN, CA |
| `category` | `all` | `all`, `tech`, `news` |
| `limit` | `25` | Max trends to return |
| `minScore` | `0` | Minimum blog score filter |
| `force` | `false` | Bypass cache and force live fetch |
| `verbose` | `false` | Include extra debug info |

**Response:**
```json
{
  "fromCache": true,
  "fetchedAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-01T06:00:00Z",
  "topPicks": [ /* top 8 blog topics */ ],
  "googleTrends": [ /* top 25 Google trends */ ],
  "summary": { /* stats object */ }
}
```

**topPicks item shape:**
```json
{
  "source": "reddit|google",
  "title": "string",
  "score": 0,
  "classification": "BREAKING|HOT_DEBATE|HOT_STORY|VIRAL|EVERGREEN|MONITOR|SKIP",
  "compositeScore": 0,
  "velocityScore": 0,
  "debateScore": 0
}
```

**googleTrends item shape:**
```json
{
  "rank": 1,
  "title": "string",
  "category": "TECH|CELEBRITY_NEWS|POLITICS|...",
  "blogScore": 0,
  "articles": [],
  "estimatedVolume": 5000000,
  "isUsable": true
}
```

---

### POST `/api/trends/resync`
Force refresh cache for one or all geo+category combos. Returns 202 immediately; refresh runs in background.

**Body (optional):**
```json
{ "geo": "US", "category": "tech" }
```
Omit body to refresh all combinations.

---

### GET `/api/trends/cache-status`
Returns all entries currently in the `trends_cache` table.

---

### GET `/api/trends/google`
Raw Google Trends for a region.

**Query Params:** `geo` (default: `US`)

---

### GET `/api/trends/google/topics`
Filtered and scored Google trends with blog angles.

**Query Params:** `geo`, `minScore`

---

### GET `/api/trends/google/related`
Related/rising search queries for a keyword.

**Query Params:** `keyword` (required), `geo`

---

### GET `/api/trends/reddit`
Raw Reddit feed posts.

**Query Params:**
| Param | Default |
|-------|---------|
| `subreddit` | `all` |
| `feed` | `hot` — hot / rising / new / top / controversial |
| `limit` | `25` |
| `timeFilter` | `day` |

---

### GET `/api/trends/reddit/search`
Search Reddit posts.

**Query Params:** `q` (required), `sort`, `timeFilter`, `limit`, `subreddit`

---

### GET `/api/trends/reddit/comments/:postId`
Top-level comments for a Reddit post.

**Path Param:** `postId` — Reddit post ID (t3_xxxxx)

---

### POST `/api/trends/ai-analyze`
Run DeepSeek AI analysis on provided trend data.

**Body:**
```json
{
  "redditPosts": [],
  "googleTrends": [],
  "geo": "US",
  "niche": "general"
}
```

**Response:**
```json
{
  "analysis_summary": "string",
  "blog_topics": [
    {
      "rank": 1,
      "topic": "string",
      "why_write": "string",
      "seo_keywords": [],
      "urgency": "high|medium|low",
      "score": 8
    }
  ]
}
```

---

### POST `/api/trends/brief`
Generate a full blog brief (title, outline, SEO data) for a topic.

**Body:**
```json
{ "topic": "string", "geo": "US" }
```

**Response:**
```json
{
  "blog_title": "string",
  "meta_description": "string",
  "outline": [],
  "target_audience": "string",
  "word_count": 1500,
  "seo_keywords": [],
  "cta": "string"
}
```

---

### GET `/api/trends/analyze`
Full pipeline: collect Google + Reddit trends + DeepSeek AI analysis in one call.

**Query Params:** `geo`, `category`

---

## Debug Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/trends/debug/serpapi` | Test SerpAPI connectivity |
| `GET /api/trends/debug/reddit` | Test Reddit API connectivity |
| `GET /api/trends/debug/deepseek` | Test DeepSeek API connectivity |
