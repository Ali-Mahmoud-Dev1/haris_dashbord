"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearAuthError, loginUser, selectAuthStatus } from "@/redux/slices/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const submitting = authStatus === "loading";
  const error = localError;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearAuthError());

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setLocalError("Please fill all fields");
      return;
    }

    const result = await dispatch(loginUser({ username: trimmedUser, password }));
    if (loginUser.fulfilled.match(result)) {
      const from =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("from")
          : null;
      const safeFrom =
        from && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";
      router.replace(safeFrom);
      return;
    }

    const message =
      typeof result.payload === "string"
        ? result.payload
        : result.error?.message ?? "Login failed";
    setLocalError(message);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-2">Security Dashboard</h1>
          <p className="text-muted mb-8">Login to access network monitoring system</p>

          <form
            onSubmit={handleLogin}
            className="space-y-5 bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-xl"
          >
            {error ? (
              <p
                className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div>
              <label className="text-sm text-muted" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                disabled={submitting}
                className="w-full mt-2 p-3 rounded-lg bg-background border border-border 
                focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition disabled:opacity-60"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={submitting}
                className="w-full mt-2 p-3 rounded-lg bg-background border border-border 
                focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition disabled:opacity-60"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark transition-all py-3 rounded-lg font-semibold text-white shadow-md hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Login"}
            </button>

            <p className="text-xs text-muted text-center mt-2">
              Protected by AI Security System
            </p>
          </form>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-90"></div>
        <div className="absolute w-[500px] h-[500px] bg-white/20 blur-3xl rounded-full"></div>
        <div className="text-center z-10 px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Network Security</h2>
          <p className="text-white/80 max-w-sm">
            Monitor threats, analyze attacks, and protect your infrastructure in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
