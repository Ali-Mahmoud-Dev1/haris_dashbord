"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";

const FEATURE_LABELS = [
  { key: "dashboard", label: "Dashboard overview" },
  { key: "alerts", label: "Alerts & incidents" },
  { key: "logs", label: "Logs & syslog stream" },
  { key: "analysis", label: "Network / ARP analysis" },
  { key: "simulation", label: "Simulation lab" },
  { key: "response", label: "Response playbooks" },
];


const MATRIX = {
  admin: {
    dashboard: true,
    alerts: true,
    logs: true,
    analysis: true,
    simulation: true,
    response: true,
  },
  engineer: {
    dashboard: true,
    alerts: true,
    logs: true,
    analysis: true,
    simulation: false,
    response: true,
  },
  student: {
    dashboard: true,
    alerts: false,
    logs: false,
    analysis: false,
    simulation: true,
    response: false,
  },
};

function inferRole(user) {
  if (!user) return "student";
  if (user.role === "admin" || user.role === "engineer" || user.role === "student") {
    return user.role;
  }
  const u = user.username.toLowerCase();
  if (u.includes("admin")) return "admin";
  if (u.includes("engineer") || u.includes("soc") || u.includes("analyst")) return "engineer";
  return "student";
}

const roleBadge = {
  admin: "bg-primary/12 text-primary border-primary/25",
  engineer: "bg-accent/10 text-accent border-accent/25",
  student: "bg-foreground/[0.06] text-muted border-border",
};

export default function ProfilePage() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const role = useMemo(() => inferRole(user), [user]);
  const flags = MATRIX[role];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-1 sm:px-0">
      <div
        className="absolute left-0 right-0 -top-4 sm:-top-2 h-px max-w-7xl mx-auto bg-linear-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="space-y-6 sm:space-y-8 pt-0">
        <header className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Account</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Profile</h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Session identity from your login and the lab&apos;s default capability matrix. Replace with server claims when IAM is wired.
          </p>
        </header>

        {!isAuthenticated || !user ? (
          <div className="rounded-2xl border border-border/90 bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-foreground">No active session in Redux</p>
            <p className="mt-2 text-xs text-muted">Sign in again to hydrate profile state.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-dark"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-border/90 bg-linear-to-b from-card to-card/95 p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Signed in as</h2>
                <p className="mt-3 text-2xl font-bold font-mono text-foreground break-all">{user.username}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Effective role</span>
                  <span
                    className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-bold capitalize ${roleBadge[role]}`}
                  >
                    {role}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Role is taken from <code className="rounded bg-background px-1 py-0.5 font-mono text-[10px]">user.role</code> when present; otherwise inferred from username keywords for demo (
                  <span className="font-mono">admin</span>, <span className="font-mono">engineer</span>
                  , …).
                </p>
              </div>

              <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Session</h2>
                <ul className="mt-4 space-y-2 text-xs text-muted">
                  <li className="flex justify-between gap-2 border-b border-border/50 pb-2">
                    <span>Auth source</span>
                    <span className="font-medium text-foreground">LocalStorage + cookie</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-border/50 pb-2">
                    <span>Redux</span>
                    <span className="font-medium text-foreground">auth slice</span>
                  </li>
                  <li className="flex justify-between gap-2 pt-1">
                    <span>MFA</span>
                    <span className="font-medium text-muted">Not configured</span>
                  </li>
                </ul>
              </div>
            </section>

            <section
              className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden"
              aria-labelledby="perm-heading"
            >
              <div className="border-b border-border/70 bg-background/35 px-5 py-4 backdrop-blur-sm">
                <h2 id="perm-heading" className="text-base font-semibold text-foreground">
                  Capability matrix
                </h2>
                <p className="mt-1 text-xs text-muted">Feature gates for this demo role — adjust in code or API.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-border/70 bg-card text-[11px] font-bold uppercase tracking-wider text-muted">
                    <tr>
                      <th scope="col" className="px-5 py-3 pl-6">
                        Feature
                      </th>
                      <th scope="col" className="px-5 py-3 text-center w-28">
                        Access
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {FEATURE_LABELS.map((f) => (
                      <tr key={f.key} className="hover:bg-primary/3">
                        <td className="px-5 py-3 pl-6 text-foreground">{f.label}</td>
                        <td className="px-5 py-3 text-center">
                          {flags[f.key] ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-bold text-primary">
                              Allowed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/6 px-2 py-0.5 text-[11px] font-semibold text-muted">
                              Denied
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
