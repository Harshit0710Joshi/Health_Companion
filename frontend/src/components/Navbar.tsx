import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const links = [
  { to: "/#features", label: "Features" },
  { to: "/#how", label: "How it works" },
  { to: "/#about", label: "About" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/chatbot") || pathname.startsWith("/appointments") || pathname.startsWith("/records")) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
          <Button asChild variant="hero"><Link to="/register">Get Started</Link></Button>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-up">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="text-sm font-medium py-2">{l.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1"><Link to="/login">Login</Link></Button>
              <Button asChild variant="hero" className="flex-1"><Link to="/register">Get Started</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
