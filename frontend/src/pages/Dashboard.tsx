import { Link } from "react-router-dom";
import { MessageCircle, CalendarCheck, FileHeart, ArrowRight, TrendingUp, Activity, Pill, Heart } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const quickActions = [
  {
    to: "/chatbot",
    icon: MessageCircle,
    title: "Start AI Chat",
    desc: "Describe symptoms and get instant guidance.",
    gradient: "from-primary to-primary-glow",
  },
  {
    to: "/appointments",
    icon: CalendarCheck,
    title: "Book Appointment",
    desc: "Choose a doctor and time that works for you.",
    gradient: "from-accent to-primary",
  },
  {
    to: "/records",
    icon: FileHeart,
    title: "View Records",
    desc: "All your prescriptions and reports in one place.",
    gradient: "from-primary-glow to-accent",
  },
];

const Dashboard = () => {
  const { data: vitalsData } = useQuery({
    queryKey: ['vitals'],
    queryFn: () => apiFetch('/vitals')
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => apiFetch('/appointments')
  });

  const vitals = vitalsData ? [
    { icon: Heart, label: "Heart rate", value: vitalsData.heartRate, unit: "bpm", color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Activity, label: "Blood pressure", value: vitalsData.bloodPressure, unit: "mmHg", color: "text-primary", bg: "bg-primary-soft" },
    { icon: TrendingUp, label: "Sugar level", value: vitalsData.sugarLevel, unit: "mg/dL", color: "text-accent", bg: "bg-accent-soft" },
    { icon: Pill, label: "Medications", value: vitalsData.medications, unit: "active", color: "text-warning", bg: "bg-warning/10" },
  ] : [];

  const nextAppt = appointments && appointments.length > 0 ? appointments[0] : null;

  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6 md:p-10 mb-8 shadow-elevated animate-fade-up">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-primary-foreground">
            <p className="text-sm font-medium opacity-90">Good morning,</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mt-1">Hello 👋</h2>
            <p className="opacity-90 mt-2 max-w-md">You have {appointments?.length || 0} upcoming appointments. Stay healthy!</p>
          </div>
          <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90 shrink-0">
            <Link to="/chatbot">Talk to AI <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="font-display font-bold text-xl mb-4">Quick actions</h3>
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {quickActions.map((a, i) => (
          <Link
            key={a.title}
            to={a.to}
            className="group relative overflow-hidden bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-bounce animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mb-4 shadow-soft`}>
              <a.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h4 className="font-display font-bold text-lg mb-1">{a.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">{a.desc}</p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-smooth">
              Open <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      {/* Vitals + Upcoming */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-xl">Health overview</h3>
            <span className="text-xs text-muted-foreground">Last updated today</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {vitals.map((v) => (
              <div key={v.label} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-smooth">
                <div className={`h-12 w-12 rounded-xl ${v.bg} flex items-center justify-center`}>
                  <v.icon className={`h-6 w-6 ${v.color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{v.label}</div>
                  <div className="font-display font-bold text-lg">
                    {v.value} <span className="text-xs font-medium text-muted-foreground">{v.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-bold text-xl mb-4">Next appointment</h3>
          {nextAppt ? (
            <div className="rounded-xl bg-gradient-to-br from-primary-soft to-accent-soft p-5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">{nextAppt.date} · {nextAppt.time}</div>
              <div className="font-display font-bold text-lg mt-1">{nextAppt.doctor}</div>
              <div className="text-sm text-muted-foreground">{nextAppt.spec} · Video</div>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/40 p-5 text-center text-sm text-muted-foreground">
              No upcoming appointments.
            </div>
          )}
          <Button asChild variant="soft" className="w-full mt-4">
            <Link to="/appointments">Manage appointments</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
