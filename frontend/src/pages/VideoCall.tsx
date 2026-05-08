import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, ShieldCheck, Video, FileText, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { API_ORIGIN, apiFetch, getAuthToken } from "@/lib/api";
import { toast } from "sonner";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

interface AppointmentDetails {
  id: number;
  doctor: string;
  patient: string;
  spec: string;
  date: string;
  time: string;
  status: string;
  roomId: string;
}

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isDoctorRoute = location.pathname.startsWith("/doctor");
  const backPath = isDoctorRoute ? "/doctor/appointments" : "/appointments";
  const appointmentId = Number(id);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [callStarted, setCallStarted] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [notes, setNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [status, setStatus] = useState("Ready to start secure consultation");
  const [error, setError] = useState("");

  const { data: appointment, isLoading } = useQuery<AppointmentDetails>({
    queryKey: ["appointment", appointmentId],
    queryFn: () => apiFetch<AppointmentDetails>(`/appointments/${appointmentId}`),
    enabled: Number.isInteger(appointmentId),
  });

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  const endCall = useCallback(() => {
    const socket = socketRef.current;
    if (socket) socket.emit("leave-call", { roomId: `room-${appointmentId}` });
    socket?.disconnect();
    socketRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    stopLocalStream();
    setCallStarted(false);
    setRemoteJoined(false);
    setStatus("Call ended");
  }, [appointmentId, stopLocalStream]);

  const createPeerConnection = useCallback((socket: Socket, roomId: string) => {
    const peer = new RTCPeerConnection({ iceServers });

    localStreamRef.current?.getTracks().forEach((track) => {
      if (localStreamRef.current) peer.addTrack(track, localStreamRef.current);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        setRemoteJoined(true);
        setStatus("Consultation in progress");
      }
    };

    peerRef.current = peer;
    return peer;
  }, []);

  const startCall = async () => {
    if (!appointmentId) return;
    setStatus("Accessing media devices...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const socket = io(API_ORIGIN, {
        auth: { token: getAuthToken() },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      const roomId = `room-${appointmentId}`;

      socket.on("connect", () => {
        socket.emit("join-call", { appointmentId });
        setCallStarted(true);
        setStatus("Waiting for participant...");
      });

      socket.on("participant-joined", async () => {
        const peer = peerRef.current ?? createPeerConnection(socket, roomId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("webrtc-offer", { roomId, offer });
        setStatus("Connecting...");
      });

      socket.on("webrtc-offer", async ({ offer }) => {
        const peer = peerRef.current ?? createPeerConnection(socket, roomId);
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc-answer", { roomId, answer });
      });

      socket.on("webrtc-answer", async ({ answer }) => {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on("webrtc-ice-candidate", async ({ candidate }) => {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on("participant-left", () => {
        setRemoteJoined(false);
        setStatus("Participant left");
      });

    } catch (err) {
      setError("Please allow camera and microphone access to start the call.");
    }
  };

  const completeConsultation = async () => {
    if (!id || completing) return;
    setCompleting(true);
    try {
      await apiFetch(`/appointments/${id}/complete`, {
        method: "POST",
        data: { notes }
      });
      toast.success("Consultation records saved");
      endCall();
      navigate(backPath);
    } catch (err) {
      toast.error("Failed to save records");
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    return () => endCall();
  }, [endCall]);

  return (
    <DashboardLayout title="Live Consultation" subtitle={appointment ? `Secure Session: ${appointment.id}` : "Connecting..."}>
      <div className="grid xl:grid-cols-[1fr_380px] gap-6 min-h-[calc(100vh-180px)]">
        <section className="relative flex flex-col gap-4 min-h-[600px]">
          {error && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-50 rounded-2xl shadow-lg">
              <AlertTitle>Hardware Access Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Video Container (The "One Screen" Layout) */}
          <div className="relative flex-1 rounded-[40px] overflow-hidden bg-slate-950 border border-border shadow-elevated group">
             {/* Remote Video (Fullscreen) */}
             <video 
                ref={remoteVideoRef} 
                className={`h-full w-full object-cover transition-opacity duration-700 ${remoteJoined ? 'opacity-100' : 'opacity-0'}`} 
                autoPlay 
                playsInline 
             />

             {/* Placeholder when waiting */}
             {!remoteJoined && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                  <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                     <Video className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-display font-medium">{callStarted ? "Waiting for participant to join..." : "Ready to begin session"}</h3>
                  <p className="text-sm mt-2">Your connection is fully encrypted.</p>
               </div>
             )}

             {/* Local Video (Floating Picture-in-Picture) */}
             <div className="absolute bottom-6 right-6 w-40 sm:w-64 aspect-video rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-20 group-hover:scale-105 transition-transform duration-300">
                <video ref={localVideoRef} className="h-full w-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                {!callStarted && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <Camera className="h-6 w-6 text-white/20" />
                   </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-tighter">
                   You
                </div>
             </div>

             {/* Floating Controls Overlay */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl z-30 transition-all duration-300 group-hover:translate-y-0 translate-y-4 opacity-0 group-hover:opacity-100">
                {!callStarted ? (
                   <Button variant="hero" size="lg" className="rounded-full px-10" onClick={startCall} disabled={isLoading || !appointment}>
                      <Video className="mr-2 h-5 w-5" /> Start Consultation
                   </Button>
                ) : (
                   <>
                     <Button variant={micMuted ? "destructive" : "soft"} size="icon" className="h-14 w-14 rounded-full" onClick={() => {
                       localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = micMuted);
                       setMicMuted(!micMuted);
                     }}>
                       {micMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                     </Button>
                     <Button variant={cameraOff ? "destructive" : "soft"} size="icon" className="h-14 w-14 rounded-full" onClick={() => {
                       localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = cameraOff);
                       setCameraOff(!cameraOff);
                     }}>
                       {cameraOff ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                     </Button>
                     
                     <div className="w-px h-8 bg-white/10 mx-2" />

                     {isDoctorRoute ? (
                       <Button variant="hero" size="lg" className="px-8 rounded-full h-14" onClick={completeConsultation} disabled={completing}>
                          {completing ? "Finalizing..." : "End & Complete"}
                       </Button>
                     ) : (
                       <Button variant="destructive" size="lg" className="px-8 rounded-full h-14" onClick={() => navigate(backPath)}>
                          <PhoneOff className="mr-2 h-5 w-5" /> End Call
                       </Button>
                     )}
                   </>
                )}
             </div>

             {/* Status Badge */}
             <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-3 z-30">
                <div className={`h-2 w-2 rounded-full ${remoteJoined ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{status}</span>
             </div>
          </div>
        </section>

        <aside className="space-y-6">
          {/* Clinical Notes Card */}
          {isDoctorRoute && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary">
                 <FileText className="h-5 w-5" />
                 <h3 className="font-display font-bold text-lg">Clinical Records</h3>
              </div>
              <textarea 
                  className="w-full h-[400px] p-4 rounded-2xl bg-slate-50 border border-border text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
                  placeholder="Record symptoms, diagnosis, and plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                 <ShieldCheck className="h-3 w-3" />
                 Encrypted and private to the patient's record.
              </p>
            </div>
          )}

          {/* Context Card */}
          {appointment && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Meeting Context</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary font-bold">
                       <Activity className="h-5 w-5" />
                    </div>
                    <div>
                       <div className="text-sm font-bold truncate max-w-[180px]">{isDoctorRoute ? appointment.patient : appointment.doctor}</div>
                       <div className="text-xs text-muted-foreground">{appointment.spec}</div>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground font-medium flex items-center justify-between">
                       <span>Scheduled Time</span>
                       <span className="text-primary font-bold">{appointment.time}</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          <Button asChild variant="outline" className="w-full rounded-2xl py-6 border-border text-muted-foreground hover:bg-slate-50">
            <Link to={backPath}>Return to Dashboard</Link>
          </Button>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default VideoCall;
