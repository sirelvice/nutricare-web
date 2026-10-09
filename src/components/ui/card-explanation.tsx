import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CardExplanation({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`group rounded-xl border bg-card ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-3 border-t px-4 py-4 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
