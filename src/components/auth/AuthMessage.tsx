import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

type AuthMessageProps = {
  type: "error" | "success" | "info";
  children: ReactNode;
};

export function AuthMessage({ type, children }: AuthMessageProps) {
  const styles = {
    error:
      "border-destructive/20 bg-destructive/5 text-destructive",
    success:
      "border-primary/20 bg-primary/5 text-foreground",
    info:
      "border-border bg-muted/60 text-foreground",
  };

  const Icon =
    type === "error"
      ? CircleAlert
      : type === "success"
        ? CircleCheck
        : Info;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${styles[type]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
