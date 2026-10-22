import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const steps = [
  { to: "/upload", label: "Source" },
  { to: "/job", label: "Job" },
  { to: "/review", label: "Review" },
  { to: "/download", label: "Export" },
] as const;

export function PageShell({ children, step, title, subtitle }: { children: ReactNode; step?: number; title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">ATS<span className="text-muted-foreground">/</span>Resume</Link>
          {step !== undefined && (
            <nav className="hidden gap-1 md:flex">
              {steps.map((s, i) => (
                <Link key={s.to} to={s.to} className={`rounded-full px-3 py-1 text-sm ${i === step ? "bg-primary text-primary-foreground" : i < step ? "text-foreground" : "text-muted-foreground"}`}>
                  {i + 1}. {s.label}
                </Link>
              ))}
            </nav>
          )}
          <span className="text-xs text-muted-foreground">3 generations / day</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {title && (
          <div className="mb-8">
            <h1 className="text-5xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
