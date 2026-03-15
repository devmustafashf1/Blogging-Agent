const axios = require("axios");

const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const callDeepSeek = async (systemPrompt, userContent, maxTokens = 2000, timeoutMs = 90000) => {
  const response = await axios.post(
    DEEPSEEK_URL,
    {
      model:       "deepseek-chat",
      max_tokens:  maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userContent  },
      ],
    },
    {
      headers: {
        Authorization:  `Bearer ${DEEPSEEK_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: timeoutMs,
    }
  );
  return response.data.choices[0].message.content;
};

// ─── Robust JSON extractor ────────────────────────────────────────────────────
// DeepSeek sometimes wraps JSON in markdown, adds explanation text before/after,
// or returns partial JSON. This handles all cases.
const parseJSON = (raw) => {
  if (!raw) return null;

  // 1. Try direct parse first (cleanest case)
  try { return JSON.parse(raw.trim()); } catch {}

  // 2. Strip markdown code fences ```json ... ``` or ``` ... ```
  try {
    const stripped = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(stripped);
  } catch {}

  // 3. Extract first { ... } block (handles leading/trailing explanation text)
  try {
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
  } catch {}

  // 4. Nothing worked — return null and log raw for debugging
  console.error("parseJSON failed. Raw DeepSeek output:\n", raw?.slice(0, 500));
  return null;
};

const analyzeTrends = async ({ redditPosts, googleTrends, geo, niche = "general" }) => {
  const systemPrompt = `You are a blog content strategist. Analyze trending topics.
CRITICAL: Respond with ONLY a raw JSON object. No markdown. No code fences. No explanation text before or after. Start your response with { and end with }.`;

  const redditSummary = redditPosts.slice(0, 15).map((p) => ({
    id:       p.id,
    title:    p.title,
    sub:      p.subreddit,
    score:    p.score,
    comments: p.numComments,
    hours:    p.ageHours,
    velocity: p.velocityScore,
    debate:   p.debateScore,
  }));

  const googleSummary = googleTrends.slice(0, 10).map((t) => ({
    rank:     t.rank,
    title:    t.title,
    volume:   t.estimatedVolume,
    category: t.category,
  }));

  const userContent = `Geo: ${geo} | Niche: ${niche}
Reddit posts: ${JSON.stringify(redditSummary)}
Google trends: ${JSON.stringify(googleSummary)}

Respond with ONLY this raw JSON object (no markdown, no extra text):
{"analysis_summary":{"total_topics_reviewed":0,"writable_topics_found":0,"top_category_today":"","market_mood":""},"blog_topics":[{"rank":1,"source":"reddit","source_id":"","title":"","blog_title":"","category":"","subcategory":"","why_write_this":"","target_audience":"","search_intent":"informational","content_type":"explainer","suggested_angle":"","key_points_to_cover":["","",""],"seo_keywords":["","","","",""],"estimated_word_count":1000,"urgency":"TODAY","monetization_potential":"MEDIUM","competition_level":"LOW","overall_score":7.5}],"skip_reasons":{"too_vague":[],"too_niche":[],"no_angle":[],"saturated":[]}}

Fill in the template above with real data. Max 10 blog_topics. Only include topics with overall_score >= 6.`;

  const raw = await callDeepSeek(systemPrompt, userContent, 3000, 90000);

  // Store raw for debugging
  const parsed = parseJSON(raw);

  if (!parsed) {
    // Throw with raw response so controller can expose it
    const err = new Error("JSON_PARSE_FAILED");
    err.rawResponse = raw;
    throw err;
  }

  return parsed;
};

const generateBlogBrief = async (topic, geo = "US") => {
  const systemPrompt = `You are a senior blog editor. Respond with ONLY a raw JSON object. No markdown. No code fences. Start with { end with }.`;

  const userContent = `Topic: "${topic}" | Market: ${geo}
Respond with ONLY this raw JSON (no extra text):
{"blog_title":"","meta_description":"","outline":[{"section":"","points":["",""]}],"intro_hook":"","target_audience":"","tone":"conversational","word_count_target":1200,"seo_keywords":["","","","",""],"cta_suggestion":""}`;

  const raw = await callDeepSeek(systemPrompt, userContent, 1200, 45000);
  const parsed = parseJSON(raw);

  if (!parsed) {
    const err = new Error("JSON_PARSE_FAILED");
    err.rawResponse = raw;
    throw err;
  }

  return parsed;
};

module.exports = { analyzeTrends, generateBlogBrief, callDeepSeek, parseJSON };