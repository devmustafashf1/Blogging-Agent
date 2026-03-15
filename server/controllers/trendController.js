const trendService    = require("../services/trendService");
const redditService   = require("../services/redditService");
const deepseekService = require("../services/deepseekService");

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

// ─── GET /api/trends/combined ─────────────────────────────────────────────────
const getCombinedTrends = async (req, res) => {
  try {
    const { geo = "US", subreddits = "technology,worldnews", limit = 20, verbose = "false", minScore = 100 } = req.query;
    const subList        = subreddits.split(",").map((s) => s.trim());
    const scoreThreshold = parseInt(minScore);

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
        signals: { score: p.score, velocityPerHr: p.velocityScore, debateRatio: p.debateScore, ageHours: p.ageHours },
        url: p.url,
      }));

    const response = {
      success: true, fetchedAt: new Date().toISOString(), geo, subreddits: subList,
      summary: {
        totalRedditPostsAnalyzed: uniquePosts.length, writableTopics: topPicks.length,
        buckets: {
          BREAKING: scoredPosts.filter((p) => p.blogPotential === "BREAKING").length,
          HOT_DEBATE: scoredPosts.filter((p) => p.blogPotential === "HOT_DEBATE").length,
          HOT_STORY: scoredPosts.filter((p) => p.blogPotential === "HOT_STORY").length,
          VIRAL_FEEL_GOOD: scoredPosts.filter((p) => p.blogPotential === "VIRAL_FEEL_GOOD").length,
          EVERGREEN: scoredPosts.filter((p) => p.blogPotential === "EVERGREEN").length,
          MONITOR: scoredPosts.filter((p) => p.blogPotential === "MONITOR").length,
        },
      },
      topPicks,
      googleTrends: { totalFetched: googleRaw.length, usableTopics: googleTopics.length, data: googleTopics },
    };
    if (verbose === "true") response.fullRedditData = scoredPosts;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — GET /api/trends/collect
