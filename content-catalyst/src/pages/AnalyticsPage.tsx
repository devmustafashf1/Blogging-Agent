import { BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const AnalyticsPage = () => {
  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-8">Track post performance, traffic, and engagement metrics.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {[
          { label: "Total Views", value: "124.5K", change: "+18%" },
          { label: "Avg Engagement", value: "4.2%", change: "+0.8%" },
          { label: "GSC Clicks", value: "32.1K", change: "+22%" },
          { label: "Top Rankings", value: "47", change: "+5" },
        ].map((s) => (
          <div key={s.label} className="stat-card flex-col">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-xs text-success mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Placeholder chart */}
      <div className="bg-card border border-border rounded-xl p-6 h-72 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Traffic & Rankings Chart</p>
          <p className="text-xs mt-1">Connect analytics to see live data</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
