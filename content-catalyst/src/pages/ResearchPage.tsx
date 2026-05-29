import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Search, Globe, FileText, Brain, PenTool, BookOpen,
  CheckCircle2, Loader2, AlertCircle, ChevronLeft,
  ExternalLink, Copy, ChevronDown, ChevronUp, Zap, Save, Edit3,
} from "lucide-react";
import { saveDraft, BlogDraft } from "@/lib/drafts";
import { toast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

type NodeStatus = "idle" | "active" | "done" | "error";

interface NodeState {
  status:  NodeStatus;
  data?:   any;
  message?: string;
}

interface EdgeLine {
  x1: number; y1: number;
  x2: number; y2: number;
  fromId: string; toId: string;
}

// ── Node definitions (col/row describe layout position) ─────────────────────

const NODES = [
  { id: "topic",    label: "Topic",    icon: Search,   col: 0, row: 1 },
  { id: "search",   label: "Search",   icon: Globe,    col: 1, row: 1 },
  { id: "source_0", label: "Source 1", icon: FileText, col: 2, row: 0 },
  { id: "source_1", label: "Source 2", icon: FileText, col: 2, row: 1 },
  { id: "source_2", label: "Source 3", icon: FileText, col: 2, row: 2 },
  { id: "analyze",  label: "Analyze",  icon: Brain,    col: 3, row: 1 },
  { id: "write",    label: "Write",    icon: PenTool,  col: 4, row: 1 },
  { id: "blog",     label: "Blog",     icon: BookOpen, col: 5, row: 1 },
];

const EDGES: [string, string][] = [
  ["topic",    "search"],
  ["search",   "source_0"],
  ["search",   "source_1"],
  ["search",   "source_2"],
  ["source_0", "analyze"],
  ["source_1", "analyze"],
  ["source_2", "analyze"],
  ["analyze",  "write"],
  ["write",    "blog"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusColors: Record<NodeStatus, string> = {
  idle:   "border-border bg-card text-muted-foreground",
  active: "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20",
  done:   "border-green-500 bg-green-500/10 text-green-600",
  error:  "border-destructive bg-destructive/10 text-destructive",
};

const edgeColor = (fromStatus: NodeStatus, toStatus: NodeStatus) => {
  if (toStatus === "done")   return "#22c55e";
  if (toStatus === "active") return "hsl(var(--primary))";
  if (fromStatus === "done") return "#94a3b8";
  return "#334155";
};

const edgeDash = (toStatus: NodeStatus) =>
  toStatus === "idle" ? "6 4" : "none";

// ── Node Card ────────────────────────────────────────────────────────────────

const NodeCard = ({
  node, state, isSelected, onSelect, topic,
}: {
  node: typeof NODES[0];
  state: NodeState;
  isSelected: boolean;
  onSelect: () => void;
  topic: string;
}) => {
  const Icon = node.icon;
  const isSource = node.id.startsWith("source_");
  const label = node.id === "topic" ? (topic.length > 20 ? topic.slice(0, 20) + "…" : topic) : node.label;

  return (
    <div
      onClick={state.status !== "idle" ? onSelect : undefined}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 select-none
        ${isSource ? "w-36 h-20 p-2" : "w-40 h-24 p-3"}
        ${statusColors[state.status]}
        ${state.status !== "idle" ? "cursor-pointer hover:scale-105" : "opacity-50"}
        ${isSelected ? "ring-2 ring-offset-2 ring-primary" : ""}
      `}
    >
      {/* Status indicator */}
      <div className="absolute -top-2 -right-2">
        {state.status === "active" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {state.status === "done"   && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {state.status === "error"  && <AlertCircle  className="w-5 h-5 text-destructive" />}
      </div>

      <Icon className={`mb-1 ${isSource ? "w-5 h-5" : "w-6 h-6"}`} />
      <span className={`font-semibold text-center leading-tight ${isSource ? "text-xs" : "text-sm"}`}>
        {label}
      </span>

      {isSource && state.data?.wordCount && (
        <span className="text-[10px] text-muted-foreground mt-0.5">{state.data.wordCount} words</span>
      )}
      {isSource && state.data?.fallback && (
        <span className="text-[10px] text-amber-500 mt-0.5">snippet only</span>
      )}
      {node.id === "analyze" && state.status === "done" && (
        <span className="text-[10px] text-green-600 mt-0.5">{state.data?.key_facts?.length || 0} facts</span>
      )}
      {node.id === "blog" && state.status === "done" && (
        <span className="text-[10px] text-green-600 mt-0.5">ready to read</span>
      )}
    </div>
  );
};

// ── Blog Viewer ──────────────────────────────────────────────────────────────

const BlogViewer = ({ blog }: { blog: any }) => {
  const [copied, setCopied] = useState(false);

  const fullText = [
    `# ${blog.title}`,
    `\n${blog.intro}`,
    ...(blog.sections || []).map((s: any) => `\n## ${s.heading}\n\n${s.content}`),
    `\n## Conclusion\n\n${blog.conclusion}`,
  ].join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mt-8">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div>
          <h2 className="text-lg font-bold text-foreground">{blog.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{blog.meta_description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">~{blog.estimated_word_count} words</span>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 h-8">
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 prose prose-sm max-w-none dark:prose-invert space-y-6">
        {/* Intro */}
        <div>
          {blog.intro?.split("\n").map((p: string, i: number) => p.trim() && (
            <p key={i} className="text-foreground leading-relaxed mb-3">{p}</p>
          ))}
        </div>

        {/* Sections */}
        {(blog.sections || []).map((section: any, i: number) => (
          <div key={i}>
            <h3 className="text-base font-bold text-foreground mb-3 mt-6 pb-1 border-b border-border">
              {section.heading}
            </h3>
            {section.content?.split("\n").map((p: string, j: number) => p.trim() && (
              <p key={j} className="text-foreground leading-relaxed mb-3">{p}</p>
            ))}
          </div>
        ))}

        {/* Conclusion */}
        {blog.conclusion && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
            <h3 className="text-base font-bold text-foreground mb-2">Conclusion</h3>
            {blog.conclusion.split("\n").map((p: string, i: number) => p.trim() && (
              <p key={i} className="text-foreground leading-relaxed mb-2">{p}</p>
            ))}
          </div>
        )}

        {/* SEO Keywords */}
        {blog.seo_keywords?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground">SEO keywords:</span>
            {blog.seo_keywords.map((kw: string) => (
              <span key={kw} className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full">{kw}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Detail Panel (click a node to see its data) ───────────────────────────────

const NodeDetailPanel = ({ nodeId, state, onClose }: { nodeId: string; state: NodeState; onClose: () => void }) => {
  if (!state?.data) return null;
  const d = state.data;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mt-4 text-sm animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-foreground capitalize">{nodeId.replace("_", " ")} details</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xs">
          Close ×
        </button>
      </div>

      {/* Search sources */}
      {nodeId === "search" && d.sources && (
        <div className="space-y-2">
          {d.sources.map((s: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="font-bold text-primary mt-0.5">{i + 1}.</span>
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-0.5">
                  {s.url.slice(0, 60)}… <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source scrape */}
      {nodeId.startsWith("source_") && (
        <div>
          <p className="font-semibold text-foreground mb-1">{d.title}</p>
          <a href={d.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 mb-2">
            {d.url?.slice(0, 70)}… <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-muted-foreground text-xs">{d.snippet}</p>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span>{d.wordCount} words scraped</span>
            {d.fallback && <span className="text-amber-500">⚠ snippet fallback (scrape blocked)</span>}
          </div>
        </div>
      )}

      {/* Analyze insights */}
      {nodeId === "analyze" && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs">{d.topic_summary}</p>
          {d.key_facts?.length > 0 && (
            <div>
              <p className="font-semibold text-foreground text-xs mb-1">Key Facts</p>
              <ul className="space-y-1">
                {d.key_facts.map((f: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-primary">•</span>{f}</li>)}
              </ul>
            </div>
          )}
          {d.unique_angles?.length > 0 && (
            <div>
              <p className="font-semibold text-foreground text-xs mb-1">Unique Angles</p>
              <ul className="space-y-1">
                {d.unique_angles.map((a: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />{a}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Best angle: </span>{d.best_angle_for_blog}</p>
        </div>
      )}

      {/* Write summary */}
      {nodeId === "write" && (
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{d.title}</p>
          <p className="text-xs text-muted-foreground">{d.meta_description}</p>
          <div className="flex gap-2 flex-wrap">
            {d.seo_keywords?.map((k: string) => <span key={k} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{k}</span>)}
          </div>
          <p className="text-xs text-muted-foreground">{d.sections?.length || 0} sections · ~{d.estimated_word_count} words</p>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const ResearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const topic = searchParams.get("topic") || "";
  const geo   = searchParams.get("geo")   || "US";

  const [nodes, setNodes]           = useState<Record<string, NodeState>>(() =>
    Object.fromEntries(NODES.map((n) => [n.id, { status: "idle" }]))
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [complete, setComplete]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [started, setStarted]           = useState(false);
  const [blogData, setBlogData]         = useState<any>(null);
  const [showBlog, setShowBlog]         = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  // SVG edge lines
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs     = useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = useState<EdgeLine[]>([]);

  const setNode = (id: string, state: Partial<NodeState>) =>
    setNodes((prev) => ({ ...prev, [id]: { ...prev[id], ...state } }));

  // ── Calculate SVG edge positions ─────────────────────────────────────────
  const recalcEdges = useCallback(() => {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const lines: EdgeLine[] = [];

    for (const [fromId, toId] of EDGES) {
      const fromEl = nodeRefs.current[fromId];
      const toEl   = nodeRefs.current[toId];
      if (!fromEl || !toEl) continue;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      lines.push({
        fromId, toId,
        x1: fr.right  - cr.left,
        y1: fr.top    + fr.height / 2 - cr.top,
        x2: tr.left   - cr.left,
        y2: tr.top    + tr.height / 2 - cr.top,
      });
    }
    setEdges(lines);
  }, []);

  useLayoutEffect(() => {
    recalcEdges();
    window.addEventListener("resize", recalcEdges);
    return () => window.removeEventListener("resize", recalcEdges);
  }, [recalcEdges, nodes]);

  // ── Start SSE pipeline ───────────────────────────────────────────────────
  useEffect(() => {
    if (!topic || started) return;
    setStarted(true);

    // Mark topic node as done immediately
    setNode("topic", { status: "done", data: { topic } });

    const url = `${import.meta.env.VITE_API_URL}/api/research/stream?topic=${encodeURIComponent(topic)}&geo=${geo}`;
    const es  = new EventSource(url);

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "step") {
        if (msg.step === "search") {
          setNode("search", { status: msg.status, data: msg.data, message: msg.message });
        } else if (msg.step === "scrape") {
          const nodeId = `source_${msg.index}`;
          setNode(nodeId, { status: msg.status, data: msg.data, message: msg.message });
        } else if (msg.step === "analyze") {
          setNode("analyze", { status: msg.status, data: msg.data, message: msg.message });
        } else if (msg.step === "write") {
          setNode("write", { status: msg.status, data: msg.data, message: msg.message });
          if (msg.status === "done") {
            setNode("blog", { status: "done", data: msg.data });
            setBlogData(msg.data);
          }
        }
      } else if (msg.type === "complete") {
        setComplete(true);
        es.close();
      } else if (msg.type === "error") {
        setError(msg.message);
        es.close();
      }
    };

    es.onerror = () => {
      setError("Connection lost — pipeline may have completed or failed");
      es.close();
    };

    return () => es.close();
  }, [topic, geo]);

  const handleNodeClick = (id: string) =>
    setSelectedNode((prev) => (prev === id ? null : id));

  const getEdgeStatus = (line: EdgeLine): { from: NodeStatus; to: NodeStatus } => ({
    from: nodes[line.fromId]?.status || "idle",
    to:   nodes[line.toId]?.status   || "idle",
  });

  if (!topic) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No topic provided</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/trends")}>
            <ChevronLeft className="w-4 h-4" /> Back to Trends
          </Button>
        </div>
      </AppLayout>
    );
  }

  const doneCount = Object.values(nodes).filter((n) => n.status === "done").length;
  const progress  = Math.round((doneCount / NODES.length) * 100);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button onClick={() => navigate("/trends")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to Trends
          </button>
          <h1 className="text-2xl font-bold text-foreground">Research Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl truncate">
            Topic: <span className="font-semibold text-foreground">{topic}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-sm">
            {complete
              ? <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Complete</span>
              : error
                ? <span className="text-destructive font-semibold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Error</span>
                : <span className="text-primary font-semibold flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Running…</span>
            }
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── NODE GRAPH ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4 overflow-x-auto">
        <div
          ref={containerRef}
          className="relative"
          style={{ minWidth: 780, minHeight: 260 }}
        >
          {/* SVG connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
              </marker>
              <marker id="arrowhead-done" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
            </defs>
            {edges.map((line, i) => {
              const { from, to } = getEdgeStatus(line);
              const color  = edgeColor(from, to);
              const dash   = edgeDash(to);
              const cx     = (line.x1 + line.x2) / 2;
              const marker = to === "done" ? "arrowhead-done" : to === "active" ? "arrowhead-active" : "arrowhead";
              return (
                <g key={i}>
                  <path
                    d={`M ${line.x1} ${line.y1} C ${cx} ${line.y1}, ${cx} ${line.y2}, ${line.x2} ${line.y2}`}
                    stroke={color}
                    strokeWidth={to === "active" ? 2.5 : 1.5}
                    strokeDasharray={dash}
                    fill="none"
                    markerEnd={`url(#${marker})`}
                    opacity={to === "idle" ? 0.35 : 1}
                  />
                  {to === "active" && (
                    <path
                      d={`M ${line.x1} ${line.y1} C ${cx} ${line.y1}, ${cx} ${line.y2}, ${line.x2} ${line.y2}`}
                      stroke="hsl(var(--primary))"
                      strokeWidth={6}
                      fill="none"
                      opacity={0.15}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes: arranged in a flex row by column */}
          <div className="flex items-center justify-between gap-4 px-2 h-full">
            {/* Col 0: Topic */}
            <div className="flex flex-col items-center">
              {NODES.filter((n) => n.col === 0).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>

            {/* Col 1: Search */}
            <div className="flex flex-col items-center">
              {NODES.filter((n) => n.col === 1).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>

            {/* Col 2: Sources (3 stacked) */}
            <div className="flex flex-col items-center gap-3">
              {NODES.filter((n) => n.col === 2).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>

            {/* Col 3: Analyze */}
            <div className="flex flex-col items-center">
              {NODES.filter((n) => n.col === 3).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>

            {/* Col 4: Write */}
            <div className="flex flex-col items-center">
              {NODES.filter((n) => n.col === 4).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>

            {/* Col 5: Blog */}
            <div className="flex flex-col items-center">
              {NODES.filter((n) => n.col === 5).map((n) => (
                <div key={n.id} ref={(el) => { nodeRefs.current[n.id] = el; }}>
                  <NodeCard node={n} state={nodes[n.id]} isSelected={selectedNode === n.id} onSelect={() => handleNodeClick(n.id)} topic={topic} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Click any completed node to inspect its data
        </p>
      </div>

      {/* Detail panel */}
      {selectedNode && nodes[selectedNode]?.data && (
        <NodeDetailPanel
          nodeId={selectedNode}
          state={nodes[selectedNode]}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Step log */}
      <div className="bg-card border border-border rounded-xl p-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Pipeline Log</h3>
        <div className="space-y-2">
          {NODES.map((n) => {
            const s = nodes[n.id];
            return (
              <div key={n.id} className="flex items-center gap-3 text-xs">
                {s.status === "done"   && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                {s.status === "active" && <Loader2      className="w-4 h-4 text-primary animate-spin shrink-0" />}
                {s.status === "error"  && <AlertCircle  className="w-4 h-4 text-destructive shrink-0" />}
                {s.status === "idle"   && <div className="w-4 h-4 rounded-full border border-border shrink-0" />}
                <span className={`font-semibold capitalize ${s.status === "active" ? "text-primary" : s.status === "done" ? "text-green-600" : s.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {n.label}
                </span>
                <span className="text-muted-foreground">
                  {s.status === "active" && (s.message || "processing…")}
                  {s.status === "done"   && n.id === "search"   && `Found ${s.data?.sources?.length || 0} sources`}
                  {s.status === "done"   && n.id.startsWith("source_") && `${s.data?.title?.slice(0, 50) || "scraped"}… (${s.data?.wordCount} words)`}
                  {s.status === "done"   && n.id === "analyze"  && `${s.data?.key_facts?.length || 0} key facts · ${s.data?.unique_angles?.length || 0} angles`}
                  {s.status === "done"   && n.id === "write"    && `"${s.data?.title?.slice(0, 50) || "blog written"}…"`}
                  {s.status === "done"   && n.id === "blog"     && "Blog ready to read below"}
                  {s.status === "done"   && n.id === "topic"    && topic}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Blog */}
      {blogData && (
        <div className="mt-6 space-y-3">
          {/* Save to Drafts */}
          <div className="flex gap-3">
            {!savedDraftId ? (
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  const id = crypto.randomUUID();
                  const draft: BlogDraft = {
                    id,
                    title:                blogData.title || topic,
                    meta_description:     blogData.meta_description || "",
                    intro:                blogData.intro || "",
                    sections:             blogData.sections || [],
                    conclusion:           blogData.conclusion || "",
                    seo_keywords:         blogData.seo_keywords || [],
                    estimated_word_count: blogData.estimated_word_count || 0,
                    images:               blogData.images || [],
                    topic,
                    createdAt: new Date().toISOString(),
                  };
                  saveDraft(draft);
                  setSavedDraftId(id);
                  toast({ title: "Saved to Drafts!", description: "Open in editor to refine and publish." });
                }}
              >
                <Save className="w-4 h-4" />
                Save to Drafts
              </Button>
            ) : (
              <Button
                className="flex-1 gap-2"
                onClick={() => navigate(`/article?id=${savedDraftId}`)}
              >
                <Edit3 className="w-4 h-4" />
                Open in Editor
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => navigate("/content")}
            >
              <BookOpen className="w-4 h-4" />
              View All Drafts
            </Button>
          </div>

          {/* Blog toggle */}
          <button
            onClick={() => setShowBlog((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {showBlog ? "Hide Final Blog" : "View Final Blog — " + (blogData.title || topic)}
            </span>
            {showBlog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showBlog && <BlogViewer blog={blogData} />}
        </div>
      )}
    </AppLayout>
  );
};

export default ResearchPage;
