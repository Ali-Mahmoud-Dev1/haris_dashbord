"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getAlertsTimeseries,
  getAttackDistribution,
  getDashboardSummary,
  getIncidentStatusBreakdown,
  getNetworkMap,
  getRecentAlerts,
  getRecentLogs,
  getSecurityPosture,
  getSeverityBreakdown,
  getTopSuspiciousIps,
  getHealth,
} from "@/lib/harisApi";

const levelStyle = {
  high: "bg-primary/12 text-primary border-primary/25",
  medium: "bg-accent/10 text-accent border-accent/25",
  low: "bg-foreground/[0.04] text-muted border-border",
};

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
}

function formatDate(value) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function mapAlert(alert) {
  return {
    id: String(pick(alert, ["id", "uuid", "alert_id"], "unknown")),
    type: pick(alert, ["attack_type", "attackType", "type", "title"], "Alert"),
    ip: pick(alert, ["source_ip", "ip", "src_ip"], "unknown"),
    time: formatDate(pick(alert, ["created_at", "timestamp", "timeIso", "last_seen"])),
    level: String(pick(alert, ["severity", "level"], "low")).toLowerCase(),
  };
}

function mapPoint(item, index) {
  return {
    day: String(pick(item, ["label", "day", "hour", "bucket"], `T${index + 1}`)).slice(0, 8),
    n: Number(pick(item, ["count", "n", "alerts", "value"], 0)),
  };
}

function unwrapList(data) {
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5l7 3.2v5.1c0 4.5-2.8 8.7-7 10.3-4.2-1.6-7-5.8-7-10.3V5.7l7-3.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCrosshair({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v2.5l-1.2 2.5h12.4L17 10.5V8a5 5 0 00-5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBan({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AttacksChart({ data }) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted">No timeseries data from the API yet.</p>
    );
  }

  const w = 520;
  const h = 220;
  const pad = { t: 20, r: 16, b: 36, l: 16 };
  const innerH = h - pad.t - pad.b;
  const innerW = w - pad.l - pad.r;
  const max = Math.max(...data.map((d) => d.n), 1);
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const bottom = pad.t + innerH;

  const nodes = data.map((d, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (d.n / max) * innerH;
    return { x, y, day: d.day, n: d.n };
  });

  const linePoints = nodes.map((n) => `${n.x},${n.y}`).join(" ");
  const linePathD = nodes.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" ");
  const lastX = nodes[nodes.length - 1]?.x ?? pad.l;
  const areaD = `${linePathD} L ${lastX} ${bottom} L ${pad.l} ${bottom} Z`;

  const gridY = [0.25, 0.5, 0.75].map((r) => pad.t + innerH * (1 - r));
  const peak = data.reduce((a, b) => (b.n > a.n ? b : a), data[0]);

  return (
    <div className="w-full -mx-1 sm:mx-0 overflow-x-auto overflow-y-hidden">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[min(100%,24rem)] h-auto"
        style={{ minHeight: 200 }}
        role="img"
        aria-label="Alerts timeseries"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="dashAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridY.map((gy, i) => (
          <line
            key={i}
            x1={pad.l}
            y1={gy}
            x2={w - pad.r}
            y2={gy}
            stroke="var(--border)"
            strokeOpacity="0.65"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
        <path d={areaD} fill="url(#dashAreaFill)" />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
        {nodes.map((n) => (
          <g key={n.day}>
            <circle cx={n.x} cy={n.y} r="4.5" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
            <text
              x={n.x}
              y={h - 10}
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontSize: 11, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}
            >
              {n.day}
            </text>
          </g>
        ))}
        <line x1={pad.l} y1={bottom} x2={w - pad.r} y2={bottom} stroke="var(--border)" strokeWidth="1" />
      </svg>
      <p className="text-xs text-muted mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          Peak: <span className="font-medium text-foreground">{peak.day}</span> (
          <span className="tabular-nums text-foreground font-medium">{peak.n}</span> events)
        </span>
        <span className="text-border hidden sm:inline">|</span>
        <span>Scale: 0–{max} events</span>
      </p>
    </div>
  );
}

