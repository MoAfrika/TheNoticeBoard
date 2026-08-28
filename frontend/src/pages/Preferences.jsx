import React, { useState } from "react";
import { Bell, Mail, MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CATEGORIES, PROVINCES, EXPERIENCE_LEVELS } from "@/lib/opportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Preferences() {
  const { preferences, savePreferences } = useApp();
  const [p, setP] = useState(preferences);

  const toggle = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  const submit = async () => { await savePreferences(p); toast.success("Preferences saved"); };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Personalisation</div>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Alerts & preferences</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">Tell us what you're looking for. We'll surface the right opportunities and can notify you when new ones match.</p>

      <div className="mt-10 space-y-10">
        <Block title="Opportunity types" desc="Pick the categories you're most interested in.">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.filter(c => c.key !== "all").map(c => (
              <button key={c.key} data-testid={`pref-cat-${c.key}`} onClick={() => setP({ ...p, categories: toggle(p.categories || [], c.key) })}
                className={cn("text-xs px-2.5 py-1 rounded-full border", (p.categories||[]).includes(c.key) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>{c.label}</button>
            ))}
          </div>
        </Block>

        <Block title="Provinces" desc="Where would you like to work or study?">
          <div className="flex flex-wrap gap-1.5">
            {PROVINCES.filter(p => p !== "All Provinces").map(prov => (
              <button key={prov} data-testid={`pref-prov-${prov.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setP({ ...p, provinces: toggle(p.provinces || [], prov) })}
                className={cn("text-xs px-2.5 py-1 rounded-full border", (p.provinces||[]).includes(prov) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>{prov}</button>
            ))}
          </div>
        </Block>

        <Block title="Experience level">
          <div className="flex flex-wrap gap-1.5">
            {EXPERIENCE_LEVELS.map(e => (
              <button key={e} data-testid={`pref-exp-${e.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setP({ ...p, experience_levels: toggle(p.experience_levels || [], e) })}
                className={cn("text-xs px-2.5 py-1 rounded-full border", (p.experience_levels||[]).includes(e) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>{e}</button>
            ))}
          </div>
        </Block>

        <Block title="Options">
          <label className="flex items-center gap-3">
            <Switch data-testid="pref-remote" checked={p.remote_only} onCheckedChange={(v) => setP({ ...p, remote_only: v })} />
            <span className="text-sm">Show remote only</span>
          </label>
        </Block>

        <Block title="Alerts" desc="How often should we notify you?">
          <div className="flex flex-wrap gap-1.5">
            {[{k:"instant",l:"Instant"},{k:"daily",l:"Daily digest"},{k:"weekly",l:"Weekly digest"}].map(f => (
              <button key={f.k} data-testid={`pref-freq-${f.k}`} onClick={() => setP({ ...p, frequency: f.k })}
                className={cn("text-xs px-2.5 py-1 rounded-full border", p.frequency === f.k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>{f.l}</button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3">
              <Switch data-testid="pref-ch-email" checked={(p.channel || []).includes("email")} onCheckedChange={(v) => setP({ ...p, channel: v ? [...new Set([...(p.channel||[]), "email"])] : (p.channel||[]).filter(c => c !== "email") })} />
              <span className="text-sm inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
            </label>
            <label className="flex items-center gap-3">
              <Switch data-testid="pref-ch-wa" checked={(p.channel || []).includes("whatsapp")} onCheckedChange={(v) => setP({ ...p, channel: v ? [...new Set([...(p.channel||[]), "whatsapp"])] : (p.channel||[]).filter(c => c !== "whatsapp") })} />
              <span className="text-sm inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
            </label>
          </div>
          <div className="mt-4">
            <Input data-testid="pref-contact" placeholder="Email or WhatsApp number for alerts" value={p.contact || ""} onChange={(e) => setP({ ...p, contact: e.target.value })} />
          </div>
        </Block>

        <div className="pt-6 flex justify-end">
          <Button data-testid="pref-save" onClick={submit} className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90"><Bell className="h-4 w-4 mr-2" /> Save preferences</Button>
        </div>
      </div>
    </div>
  );
}

function Block({ title, desc, children }) {
  return (
    <div>
      <div className="font-serif text-xl font-semibold">{title}</div>
      {desc && <div className="text-sm text-muted-foreground mt-1">{desc}</div>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
