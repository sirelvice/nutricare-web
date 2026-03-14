"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"

export default function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-xl hover:scale-105 transition"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-white text-black rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-black text-white p-4 font-medium">
            DailyCare Support
          </div>

          <div className="p-4 text-sm text-neutral-600">
            👋 Hey there!  
            How can we help you today?
          </div>

          <div className="border-t p-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </>
  )
}