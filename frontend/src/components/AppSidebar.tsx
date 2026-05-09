import { LayoutDashboard, MessageCircle, CalendarCheck, FileHeart, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { apiFetch, removeAuthToken } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Chatbot", url: "/chatbot", icon: MessageCircle },
  { title: "Appointments", url: "/appointments", icon: CalendarCheck },
  { title: "Health Records", url: "/records", icon: FileHeart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ name: string; role: string }>('/me'),
    staleTime: 1000 * 60 * 5,
  });

  const logout = () => {
    removeAuthToken();
    navigate("/");
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
      isActive
        ? "bg-primary text-primary-foreground shadow-soft"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center px-4">
        {!collapsed ? <Logo /> : (
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft mx-auto">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <NavLink to={item.url} end className={linkCls}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-1">
             <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center text-primary font-bold text-xs">
                {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{user?.name || "User"}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{user?.role || "Patient"}</div>
             </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth group"
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
