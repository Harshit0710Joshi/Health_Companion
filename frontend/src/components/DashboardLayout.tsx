import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Input } from "@/components/ui/input";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout = ({ children, title, subtitle }: Props) => {
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
            <div className="ml-auto flex items-center gap-3">
              <button className="relative h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-smooth">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
              </button>
              <div className="h-10 w-10 rounded-xl bg-gradient-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-soft">
                A
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
