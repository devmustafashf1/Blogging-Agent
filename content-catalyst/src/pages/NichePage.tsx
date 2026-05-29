import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cpu, Activity, Newspaper, ShoppingBag, Plus, X, Check,
  TrendingUp, Pencil, Search, Flame, Star, BarChart2,
  AlertCircle, RefreshCw, Lightbulb, ChevronDown,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/trends`;
const STORAGE_KEY = "selected_niches";
const PAGE_SIZE = 10;

const PRESET_NICHES = [
  {
    id: "tech",
    label: "Tech",
    icon: Cpu,
    desc: "AI, software, gadgets, startups and the future of technology.",
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400",
    activeColor: "text-blue-700 bg-blue-100 border-blue-500",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Activity,
    desc: "Workouts, nutrition, mental health, wellness trends and sports.",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    activeColor: "text-emerald-700 bg-emerald-100 border-emerald-500",
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    desc: "Breaking stories, politics, world events and trending headlines.",
    color: "text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-400",
    activeColor: "text-orange-700 bg-orange-100 border-orange-500",
  },
  {
    id: "fashion",
    label: "Fashion",
    icon: ShoppingBag,
    desc: "Style trends, designer drops, beauty, lifestyle and culture.",
    color: "text-pink-600 bg-pink-50 border-pink-200 hover:border-pink-400",
    activeColor: "text-pink-700 bg-pink-100 border-pink-500",
  },
];

interface ContentIdea {
  type: "RISING" | "TOP" | "CATEGORY_TRENDING";
  query: string;
  value?: number | string;
  estimatedVolume?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  blogAngle: string;
  relatedArticles?: { title: string; source: string; url: string }[];
}

interface NicheResult {
  niche: string;
  fetchedAt: string;
  allIdeas: ContentIdea[];
  totalIdeas: number;
  visibleCount: number;
}

const TYPE_META = {
  RISING:           { label: "Rising",   icon: Flame,    color: "text-red-600 bg-red-50" },
  TOP:              { label: "Top",      icon: Star,     color: "text-yellow-600 bg-yellow-50" },
  CATEGORY_TRENDING:{ label: "Trending", icon: BarChart2, color: "text-blue-600 bg-blue-50" },
};

const IdeaCard = ({ idea, onResearch }: { idea: ContentIdea; onResearch: () => void }) => {
  const meta = TYPE_META[idea.type];
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
          <meta.icon className="w-3 h-3" />
          {meta.label}
        </span>
        {idea.priority === "HIGH" && (
          <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            High Priority
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2 capitalize group-hover:text-primary transition-colors leading-snug">
        {idea.query}
      </h3>
      <div className="flex items-start gap-1.5 mb-3 flex-1">
        <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{idea.blogAngle}</p>
      </div>
      {idea.estimatedVolume && (
        <p className="text-xs text-muted-foreground mb-2">Volume: {idea.estimatedVolume}</p>
      )}
      {idea.relatedArticles && idea.relatedArticles.length > 0 && (
        <div className="mb-3 space-y-1">
          {idea.relatedArticles.map((a, i) => (
            <a
              key={i} href={a.url} target="_blank" rel="noreferrer"
              className="block text-xs text-muted-foreground hover:text-primary truncate transition-colors"
            >
              · {a.title} <span className="opacity-60">({a.source})</span>
            </a>
          ))}
        </div>
      )}
      <Button size="sm" className="w-full gap-2 mt-auto" onClick={onResearch}>
        <Search className="w-3.5 h-3.5" />
        Research this
      </Button>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-secondary rounded w-20 mb-3" />
        <div className="h-5 bg-secondary rounded w-full mb-2" />
        <div className="h-3 bg-secondary rounded w-3/4 mb-4" />
        <div className="h-9 bg-secondary rounded w-full" />
      </div>
    ))}
  </div>
);

const NichePage = () => {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });

  const [customInput, setCustomInput] = useState("");
  const [geo, setGeo]                 = useState("US");
  const [results, setResults]         = useState<NicheResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const togglePreset = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]);

  const addCustom = () => {
    const val = customInput.trim().toLowerCase();
    if (!val || selected.includes(val) || selected.length >= 8) return;
    setSelected((prev) => [...prev, val]);
    setCustomInput("");
  };

  const removeNiche = (niche: string) => {
    setSelected((prev) => prev.filter((n) => n !== niche));
    setResults((prev) => prev.filter((r) => r.niche !== niche));
  };

  const fetchIdeasForNiche = async (niche: string) => {
    setActiveNiche(niche);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/niche-ideas?niche=${encodeURIComponent(niche)}&geo=${geo}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      // Merge all idea types into one ordered list: rising first, then category trending, then top
      const allIdeas: ContentIdea[] = [
        ...(data.risingIdeas || []),
        ...(data.categoryTrending || []),
        ...(data.topIdeas || []),
      ];

      const entry: NicheResult = {
        niche,
        fetchedAt: data.fetchedAt,
        allIdeas,
        totalIdeas: allIdeas.length,
        visibleCount: PAGE_SIZE,
      };

      setResults((prev) => {
        const idx = prev.findIndex((r) => r.niche === niche);
        if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next; }
        return [...prev, entry];
      });
    } catch (err: any) {
      setError(`Failed to fetch ideas for "${niche}": ${err.message}`);
    } finally {
      setLoading(false);
      setActiveNiche(null);
    }
  };

  const fetchAllIdeas = async () => {
    if (selected.length === 0) return;
    setResults([]);
    setError(null);
    for (const niche of selected) {
      await fetchIdeasForNiche(niche);
    }
  };

  const showMore = (niche: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.niche === niche
          ? { ...r, visibleCount: r.visibleCount + PAGE_SIZE }
          : r
      )
    );
  };

  const presetIds = PRESET_NICHES.map((n) => n.id);
  const customNiches = selected.filter((n) => !presetIds.includes(n));

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Niche Ideas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick your niches — get rising queries and category-trending topics as blog ideas.
          </p>
        </div>
        <select
          value={geo}
          onChange={(e) => setGeo(e.target.value)}
          className="h-9 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer self-start"
        >
          <option value="US">Region: US</option>
          <option value="GB">Region: UK</option>
          <option value="PK">Region: PK</option>
          <option value="IN">Region: India</option>
          <option value="CA">Region: Canada</option>
        </select>
      </div>

      {/* Active selection summary */}
      {selected.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide shrink-0">Selected</span>
          {selected.map((n) => (
            <span key={n} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full capitalize">
              {n}
              <button onClick={() => removeNiche(n)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset cards */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preset Niches</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PRESET_NICHES.map(({ id, label, icon: Icon, desc, color, activeColor }) => {
          const isActive = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => togglePreset(id)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${isActive ? activeColor : color}`}
            >
              {isActive && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <Icon className="w-6 h-6 mb-2" />
              <h3 className="font-bold text-sm mb-1">{label}</h3>
              <p className="text-xs opacity-60 leading-relaxed">{desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom niche */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Custom Niche</h2>
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Add your own keywords</span>
          <span className="text-xs text-muted-foreground ml-1">(max 8 total)</span>
        </div>
        {customNiches.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customNiches.map((n) => (
              <span key={n} className="flex items-center gap-1.5 bg-secondary text-foreground text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
                {n}
                <button onClick={() => removeNiche(n)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. crypto, travel, gaming, parenting…"
            disabled={selected.length >= 8}
            className="flex-1 h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button size="sm" variant="outline" onClick={addCustom} disabled={!customInput.trim() || selected.length >= 8} className="gap-1 h-9">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Fetch button */}
      <div className="flex items-center gap-3 mb-8">
        <Button onClick={fetchAllIdeas} disabled={selected.length === 0 || loading} className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {loading ? `Fetching ${activeNiche}…` : "Get Content Ideas"}
        </Button>
        {results.length > 0 && (
          <Button variant="outline" onClick={fetchAllIdeas} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        )}
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground">Select at least one niche first.</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && activeNiche && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-foreground capitalize">{activeNiche}</h2>
            <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
          <SkeletonGrid />
        </div>
      )}

      {/* Results per niche */}
      {results.map((result) => {
        if (result.allIdeas.length === 0) return null;
        const visible = result.allIdeas.slice(0, result.visibleCount);
        const remaining = result.allIdeas.length - result.visibleCount;
        const isRefreshing = loading && activeNiche === result.niche;

        return (
          <div key={result.niche} className="mb-10">
            {/* Niche header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-foreground capitalize">{result.niche}</h2>
                <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {result.totalIdeas} ideas
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(result.fetchedAt).toLocaleTimeString()}
                </span>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => fetchIdeasForNiche(result.niche)}
                disabled={isRefreshing}
                className="gap-1 text-muted-foreground"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Ideas grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((idea, i) => (
                <IdeaCard
                  key={i}
                  idea={idea}
                  onResearch={() => navigate(`/research?topic=${encodeURIComponent(idea.query)}&geo=${geo}`)}
                />
              ))}
            </div>

            {/* Pagination footer */}
            {(remaining > 0 || result.visibleCount > PAGE_SIZE) && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{Math.min(result.visibleCount, result.totalIdeas)}</span> of{" "}
                  <span className="font-semibold text-foreground">{result.totalIdeas}</span> ideas
                </p>
                {remaining > 0 && (
                  <Button variant="outline" size="sm" onClick={() => showMore(result.niche)} className="gap-2">
                    <ChevronDown className="w-4 h-4" />
                    View {Math.min(remaining, PAGE_SIZE)} more
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {!loading && results.length === 0 && selected.length > 0 && (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Ready to discover ideas</p>
          <p className="text-sm mt-1">Click "Get Content Ideas" to fetch trending queries for your niches</p>
        </div>
      )}
    </AppLayout>
  );
};

export default NichePage;
