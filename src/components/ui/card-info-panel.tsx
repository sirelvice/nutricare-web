"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

export function CardInfoPanel({ title, titleId, front, information }: {
  title: string;
  titleId: string;
  front: ReactNode;
  information: ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const control = useRef<HTMLButtonElement>(null);
  const id = useId();
  return <div className="space-y-3" onKeyDown={(event) => {
    if (event.key === "Escape" && showInfo) {
      event.preventDefault();
      setShowInfo(false);
      control.current?.focus();
    }
  }}>
    <div className="flex min-h-11 items-center justify-between gap-3">
      <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
      <button ref={control} type="button" aria-label={showInfo ? `Back to ${title.toLowerCase()}` : `Show information about ${title.toLowerCase()}`}
        aria-expanded={showInfo} aria-controls={`${id}-information`} onClick={() => setShowInfo((current) => !current)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {showInfo ? <X aria-hidden="true" className="size-4" /> : <Info aria-hidden="true" className="size-4" />}
      </button>
    </div>
    <div className="h-[24rem] min-w-0 sm:h-[22rem]">
      {/* Keep the chart mounted to preserve its selected period. Hidden removes
          inactive content from layout, accessibility and keyboard navigation. */}
      <div hidden={showInfo} className="h-full min-w-0 overflow-auto">{front}</div>
      <div id={`${id}-information`} hidden={!showInfo} role="region" aria-label={`About ${title.toLowerCase()}`}
        tabIndex={showInfo ? 0 : -1} className="h-full min-w-0 space-y-4 overflow-auto rounded-xl border bg-muted/30 p-4 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {information}
      </div>
    </div>
  </div>;
}
