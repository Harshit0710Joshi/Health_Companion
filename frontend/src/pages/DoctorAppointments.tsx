import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, Clock, LogOut, UserRound, Video, Users, Activity, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { apiFetch, removeAuthToken, getAuthRole } from "@/lib/api";
import { toast } from "sonner";

interface DoctorAppointment {
  id: number;
  patient: string;
  doctor: string;
  spec: string;
  date: string;
  time: string;
  status: string;
  roomId: string;
}

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { data: appointments = [], isLoading } = useQuery<DoctorAppointment[]>({
    queryKey: ["doctor-appointments"],
    queryFn: () => apiFetch<DoctorAppointment[]>("/doctor/appointments"),
  });

  const logout = () => {
    removeAuthToken();
    toast.info("Logged out of doctor portal");
    navigate("/login");
  };

  const upcomingCount = appointments.filter(a => a.status === 'Scheduled').length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border bg-white/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden md:block h-6 w-px bg-border mx-2" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Activity className="h-3 w-3" /> Doctor Portal
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground">Welcome back, Doctor</h1>
            <p className="text-muted-foreground mt-1.5 text-lg">You have {upcomingCount} patient consultations scheduled for today.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Today's Patients</div>
                <div className="text-2xl font-display font-bold">{appointments.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Upcoming Consultations
            </h2>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-border p-16 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl">No consultations today</h3>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Whenever a patient books a session with you, it will appear here instantly.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {appointments.map((appointment, i) => (
                <div 
                  key={appointment.id} 
                  className="group bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/20 animate-fade-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center shadow-inner">
                        <UserRound className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <div className="font-display font-bold text-lg leading-tight">{appointment.patient || "Patient"}</div>
                        <div className="text-xs font-semibold text-primary/70 uppercase tracking-wider mt-0.5">{appointment.spec}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                      {appointment.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary/60" />
                      {appointment.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary/60" />
                      {appointment.time}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button asChild variant="hero" className="flex-1 rounded-xl shadow-lg shadow-primary/20">
                      <Link to={`/doctor/appointments/${appointment.id}/call`} className="gap-2">
                        <Video className="h-4 w-4" /> Start Call
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl border-border hover:bg-muted">
                      <UserRound className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
