import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  Link2,
  ImageIcon,
  ChevronDown,
  Send,
  Shield,
  LinkIcon,
  Globe,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Plus,
  Search,
  Zap,
  Eye,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const sampleContent = `<h1>The Future of Sustainable Architecture</h1>
<p class="subtitle">AI-generated draft exploring the intersection of ecology and design.</p>
<h2>Why Bamboo is the New Steel</h2>
<p>In the quest for carbon neutrality, architects are returning to one of the world's most versatile natural resources: bamboo. Unlike traditional timber, bamboo can grow up to 91 cm in a single day, making it an incredibly renewable source of construction material. When processed into structural components, its tensile strength rivals that of steel, yet it leaves a fraction of the carbon footprint.</p>
<blockquote>AI Insight: Consider adding a paragraph here about "Vertical Forests" to increase semantic relevance for the SEO check.</blockquote>
<h2>Harnessing Generative Design</h2>
<p>Generative design tools are now allowing architects to input environmental parameters—such as sun exposure, wind patterns, and local temperature variations—to automatically generate the most efficient building shapes. This synergy between nature and technology is defining the next era of urban living...</p>`;

const ArticlePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("The Future of Sustainable Architecture");
  const [content, setContent] = useState(sampleContent);
  const [slug, setSlug] = useState("future-of-sustainable-architecture");
  const [metaDesc, setMetaDesc] = useState(
    "Discover why bamboo is becoming the preferred material for carbon-neutral skyscrapers and how generative design is revolutionizing architecture."
  );
  const [keywords, setKeywords] = useState(["Architecture", "Sustainable"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [platform, setPlatform] = useState("WordPress");
  const [wordCount] = useState(742);
  const [readTime] = useState("4.5 min read");
  const [activeTab, setActiveTab] = useState("editor");
  const [isSaved, setIsSaved] = useState(true);

  const agentChecks = [
    {
      icon: Shield,
      label: "Research Facts",
      status: "pass" as const,
      detail: "12 data points verified against top architectural journals.",
    },
    {
      icon: LinkIcon,
      label: "Citations",
      status: "warn" as const,
      count: "2 MISSING",
      detail: 'Add source for the 2030 sustainability forecast mentioned in H2.',
    },
    {
      icon: CheckCircle2,
      label: "Originality",
      status: "pass" as const,
      score: 94,
    },
    {
      icon: Globe,
      label: "SEO Check",
      status: "info" as const,
      detail: 'Keyword "sustainable architecture" density: 2.4% (Optimal).',
    },
  ];

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handlePublish = () => {
    toast({
      title: "Article Published!",
      description: `Successfully published to ${platform}.`,
    });
  };

  const toolbarButtons = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: Underline, label: "Underline" },
    "sep",
    { icon: Heading1, label: "H1" },
    { icon: Heading2, label: "H2" },
    "sep",
    { icon: List, label: "List" },
    { icon: Link2, label: "Link" },
    { icon: ImageIcon, label: "Image" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-auto md:h-14 border-b border-border bg-card flex flex-wrap items-center justify-between px-3 md:px-4 py-2 md:py-0 gap-2 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => navigate("/content")}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Article Workbench
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              My Articles &gt; AI Blog Draft: Future of Tech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 order-3 md:order-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger value="editor" className="text-xs px-2 md:px-3 h-7">
                Editor
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs px-2 md:px-3 h-7">
                History
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs px-2 md:px-3 h-7">
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 order-2 md:order-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                {platform}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPlatform("WordPress")}>
                WordPress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlatform("Medium")}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlatform("Ghost")}>
                Ghost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="text-xs gap-1.5" onClick={handlePublish}>
            <span className="hidden sm:inline">Approve &</span> Publish
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent Checks */}
        <aside className="w-56 border-r border-border bg-card p-4 space-y-4 overflow-y-auto shrink-0 hidden lg:block">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Agent Checks
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              4 active agents reviewing draft
            </p>
          </div>

          <div className="space-y-3">
            {agentChecks.map((check) => (
              <div
                key={check.label}
                className="rounded-lg border border-border bg-background p-3 space-y-2 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <check.icon
                      className={`w-4 h-4 ${
                        check.status === "pass"
                          ? "text-success"
                          : check.status === "warn"
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {check.label}
                    </span>
                  </div>
                  {check.status === "pass" && (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  )}
                  {check.count && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {check.count}
                    </Badge>
                  )}
                  {check.score && (
                    <span className="text-xs font-semibold text-success">
                      {check.score}%
                    </span>
                  )}
                  {check.status === "info" && (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {check.detail && (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {check.detail}
                  </p>
                )}
                {check.score && (
                  <Progress value={check.score} className="h-1.5" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button className="w-full border-2 border-dashed border-border rounded-lg py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Custom Agent
            </button>
          </div>
        </aside>

        {/* Center - Editor */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-4 md:py-6 px-3 md:px-6">
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-4 p-2 rounded-lg border border-border bg-card">
              {toolbarButtons.map((btn, i) => {
                if (btn === "sep") {
                  return (
                    <Separator
                      key={`sep-${i}`}
                      orientation="vertical"
                      className="h-5 mx-1"
                    />
                  );
                }
                const Icon = (btn as { icon: any; label: string }).icon;
                const label = (btn as { icon: any; label: string }).label;
                return (
                  <button
                    key={label}
                    className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Editable Content Area */}
            <div className="prose prose-sm max-w-none">
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full text-3xl font-bold text-foreground bg-transparent border-none outline-none mb-2 placeholder:text-muted-foreground"
                placeholder="Article title..."
              />
              <p className="text-muted-foreground italic text-base mb-6">
                AI-generated draft exploring the intersection of ecology and
                design.
              </p>

              <div
                contentEditable
                suppressContentEditableWarning
                className="min-h-[400px] outline-none text-foreground leading-relaxed space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-md [&_blockquote]:text-primary [&_blockquote]:text-sm [&_blockquote]:italic"
                onInput={() => setIsSaved(false)}
                dangerouslySetInnerHTML={{
                  __html: `
                    <h2>Why Bamboo is the New Steel</h2>
                    <p>In the quest for carbon neutrality, architects are returning to one of the world's most versatile natural resources: bamboo. Unlike traditional timber, bamboo can grow up to 91 cm in a single day, making it an incredibly renewable source of construction material. When processed into structural components, its tensile strength rivals that of steel, yet it leaves a fraction of the carbon footprint.</p>
                    <blockquote>AI Insight: Consider adding a paragraph here about "Vertical Forests" to increase semantic relevance for the SEO check.</blockquote>
                    <h2>Harnessing Generative Design</h2>
                    <p>Generative design tools are now allowing architects to input environmental parameters—such as sun exposure, wind patterns, and local temperature variations—to automatically generate the most efficient building shapes. This synergy between nature and technology is defining the next era of urban living...</p>
                  `,
                }}
              />
            </div>
          </div>
        </main>

        {/* Right Sidebar - Media & SEO */}
        <aside className="w-72 border-l border-border bg-card p-4 space-y-5 overflow-y-auto shrink-0 hidden xl:block">
          {/* Media Assets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Media Assets
              </span>
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="aspect-[4/3] rounded-lg bg-accent overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=200&h=150&fit=crop"
                  alt="Architecture 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-lg bg-accent overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=200&h=150&fit=crop"
                  alt="Architecture 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mb-2">
              <Search className="w-3.5 h-3.5" />
              Search Unsplash
            </Button>
            <Button size="sm" className="w-full text-xs gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Generate with DALL-E
            </Button>
          </div>

          <Separator />

          {/* SEO Settings */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              SEO Settings
            </span>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Meta Description
                </label>
                <Textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="text-xs min-h-[80px] resize-none"
                />
                <p
                  className={`text-[10px] text-right mt-1 ${
                    metaDesc.length > 160
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {metaDesc.length} / 160 characters
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Focus Keywords
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="text-xs gap-1 pl-2 pr-1 py-0.5 text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    placeholder="Add keyword"
                    className="text-xs h-7 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addKeyword}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pro Tip */}
          <div className="rounded-lg border border-border bg-accent/50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Pro Tip
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Articles with at least 3 high-quality images tend to get 42% more
              engagement on Medium.
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSaved ? "bg-success" : "bg-warning"
              }`}
            />
            {isSaved ? "All changes saved" : "Unsaved changes"}
          </span>
          <span>{wordCount} words</span>
          <span>{readTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Eye className="w-3 h-3" />
            Preview
          </button>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last edit 2m ago
          </span>
        </div>
      </footer>
    </div>
  );
};

export default ArticlePage;
