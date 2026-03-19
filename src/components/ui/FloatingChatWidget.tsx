"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getMessage = () => {
    if (pathname.includes("/bmi")) {
      return "Need help understanding your BMI results?";
    }
    if (pathname.includes("/dashboard")) {
      return "Want help navigating your health dashboard?";
    }
    if (pathname.includes("/reports")) {
      return "Need help with reports or insights?";
    }
    return "Hi there! How can we help you today?";
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">

      {/* Chat Panel */}
      <div
        className={`mb-4 w-80 rounded-2xl bg-white/95 backdrop-blur shadow-2xl border border-emerald-100 overflow-hidden transform transition-all duration-300 ease-out ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50">
          <h4 className="font-semibold text-sm text-slate-900">
            NutriCare Support
          </h4>
          <button onClick={() => setOpen(false)}>
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-2 max-h-48 overflow-y-auto text-sm">
          <div className="text-slate-600">👋 {getMessage()}</div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white self-end ml-auto max-w-[75%]"
                  : "bg-gray-100 text-slate-700 max-w-[75%]"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="text-xs text-slate-400">Typing...</div>
          )}

          {/* Auto scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-300"
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 text-white px-3 rounded-lg text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full bg-emerald-600 p-4 text-white shadow-lg transition-transform duration-200 cursor-pointer ${
          open ? "scale-95 rotate-90" : "hover:scale-105"
        }`}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}