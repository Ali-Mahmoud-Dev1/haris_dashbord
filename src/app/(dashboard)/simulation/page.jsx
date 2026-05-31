"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

const SCENARIOS = {
  portscan: {
    id: "portscan",
    title: "Port scan",
    short: "Sequential probes across TCP ports from one internal host.",
    detectionTitle: "How it was detected",
    summary:
      "The IDS correlated outbound SYN packets targeting incrementing destination ports within a narrow time window — behaviour typical of horizontal reconnaissance.",
    steps: [
      {
        label: "Telemetry",
        text: "Netflow showed one-to-many flows from 192.168.50.22 toward VLAN30 hosts with dst-port stepping every ~180 ms.",
      },
      {
        label: "Signature hit",
        text: 'Suricata rule ET SCAN Potential SSH Scan and ET SCAN Suspicious Port Sweep triggered within the same second.',
      },
      {
        label: "Correlation",
        text: "Correlation engine grouped events under REC-SCAN-02 and raised severity because DHCP lease belonged to a student workstation profile.",
      },
      {
        label: "Dashboard action",
        text: "An incident stub appeared under Alerts with source IP and suggested containment playbook.",
      },
    ],
  },
  bruteforce: {
    id: "bruteforce",
    title: "Brute force (SSH)",
    short: "Rapid authentication failures against SSH listener.",
    detectionTitle: "How it was detected",
    summary:
      "Multiple distinct usernames from one peer paired with rising TCP RST counters flagged coordinated guessing rather than user typo retries.",
    steps: [
      {
        label: "Authentication audit",
        text: "sshd telemetry streamed Failed password lines exceeding AUTH_MULTIPLE_FAILURES_SSH threshold (≥25 / 5 min).",
      },
      {
        label: "Velocity rule",
        text: "SIEM velocity detector flagged unique credential tuples/sec crossing anomaly baseline from subnet VLAN-mgmt.",
      },
      {
        label: "Honeypot cross-check",
        text: "Optional jump honeypot saw mirrored credential ordering — confidence uplift.",
      },
      {
        label: "Automated response",
        text: "Tier-1 automated playbook suggested tarpitting host-wide until SOC acknowledgement.",
      },
    ],
  },
  icmp: {
    id: "icmp",
    title: "ICMP flood",
    short: "Elevated ICMP echo traffic aimed at infrastructure resolver.",
    detectionTitle: "How it was detected",
    summary:
      "ICMP reply bandwidth surpassed volumetric baseline while legitimate DNS handshake latency degraded — indicative of flood-side saturation.",
    steps: [
      {
        label: "Baseline deviation",
        text: "Resolver ICMP bitrate exceeded seasonal rolling percentile P98 by >400%.",
      },
      {
        label: "Pattern classifier",
        text: "Payload entropy minimal — repetitive TTL/IP-ID increments suggesting scripted flood tool.",
      },
      {
        label: "Edge telemetry",
        text: "Border routers reported rising ICMP queue drops unrelated to traceroute maintenance window.",
      },
      {
        label: "Mitigation hint",
        text: "Runbook DOS_ICMP_VOLUME_THRESHOLD executed ICMP-specific policing suggestion.",
      },
    ],
  },
};

const CARD_SELECTED =
  "border-primary/40 bg-primary/[0.08] ring-2 ring-primary/25 shadow-md";
const CARD_IDLE =
  "border-border/80 bg-card hover:border-primary/25 hover:bg-primary/[0.03]";

export default function SimulationPage() {
  const [selected, setSelected] = useState(/** @type {keyof typeof SCENARIOS | null} */ (null));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const runSimulation = useCallback(() => {
    if (!selected || running) return;
    setRunning(true);
    setFinished(false);
    window.setTimeout(() => {
      setRunning(false);
      setFinished(true);
    }, 1400);
  }, [selected, running]);

  const reset = useCallback(() => {
    setSelected(null);
    setRunning(false);
    setFinished(false);
  }, []);

  const scenario = selected ? SCENARIOS[selected] : null;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-linear-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-6 sm:space-y-8 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Training lab
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Simulation
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Pick a synthetic attack pattern, run it in the lab harness, and read how the monitoring stack would surface it — without touching production traffic.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3 text-xs text-muted max-w-md shrink-0">
            <span className="font-semibold text-accent">Sandbox notice:</span> Events below are illustrative.
            Wire your backend simulator here later to drive real replay timelines.
          </div>
        </header>

        <section aria-labelledby="pick-heading">
          <h2 id="pick-heading" className="text-base font-semibold text-foreground mb-3">
            1 · Choose scenario
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Object.keys(SCENARIOS).map((key) => {
              const s = SCENARIOS[key];
              const isSel = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(/** @type {typeof selected} */ (key));
                    setFinished(false);
                  }}
                  className={[
                    "rounded-2xl border p-5 text-left transition motion-reduce:transition-none",
                    isSel ? CARD_SELECTED : CARD_IDLE,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  ].join(" ")}
                >
                  <p className="text-lg font-bold text-foreground">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.short}</p>
                  {isSel ? (
                    <p className="mt-3 text-xs font-semibold text-primary">Selected</p>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-muted">Tap to select</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/90 bg-linear-to-b from-card to-card/95 p-5 sm:p-6 shadow-sm shadow-foreground/5">
          <h2 className="text-base font-semibold text-foreground mb-4">2 · Run & observe</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runSimulation}
              disabled={!selected || running}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {running ? "Running…" : "Run simulation"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-border/90 bg-background/70 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              Reset
            </button>
            <Link
              href="/alerts"
              className="inline-flex items-center rounded-xl border border-border/90 bg-background/70 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              View alerts feed
            </Link>
          </div>

          {!selected ? (
            <p className="mt-6 text-sm text-muted">Select a scenario above to enable Run simulation.</p>
          ) : null}

          {running ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
              <p className="text-sm text-foreground">
                Injecting synthetic telemetry for <strong>{scenario?.title}</strong>…
              </p>
            </div>
          ) : null}

          {finished && scenario ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{scenario.detectionTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{scenario.summary}</p>
              </div>

              <ol className="space-y-4">
                {scenario.steps.map((step, i) => (
                  <li key={step.label} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-foreground">{step.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="text-xs text-muted">
                Next: correlate this narrative with live components on{" "}
                <Link href="/logs" className="font-semibold text-primary hover:text-primary-light">
                  Logs
                </Link>{" "}
                or{" "}
                <Link href="/analysis" className="font-semibold text-primary hover:text-primary-light">
                  Analysis
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
