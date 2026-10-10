import { useEffect, useRef, useState } from "react";
import { Send, Trash2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import Markdown from "./Markdown";
import { sendChatMessage, clearChatHistory } from "../../services/nutritionService";

const EXAMPLE_PROMPTS = [
  "Suggest a balanced vegetarian breakfast.",
  "How can I include more protein in my meals?",
  "Explain the nutrients in poha.",
  "Suggest affordable, healthy Indian meals.",
  "What should I eat for breakfast to lose weight?",
  "Give me a high-protein Indian meal plan.",
  "Healthy snacks for kids under 10?",
  "How much water should I drink daily?",
];

const GREETING = {
  role: "assistant",
  content:
    "Hi! I'm **NutriBot**, your AI Nutrition Expert powered by IBM Watsonx.ai Granite. 🌿\n\nAsk me anything about healthy eating, meal planning, calorie counts, or Indian food. What can I help you with today?",
};

function NutritionChat() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [retryMessage, setRetryMessage] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const toHistory = (list) =>
    list
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.content }));

  const send = async (text, historyOverride) => {
    const message = (text ?? input).trim();
    if (!message || isTyping) return;

    setError("");
    setRetryMessage(null);
    setInput("");
    const history = historyOverride ?? toHistory(messages);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(message, history);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setRetryMessage(message);
      // The user message stays visible so Retry can resend it.
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (!retryMessage) return;
    const msg = retryMessage;
    // Drop the failed user message so it isn't duplicated, then resend
    // with history rebuilt from the remaining messages.
    const last = messages[messages.length - 1];
    const isFailedTail = last && last.role === "user" && last.content === msg;
    const remaining = isFailedTail ? messages.slice(0, -1) : messages;
    if (isFailedTail) setMessages(remaining);
    send(msg, toHistory(remaining));
  };

  const handleClear = async () => {
    setMessages([GREETING]);
    setError("");
    setRetryMessage(null);
    try {
      await clearChatHistory();
    } catch {
      // Clearing local state is enough; server session is best-effort.
    }
    toast.success("Chat cleared");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="space-y-4">
      {/* Example prompts */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt)}
            disabled={isTyping}
            className="nb-badge cursor-pointer rounded-full border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3 py-1.5 text-xs font-medium text-[var(--nb-text-muted)] transition hover:border-[var(--nb-primary)] hover:text-[var(--nb-primary)] disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="nb-card overflow-hidden rounded-xl">
        <div
          ref={scrollRef}
          className="nb-chat-scroll space-y-4 p-4 sm:p-5"
          aria-live="polite"
        >
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: msg.role === "user" ? "var(--nb-primary)" : "var(--nb-surface-2)",
                  color: msg.role === "user" ? "var(--nb-on-primary)" : "var(--nb-primary)",
                  border: "1px solid var(--nb-border)",
                }}
                aria-hidden="true"
              >
                {msg.role === "user" ? "You" : "N"}
              </span>
              <div
                className={`nb-bubble max-w-[85%] ${
                  msg.role === "user" ? "nb-bubble-user" : "nb-bubble-ai"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <Markdown content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <span
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: "var(--nb-surface-2)",
                  color: "var(--nb-primary)",
                  border: "1px solid var(--nb-border)",
                }}
                aria-hidden="true"
              >
                N
              </span>
              <div className="nb-bubble nb-bubble-ai">
                <span className="nb-typing" role="status" aria-label="NutriBot is typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error + retry */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--nb-border)] px-4 py-3">
            <p className="nb-alert-error flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </p>
            {retryMessage && (
              <button
                type="button"
                onClick={handleRetry}
                className="nb-btn nb-btn-outline cursor-pointer text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 border-t border-[var(--nb-border)] p-3">
          <textarea
            ref={inputRef}
            className="nb-input min-h-[2.75rem] flex-1 resize-none"
            rows={2}
            value={input}
            placeholder="Ask about nutrition, meals, diet plans..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message NutriBot"
          />
          <button
            type="button"
            onClick={handleClear}
            className="nb-btn nb-btn-ghost cursor-pointer"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => send()}
            disabled={isTyping || !input.trim()}
            className="nb-btn nb-btn-primary cursor-pointer"
          >
            {isTyping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
      </div>

      <p className="nb-soft text-xs">
        NutriBot provides general nutrition education only — not medical advice.
        For pregnancy, eating disorders, serious medical conditions, or medically
        prescribed diets, consult an appropriately qualified healthcare professional.
      </p>
    </div>
  );
}

export default NutritionChat;
