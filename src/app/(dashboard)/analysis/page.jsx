"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeArp, createArpSample, getArpSamples } from "@/lib/harisApi";

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

function mapArpRow(row) {
  return {
    id: row.id,
    ip: row.ip_address || row.source_ip || "unknown",
    mac: row.mac_address || "unknown",
    vlan: row.vlan || row.source_vlan || "-",
    iface: row.interface || row.iface || "-",
    age: row.timestamp ? new Date(row.timestamp).toLocaleString() : "unknown",
    trust: row.is_suspicious ? "suspicious" : row.is_unsolicited ? "stale" : "verified",
    note: row.arp_type || row.raw_data?.note || "ARP sample",
  };
}

export default function AnalysisPage() {
  const [arpRows, setArpRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [trustFilter, setTrustFilter] = useState("all");
  const [sampleForm, setSampleForm] = useState({
    ip_address: "192.168.1.10",
    mac_address: "00:11:22:33:44:55",
    arp_type: "reply",
  });

  const loadSamples = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getArpSamples();
      setArpRows(data.results.map(mapArpRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ARP samples could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, []);

  const filteredArp = useMemo(() => {
    if (trustFilter === "all") return arpRows;
    return arpRows.filter((r) => r.trust === trustFilter);
  }, [arpRows, trustFilter]);

  const summary = useMemo(
    () => ({
      vlanMonitored: new Set(arpRows.map((row) => row.vlan)).size,
      arpNeighborsTracked: arpRows.length,
      suspiciousBindings: arpRows.filter((row) => row.trust === "suspicious").length,
      spoofAlertsOpen: arpRows.filter((row) => row.trust === "suspicious" || row.trust === "stale").length,
    }),
    [arpRows]
  );

  const handleAnalyzeArp = async () => {
    try {
      await analyzeArp({});
      setSuccess("ARP analysis job submitted.");
      setError("");
      await loadSamples();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ARP analysis could not be started.");
    }
  };

  const handleCreateSample = async () => {
    try {
      await createArpSample({
        timestamp: new Date().toISOString(),
        ip_address: sampleForm.ip_address,
        mac_address: sampleForm.mac_address,
        arp_type: sampleForm.arp_type,
        is_unsolicited: false,
        raw_data: {},
      });
      setSuccess("ARP sample created.");
      setError("");
      await loadSamples();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ARP sample.");
    }
  };

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
            {error ? <p className="text-xs text-primary pt-1">{error}</p> : null}
            {success ? <p className="text-xs text-accent pt-1">{success}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleAnalyzeArp}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border/90 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {loading ? "Loading" : "Analyze ARP"}
          </button>
        </header>

        <section className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Create ARP sample</h2>
          <p className="text-xs text-muted mt-1">POST arp/samples</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="rounded-xl border border-border/90 px-3 py-2 text-sm font-mono"
              value={sampleForm.ip_address}
              onChange={(e) => setSampleForm((f) => ({ ...f, ip_address: e.target.value }))}
              placeholder="ip_address"
            />
            <input
              className="rounded-xl border border-border/90 px-3 py-2 text-sm font-mono"
              value={sampleForm.mac_address}
              onChange={(e) => setSampleForm((f) => ({ ...f, mac_address: e.target.value }))}
              placeholder="mac_address"
            />
            <select
              className="rounded-xl border border-border/90 px-3 py-2 text-sm"
              value={sampleForm.arp_type}
              onChange={(e) => setSampleForm((f) => ({ ...f, arp_type: e.target.value }))}
            >
              <option value="reply">reply</option>
              <option value="request">request</option>
            </select>
            <button
              type="button"
              onClick={handleCreateSample}
              className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
            >
              Create sample
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Summary metrics">
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">VLANs monitored</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{summary.vlanMonitored}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">ARP neighbors</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{summary.arpNeighborsTracked}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Suspicious bindings</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-accent">{summary.suspiciousBindings}</p>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Spoof alerts open</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{summary.spoofAlertsOpen}</p>
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
            <p className="mt-0.5 text-xs text-muted">Sample volume by hour (from loaded samples)</p>
            <div className="mt-4 rounded-2xl border border-border/70 bg-linear-to-b from-background/90 to-background/40 p-4">
              {arpRows.length ? (
                <ArpVolumeChart
                  data={[
                    { label: "S1", reqs: arpRows.length },
                    { label: "Sus", reqs: summary.suspiciousBindings },
                  ]}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted">No samples to chart.</p>
              )}
            </div>
          </section>

          <section className="xl:col-span-2 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Suspicious bindings</h2>
            <p className="mt-0.5 text-xs text-muted">From arp/samples API</p>
            <ul className="mt-4 space-y-3">
              {arpRows
                .filter((r) => r.trust !== "verified")
                .slice(0, 6)
                .map((a) => (
                  <li key={`${a.ip}-${a.mac}`} className="rounded-xl border border-border/70 bg-background/40 p-3">
                    <p className="text-sm font-semibold text-foreground font-mono">{a.ip}</p>
                    <p className="mt-1 text-xs text-muted">{a.note}</p>
                    <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${trustBadge[a.trust]}`}>
                      {a.trust}
                    </span>
                  </li>
                ))}
              {arpRows.filter((r) => r.trust !== "verified").length === 0 ? (
                <li className="text-xs text-muted">No suspicious samples in the current feed.</li>
              ) : null}
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
              <p className="text-xs text-muted mt-0.5">
                {loading ? "Loading…" : `${filteredArp.length} sample(s) from API`}
              </p>
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
