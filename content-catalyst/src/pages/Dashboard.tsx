import {
  FileText, Star, Wifi, TrendingUp, Search, PenTool, Shield, Send, Bot, Flame, Eye,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const stats = [
  { label: "POSTS PUBLISHED", value: "1,284", change: "+12% this month", icon: FileText, iconBg: "bg-primary/10", iconColor: "text-primary" },
  { label: "AVG SEO SCORE", value: "92.4", change: "+2.1 pts", icon: Star, iconBg: "bg-warning/10", iconColor: "text-warning" },
  { label: "TRAFFIC GROWTH", value: "48.2%", change: null, icon: Wifi, iconBg: "bg-info/10", iconColor: "text-info", hasProgress: true, progress: 48 },
];

const agents = [
  { name: "Trend Agent", icon: TrendingUp, status: "Scanning Web", color: "bg-success", active: true },
  { name: "Research Agent", icon: Search, status: "Idle", color: "bg-muted-foreground", active: false },
  { name: "AI Writer", icon: PenTool, status: "Drafting... 74%", color: "bg-primary", active: true },
  { name: "SEO Optimizer", icon: Shield, status: "Idle", color: "bg-muted-foreground", active: false },
  { name: "Publisher", icon: Send, status: "Scheduled (2)", color: "bg-warning", active: true },
];

const pipelineResearching = [
  { title: "The Future of Llama 4 in Enterprise", avatar: "R", time: "2h ago" },
  { title: "Sustainable Farming with AI Robots", avatar: "R", time: "5h ago" },
];
const pipelineDrafting = [
  { title: "10 Secrets of Product-Led Growth", avatar: "W", time: "12m left", agent: "AI WRITER", progress: 65 },
];
const pipelineReady = [
  { title: "Cybersecurity Trends for 2025", seo: "98/100", hasPublish: true },
];
const trending = [
  { title: '"Open Source LLMs vs SaaS Models"', category: "Tech & Computing", virality: 98 },
  { title: "The Rise of Personal Branding for Developers", category: "Career & Business", virality: 84 },
  { title: "Sustainable Fashion: Beyond the Greenwashing", category: "Lifestyle", virality: 72 },
  { title: "Is the Remote Work Era Actually Ending?", category: "News", virality: 68 },
];

const Dashboard = () => {
  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground mt-0.5">{stat.value}</p>
              {stat.change && (
                <p className="text-xs text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> {stat.change}
                </p>
              )}
              {stat.hasProgress && (
                <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${stat.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active Agents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Active Agents</h2>
          <button className="text-sm font-medium text-primary hover:underline transition-colors">Manage Agents →</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {agents.map((agent) => (
            <div key={agent.name} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors duration-200">
                <agent.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              </div>
              <p className="text-sm font-semibold text-foreground">{agent.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${agent.color} ${agent.active ? "animate-pulse-dot" : ""}`} />
                <span className="text-xs text-muted-foreground">{agent.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Pipeline + Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Content Pipeline</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium text-foreground bg-secondary rounded-lg hover:bg-primary/10 transition-colors">Filter</button>
              <button className="px-3 py-1.5 text-xs font-medium text-foreground bg-secondary rounded-lg hover:bg-primary/10 transition-colors">Sort</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Researching */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">RESEARCHING</span>
                <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">3</span>
              </div>
              <div className="space-y-3">
                {pipelineResearching.map((item) => (
                  <div key={item.title} className="bg-background border border-border rounded-lg p-3 hover:border-warning/40 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-full bg-destructive/10 text-destructive text-xs flex items-center justify-center font-semibold">{item.avatar}</div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Drafting */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">DRAFTING</span>
                <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">1</span>
              </div>
              <div className="space-y-3">
                {pipelineDrafting.map((item) => (
                  <div key={item.title} className="bg-background border-2 border-primary/30 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="badge-status bg-primary/10 text-primary mb-2">{item.agent}</span>
                    <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                    <div className="h-1 bg-secondary rounded-full mb-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-full bg-warning/10 text-warning text-xs flex items-center justify-center font-semibold">{item.avatar}</div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Ready */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">READY</span>
                <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">2</span>
              </div>
              <div className="space-y-3">
                {pipelineReady.map((item) => (
                  <div key={item.title} className="bg-background border border-border rounded-lg p-3 hover:border-success/40 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                    <p className="text-xs font-semibold text-success mb-2">SEO: {item.seo}</p>
                    <div className="flex items-center justify-between">
                      <button className="px-3 py-1 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity">Publish</button>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trending Now */}
        <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-bold text-foreground">Trending Now</h3>
          </div>
          <div className="space-y-4">
            {trending.map((item) => (
              <div key={item.title} className="flex items-start justify-between gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors duration-150 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${item.virality >= 90 ? "text-success" : item.virality >= 75 ? "text-primary" : "text-warning"}`}>{item.virality}%</p>
                  <p className="text-[10px] text-muted-foreground">Virality</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary hover:border-primary/20 transition-all duration-200">View Full Report</button>
        </div>
      </div>

      {/* Estimated Reach */}
      <div className="mt-5 bg-primary rounded-xl p-6 text-primary-foreground hover:shadow-lg transition-shadow duration-300">
        <p className="text-xs font-semibold tracking-widest opacity-80">ESTIMATED REACH</p>
        <p className="text-4xl font-bold mt-1">4.2M</p>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
