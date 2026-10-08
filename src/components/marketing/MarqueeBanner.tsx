"use client";

import { useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

const highlights = ["Personal nutrition targets", "Weight tracking & history", "Explainable progress guidance", "Branded personal reports", "Built around your goals"];

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(motionQuery).matches;
}

export function MarqueeBanner() {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );
  return (
    <section aria-label="Product highlights" className="relative mt-12 border-y border-emerald-100 bg-emerald-50/60">
      <div className="marquee-container overflow-hidden py-1 pr-14">
        <div className="marquee-track marketing-marquee-track" style={{
          animationName: reducedMotion ? "none" : undefined,
          animationPlayState: paused ? "paused" : undefined,
          width: reducedMotion ? "auto" : undefined,
        }}>
          {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1 ? true : undefined} style={{
            display: reducedMotion && copy === 1 ? "none" : undefined,
            flexWrap: reducedMotion ? "wrap" : undefined,
            whiteSpace: reducedMotion ? "normal" : undefined,
            gap: reducedMotion ? "1rem" : undefined,
          }} className={`marquee-content items-center whitespace-nowrap py-4 text-sm font-medium tracking-wide text-emerald-900 ${copy === 1 ? "marketing-marquee-copy" : ""}`}>
            {highlights.map((text) => <span key={text} className="mx-7 inline-flex items-center gap-7"><span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />{text}</span>)}
          </div>)}
        </div>
      </div>
      {!reducedMotion && <button type="button" aria-label={paused ? "Resume animation" : "Pause animation"} aria-pressed={paused}
        onClick={() => setPaused((value) => !value)} className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {paused ? <Play aria-hidden="true" size={15} /> : <Pause aria-hidden="true" size={15} />}
      </button>}
    </section>
  );
}
