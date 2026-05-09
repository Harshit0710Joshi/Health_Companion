import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Bot, Sparkles, Mic, MicOff } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const Chatbot = () => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const clearMutation = useMutation({
    mutationFn: () => apiFetch('/chat', { method: 'DELETE' }), // Assuming backend supports DELETE /api/chat
    onSuccess: () => {
      queryClient.setQueryData(['chat'], []);
      toast.success("Conversation cleared");
    }
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['chat'],
    queryFn: () => apiFetch<Message[]>('/chat')
  });

  const chatMutation = useMutation({
    mutationFn: (text: string) => apiFetch('/chat', { method: 'POST', data: { text } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to send message"));
    }
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const send = (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    setInput("");
    
    // Optimistic update
    const tempId = Date.now();
    queryClient.setQueryData(['chat'], (old: Message[] = []) => [
      ...old,
      { id: tempId, role: "user", text }
    ]);

    chatMutation.mutate(text);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      send(transcript); // Automatically send after speaking
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ name: string }>('/me')
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)] bg-card rounded-2xl border border-border shadow-card overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-gradient-to-r from-primary-soft/50 to-accent-soft/50">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-card" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">MediCare AI</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Always here to help
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-semibold rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Are you sure you want to clear your chat history?")) {
                  clearMutation.mutate();
                }
              }}
              disabled={messages.length === 0 || clearMutation.isPending}
            >
              Clear Chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="h-9 w-9 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-br-sm shadow-soft"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="h-9 w-9 rounded-xl bg-gradient-accent flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                  {user?.name?.[0] || "U"}
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 animate-fade-up">
              <div className="h-9 w-9 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5">
                <span className="typing-dot h-2 w-2 rounded-full bg-primary inline-block" />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary inline-block" />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary inline-block" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {!isLoading && messages.length <= 1 && (
          <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2">
            {[
              "I've had a fever for 2 days",
              "My child has a sore throat",
              "What does this rash mean?",
            ].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary-soft hover:text-primary border border-border transition-smooth"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={onSubmit} className="border-t border-border p-4 flex items-center gap-3 bg-background">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe how you're feeling…"
            className="h-12 rounded-xl flex-1"
          />
          <Button 
            type="button" 
            variant={isListening ? "destructive" : "soft"} 
            size="icon" 
            className="h-12 w-12 rounded-xl shrink-0"
            onClick={toggleListening}
          >
            {isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button type="submit" variant="hero" size="icon" className="h-12 w-12 rounded-xl" disabled={!input.trim() || chatMutation.isPending}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Chatbot;
