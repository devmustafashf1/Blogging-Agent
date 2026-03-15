const { getJson } = require("serpapi");

const SERPAPI_KEY = process.env.SURPAPI_KEY;

const estimateVolumeFromRank = (rank) => {
  if (rank === 1)        return "5M+";
  if (rank <= 3)         return "2M+";
  if (rank <= 5)         return "1M+";
  if (rank <= 10)        return "500K+";
  if (rank <= 20)        return "200K+";
  if (rank <= 35)        return "100K+";
  if (rank <= 50)        return "50K+";
  if (rank <= 70)        return "20K+";
  return                        "10K+";
};

const isUsableTrend = (title) => {
  const t = title.toLowerCase().trim();

  // Too short
  if (t.length < 4) return false;

  // Pure match score formats: "team vs team" or "team - team"
  if (/^[\w\s\u00C0-\u024F]+ vs\.? [\w\s\u00C0-\u024F]+$/.test(t)) return false;
  if (/^[\w\s\u00C0-\u024F]+ [\-\u2013\u2014] [\w\s\u00C0-\u024F]+$/.test(t)) return false;

  // Pure weather — only single/double word weather queries
  if (/^(weather|forecast|accuweather)$/.test(t)) return false;
  if (/^(weather|live weather|today weather|tomorrow weather|weather today|weather tomorrow|weather tonight|weather update|weather forecast)$/.test(t)) return false;

  // Pure sports leagues with nothing attached
  if (/^(nfl|nba|nhl|mlb|nascar|la liga|bundesliga|serie a|ligue 1|epl|mls|ipl|psl|f1 standings|premier league)$/.test(t)) return false;

  // Completely generic single-word queries
  if (/^(news|google|youtube|facebook|instagram|twitter|amazon|netflix|tiktok|kick|pl|f1)$/.test(t)) return false;

  // Passes — potentially bloggable
  return true;
};

const categorizeTrend = (title) => {
  const t = title.toLowerCase();
  if (/\b(dead|died|death|passed away|obituary|rip|alive|health)\b/.test(t))
    return { category: "CELEBRITY_NEWS", angle: "Breaking news update + background + why people care" };
  if (/\b(war|attack|missiles?|airstrike|military|troops|invasion|conflict)\b/.test(t))
    return { category: "WORLD_NEWS",    angle: "Situation explained + timeline + what happens next" };
  if (/\b(arrested?|charged?|indicted?|trial|lawsuit|scandal|accused?)\b/.test(t))
    return { category: "CONTROVERSY",  angle: "What happened + background + public reaction" };
  if (/\b(iphone|android|ai|chatgpt|tech|app|software|update|launch|release)\b/.test(t))
    return { category: "TECH",         angle: "What is it + specs/features + should you care" };
  if (/\b(price|cost|economy|inflation|recession|stock|market|gdp|trade)\b/.test(t))
    return { category: "ECONOMY",      angle: "What changed + why it matters + impact on everyday life" };
  if (/\b(movie|film|show|series|season|trailer|cast|streaming|netflix|oscar)\b/.test(t))
    return { category: "ENTERTAINMENT",angle: "Everything you need to know + review or preview" };
  if (/\b(election|vote|president|senator|congress|parliament|party|political)\b/.test(t))
    return { category: "POLITICS",     angle: "What happened + analysis + what it means going forward" };
  if (/\b(mothers?|fathers?|valentines?|christmas|eid|diwali|holiday|celebration)\b/.test(t))
    return { category: "SEASONAL",     angle: "Gift guides, traditions, history, how to celebrate" };
  return { category: "GENERAL", angle: "News summary + context + relevance to readers" };
};

const fetchGoogleTrends = (geo = "US") => {
  return new Promise((resolve, reject) => {
    getJson({ engine: "google_trends_trending_now", geo, hl: "en", api_key: SERPAPI_KEY },
    async (json) => {
      if (json.error) return reject(new Error(json.error));
      const raw = json["trending_searches"] || [];
      const formatted = raw.map((item, index) => {
        const title              = item.query || item.title || "";
        const rank               = index + 1;
        const { category, angle } = categorizeTrend(title);
        return {
          rank,
          title,
          category,
          suggestedAngle:  angle,
          relatedQueries:  (item.related_queries || []).slice(0, 5),
          articles:        (item.articles || []).slice(0, 3).map((a) => ({
            title: a.title, source: a.source, url: a.url,
            timeAgo: a.time_ago, snippet: a.snippet || "",
          })),
          trafficVolume:   item.formattedTraffic || null,
          estimatedVolume: item.formattedTraffic || estimateVolumeFromRank(rank),
          hasRealVolume:   !!item.formattedTraffic,
          blogScore:       computeGoogleBlogScore(title, rank, item),
          isUsable:        isUsableTrend(title),
          geo,
        };
      });

      // Enrich top 8 usable with no articles via related queries
      const toEnrich = formatted.filter((t) => t.isUsable && t.articles.length === 0).slice(0, 8);
      if (toEnrich.length > 0) {
        const enriched = await Promise.allSettled(toEnrich.map((t) => fetchRelatedQueries(t.title, geo)));
        toEnrich.forEach((t, i) => {
          if (enriched[i].status === "fulfilled") {
            const idx = formatted.findIndex((f) => f.title === t.title);
            if (formatted[idx].relatedQueries.length === 0) {
              formatted[idx].relatedQueries = (enriched[i].value.rising || []).slice(0, 5);
              formatted[idx].topRelated     = (enriched[i].value.top    || []).slice(0, 5);
            }
          }
        });
      }
      resolve(formatted);
    });
  });
};

