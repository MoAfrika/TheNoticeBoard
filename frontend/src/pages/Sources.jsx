import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExternalLink, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { CATEGORY_META } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_META = {
  ok: { label: "Live", tone: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900", icon: CheckCircle2 },
  failed: { label: "Source unavailable", tone: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900", icon: AlertCircle },
  "never-run": { label: "Waiting for first run", tone: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900", icon: Loader2 },
  pending: { label: "Coming soon", tone: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: Clock },
};

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/sources`);
        if (alive) setSources(data);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const live = sources.filter(s => s.live);
  const pending = sources.filter(s => !s.live);
  const okCount = live.filter(s => s.last_status === "ok").length;
  const totalActive = live.reduce((n, s) => n + (s.last_count || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Data integrity</div>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Sources & verification</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">Every opportunity here comes from an official channel we scrape ourselves. If a source is down we say so, and if a source hasn't been built yet, we mark it "coming soon" — we don't fabricate listings.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Live sources" value={`${okCount}/${live.length}`} />
        <Stat label="Verified opportunities in the feed" value={totalActive.toLocaleString()} />
        <Stat label="Planned sources" value={pending.length} />
      </div>

      <div className="editorial-rule mt-10 mb-6" />
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">Live sources</div>
      <div className="space-y-2">
        {loading ? <div className="h-24 bg-secondary/50 animate-pulse rounded-lg" /> : live.map(s => <SourceRow key={s.key} s={s} />)}
      </div>

      <div className="editorial-rule mt-14 mb-6" />
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">Planned sources (coming soon)</div>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">These sources are on the roadmap. Each requires a dedicated scraper because they use different platforms (ASP.NET, Workday, SuccessFactors, PDF circulars, custom SPAs). We're prioritising by demand.</p>
      <div className="space-y-2">
        {loading ? <div className="h-24 bg-secondary/50 animate-pulse rounded-lg" /> : pending.map(s => <SourceRow key={s.key} s={s} />)}
      </div>

      <div className="mt-14 rounded-lg border border-border bg-secondary/30 p-6">
        <div className="font-serif text-xl font-semibold">Our verification promise</div>
        <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-foreground/85">
          <li>· Every listing traces to a named, official source with a public URL.</li>
          <li>· Verified sources are re-scraped every 6 hours; the source health is public on this page.</li>
          <li>· If a source blocks our scraper, we mark it "source unavailable" — we don't fake fallback data.</li>
          <li>· For private employers we require independent verification of the company before publishing.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-border rounded-lg p-5 bg-card">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-3xl font-semibold">{value}</div>
    </div>
  );
}

function SourceRow({ s }) {
  const meta = STATUS_META[s.last_status] || STATUS_META.pending;
  const cat = CATEGORY_META[s.category] || CATEGORY_META.job;
  const Icon = meta.icon;
  return (
    <div data-testid={`source-row-${s.key}`} className={cn("flex flex-col md:flex-row md:items-center gap-3 md:gap-6 p-5 border border-border rounded-lg", s.live ? "bg-card" : "bg-card/60")}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-1">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", cat.tone)}>{cat.label}</span>
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", meta.tone)}>
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          {s.last_count > 0 && <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5">{s.last_count} listings</span>}
        </div>
        <div className="font-serif text-lg font-semibold leading-snug">{s.name}</div>
        <div className="mt-1 text-sm text-muted-foreground">{s.description}</div>
        {s.last_error && s.last_status === "failed" && (
          <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 font-mono truncate">Error: {s.last_error}</div>
        )}
      </div>
      {s.homepage && (
        <a data-testid={`source-link-${s.key}`} href={s.homepage} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border hover:border-primary/40 text-sm shrink-0">
          Official page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
