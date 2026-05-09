import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout = ({ children, title, subtitle }: Props) => {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ name: string; role: string }>('/me'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6 sticky top-0 z-40">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search…" className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 md:gap-4">
              <button className="relative h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-smooth group">
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background animate-pulse" />
              </button>
              
              <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
              
              <div className="flex items-center gap-3 pl-1">
                <div className="hidden lg:block text-right">
                  <div className="text-sm font-bold leading-none">{user?.name || "User"}</div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{user?.role || "Patient"}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-soft cursor-pointer hover:scale-105 transition-bounce border-2 border-background ring-1 ring-primary/10">
                  {user?.name?.[0] || "U"}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {(title || subtitle) && (
              <div className="mb-6 md:mb-8 animate-fade-up">
                {title && <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{title}</h1>}
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
