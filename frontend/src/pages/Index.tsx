import { Link } from "react-router-dom";
import {
  ArrowRight, Bot, CalendarCheck, FileHeart, ShieldCheck,
  Stethoscope, Sparkles, Users, Clock, HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import heroImg from "@/assets/hero-health.jpg";

const features = [
  {
    icon: Bot,
    title: "AI Health Chatbot",
    desc: "24/7 symptom checker and triage powered by medical AI. Instant guidance in your language.",
    color: "text-primary",
    bg: "bg-primary-soft",
  },
  {
    icon: CalendarCheck,
    title: "Easy Appointments",
    desc: "Book consultations with verified doctors. Video or in-person, on your schedule.",
    color: "text-accent",
    bg: "bg-accent-soft",
  },
  {
    icon: FileHeart,
    title: "Digital Health Records",
    desc: "Keep prescriptions, reports and history secure and accessible from any device.",
    color: "text-primary",
    bg: "bg-primary-soft",
  },
];

const stats = [
  { value: "0", label: "Patients served" },
  { value: "0", label: "Verified doctors" },
  { value: "24/7", label: "AI availability" },
  { value: "1", label: "Languages" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-semibold border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered care for every village
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-foreground">
              Quality healthcare,
              <br />
              <span className="text-primary relative inline-block">
                closer than ever.
                <span className="absolute bottom-2 left-0 w-full h-[0.2em] bg-primary/10 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              MediCare AI brings doctors, intelligent triage and digital records to rural communities — no clinic queues, no travel hours, no paperwork.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild variant="hero" size="xl">
                <Link to="/chatbot">Start Consultation <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/register">Create Free Account</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> HIPAA-grade secure</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Reply in seconds</div>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="absolute -inset-4 bg-gradient-primary rounded-[2rem] blur-2xl opacity-20" />
            <div className="relative rounded-3xl overflow-hidden bg-card shadow-elevated border border-border">
              <img src={heroImg} alt="Doctor consulting a rural patient via video call" width={1280} height={960} className="w-full h-auto" />
            </div>
            {/* Floating cards */}
            <div className="absolute -bottom-6 -left-4 bg-card rounded-2xl shadow-elevated border border-border p-4 flex items-center gap-3 animate-float">
              <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center">
                <HeartPulse className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Heart rate</div>
                <div className="font-display font-bold text-foreground">72 bpm</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-2 bg-card rounded-2xl shadow-elevated border border-border p-4 flex items-center gap-3 animate-float" style={{ animationDelay: "1s" }}>
              <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Doctor online</div>
                <div className="font-display font-bold text-foreground">Dr. Mehta</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card/60 backdrop-blur rounded-2xl border border-border p-6 shadow-soft">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display font-extrabold text-2xl md:text-3xl text-primary">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-accent-soft text-accent-foreground text-xs font-semibold mb-3">FEATURES</div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Everything you need for better health</h2>
            <p className="text-muted-foreground">A complete telehealth toolkit designed for rural and underserved communities.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-card rounded-2xl p-7 border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-bounce animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`h-14 w-14 rounded-2xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-bounce`}>
                  <f.icon className={`h-7 w-7 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-28 bg-muted/40">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-3">HOW IT WORKS</div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Get care in three simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Describe symptoms", d: "Chat with our AI in plain language. It understands and asks the right questions." },
              { n: "02", t: "Get instant guidance", d: "Receive triage, home-care tips and a recommendation to see a doctor if needed." },
              { n: "03", t: "Book and consult", d: "Schedule a video visit with a verified doctor and store everything in your records." },
            ].map((s) => (
              <div key={s.n} className="relative bg-card rounded-2xl p-7 border border-border shadow-soft">
                <div className="font-display font-extrabold text-5xl text-primary/15 mb-3">{s.n}</div>
                <h3 className="font-display font-bold text-xl mb-2">{s.t}</h3>
                <p className="text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="py-20 md:py-28">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 text-center shadow-elevated">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative max-w-2xl mx-auto text-primary-foreground space-y-5">
              <Users className="h-12 w-12 mx-auto opacity-90" />
              <h2 className="font-display font-extrabold text-3xl md:text-4xl">Join thousands getting care from home</h2>
              <p className="text-primary-foreground/90 text-lg">Free to start. No credit card. Speak to a doctor today.</p>
              <Button asChild size="xl" className="bg-background text-primary hover:bg-background/90">
                <Link to="/register">Get Started Free <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
