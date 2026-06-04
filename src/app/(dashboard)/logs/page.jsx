"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import {
  clearActivityLogs,
  createLogEntry,
  fetchLogs,
  ingestCsvLog,
  ingestJsonLogs,
  ingestSyslogMessage,
  selectLogItems,
  selectLogsError,
  selectLogsIngestError,
  selectLogsIngesting,
  selectLogsStatus,
  selectLogsSuccessMessage,
} from "@/redux/slices/logsSlice";

const PAGE_SIZE = 10;

const SEVERITY_CHIPS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const severityBadge = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  error: "bg-primary/12 text-primary border-primary/25",
  warning: "bg-accent/10 text-accent border-accent/25",
  info: "bg-foreground/[0.06] text-muted border-border",
};

const selectClass =
  "w-full cursor-pointer appearance-none rounded-xl border border-border/90 bg-card py-2.5 pl-3 pr-10 text-sm text-foreground shadow-sm transition " +
  "hover:border-primary/25 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25";

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LogsPage() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectLogItems);
  const status = useAppSelector(selectLogsStatus);
  const loadError = useAppSelector(selectLogsError);
  const ingestError = useAppSelector(selectLogsIngestError);
  const ingesting = useAppSelector(selectLogsIngesting);
  const success = useAppSelector(selectLogsSuccessMessage) ?? "";

  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [syslogMessage, setSyslogMessage] = useState("");
  const [jsonPayload, setJsonPayload] = useState('{"logs": []}');
  const [jsonError, setJsonError] = useState("");
  const [csvFile, setCsvFile] = useState(/** @type {File | null} */ (null));

  const error = jsonError || ingestError || loadError || "";

  const loading = status === "loading" || status === "idle";

  const role = useAppSelector(selectCurrentUser)?.role;
  const canClearLogs = role === "ADMIN";

  useEffect(() => {
    dispatch(fetchLogs());
  }, [dispatch]);

  const facilityOptions = useMemo(
    () => [
      { value: "all", label: "All facilities" },
      ...Array.from(new Set(logs.map((l) => l.facility)))
        .sort()
        .map((f) => ({ value: f, label: f })),
    ],
    [logs]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    return logs.filter((row) => {
      if (severityFilter !== "all" && row.severity !== severityFilter) return false;
      if (facilityFilter !== "all" && row.facility !== facilityFilter) return false;
      if (!q) return true;
      const hay = `${row.message} ${row.facility} ${row.host} ${row.id}`;
      return normalize(hay).includes(q);
    }).sort((a, b) => (a.timeIso < b.timeIso ? 1 : -1));
  }, [logs, query, severityFilter, facilityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, severityFilter, facilityFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const sliceStart = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  const hasFilters = query || severityFilter !== "all" || facilityFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setSeverityFilter("all");
    setFacilityFilter("all");
    setPage(1);
  };

  const summary = useMemo(() => {
    const bySev = logs.reduce(
      (acc, l) => {
        acc[l.severity] = (acc[l.severity] || 0) + 1;
        return acc;
      },
      { critical: 0, error: 0, warning: 0, info: 0 }
    );
    return { total: logs.length, bySev };
  }, [logs]);

  const handleClearLogs = () => {
    if (!canClearLogs) return;
    dispatch(clearActivityLogs());
  };

  const handleUploadJson = () => {
    try {
      setJsonError("");
      dispatch(ingestJsonLogs(JSON.parse(jsonPayload)));
    } catch {
      setJsonError("Invalid JSON payload.");
    }
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
              Observability
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Logs</h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Syslog-style events from collectors and hosts. Search the stream, narrow by severity or
              facility, and paginate through high-volume feeds.
            </p>
            <p className="text-xs text-muted/90 pt-0.5">
              <span className="tabular-nums font-medium text-foreground">{summary.total}</span>
              lines ·{" "}
              <span className="tabular-nums font-medium text-red-600 dark:text-red-400">
                {summary.bySev.critical}
              </span>{" "}
              critical ·{" "}
              <span className="tabular-nums font-medium text-primary">{summary.bySev.error}</span>{" "}
              errors
              {loading ? " · loading" : ""}
            </p>
            {error ? <p className="text-xs text-primary pt-1">{error}</p> : null}
            {success ? <p className="text-xs text-accent pt-1">{success}</p> : null}
          </div>
          {canClearLogs ? (
            <button
              type="button"
              onClick={handleClearLogs}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border/90 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              Clear logs
            </button>
          ) : null}
        </header>

        <section
          className="rounded-2xl border border-border/90 bg-card p-4 sm:p-5 shadow-sm"
          aria-label="Ingest logs"
        >
          <h2 className="text-sm font-semibold text-foreground">Ingest logs (API)</h2>
          <p className="text-xs text-muted mt-1">upload/csv · upload/json · logs/bulk · logs/syslog · logs/activity</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">CSV file</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs"
              />
              <button
                type="button"
                disabled={!csvFile || ingesting}
                onClick={() => csvFile && dispatch(ingestCsvLog(csvFile))}
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
              >
                Upload CSV
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">JSON body</label>
              <textarea
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/90 bg-background/60 px-3 py-2 font-mono text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ingesting}
                  onClick={handleUploadJson}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
                >
                  Upload JSON / bulk
                </button>
                <button
                  type="button"
                  disabled={ingesting}
                  onClick={() =>
                    dispatch(
                      createLogEntry({
                        timestamp: new Date().toISOString(),
                        source_ip: "127.0.0.1",
                        event_type: "manual_entry",
                        status: "info",
                        raw_message: "Manual log from dashboard",
                      })
                    )
                  }
                  className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                >
                  Create one log
                </button>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-muted">Syslog message</label>
              <input
                type="text"
                value={syslogMessage}
                onChange={(e) => setSyslogMessage(e.target.value)}
                placeholder="denied tcp 192.168.1.1 -> 192.168.1.2(22)"
                className="w-full rounded-xl border border-border/90 bg-background/60 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!syslogMessage.trim() || ingesting}
                onClick={() =>
                  dispatch(
                    ingestSyslogMessage({ message: syslogMessage.trim(), source_device: "dashboard" })
                  )
                }
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
              >
                Ingest syslog
              </button>
            </div>
          </div>
        </section>

        <section
          className="rounded-2xl border border-border/90 bg-gradient-to-b from-card to-card/95 p-4 sm:p-5 shadow-sm shadow-foreground/5"
          aria-label="Filter logs"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-1 flex-col gap-2 min-w-0">
              <label htmlFor="logs-search" className="text-xs font-semibold text-muted">
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
                  id="logs-search"
                  type="search"
                  placeholder="Message, facility, host, log ID…"
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
              <label htmlFor="logs-facility" className="text-xs font-semibold text-muted">
                Facility
              </label>
              <div className="relative">
                <select
                  id="logs-facility"
                  value={facilityFilter}
                  onChange={(e) => setFacilityFilter(e.target.value)}
                  className={selectClass}
                >
                  {facilityOptions.map((o) => (
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
            <p className="text-xs font-semibold text-muted mb-2">Severity</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by severity">
              {SEVERITY_CHIPS.map((chip) => {
                const active = severityFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setSeverityFilter(chip.value)}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition motion-reduce:transition-none capitalize",
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

        <section
          className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm shadow-foreground/5"
          aria-labelledby="logs-results-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background/35 px-4 py-3.5 sm:px-5 backdrop-blur-sm">
            <div>
              <h2 id="logs-results-heading" className="sr-only">
                Log results
              </h2>
              <p className="text-sm text-muted">
                <span className="text-lg font-bold tabular-nums text-foreground">{filtered.length}</span>
                <span className="ml-1">
                  {filtered.length === 1 ? "line" : "lines"}
                  {hasFilters ? " match filters" : " in stream"}
                </span>
                {filtered.length > 0 ? (
                  <span className="block text-xs text-muted/90 mt-0.5">
                    Page{" "}
                    <span className="tabular-nums font-semibold text-foreground">{page}</span> of{" "}
                    <span className="tabular-nums font-semibold text-foreground">{totalPages}</span>
                  </span>
                ) : null}
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
                  <path d="M8 4h8v16H8V4z" strokeLinejoin="round" />
                  <path d="M5 8h.01M5 12h.01M5 16h.01" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-foreground">
                {loading ? "Loading…" : logs.length === 0 ? "No logs from API" : "No log lines match"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {logs.length === 0 && !loading
                  ? "Use ingest above or wait for collectors."
                  : "Broaden search or reset severity / facility filters to see events again."}
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
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      <th scope="col" className="px-5 py-3.5 pl-6 w-[1%] whitespace-nowrap">
                        Time
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Facility
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Host
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Severity
                      </th>
                      <th scope="col" className="px-5 py-3.5 pr-6">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pageRows.map((row) => (
                      <tr key={row.id} className="align-top transition-colors hover:bg-primary/[0.035]">
                        <td className="px-5 py-3 pl-6 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-muted tabular-nums">
                            <time dateTime={row.timeIso}>{row.timeLabel}</time>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-semibold text-primary">{row.facility}</span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted">{row.host}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize tracking-wide ${severityBadge[row.severity] ?? severityBadge.info}`}
                          >
                            {row.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3 pr-6">
                          <p className="text-foreground leading-snug break-words">{row.message}</p>
                          <p className="mt-1 font-mono text-[10px] text-muted/80">{row.id}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden divide-y divide-border/50 p-1" role="list">
                {pageRows.map((row) => (
                  <li key={row.id} className="p-3">
                    <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-background/80 to-background/40 p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <span className="font-mono text-xs font-semibold text-primary">{row.facility}</span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${severityBadge[row.severity] ?? severityBadge.info}`}
                        >
                          {row.severity}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-muted">{row.host}</p>
                      <p className="text-xs text-muted tabular-nums">
                        <time dateTime={row.timeIso}>{row.timeLabel}</time>
                      </p>
                      <p className="text-sm text-foreground leading-snug">{row.message}</p>
                      <p className="font-mono text-[10px] text-muted/80">{row.id}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 border-t border-border/70 bg-background/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-muted">
                  Showing{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {filtered.length === 0 ? 0 : sliceStart + 1}
                  </span>
                  –
                  <span className="font-semibold tabular-nums text-foreground">
                    {Math.min(sliceStart + PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of <span className="tabular-nums font-semibold text-foreground">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
