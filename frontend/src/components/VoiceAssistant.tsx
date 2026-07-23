import { useState } from "react";
import { Mic, Send, X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { voiceService } from "@/services/voiceService";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/config/languages";

interface Msg {
  role: "user" | "assistant";
  text: string;
}
const SUGGESTIONS = [
  "Tamatar kitne din store kar sakte hain?",
  "Aaj ka mandi bhav?",
  "Nearest cold storage?",
];

export function VoiceAssistant() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: t(
        "chatbot.greeting",
        "Namaste! Ask me about shelf life, mandi prices, storage or weather.",
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    const reply = await voiceService.askAssistant(q, i18n.language);
    setThinking(false);
    setMsgs((m) => [...m, { role: "assistant", text: reply }]);
  }

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Voice assistant"
        className={cn(
          "fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full text-primary-foreground shadow-glow transition-transform hover:scale-105",
          "gradient-primary",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed bottom-24 right-6 z-40 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card-hover"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {t("chatbot.title", "FasalSeva Assistant")}
                  </p>
                  <p className="text-xs text-muted-foreground">{currentLang.native}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label={t("chatbot.close", "Close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {t("chatbot.thinking", "Thinking…")}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border/60 p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant={listening ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 w-9",
                    listening && "gradient-primary text-primary-foreground animate-pulse",
                  )}
                  onClick={() => setListening((l) => !l)}
                  aria-label="Mic"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chatbot.placeholder", "Ask anything…")}
                  className="h-9"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 gradient-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