// Fast: fetches Reddit + Google, returns in 2-4 seconds, NO AI
// Call this first, show results to user immediately
// ════════════════════════════════════════════════════════════════════════════
const collectTrends = async (req, res) => {
  try {
    const {
      geo        = "US",
      subreddits = "worldnews,technology,business,science",
      limit      = 10,
    } = req.query;

    const subList = subreddits.split(",").map((s) => s.trim());

    // Fetch everything in parallel — Reddit hot per sub + r/all + Google
    const [googleResult, ...redditResults] = await Promise.allSettled([
      trendService.fetchGoogleTrends(geo),
      ...subList.map((sub) => redditService.fetchRedditFeed(sub, "hot", parseInt(limit))),
      redditService.fetchRedditFeed("all", "hot", parseInt(limit)),
    ]);

    // Merge + deduplicate Reddit
    const seen = new Set();
    const allPosts = redditResults
      .filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
      .filter((p) => {
        const key = p.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .filter((p) => p.score >= 100 && !p.stickied && p.upvoteRatio >= 0.6);

    // Pre-score Reddit posts
    const scoredPosts = allPosts
      .map(scoreAndClassify)
      .filter((p) => p.blogPotential !== "SKIP")
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 20);

    // Google — usable only
    const googleData = (googleResult.status === "fulfilled" ? googleResult.value : [])
      .filter((t) => t.isUsable).slice(0, 25);

    // Slim picks for immediate display
    const topPicks = scoredPosts
      .filter((p) => ["BREAKING","HOT_DEBATE","HOT_STORY","VIRAL_FEEL_GOOD","EVERGREEN"].includes(p.blogPotential))
      .slice(0, 10)
      .map((p, i) => ({
        rank:           i + 1,
        title:          p.title,
        subreddit:      `r/${p.subreddit}`,
        blogPotential:  p.blogPotential,
        blogLabel:      p.blogLabel,
        suggestedAngle: p.suggestedAngle,
        urgency:        p.urgency,
        signals: {
          score:        p.score,
          velocityPerHr: p.velocityScore,
          debateRatio:  p.debateScore,
          ageHours:     p.ageHours,
        },
        url:            p.url,
        sourceUrl:      p.externalUrl,
      }));

    res.status(200).json({
      success:    true,
      fetchedAt:  new Date().toISOString(),
      geo,
      subreddits: subList,
      nextStep:   "POST /api/trends/ai-analyze with the redditPosts and googleTrends arrays below",
      topPicks,
      googleTrends: {
        count: googleData.length,
        data:  googleData.map((t) => ({
          rank: t.rank, title: t.title, category: t.category,
          estimatedVolume: t.estimatedVolume, blogScore: t.blogScore,
          suggestedAngle: t.suggestedAngle,
        })),
      },
      // These arrays feed directly into POST /ai-analyze
      _forAiAnalysis: {
        redditPosts:  scoredPosts,
        googleTrends: googleData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — POST /api/trends/ai-analyze
// Takes data from /collect, sends to DeepSeek, returns AI blog topics
// Can take 15-30 seconds — set Postman timeout to 60000ms
// Body: { redditPosts: [...], googleTrends: [...], geo: "US", niche: "general" }
// ════════════════════════════════════════════════════════════════════════════
const aiAnalyze = async (req, res) => {
  try {
    const { redditPosts, googleTrends, geo = "US", niche = "general" } = req.body;

    if (!redditPosts || !Array.isArray(redditPosts)) {
      return res.status(400).json({
        success: false,
        message: "redditPosts array required in body. Call GET /api/trends/collect first, then use the _forAiAnalysis field from that response as the body here.",
      });
    }

    const result = await deepseekService.analyzeTrends({
      redditPosts:  redditPosts.slice(0, 15),
      googleTrends: (googleTrends || []).slice(0, 10),
      geo,
      niche,
    });

    res.status(200).json({
      success:    true,
      geo,
      niche,
      analyzedAt: new Date().toISOString(),
      summary:    result.analysis_summary,
      blogTopics: result.blog_topics   || [],
      skipReasons:result.skip_reasons  || {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      rawDump: error.rawResponse ? error.rawResponse.slice(0, 800) : null,
      tip:     error.message === "JSON_PARSE_FAILED"
        ? "DeepSeek returned non-JSON. Check rawDump above to see what it returned."
        : "Check DeepSeek key and connection.",
    });
  }
};

// ─── POST /api/trends/brief ───────────────────────────────────────────────────
const generateBrief = async (req, res) => {
  try {
    const { topic, geo = "US" } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "topic required in body" });
    const brief = await deepseekService.generateBlogBrief(topic, geo);
    res.status(200).json({ success: true, topic, geo, brief });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      rawDump: error.rawResponse ? error.rawResponse.slice(0, 500) : null,
    });
  }
};

// ─── Debug ────────────────────────────────────────────────────────────────────
const debugSerpApi = async (req, res) => {
  try {
    const { getJson } = require("serpapi");
    const { geo = "US", engine = "google_trends_trending_now" } = req.query;
    getJson({ engine, geo, hl: "en", api_key: process.env.SURPAPI_KEY }, (json) => {
      if (json.error) return res.status(400).json({ success: false, serpError: json.error });
      res.status(200).json({
        success: true, availableKeys: Object.keys(json),
        firstItemRaw: json["trending_searches"]?.[0],
        totalItems: json["trending_searches"]?.length || 0,
        fullRawResponse: json,
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const debugReddit = async (req, res) => {
  try {
    const axios = require("axios");
    const { subreddit = "worldnews", feed = "hot", limit = 3 } = req.query;
    const url = `https://www.reddit.com/r/${subreddit}/${feed}.json?limit=${limit}&raw_json=1`;
    const { data } = await axios.get(url, { headers: { "User-Agent": "BloggingAgent/1.0" } });
    const firstPost = data?.data?.children?.[0]?.data || {};
    res.status(200).json({ success: true, url, availableFields: Object.keys(firstPost), firstPostRaw: firstPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const debugDeepSeek = async (req, res) => {
  try {
    const start  = Date.now();
    const result = await deepseekService.callDeepSeek(
      "Respond only with valid JSON.",
      'Return: { "status": "connected", "model": "deepseek-chat" }',
      50, 15000
    );
    res.status(200).json({
      success: true,
      responseTimeMs: Date.now() - start,
      keyPresent:     !!process.env.DEEPSEEK_KEY,
      keyPrefix:      process.env.DEEPSEEK_KEY?.slice(0, 8) + "...",
      rawResponse:    result,
      parsedResponse: deepseekService.parseJSON(result),
    });
  } catch (error) {
    res.status(500).json({
      success: false, error: error.message,
      keyPresent: !!process.env.DEEPSEEK_KEY,
      note: error.response?.status === 401 ? "401 — wrong DEEPSEEK_KEY"
          : error.response?.status === 429 ? "429 — rate limited, wait and retry"
          : error.message,
    });
  }
};

// ─── GET /api/trends/analyze — kept for backward compat, calls collect+ai ────
const analyzeWithAI = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: "This endpoint caused socket timeouts. Use the two-step flow instead:",
    step1: "GET  /api/trends/collect?geo=US&subreddits=worldnews,technology&limit=10",
    step2: "POST /api/trends/ai-analyze  (body = _forAiAnalysis from step 1 response + geo + niche)",
    reason: "Splitting into two calls prevents Postman socket timeouts on the slow DeepSeek call.",
  });
};

module.exports = {
  getGoogleTrends, getGoogleBlogTopics, getRelatedQueries,
  getRedditTrends, searchReddit, getRedditComments,
  getCombinedTrends,
  collectTrends,
  aiAnalyze,
  analyzeWithAI,
  generateBrief,
  debugSerpApi, debugReddit, debugDeepSeek,
};