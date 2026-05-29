import { useState } from "react";
import { ExternalLink, Key, Plus, X, Globe, CheckCircle2, AlertCircle, RefreshCw, Copy, Eye, EyeOff, Plug } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const PROXY_URL = `${import.meta.env.VITE_API_URL}/api/proxy/custom`;

// ── static demo data ─────────────────────────────────────────────────────────
const platforms = [
  { name: "Medium",    handle: "@john_doe_writer", connected: true,  icon: "M" },
  { name: "WordPress", handle: "techblog.com",     connected: true,  icon: "🌐" },
];

const apis = [
  { name: "OpenAI",           detail: "GPT-4, DALL-E 3 Access",  connected: true  },
  { name: "Claude (Anthropic)", detail: "Claude 3.5 Sonnet",       connected: false },
  { name: "Unsplash",         detail: "Image Search Library",     connected: true  },
];

const integrationTabs = ["Connected Platforms", "API Management", "Custom API", "Brand Voice"];

// ── Custom API storage ────────────────────────────────────────────────────────
const STORAGE_KEY = "custom_api_integration";

interface CustomApiConfig {
  baseUrl: string;
  token: string;
  username: string;
  connectedAt: string;
  tokenExp: number | null;
}

const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp || null;
  } catch {
    return null;
  }
};

const loadConfig = (): CustomApiConfig | null => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
};

const saveConfig = (cfg: CustomApiConfig) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

