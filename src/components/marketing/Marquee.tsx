"use client"

import { useState } from "react"

const items = [
  "BMI Tracking",
  "Weight Analytics",
  "Nutrition Insights",
  "Smart Reports",
  "AI Recommendations",
  "Progress Monitoring",
  "Health Dashboard",
]

export function Marquee() {
  const [paused, setPaused] = useState(false)

  return (
    <div
      className="relative w-full overflow-hidden border-t border-b border-white/10 bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`flex whitespace-nowrap py-4 text-sm tracking-wide uppercase text-white/70 ${
          paused ? "" : "animate-marquee"
        }`}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}