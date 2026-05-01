const cron     = require("node-cron");
const trendService  = require("./services/trendService");
const redditService = require("./services/redditService");
const cacheService  = require("./services/cacheService");

// ─── Subreddit map per category ───────────────────────────────────────────────
const CATEGORY_SUBS = {
  all:  "worldnews,technology,business,science",
  tech: "technology,programming,MachineLearning",
  news: "worldnews,politics,news",
};

const GEOS = ["US", "GB", "PK", "IN", "CA"];

// ─── Core fetch + cache logic (shared by cron and manual resync) ──────────────
const fetchAndCache = async (geo, category) => {
  const subreddits = CATEGORY_SUBS[category] || CATEGORY_SUBS.all;
  const subList    = subreddits.split(",").map((s) => s.trim());
  const limit      = 20;

  console.log(`[CRON] Fetching geo=${geo} category=${category}...`);

  try {
    const [googleResult, ...redditFeeds] = await Promise.allSettled([
      trendService.fetchGoogleTrends(geo),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "hot",    limit)),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "rising", Math.ceil(limit / 2))),
      redditService.fetchRedditFeed("all",     "hot", limit),
      redditService.fetchRedditFeed("popular", "hot", limit),
    ]);

    // Merge + deduplicate Reddit
    const seen = new Set();
    const uniquePosts = redditFeeds
      .filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
      .filter((p) => {
        const key = p.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .filter((p) => p.score >= 100 && !p.stickied && p.upvoteRatio >= 0.6);

    // Score + classify
    const scoredPosts = uniquePosts
      .map((p) => {
        const velocityScore  = trendService.computeVelocity(p.score, p.ageHours);
        const debateScore    = trendService.computeDebateRatio(p.numComments, p.score);
        const compositeScore = trendService.computeComposite(p);
        const enriched       = { ...p, velocityScore, debateScore, compositeScore };
        return { ...enriched, ...trendService.classifyBlogPotential(enriched) };
      })
      .filter((p) => p.blogPotential !== "SKIP")
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 30);

    // Google
    const googleRaw    = googleResult.status === "fulfilled" ? googleResult.value : [];
    const googleTopics = googleRaw.filter((t) => t.isUsable).slice(0, 25);

    // Build topPicks
    const topPicks = scoredPosts
      .filter((p) => ["BREAKING","HOT_DEBATE","HOT_STORY","VIRAL_FEEL_GOOD","EVERGREEN"].includes(p.blogPotential))
      .slice(0, 8)
      .map((p, i) => ({
        rank: i + 1, title: p.title, subreddit: `r/${p.subreddit}`,
        blogPotential: p.blogPotential, blogLabel: p.blogLabel,
        suggestedAngle: p.suggestedAngle, urgency: p.urgency,
        signals: { score: p.score, velocityPerHr: p.velocityScore, debateRatio: p.debateScore, ageHours: p.ageHours, upvoteRatio: p.upvoteRatio },
        url: p.url, sourceUrl: p.externalUrl,
      }));

    const summary = {
      totalRedditPostsAnalyzed: uniquePosts.length,
      writableTopics: topPicks.length,
      buckets: {
        BREAKING:        scoredPosts.filter((p) => p.blogPotential === "BREAKING").length,
        HOT_DEBATE:      scoredPosts.filter((p) => p.blogPotential === "HOT_DEBATE").length,
        HOT_STORY:       scoredPosts.filter((p) => p.blogPotential === "HOT_STORY").length,
        VIRAL_FEEL_GOOD: scoredPosts.filter((p) => p.blogPotential === "VIRAL_FEEL_GOOD").length,
        EVERGREEN:       scoredPosts.filter((p) => p.blogPotential === "EVERGREEN").length,
        MONITOR:         scoredPosts.filter((p) => p.blogPotential === "MONITOR").length,
      },
    };

    // Save to Supabase cache
    await cacheService.setCache(geo, category, subreddits, {
      topPicks,
      googleTrends: googleTopics,
      summary,
    });

    console.log(`[CRON] Done: geo=${geo} category=${category} — ${topPicks.length} picks, ${googleTopics.length} google topics`);
    return { topPicks, googleTrends: googleTopics, summary };
  } catch (err) {
    console.error(`[CRON] Error for geo=${geo} category=${category}:`, err.message);
    return null;
  }
};

// ─── Refresh all combinations ─────────────────────────────────────────────────
const refreshAll = async () => {
  console.log("[CRON] Starting full cache refresh...");
  const combos = [];
  for (const geo of GEOS) {
    for (const category of Object.keys(CATEGORY_SUBS)) {
      combos.push({ geo, category });
    }
  }

  // Run sequentially to avoid rate limiting
  for (const { geo, category } of combos) {
    await fetchAndCache(geo, category);
    await new Promise((r) => setTimeout(r, 1500)); // 1.5s between calls
  }
  console.log("[CRON] Full cache refresh complete");
};

// ─── Schedule: every day at midnight ─────────────────────────────────────────
const startCronJob = () => {
  // "0 0 * * *" = midnight every day
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Midnight refresh triggered");
    await refreshAll();
  }, { timezone: "America/New_York" });

  console.log("[CRON] Daily midnight cache refresh scheduled");
};

module.exports = { startCronJob, refreshAll, fetchAndCache };