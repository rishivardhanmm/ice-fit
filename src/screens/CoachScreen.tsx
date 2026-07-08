import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { MobileHeader } from "../components/MobileHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { post } from "../services/api";

interface Message {
  id: string;
  role: "coach" | "user";
  text: string;
}

const prompts = [
  "What should I aim for today?",
  "I missed yesterday, what now?",
  "Make today shorter",
  "This exercise hurts"
];

export function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Tell me what changed today and I will keep the plan useful, safe and realistic."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const text = (prompt ?? input).trim();
    if (!text) return;

    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);

    try {
      const response = await post<{ text: string }>("/api/ai/chat", { message: text });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "coach", text: response.text }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="coach-screen">
      <MobileHeader eyebrow="AI coach" title="Ask the coach" meta="Plan-aware guidance from your local backend" />

      <div className="prompt-row">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => sendMessage(undefined, prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {messages.map((message) => (
          <article className={`coach-message ${message.role}`} key={message.id}>
            <div className="message-avatar">{message.role === "coach" ? <Bot size={17} /> : <UserRound size={17} />}</div>
            <p>{message.text}</p>
          </article>
        ))}
        {loading ? (
          <article className="coach-message coach">
            <div className="message-avatar">
              <Sparkles size={17} />
            </div>
            <p>Thinking through the plan...</p>
          </article>
        ) : null}
      </div>

      <form className="coach-composer" onSubmit={sendMessage}>
        <input
          value={input}
          placeholder="Ask about today's workout"
          onChange={(event) => setInput(event.target.value)}
        />
        <PrimaryButton icon={<Send size={17} />} disabled={loading || !input.trim()}>
          Send
        </PrimaryButton>
      </form>
    </section>
  );
}

