"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addIncidentNote,
  closeIncident,
  fetchIncident,
  fetchIncidentTimeline,
  markIncidentFalsePositive,
  markIncidentResolved,
  selectCurrentIncident,
  selectIncidentActionError,
  selectIncidentActionLoading,
  selectIncidentError,
  selectIncidentTimeline,
  startIncidentReview,
  suggestIncidentResponse,
} from "@/redux/slices/attacksSlice";

const statusBadge = {
  new: "bg-primary/12 text-primary border-primary/25",
  open: "bg-primary/12 text-primary border-primary/25",
  investigating: "bg-accent/10 text-accent border-accent/25",
  reviewing: "bg-accent/10 text-accent border-accent/25",
  resolved: "bg-foreground/[0.06] text-muted border-border",
  closed: "bg-foreground/[0.06] text-muted border-border",
};

const severityBadge = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  high: "bg-primary/12 text-primary border-primary/25",
  medium: "bg-accent/10 text-accent border-accent/25",
  low: "bg-foreground/[0.06] text-muted border-border",
};

function UnknownIncident({ id, error }) {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-1 sm:px-0">
      <div className="rounded-2xl border border-border/90 bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Incident</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Not found</h1>
        <p className="mt-2 font-mono text-sm text-muted">{id}</p>
        <p className="mt-4 text-sm text-muted">
          {error || "This alert could not be loaded from the API. Return to the alerts list."}
        </p>
        <Link
          href="/alerts"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark"
        >
          Back to alerts
        </Link>
      </div>
    </div>
  );
}

export default function AttackDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const dispatch = useAppDispatch();

  const incident = useAppSelector(selectCurrentIncident);
  const timeline = useAppSelector(selectIncidentTimeline);
  const status = useAppSelector(selectIncidentStatus);
  const loadError = useAppSelector(selectIncidentError);
  const actionError = useAppSelector(selectIncidentActionError);
  const actionLoading = useAppSelector(selectIncidentActionLoading);
  const error = actionError || loadError || "";

  const loading = status === "loading" || status === "idle";
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!id) return;
    dispatch(fetchIncident(id));
    dispatch(fetchIncidentTimeline(id));
  }, [dispatch, id]);

  const handleAddNote = async () => {
    const message = noteText.trim();
    if (!message) return;
    const result = await dispatch(addIncidentNote({ id, message }));
    if (addIncidentNote.fulfilled.match(result)) {
      setNoteText("");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center text-sm text-muted">Loading incident…</div>
    );
  }

  if (!incident) {
    return <UnknownIncident id={id} error={loadError} />;
  }

  const titleId = `incident-${id}`;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div className="space-y-6 sm:space-y-8 pt-0">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/alerts" className="font-medium text-primary hover:text-primary-light">
                Alerts
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-mono text-xs text-foreground">{id}</li>
          </ol>
        </nav>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Incident detail</p>
            <h1 id={titleId} className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {incident.attackType}
            </h1>
            <p className="font-mono text-sm text-muted">{id}</p>
            {error ? <p className="text-xs text-primary">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize ${statusBadge[incident.status] ?? statusBadge.open}`}
              >
                {incident.status}
              </span>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize ${severityBadge[incident.severity] ?? severityBadge.low}`}
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

        <section className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Workflow</h2>
          <p className="text-xs text-muted mt-1">haris_api_contract — incidents/alerts workflow</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => dispatch(startIncidentReview(id))}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              Start review
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => dispatch(markIncidentResolved(id))}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              Mark resolved
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => dispatch(markIncidentFalsePositive(id))}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              False positive
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => dispatch(closeIncident(id))}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => dispatch(suggestIncidentResponse(id))}
              className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
            >
              Suggest response
            </button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Analyst note…"
              className="flex-1 rounded-xl border border-border/90 bg-background/60 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={actionLoading || !noteText.trim()}
              onClick={handleAddNote}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Add note
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Detection rule</h2>
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

            <section className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Why this was flagged</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{incident.reason}</p>
            </section>

            <section className="rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm ring-1 ring-primary/15">
              <h2 className="text-base font-semibold text-foreground">Recommended response</h2>
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
              <Link href="/response" className="mt-4 inline-block text-xs font-semibold text-primary">
                Open response actions →
              </Link>
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Timeline</h3>
              {timeline.length === 0 ? (
                <p className="mt-3 text-xs text-muted">No timeline events yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {timeline.map((event, index) => (
                    <li key={event.id ?? index} className="text-xs text-muted border-l-2 border-primary/30 pl-2">
                      {event.message || event.action || event.status || event.notes || "Event"}
                      {event.created_at ? (
                        <span className="block text-[10px] mt-0.5 opacity-80">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Shortcuts</h3>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/logs" className="rounded-xl border border-border/80 px-3 py-2 text-sm font-semibold hover:border-primary/30">
                  Search related logs
                </Link>
                <Link href="/alerts" className="rounded-xl border border-border/80 px-3 py-2 text-sm font-semibold hover:border-primary/30">
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
