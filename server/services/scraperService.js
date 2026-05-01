const axios  = require("axios");
const cheerio = require("cheerio");
const { getJson } = require("serpapi");

const SERPAPI_KEY = process.env.SURPAPI_KEY;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

// Find top N URLs via SerpAPI Google Search, excluding video/forum noise
const findTopUrls = (topic, geo = "US", num = 3) => {
  return new Promise((resolve, reject) => {
    getJson(
      { engine: "google", q: topic, num: 10, gl: geo.toLowerCase(), hl: "en", api_key: SERPAPI_KEY },
      (json) => {
        if (json.error) return reject(new Error(json.error));
        const blocklist = ["youtube.com", "reddit.com", "twitter.com", "x.com", "tiktok.com", "instagram.com", "facebook.com"];
        const results = (json.organic_results || [])
          .filter((r) => r.link && !blocklist.some((b) => r.link.includes(b)))
          .slice(0, num)
          .map((r) => ({
            url:     r.link,
            title:   r.title  || "",
            snippet: r.snippet || "",
          }));
        resolve(results);
      }
    );
  });
};

// Scrape main text content from a URL using cheerio
const scrapeContent = async ({ url, title: fallbackTitle, snippet: fallbackSnippet }) => {
  let html;
  try {
    const { data } = await axios.get(url, { timeout: 12000, headers: HEADERS });
    html = data;
  } catch {
    // Scrape failed — return snippet as fallback content
    return {
      url,
      title:     fallbackTitle,
      content:   fallbackSnippet || "",
      wordCount: (fallbackSnippet || "").split(/\s+/).length,
      fallback:  true,
    };
  }

  const $ = cheerio.load(html);

  // Remove noise elements
  $("script, style, nav, footer, header, aside, form, .ad, .ads, .advertisement, .sidebar, .menu, .nav, .cookie, .popup, .banner, .newsletter, [class*='cookie'], [class*='popup'], [class*='social'], [class*='share'], [id*='cookie'], [id*='ad-']").remove();

  const title = $("h1").first().text().trim() || $("title").text().trim() || fallbackTitle;

  // Extract meaningful text blocks
  const blocks = [];
  $("h1, h2, h3, h4, p, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 40) blocks.push(text);
  });

  // Deduplicate and cap text
  const seen  = new Set();
  const clean = blocks.filter((t) => { if (seen.has(t)) return false; seen.add(t); return true; });
  const content   = clean.join("\n").slice(0, 4500);
  const wordCount = content.split(/\s+/).length;

  // ── Extract images ─────────────────────────────────────────────────────────
  const rawImages = [];
  $("img").each((_, el) => {
    // Support lazy-loaded images via data-src variants
    let src = $(el).attr("src") || $(el).attr("data-src") ||
              $(el).attr("data-lazy-src") || $(el).attr("data-original") || "";
    const alt = ($(el).attr("alt") || "").trim();
    const w   = parseInt($(el).attr("width")  || "999", 10);
    const h   = parseInt($(el).attr("height") || "999", 10);

    if (!src || src.startsWith("data:")) return;
    if (w < 80 || h < 80) return; // skip icons / tracking pixels with explicit tiny dims

    // Make URL absolute
    if (src.startsWith("//")) {
      src = "https:" + src;
    } else if (src.startsWith("/")) {
      try { src = new URL(url).origin + src; } catch { return; }
    } else if (!src.startsWith("http")) {
      return;
    }

    // Skip obvious non-photo URLs and alts
    const skip = ["icon", "logo", "favicon", "sprite", "pixel", "badge",
                  "button", "arrow", "loading", "spinner", "1x1", "track",
                  "analytics", "avatar", "gravatar", "placeholder", "blank"];
    const srcL = src.toLowerCase();
    const altL = alt.toLowerCase();
    if (skip.some((w) => srcL.includes(w) || altL.includes(w))) return;

    // Skip SVG and GIF (mostly icons / animations)
    if (/\.(svg|gif)(\?|$)/i.test(src)) return;

    // Must look like a photo — image extension OR CDN-style path/domain
    const hasExt    = /\.(jpg|jpeg|png|webp|avif)(\?[^/]*)?$/i.test(src);
    const hasCdnPath = /\/(image|photo|media|upload|content|picture|img|wp-content|assets|static)\//i.test(src);
    const hasCdnHost = /^https?:\/\/(cdn\.|img\.|images?\.|media\.|static\.|assets\.|photo\.)/i.test(src);
    if (!hasExt && !hasCdnPath && !hasCdnHost) return;

    rawImages.push({ url: src, alt: alt.slice(0, 120) });
  });

  const seenImgs = new Set();
  const images = rawImages.filter((img) => {
    if (seenImgs.has(img.url)) return false;
    seenImgs.add(img.url);
    return true;
  }).slice(0, 6);

  return { url, title, content, wordCount, fallback: false, images };
};

module.exports = { findTopUrls, scrapeContent };
