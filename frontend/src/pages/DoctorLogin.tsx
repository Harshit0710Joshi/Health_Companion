import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getErrorMessage, setAuthSession } from "@/lib/api";
import { toast } from "sonner";

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setAuthError("");

    try {
      const response = await apiFetch<{ token: string }>("/doctor/auth/login", {
        method: "POST",
        data: { email, password },
      });
      setAuthSession(response.token, "doctor");
      toast.success("Doctor portal unlocked");
      navigate("/doctor/appointments");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to sign in");
      if (message.toLowerCase().includes("invalid credentials")) {
        setAuthError("These doctor credentials do not match our records.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Doctor sign in" subtitle="Access assigned consultations and join patient calls.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {authError && (
          <Alert variant="destructive" className="rounded-xl bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to sign in</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="doctor-email">Doctor email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="doctor-email"
              type="email"
              required
              placeholder="rajesh@medicare.local"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setAuthError("");
              }}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctor-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="doctor-password"
              type="password"
              required
              placeholder="Enter doctor password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setAuthError("");
              }}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : <>Open doctor portal <ArrowRight className="h-4 w-4" /></>}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Patient account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in here</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default DoctorLogin;
