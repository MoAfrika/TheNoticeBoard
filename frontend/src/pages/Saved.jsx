import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, History, Clock, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import { deadlineInfo } from "@/lib/opportunities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOLDERS = [
  { key: "all", label: "All saved" },
  { key: "closing", label: "Closing soon" },
  { key: "recent", label: "Recently viewed" },
];

export default function Saved() {
  const { opportunities, savedIds, recentIds } = useApp();
  const [tab, setTab] = useState("all");

  const savedOpps = useMemo(() => opportunities.filter(o => savedIds.includes(o.id)), [opportunities, savedIds]);
  const recentOpps = useMemo(() => recentIds.map(id => opportunities.find(o => o.id === id)).filter(Boolean), [opportunities, recentIds]);
  const closingSaved = useMemo(() => savedOpps.filter(o => deadlineInfo(o.closing_date).urgent), [savedOpps]);

  const list = tab === "recent" ? recentOpps : tab === "closing" ? closingSaved : savedOpps;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">My workspace</div>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Saved opportunities</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">Your personal opportunity workspace. Saved locally to your device and synced when you set up alerts.</p>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
        {FOLDERS.map(f => (
          <button key={f.key} data-testid={`saved-tab-${f.key}`} onClick={() => setTab(f.key)}
            className={cn("relative -mb-px px-4 py-3 text-sm font-medium border-b-2",
              tab === f.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {f.key === "recent" ? <History className="inline h-4 w-4 mr-1.5 -mt-0.5" /> :
             f.key === "closing" ? <Clock className="inline h-4 w-4 mr-1.5 -mt-0.5" /> :
             <Bookmark className="inline h-4 w-4 mr-1.5 -mt-0.5" />}
            {f.label}
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {f.key === "recent" ? recentOpps.length : f.key === "closing" ? closingSaved.length : savedOpps.length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {list.length === 0 ? (
          <div data-testid="saved-empty" className="border border-dashed border-border rounded-lg p-12 text-center">
            <div className="font-serif text-2xl">Nothing saved yet</div>
            <p className="mt-2 text-sm text-muted-foreground">Save opportunities from any listing to build your personal shortlist.</p>
            <Button asChild className="mt-6" data-testid="saved-cta-discover"><Link to="/discover">Explore opportunities <ArrowRight className="h-4 w-4 ml-1.5" /></Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(o => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}
