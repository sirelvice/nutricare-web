"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Ruler,
  Scale,
  Sparkles,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: typeof LayoutDashboard;
  match?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const SIDEBAR_STORAGE_KEY = "nutricare-sidebar-collapsed";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Your health at a glance",
        icon: LayoutDashboard,
      },
      {
        href: "/profile",
        label: "Profile & goal",
        description: "Personal details and target",
        icon: CircleUserRound,
      },
    ],
  },
  {
    label: "Your journey",
    items: [
      {
        href: "/tools/tracking/weight",
        label: "Track progress",
        description: "Weight and progress",
        icon: Scale,
      },
      {
        href: "/tools/recommendations",
        label: "Recommendations",
        description: "Personal guidance",
        icon: Sparkles,
      },
      {
        href: "/history",
        label: "History",
        description: "See how things changed",
        icon: History,
      },
    ],
  },
  {
    label: "Assess",
    items: [
      {
        href: "/tools/bmi",
        label: "Health tools",
        description: "BMI, calories and macros",
        icon: Ruler,
        match: ["/tools/bmi", "/tools/calories", "/tools/macros"],
      },
    ],
  },
  {
    label: "Your records",
    items: [
      {
        href: "/report",
        label: "Personal report",
        description: "Review and download",
        icon: FileText,
      },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

function isItemActive(pathname: string, item: NavItem) {
  const paths = item.match ?? [item.href];

  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function Navigation({
  pathname,
  onNavigate,
  branded = false,
  collapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  branded?: boolean;
  collapsed?: boolean;
}) {
  return (
    <nav
      aria-label="NutriCare workspace"
      className={collapsed ? "space-y-4" : "space-y-6"}
    >
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p
              className={[
                "mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em]",
                branded
                  ? "text-primary-foreground/55"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              {group.label}
            </p>
          )}

          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isItemActive(pathname, item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={[
                    "group flex min-h-11 items-center rounded-xl transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    collapsed
                      ? "justify-center px-2 py-2"
                      : "gap-3 px-3 py-2.5",
                    branded
                      ? active
                        ? "bg-primary-foreground/12 text-primary-foreground shadow-sm focus-visible:ring-accent"
                        : "text-primary-foreground/75 hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent"
                      : active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground focus-visible:ring-ring"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-ring",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                      branded
                        ? active
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "bg-primary-foreground/10 text-primary-foreground/80 group-hover:bg-accent-foreground/10 group-hover:text-accent-foreground"
                        : active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-background text-muted-foreground ring-1 ring-border group-hover:text-primary",
                    ].join(" ")}
                  >
                    <Icon className="size-[1.05rem]" aria-hidden="true" />
                  </span>

                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {item.label}
                        </span>
                        <span
                          className={[
                            "mt-0.5 block truncate text-[0.72rem]",
                            branded
                              ? "text-primary-foreground/55 group-hover:text-accent-foreground/75"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {item.description}
                        </span>
                      </span>

                      {active && (
                        <ChevronRight
                          className={[
                            "size-4 shrink-0",
                            branded ? "text-accent" : "text-primary",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const mobileClose = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const desktopToggle = useRef<HTMLButtonElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreferenceReady, setSidebarPreferenceReady] = useState(false);

  const currentPage =
    allNavItems.find((item) => isItemActive(pathname, item))?.label ??
    "NutriCare";

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "NutriCare member";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setSidebarCollapsed(
        window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
      );
    } catch {
      // Retain the default expanded layout when storage is unavailable.
    } finally {
      setSidebarPreferenceReady(true);
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const dialog = mobileDialog.current;
    if (!dialog) return;

    // A modal dialog removes the background from keyboard navigation and
    // contains focus. A closed dialog also hides all of its controls.
    dialog.showModal();
    mobileClose.current?.focus();
    const mobileButton = mobileTrigger.current;
    const desktopButton = desktopToggle.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const trigger = desktop.matches ? desktopButton : mobileButton;
      trigger?.focus();
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // The shell still works if storage is unavailable.
      }

      return next;
    });
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-workspace">
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-background px-4 py-3 font-semibold text-foreground shadow-lg ring-2 ring-ring focus:translate-y-0 focus:outline-none">
        Skip to main content
      </a>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Link
          href="/dashboard"
          aria-label="Go to NutriCare dashboard"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/brand/nutricare-design-no-bg-low.png"
            alt="NutriCare"
            width={1132}
            height={368}
            priority
            className="h-auto w-[150px]"
          />
        </Link>

        <button
          type="button"
          ref={mobileTrigger}
          aria-label="Open navigation"
          aria-haspopup="dialog"
          disabled={!sidebarPreferenceReady}
          aria-expanded={mobileOpen}
          aria-controls="mobile-workspace-navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-xl border bg-card text-foreground shadow-xs transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile navigation */}
      <dialog
        ref={mobileDialog}
        aria-label="Workspace navigation"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          )).filter((element) => element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== "hidden");
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first || !last) return;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          setMobileOpen(false);
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent"
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className={[
            "absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <aside
          id="mobile-workspace-navigation"
          className={[
            "absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col border-r bg-sidebar shadow-2xl transition-transform duration-200 motion-reduce:transition-none",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-20 items-center justify-between border-b px-4">
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <Image
                src="/brand/nutricare-design-no-bg-low.png"
                alt="NutriCare"
                width={1132}
                height={368}
                loading="eager"
                className="h-auto w-[170px]"
              />
            </div>

            <button
              type="button"
              ref={mobileClose}
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-xl border bg-background text-foreground transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <Navigation
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>

          <div className="border-t p-4">
            <AccountArea
              displayName={displayName}
              initials={initials}
              signingOut={signingOut}
              ready={sidebarPreferenceReady}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </aside>
      </dialog>

      {/* Responsive workspace with one mounted page-content tree. */}
      <div
        className={[
          "min-h-[calc(100dvh-4rem)] transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none md:grid md:min-h-dvh",
          sidebarCollapsed
            ? "md:grid-cols-[5.5rem_minmax(0,1fr)]"
            : "md:grid-cols-[17.5rem_minmax(0,1fr)]",
        ].join(" ")}
      >
        <aside className="sticky top-0 z-40 hidden h-dvh min-w-0 self-start flex-col border-r border-primary-foreground/10 bg-primary text-primary-foreground md:flex">
          {/* Brand and collapse control */}
          <div
            className={[
              "relative flex h-28 shrink-0 items-center border-b border-primary-foreground/10 transition-all duration-300",
              sidebarCollapsed ? "justify-center px-2" : "px-4",
            ].join(" ")}
          >
            <Link
              href="/dashboard"
              aria-label="Go to NutriCare dashboard"
              title={sidebarCollapsed ? "NutriCare dashboard" : undefined}
              className={[
                "flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                sidebarCollapsed
                  ? "size-12 p-1"
                  : "h-[4.25rem] w-[12.75rem] px-3 py-2",
              ].join(" ")}
            >
              {sidebarCollapsed ? (
                <span className="flex size-full items-start justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/brand/nutricare-mark.png"
                    alt=""
                    width={705}
                    height={501}
                    priority
                    className="h-auto w-full object-contain"
                  />
                </span>
              ) : (
                <Image
                  src="/brand/nutricare-design-no-bg-low.png"
                  alt="NutriCare"
                  width={1132}
                  height={368}
                  priority
                  className="h-auto w-full object-contain"
                />
              )}
            </Link>

            <button
              type="button"
              ref={desktopToggle}
              onClick={toggleSidebar}
              disabled={!sidebarPreferenceReady}
              aria-label={
                sidebarCollapsed
                  ? "Expand NutriCare navigation"
                  : "Collapse NutriCare navigation"
              }
              aria-expanded={!sidebarCollapsed}
              title={
                sidebarCollapsed ? "Expand navigation" : "Collapse navigation"
              }
              className={[
                "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
                "border border-primary-foreground/15 bg-primary text-primary-foreground shadow-md",
                "transition-all hover:border-accent hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                sidebarCollapsed ? "-right-4" : "right-3",
              ].join(" ")}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div
            className={[
              "nutricare-sidebar-scroll min-h-0 flex-1 overflow-y-auto pb-5 pt-5",
              sidebarCollapsed ? "px-2" : "px-3",
            ].join(" ")}
          >
            <Navigation
              pathname={pathname}
              branded
              collapsed={sidebarCollapsed}
            />
          </div>

          <div
            className={[
              "shrink-0 border-t border-primary-foreground/10",
              sidebarCollapsed ? "p-2" : "p-4",
            ].join(" ")}
          >
            <AccountArea
              displayName={displayName}
              initials={initials}
              signingOut={signingOut}
              ready={sidebarPreferenceReady}
              onSignOut={handleSignOut}
              branded
              collapsed={sidebarCollapsed}
            />
          </div>
        </aside>

        <div className="min-w-0 bg-workspace">
          <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b bg-background/95 px-6 backdrop-blur md:flex lg:px-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Your NutriCare workspace
              </p>
              <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
                {currentPage}
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              NutriCare home
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </header>

          <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 md:px-5 md:py-6 lg:px-8 lg:py-8">
              <div className="mb-5 md:hidden">
                <p className="text-xs font-medium text-muted-foreground">
                  Your NutriCare workspace
                </p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">
                  {currentPage}
                </p>
              </div>
              {children}

              <footer className="mt-12 border-t pt-5 text-xs text-muted-foreground">
                © {new Date().getFullYear()} NutriCare. Nutrition guidance that
                helps you understand what to do next.
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Avoid transition flash before local preference has been read. */}
      <span
        className="hidden"
        data-sidebar-preference-ready={sidebarPreferenceReady}
      />
    </div>
  );
}

function AccountArea({
  displayName,
  initials,
  signingOut,
  ready = true,
  onSignOut,
  onNavigate,
  branded = false,
  collapsed = false,
}: {
  displayName: string;
  initials: string;
  signingOut: boolean;
  ready?: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
  branded?: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/profile"
          onClick={onNavigate}
          aria-label={`${displayName} account`}
          title={`${displayName}: Account`}
          className="flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shadow-sm">
            {initials || "N"}
          </span>
        </Link>

        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Go to NutriCare main site"
          title="Main site"
          className="flex size-10 items-center justify-center rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <BookOpen className="size-4" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut || !ready}
          aria-label={signingOut ? "Signing out" : "Sign out"}
          title={signingOut ? "Signing out" : "Sign out"}
          className="flex size-10 items-center justify-center rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
        >
          {signingOut ? (
            <span
              className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
              aria-hidden="true"
            />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Link
        href="/profile"
        onClick={onNavigate}
        className={[
          "flex items-center gap-3 rounded-xl p-2 transition-colors focus-visible:outline-none focus-visible:ring-2",
          branded
            ? "text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-accent"
            : "hover:bg-sidebar-accent focus-visible:ring-ring",
        ].join(" ")}
      >
        <span
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
            branded
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground",
          ].join(" ")}
        >
          {initials || "N"}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={[
              "block truncate text-sm font-semibold",
              branded ? "text-primary-foreground" : "text-foreground",
            ].join(" ")}
          >
            {displayName}
          </span>
          <span
            className={[
              "block truncate text-xs",
              branded
                ? "text-primary-foreground/55"
                : "text-muted-foreground",
            ].join(" ")}
          >
            Account
          </span>
        </span>

        <ChevronRight
          className={[
            "size-4 shrink-0",
            branded ? "text-primary-foreground/50" : "text-muted-foreground",
          ].join(" ")}
          aria-hidden="true"
        />
      </Link>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/"
          onClick={onNavigate}
          className={[
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
            branded
              ? "border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent"
              : "bg-background text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
          ].join(" ")}
        >
          <BookOpen className="size-4" aria-hidden="true" />
          Main site
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut || !ready}
          className={[
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60",
            branded
              ? "border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent"
              : "bg-background text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
          ].join(" ")}
        >
          {signingOut ? (
            <span
              className={[
                "size-4 animate-spin rounded-full border-2",
                branded
                  ? "border-primary-foreground/30 border-t-primary-foreground"
                  : "border-muted-foreground/30 border-t-muted-foreground",
              ].join(" ")}
              aria-hidden="true"
            />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          {signingOut ? "Signing out" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
