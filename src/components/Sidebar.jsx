"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { clearSessionCookie } from "@/lib/session";
import { logout } from "@/redux/slices/authSlice";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { name: "Alerts", path: "/alerts", icon: "alerts" },
  { name: "Logs", path: "/logs", icon: "logs" },
  { name: "Analysis", path: "/analysis", icon: "analysis" },
  { name: "Simulation", path: "/simulation", icon: "simulation" },
  { name: "Response", path: "/response", icon: "response" },
  { name: "Profile", path: "/profile", icon: "profile" },
];

function NavIcon({ name, className }) {
  const c = className;
  switch (name) {
    case "dashboard":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
          <path d="M9.5 21V14h5v7" strokeLinejoin="round" />
        </svg>
      );
    case "alerts":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3a4 4 0 00-4 4v2.5L6 19h12l-2-9.5V7a4 4 0 00-4-4z" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
        </svg>
      );
    case "logs":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M8 4h8v16H8V4z" strokeLinejoin="round" />
          <path d="M5 4h.01M5 8h.01M5 12h.01M5 16h.01" strokeLinecap="round" />
        </svg>
      );
    case "analysis":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 20V10M9 20V4M14 20v-7M19 20v-12" strokeLinecap="round" />
        </svg>
      );
    case "simulation":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="4" width="6" height="6" rx="1" fill="none" />
          <rect x="14" y="4" width="6" height="6" rx="1" fill="none" />
          <rect x="4" y="14" width="6" height="6" rx="1" fill="none" />
          <rect x="14" y="14" width="6" height="6" rx="1" fill="none" />
        </svg>
      );
    case "response":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 12a8 8 0 1116 0" strokeLinecap="round" />
          <path d="M4 12h5l2.5-3L14 12h2" strokeLinejoin="round" />
        </svg>
      );
    case "profile":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 4a3 3 0 100 6 3 3 0 000-6z" />
          <path d="M5 20a7 7 0 1014 0" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function isItemActive(pathname, itemPath) {
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    clearSessionCookie();
    dispatch(logout());
    setMobileOpen(false);
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile: open menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] flex h-14 items-center justify-between border-b border-border/80 bg-card/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="text-center pr-10">
          <p className="text-sm font-bold text-foreground">Haris</p>
          <p className="text-[10px] text-muted -mt-0.5">Security</p>
        </div>
        <div className="w-10" aria-hidden />
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-[2px] md:hidden"
          onClick={closeMobile}
          aria-label="Close menu"
        />
      )}

      <aside
        id="app-sidebar"
        className={[
          "fixed z-[120] top-0 left-0 flex h-dvh w-[min(18.5rem,88vw)] flex-col border-r border-border/90",
          "bg-gradient-to-b from-card via-card to-card/95 shadow-xl shadow-foreground/5",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          "md:static md:z-auto md:h-full md:min-h-0 md:max-h-full md:w-64 md:translate-x-0 md:shadow-none md:self-stretch",
          "md:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
          {/* Mobile drag strip / close in header area */}
          <div className="mb-2 flex items-center justify-between md:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Menu</span>
            <button
              type="button"
              onClick={closeMobile}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Brand */}
          <div className="mb-5 hidden border-b border-border/60 pb-5 md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
                  <path d="M12 2.5l7 3.2v5.1c0 4.5-2.8 8.7-7 10.3-4.2-1.6-7-5.8-7-10.3V5.7l7-3.2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">Haris</h1>
                <p className="text-xs text-muted">Security dashboard</p>
              </div>
            </div>
          </div>

          <p className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted md:block">
            Navigate
          </p>

          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5" aria-label="Main">
            {menu.map((item) => {
              const isActive = isItemActive(pathname, item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMobile}
                  className={[
                    "group flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    isActive
                      ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted hover:bg-foreground/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-background/50 text-muted group-hover:border-primary/20 group-hover:text-primary/90",
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-border/70 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/50 px-3 py-2.5 text-sm font-medium text-muted transition hover:border-foreground/15 hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <svg
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M10 4H6a1 1 0 00-1 1v14a1 1 0 001 1h4" strokeLinecap="round" />
                <path d="M16 12H8M20 8l-4-4" strokeLinejoin="round" />
              </svg>
              Logout
            </button>
            <p className="mt-2 text-center text-[10px] text-muted/70">Secure session</p>
          </div>
        </div>
      </aside>
    </>
  );
}
