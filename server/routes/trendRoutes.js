const express = require("express");
const router  = express.Router();
const {
  getGoogleTrends, getGoogleBlogTopics, getRelatedQueries,
  getRedditTrends, searchReddit, getRedditComments,
  getCombinedTrends, analyzeWithAI, generateBrief,
  debugSerpApi, debugReddit, debugDeepSeek,
} = require("../controllers/trendController");

router.get("/google",                  getGoogleTrends);
router.get("/google/topics",           getGoogleBlogTopics);
router.get("/google/related",          getRelatedQueries);
router.get("/reddit",                  getRedditTrends);
router.get("/reddit/search",           searchReddit);
router.get("/reddit/comments/:postId", getRedditComments);
router.get("/combined",                getCombinedTrends);
router.get("/analyze",                 analyzeWithAI);
router.post("/brief",                  generateBrief);
router.get("/debug/serpapi",           debugSerpApi);
router.get("/debug/reddit",            debugReddit);
router.get("/debug/deepseek",          debugDeepSeek);  // NEW

module.exports = router;