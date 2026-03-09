import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ArrowUpDown, MoreVertical, Plus, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const tabs = ["Drafts", "In Review", "Approved", "Published"];

type Post = {
  title: string;
  subtitle: string;
  topic: string;
  topicColor: string;
  wordCount: string;
  status: string;
  statusColor: string;
  originality: number;
  origColor: string;
};

const allPosts: Record<string, Post[]> = {
  Drafts: [
    { title: "The Future of Generative AI in SaaS", subtitle: "Edited 2 hours ago", topic: "Technology", topicColor: "bg-primary/10 text-primary", wordCount: "1,450", status: "Draft", statusColor: "bg-warning/10 text-warning", originality: 94, origColor: "bg-success" },
    { title: "Remote Work Culture: The Complete Guide", subtitle: "Created 4 days ago", topic: "HR", topicColor: "bg-primary/10 text-primary", wordCount: "3,200", status: "Draft", statusColor: "bg-warning/10 text-warning", originality: 65, origColor: "bg-destructive" },
    { title: "Blockchain in Supply Chain Management", subtitle: "Created 1 week ago", topic: "Logistics", topicColor: "bg-warning/10 text-warning", wordCount: "1,800", status: "Draft", statusColor: "bg-warning/10 text-warning", originality: 78, origColor: "bg-warning" },
  ],
  "In Review": [
    { title: "10 Best SEO Practices for 2024", subtitle: "Created yesterday", topic: "Marketing", topicColor: "bg-success/10 text-success", wordCount: "2,100", status: "In Review", statusColor: "bg-info/10 text-info", originality: 82, origColor: "bg-warning" },
    { title: "How AI is Transforming Healthcare", subtitle: "Submitted 3 days ago", topic: "Health Tech", topicColor: "bg-primary/10 text-primary", wordCount: "2,800", status: "In Review", statusColor: "bg-info/10 text-info", originality: 91, origColor: "bg-success" },
  ],
  Approved: [
    { title: "Sustainable Energy Solutions in Tech", subtitle: "Edited 3 days ago", topic: "Green Tech", topicColor: "bg-success/10 text-success", wordCount: "980", status: "Approved", statusColor: "bg-success/10 text-success", originality: 98, origColor: "bg-success" },
    { title: "The Rise of No-Code Platforms", subtitle: "Approved yesterday", topic: "Technology", topicColor: "bg-primary/10 text-primary", wordCount: "1,650", status: "Approved", statusColor: "bg-success/10 text-success", originality: 96, origColor: "bg-success" },
  ],
  Published: [
    { title: "Why TypeScript Dominates in 2025", subtitle: "Published 2 days ago", topic: "Development", topicColor: "bg-primary/10 text-primary", wordCount: "1,900", status: "Published", statusColor: "bg-primary/10 text-primary", originality: 97, origColor: "bg-success" },
    { title: "Content Marketing Strategies That Work", subtitle: "Published last week", topic: "Marketing", topicColor: "bg-success/10 text-success", wordCount: "2,400", status: "Published", statusColor: "bg-primary/10 text-primary", originality: 93, origColor: "bg-success" },
  ],
};

const ContentQueuePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Drafts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("Technology");

  const posts = allPosts[activeTab] || [];

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    toast({ title: "Post Created", description: `"${newTitle}" added to Drafts` });
    setShowCreateModal(false);
    setNewTitle("");
    setActiveTab("Drafts");
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Pipeline</h1>
          <p className="text-muted-foreground mt-1">Monitor progress and optimize your AI-generated content strategy.</p>
        </div>
      </div>

      {/* Tabs + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex gap-1 bg-secondary rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                activeTab === tab ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              <span className="ml-1 text-xs opacity-60">({(allPosts[tab] || []).length})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary hover:border-primary/20 transition-all duration-200">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary hover:border-primary/20 transition-all duration-200">
            <ArrowUpDown className="w-4 h-4" /> <span className="hidden sm:inline">Sort by Recent</span>
          </button>
        </div>
      </div>

      {/* Content - Cards on mobile, Table on desktop */}
      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {posts.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">No posts in this category yet.</div>
        ) : (
          posts.map((post) => (
            <div key={post.title} onClick={() => navigate("/article")} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge-status ${post.statusColor}`}>{post.status}</span>
                <button className="p-1 rounded hover:bg-secondary transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm font-semibold text-foreground">{post.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">{post.subtitle}</p>
              <div className="flex items-center justify-between">
                <span className={`badge-status ${post.topicColor}`}>{post.topic}</span>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${post.origColor}`} style={{ width: `${post.originality}%` }} />
                  </div>
                  <span className={`text-xs font-semibold ${post.originality >= 90 ? "text-success" : post.originality >= 75 ? "text-warning" : "text-destructive"}`}>{post.originality}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">BLOG TITLE</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">TOPIC</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">WORD COUNT</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">STATUS</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">ORIGINALITY</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No posts in this category yet.</td></tr>
            ) : (
              posts.map((post) => (
                <tr key={post.title} onClick={() => navigate("/article")} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{post.subtitle}</p>
                  </td>
                  <td className="px-5 py-4"><span className={`badge-status ${post.topicColor}`}>{post.topic}</span></td>
                  <td className="px-5 py-4 text-center text-sm text-foreground">{post.wordCount}</td>
                  <td className="px-5 py-4 text-center"><span className={`badge-status ${post.statusColor}`}>{post.status}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${post.origColor}`} style={{ width: `${post.originality}%` }} />
                      </div>
                      <span className={`text-sm font-semibold ${post.originality >= 90 ? "text-success" : post.originality >= 75 ? "text-warning" : "text-destructive"}`}>{post.originality}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button className="p-1 rounded hover:bg-secondary transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {posts.length} {activeTab.toLowerCase()} posts</p>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">‹</button>
            <button className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">›</button>
          </div>
        </div>
      </div>

      {/* Create CTA */}
      <div className="mt-6">
        <Button className="gap-2 w-full max-w-xs hover:shadow-md transition-all duration-200" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Create New Post
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Create New Post</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Blog Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter your blog title..."
                  className="w-full h-10 px-4 text-sm border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Topic</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground"
                >
                  {["Technology", "Marketing", "HR", "Green Tech", "Development", "Health Tech"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Target Word Count</label>
                <select className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground">
                  <option>1,000 - 1,500 words</option>
                  <option>1,500 - 2,500 words</option>
                  <option>2,500 - 3,500 words</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate}>Create Draft</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ContentQueuePage;
