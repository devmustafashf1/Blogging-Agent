import { useState, useEffect } from "react";
import { Search, TrendingUp, Zap, Lightbulb, Lock, Grid3X3, Snowflake, RefreshCw, AlertCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

// ─── API base URL — change if your backend runs elsewhere ────────────────────
const API_BASE = "http://localhost:5000/api/trends";

// ─── Map blogPotential → badge config ────────────────────────────────────────
const BADGE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  BREAKING:        { label: "BREAKING",     color: "text-destructive bg-destructive/10", icon: Zap },
  HOT_DEBATE:      { label: "HOT DEBATE",   color: "text-orange-600 bg-orange-100",      icon: Lightbulb },
  HOT_STORY:       { label: "HOT STORY",    color: "text-primary bg-primary/10",         icon: TrendingUp },
  VIRAL_FEEL_GOOD: { label: "VIRAL",        color: "text-pink-600 bg-pink-100",          icon: Zap },
  EVERGREEN:       { label: "EVERGREEN",    color: "text-success bg-success/10",         icon: Snowflake },
  MONITOR:         { label: "MONITOR",      color: "text-muted-foreground bg-secondary", icon: Grid3X3 },
};

// ─── Map urgency → difficulty bar color ──────────────────────────────────────
const urgencyToScore = (urgency: string) => {
  if (urgency.includes("HIGH"))   return { score: 90, label: "High",   color: "bg-destructive" };
  if (urgency.includes("MEDIUM")) return { score: 55, label: "Med",    color: "bg-warning" };
  return                                  { score: 20, label: "Low",    color: "bg-success" };
};

// ─── Format velocity to readable volume ──────────────────────────────────────
const formatVolume = (velocity: number) => {
  if (velocity > 5000) return `${(velocity / 1000).toFixed(1)}K/hr`;
  if (velocity > 1000) return `${(velocity / 1000).toFixed(1)}K/hr`;
  return `${velocity}/hr`;
};

// ─── Format age ───────────────────────────────────────────────────────────────
const formatAge = (hours: number) => {
  if (hours < 1)  return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${hours.toFixed(1)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ─── Topic card shape ─────────────────────────────────────────────────────────
interface TopicCard {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  icon: any;
  volume: string;
  difficulty: number;
  diffLabel: string;
  diffColor: string;
  desc: string;
  growth: string;
  audience: string;
  freshness: string;
  subreddit: string;
  url: string;
  blogPotential: string;
  urgency: string;
}

interface GoogleTrend {
  rank: number;
  title: string;
  category: string;
  estimatedVolume: string;
  blogScore: number;
  suggestedAngle: string;
}

const TrendsPage = () => {
  const [topics, setTopics]           = useState<TopicCard[]>([]);
  const [googleTrends, setGoogleTrends] = useState<GoogleTrend[]>([]);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string>("");
  const [geo, setGeo]                 = useState("US");
  const [category, setCategory]       = useState("all");
  const [summary, setSummary]         = useState<any>(null);

  // ─── Fetch from /combined ──────────────────────────────────────────────────
  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const subreddits = category === "all"
        ? "worldnews,technology,business,science"
        : category === "tech"
        ? "technology,programming,MachineLearning,artificial"
        : category === "news"
        ? "worldnews,politics,news"
        : "worldnews,technology,business,science";

      const url = `${API_BASE}/combined?geo=${geo}&subreddits=${subreddits}&limit=20`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      // Map topPicks → TopicCard[]
      const mapped: TopicCard[] = (data.topPicks || []).map((p: any) => {
        const badge      = BADGE_MAP[p.blogPotential] || BADGE_MAP.MONITOR;
        const difficulty = urgencyToScore(p.urgency || "");
        return {
          id:            p.url,
          badge:         badge.label,
          badgeColor:    badge.color,
          title:         p.title.length > 60 ? p.title.slice(0, 60) + "…" : p.title,
          icon:          badge.icon,
          volume:        formatVolume(p.signals?.velocityPerHr || 0),
          difficulty:    difficulty.score,
          diffLabel:     difficulty.label,
          diffColor:     difficulty.color,
          desc:          p.suggestedAngle || "",
          growth:        `+${((p.signals?.debateRatio || 0) * 100).toFixed(0)}% debate`,
          audience:      p.subreddit,
          freshness:     formatAge(p.signals?.ageHours || 0),
          subreddit:     p.subreddit,
          url:           p.url,
          blogPotential: p.blogPotential,
          urgency:       p.urgency,
        };
      });

      setTopics(mapped);
      setGoogleTrends(data.googleTrends?.data?.slice(0, 15) || []);
      setSummary(data.summary || null);
      setLastFetched(new Date(data.fetchedAt).toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, [geo, category]);

  // ─── Health index from summary ─────────────────────────────────────────────
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
          <p className="text-muted-foreground mt-1 text-sm">
            Live data from Google Trends + Reddit.
            {lastFetched && <span className="ml-1">Updated {lastFetched}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={geo}
            onChange={(e) => setGeo(e.target.value)}
            className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            <option value="US">Region: US</option>
            <option value="GB">Region: UK</option>
            <option value="PK">Region: PK</option>
            <option value="IN">Region: India</option>
            <option value="CA">Region: Canada</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            <option value="all">Category: All</option>
            <option value="tech">Category: Tech</option>
            <option value="news">Category: News</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrends}
            disabled={loading}
            className="h-9 md:h-10 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Could not connect to trend API</p>
            <p className="text-xs mt-0.5">{error} — make sure your server is running on port 5000</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchTrends} className="ml-auto">Retry</Button>
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
              style={{ width: `${loading ? 0 : healthScore}%` }}
            />
          </div>
          <span className="text-lg font-bold text-foreground">{loading ? "…" : `${healthScore}%`}</span>
        </div>
        {summary && (
          <div className="flex gap-4 mt-3 flex-wrap">
            {Object.entries(summary.buckets || {}).map(([key, count]: any) =>
              count > 0 ? (
                <span key={key} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{count}</span> {key.replace("_", " ")}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
          {[...Array(6)].map((_, i) => (
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
      )}

      {/* Reddit Topic Cards */}
      {!loading && topics.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Reddit Trending Topics
            <span className="ml-2 text-sm font-normal text-muted-foreground">({topics.length} topics)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col relative group hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredTopic(topic.title)}
                onMouseLeave={() => setHoveredTopic(null)}
                onClick={() => window.open(topic.url, "_blank")}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge-status ${topic.badgeColor} font-semibold text-xs px-2 py-0.5 rounded-full`}>
                    {topic.badge}
                  </span>
                  <topic.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200 leading-snug">
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

                {/* Hover tooltip */}
                <div className={`absolute top-3 right-12 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg z-10 transition-all duration-200 whitespace-nowrap ${
                  hoveredTopic === topic.title ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                }`}>
                  {topic.urgency}
                </div>

                <Button className="w-full mt-4 gap-2 group-hover:shadow-sm transition-shadow" size="sm">
                  <Search className="w-4 h-4" />
                  Start Research
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Google Trends Section */}
      {!loading && googleTrends.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Google Trending Searches
            <span className="ml-2 text-sm font-normal text-muted-foreground">(filtered, blog-worthy)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {googleTrends.map((trend) => (
              <div
                key={trend.rank}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    #{trend.rank} · {trend.category.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">{trend.estimatedVolume}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors capitalize">
                  {trend.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{trend.suggestedAngle}</p>
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
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && topics.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No topics found</p>
          <p className="text-sm mt-1">Try changing region or category</p>
        </div>
      )}
    </AppLayout>
  );
};

export default TrendsPage;