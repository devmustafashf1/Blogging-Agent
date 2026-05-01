const axios           = require("axios");
const scraperService  = require("../services/scraperService");
const deepseekService = require("../services/deepseekService");

// ─── SSE helper ───────────────────────────────────────────────────────────────
const emit = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

// ─── DeepSeek: analyze scraped content ───────────────────────────────────────
const analyzeContent = async (topic, sources) => {
  const sourcesText = sources.map((s, i) =>
    `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\n${s.content.slice(0, 2500)}`
  ).join("\n\n---\n\n");

  const system = `You are a research analyst. Analyze scraped web content about a topic and extract structured insights. Respond ONLY with a raw JSON object — no markdown, no code fences, no explanation.`;

  const user = `Topic: "${topic}"

Scraped content from top sources:
${sourcesText}

Return ONLY this JSON (no extra text):
{
  "topic_summary": "2-3 sentence summary of what this topic is about",
  "key_facts": ["fact1", "fact2", "fact3", "fact4", "fact5"],
  "unique_angles": ["angle1", "angle2", "angle3"],
  "common_themes": ["theme1", "theme2", "theme3"],
  "content_gaps": ["gap1", "gap2"],
  "target_audience": "description of who cares about this topic",
  "best_angle_for_blog": "the single best creative angle to write from"
}`;

  const raw    = await deepseekService.callDeepSeek(system, user, 1200, 60000);
  const parsed = deepseekService.parseJSON(raw);
  if (!parsed) throw new Error("Analysis JSON parse failed");
  return parsed;
};

// ─── DeepSeek: write final blog ───────────────────────────────────────────────
const writeBlog = async (topic, sources, analysis) => {
  const insightText = JSON.stringify(analysis, null, 2);
  const snippets    = sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.content.slice(0, 800)}`).join("\n\n");

  const system = `You are a professional blog writer. Write an original, engaging, well-researched blog post. Respond ONLY with a raw JSON object — no markdown, no code fences, no explanation.`;

  const user = `Topic: "${topic}"

Research insights:
${insightText}

Source content snippets:
${snippets}

Write an original 1000-1300 word blog post from the angle: "${analysis.best_angle_for_blog || topic}"
Do NOT just summarize — be creative, opinionated, and add value beyond the sources.

Return ONLY this JSON:
{
  "title": "compelling blog title",
  "meta_description": "155-char SEO meta description",
  "intro": "2-3 paragraph engaging introduction",
  "sections": [
    { "heading": "section heading", "content": "3-4 paragraph section content" },
    { "heading": "section heading", "content": "3-4 paragraph section content" },
    { "heading": "section heading", "content": "3-4 paragraph section content" }
  ],
  "conclusion": "2 paragraph strong conclusion with CTA",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "estimated_word_count": 1100
}`;

  const raw    = await deepseekService.callDeepSeek(system, user, 3500, 120000);
  const parsed = deepseekService.parseJSON(raw);
  if (!parsed) throw new Error("Blog write JSON parse failed");
  return parsed;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/research/stream?topic=...&geo=US
// Server-Sent Events — streams pipeline events in real time
// ═══════════════════════════════════════════════════════════════════════════════
const streamResearch = async (req, res) => {
  const { topic, geo = "US" } = req.query;
  if (!topic) {
    res.status(400).json({ success: false, message: "topic required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type",                "text/event-stream");
  res.setHeader("Cache-Control",               "no-cache");
  res.setHeader("Connection",                  "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Heartbeat so the connection stays alive
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);

  const done = () => {
    clearInterval(heartbeat);
    res.end();
  };

  try {
    // ── Step 1: Search ──────────────────────────────────────────────────────
    emit(res, { type: "step", step: "search", status: "active", message: `Searching top sources for "${topic}"…` });

    const sources = await scraperService.findTopUrls(topic, geo, 3);

    if (!sources.length) {
      emit(res, { type: "step", step: "search", status: "error", message: "No sources found — check SerpAPI key or try a different topic" });
      emit(res, { type: "error", message: "No sources found" });
      return done();
    }

    emit(res, { type: "step", step: "search", status: "done", data: { sources } });

    // ── Step 2: Scrape each source ─────────────────────────────────────────
    const scraped = [];
    for (let i = 0; i < sources.length; i++) {
      emit(res, { type: "step", step: "scrape", index: i, status: "active", data: { url: sources[i].url, title: sources[i].title } });
      const result = await scraperService.scrapeContent(sources[i]);
      scraped.push(result);
      emit(res, {
        type:  "step",
        step:  "scrape",
        index: i,
        status: "done",
        data: {
          url:       result.url,
          title:     result.title,
          wordCount: result.wordCount,
          snippet:   result.content.slice(0, 220) + (result.content.length > 220 ? "…" : ""),
          fallback:  result.fallback,
        },
      });
    }

    // ── Collect images from all scraped sources ────────────────────────────
    const seenImgUrls = new Set();
    const topicImages = scraped
      .flatMap((s) => s.images || [])
      .filter((img) => {
        if (seenImgUrls.has(img.url)) return false;
        seenImgUrls.add(img.url);
        return true;
      })
      .slice(0, 12);

    // ── Step 3: AI Analyze ─────────────────────────────────────────────────
    emit(res, { type: "step", step: "analyze", status: "active", message: "AI analyzing all scraped content…" });
    const analysis = await analyzeContent(topic, scraped);
    emit(res, { type: "step", step: "analyze", status: "done", data: analysis });

    // ── Step 4: Write Blog ─────────────────────────────────────────────────
    emit(res, { type: "step", step: "write", status: "active", message: "Writing final blog post…" });
    const blog = await writeBlog(topic, scraped, analysis);
    blog.images = topicImages; // attach scraped images to blog payload
    emit(res, { type: "step", step: "write", status: "done", data: blog });

    // ── Complete ──────────────────────────────────────────────────────────
    emit(res, {
      type: "complete",
      data: {
        topic,
        geo,
        sources: scraped.map((s) => ({ url: s.url, title: s.title, wordCount: s.wordCount, fallback: s.fallback })),
        analysis,
        blog,
      },
    });
  } catch (err) {
    console.error("Research pipeline error:", err.message);
    emit(res, { type: "error", message: err.message || "Pipeline failed" });
  } finally {
    done();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/research/image?url=...
// Proxy fetches the image server-side (bypasses hotlink protection) and streams it
// ═══════════════════════════════════════════════════════════════════════════════
const proxyImage = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("url required");

  let parsed;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return res.status(400).send("invalid protocol");
    // Basic SSRF guard: block private / loopback ranges
    const h = parsed.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === "::1") {
      return res.status(400).send("forbidden");
    }
  } catch {
    return res.status(400).send("invalid url");
  }

  try {
    const upstream = await axios.get(url, {
      responseType: "stream",
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer":         parsed.origin + "/",
        "Accept":          "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const ct = upstream.headers["content-type"] || "image/jpeg";
    if (!ct.startsWith("image/")) return res.status(415).send("not an image");

    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    upstream.data.pipe(res);
  } catch (err) {
    console.error("Image proxy error:", err.message);
    res.status(502).send("image unavailable");
  }
};

module.exports = { streamResearch, proxyImage };