// ── Token status badge ────────────────────────────────────────────────────────
const TokenStatus = ({ exp }: { exp: number | null }) => {
  if (!exp) return <span className="text-xs text-muted-foreground">No expiry info</span>;
  const now    = Date.now() / 1000;
  const days   = Math.floor((exp - now) / 86400);
  const hours  = Math.floor(((exp - now) % 86400) / 3600);
  const expired = exp < now;
  if (expired) return <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Expired — re-login</span>;
  return (
    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
      Valid · expires in {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
    </span>
  );
};

// ── Custom API tab ────────────────────────────────────────────────────────────
const CustomApiTab = () => {
  const [saved, setSaved]         = useState<CustomApiConfig | null>(loadConfig);
  const [baseUrl, setBaseUrl]     = useState(saved?.baseUrl || "");
  const [username, setUsername]   = useState(saved?.username || "");
  const [password, setPassword]   = useState("");
  const [token, setToken]         = useState(saved?.token || "");
  const [authMode, setAuthMode]   = useState<"login" | "paste">("login");
  const [showToken, setShowToken] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [testLoading, setTestLoading]   = useState(false);
  const [testResult, setTestResult]     = useState<"ok" | "fail" | null>(null);

  const normalizeUrl = (u: string) => u.replace(/\/$/, "");

  const handleGetToken = async () => {
    if (!baseUrl || !username || !password) {
      toast({ title: "Missing fields", description: "Fill in Base URL, username and password.", variant: "destructive" }); return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: `${normalizeUrl(baseUrl)}/auth/login`,
          method: "POST",
          body: { username, password },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      const jwt = data.token || data.accessToken || data.jwt || "";
      if (!jwt) throw new Error("No token in response");
      setToken(jwt);
      toast({ title: "Token received", description: "JWT fetched. Save to connect." });
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleTest = async () => {
    if (!baseUrl || !token) {
      toast({ title: "Missing info", description: "Need base URL and token to test.", variant: "destructive" }); return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: `${normalizeUrl(baseUrl)}/`,
          method: "GET",
          token,
        }),
      });
      const ok = res.status < 500;
      setTestResult(ok ? "ok" : "fail");
      toast({ title: ok ? "Connection successful" : "Server error", description: `Status ${res.status}` });
    } catch {
      setTestResult("fail");
      toast({ title: "Connection failed", description: "Could not reach the API.", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = () => {
    if (!baseUrl || !token) {
      toast({ title: "Missing info", description: "Base URL and token are required.", variant: "destructive" }); return;
    }
    const cfg: CustomApiConfig = {
      baseUrl: normalizeUrl(baseUrl),
      token,
      username,
      connectedAt: new Date().toISOString(),
      tokenExp: decodeJwtExp(token),
    };
    saveConfig(cfg);
    setSaved(cfg);
    toast({ title: "Integration saved", description: `Connected to ${cfg.baseUrl}` });
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setToken("");
    setPassword("");
    toast({ title: "Disconnected", description: "Custom API integration removed." });
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast({ title: "Copied", description: "Token copied to clipboard." });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-foreground">Custom API Integration</h2>
        {saved && <TokenStatus exp={saved.tokenExp} />}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Connect any REST API using Bearer token auth. Enter your base URL, authenticate to get a JWT, then save.
      </p>

      {/* Connected banner */}
      {saved && (
        <div className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-xl px-4 py-3 mb-6">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Connected to {saved.baseUrl}</p>
            <p className="text-xs text-muted-foreground">
              Since {new Date(saved.connectedAt).toLocaleDateString()} · username: {saved.username || "—"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDisconnect}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">

        {/* Base URL */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base URL</label>
          <div className="flex items-center gap-2 mt-1.5">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.yoursite.com"
              className="flex-1 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Auth mode toggle */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Authentication</label>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => setAuthMode("login")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${authMode === "login" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
            >
              Login to get token
            </button>
            <button
              onClick={() => setAuthMode("paste")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${authMode === "paste" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
            >
              Paste token directly
            </button>
          </div>
        </div>

        {/* Login form */}
        {authMode === "login" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                className="w-full mt-1.5 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleGetToken()}
                className="w-full mt-1.5 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleGetToken} disabled={loginLoading} variant="outline" className="gap-2">
                <Key className="w-4 h-4" />
                {loginLoading ? "Fetching token…" : "Get Token via POST /auth/login"}
              </Button>
            </div>
          </div>
        )}

        {/* Token field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">JWT Token</label>
            {token && <TokenStatus exp={decodeJwtExp(token)} />}
          </div>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={authMode === "paste" ? "Paste your Bearer token here…" : "Token will appear here after login"}
              className="w-full h-10 px-3 pr-20 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button onClick={() => setShowToken(!showToken)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {token && (
                <button onClick={copyToken} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Use as <code className="bg-secondary px-1 rounded">Authorization: Bearer &lt;token&gt;</code> — re-login after expiry.
          </p>
        </div>

        {/* Endpoints reference */}
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Endpoints</p>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-foreground">/auth/login</span>
              <span className="text-muted-foreground">— get JWT token</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-foreground">/read/blog</span>
              <span className="text-muted-foreground">— create a blog post (auth required)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={!baseUrl || !token} className="gap-2">
            <Plug className="w-4 h-4" />
            {saved ? "Update Integration" : "Save & Connect"}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testLoading || !baseUrl || !token} className="gap-2">
            {testLoading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : testResult === "ok"
                ? <CheckCircle2 className="w-4 h-4 text-success" />
                : testResult === "fail"
                  ? <AlertCircle className="w-4 h-4 text-destructive" />
                  : <Globe className="w-4 h-4" />
            }
            {testLoading ? "Testing…" : "Test Connection"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const IntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState("Connected Platforms");
  const [apiStates, setApiStates] = useState(apis.map((a) => ({ ...a })));
  const [tone, setTone]           = useState("Professional");
  const [language, setLanguage]   = useState("English (US)");
  const [audience, setAudience]   = useState("Developers");
  const [instructions, setInstructions] = useState("");

  const handleApiConnect = (index: number, key: string) => {
    if (!key.trim()) return;
    const updated = [...apiStates];
    updated[index].connected = true;
    setApiStates(updated);
    toast({ title: "API Connected", description: `${updated[index].name} connected successfully.` });
  };

  const handleSaveVoice = () => {
    toast({ title: "Voice Profile Saved", description: "Your brand voice settings have been updated." });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground">Integrations & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage connected platforms, API keys, and brand identity.</p>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 mb-8 border-b border-border overflow-x-auto">
          {integrationTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Connected Platforms */}
        {activeTab === "Connected Platforms" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Connected Platforms</h2>
              <button className="text-sm font-medium text-primary hover:underline transition-colors">Add New Platform</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map((p) => (
                <div key={p.name} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold">{p.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-status bg-success/10 text-success font-semibold">CONNECTED</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Management */}
        {activeTab === "API Management" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-foreground mb-4">API Management</h2>
            <div className="space-y-3">
              {apiStates.map((api, i) => (
                <div key={api.name} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Key className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{api.name}</p>
                      <p className="text-xs text-muted-foreground">{api.detail}</p>
                    </div>
                  </div>
                  {api.connected ? (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <input type="password" value="sk-xxxxxxxxxxxxxxxx" readOnly className="h-9 px-3 text-sm border border-border rounded-lg bg-background w-full sm:w-56" />
                      <Button variant="default" size="sm">Edit</Button>
                    </div>
                  ) : (
                    <ApiConnectInput onConnect={(key) => handleApiConnect(i, key)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom API */}
        {activeTab === "Custom API" && <CustomApiTab />}

        {/* Brand Voice */}
        {activeTab === "Brand Voice" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-foreground mb-2">Brand Voice Settings</h2>
            <p className="text-sm text-muted-foreground mb-4">Instruct the AI on how to represent your brand across all generated content.</p>
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="text-xs font-semibold text-muted-foreground tracking-wide">Custom Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full mt-2 h-32 px-4 py-3 text-sm border border-border rounded-lg bg-background resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="e.g. Always use a professional yet witty tone. Avoid jargon. Focus on technical accuracy but keep it accessible for beginners..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wide">TONE</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full mt-1 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground">
                    {["Professional", "Casual", "Academic", "Witty", "Formal"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wide">LANGUAGE</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full mt-1 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground">
                    {["English (US)", "English (UK)", "Spanish", "French", "German"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wide">AUDIENCE</label>
                  <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full mt-1 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground">
                    {["Developers", "Marketers", "Executives", "General", "Students"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="outline" onClick={() => { setInstructions(""); setTone("Professional"); setLanguage("English (US)"); setAudience("Developers"); }}>Discard Changes</Button>
                <Button onClick={handleSaveVoice}>Save Voice Profile</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const ApiConnectInput = ({ onConnect }: { onConnect: (key: string) => void }) => {
  const [key, setKey] = useState("");
  return (
    <div className="flex items-center gap-3">
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Enter API Key"
        className="h-9 px-3 text-sm border border-border rounded-lg bg-background w-56 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
      <Button variant="default" size="sm" onClick={() => onConnect(key)}>Connect</Button>
    </div>
  );
};

export default IntegrationsPage;
