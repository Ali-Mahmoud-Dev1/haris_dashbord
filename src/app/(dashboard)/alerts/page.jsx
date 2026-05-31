"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/** Mock — استبدلها بـ API لاحقًا */
const ALERTS = [
  {
    id: "a-1042",
    attackType: "Port scan",
    ip: "192.168.1.45",
    timeIso: "2026-04-23T12:28:00",
    timeLabel: "2 min ago",
    status: "open",
  },
  {
    id: "a-1041",
    attackType: "Brute force (SSH)",
    ip: "10.0.0.18",
    timeIso: "2026-04-23T12:14:00",
    timeLabel: "16 min ago",
    status: "investigating",
  },
  {
    id: "a-1040",
    attackType: "ICMP flood",
    ip: "172.16.0.7",
    timeIso: "2026-04-23T11:30:00",
    timeLabel: "1 h ago",
    status: "open",
  },
  {
    id: "a-1039",
    attackType: "DNS amplification",
    ip: "203.0.113.44",
    timeIso: "2026-04-23T09:15:00",
    timeLabel: "3 h ago",
    status: "resolved",
  },
  {
    id: "a-1038",
    attackType: "ARP mismatch",
    ip: "192.168.1.2",
    timeIso: "2026-04-23T09:00:00",
    timeLabel: "3 h ago",
    status: "resolved",
  },
  {
    id: "a-1037",
    attackType: "SQL injection attempt",
    ip: "198.51.100.12",
    timeIso: "2026-04-22T18:40:00",
    timeLabel: "18 h ago",
    status: "investigating",
  },
  {
    id: "a-1036",
    attackType: "DDoS (SYN)",
    ip: "192.0.2.55",
    timeIso: "2026-04-22T14:00:00",
    timeLabel: "22 h ago",
    status: "open",
  },
];

const STATUS_CHIPS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
];

const ATTACK_TYPE_OPTIONS = [
  { value: "all", label: "All attack types" },
  ...Array.from(new Set(ALERTS.map((a) => a.attackType)))
    .sort()
    .map((t) => ({ value: t, label: t })),
];

const statusBadge = {
  open: "bg-primary/12 text-primary border-primary/25",
  investigating: "bg-accent/10 text-accent border-accent/25",
  resolved: "bg-foreground/[0.06] text-muted border-border",
};

const selectClass =
  "w-full cursor-pointer appearance-none rounded-xl border border-border/90 bg-card py-2.5 pl-3 pr-10 text-sm text-foreground shadow-sm transition " +
  "hover:border-primary/25 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25";

function normalize(s) {
  return s.trim().toLowerCase();
}

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AlertsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = normalize(query);
    return ALERTS.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.attackType !== typeFilter) return false;
      if (!q) return true;
      return (
        normalize(row.attackType).includes(q) ||
        normalize(row.ip).includes(q) ||
        normalize(row.id).includes(q)
      );
    }).sort((a, b) => (a.timeIso < b.timeIso ? 1 : -1));
  }, [query, statusFilter, typeFilter]);

  const totals = useMemo(() => {
    const open = ALERTS.filter((a) => a.status === "open").length;
    return { total: ALERTS.length, open };
  }, []);

  const hasFilters = query || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-6 sm:space-y-8 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Incidents
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Alerts
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Detected attacks across the monitored network. Search, narrow by type and status,
              then open an incident for the full timeline and response context.
            </p>
            <p className="text-xs text-muted/90 pt-0.5">
              <span className="tabular-nums font-medium text-foreground">{totals.total}</span> total
              in feed ·{" "}
              <span className="tabular-nums font-medium text-primary">{totals.open}</span> open
            </p>
          </div>
        </header>

        {/* Toolbar */}
        <section
          className="rounded-2xl border border-border/90 bg-gradient-to-b from-card to-card/95 p-4 sm:p-5 shadow-sm shadow-foreground/5"
          aria-label="Filter alerts"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-1 flex-col gap-2 min-w-0">
              <label htmlFor="alerts-search" className="text-xs font-semibold text-muted">
                Search
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="alerts-search"
                  type="search"
                  placeholder="Attack type, IP, or incident ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-border/90 bg-background/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 shadow-inner transition focus:border-primary/40 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:w-56 shrink-0">
              <label htmlFor="alerts-type" className="text-xs font-semibold text-muted">
                Attack type
              </label>
              <div className="relative">
                <select
                  id="alerts-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={selectClass}
                >
                  {ATTACK_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/70">
            <p className="text-xs font-semibold text-muted mb-2">Status</p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by status"
            >
              {STATUS_CHIPS.map((chip) => {
                const active = statusFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setStatusFilter(chip.value)}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition motion-reduce:transition-none",
                      active
                        ? "border-primary/35 bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                        : "border-border/80 bg-background/50 text-muted hover:border-primary/20 hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    ].join(" ")}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Results */}
        <section
          className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm shadow-foreground/5"
          aria-labelledby="alerts-results-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background/35 px-4 py-3.5 sm:px-5 backdrop-blur-sm">
            <div>
              <h2 id="alerts-results-heading" className="sr-only">
                Alert results
              </h2>
              <p className="text-sm text-muted">
                <span className="text-lg font-bold tabular-nums text-foreground">{filtered.length}</span>
                <span className="ml-1">
                  {filtered.length === 1 ? "incident" : "incidents"}
                  {hasFilters ? " match filters" : " in view"}
                </span>
              </p>
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                Reset filters
              </button>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M12 3a4 4 0 00-4 4v2.5L6 19h12l-2-9.5V7a4 4 0 00-4-4z" strokeLinejoin="round" />
                  <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-foreground">No incidents match</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Adjust search or status filters, or reset to see the full feed again.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block max-h-[min(70dvh,36rem)] overflow-auto overscroll-contain">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      <th scope="col" className="px-5 py-3.5 pl-6">
                        ID
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Attack type
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        IP
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Time
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3.5 pr-6 w-[1%] whitespace-nowrap text-right">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((row) => (
                      <tr
                        key={row.id}
                        className="group transition-colors hover:bg-primary/[0.035]"
                      >
                        <td className="px-5 py-3.5 pl-6">
                          <span className="font-mono text-[11px] font-medium text-muted tabular-nums">
                            {row.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {row.attackType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted">{row.ip}</td>
                        <td className="px-5 py-3.5 text-muted">
                          <time dateTime={row.timeIso} className="tabular-nums">
                            {row.timeLabel}
                          </time>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize tracking-wide ${statusBadge[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 pr-6 text-right">
                          <Link
                            href={`/attacks/${row.id}`}
                            className="inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center gap-1 rounded-xl border border-transparent px-3 py-1.5 text-xs font-bold text-primary transition group-hover:border-primary/25 group-hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            View
                            <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden divide-y divide-border/50 p-1" role="list">
                {filtered.map((row) => (
                  <li key={row.id} className="p-2">
                    <Link
                      href={`/attacks/${row.id}`}
                      className="block rounded-2xl border border-border/70 bg-gradient-to-b from-background/80 to-background/40 p-4 transition active:scale-[0.99] hover:border-primary/30 hover:shadow-md hover:shadow-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {row.id}
                          </p>
                          <p className="font-semibold text-foreground leading-snug">{row.attackType}</p>
                          <p className="font-mono text-xs text-muted">{row.ip}</p>
                          <p className="text-xs text-muted tabular-nums">
                            <time dateTime={row.timeIso}>{row.timeLabel}</time>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 self-start rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${statusBadge[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <span className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-primary">
                        View details
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
