import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MessageCircle, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { getDeviceId, deadlineInfo, deadlineToneClasses, CATEGORY_META } from "@/lib/opportunities";
import { LINKS } from "@/lib/links";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Digest() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const deviceId = getDeviceId();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/digest/${deviceId}`);
      setDigest(res.data);
    } catch (e) { toast.error("Could not load digest"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const shareToWhatsApp = () => { if (digest?.whatsapp_link) window.open(digest.whatsapp_link, "_blank"); };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Daily digest</div>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Your opportunity digest</h1>
      <p className="mt-3 text-muted-foreground">Personalised to your preferences. Refreshed daily at 07:00 SAST.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button data-testid="digest-share-btn" onClick={shareToWhatsApp} disabled={!digest} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
          <MessageCircle className="h-4 w-4 mr-2" /> Send to WhatsApp
        </Button>
        <Button data-testid="digest-refresh-btn" onClick={load} variant="outline" className="h-11">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
        </Button>
        <Button asChild variant="ghost" className="h-11" data-testid="digest-preferences-btn"><Link to="/preferences">Update preferences</Link></Button>
      </div>

      <div className="editorial-rule mt-10 mb-8" />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-secondary/50 animate-pulse rounded-lg" />)}</div>
      ) : !digest?.picks?.length ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <div className="font-serif text-2xl">No matches for today</div>
          <p className="mt-2 text-sm text-muted-foreground">Try broadening your preferences.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {digest.picks.map((p, i) => {
            const d = deadlineInfo(p.closing_date);
            const cat = CATEGORY_META[p.category] || CATEGORY_META.job;
            return (
              <Link key={p.opportunity_id} to={`/opportunity/${p.opportunity_id}`} data-testid={`digest-pick-${i}`} className="block p-5 border border-border rounded-lg card-hover bg-card">
                <div className="flex items-start gap-4">
                  <div className="font-mono text-[11px] tracking-widest text-muted-foreground mt-1">{String(i + 1).padStart(2, "0")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className={cn("inline-flex items-center text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", cat.tone)}>{cat.label}</span>
                      {p.match_score && <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 px-1.5 py-0.5 rounded"><Sparkles className="h-3 w-3" />{p.match_score}% match</span>}
                    </div>
                    <div className="font-serif text-lg font-semibold leading-snug">{p.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{p.organisation}</div>
                    {p.reasons?.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground italic">{p.reasons.join(" · ")}</div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border", deadlineToneClasses(d.tone))}>{d.label}</span>
                      <span className="ml-auto text-xs text-primary inline-flex items-center gap-1">Open <ArrowRight className="h-3.5 w-3.5" /></span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-14 rounded-lg border border-border p-6 bg-secondary/30">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Never miss</div>
        <div className="mt-1 font-serif text-xl font-semibold">Join the WhatsApp community</div>
        <p className="mt-1.5 text-sm text-muted-foreground">Get broadcasts, live updates and community help — daily.</p>
        <Button asChild className="mt-4 h-10" data-testid="digest-join-community"><a href={LINKS.whatsappCommunity} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> Join community</a></Button>
      </div>
    </div>
  );
}
