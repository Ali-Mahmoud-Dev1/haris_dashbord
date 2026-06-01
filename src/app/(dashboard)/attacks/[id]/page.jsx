import Link from "next/link";

/**
 * Mock incidents — align IDs with alerts feed; replace with API fetch by `id`.
 * 
 */
const INCIDENTS = {
  "a-1042": {
    attackType: "Port scan",
    ip: "192.168.1.45",
    timeIso: "2026-04-23T12:28:00",
    timeLabel: "2 min ago",
    status: "open",
    severity: "high",
    ruleId: "ET SCAN Potential SSH Scan",
    ruleCategory: "Attempted reconnaissance",
    reason:
      "Outbound SYN packets observed targeting sequential TCP ports on internal VLAN 20 over a 90-second window. Pattern consistent with automated horizontal discovery rather than benign client retries.",
    response: [
      "Temporarily block source IP 192.168.1.45 at the east perimeter ACL group FW-EDGE-EAST.",
      "Rotate session tokens for exposed SSH listeners; verify authorized scanners only.",
      "Capture full PCAP on sensor-east for 15 minutes and attach to this incident.",
    ],
    confidence: "high",
    sources: ["sensor-east", "fw-log-ingest"],
  },
  "a-1041": {
    attackType: "Brute force (SSH)",
    ip: "10.0.0.18",
    timeIso: "2026-04-23T12:14:00",
    timeLabel: "16 min ago",
    status: "investigating",
    severity: "high",
    ruleId: "AUTH_MULTIPLE_FAILURES_SSH",
    ruleCategory: "Credential abuse",
    reason:
      "Twenty-seven failed authentication attempts from the same source against srv-db-02 within five minutes. Usernames rotated across common service accounts (root, admin, postgres).",
    response: [
      "Enable tarpitting / fail2ban-style backoff on jump hosts facing this subnet.",
      "Force MFA verification for any successful SSH from 10.0.0.0/24 for the next 24 h.",
      "Invalidate VPN posture until device MAC is reconciled in NAC.",
    ],
    confidence: "high",
    sources: ["sshd", "jump-box"],
  },
  "a-1040": {
    attackType: "ICMP flood",
    ip: "172.16.0.7",
    timeIso: "2026-04-23T11:30:00",
    timeLabel: "1 h ago",
    status: "open",
    severity: "medium",
    ruleId: "DOS_ICMP_VOLUME_THRESHOLD",
    ruleCategory: "Denial of service",
    reason:
      "ICMP echo reply traffic exceeded baseline by 420% toward resolver-01. TTL and payload entropy suggest scripted flood rather than diagnostic ping.",
    response: [
      "Apply ICMP rate-limit on upstream router interface facing 172.16.0.0/20.",
      "Escalate to ISP if external sourcing confirmed after PCAP review.",
    ],
    confidence: "medium",
    sources: ["sensor-west", "ids"],
  },
  "a-1039": {
    attackType: "DNS amplification",
    ip: "203.0.113.44",
    timeIso: "2026-04-23T09:15:00",
    timeLabel: "3 h ago",
    status: "resolved",
    severity: "medium",
    ruleId: "DNS_RESPONSE_AMPLIFICATION",
    ruleCategory: "Reflection abuse",
    reason:
      "Large UDP DNS responses sourced from open resolver toward WAN without matching internal queries — indicative of reflected amplification toward external victims.",
    response: [
      "ACL deny outbound UDP/53 except to approved upstream resolvers (completed).",
      "Patch BIND recursion settings — verified closed.",
    ],
    confidence: "high",
    sources: ["dns", "firewall"],
  },
  "a-1038": {
    attackType: "ARP mismatch",
    ip: "192.168.1.2",
    timeIso: "2026-04-23T09:00:00",
    timeLabel: "3 h ago",
    status: "resolved",
    severity: "low",
    ruleId: "ARP_TABLE_DRIFT",
    ruleCategory: "Layer-2 anomaly",
    reason:
      "Gateway MAC binding flipped twice within two minutes while DHCP leases remained stable — possible gratuitous ARP spoof attempt or misconfigured hypervisor bridge.",
    response: [
      "Refresh DHCP snooping bindings on access switches VLAN 1.",
      "Document maintenance window if virtualization team migrated default GW.",
    ],
    confidence: "medium",
    sources: ["switch-agg", "dhcp"],
  },
  "a-1037": {
    attackType: "SQL injection attempt",
    ip: "198.51.100.12",
    timeIso: "2026-04-22T18:40:00",
    timeLabel: "18 h ago",
    status: "investigating",
    severity: "high",
    ruleId: "WAF_SQLI_CLASSIC_UNION",
    ruleCategory: "Application exploit",
    reason:
      "WAF flagged UNION SELECT payloads against /api/report/export on web-lb-01. Request URIs matched OWASP SQLi corpus signature set B.",
    response: [
      "Revoke session cookies for affected application tier; rotate DB read credentials.",
      "Deploy temporary GeoIP block on 198.51.100.0/24 pending vendor ASN review.",
    ],
    confidence: "high",
    sources: ["nginx", "waf-edge"],
  },
  "a-1036": {
    attackType: "DDoS (SYN)",
    ip: "192.0.2.55",
    timeIso: "2026-04-22T14:00:00",
    timeLabel: "22 h ago",
    status: "open",
    severity: "critical",
    ruleId: "SYN_FLOOD_MITIGATION",
    ruleCategory: "Denial of service",
    reason:
      "SYN backlog saturation on public VIP exceeded adaptive threshold; legitimate handshake completion rate dropped 61%. Attack sourced from botnet-class prefix churn.",
    response: [
      "Leave SYN cookies enforced on gw-core-01 — monitoring active.",
      "Coordinate with transit provider for remote-triggered blackhole if volume spikes.",
    ],
    confidence: "high",
    sources: ["firewall", "telemetry-ddos"],
  },
};

