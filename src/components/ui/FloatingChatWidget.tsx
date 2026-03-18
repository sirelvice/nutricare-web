"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 🎯 Context-aware messages
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

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end transition-all duration-300">

      {/* Chat Panel */}
      {open && (
        <div className="mb-4 w-80 rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl border border-emerald-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50">
            <h4 className="font-semibold text-sm text-slate-900">
              NutriCare Support
            </h4>
            <button onClick={() => setOpen(false)}>
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 text-sm text-slate-600">
            👋 {getMessage()}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-300"
            />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full bg-emerald-600 p-4 text-white shadow-lg transition-transform duration-200 cursor-pointer ${open ? "scale-95" : "hover:scale-105"
          }`}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}