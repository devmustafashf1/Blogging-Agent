import { Search, Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const TopBar = ({ onMenuToggle }: TopBarProps) => {
  return (
    <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-secondary transition-colors md:hidden">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="relative w-full max-w-96 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects, trends, or documents..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button size="default" className="gap-2 hidden sm:inline-flex">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
        <Button size="icon" className="sm:hidden w-9 h-9">
          <Plus className="w-4 h-4" />
        </Button>
        <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-semibold text-muted-foreground">JD</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