const statusBadge = {
  open: "bg-primary/12 text-primary border-primary/25",
  investigating: "bg-accent/10 text-accent border-accent/25",
  resolved: "bg-foreground/[0.06] text-muted border-border",
};

const severityBadge = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  high: "bg-primary/12 text-primary border-primary/25",
  medium: "bg-accent/10 text-accent border-accent/25",
  low: "bg-foreground/[0.06] text-muted border-border",
};

function UnknownIncident({ id }) {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-linear-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />
      <div className="rounded-2xl border border-border/90 bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Incident</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Not found</h1>
        <p className="mt-2 font-mono text-sm text-muted">{id}</p>
        <p className="mt-4 text-sm text-muted">
          This ID is not in the current mock dataset. Open an alert from the feed or return to the list.
        </p>
        <Link
          href="/alerts"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Back to alerts
        </Link>
      </div>
    </div>
  );
}

export default async function AttackDetailPage({ params }) {
  const { id } = await params;
  const incident = INCIDENTS[id];

  if (!incident) {
    return <UnknownIncident id={id} />;
  }

  const titleId = `incident-${id}`;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-linear-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-6 sm:space-y-8 pt-0">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/alerts" className="font-medium text-primary hover:text-primary-light transition">
                Alerts
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-mono text-xs text-foreground">{id}</li>
          </ol>
        </nav>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Incident detail
            </p>
            <h1 id={titleId} className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {incident.attackType}
            </h1>
            <p className="font-mono text-sm text-muted">{id}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize tracking-wide ${statusBadge[incident.status]}`}
              >
                {incident.status}
              </span>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize tracking-wide ${severityBadge[incident.severity]}`}
              >
                {incident.severity} severity
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/90 bg-card px-4 py-3 shadow-sm lg:text-right shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Source IP</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">{incident.ip}</p>
            <p className="mt-2 text-xs text-muted">
              Last seen{" "}
              <time dateTime={incident.timeIso} className="tabular-nums font-medium text-foreground">
                {incident.timeLabel}
              </time>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section
              className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm shadow-foreground/5"
              aria-labelledby="rule-heading"
            >
              <h2 id="rule-heading" className="text-base font-semibold text-foreground tracking-tight">
                Detection rule
              </h2>
              <p className="mt-1 text-xs text-muted">{incident.ruleCategory}</p>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Rule ID</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-primary">{incident.ruleId}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Confidence</dt>
                  <dd className="mt-1 capitalize text-sm text-foreground">{incident.confidence}</dd>
                </div>
              </dl>
            </section>

            <section
              className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm shadow-foreground/5"
              aria-labelledby="reason-heading"
            >
              <h2 id="reason-heading" className="text-base font-semibold text-foreground tracking-tight">
                Why this was flagged
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{incident.reason}</p>
            </section>

            <section
              className="rounded-2xl border border-border/90 bg-linear-to-b from-primary/6 to-card p-5 sm:p-6 shadow-sm shadow-foreground/5 ring-1 ring-primary/15"
              aria-labelledby="response-heading"
            >
              <h2 id="response-heading" className="text-base font-semibold text-foreground tracking-tight">
                Recommended response
              </h2>
              <ul className="mt-4 list-none space-y-3">
                {incident.response.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-foreground">{step}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                For playbook automation, wire these steps to{" "}
                <Link href="/response" className="font-semibold text-primary hover:text-primary-light">
                  Response actions
                </Link>
                .
              </p>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Data sources</h3>
              <ul className="mt-3 space-y-2">
                {incident.sources.map((s) => (
                  <li key={s}>
                    <span className="font-mono text-xs font-medium text-primary">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Shortcuts</h3>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/logs"
                  className="rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  Search related logs
                </Link>
                <Link
                  href="/alerts"
                  className="rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  All alerts
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
