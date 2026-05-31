"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/** Mock — استبدلها بـ API / PCAP pipeline لاحقًا */

const SUMMARY = {
  vlanMonitored: 6,
  arpNeighborsTracked: 48,
  suspiciousBindings: 3,
  spoofAlertsOpen: 2,
};

const ARP_CHART = [
  { label: "00", reqs: 12 },
  { label: "04", reqs: 18 },
  { label: "08", reqs: 15 },
  { label: "12", reqs: 42 },
  { label: "16", reqs: 28 },
  { label: "20", reqs: 22 },
];

const ARP_TABLE = [
  {
    ip: "192.168.1.1",
    mac: "aa:bb:cc:00:11:22",
    vlan: "10",
    iface: "agg-core · Gi1/0/1",
    age: "2 min",
    trust: "verified",
    note: "Gateway — DHCP snooping trusted",
  },
  {
    ip: "192.168.1.45",
    mac: "de:ad:be:ef:01:99",
    vlan: "10",
    iface: "access-03 · Fa0/18",
    age: "8 min",
    trust: "suspicious",
    note: "MAC churn vs DHCP lease (2 changes / 15 min)",
  },
  {
    ip: "192.168.1.2",
    mac: "aa:bb:cc:dd:ee:02",
    vlan: "10",
    iface: "access-02 · Fa0/7",
    age: "14 min",
    trust: "suspicious",
    note: "Gratuitous ARP burst toward default GW",
  },
  {
    ip: "192.168.40.107",
    mac: "02:11:32:a4:c9:10",
    vlan: "40",
    iface: "access-05 · Fa0/22",
    age: "1 h",
    trust: "verified",
    note: "Stable binding — matches DHCP ACK",
  },
  {
    ip: "10.0.5.2",
    mac: "48:9e:bd:12:34:56",
    vlan: "mgmt",
    iface: "mgmt-sw · Gi0/24",
    age: "3 h",
    trust: "stale",
    note: "No ingress traffic — aging out recommended",
  },
];

const SPOOF_ALERTS = [
  {
    id: "arp-009",
    title: "Possible duplicate IP claim",
    detail: "192.168.1.1 advertised by aa:bb:cc:00:11:22 and ae:12:90:ff:00:01 within 400 ms.",
    severity: "high",
    timeLabel: "6 min ago",
    relatedIncident: "a-1038",
  },
  {
    id: "arp-008",
    title: "Unsolicited ARP reply storm",
    detail: "VLAN 10 · >120 unsolicited replies/min from single source MAC toward broadcast.",
    severity: "medium",
    timeLabel: "22 min ago",
    relatedIncident: null,
  },
];

const trustBadge = {
  verified: "bg-foreground/[0.06] text-muted border-border",
  suspicious: "bg-accent/10 text-accent border-accent/25",
  stale: "bg-primary/12 text-primary border-primary/25",
};

const severityBadge = {
  high: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  medium: "bg-accent/10 text-accent border-accent/25",
  low: "bg-foreground/[0.06] text-muted border-border",
};

