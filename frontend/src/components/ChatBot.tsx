import { useState, useRef, useEffect } from "react";
import { apiClient } from "@/api/client";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function ChatBot({ crop = "", lang = "hi" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text:
        lang === "hi"
          ? "नमस्ते! मैं FasalSeva का AI सहायक हूँ। अपनी फसल के बारे में कुछ भी पूछें।"
          : "Hello! I am FasalSeva's AI assistant. Ask me anything about your crop.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await apiClient.post("/chat", {
        message: userMsg,
        language: lang,
        crop: crop,
      });
      const botText =
        res.data?.response ||
        res.data?.output ||
        res.data?.Answer ||
        res.data?.answer ||
        res.data?.text ||
        res.data?.message ||
        "Koi jawab nahi mila.";
      setMessages((m) => [...m, { role: "bot", text: botText }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            lang === "hi"
              ? "Kshama karein, abhi seva uplabdh nahi hai."
              : "Sorry, service unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl"
        style={{ background: "var(--leaf, #22c55e)", color: "white" }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: "420px", background: "white" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: "var(--leaf, #22c55e)" }}
          >
            <span className="text-xl">🌾</span>
            <div>
              <p className="text-white font-semibold text-sm">FasalSeva Assistant</p>
              <p className="text-white/60 text-xs">
                {lang === "hi" ? "हमेशा यहाँ हूँ" : "Always here to help"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: "var(--mist, #f8fafc)" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="px-4 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed"
                  style={{
                    background: m.role === "user" ? "var(--leaf, #22c55e)" : "white",
                    color: m.role === "user" ? "white" : "var(--soil, #333)",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-white text-sm text-soil/50">
                  ⏳ {lang === "hi" ? "सोच रहा हूँ..." : "Thinking..."}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 flex gap-2 border-t border-black/5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={lang === "hi" ? "कुछ भी पूछें..." : "Ask anything..."}
              className="flex-1 px-4 py-2 rounded-full text-sm border border-black/10 focus:outline-none"
              style={{ background: "var(--cream, #fefce8)" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40"
              style={{ background: "var(--leaf, #22c55e)" }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
