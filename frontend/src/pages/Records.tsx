import { FormEvent, useState } from "react";
import { FileHeart, Plus, Calendar, FileText, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getErrorMessage } from "@/lib/api";

interface HealthRecord { id: string; title: string; description: string; date: string; type: string; }
type NewHealthRecord = Omit<HealthRecord, "id">;

const Records = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewHealthRecord>({ title: "", description: "", date: new Date().toISOString().split("T")[0], type: "Consultation" });

  const { data: records = [] } = useQuery<HealthRecord[]>({
    queryKey: ['records'],
    queryFn: () => apiFetch<HealthRecord[]>('/records')
  });

  const addMutation = useMutation({
    mutationFn: (newRecord: NewHealthRecord) => apiFetch<HealthRecord>('/records', { method: 'POST', data: newRecord }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setForm({ title: "", description: "", date: new Date().toISOString().split("T")[0], type: "Consultation" });
      setOpen(false);
      toast.success("Record added");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to add record"));
    }
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addMutation.mutate(form);
  };

  return (
    <DashboardLayout title="Health Records" subtitle="Your complete medical history, secure and accessible.">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileHeart className="h-4 w-4" /> {records.length} records
        </div>
        <Button variant="hero" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.length > 0 ? (
          records.map((r, i) => (
            <div
              key={r.id}
              className="bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-bounce animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary-soft flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent-soft text-accent-foreground">
                  {r.type}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{r.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(r.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center animate-fade-up">
            <div className="h-24 w-24 rounded-full bg-primary-soft flex items-center justify-center mb-6">
              <FileHeart className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">No records found</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Keep all your medical reports, vaccinations, and consultations in one secure place.
            </p>
            <Button variant="soft" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Record
            </Button>
          </div>
        )}
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fade-up" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl shadow-elevated border border-border w-full max-w-lg p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-2xl">New Health Record</h3>
                <p className="text-sm text-muted-foreground mt-1">Add a consultation, report or vaccination.</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-xl hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Blood test results" className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option>Consultation</option>
                    <option>Lab Report</option>
                    <option>Vaccination</option>
                    <option>Prescription</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add notes, findings or recommendations…" className="rounded-xl resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Records;
