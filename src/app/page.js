"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>

      {/* Glow Effect */}
      <div className="absolute w-[500px] h-[500px] bg-primary/20 blur-3xl rounded-full"></div>

      {/* Content */}
      <div className="text-center z-10 max-w-2xl">

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
           Powered <span className="text-primary">Security Dashboard</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted text-lg mb-8">
          Monitor threats, analyze attacks, and protect your infrastructure
          in real-time with intelligent security tools.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <Link
            href="/login"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
          >
            Get Started
          </Link>

          <Link
            href="/dashboard"
            className="border border-border hover:border-primary px-6 py-3 rounded-xl font-semibold transition-all hover:text-primary"
          >
            View Demo
          </Link>

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 text-xs text-muted">
        © 2026 Haris Security System
      </div>
    </div>
  );
}