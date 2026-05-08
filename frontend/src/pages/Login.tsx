import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail, Stethoscope, User } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { apiFetch, getErrorMessage, setAuthSession } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");

    try {
      const endpoint = role === "patient" ? "/auth/login" : "/doctor/auth/login";
      const response = await apiFetch<{ token: string }>(endpoint, {
        method: "POST",
        data: { email, password },
      });
      
      setAuthSession(response.token, role);
      toast.success(role === "doctor" ? "Doctor portal unlocked" : "Welcome back!");
      navigate(role === "doctor" ? "/doctor/appointments" : "/dashboard");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to login");

      if (message.toLowerCase().includes("invalid credentials")) {
        setAuthError(role === "doctor" 
          ? "These doctor credentials do not match our records." 
          : "The email or password you entered is incorrect.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={role === "patient" ? "Welcome back" : "Doctor Portal"} 
      subtitle={role === "patient" ? "Sign in to continue your care journey." : "Access assigned consultations and join patient calls."}
    >
      <Tabs defaultValue="patient" onValueChange={(v) => setRole(v as "patient" | "doctor")} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-muted/50">
          <TabsTrigger value="patient" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-4 w-4 mr-2" /> Patient
          </TabsTrigger>
          <TabsTrigger value="doctor" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Stethoscope className="h-4 w-4 mr-2" /> Doctor
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSubmit} className="space-y-5">
        {authError && (
          <Alert variant="destructive" className="rounded-xl bg-destructive/5" aria-live="polite">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to sign in</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{role === "doctor" ? "Doctor email" : "Email address"}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder={role === "doctor" ? "doctor@medicare.local" : "you@example.com"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError("");
              }}
              className="pl-10 h-12 rounded-xl transition-all"
              aria-invalid={Boolean(authError)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot?</a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError("");
              }}
              className="pl-10 h-12 rounded-xl transition-all"
              aria-invalid={Boolean(authError)}
            />
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>

        {role === "patient" && (
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default Login;
