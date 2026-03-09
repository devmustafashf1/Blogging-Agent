import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Calendar,
  BarChart3,
  Puzzle,
  Settings,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/trends", icon: TrendingUp, label: "Trends" },
  { to: "/content", icon: FileText, label: "Content Queue" },
  { to: "/publishing", icon: Calendar, label: "Publishing" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/integrations", icon: Puzzle, label: "Integrations" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface AppSidebarProps {
  onClose?: () => void;
}

const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside className="h-full w-60 bg-card border-r border-border flex flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">AI Content Pro</h1>
            <p className="text-xs text-muted-foreground">Blogging Agent</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors md:hidden">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout + Credits */}
      <div className="px-3 pb-2">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-destructive hover:bg-destructive/5"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-semibold text-primary">84%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "84%" }} />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
