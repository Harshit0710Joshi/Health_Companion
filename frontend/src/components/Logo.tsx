import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 group ${className}`}>
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-smooth" />
      <div className="relative h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
        <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
    </div>
    <div className="flex flex-col leading-none">
      <span className="font-display font-extrabold text-lg text-foreground">MediCare</span>
      <span className="text-[10px] font-semibold tracking-widest text-primary uppercase">AI Health</span>
    </div>
  </Link>
);
