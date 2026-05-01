import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Zap, Lightbulb, Grid3X3, Snowflake, RefreshCw, AlertCircle, Database, Wifi, X, Plus, Tag } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const API_BASE = "http://localhost:5000/api/trends";

const BADGE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  BREAKING:        { label: "BREAKING",   color: "text-destructive bg-destructive/10", icon: Zap },
  HOT_DEBATE:      { label: "HOT DEBATE", color: "text-orange-600 bg-orange-100",      icon: Lightbulb },
  HOT_STORY:       { label: "HOT STORY",  color: "text-primary bg-primary/10",         icon: TrendingUp },
  VIRAL_FEEL_GOOD: { label: "VIRAL",      color: "text-pink-600 bg-pink-100",          icon: Zap },
  EVERGREEN:       { label: "EVERGREEN",  color: "text-success bg-success/10",         icon: Snowflake },
  MONITOR:         { label: "MONITOR",    color: "text-muted-foreground bg-secondary", icon: Grid3X3 },
};

const urgencyToScore = (urgency: string) => {
  if (urgency.includes("HIGH"))   return { score: 90, label: "High", color: "bg-destructive" };
  if (urgency.includes("MEDIUM")) return { score: 55, label: "Med",  color: "bg-warning" };
  return                                  { score: 20, label: "Low",  color: "bg-success" };
};

const formatVolume = (v: number) =>
  v > 1000 ? `${(v / 1000).toFixed(1)}K/hr` : `${v}/hr`;

const formatAge = (h: number) =>
  h < 1 ? `${Math.round(h * 60)}m ago` : h < 24 ? `${h.toFixed(1)}h ago` : `${Math.floor(h / 24)}d ago`;

interface TopicCard {
  id: string; badge: string; badgeColor: string; title: string; icon: any;
  volume: string; difficulty: number; diffLabel: string; diffColor: string;
  desc: string; subreddit: string; url: string; urgency: string; freshness: string;
}

interface GoogleTrend {
  rank: number; title: string; category: string;
  estimatedVolume: string; blogScore: number; suggestedAngle: string;
}

interface NicheResult {
  niche: string;
  postCount: number;
  posts: any[];
}

const mapPost = (p: any): TopicCard => {
  const badge      = BADGE_MAP[p.blogPotential] || BADGE_MAP.MONITOR;
  const difficulty = urgencyToScore(p.urgency || "");
  return {
    id: p.url, badge: badge.label, badgeColor: badge.color,
    title: p.title.length > 65 ? p.title.slice(0, 65) + "…" : p.title,
    icon: badge.icon,
    volume:    formatVolume(p.signals?.velocityPerHr || 0),
    difficulty: difficulty.score, diffLabel: difficulty.label, diffColor: difficulty.color,
    desc:      p.suggestedAngle || "",
    subreddit: p.subreddit,
    url:       p.url,
    urgency:   p.urgency,
    freshness: formatAge(p.signals?.ageHours || 0),
  };
};

