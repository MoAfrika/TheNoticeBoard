import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Wifi, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import { CATEGORIES, PROVINCES, EXPERIENCE_LEVELS, deadlineInfo } from "@/lib/opportunities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function Discover() {
  const { opportunities, loading } = useApp();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("cat") || "all");
  const [province, setProvince] = useState(params.get("province") || "All Provinces");
  const [remote, setRemote] = useState(params.get("remote") === "true");
  const [experience, setExperience] = useState(params.get("exp") || "");
  const [closingFilter, setClosingFilter] = useState(params.get("closing") || "any");
  const [sort, setSort] = useState("closing");

  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category !== "all") next.set("cat", category);
    if (province !== "All Provinces") next.set("province", province);
    if (remote) next.set("remote", "true");
    if (experience) next.set("exp", experience);
    if (closingFilter !== "any") next.set("closing", closingFilter);
    setParams(next, { replace: true });
  }, [q, category, province, remote, experience, closingFilter, setParams]);

  const filtered = useMemo(() => {
    let list = opportunities.slice();
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(o => (o.title + " " + o.organisation + " " + o.description + " " + (o.tags||[]).join(" ")).toLowerCase().includes(s));
    }
    if (category !== "all") list = list.filter(o => o.category === category);
    if (province !== "All Provinces") list = list.filter(o => o.province === province);
    if (remote) list = list.filter(o => o.remote);
    if (experience) list = list.filter(o => o.experience_level === experience);
    if (closingFilter === "soon") list = list.filter(o => deadlineInfo(o.closing_date).urgent || deadlineInfo(o.closing_date).label.includes("this week"));
    if (sort === "closing") list.sort((a, b) => (a.closing_date || "").localeCompare(b.closing_date || ""));
    if (sort === "newest") list.sort((a, b) => (b.posted_date || "").localeCompare(a.posted_date || ""));
    if (sort === "match") list.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    return list;
  }, [opportunities, q, category, province, remote, experience, closingFilter, sort]);

  const clearAll = () => { setQ(""); setCategory("all"); setProvince("All Provinces"); setRemote(false); setExperience(""); setClosingFilter("any"); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Opportunity Feed</div>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Discover</h1>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-lg">
        <div className="pl-3"><Search className="h-4 w-4 text-muted-foreground" /></div>
        <Input data-testid="discover-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles, organisations, tags…" className="border-0 h-11 shadow-none focus-visible:ring-0" />
        <Sheet>
          <SheetTrigger asChild>
            <Button data-testid="mobile-filters-trigger" variant="outline" className="lg:hidden h-11 gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] sm:w-96 overflow-y-auto">
            <SheetHeader><SheetTitle className="font-serif text-2xl">Filters</SheetTitle></SheetHeader>
            <FiltersPanel {...{ category, setCategory, province, setProvince, remote, setRemote, experience, setExperience, closingFilter, setClosingFilter }} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Filter rail — desktop */}
        <aside data-testid="filter-rail" className="hidden lg:block">
          <FiltersPanel {...{ category, setCategory, province, setProvince, remote, setRemote, experience, setExperience, closingFilter, setClosingFilter }} />
          <button data-testid="clear-filters" onClick={clearAll} className="mt-6 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><X className="h-3 w-3" /> Clear filters</button>
        </aside>

        {/* Results */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> opportunities
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs">Sort by</span>
              {[
                { key: "closing", label: "Closing soon" },
                { key: "newest", label: "Newest" },
                { key: "match", label: "Best match" },
              ].map(s => (
                <button key={s.key} data-testid={`sort-${s.key}`} onClick={() => setSort(s.key)}
                  className={cn("px-2.5 py-1 rounded border text-xs", sort === s.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-lg bg-secondary/50 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div data-testid="empty-state" className="border border-dashed border-border rounded-lg p-12 text-center">
              <div className="font-serif text-2xl">No matches yet</div>
              <p className="mt-2 text-sm text-muted-foreground">Try clearing filters or broadening your search.</p>
              <Button className="mt-6" onClick={clearAll} data-testid="empty-clear-btn">Clear all filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((o) => <OpportunityCard key={o.id} opp={o} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FiltersPanel({ category, setCategory, province, setProvince, remote, setRemote, experience, setExperience, closingFilter, setClosingFilter }) {
  return (
    <div className="space-y-8 mt-4">
      <FilterBlock title="Category">
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(c => (
            <button key={c.key} data-testid={`filter-cat-${c.key}`} onClick={() => setCategory(c.key)}
              className={cn("text-left px-2 py-1.5 rounded text-sm transition-colors", category === c.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground")}>
              {c.label}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Province">
        <div className="flex flex-wrap gap-1.5">
          {PROVINCES.map(p => (
            <button key={p} data-testid={`filter-prov-${p.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setProvince(p)}
              className={cn("text-xs px-2.5 py-1 rounded-full border", province === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
              {p}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Experience">
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map(e => (
            <button key={e} data-testid={`filter-exp-${e.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setExperience(experience === e ? "" : e)}
              className={cn("text-xs px-2.5 py-1 rounded-full border", experience === e ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
              {e}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Options">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox data-testid="filter-remote" checked={remote} onCheckedChange={setRemote} />
          <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> Remote only</span>
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox data-testid="filter-closing-soon" checked={closingFilter === "soon"} onCheckedChange={(v) => setClosingFilter(v ? "soon" : "any")} />
          <span>Closing soon</span>
        </label>
      </FilterBlock>
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}