function ArpVolumeChart({ data }) {
  const w = 400;
  const h = 160;
  const pad = { t: 16, r: 12, b: 28, l: 12 };
  const innerH = h - pad.t - pad.b;
  const innerW = w - pad.l - pad.r;
  const max = Math.max(...data.map((d) => d.reqs), 1);
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const bottom = pad.t + innerH;

  const nodes = data.map((d, i) => ({
    x: pad.l + i * step,
    y: pad.t + innerH - (d.reqs / max) * innerH,
    label: d.label,
    n: d.reqs,
  }));

  const linePoints = nodes.map((n) => `${n.x},${n.y}`).join(" ");
  const linePathD = nodes.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" ");
  const lastX = nodes[nodes.length - 1]?.x ?? pad.l;
  const areaD = `${linePathD} L ${lastX} ${bottom} L ${pad.l} ${bottom} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[min(100%,20rem)] h-auto"
        role="img"
        aria-label="ARP requests per sampling window over last 24 hours"
      >
        <defs>
          <linearGradient id="arpChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((r, i) => (
          <line
            key={i}
            x1={pad.l}
            y1={pad.t + innerH * (1 - r)}
            x2={w - pad.r}
            y2={pad.t + innerH * (1 - r)}
            stroke="var(--border)"
            strokeOpacity="0.65"
            strokeDasharray="4 6"
          />
        ))}
        <path d={areaD} fill="url(#arpChartFill)" />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
        {nodes.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="4" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
            <text
              x={n.x}
              y={h - 8}
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontSize: 10 }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted mt-2">
        Sample aggregate · peaks often align with DHCP renewals or reconnaissance sweeps.
      </p>
    </div>
  );
}

export default function AnalysisPage() {
  const [trustFilter, setTrustFilter] = useState("all");

  const filteredArp = useMemo(() => {
    if (trustFilter === "all") return ARP_TABLE;
    return ARP_TABLE.filter((r) => r.trust === trustFilter);
  }, [trustFilter]);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-linear-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-6 sm:space-y-8 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Layer 2 visibility
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Network analysis
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              ARP neighbor bindings, traffic shaping signals, and spoofing-oriented anomalies across
              monitored VLANs. Use this view alongside{" "}
              <Link href="/logs" className="font-semibold text-primary hover:text-primary-light">
                Logs
              </Link>{" "}
              and{" "}
              <Link href="/alerts" className="font-semibold text-primary hover:text-primary-light">
                Alerts
              </Link>
              .
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Summary metrics">
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">VLANs monitored</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{SUMMARY.vlanMonitored}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">ARP neighbors</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{SUMMARY.arpNeighborsTracked}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Suspicious bindings</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-accent">{SUMMARY.suspiciousBindings}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Spoof alerts open</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{SUMMARY.spoofAlertsOpen}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5 lg:gap-8">
          <section
            className="xl:col-span-3 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm shadow-foreground/5"
            aria-labelledby="arp-volume-heading"
          >
            <h2 id="arp-volume-heading" className="text-base font-semibold text-foreground tracking-tight">
              ARP request volume
            </h2>
            <p className="mt-0.5 text-xs text-muted">Rolling windows (mock timeline)</p>
            <div className="mt-4 rounded-2xl border border-border/70 bg-linear-to-b from-background/90 to-background/40 p-4">
              <ArpVolumeChart data={ARP_CHART} />
            </div>
          </section>

          <section
            className="xl:col-span-2 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm"
            aria-labelledby="spoof-heading"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="spoof-heading" className="text-base font-semibold text-foreground tracking-tight">
                  Spoofing signals
                </h2>
                <p className="mt-0.5 text-xs text-muted">Correlates with ARP inspection</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {SPOOF_ALERTS.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border/70 bg-background/40 p-3 transition hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadge[a.severity]}`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{a.detail}</p>
                  <p className="mt-2 text-[11px] text-muted tabular-nums">{a.timeLabel}</p>
                  {a.relatedIncident ? (
                    <Link
                      href={`/attacks/${a.relatedIncident}`}
                      className="mt-2 inline-flex text-xs font-bold text-primary hover:text-primary-light"
                    >
                      Open incident →
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section
          className="rounded-2xl border border-border/90 bg-card shadow-sm shadow-foreground/5 overflow-hidden"
          aria-labelledby="arp-table-heading"
        >
          <div className="flex flex-col gap-3 border-b border-border/70 bg-background/35 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 backdrop-blur-sm">
            <div>
              <h2 id="arp-table-heading" className="text-base font-semibold text-foreground tracking-tight">
                ARP binding table
              </h2>
              <p className="text-xs text-muted mt-0.5">High-trust segments · sample subset</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by trust">
              {["all", "verified", "suspicious", "stale"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTrustFilter(v)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition",
                    trustFilter === v
                      ? "border-primary/35 bg-primary/12 text-primary ring-1 ring-primary/15"
                      : "border-border/80 bg-background/50 text-muted hover:border-primary/20 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                  ].join(" ")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block max-h-[min(55dvh,28rem)] overflow-auto overscroll-contain">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th scope="col" className="px-5 py-3.5 pl-6">
                    IP
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    MAC
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    VLAN
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Interface
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Age
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Trust
                  </th>
                  <th scope="col" className="px-5 py-3.5 pr-6">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredArp.map((row) => (
                  <tr key={`${row.ip}-${row.mac}`} className="align-top hover:bg-primary/[0.035] transition-colors">
                    <td className="px-5 py-3 pl-6 font-mono text-xs font-semibold text-foreground">{row.ip}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{row.mac}</td>
                    <td className="px-5 py-3 font-mono text-xs">{row.vlan}</td>
                    <td className="px-5 py-3 text-xs text-muted max-w-56">{row.iface}</td>
                    <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">{row.age}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize ${trustBadge[row.trust]}`}
                      >
                        {row.trust}
                      </span>
                    </td>
                    <td className="px-5 py-3 pr-6 text-xs text-muted leading-snug">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border/50 p-2 lg:hidden" role="list">
            {filteredArp.map((row) => (
              <li key={`${row.ip}-${row.mac}`} className="p-3">
                <div className="rounded-2xl border border-border/70 bg-linear-to-b from-background/80 to-background/40 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">{row.ip}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${trustBadge[row.trust]}`}>
                      {row.trust}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">{row.mac}</p>
                  <p className="text-xs text-muted">
                    VLAN {row.vlan} · {row.iface}
                  </p>
                  <p className="text-xs text-muted tabular-nums">Age {row.age}</p>
                  <p className="text-xs leading-relaxed text-foreground/90">{row.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
