"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

/** Mock playbook snippets — ربط مع الحوادث الفعلية لاحقًا */
const RESPONSE_ITEMS = [
  {
    id: "rsp-01",
    title: "Block hostile IPv4 (perimeter ACL)",
    context: "Source 192.168.1.45 — correlated port-scan incident",
    platform: "Cisco IOS / IOS-XE style",
    command:
      "ip access-list extended HARES-DENY-HOSTS\n deny ip host 192.168.1.45 any log\n permit ip any any",
    notes:
      "Apply to inbound ACL on WAN-facing SVI or zone firewall pair; replace object-group when scaling.",
  },
  {
    id: "rsp-02",
    title: "iptables drop (Linux edge)",
    context: "Same source — transient lab enforce until ACL push completes",
    platform: "nftables / iptables legacy",
    command: "iptables -I INPUT -s 192.168.1.45 -j DROP\niptables -I FORWARD -s 192.168.1.45 -j DROP",
    notes: "Persist with netfilter-persistent or Ansible role; log DROP separately for SOC audit.",
  },
  {
    id: "rsp-03",
    title: "Rate-limit ICMP toward resolver",
    context: "172.16.0.7 — ICMP flood mitigation playbook excerpt",
    platform: "JunOS / policy-options",
    command:
      "set firewall family inet filter ICMP_POLICER term LIMIT icmp-type echo-request\nset firewall family inet filter ICMP_POLICER term LIMIT policer icmp-rate-limit",
    notes: "Tune burst/commit interval from baseline PCAP; pair with NetFlow anomaly alerts.",
  },
  {
    id: "rsp-04",
    title: "SSH brute-force tarpit",
    context: "10.0.0.18 — jump host protection window",
    platform: "sshd + fail2ban",
    command:
      "[DEFAULT]\nbantime = 3600\nfindtime = 300\nmaxretry = 8\n[sshd]\nenabled = true\nbackend = systemd",
    notes: "Ensure centralized ban sync if multiple bastions; notify IAM if corporate VLAN overlap.",
  },
];

export default function ResponsePage() {
  const [copiedId, setCopiedId] = useState(/** @type {string | null} */ (null));

  const copyCommand = useCallback(async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt("Copy command:", text);
    }
  }, []);

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
              Playbooks
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Response actions
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Vendor-style command drafts you can paste into change tickets. Always validate against your
              golden configs — nothing here executes automatically.
            </p>
          </div>
          <Link
            href="/alerts"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border/90 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Back to alerts
          </Link>
        </header>

        <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted">
          <span className="font-semibold text-accent">SOC reminder:</span> approvals, maintenance windows,
          and peer review apply before pasting ACL or firewall changes into production.
        </div>

        <ul className="space-y-5">
          {RESPONSE_ITEMS.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/90 bg-linear-to-b from-card to-card/95 p-5 sm:p-6 shadow-sm shadow-foreground/5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{item.platform}</p>
                  <p className="mt-2 text-sm text-muted">{item.context}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCommand(item.id, item.command)}
                  className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {copiedId === item.id ? "Copied" : "Copy commands"}
                </button>
              </div>

              <pre className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-4 font-mono text-[11px] leading-relaxed text-foreground sm:text-xs">
                {item.command}
              </pre>

              <p className="mt-3 text-xs leading-relaxed text-muted">{item.notes}</p>
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-muted pb-2">
          Incident narratives live under{" "}
          <Link href="/attacks/a-1042" className="font-semibold text-primary hover:text-primary-light">
            Attack details
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
