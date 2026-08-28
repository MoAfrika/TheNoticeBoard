import React, { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Briefcase, FileText, TrendingUp, ArrowRight, MapPin, Bookmark, Wifi } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PROVINCES, deadlineInfo, deadlineToneClasses, orgInitials, orgColor, relativePosted } from "@/lib/opportunities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TABS = [
  { key: "tender", label: "Tenders", icon: FileText, tid: "tenders" },
  { key: "rfq", label: "RFQs", icon: FileText, tid: "rfqs" },
  { key: "business", label: "Funding & Supplier", icon: TrendingUp, tid: "funding" },
];

export default function BusinessTenders() {
  const { opportunities, isSaved, toggleSaved } = useApp();
  const [params, setParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState(params.get("cat") || "tender");
  const [province, setProvince] = useState(params.get("province") || "All Provinces");
  const [industry, setIndustry] = useState("");

  const items = useMemo(() => {
    return opportunities.filter(o => {
      if (o.category !== activeCat) return false;
      if (province !== "All Provinces" && o.province !== province) return false;
      if (industry && o.industry !== industry) return false;
      return true;
    }).sort((a, b) => (a.closing_date || "").localeCompare(b.closing_date || ""));
  }, [opportunities, activeCat, province, industry]);

  const industries = useMemo(() => Array.from(new Set(opportunities.filter(o => ["tender", "rfq", "business"].includes(o.category)).map(o => o.industry).filter(Boolean))), [opportunities]);

  return (
    <div>
      {/* Header banner */}
      <section className="border-b border-border bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-70 mb-4"><Briefcase className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Business & Tenders</div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight">Procurement, funding & supplier opportunities — <em className="italic font-normal opacity-90">consolidated.</em></h1>
          <p className="mt-6 max-w-2xl text-primary-foreground/80">Municipal tenders, RFQs, enterprise development grants and supplier programmes from the public and private sectors — surfaced with reference numbers, briefing dates and closing intelligence.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border">
          {TABS.map(t => (
            <button key={t.key} data-testid={`bt-tab-${t.tid}`} onClick={() => { setActiveCat(t.key); const p = new URLSearchParams(params); p.set("cat", t.key); setParams(p, { replace: true }); }}
              className={cn("relative -mb-px px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2",
                activeCat === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <t.icon className="h-4 w-4" /> {t.label}
              <span className="ml-1 text-xs font-mono text-muted-foreground">{opportunities.filter(o => o.category === t.key).length}</span>
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-2">Province</span>
          {PROVINCES.slice(0, 6).map(p => (
            <button key={p} data-testid={`tenders-prov-${p.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setProvince(p)}
              className={cn("text-xs px-2.5 py-1 rounded-full border", province === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>{p}</button>
          ))}
          {industries.length > 0 && (<>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-4 mr-2">Industry</span>
            {industries.map(i => (
              <button key={i} data-testid={`tenders-industry-${i.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setIndustry(industry === i ? "" : i)}
                className={cn("text-xs px-2.5 py-1 rounded-full border", industry === i ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>{i}</button>
            ))}
          </>)}
        </div>

        {/* Results */}
        <div className="mt-8 grid grid-cols-1 gap-3">
          {items.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-12 text-center">
              <div className="font-serif text-2xl">No listings match your filters.</div>
              <p className="text-sm text-muted-foreground mt-2">Try another province or clear the industry filter.</p>
            </div>
          ) : items.map(t => <TenderCard key={t.id} opp={t} onSaveToggle={() => toggleSaved(t.id)} saved={isSaved(t.id)} />)}
        </div>
      </div>
    </div>
  );
}

function TenderCard({ opp, saved, onSaveToggle }) {
  const d = deadlineInfo(opp.closing_date);
  return (
    <article data-testid={`tender-card-${opp.id}`} className="bg-card border border-border rounded-lg card-hover overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-5 sm:p-6">
        <div className="md:w-40 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-md grid place-items-center text-white font-serif text-sm font-bold" style={{ background: orgColor(opp.organisation) }}>
              {orgInitials(opp.organisation)}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{opp.category.toUpperCase()}</div>
          </div>
          {opp.reference_number && (
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">Ref<br /><span className="text-foreground">{opp.reference_number}</span></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link to={`/opportunity/${opp.id}`} className="block">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight tracking-tight">{opp.title}</h3>
            <div className="mt-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{opp.organisation}</span>
              <span className="mx-2">·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.location}</span>
              {opp.remote && <span className="ml-2 inline-flex items-center gap-1 text-xs"><Wifi className="h-3.5 w-3.5" /> Remote</span>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{opp.description}</p>
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border", deadlineToneClasses(d.tone))}>
              {d.urgent && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}{d.label}
            </span>
            {opp.briefing_date && <span className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-1">Briefing: {opp.briefing_date}</span>}
            {opp.salary && <span className="text-[11px] text-muted-foreground">{opp.salary}</span>}
            <span className="ml-auto text-[11px] text-muted-foreground">{relativePosted(opp.posted_date)}</span>
          </div>
        </div>

        <div className="md:w-32 flex md:flex-col gap-2 md:items-end justify-end">
          <Button asChild data-testid={`tender-view-${opp.id}`} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to={`/opportunity/${opp.id}`}>View <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
          </Button>
          <button data-testid={`tender-save-${opp.id}`} onClick={onSaveToggle}
            className={cn("h-9 w-9 grid place-items-center rounded-md border", saved ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        </div>
      </div>
    </article>
  );
}
