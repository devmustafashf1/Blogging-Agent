const supabase = require("../config/supabase");

const CACHE_TTL_HOURS = 6; // cache valid for 6 hours

// ─── Build cache key from geo + category ─────────────────────────────────────
const buildKey = (geo, category) => `${geo.toUpperCase()}_${category.toLowerCase()}`;

// ─── Read from cache ──────────────────────────────────────────────────────────
const getCache = async (geo, category) => {
  try {
    const key = buildKey(geo, category);
    const { data, error } = await supabase
      .from("trends_cache")
      .select("*")
      .eq("cache_key", key)
      .single();

    if (error || !data) return null;

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      console.log(`Cache expired for key: ${key}`);
      return null;
    }

    console.log(`Cache HIT for key: ${key}`);
    return data;
  } catch (err) {
    console.error("Cache read error:", err.message);
    return null;
  }
};

// ─── Write to cache ───────────────────────────────────────────────────────────
const setCache = async (geo, category, subreddits, payload) => {
  try {
    const key       = buildKey(geo, category);
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    const record = {
      cache_key:     key,
      geo:           geo.toUpperCase(),
      category:      category.toLowerCase(),
      subreddits,
      top_picks:     payload.topPicks     || [],
      google_trends: payload.googleTrends || [],
      summary:       payload.summary      || {},
      fetched_at:    now.toISOString(),
      expires_at:    expiresAt.toISOString(),
    };

    // Upsert — insert or update if key exists
    const { error } = await supabase
      .from("trends_cache")
      .upsert(record, { onConflict: "cache_key" });

    if (error) throw error;
    console.log(`Cache SET for key: ${key}, expires: ${expiresAt.toISOString()}`);
    return true;
  } catch (err) {
    console.error("Cache write error:", err.message);
    return false;
  }
};

// ─── Force invalidate a cache entry ──────────────────────────────────────────
const invalidateCache = async (geo, category) => {
  try {
    const key = buildKey(geo, category);
    const { error } = await supabase
      .from("trends_cache")
      .delete()
      .eq("cache_key", key);

    if (error) throw error;
    console.log(`Cache INVALIDATED for key: ${key}`);
    return true;
  } catch (err) {
    console.error("Cache invalidate error:", err.message);
    return false;
  }
};

// ─── Invalidate ALL cache entries (used by cron/resync) ──────────────────────
const invalidateAll = async () => {
  try {
    const { error } = await supabase
      .from("trends_cache")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

    if (error) throw error;
    console.log("All cache entries invalidated");
    return true;
  } catch (err) {
    console.error("Cache invalidate all error:", err.message);
    return false;
  }
};

// ─── Get all cached entries (for admin/debug) ─────────────────────────────────
const getAllCache = async () => {
  try {
    const { data, error } = await supabase
      .from("trends_cache")
      .select("cache_key, geo, category, fetched_at, expires_at, summary")
      .order("fetched_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Get all cache error:", err.message);
    return [];
  }
};

module.exports = { getCache, setCache, invalidateCache, invalidateAll, getAllCache, buildKey };