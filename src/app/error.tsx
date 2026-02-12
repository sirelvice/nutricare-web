"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-slate-600 text-sm max-w-md">
        {error.message}
      </p>
      <Button onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
