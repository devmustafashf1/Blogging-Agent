import { useState } from "react";
import { Search, TrendingUp, Zap, Lightbulb, Lock, Grid3X3, Snowflake } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const topics = [
  {
    badge: "EMERGING", badgeColor: "text-primary bg-primary/10", title: "Edge Computing AI", icon: TrendingUp,
    volume: "45.2K / mo", difficulty: 42, diffLabel: "Med", diffColor: "bg-warning",
    desc: "Edge AI processing is gaining traction as latency-sensitive applications demand on-device inference. Key players include NVIDIA Jetson and Intel Movidius.",
    growth: "+34%", audience: "DevOps & ML Engineers", freshness: "2h ago",
  },
  {
    badge: "VIRAL", badgeColor: "text-destructive bg-destructive/10", title: "Generative Video UI", icon: Zap,
    volume: "128K / mo", difficulty: 85, diffLabel: "High", diffColor: "bg-destructive",
    desc: "AI-generated video interfaces are reshaping content creation. Sora, Runway, and Pika are leading this space with text-to-video capabilities.",
    growth: "+127%", audience: "Content Creators", freshness: "45m ago",
  },
  {
    badge: "OPPORTUNITY", badgeColor: "text-success bg-success/10", title: "Autonomous Coding Agents", icon: Lightbulb,
    volume: "12.5K / mo", difficulty: 18, diffLabel: "Low", diffColor: "bg-success",
    desc: "Self-improving code agents are emerging as the next frontier. Low competition makes this ideal for early content movers.",
    growth: "+89%", audience: "Software Developers", freshness: "1h ago",
  },
  {
    badge: "NICHE", badgeColor: "text-purple-600 bg-purple-100", title: "AI Bio-Encryption", icon: Lock,
    volume: "3.8K / mo", difficulty: 35, diffLabel: "Med", diffColor: "bg-warning",
    desc: "Combining biological patterns with encryption algorithms. A highly specialized topic with dedicated readership in cybersecurity.",
    growth: "+12%", audience: "Security Researchers", freshness: "6h ago",
  },
  {
    badge: "MAINSTREAM", badgeColor: "text-muted-foreground bg-secondary", title: "Multi-Modal LLMs", icon: Grid3X3,
    volume: "210K / mo", difficulty: 92, diffLabel: "High", diffColor: "bg-destructive",
    desc: "GPT-5, Gemini Ultra, and Claude 4 are pushing multi-modal boundaries. Extremely competitive but massive traffic potential.",
    growth: "+56%", audience: "Tech Enthusiasts", freshness: "30m ago",
  },
  {
    badge: "FAST MOVER", badgeColor: "text-destructive bg-destructive/10", title: "AI Data Centers Cooling", icon: Snowflake,
    volume: "8.2K / mo", difficulty: 25, diffLabel: "Low", diffColor: "bg-success",
    desc: "Sustainable cooling solutions for AI infrastructure. Green tech angle with growing enterprise interest and low content saturation.",
    growth: "+67%", audience: "Infrastructure Teams", freshness: "3h ago",
  },
];

const TrendsPage = () => {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Discover Trends</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time market insights synthesized from Google, X, and Reddit.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer">
            <option>Region: Global</option>
          </select>
          <select className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer">
            <option>Category: Tech</option>
          </select>
          <select className="h-9 md:h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer">
            <option>Last 24h</option>
          </select>
        </div>
      </div>

      {/* Topic Health Index */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Topic Health Index</h3>
          </div>
          <span className="badge-status bg-primary/10 text-primary font-semibold">BULLISH MARKET</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000" style={{ width: "88%" }} />
          </div>
          <span className="text-lg font-bold text-foreground">88%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Market interest is rising significantly in the AI Infrastructure sector. Competitive intensity is currently moderate.</p>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">Suggested Topics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {topics.map((topic) => (
          <div
            key={topic.title}
            className="bg-card border border-border rounded-xl p-5 flex flex-col relative group hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredTopic(topic.title)}
            onMouseLeave={() => setHoveredTopic(null)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`badge-status ${topic.badgeColor} font-semibold`}>{topic.badge}</span>
              <topic.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-200">{topic.title}</h3>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Keyword Volume</span>
                <span className="font-semibold text-foreground">{topic.volume}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SEO Difficulty</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${topic.diffColor}`} style={{ width: `${topic.difficulty}%` }} />
                  </div>
                  <span className="font-semibold text-foreground">{topic.difficulty} ({topic.diffLabel})</span>
                </div>
              </div>
            </div>

            {/* Hover Domain Tooltip */}
            <div className={`absolute top-3 right-12 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg z-10 transition-all duration-200 ${
              hoveredTopic === topic.title ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}>
              {topic.audience}
            </div>

            <Button className="w-full mt-4 gap-2 group-hover:shadow-sm transition-shadow">
              <Search className="w-4 h-4" />
              Start Research
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default TrendsPage;
