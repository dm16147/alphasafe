import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, LogOut, Menu, X, ChevronLeft, ChevronRight, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { href: "/", label: "Intervenções", icon: LayoutDashboard },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/technicians", label: "Funcionários", icon: UserCog },
  ];

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      <div className={cn("p-6 flex flex-col items-center gap-4 transition-all duration-300", collapsed && "p-4")}>
        <div className="w-full px-2">
          <div className="relative flex items-center justify-center py-2">
            <img 
              src="/assets/logo.webp" 
              alt="AlphaSafe Logo" 
              className={cn("h-28 w-auto object-contain transition-all duration-300", collapsed && "h-12")}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {user && !collapsed && (
          <div className="w-full px-4 py-2 bg-muted/50 rounded-xl flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user.role === 'admin' ? 'Administração' : 'Técnico'}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <button
                onClick={() => setIsOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                )}
                title={collapsed ? item.label : ""}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <button 
          onClick={() => logout()}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background shadow-md border-border"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col h-screen border-r bg-background fixed left-0 top-0 z-50 shadow-lg transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent collapsed={isCollapsed} />
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-[60]"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-background z-50 shadow-lg border-r transition-transform duration-300 lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Spacing for main content */}
      <div className={cn(
        "hidden lg:block transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )} />
    </>
  );
}
