"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDetectionJob,
  jobs,
  rerunDetectionJob,
  rules,
  runDetection,
  scheduleDetectionPreview,
  toggleDetectionRule,
} from "@/lib/harisApi";

export default function DetectionPage() {
  const [ruleRows, setRuleRows] = useState([]);
  const [jobRows, setJobRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [lastJob, setLastJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rulesData, jobsData] = await Promise.all([rules.list(), jobs.list()]);
      setRuleRows(rulesData.results);
      setJobRows(jobsData.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async () => {
    try {
      const result = await runDetection({ async: false });
      setSuccess(`Detection run: job ${result.job_id ?? result.id ?? "—"}`);
      setLastJob(result);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed.");
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0 space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Detection</p>
        <h1 className="text-3xl font-bold text-foreground">Rules & jobs</h1>
        <p className="text-sm text-muted">detection/rules · run · jobs · schedule-preview</p>
        {error ? <p className="text-xs text-primary">{error}</p> : null}
        {success ? <p className="text-xs text-accent">{success}</p> : null}
      </header>

      <section className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRun}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          POST detection/run
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              const data = await scheduleDetectionPreview({});
              setPreview(data);
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Schedule preview failed.");
            }
          }}
          className="rounded-xl border border-border px-4 py-2 text-xs font-bold"
        >
          Schedule preview
        </button>
      </section>

      {preview ? (
        <pre className="rounded-2xl border border-border/90 bg-card p-4 text-xs overflow-x-auto">
          {JSON.stringify(preview, null, 2)}
        </pre>
      ) : null}

      {lastJob ? (
        <pre className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
          {JSON.stringify(lastJob, null, 2)}
        </pre>
      ) : null}

      <section className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 text-sm font-semibold border-b border-border/70">
          Rules {loading ? "…" : `(${ruleRows.length})`}
        </h2>
        <ul className="divide-y divide-border/50">
          {ruleRows.map((r) => (
            <li key={r.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{r.name ?? r.rule_type}</p>
                <p className="text-xs text-muted">
                  {r.rule_type} · {r.severity} · active: {String(r.is_active)}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await toggleDetectionRule(r.id);
                  await load();
                }}
                className="text-xs font-bold text-primary"
              >
                PATCH toggle
              </button>
            </li>
          ))}
          {!loading && ruleRows.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted">No rules.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 text-sm font-semibold border-b border-border/70">
          Jobs {loading ? "…" : `(${jobRows.length})`}
        </h2>
        <ul className="divide-y divide-border/50">
          {jobRows.map((j) => (
            <li key={j.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold">#{j.id}</p>
                <p className="text-xs text-muted">
                  {j.status} · logs {j.logs_processed} · alerts {j.alerts_created}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const detail = await getDetectionJob(j.id);
                    setLastJob(detail);
                  }}
                  className="text-xs font-bold text-muted"
                >
                  GET detail
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await rerunDetectionJob(j.id);
                    setSuccess(`Rerun job ${j.id}`);
                    await load();
                  }}
                  className="text-xs font-bold text-primary"
                >
                  Rerun
                </button>
              </div>
            </li>
          ))}
          {!loading && jobRows.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted">No jobs yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
