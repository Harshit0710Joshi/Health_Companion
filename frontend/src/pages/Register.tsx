import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { apiFetch, getErrorMessage, setAuthSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch<{ token: string }>('/auth/register', {
        method: 'POST',
        data: { name, email, password }
      });
      setAuthSession(response.token, "patient");
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/dashboard");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Free to start. Speak to a doctor today.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="name" required placeholder="Anita Sharma" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" required minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl" />
          </div>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          By signing up you agree to our Terms & Privacy Policy.
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
