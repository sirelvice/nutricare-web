import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { AuthBrand } from "./AuthBrand";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-workspace px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-center sm:min-h-[calc(100vh-6rem)]">
        <AuthBrand />

        <section
          className="mt-8 rounded-[calc(var(--radius)+0.75rem)] border bg-card p-6 text-card-foreground shadow-sm sm:p-8"
          aria-labelledby="auth-heading"
        >
          <header className="mb-7 text-center">
            <h1
              id="auth-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {title}
            </h1>

            {description ? (
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </header>

          {children}
        </section>

        {footer ? (
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          <span>Your account is protected with secure authentication.</span>
        </div>
      </div>
    </main>
  );
}
