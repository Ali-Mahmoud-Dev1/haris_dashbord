import Link from "next/link";

/* Mock data — wire to API later */
const network = {
  state: "operational",
  label: "Network stable",
  detail: "Sensors and collectors responding normally.",
};

const stats = {
  attacks: 24,
  alerts: 8,
  blockedIps: 3,
};

const attacksByDay = [
  { day: "Mon", n: 4 },
  { day: "Tue", n: 7 },
  { day: "Wed", n: 3 },
  { day: "Thu", n: 12 },
  { day: "Fri", n: 9 },
  { day: "Sat", n: 5 },
  { day: "Sun", n: 2 },
];

const recentAlerts = [
  {
    id: "a-1042",
    type: "Port scan",
    ip: "192.168.1.45",
    time: "2 min ago",
    level: "high",
  },
  {
    id: "a-1041",
    type: "Brute force (SSH)",
    ip: "10.0.0.18",
    time: "14 min ago",
    level: "high",
  },
  {
    id: "a-1040",
    type: "ICMP flood",
    ip: "172.16.0.7",
    time: "1 h ago",
    level: "medium",
  },
  {
    id: "a-1038",
    type: "ARP mismatch",
    ip: "192.168.1.2",
    time: "3 h ago",
    level: "low",
  },
];

const levelStyle = {
  high: "bg-primary/12 text-primary border-primary/25",
  medium: "bg-accent/10 text-accent border-accent/25",
  low: "bg-foreground/[0.04] text-muted border-border",
};

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
  const linePathD = nodes
    .map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`)
    .join(" ");
  const lastX = nodes[nodes.length - 1]?.x ?? pad.l;
  const areaD = `${linePathD} L ${lastX} ${bottom} L ${pad.l} ${bottom} Z`;

  const gridY = [0.25, 0.5, 0.75].map(
    (r) => pad.t + innerH * (1 - r)
  );
  const peak = data.reduce((a, b) => (b.n > a.n ? b : a), data[0]);

  return (
    <div className="w-full -mx-1 sm:mx-0 overflow-x-auto overflow-y-hidden">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[min(100%,24rem)] h-auto"
        style={{ minHeight: 200 }}
        role="img"
        aria-label="Attacks over the last 7 days"
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
            <circle
              cx={n.x}
              cy={n.y}
              r="4.5"
              fill="var(--card)"
              stroke="var(--primary)"
              strokeWidth="2"
            />
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
        <line
          x1={pad.l}
          y1={bottom}
          x2={w - pad.r}
          y2={bottom}
          stroke="var(--border)"
          strokeWidth="1"
        />
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
  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-8 sm:space-y-10 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Overview
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
              Live security posture, incident volume, and the latest events across your
              monitored network.
            </p>
            <p className="text-xs text-muted/90 pt-1">
              Last updated <time dateTime="2026-04-23T12:00:00">just now</time> · sample data
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <div
              className="inline-flex items-center justify-center sm:justify-start gap-2.5 rounded-2xl border border-border/90 bg-gradient-to-b from-card to-card/80 px-4 py-3 sm:py-2.5 text-sm shadow-sm"
              title="Current network health"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_1px_var(--color-card),0_0_10px_var(--color-primary)]"
                />
              </span>
              <div className="min-w-0 text-left">
                <p className="font-semibold text-foreground leading-none">{network.label}</p>
                <p className="text-xs text-muted mt-1 sm:mt-0.5">All monitoring paths OK</p>
              </div>
            </div>
            <Link
              href="/alerts"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/80 px-4 py-3 sm:py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/8 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open alerts
              <IconChevron className="h-4 w-4 text-muted" />
            </Link>
          </div>
        </header>

        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          aria-label="Key statistics"
        >
          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconShield className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Network status
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
              {network.state === "operational" ? "Operational" : "Degraded"}
            </p>
            <p className="mt-2 text-sm text-muted leading-snug line-clamp-2">
              {network.detail}
            </p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconCrosshair className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Attacks (7d)
            </p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-primary">
              {stats.attacks}
            </p>
            <p className="mt-2 text-sm text-muted">Detected in the last week</p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-primary">
              <IconBell className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Alerts</p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-accent">
              {stats.alerts}
            </p>
            <p className="mt-2 text-sm text-muted">Open or acknowledged</p>
          </article>

          <article className={cardBase}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
              <IconBan className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Blocked IPs
            </p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-foreground">
              {stats.blockedIps}
            </p>
            <p className="mt-2 text-sm text-muted">On deny / block list</p>
          </article>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          <section
            className="xl:col-span-3 flex flex-col rounded-2xl border border-border/90 bg-card p-5 sm:p-6 lg:p-7 shadow-sm shadow-foreground/5"
            aria-labelledby="chart-heading"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <div>
                <h2
                  id="chart-heading"
                  className="text-base font-semibold text-foreground tracking-tight"
                >
                  Attacks over time
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-0.5">Rolling 7-day window</p>
              </div>
              <p className="text-xs text-muted tabular-nums">Sample dataset</p>
            </div>
            <div className="flex-1 rounded-2xl border border-border/70 bg-gradient-to-b from-background/90 to-background/40 p-4 sm:p-5 min-h-0">
              <AttacksChart data={attacksByDay} />
            </div>
          </section>

          <section
            className="xl:col-span-2 flex flex-col min-h-0 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm shadow-foreground/5"
            aria-labelledby="alerts-heading"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2
                  id="alerts-heading"
                  className="text-base font-semibold text-foreground tracking-tight"
                >
                  Recent alerts
                </h2>
                <p className="text-xs text-muted mt-0.5">Newest first</p>
              </div>
              <Link
                href="/alerts"
                className="shrink-0 text-sm font-medium text-primary hover:text-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-md px-1 py-0.5 -mr-1"
              >
                View all
              </Link>
            </div>

            <ul
              className="mt-4 space-y-0 max-h-[min(28rem,55vh)] xl:max-h-[min(32rem,60vh)] overflow-y-auto overflow-x-hidden pr-1 -mr-1 overscroll-y-contain"
              role="list"
            >
              {recentAlerts.map((a, i) => (
                <li
                  key={a.id}
                  className={i > 0 ? "border-t border-border/60 pt-3 mt-3" : ""}
                >
                  <Link
                    href={`/attacks/${a.id}`}
                    className="group flex w-full min-h-[3.5rem] items-stretch gap-2 rounded-xl px-2 -mx-1 py-1.5 text-left transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset"
                  >
                    <div className="min-w-0 flex-1 self-center pr-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {a.type}
                      </p>
                      <p className="text-xs text-muted font-mono mt-0.5 line-clamp-1">{a.ip}</p>
                      <p className="text-xs text-muted/90 mt-1.5 tabular-nums">{a.time}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide rounded-md border px-2 py-0.5 ${levelStyle[a.level]}`}
                      >
                        {a.level}
                      </span>
                      <IconChevron className="h-4 w-4 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 -translate-y-0.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
