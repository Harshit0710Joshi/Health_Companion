import { LayoutDashboard, MessageCircle, CalendarCheck, FileHeart, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { removeAuthToken } from "@/lib/api";

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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