const cardBase =
  "group relative flex flex-col rounded-2xl border border-border/90 bg-card p-5 sm:p-6 " +
  "shadow-sm shadow-foreground/5 transition-all duration-200 " +
  "hover:border-primary/25 hover:shadow-md hover:shadow-foreground/8";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [posture, setPosture] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topIps, setTopIps] = useState([]);
  const [severityRows, setSeverityRows] = useState([]);
  const [statusRows, setStatusRows] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getDashboardSummary(),
        getRecentAlerts(),
        getRecentLogs(),
        getSecurityPosture(),
        getAlertsTimeseries({ range: "24h" }),
        getAttackDistribution(),
        getTopSuspiciousIps(),
        getNetworkMap(),
        getSeverityBreakdown(),
        getIncidentStatusBreakdown(),
        getHealth(),
      ]);

      if (cancelled) return;

      const [
        summaryRes,
        alertsRes,
        ,
        postureRes,
        timeseriesRes,
        ,
        topIpsRes,
        ,
        severityRes,
        statusRes,
        healthRes,
      ] = results;

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (postureRes.status === "fulfilled") setPosture(postureRes.value);
      if (alertsRes.status === "fulfilled") {
        setAlerts(unwrapList(alertsRes.value).map(mapAlert));
      }
      if (timeseriesRes.status === "fulfilled") {
        const list = unwrapList(timeseriesRes.value);
        setChartData(list.map(mapPoint));
      }
      if (topIpsRes.status === "fulfilled") {
        setTopIps(unwrapList(topIpsRes.value));
      }
      if (severityRes.status === "fulfilled") {
        setSeverityRows(unwrapList(severityRes.value));
      }
      if (statusRes.status === "fulfilled") {
        setStatusRows(unwrapList(statusRes.value));
      }
      if (healthRes.status === "fulfilled") setHealth(healthRes.value);

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setError(`${failed} dashboard widget(s) could not be loaded.`);
      }
      setLoading(false);
    }

    loadDashboard().catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Dashboard load failed.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const networkData = useMemo(
    () => ({
      state: pick(summary, ["system_status", "status"], "unknown"),
      label: pick(posture, ["label", "status_label"], "Security posture"),
      detail: pick(posture, ["detail", "summary", "message"], "—"),
    }),
    [posture, summary]
  );

  const statsData = useMemo(
    () => ({
      attacks: Number(
        pick(summary, ["attacks_count", "incidents_count", "alerts_count"], 0)
      ),
      alerts: Number(pick(summary, ["alerts_count", "open_alerts", "open_alerts_count"], 0)),
      blockedIps: Number(
        pick(summary, ["blocked_ips", "blocked_ips_count"], topIps.length)
      ),
    }),
    [summary, topIps.length]
  );

  const isOperational =
    networkData.state === "operational" || networkData.state === "ok";

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-8 sm:space-y-10 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Overview</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
              Live security posture, incident volume, and the latest events across your monitored network.
            </p>
            <p className="text-xs text-muted/90 pt-1">
              Last updated{" "}
              <time dateTime={new Date().toISOString()}>{loading ? "loading…" : "just now"}</time>
            </p>
            {error ? <p className="text-xs text-primary pt-1">{error}</p> : null}
            {health ? (
              <p className="text-xs text-muted/90">
                API health:{" "}
                <span className="font-semibold text-foreground capitalize">{health.status}</span>
                {health.database ? ` · DB ${health.database}` : ""}
                {health.version ? ` · v${health.version}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <div
              className="inline-flex items-center justify-center sm:justify-start gap-2.5 rounded-2xl border border-border/90 bg-gradient-to-b from-card to-card/80 px-4 py-3 sm:py-2.5 text-sm shadow-sm"
              title="Current network health"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {isOperational ? (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                ) : null}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isOperational ? "bg-primary" : "bg-accent"
                  }`}
                />
              </span>
              <div className="min-w-0 text-left">
                <p className="font-semibold text-foreground leading-none">{networkData.label}</p>
                <p className="text-xs text-muted mt-1 sm:mt-0.5 capitalize">{networkData.state}</p>
              </div>
            </div>
            <Link
              href="/alerts"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/80 px-4 py-3 sm:py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/8 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              Open alerts
              <IconChevron className="h-4 w-4 text-muted" />
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" aria-label="Key statistics">
          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconShield className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Network status</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground capitalize">
              {isOperational ? "Operational" : networkData.state || "Unknown"}
            </p>
            <p className="mt-2 text-sm text-muted leading-snug line-clamp-2">{networkData.detail}</p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconCrosshair className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Incidents</p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-primary">{statsData.attacks}</p>
            <p className="mt-2 text-sm text-muted">From dashboard summary</p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-primary">
              <IconBell className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Alerts</p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-accent">{statsData.alerts}</p>
            <p className="mt-2 text-sm text-muted">Open or acknowledged</p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
              <IconBan className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Top suspicious IPs</p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-foreground">{statsData.blockedIps}</p>
            <p className="mt-2 text-sm text-muted">From top-suspicious-ips widget</p>
          </article>
        </section>

        {(severityRows.length > 0 || statusRows.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {severityRows.length > 0 ? (
              <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Severity breakdown</h2>
                <ul className="mt-3 space-y-2">
                  {severityRows.slice(0, 6).map((row, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-muted capitalize">
                        {pick(row, ["severity", "label", "name"], "—")}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {pick(row, ["count", "value", "n"], 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {statusRows.length > 0 ? (
              <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Incident status</h2>
                <ul className="mt-3 space-y-2">
                  {statusRows.slice(0, 6).map((row, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-muted capitalize">
                        {pick(row, ["status", "label", "name"], "—")}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {pick(row, ["count", "value", "n"], 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          <section
            className="xl:col-span-3 flex flex-col rounded-2xl border border-border/90 bg-card p-5 sm:p-6 lg:p-7 shadow-sm"
            aria-labelledby="chart-heading"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h2 id="chart-heading" className="text-base font-semibold text-foreground tracking-tight">
                  Alerts over time
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-0.5">alerts-timeseries (24h)</p>
              </div>
              <p className="text-xs text-muted tabular-nums">{loading ? "Loading" : "API"}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-border/70 bg-gradient-to-b from-background/90 to-background/40 p-4 sm:p-5">
              <AttacksChart data={chartData} />
            </div>
          </section>

          <section
            className="xl:col-span-2 flex flex-col min-h-0 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm"
            aria-labelledby="alerts-heading"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2 id="alerts-heading" className="text-base font-semibold text-foreground tracking-tight">
                  Recent alerts
                </h2>
                <p className="text-xs text-muted mt-0.5">recent-alerts</p>
              </div>
              <Link href="/alerts" className="shrink-0 text-sm font-medium text-primary hover:text-primary-light">
                View all
              </Link>
            </div>

            {alerts.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">
                {loading ? "Loading alerts…" : "No recent alerts from the API."}
              </p>
            ) : (
              <ul className="mt-4 space-y-0 max-h-[min(28rem,55vh)] overflow-y-auto pr-1" role="list">
                {alerts.map((a, i) => (
                  <li key={a.id} className={i > 0 ? "border-t border-border/60 pt-3 mt-3" : ""}>
                    <Link
                      href={`/attacks/${a.id}`}
                      className="group flex w-full items-stretch gap-2 rounded-xl px-2 py-1.5 hover:bg-primary/[0.06]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{a.type}</p>
                        <p className="text-xs text-muted font-mono mt-0.5">{a.ip}</p>
                        <p className="text-xs text-muted/90 mt-1">{a.time}</p>
                      </div>
                      <span
                        className={`self-center text-[10px] font-bold uppercase rounded-md border px-2 py-0.5 ${levelStyle[a.level] ?? levelStyle.low}`}
                      >
                        {a.level}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
