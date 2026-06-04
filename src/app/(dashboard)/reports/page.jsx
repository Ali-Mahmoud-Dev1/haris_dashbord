"use client";

import { useState } from "react";
import {
  downloadAlertsCsv,
  downloadLogsCsv,
  getIncidentsSummaryReport,
  getSecurityReport,
} from "@/lib/harisApi";

export default function ReportsPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [incidentsJson, setIncidentsJson] = useState(null);
  const [securityJson, setSecurityJson] = useState(null);

  const run = async (key, fn) => {
    setLoading(key);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0 space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Reports</p>
        <h1 className="text-3xl font-bold text-foreground">Exports & summaries</h1>
        <p className="text-sm text-muted">reports/alerts.csv · logs.csv · incidents-summary · security-report</p>
        {error ? <p className="text-xs text-primary">{error}</p> : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">CSV downloads</h2>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={loading === "alerts-csv"}
              onClick={() => run("alerts-csv", () => downloadAlertsCsv())}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              {loading === "alerts-csv" ? "Downloading…" : "Download alerts.csv"}
            </button>
            <button
              type="button"
              disabled={loading === "logs-csv"}
              onClick={() => run("logs-csv", () => downloadLogsCsv())}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              {loading === "logs-csv" ? "Downloading…" : "Download logs.csv"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">JSON reports</h2>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={loading === "incidents"}
              onClick={() =>
                run("incidents", async () => {
                  const data = await getIncidentsSummaryReport();
                  setIncidentsJson(data);
                })
              }
              className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
            >
              Load incidents-summary.json
            </button>
            <button
              type="button"
              disabled={loading === "security"}
              onClick={() =>
                run("security", async () => {
                  const data = await getSecurityReport();
                  setSecurityJson(data);
                })
              }
              className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
            >
              Load security-report
            </button>
          </div>
        </div>
      </section>

      {incidentsJson ? (
        <section className="rounded-2xl border border-border/90 bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">Incidents summary</h2>
          <pre className="text-xs overflow-x-auto max-h-96">{JSON.stringify(incidentsJson, null, 2)}</pre>
        </section>
      ) : null}

      {securityJson ? (
        <section className="rounded-2xl border border-border/90 bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">Security report</h2>
          <pre className="text-xs overflow-x-auto max-h-96">{JSON.stringify(securityJson, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  );
}
