import { cva } from "class-variance-authority";
import { CircleCheck, CircleHelp, Minus, Compass } from "lucide-react";

type ProgressState = "ON_TRACK" | "BEHIND_OPPOSITE" | "PLATEAU" | "INSUFFICIENT_DATA";

const badge = cva("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", {
  variants: {
    state: {
      ON_TRACK: "bg-primary/10 text-primary",
      BEHIND_OPPOSITE: "bg-accent/20 text-foreground",
      PLATEAU: "bg-muted text-foreground",
      INSUFFICIENT_DATA: "bg-muted text-muted-foreground",
    },
  },
});

const states = {
  ON_TRACK: { label: "On track", icon: CircleCheck },
  BEHIND_OPPOSITE: { label: "Worth reviewing", icon: Compass },
  PLATEAU: { label: "Holding steady", icon: Minus },
  INSUFFICIENT_DATA: { label: "Building your baseline", icon: CircleHelp },
} satisfies Record<ProgressState, { label: string; icon: typeof CircleCheck }>;

export function ProgressStatus({ state }: { state: ProgressState }) {
  const { label, icon: Icon } = states[state] ?? { label: "Status unavailable", icon: CircleHelp };
  return (
    <span className={badge({ state })}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}