const computeGoogleBlogScore = (title, rank, item) => {
  let score = 0;
  if (rank <= 5)       score += 5;
  else if (rank <= 10) score += 4;
  else if (rank <= 20) score += 3;
  else if (rank <= 35) score += 2;
  else                 score += 1;
  if (item.articles?.length > 0)       score += 3;
  if (item.related_queries?.length > 0) score += 2;
  if (item.formattedTraffic)            score += 2;
  const t = title.toLowerCase();
  if (/\b(why|how|what|when|who|explained?|guide|review|update|news)\b/.test(t)) score += 1;
  if (/\b(alive|dead|died|arrested|war|crisis|ban|leaked?|exposed?|confirmed?)\b/.test(t)) score += 2;
  return parseFloat(score.toFixed(2));
};

const fetchRelatedQueries = (keyword, geo = "US") => {
  return new Promise((resolve, reject) => {
    getJson({ engine: "google_trends", q: keyword, geo, data_type: "RELATED_QUERIES", api_key: SERPAPI_KEY },
    (json) => {
      if (json.error) return reject(new Error(json.error));
      const related = json["related_queries"] || {};
      resolve({ rising: related.rising || [], top: related.top || [] });
    });
  });
};

const classifyBlogPotential = (post) => {
  const { velocityScore, debateScore, score, numComments, subreddit, stickied, ageHours } = post;
  if (stickied) return { blogPotential: "SKIP", blogLabel: "Mod thread", reason: "Auto thread", suggestedAngle: null, urgency: "none" };
  if (score < 50 && velocityScore < 10) return { blogPotential: "SKIP", blogLabel: "Too low", reason: "No traction", suggestedAngle: null, urgency: "none" };
  if (velocityScore > 3000 && ageHours < 8) return { blogPotential: "BREAKING", blogLabel: "Breaking — publish now", reason: `${velocityScore.toFixed(0)} upvotes/hr`, suggestedAngle: "News summary + context + what happens next", urgency: "HIGH — write within 2 hours" };
  if (score > 20000 && debateScore < 0.08) return { blogPotential: "VIRAL_FEEL_GOOD", blogLabel: "Viral — listicle", reason: `${score.toLocaleString()} upvotes, low debate`, suggestedAngle: "Listicle, reaction post", urgency: "MEDIUM — publish today" };
  if (debateScore > 0.15) return { blogPotential: "HOT_DEBATE", blogLabel: "Opinion piece", reason: `debateScore ${debateScore.toFixed(2)}`, suggestedAngle: "Opinion: take a side, explain both perspectives", urgency: "MEDIUM — 24–48h" };
  if (velocityScore > 800 && debateScore > 0.08) return { blogPotential: "HOT_STORY", blogLabel: "News blog", reason: `velocity ${velocityScore.toFixed(0)}/hr`, suggestedAngle: "Explainer: what, why, what next", urgency: "MEDIUM — 6 hours" };
  if (["science", "technology", "programming", "history"].includes(subreddit) && score > 1000) return { blogPotential: "EVERGREEN", blogLabel: "Evergreen SEO post", reason: `r/${subreddit}, ${score} upvotes`, suggestedAngle: "Deep-dive explainer", urgency: "LOW — this week" };
  return { blogPotential: "MONITOR", blogLabel: "Watch it", reason: `velocity ${velocityScore.toFixed(0)}/hr`, suggestedAngle: "Check again in 2–3 hours", urgency: "NONE" };
};

const computeVelocity    = (score, ageHours) => (!ageHours || ageHours <= 0) ? score : parseFloat((score / ageHours).toFixed(2));
const computeDebateRatio = (numComments, score) => (!score || score <= 0) ? 0 : parseFloat((numComments / score).toFixed(3));
const computeComposite   = (post) => {
  const v = computeVelocity(post.score, post.ageHours);
  const d = computeDebateRatio(post.numComments, post.score);
  return parseFloat((Math.min(v/100,10)*0.4 + Math.min(post.score/1000,10)*0.35 + Math.min(d*10,10)*0.25).toFixed(4));
};

module.exports = {
  fetchGoogleTrends, fetchRelatedQueries,
  estimateVolumeFromRank, isUsableTrend, categorizeTrend,
  classifyBlogPotential,
  computeVelocity, computeDebateRatio, computeComposite,
};