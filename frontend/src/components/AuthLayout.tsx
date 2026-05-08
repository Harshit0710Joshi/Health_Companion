import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

export const AuthLayout = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => (
  <div className="min-h-screen grid lg:grid-cols-2 bg-background">
    {/* Left: form */}
    <div className="flex flex-col p-6 md:p-10">
      <Logo />
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md animate-fade-up">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} MediCare AI · <Link to="/" className="hover:text-foreground">Back to home</Link>
      </div>
    </div>

    {/* Right: visual */}
    <div className="hidden lg:flex relative bg-gradient-hero overflow-hidden items-center justify-center p-10">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      </div>
      <div className="relative max-w-md space-y-6">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-elevated">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold mb-1">AI-powered triage</h3>
              <p className="text-sm text-muted-foreground">Understand your symptoms in seconds, in your language.</p>
            </div>
          </div>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-elevated ml-8 animate-float">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <HeartPulse className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold mb-1">Care from anywhere</h3>
              <p className="text-sm text-muted-foreground">Connect with verified doctors via video, even on slow networks.</p>
            </div>
          </div>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-elevated">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold mb-1">Private & secure</h3>
              <p className="text-sm text-muted-foreground">Your records stay encrypted and only you control access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
