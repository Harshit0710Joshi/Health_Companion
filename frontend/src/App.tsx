import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Chatbot from "./pages/Chatbot.tsx";
import Appointments from "./pages/Appointments.tsx";
import Records from "./pages/Records.tsx";
import VideoCall from "./pages/VideoCall.tsx";
import DoctorLogin from "./pages/DoctorLogin.tsx";
import DoctorAppointments from "./pages/DoctorAppointments.tsx";
import { getAuthRole, getAuthToken } from "./lib/api.ts";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role = "patient" }: { children: JSX.Element; role?: "patient" | "doctor" }) => {
  if (!getAuthToken()) return <Navigate to={role === "doctor" ? "/doctor/login" : "/login"} replace />;
  if (getAuthRole() !== role) return <Navigate to={role === "doctor" ? "/doctor/login" : "/login"} replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/appointments/:id/call" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute role="doctor"><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor/appointments/:id/call" element={<ProtectedRoute role="doctor"><VideoCall /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
