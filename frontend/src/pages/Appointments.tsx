import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Clock, MapPin, Star, Video } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getErrorMessage } from "@/lib/api";

const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

interface Appt { id: number; doctor: string; spec: string; date: string; time: string; status: string; roomId: string; }
interface Doctor {
  id: number;
  name: string;
  specialization: string;
  rating: number;
  experience: string;
  fee: string;
  initials: string;
  color: string;
}

const Appointments = () => {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<number | null>(1);
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [time, setTime] = useState("10:30");

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: () => apiFetch<Doctor[]>('/doctors')
  });

  const { data: appts = [] } = useQuery<Appt[]>({
    queryKey: ['appointments'],
    queryFn: () => apiFetch<Appt[]>('/appointments')
  });

  const bookMutation = useMutation({
    mutationFn: (newAppt: { doctorId: number; date: string; time: string }) => {
      return apiFetch<Appt>('/appointments', { method: 'POST', data: newAppt });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(`Appointment booked with ${data.doctor}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to book appointment"));
    }
  });

  const book = () => {
    if (!selectedDoc) return;
    bookMutation.mutate({ doctorId: selectedDoc, date, time });
  };


  return (
    <DashboardLayout title="Appointments" subtitle="Book a consultation with verified doctors.">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Doctors list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg">Available doctors</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {doctors.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={`text-left bg-card rounded-2xl p-5 border-2 shadow-soft transition-bounce hover:-translate-y-0.5 animate-fade-up ${selectedDoc === d.id ? "border-primary shadow-glow" : "border-border hover:border-primary/40"
                  }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-primary-foreground font-display font-bold shadow-soft`}>
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialization}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-warning">
                        <Star className="h-3 w-3 fill-warning" /> {d.rating}
                      </span>
                      <span className="text-muted-foreground">{d.experience} exp</span>
                      <span className="font-semibold text-foreground">{d.fee}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking panel */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card h-fit lg:sticky lg:top-24 space-y-5">
          <h3 className="font-display font-bold text-lg">Schedule</h3>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Time slot</Label>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setTime(s)}
                  className={`text-sm py-2 rounded-xl border-2 font-medium transition-smooth ${time === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40 hover:bg-primary-soft"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full" onClick={book} disabled={!selectedDoc || bookMutation.isPending}>
            <CalendarCheck className="h-4 w-4" /> {bookMutation.isPending ? "Booking..." : "Book Appointment"}
          </Button>
        </div>
      </div>

      {/* Upcoming */}
      <div className="mt-10">
        <h3 className="font-display font-bold text-xl mb-4">Upcoming appointments</h3>
        {appts.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 border border-dashed border-border text-center text-muted-foreground">
            No appointments yet. Book one above.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {appts.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl p-5 border border-border shadow-card flex items-center gap-4 animate-fade-up">
                <div className="h-14 w-14 rounded-2xl bg-primary-soft flex items-center justify-center shrink-0">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold truncate">{a.doctor}</div>
                  <div className="text-xs text-muted-foreground">{a.spec}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" /> {a.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Online</span>
                  </div>
                </div>
                <Button asChild variant="soft" size="sm">
                  <Link to={`/appointments/${a.id}/call`}>Join</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
