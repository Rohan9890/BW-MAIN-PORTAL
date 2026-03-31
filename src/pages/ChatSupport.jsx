import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import "./ChatSupport.css";

// ─── Mock reply pool ───────────────────────────────────────────────────────────
const MOCK_REPLIES = [
  "Thanks for reaching out! We'll look into that for you.",
  "Could you provide a bit more detail so we can assist better?",
  "I understand — let me check that with our team.",
  "That's a great question. Here's what I can tell you...",
  "We've noted your concern and will follow up shortly.",
  "Our technical team is looking into this right now.",
  "You can also raise a ticket for faster tracking — just use the Raise Ticket option.",
];

// TODO: connect to backend API
const sendMessage = async (messageText) => {
  // Replace with: const res = await fetch("/api/support/chat", { method: "POST", body: JSON.stringify({ message: messageText }) });
  // return await res.json();
  return { ok: true, echoed: messageText };
};

// ─── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`cs-bubble-row ${isUser ? "cs-bubble-row--user" : ""}`}>
      {!isUser && (
        <div className="cs-avatar-support" aria-hidden="true">
          S
        </div>
      )}
      <div
        className={`cs-bubble ${isUser ? "cs-bubble--user" : "cs-bubble--support"}`}
      >
        <p className="cs-bubble-text">{msg.text}</p>
        <span className="cs-bubble-time">{msg.time}</span>
      </div>
      {isUser && (
        <div className="cs-avatar-user" aria-hidden="true">
          U
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ChatSupport() {
  const navigate = useNavigate();
  const { brand, defaultBrand } = useBrand();
  const companyName = brand?.name || defaultBrand?.name || "Bold and Wise";
  const logoUrl = brand?.logoUrl || defaultBrand?.logoUrl || "/logo.png";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "m-initial",
      sender: "support",
      text: "👋 Hi there! How can we help you today?",
      time: formatTime(new Date()),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const replyTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: `m-${Date.now()}`,
      sender: "user",
      text,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Call placeholder (backend-ready)
    await sendMessage(text);

    const delay = 1000 + Math.random() * 1000;
    replyTimerRef.current = setTimeout(() => {
      const replyText =
        MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      const supportMsg = {
        id: `m-${Date.now() + 1}`,
        sender: "support",
        text: replyText,
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, supportMsg]);
      setIsTyping(false);
    }, delay);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="cs-page">
      {/* ── Company Header ── */}
      <header className="cs-header">
        <div className="cs-header-brand">
          <img src={logoUrl} alt={companyName} className="cs-header-logo" />
          <span className="cs-header-name">{companyName}</span>
        </div>
        <button className="cs-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </header>

      {/* ── Page Content ── */}
      <div className="cs-content">
        <div className="cs-card">
          {/* Card Header */}
          <div className="cs-card-header">
            <div className="cs-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="cs-card-title">Support Chat</h1>
              <p className="cs-card-subtitle">
                Our team typically replies within a few minutes
              </p>
            </div>
            <span className="cs-status-badge">
              <span className="cs-status-dot" />
              Online
            </span>
          </div>

          {/* Messages area */}
          <div className="cs-messages">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && (
              <div className="cs-bubble-row">
                <div className="cs-avatar-support" aria-hidden="true">
                  S
                </div>
                <div className="cs-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="cs-input-area">
            <input
              ref={inputRef}
              className="cs-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              disabled={isTyping}
              maxLength={1000}
            />
            <button
              className="cs-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </button>
          </div>

          {/* Footer hint */}
          <p className="cs-hint">
            Need to file a formal issue?{" "}
            <button
              className="cs-link-btn"
              onClick={() => navigate("/support/ticket")}
            >
              Raise a Ticket
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
