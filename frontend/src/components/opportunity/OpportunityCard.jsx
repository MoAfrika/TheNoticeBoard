import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin, ExternalLink, ShieldCheck, Star, Wifi } from "lucide-react";
import { CATEGORY_META, deadlineInfo, deadlineToneClasses, relativePosted, orgInitials, orgColor } from "@/lib/opportunities";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function OpportunityCard({ opp, variant = "default" }) {
  const { isSaved, toggleSaved, markViewed } = useApp();
  const saved = isSaved(opp.id);
  const cat = CATEGORY_META[opp.category] || CATEGORY_META.job;
  const d = deadlineInfo(opp.closing_date);
  const isTender = opp.category === "tender" || opp.category === "rfq";

  return (
    <article data-testid={`opportunity-card-${opp.id}`}
      className="group relative bg-card border border-border rounded-lg card-hover overflow-hidden">
      {opp.featured && (
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent via-accent to-accent/60" />
      )}
      <Link to={`/opportunity/${opp.id}`} onClick={() => markViewed(opp.id)} className="block p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-11 w-11 rounded-md grid place-items-center text-white font-serif text-sm font-bold"
               style={{ background: orgColor(opp.organisation) }}>
            {orgInitials(opp.organisation)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", cat.tone)}>
                {cat.label}
              </span>
              {opp.source_type === "official" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-emerald-800 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                  <ShieldCheck className="h-3 w-3" /> Official
                </span>
              )}
              {opp.featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {opp.remote && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Wifi className="h-3 w-3" /> Remote
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors">
              {opp.title}
            </h3>
            <div className="mt-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{opp.organisation}</span>
              <span className="mx-2 text-border">·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.location}</span>
            </div>

            {isTender && opp.reference_number && (
              <div className="mt-2 text-[11px] font-mono text-muted-foreground">Ref: {opp.reference_number}</div>
            )}

            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{opp.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border", deadlineToneClasses(d.tone))}>
                {d.urgent && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}
                {d.label}
              </span>
              {opp.experience_level && (
                <span className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-1">{opp.experience_level}</span>
              )}
              {opp.salary && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{opp.salary}</span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline">{relativePosted(opp.posted_date)}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute top-4 right-4 flex items-center gap-1">
        {typeof opp.match_score === "number" && (
          <div data-testid={`match-score-${opp.id}`} className="hidden sm:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur px-2 py-0.5 text-[10px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {opp.match_score}% match
          </div>
        )}
        <button data-testid={`save-btn-${opp.id}`} onClick={(e) => { e.preventDefault(); toggleSaved(opp.id); }}
          className={cn("h-8 w-8 grid place-items-center rounded-full border transition-colors",
            saved ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 backdrop-blur border-border hover:border-primary/40")} aria-label={saved ? "Unsave" : "Save"}>
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        </button>
      </div>
    </article>
  );
}
