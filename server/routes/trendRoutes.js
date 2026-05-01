const express = require("express");
const router  = express.Router();
const {
  getGoogleTrends, getGoogleBlogTopics, getRelatedQueries,
  getRedditTrends, searchReddit, getRedditComments,
  getCombinedTrends, resyncCache, getCacheStatus,
  collectTrends, aiAnalyze, analyzeWithAI, generateBrief,
  getNicheTrends,
  debugSerpApi, debugReddit, debugDeepSeek,
} = require("../controllers/trendController");

// Google
router.get("/google",                  getGoogleTrends);
router.get("/google/topics",           getGoogleBlogTopics);
router.get("/google/related",          getRelatedQueries);

// Reddit
router.get("/reddit",                  getRedditTrends);
router.get("/reddit/search",           searchReddit);
router.get("/reddit/comments/:postId", getRedditComments);

// ── Main cached endpoint ──────────────────────────────────────────────────────
// GET  /combined?geo=US&category=all        → checks cache first
// GET  /combined?geo=US&category=all&force=true → bypass cache, fetch live
router.get("/combined",     getCombinedTrends);

// ── Cache management ──────────────────────────────────────────────────────────
// POST /resync                              → { geo, category } or { all: true }
// GET  /cache-status                        → see all cached entries
router.post("/resync",      resyncCache);
router.get("/cache-status", getCacheStatus);

// ── Niche-specific trend filtering ───────────────────────────────────────────
// GET /niche?niches=AI,fitness,crypto&geo=US
router.get("/niche", getNicheTrends);

// ── Two-step AI flow ──────────────────────────────────────────────────────────
router.get("/collect",      collectTrends);
router.post("/ai-analyze",  aiAnalyze);
router.post("/brief",       generateBrief);
router.get("/analyze",      analyzeWithAI);

// Debug
router.get("/debug/serpapi",  debugSerpApi);
router.get("/debug/reddit",   debugReddit);
router.get("/debug/deepseek", debugDeepSeek);

module.exports = router;