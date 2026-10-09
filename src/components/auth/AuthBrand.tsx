import Image from "next/image";
import Link from "next/link";

export function AuthBrand() {
  return (
    <div className="text-center">
      <Link
        href="/"
        className="inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        aria-label="Go to NutriCare home"
      >
        <span className="flex items-center justify-center rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/5">
          <Image
            src="/brand/nutricare-design-no-bg-low.png"
            alt="NutriCare"
            width={226}
            height={74}
            priority
            className="h-auto w-[180px] sm:w-[200px]"
          />
        </span>
      </Link>

      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
        Personal nutrition guidance built around your goals and progress.
      </p>
    </div>
  );
}
