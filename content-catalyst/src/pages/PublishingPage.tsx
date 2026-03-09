import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreVertical, X, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const viewTabs = ["Month", "Week", "List View"];
const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const calendarWeeks = [
  [26, 27, 28, 29, 30, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
];

const events: Record<string, { title: string; platform: string; color: string }> = {
  "4": { title: "Mastering Tailwind CSS 2024", platform: "WORDPRESS", color: "border-l-primary" },
  "6": { title: "Future of Web3", platform: "MEDIUM", color: "bg-foreground text-background" },
  "12": { title: "Sustainable Living Ideas", platform: "WORDPRESS", color: "border-l-primary" },
};

const readyPosts = [
  { platform: "WORDPRESS", title: "10 Tips for Better UX Design", desc: "Exploring the subtle nuances that make digital experiences truly memorable for users...", note: "No schedule set" },
  { platform: "MEDIUM", title: "The Rise of Remote Culture", desc: "How global shifts are redefining what it means to go to \"the office\" in the 21st century...", note: "Draft saved" },
  { platform: "WORDPRESS", title: "Productivity Hacks for Devs", desc: "Stop multitasking and start deep work with these essential strategies for software...", note: "Final review passed" },
];

const PublishingPage = () => {
  const [activeView, setActiveView] = useState("Month");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedPlatform, setSchedPlatform] = useState("WordPress");
  const [schedDate, setSchedDate] = useState("");

  const handleSchedule = () => {
    if (!schedTitle.trim()) return;
    toast({ title: "Post Scheduled", description: `"${schedTitle}" scheduled for ${schedDate || "next available slot"}` });
    setShowScheduleModal(false);
    setSchedTitle("");
    setSchedDate("");
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">October 2023</h1>
              <div className="flex gap-1">
                <button className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-secondary hover:border-primary/20 transition-all duration-200">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-secondary hover:border-primary/20 transition-all duration-200">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveView(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeView === tab ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {days.map((d) => (
                <div key={d} className="px-3 py-3 text-xs font-semibold text-muted-foreground text-center">{d}</div>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
                {week.map((day) => {
                  const event = events[String(day)];
                  const isToday = day === 6 && wi === 1;
                  return (
                    <div key={`${wi}-${day}`} className="min-h-[100px] border-r border-border last:border-0 p-2 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer">
                      <span className={`text-sm ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</span>
                      {event && (
                        <div className={`mt-1 rounded-md p-1.5 text-xs hover:shadow-md transition-shadow duration-200 ${
                          event.color.startsWith("bg-") ? `${event.color} rounded-md p-2` : `bg-primary/5 ${event.color} border-l-2`
                        }`}>
                          <p className="text-[10px] font-bold opacity-70">{event.platform}</p>
                          <p className="font-medium mt-0.5 leading-tight">{event.title}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Ready to Publish */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Ready to Publish</h2>
            <span className="badge-status bg-destructive/10 text-destructive font-semibold">4 Items</span>
          </div>
          <button className="w-full py-2.5 mb-4 text-sm font-medium border border-border rounded-lg hover:bg-secondary hover:border-primary/20 transition-all duration-200 flex items-center justify-center gap-2">
            <span>✍️</span> Publish All Ready
          </button>
          <div className="space-y-4">
            {readyPosts.map((post) => (
              <div key={post.title} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge-status bg-secondary text-muted-foreground text-[10px] font-bold">{post.platform}</span>
                  <button className="p-1 rounded hover:bg-secondary transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{post.desc}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-semibold text-foreground">78%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "78%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule New Button */}
      <div className="fixed bottom-6 right-6">
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200" onClick={() => setShowScheduleModal(true)}>
          <Plus className="w-4 h-4" /> Schedule New
        </Button>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Schedule New Post</h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Post Title</label>
                <input value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} placeholder="Select or enter post title..." className="w-full h-10 px-4 text-sm border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
                <select value={schedPlatform} onChange={(e) => setSchedPlatform(e.target.value)} className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground">
                  {["WordPress", "Medium", "Ghost"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Date & Time</label>
                <input type="datetime-local" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="w-full h-10 px-4 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSchedule}>Schedule</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PublishingPage;
