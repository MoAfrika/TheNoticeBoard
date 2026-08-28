import React from "react";
import { useNavigate } from "react-router-dom";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Compass, Briefcase, Bookmark, Bell, Shield, MapPin, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { CATEGORIES, PROVINCES, deadlineInfo } from "@/lib/opportunities";

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, opportunities } = useApp();
  const navigate = useNavigate();
  const go = (path) => { setPaletteOpen(false); navigate(path); };

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent data-testid="command-palette" className="p-0 overflow-hidden max-w-2xl gap-0 border-border">
        <DialogTitle className="sr-only">Search The Notice Board</DialogTitle>
        <DialogDescription className="sr-only">Search across opportunities, organisations, categories and provinces.</DialogDescription>
        <CommandPrimitive className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:pb-2">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandPrimitive.Input data-testid="palette-input"
              placeholder="Search opportunities, organisations, categories, provinces…"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
            />
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary">ESC</kbd>
          </div>
          <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto pb-2">
            <CommandPrimitive.Empty className="py-10 text-center text-sm text-muted-foreground">No matches found.</CommandPrimitive.Empty>

            <CommandPrimitive.Group heading="Quick actions">
              <PaletteItem testId="palette-goto-discover" onSelect={() => go("/discover")} icon={<Compass className="h-4 w-4" />} label="Discover all opportunities" hint="/discover" />
              <PaletteItem testId="palette-goto-tenders" onSelect={() => go("/business-tenders")} icon={<Briefcase className="h-4 w-4" />} label="Business & Tenders" hint="/business-tenders" />
              <PaletteItem testId="palette-goto-saved" onSelect={() => go("/saved")} icon={<Bookmark className="h-4 w-4" />} label="My saved workspace" hint="/saved" />
              <PaletteItem testId="palette-goto-alerts" onSelect={() => go("/preferences")} icon={<Bell className="h-4 w-4" />} label="Alerts & preferences" hint="/preferences" />
              <PaletteItem testId="palette-goto-trust" onSelect={() => go("/trust-safety")} icon={<Shield className="h-4 w-4" />} label="Trust & Safety centre" hint="/trust-safety" />
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Categories">
              {CATEGORIES.filter(c => c.key !== "all").map((c) => (
                <PaletteItem key={c.key} testId={`palette-cat-${c.key}`} onSelect={() => go(`/discover?cat=${c.key}`)} label={c.label} hint="Category" icon={<Compass className="h-4 w-4" />} />
              ))}
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Provinces">
              {PROVINCES.filter(p => p !== "All Provinces").map((p) => (
                <PaletteItem key={p} testId={`palette-prov-${p.toLowerCase().replace(/\s+/g, "-")}`} onSelect={() => go(`/discover?province=${encodeURIComponent(p)}`)} label={p} hint="Province" icon={<MapPin className="h-4 w-4" />} />
              ))}
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Opportunities">
              {opportunities.slice(0, 12).map((o) => {
                const d = deadlineInfo(o.closing_date);
                return (
                  <PaletteItem key={o.id} testId={`palette-opp-${o.id}`} onSelect={() => go(`/opportunity/${o.id}`)}
                    label={o.title} hint={`${o.organisation} · ${d.label}`} icon={<ArrowRight className="h-4 w-4" />} />
                );
              })}
            </CommandPrimitive.Group>
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

function PaletteItem({ testId, onSelect, icon, label, hint }) {
  return (
    <CommandPrimitive.Item data-testid={testId} onSelect={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-md cursor-pointer data-[selected=true]:bg-secondary text-[14px]">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-muted-foreground font-mono">{hint}</span>}
    </CommandPrimitive.Item>
  );
}