// ── Reusable topic card ──────────────────────────────────────────────────────
const TopicCardItem = ({ topic, hovered, onHover, onLeave, onStartResearch }: { topic: TopicCard; hovered: boolean; onHover: () => void; onLeave: () => void; onStartResearch: () => void }) => (
  <div
    className="bg-card border border-border rounded-xl p-5 flex flex-col relative group hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    onClick={() => window.open(topic.url, "_blank")}
  >
    <div className="flex items-center justify-between mb-3">
      <span className={`badge-status ${topic.badgeColor} font-semibold text-xs px-2 py-0.5 rounded-full`}>
        {topic.badge}
      </span>
      <topic.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
    </div>
    <h3 className="text-base font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
      {topic.title}
    </h3>
    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{topic.desc}</p>
    <div className="space-y-2 flex-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Velocity</span>
        <span className="font-semibold text-foreground">{topic.volume}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Urgency</span>
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${topic.diffColor}`} style={{ width: `${topic.difficulty}%` }} />
          </div>
          <span className="font-semibold text-foreground text-xs">{topic.diffLabel}</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground pt-1">
        <span>{topic.subreddit}</span>
        <span>{topic.freshness}</span>
      </div>
    </div>
    <div className={`absolute top-3 right-12 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg z-10 transition-all duration-200 whitespace-nowrap ${
      hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
    }`}>
      {topic.urgency}
    </div>
    <Button
      className="w-full mt-4 gap-2 group-hover:shadow-sm transition-shadow"
      size="sm"
      onClick={(e) => { e.stopPropagation(); onStartResearch(); }}
    >
      <Search className="w-4 h-4" />
      Start Research
    </Button>
  </div>
);

// ── Loading skeleton ─────────────────────────────────────────────────────────
const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-secondary rounded w-24 mb-3" />
        <div className="h-6 bg-secondary rounded w-full mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-secondary rounded w-full" />
          <div className="h-3 bg-secondary rounded w-3/4" />
        </div>
        <div className="h-9 bg-secondary rounded w-full mt-4" />
      </div>
    ))}
  </div>
);

// ── Niche tag input ──────────────────────────────────────────────────────────
const NicheInput = ({ niches, onChange }: { niches: string[]; onChange: (n: string[]) => void }) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const val = input.trim().toLowerCase();
    if (!val || niches.includes(val) || niches.length >= 5) return;
    onChange([...niches, val]);
    setInput("");
  };

  const remove = (niche: string) => onChange(niches.filter((n) => n !== niche));

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Filter by Niche</span>
        <span className="text-xs text-muted-foreground ml-1">— type a keyword and press Enter (max 5)</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {niches.map((n) => (
          <span key={n} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            {n}
            <button onClick={() => remove(n)} className="hover:text-destructive transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {niches.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No niches added — showing all trends</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="e.g. AI, fitness, crypto, finance…"
          disabled={niches.length >= 5}
          className="flex-1 h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={!input.trim() || niches.length >= 5} className="gap-1 h-9">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
        {niches.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => onChange([])} className="h-9 text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const TrendsPage = () => {
  const navigate = useNavigate();
  const [niches, setNiches]             = useState<string[]>([]);

  // All-trends state
  const [topics, setTopics]             = useState<TopicCard[]>([]);
  const [googleTrends, setGoogleTrends] = useState<GoogleTrend[]>([]);
  const [summary, setSummary]           = useState<any>(null);
  const [fromCache, setFromCache]       = useState(false);
  const [lastFetched, setLastFetched]   = useState("");
  const [expiresAt, setExpiresAt]       = useState("");
  const [geo, setGeo]                   = useState("US");
  const [category, setCategory]         = useState("all");

  // Niche-trends state
  const [nicheResults, setNicheResults] = useState<NicheResult[]>([]);
  const [nicheGoogle, setNicheGoogle]   = useState<GoogleTrend[]>([]);
  const [nicheFetchedAt, setNicheFetchedAt] = useState("");

  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [resyncing, setResyncing]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const isNicheMode = niches.length > 0;
  const isBusy      = loading || resyncing;

  // ── Fetch all-trends ──────────────────────────────────────────────────────
  const fetchTrends = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/combined?geo=${geo}&category=${category}&limit=20${force ? "&force=true" : ""}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      setTopics((data.topPicks || []).map(mapPost));
      setGoogleTrends(data.googleTrends?.data?.slice(0, 25) || []);
      setSummary(data.summary || null);
      setFromCache(data.fromCache || false);
      setLastFetched(new Date(data.fetchedAt).toLocaleTimeString());
      setExpiresAt(data.expiresAt ? new Date(data.expiresAt).toLocaleTimeString() : "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch niche trends ────────────────────────────────────────────────────
  const fetchNicheTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/niche?niches=${encodeURIComponent(niches.join(","))}&geo=${geo}&limit=12`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setNicheResults(data.nicheResults || []);
      setNicheGoogle(data.googleTrends?.data?.slice(0, 15) || []);
      setNicheFetchedAt(new Date(data.fetchedAt).toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to fetch niche trends");
    } finally {
      setLoading(false);
    }
  };

  // ── Resync ────────────────────────────────────────────────────────────────
  const handleResync = async () => {
    setResyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/resync`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ geo, category }),
      });
      if (!res.ok) throw new Error(`Resync failed: ${res.status}`);
      await fetchTrends(true);
    } catch (err: any) {
      setError(err.message || "Resync failed");
    } finally {
      setResyncing(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (isNicheMode) fetchNicheTrends();
    else             fetchTrends();
  }, [geo, category, niches]);

  const healthScore = summary
    ? Math.min(100, Math.round(
        ((summary.buckets?.BREAKING || 0) * 15 +
         (summary.buckets?.HOT_STORY || 0) * 10 +
         (summary.buckets?.HOT_DEBATE || 0) * 8) / Math.max(summary.writableTopics, 1)
      ))
    : 0;

  const marketMood = summary
    ? summary.buckets?.BREAKING > 3 ? "ACTIVE MARKET"
    : summary.buckets?.HOT_DEBATE > 2 ? "DEBATE HEAVY"
    : "STEADY MARKET"
    : "LOADING";

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Discover Trends</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            {isNicheMode
              ? <><Tag className="w-3 h-3 text-primary" /> Niche mode · fetched {nicheFetchedAt || "…"}</>
              : fromCache
                ? <><Database className="w-3 h-3" /> From cache · {lastFetched}{expiresAt && ` · Expires ${expiresAt}`}</>
                : <><Wifi className="w-3 h-3" /> Live fetch · {lastFetched}</>
            }
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={geo}
            onChange={(e) => setGeo(e.target.value)}
            disabled={isBusy}
            className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <option value="US">Region: US</option>
            <option value="GB">Region: UK</option>
            <option value="PK">Region: PK</option>
            <option value="IN">Region: India</option>
            <option value="CA">Region: Canada</option>
          </select>

          {!isNicheMode && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isBusy}
              className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <option value="all">Category: All</option>
              <option value="tech">Category: Tech</option>
              <option value="news">Category: News</option>
            </select>
          )}

          {!isNicheMode && (
            <Button variant="outline" size="sm" onClick={handleResync} disabled={isBusy} className="h-9 md:h-10 gap-2">
              <RefreshCw className={`w-4 h-4 ${resyncing ? "animate-spin" : ""}`} />
              {resyncing ? "Resyncing…" : "Resync"}
            </Button>
          )}

          {isNicheMode && (
            <Button variant="outline" size="sm" onClick={fetchNicheTrends} disabled={isBusy} className="h-9 md:h-10 gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Fetching…" : "Refresh"}
            </Button>
          )}

          {!isNicheMode && (
            <Button variant="ghost" size="sm" onClick={() => fetchTrends()} disabled={isBusy} className="h-9 md:h-10 gap-2">
              <Database className="w-4 h-4" />
              {loading ? "Loading…" : "Reload"}
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => isNicheMode ? fetchNicheTrends() : fetchTrends()} className="ml-auto">Retry</Button>
        </div>
      )}

      {/* Niche input */}
      <NicheInput niches={niches} onChange={setNiches} />

      {/* ── ALL TRENDS MODE ── */}
      {!isNicheMode && (
        <>
          {/* Cache indicator */}
          {!loading && fromCache && (
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-4 py-2 mb-6 text-sm text-muted-foreground">
              <Database className="w-4 h-4 text-primary" />
              <span>Showing cached results — click <strong className="text-foreground">Resync</strong> to fetch latest</span>
            </div>
          )}

          {/* Topic Health Index */}
          <div className="bg-card border border-border rounded-xl p-5 mb-8 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Topic Health Index</h3>
              </div>
              <span className="badge-status bg-primary/10 text-primary font-semibold">{marketMood}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
                  style={{ width: `${isBusy ? 0 : healthScore}%` }}
                />
              </div>
              <span className="text-lg font-bold text-foreground">{isBusy ? "…" : `${healthScore}%`}</span>
            </div>
            {summary && (
              <div className="flex gap-4 mt-3 flex-wrap">
                {Object.entries(summary.buckets || {}).map(([key, count]: any) =>
                  count > 0 ? (
                    <span key={key} className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{count}</span> {key.replace(/_/g, " ")}
                    </span>
                  ) : null
                )}
              </div>
            )}
          </div>

          {isBusy && <SkeletonGrid />}

          {!isBusy && topics.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Reddit Trending Topics
                <span className="ml-2 text-sm font-normal text-muted-foreground">({topics.length} topics)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
                {topics.map((topic) => (
                  <TopicCardItem
                    key={topic.id}
                    topic={topic}
                    hovered={hoveredTopic === topic.title}
                    onHover={() => setHoveredTopic(topic.title)}
                    onLeave={() => setHoveredTopic(null)}
                    onStartResearch={() => navigate(`/research?topic=${encodeURIComponent(topic.title)}&geo=${geo}`)}
                  />
                ))}
              </div>
            </>
          )}

          {!isBusy && googleTrends.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Google Trending Searches
                <span className="ml-2 text-sm font-normal text-muted-foreground">({googleTrends.length} topics)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {googleTrends.map((trend) => (
                  <div key={trend.rank} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 group flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        #{trend.rank} · {trend.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">{trend.estimatedVolume}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors capitalize">
                      {trend.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{trend.suggestedAngle}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(Math.round(trend.blogScore), 10))].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ))}
                        {[...Array(Math.max(0, 10 - Math.round(trend.blogScore)))].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">score {trend.blogScore}/10</span>
                    </div>
                    <Button
                      className="w-full mt-3 gap-2 group-hover:shadow-sm transition-shadow"
                      size="sm"
                      onClick={() => navigate(`/research?topic=${encodeURIComponent(trend.title)}&geo=${geo}`)}
                    >
                      <Search className="w-4 h-4" />
                      Start Research
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isBusy && !error && topics.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No topics found</p>
              <p className="text-sm mt-1">Try changing region or category</p>
            </div>
          )}
        </>
      )}

      {/* ── NICHE MODE ── */}
      {isNicheMode && (
        <>
          {/* Niche mode banner */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-6 text-sm">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-foreground">Showing trends filtered for: </span>
            {niches.map((n) => (
              <span key={n} className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{n}</span>
            ))}
            <span className="text-muted-foreground ml-1">— Reddit searched per keyword · Google filtered by match</span>
          </div>

          {isBusy && (
            <>
              {niches.map((n) => (
                <div key={n} className="mb-8">
                  <div className="h-6 bg-secondary rounded w-40 mb-4 animate-pulse" />
                  <SkeletonGrid count={3} />
                </div>
              ))}
            </>
          )}

          {!isBusy && nicheResults.map(({ niche, postCount, posts }) => (
            <div key={niche} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-foreground capitalize">{niche}</h2>
                <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {postCount} trending posts
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No trending posts found for <strong className="text-foreground">{niche}</strong> this week</p>
                  <p className="text-xs mt-1">Try a broader keyword or different region</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {posts.map((p: any) => {
                    const topic = mapPost(p);
                    return (
                      <TopicCardItem
                        key={topic.id}
                        topic={topic}
                        hovered={hoveredTopic === topic.title}
                        onHover={() => setHoveredTopic(topic.title)}
                        onLeave={() => setHoveredTopic(null)}
                        onStartResearch={() => navigate(`/research?topic=${encodeURIComponent(topic.title)}&geo=${geo}`)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Niche-filtered Google Trends */}
          {!isBusy && nicheGoogle.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Google Trends — Niche Matched
                <span className="ml-2 text-sm font-normal text-muted-foreground">({nicheGoogle.length} matching)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {nicheGoogle.map((trend) => (
                  <div key={trend.rank} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 group flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        #{trend.rank} · {trend.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">{trend.estimatedVolume}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors capitalize">
                      {trend.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{trend.suggestedAngle}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(Math.round(trend.blogScore), 10))].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ))}
                        {[...Array(Math.max(0, 10 - Math.round(trend.blogScore)))].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">score {trend.blogScore}/10</span>
                    </div>
                    <Button
                      className="w-full mt-3 gap-2 group-hover:shadow-sm transition-shadow"
                      size="sm"
                      onClick={() => navigate(`/research?topic=${encodeURIComponent(trend.title)}&geo=${geo}`)}
                    >
                      <Search className="w-4 h-4" />
                      Start Research
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isBusy && nicheGoogle.length === 0 && nicheResults.every((r) => r.postCount === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No niche trends found</p>
              <p className="text-sm mt-1">Try different keywords or change the region</p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default TrendsPage;
