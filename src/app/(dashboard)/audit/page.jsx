"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuditLogs, logs as auditLogsApi } from "@/lib/harisApi";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export default function AuditPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs();
      setRows(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit logs could not be loaded.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0 space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Compliance</p>
        <h1 className="text-3xl font-bold text-foreground">Audit log</h1>
        <p className="text-sm text-muted">GET audit/logs · audit/logs/{"{id}"}</p>
        {error ? <p className="text-xs text-primary">{error}</p> : null}
      </header>

      <section className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/70 px-5 py-3 text-sm text-muted">
          {loading ? "Loading…" : `${rows.length} entries`}
        </div>
        {rows.length === 0 && !loading ? (
          <p className="p-8 text-center text-sm text-muted">No audit entries from API.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border/80 text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-primary/[0.03]">
                    <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono">
                      {row.actor_username ?? row.actor ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs">{row.action}</td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {row.resource_type} / {row.resource_id}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{row.ip_address ?? "—"}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const detail = await auditLogsApi.get(row.id);
                            setSelected(detail);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Detail failed.");
                          }
                        }}
                        className="text-xs font-bold text-primary"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <section className="rounded-2xl border border-border/90 bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">Entry #{selected.id}</h2>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(selected, null, 2)}</pre>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-3 text-xs font-bold text-muted"
          >
            Close
          </button>
        </section>
      ) : null}
    </div>
  );
}
