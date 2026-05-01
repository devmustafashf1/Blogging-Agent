# Backend Guide

**Location:** `server/`
**Entry point:** `server/index.js`
**Port:** `5000` (via `process.env.PORT`)
**Start:** `npm run dev` (nodemon) or `node index.js`

---

## File Structure

```
server/
├── index.js                     # Express app setup, route mounting, cron start
├── config/
│   └── supabase.js              # Supabase client singleton
├── routes/
│   ├── authRoutes.js            # POST /signup, /login
│   └── trendRoutes.js           # All /api/trends/* routes
├── controllers/
│   ├── authController.js        # Auth business logic
│   └── trendController.js       # Trend endpoint handlers (422 lines)
├── middleware/
│   └── authMiddleware.js        # JWT verification (currently unused on most routes)
├── services/
│   ├── trendService.js          # Google Trends scoring & enrichment
│   ├── redditService.js         # Reddit API wrapper
│   ├── deepseekService.js       # DeepSeek AI integration
│   └── cacheService.js          # Supabase cache read/write
└── cronJob.js                   # Scheduled cache refresh (midnight daily)
```

---

## index.js — Server Bootstrap

```js
// Key setup:
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/trends', trendRoutes)

// Long timeout for AI endpoints (DeepSeek can be slow)
app.use((req, res, next) => {
  if (req.path.includes('/analyze') || req.path.includes('/brief')) {
    req.setTimeout(120000)  // 2 minutes
  }
  next()
})

startCronJob()  // starts midnight refresh
```

---

## Services

### trendService.js
Handles Google Trends via SerpAPI.

**Key functions:**
- `fetchGoogleTrends(geo)` — Fetches trending searches, enriches with related queries, scores for blog potential
- `computeGoogleBlogScore(trend)` — Returns 0–10 score based on category, article count, and volume
- `isUsableTrend(title)` — Filters out sports scores, weather, generic terms via regex
- `categorizeTrend(title)` — Returns `{ category, suggestedAngle }` for a trend title
- `estimateVolumeFromRank(rank)` — Maps rank 1–25 to estimated search volume
- `fetchRelatedQueries(keyword, geo)` — Returns related/rising queries from SerpAPI

**Blog score criteria:**
- Tech, science, health, finance topics score higher
- Sports scores, weather, celebrity gossip score lower
- More articles = higher score (indicates momentum)

### redditService.js
Reddit public API wrapper (no API key required).

**Base URL:** `https://www.reddit.com`

**Key functions:**
- `fetchRedditFeed(subreddit, feed, limit, timeFilter)` — Returns posts with: id, title, score, upvoteRatio, numComments, url, createdAt, ageHours
- `searchReddit(query, sort, timeFilter, limit, subreddit)` — Full-text search
- `fetchComments(subreddit, postId, limit)` — Top-level comments for a post
- `fetchSubredditInfo(subreddit)` — Subscriber count, description

### deepseekService.js
DeepSeek AI integration for content intelligence.

**Model:** `deepseek-chat`
**Temperature:** `0.3` (low randomness, consistent output)
**Default timeout:** 90 seconds

**Key functions:**
- `callDeepSeek(systemPrompt, userContent, maxTokens, timeoutMs)` — Raw API call
- `parseJSON(raw)` — Robust parser handling markdown fences, leading/trailing text
- `analyzeTrends({ redditPosts, googleTrends, geo, niche })` — Returns blog_topics array (only topics scoring >= 6)
- `generateBlogBrief(topic, geo)` — Returns full blog brief (title, outline, meta, SEO keywords, CTA)

### cacheService.js
Manages the `trends_cache` Supabase table.

**Key functions:**
- `getCache(geo, category)` — Returns cached data if not expired; null otherwise
- `setCache(geo, category, subreddits, payload)` — Upserts cache, sets 6-hour TTL
- `invalidateCache(geo, category)` — Deletes one cache entry
- `invalidateAll()` — Clears entire cache table
- `getAllCache()` — Returns all cache entries (for `/cache-status` endpoint)
- `buildKey(geo, category)` — Builds cache key: `GEO_CATEGORY` in uppercase

---

## cronJob.js — Scheduled Cache Refresh

Runs **every day at midnight EST** using `node-cron`.

**Schedule:** `'0 0 * * *'` (cron syntax)

**`refreshAll()` logic:**
1. Iterates all combinations: GEOS × CATEGORIES
2. For each: calls `fetchAndCache(geo, category)`
3. Delays 1.5s between each call (rate limit protection)

**`fetchAndCache(geo, category)` logic:**
1. Fetch Google Trends (top 25 usable)
2. Fetch Reddit feeds in parallel (hot + rising for multiple subreddits, r/all, r/popular)
3. Deduplicate Reddit posts by title prefix
4. Filter: `score >= 100`, `upvoteRatio >= 0.6`
5. Compute `velocityScore`, `debateScore`, `compositeScore`
6. Classify each post (BREAKING, HOT_DEBATE, HOT_STORY, VIRAL, EVERGREEN, MONITOR, SKIP)
7. Select top 8 for `topPicks`
8. Upsert all to Supabase cache

**Subreddit mapping by category:**
- `all`: worldnews, technology, business, science, todayilearned, AskReddit
- `tech`: technology, programming, MachineLearning, artificial, webdev, cybersecurity
- `news`: worldnews, news, politics, USnews, Economics, geopolitics

---

## authController.js

- `signup` — Inserts to `users` table; catches error 23505 (duplicate email)
- `login` — Queries by email, compares plain-text password
- `googleLogin` — Placeholder, returns 501 Not Implemented

**⚠️ Known issue:** `bcryptjs` is imported but not used — passwords stored and compared as plain text.

---

## authMiddleware.js

Verifies JWT from `Authorization: Bearer <token>` header.
Sets `req.user` with decoded payload.

**Currently:** not applied to most routes (trends routes are publicly accessible).

---

## Error Handling

No global error handler middleware. Each controller uses individual try/catch blocks returning `{ error: message }` with appropriate status codes.
