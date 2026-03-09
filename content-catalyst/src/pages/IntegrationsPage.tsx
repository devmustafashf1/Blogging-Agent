import { useState } from "react";
import { ExternalLink, Key, Plus, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const platforms = [
  { name: "Medium", handle: "@john_doe_writer", connected: true, icon: "M" },
  { name: "WordPress", handle: "techblog.com", connected: true, icon: "🌐" },
];

const apis = [
  { name: "OpenAI", detail: "GPT-4, DALL-E 3 Access", connected: true },
  { name: "Claude (Anthropic)", detail: "Claude 3.5 Sonnet", connected: false },
  { name: "Unsplash", detail: "Image Search Library", connected: true },
];

const integrationTabs = ["Connected Platforms", "API Management", "Brand Voice"];

const IntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState("Connected Platforms");
  const [apiStates, setApiStates] = useState(apis.map((a) => ({ ...a })));
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English (US)");
  const [audience, setAudience] = useState("Developers");
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
        <p className="text-muted-foreground mt-1">Manage your connected platforms, API keys, and brand identity.</p>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 mb-8 border-b border-border">
          {integrationTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
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
