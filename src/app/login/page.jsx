"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { writeSessionCookie } from "@/lib/session";
import { setCredentials } from "@/redux/slices/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username && password) {
      const trimmed = username.trim();
      const user = { username: trimmed };
      localStorage.setItem("user", JSON.stringify(user));
      dispatch(setCredentials(user));
      writeSessionCookie();
      window.location.href = "/dashboard";
    } else {
      alert("Please fill all fields");
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Security Dashboard
          </h1>
          <p className="text-muted mb-8">
            Login to access network monitoring system
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-5 bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-xl"
          >
            <div>
              <label className="text-sm text-muted">Username</label>
              <input
                type="text"
                className="w-full mt-2 p-3 rounded-lg bg-background border border-border 
                focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted">Password</label>
              <input
                type="password"
                className="w-full mt-2 p-3 rounded-lg bg-background border border-border 
                focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark transition-all py-3 rounded-lg font-semibold text-white shadow-md hover:scale-[1.02]"
            >
              Login
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
            Monitor threats, analyze attacks, and protect your infrastructure in
            real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
