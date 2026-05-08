import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-border bg-muted/30">
    <div className="container py-12 grid gap-8 md:grid-cols-4">
      <div className="md:col-span-2 space-y-4">
        <Logo />
        <p className="text-sm text-muted-foreground max-w-xs">
          Bringing quality healthcare to rural communities through AI-powered consultations and accessible records.
        </p>
      </div>
      <div>
        <h4 className="font-display font-bold text-sm mb-3">Product</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>AI Chatbot</li><li>Appointments</li><li>Health Records</li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-bold text-sm mb-3">Company</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>About</li><li>Privacy</li><li>Contact</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} MediCare AI. Built with care for rural health.
    </div>
  </footer>
);
