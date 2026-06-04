"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { loadAuthSession } from "@/lib/authStorage";
import {
  approveResponseAction,
  generateResponsePreview,
  getResponseActions,
  markResponseExecuted,
  postponeResponseAction,
  rejectResponseAction,
} from "@/lib/harisApi";

function mapAction(item) {
  return {
    id: String(item.id),
    title: item.title || item.action_type || "Response action",
    context: item.description || item.context || item.approval_status || "Suggested response",
    platform: item.platform || "Cisco IOS",
    command: Array.isArray(item.cisco_ios_commands)
      ? item.cisco_ios_commands.join("\n")
      : item.command || "",
    notes: item.notes || item.execution_notes || item.approval_status || "",
    approvalStatus: item.approval_status || "pending",
  };
}

export default function ResponsePage() {
  const [items, setItems] = useState([]);
  const [preview, setPreview] = useState(null);
  const [copiedId, setCopiedId] = useState(/** @type {string | null} */ (null));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewForm, setPreviewForm] = useState({
    attack_type: "port_scan",
    source_ip: "192.168.20.15",
    destination_ip: "192.168.30.10",
  });

  const role = loadAuthSession()?.user?.role;
  const canManage = role === "ADMIN" || role === "NETWORK_ADMIN";

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getResponseActions();
      setItems(data.results.map(mapAction));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Response actions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const copyCommand = useCallback(async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt("Copy command:", text);
    }
  }, []);

  const runAction = async (id, action) => {
    if (!canManage) return;
    try {
      if (action === "approve") await approveResponseAction(id);
      if (action === "reject") await rejectResponseAction(id);
      if (action === "postpone") await postponeResponseAction(id);
      if (action === "executed") await markResponseExecuted(id, "Marked from dashboard.");
      setError("");
      await loadActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const data = await generateResponsePreview({
        attack_type: previewForm.attack_type,
        source_ip: previewForm.source_ip,
        destination_ip: previewForm.destination_ip,
        evidence: {},
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div className="space-y-6 sm:space-y-8 pt-0">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Playbooks</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Response actions</h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Actions from <code className="text-xs">responses/actions</code> and preview via{" "}
              <code className="text-xs">responses/generate-preview</code>.
            </p>
            {error ? <p className="text-xs text-primary pt-1">{error}</p> : null}
          </div>
          <Link
            href="/alerts"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border/90 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:border-primary/30"
          >
            Back to alerts
          </Link>
        </header>

        <section className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Generate preview</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              className="rounded-xl border border-border/90 px-3 py-2 text-sm"
              value={previewForm.attack_type}
              onChange={(e) => setPreviewForm((f) => ({ ...f, attack_type: e.target.value }))}
              placeholder="attack_type"
            />
            <input
              className="rounded-xl border border-border/90 px-3 py-2 text-sm font-mono"
              value={previewForm.source_ip}
              onChange={(e) => setPreviewForm((f) => ({ ...f, source_ip: e.target.value }))}
              placeholder="source_ip"
            />
            <input
              className="rounded-xl border border-border/90 px-3 py-2 text-sm font-mono"
              value={previewForm.destination_ip}
              onChange={(e) => setPreviewForm((f) => ({ ...f, destination_ip: e.target.value }))}
              placeholder="destination_ip"
            />
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {previewLoading ? "Loading…" : "Generate preview"}
          </button>
          {preview ? (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-4 font-mono text-xs">
              {JSON.stringify(preview, null, 2)}
            </pre>
          ) : null}
        </section>

        {items.length === 0 && !loading ? (
          <p className="text-center text-sm text-muted py-8">No response actions from the API.</p>
        ) : null}

        <ul className="space-y-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {item.platform} · {item.approvalStatus}
                  </p>
                  <p className="mt-2 text-sm text-muted">{item.context}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCommand(item.id, item.command)}
                  className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
                >
                  {copiedId === item.id ? "Copied" : "Copy commands"}
                </button>
              </div>
              {canManage ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {["approve", "reject", "postpone", "executed"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => runAction(item.id, action)}
                      className="rounded-lg border border-border/80 px-3 py-1.5 text-xs font-semibold capitalize"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}
              <pre className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-4 font-mono text-[11px]">
                {item.command || "—"}
              </pre>
              <p className="mt-3 text-xs text-muted">{item.notes}</p>
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-muted pb-2">
          {loading ? "Loading response actions…" : `${items.length} action(s) from API.`}
        </p>
      </div>
    </div>
  );
}
