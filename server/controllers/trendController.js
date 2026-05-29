const trendService    = require("../services/trendService");
const redditService   = require("../services/redditService");
const deepseekService = require("../services/deepseekService");
const cacheService    = require("../services/cacheService");
const { fetchAndCache, refreshAll } = require("../cronJob");

// ─── Category → subreddits map ────────────────────────────────────────────────
const CATEGORY_SUBS = {
  all:  "worldnews,technology,business,science",
  tech: "technology,programming,MachineLearning",
  news: "worldnews,politics,news",
};

const scoreAndClassify = (p) => {
  const velocityScore  = trendService.computeVelocity(p.score, p.ageHours);
  const debateScore    = trendService.computeDebateRatio(p.numComments, p.score);
  const compositeScore = trendService.computeComposite(p);
  const enriched       = { ...p, velocityScore, debateScore, compositeScore };
  return { ...enriched, ...trendService.classifyBlogPotential(enriched) };
};

// ─── GET /api/trends/google ───────────────────────────────────────────────────
const getGoogleTrends = async (req, res) => {
  try {
    const { geo = "US", filter = "true" } = req.query;
    let trends = await trendService.fetchGoogleTrends(geo);
    if (filter === "true") trends = trends.filter((t) => t.isUsable);
    res.status(200).json({ success: true, geo, count: trends.length, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/trends/google/topics ───────────────────────────────────────────
const getGoogleBlogTopics = async (req, res) => {
  try {
    const { geo = "US", minScore = 0 } = req.query;
    const allTrends = await trendService.fetchGoogleTrends(geo);
    const usable = allTrends
      .filter((t) => t.isUsable && t.blogScore >= parseFloat(minScore))
      .sort((a, b) => b.blogScore - a.blogScore);
    const byCategory = {};
    usable.forEach((t) => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t);
    });
    res.status(200).json({ success: true, geo, totalUsableTopics: usable.length, topBlogTopics: usable.slice(0, 10), byCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/trends/google/related ──────────────────────────────────────────
const getRelatedQueries = async (req, res) => {
  try {
    const { keyword, geo = "US" } = req.query;
    if (!keyword) return res.status(400).json({ success: false, message: "keyword required" });
    const related = await trendService.fetchRelatedQueries(keyword, geo);
    res.status(200).json({ success: true, keyword, geo, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/trends/reddit ───────────────────────────────────────────────────
const getRedditTrends = async (req, res) => {
  try {
    const { feed = "hot", subreddit = "all", limit = 25 } = req.query;
    const posts = await redditService.fetchRedditFeed(subreddit, feed, parseInt(limit));
    res.status(200).json({ success: true, subreddit, feed, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/trends/reddit/search ───────────────────────────────────────────
const searchReddit = async (req, res) => {
  try {
    const { q, sort = "hot", t = "week", limit = 25, subreddit } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "q required" });
    const posts = await redditService.searchReddit(q, sort, t, parseInt(limit), subreddit);
    res.status(200).json({ success: true, query: q, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/trends/reddit/comments/:postId ─────────────────────────────────
const getRedditComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { subreddit = "all", limit = 20 } = req.query;
    const comments = await redditService.fetchComments(subreddit, postId, parseInt(limit));
    res.status(200).json({ success: true, postId, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/trends/combined  — WITH SUPABASE CACHE
// Flow: check cache → if hit return cached → if miss fetch live + save to cache
// ═══════════════════════════════════════════════════════════════════════════════
const getCombinedTrends = async (req, res) => {
  try {
    const {
      geo       = "US",
      category  = "all",
      subreddits,           // optional override
      limit     = 20,
      verbose   = "false",
      minScore  = 100,
      force     = "false",  // force=true bypasses cache
    } = req.query;

    const resolvedSubs = subreddits || CATEGORY_SUBS[category] || CATEGORY_SUBS.all;
    const subList      = resolvedSubs.split(",").map((s) => s.trim());
    const scoreThreshold = parseInt(minScore);

    // ── Check Supabase cache first ──────────────────────────────────────────
    if (force !== "true") {
      const cached = await cacheService.getCache(geo, category);
      if (cached) {
        return res.status(200).json({
          success:      true,
          fetchedAt:    cached.fetched_at,
          expiresAt:    cached.expires_at,
          fromCache:    true,
          geo,
          category,
          subreddits:   subList,
          summary:      cached.summary,
          topPicks:     cached.top_picks,
          googleTrends: {
            totalFetched:  cached.google_trends.length,
            usableTopics:  cached.google_trends.length,
            data:          cached.google_trends,
          },
        });
      }
    }

    // ── Cache miss — fetch live ─────────────────────────────────────────────
    const [googleResult, ...redditFeeds] = await Promise.allSettled([
      trendService.fetchGoogleTrends(geo),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "hot",    parseInt(limit))),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "rising", Math.ceil(parseInt(limit) / 2))),
      redditService.fetchRedditFeed("all",     "hot", parseInt(limit)),
      redditService.fetchRedditFeed("popular", "hot", parseInt(limit)),
    ]);

    const seen = new Set();
    const uniquePosts = redditFeeds
      .filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
      .filter((p) => {
        const key = p.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .filter((p) => p.score >= scoreThreshold && !p.stickied && p.upvoteRatio >= 0.6);

    const scoredPosts = uniquePosts
      .map(scoreAndClassify)
      .filter((p) => p.blogPotential !== "SKIP")
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 30);

    const googleRaw    = googleResult.status === "fulfilled" ? googleResult.value : [];
    const googleTopics = googleRaw.filter((t) => t.isUsable).slice(0, 25);

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
      writableTopics:           topPicks.length,
      buckets: {
        BREAKING:        scoredPosts.filter((p) => p.blogPotential === "BREAKING").length,
        HOT_DEBATE:      scoredPosts.filter((p) => p.blogPotential === "HOT_DEBATE").length,
        HOT_STORY:       scoredPosts.filter((p) => p.blogPotential === "HOT_STORY").length,
        VIRAL_FEEL_GOOD: scoredPosts.filter((p) => p.blogPotential === "VIRAL_FEEL_GOOD").length,
        EVERGREEN:       scoredPosts.filter((p) => p.blogPotential === "EVERGREEN").length,
        MONITOR:         scoredPosts.filter((p) => p.blogPotential === "MONITOR").length,
      },
    };

    // ── Save to Supabase cache (async, don't await) ─────────────────────────
    cacheService.setCache(geo, category, resolvedSubs, { topPicks, googleTrends: googleTopics, summary })
      .catch((err) => console.error("Cache save failed:", err.message));

    const response = {
      success:      true,
      fetchedAt:    new Date().toISOString(),
      fromCache:    false,
      geo,
      category,
      subreddits:   subList,
      summary,
      topPicks,
      googleTrends: {
        totalFetched: googleRaw.length,
        usableTopics: googleTopics.length,
        filteredOut:  googleRaw.length - googleTopics.length,
        data:         googleTopics,
      },
    };

    if (verbose === "true") response.fullRedditData = scoredPosts;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/trends/resync   — force refresh one or all cache entries
// Body: { geo: "US", category: "all" }  — omit both to refresh everything
// ═══════════════════════════════════════════════════════════════════════════════
const resyncCache = async (req, res) => {
  try {
    const { geo, category, all = false } = req.body || {};

    if (all || (!geo && !category)) {
      // Full resync — runs in background, returns immediately
      res.status(202).json({
        success: true,
        message: "Full resync started in background. All geo+category combos will be refreshed.",
        note:    "Check /api/trends/cache-status to see progress",
      });
      // Run async after response sent
      refreshAll().catch((err) => console.error("Background resync error:", err.message));
      return;
    }

    // Single combo resync
    const resolvedGeo      = (geo || "US").toUpperCase();
    const resolvedCategory = (category || "all").toLowerCase();

    // Invalidate existing cache first
    await cacheService.invalidateCache(resolvedGeo, resolvedCategory);

    // Fetch fresh data and cache it
    const result = await fetchAndCache(resolvedGeo, resolvedCategory);
    if (!result) {
      return res.status(500).json({ success: false, message: "Resync fetch failed" });
    }

    res.status(200).json({
      success:   true,
      message:   `Cache refreshed for geo=${resolvedGeo} category=${resolvedCategory}`,
      fetchedAt: new Date().toISOString(),
      topPicksCount:     result.topPicks?.length || 0,
      googleTopicsCount: result.googleTrends?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/trends/cache-status  — view all cached entries
// ═══════════════════════════════════════════════════════════════════════════════
const getCacheStatus = async (req, res) => {
  try {
    const entries = await cacheService.getAllCache();
    const now     = new Date();

    const enriched = entries.map((e) => ({
      key:       e.cache_key,
      geo:       e.geo,
      category:  e.category,
      fetchedAt: e.fetched_at,
      expiresAt: e.expires_at,
      isExpired: new Date(e.expires_at) < now,
      ageMinutes: Math.round((now - new Date(e.fetched_at)) / 60000),
      writableTopics: e.summary?.writableTopics || 0,
    }));

    res.status(200).json({
      success:      true,
      totalEntries: entries.length,
      freshEntries: enriched.filter((e) => !e.isExpired).length,
      entries:      enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Collect + AI analyze (two-step flow) ────────────────────────────────────
const collectTrends = async (req, res) => {
  try {
    const { geo = "US", subreddits = "worldnews,technology,business,science", limit = 10 } = req.query;
    const subList = subreddits.split(",").map((s) => s.trim());

    const [googleResult, ...redditResults] = await Promise.allSettled([
      trendService.fetchGoogleTrends(geo),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "hot", parseInt(limit))),
      redditService.fetchRedditFeed("all", "hot", parseInt(limit)),
    ]);

    const seen = new Set();
    const allPosts = redditResults
      .filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
      .filter((p) => {
        const key = p.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .filter((p) => p.score >= 100 && !p.stickied && p.upvoteRatio >= 0.6);

    const scoredPosts = allPosts
      .map(scoreAndClassify)
      .filter((p) => p.blogPotential !== "SKIP")
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 20);

    const googleData = (googleResult.status === "fulfilled" ? googleResult.value : [])
      .filter((t) => t.isUsable).slice(0, 25);

    const topPicks = scoredPosts
      .filter((p) => ["BREAKING","HOT_DEBATE","HOT_STORY","VIRAL_FEEL_GOOD","EVERGREEN"].includes(p.blogPotential))
      .slice(0, 10)
      .map((p, i) => ({
        rank: i + 1, title: p.title, subreddit: `r/${p.subreddit}`,
        blogPotential: p.blogPotential, blogLabel: p.blogLabel,
        suggestedAngle: p.suggestedAngle, urgency: p.urgency,
        signals: { score: p.score, velocityPerHr: p.velocityScore, debateRatio: p.debateScore, ageHours: p.ageHours },
        url: p.url, sourceUrl: p.externalUrl,
      }));

    res.status(200).json({
      success: true, fetchedAt: new Date().toISOString(), geo, subreddits: subList,
      nextStep: "POST /api/trends/ai-analyze with _forAiAnalysis below",
      topPicks,
      googleTrends: { count: googleData.length, data: googleData },
      _forAiAnalysis: { redditPosts: scoredPosts, googleTrends: googleData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const aiAnalyze = async (req, res) => {
  try {
    const { redditPosts, googleTrends, geo = "US", niche = "general" } = req.body;
    if (!redditPosts || !Array.isArray(redditPosts)) {
      return res.status(400).json({ success: false, message: "redditPosts array required. Call GET /collect first." });
    }
    const result = await deepseekService.analyzeTrends({
      redditPosts: redditPosts.slice(0, 15), googleTrends: (googleTrends || []).slice(0, 10), geo, niche,
    });
    res.status(200).json({ success: true, geo, niche, analyzedAt: new Date().toISOString(), summary: result.analysis_summary, blogTopics: result.blog_topics || [], skipReasons: result.skip_reasons || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, rawDump: error.rawResponse?.slice(0, 800) || null });
  }
};

const generateBrief = async (req, res) => {
  try {
    const { topic, geo = "US" } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "topic required" });
    const brief = await deepseekService.generateBlogBrief(topic, geo);
    res.status(200).json({ success: true, topic, geo, brief });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const analyzeWithAI = async (req, res) => res.status(400).json({
  success: false,
  message: "Use two-step flow: GET /collect then POST /ai-analyze",
  step1: "GET /api/trends/collect", step2: "POST /api/trends/ai-analyze",
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/trends/niche?niches=AI,fitness,crypto&geo=US&limit=12
// Strategy:
//   Reddit  → searchReddit(keyword) per niche — finds hot posts about that topic
//   Google  → filter existing trending_now results by niche keyword match (free)
// ═══════════════════════════════════════════════════════════════════════════════
const getNicheTrends = async (req, res) => {
  try {
    const { niches, geo = "US", limit = 12 } = req.query;
    if (!niches) return res.status(400).json({ success: false, message: "niches param required (comma-separated keywords)" });

    const nicheList = niches.split(",").map((n) => n.trim()).filter(Boolean).slice(0, 5);
    const lc = nicheList.map((n) => n.toLowerCase());

    // Fetch Google trends + Reddit search per niche in parallel
    const [googleResult, ...redditSearches] = await Promise.allSettled([
      trendService.fetchGoogleTrends(geo),
      ...nicheList.map((niche) => redditService.searchReddit(niche, "hot", "week", parseInt(limit))),
    ]);

    // Google: filter existing trending results by niche keyword match
    const googleRaw = googleResult.status === "fulfilled" ? googleResult.value : [];
    const googleFiltered = googleRaw
      .filter((t) => {
        const text = [t.title, t.category, t.suggestedAngle, ...(t.relatedQueries || [])].join(" ").toLowerCase();
        return lc.some((k) => text.includes(k));
      })
      .slice(0, 15);

    // Reddit: score + classify per niche
    const nicheResults = nicheList.map((niche, i) => {
      const posts = redditSearches[i]?.status === "fulfilled" ? redditSearches[i].value : [];
      const scored = posts
        .filter((p) => p.score >= 50 && !p.stickied && p.upvoteRatio >= 0.6)
        .map(scoreAndClassify)
        .filter((p) => p.blogPotential !== "SKIP")
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 8)
        .map((p, idx) => ({
          rank: idx + 1, title: p.title, subreddit: `r/${p.subreddit}`,
          blogPotential: p.blogPotential, blogLabel: p.blogLabel,
          suggestedAngle: p.suggestedAngle, urgency: p.urgency,
          signals: { score: p.score, velocityPerHr: p.velocityScore, debateRatio: p.debateScore, ageHours: p.ageHours, upvoteRatio: p.upvoteRatio },
          url: p.url, sourceUrl: p.externalUrl,
        }));
      return { niche, postCount: scored.length, posts: scored };
    });

    res.status(200).json({
      success:      true,
      fetchedAt:    new Date().toISOString(),
      fromCache:    false,
      geo,
      niches:       nicheList,
      nicheResults,
      googleTrends: { count: googleFiltered.length, data: googleFiltered },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/trends/niche-ideas?niche=tech&geo=US
// Uses SerpAPI RELATED_QUERIES + category-specific trending to generate blog ideas
// ═══════════════════════════════════════════════════════════════════════════════
const getNicheIdeas = async (req, res) => {
  try {
    const { niche, geo = "US" } = req.query;
    if (!niche) return res.status(400).json({ success: false, message: "niche param required" });

    const result = await trendService.fetchNicheContentIdeas(niche, geo);
    res.status(200).json({ success: true, fetchedAt: new Date().toISOString(), ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Debug ────────────────────────────────────────────────────────────────────
const debugSerpApi = async (req, res) => {
  try {
    const { getJson } = require("serpapi");
    const { geo = "US", engine = "google_trends_trending_now" } = req.query;
    getJson({ engine, geo, hl: "en", api_key: process.env.SURPAPI_KEY }, (json) => {
      if (json.error) return res.status(400).json({ success: false, serpError: json.error });
      res.status(200).json({ success: true, availableKeys: Object.keys(json), firstItemRaw: json["trending_searches"]?.[0], totalItems: json["trending_searches"]?.length || 0, fullRawResponse: json });
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const debugReddit = async (req, res) => {
  try {
    const axios = require("axios");
    const { subreddit = "worldnews", feed = "hot", limit = 3 } = req.query;
    const url = `https://www.reddit.com/r/${subreddit}/${feed}.json?limit=${limit}&raw_json=1`;
    const { data } = await axios.get(url, { headers: { "User-Agent": "BloggingAgent/1.0" } });
    const firstPost = data?.data?.children?.[0]?.data || {};
    res.status(200).json({ success: true, url, availableFields: Object.keys(firstPost), firstPostRaw: firstPost });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const debugDeepSeek = async (req, res) => {
  try {
    const start  = Date.now();
    const result = await deepseekService.callDeepSeek("Respond only with valid JSON.", 'Return: { "status": "connected", "model": "deepseek-chat" }', 50, 15000);
    res.status(200).json({ success: true, responseTimeMs: Date.now() - start, keyPresent: !!process.env.DEEPSEEK_KEY, rawResponse: result, parsedResponse: deepseekService.parseJSON(result) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, keyPresent: !!process.env.DEEPSEEK_KEY });
  }
};

module.exports = {
  getGoogleTrends, getGoogleBlogTopics, getRelatedQueries,
  getRedditTrends, searchReddit, getRedditComments,
  getCombinedTrends, resyncCache, getCacheStatus,
  collectTrends, aiAnalyze, analyzeWithAI, generateBrief,
  getNicheTrends, getNicheIdeas,
  debugSerpApi, debugReddit, debugDeepSeek,
};