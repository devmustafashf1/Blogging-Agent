import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import { Menu, X } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown via hamburger */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="md:ml-60">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
