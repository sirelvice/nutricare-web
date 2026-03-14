"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="mb-4 w-80 rounded-2xl bg-white shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">NutriCare Support</h4>
            <button onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            👋 Hi there! How can we help you today?
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-emerald-600 p-4 text-white shadow-lg hover:scale-105 transition"
      >
        <MessageCircle size={20} />
      </button>
    </div>
  );
}
