import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account, preferences, and subscription.</p>

      <div className="max-w-2xl space-y-8">
        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input className="w-full mt-1 h-10 px-3 text-sm border border-border rounded-lg bg-background" defaultValue="John Doe" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input className="w-full mt-1 h-10 px-3 text-sm border border-border rounded-lg bg-background" defaultValue="john@example.com" />
            </div>
          </div>
          <Button className="mt-4">Save Changes</Button>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Notifications</h2>
          <div className="space-y-3">
            {["Email on publish", "Email on failure", "Weekly digest"].map((item) => (
              <label key={item} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary" />
                <span className="text-sm text-foreground">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Subscription</h2>
          <p className="text-sm text-muted-foreground mb-4">You are on the <span className="font-semibold text-primary">Enterprise Plan</span></p>
          <Button variant="outline">Manage Subscription</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
