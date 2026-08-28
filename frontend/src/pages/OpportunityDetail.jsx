import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Share2, Flag, MapPin, ExternalLink, ShieldCheck, Sparkles, CalendarClock, Wifi, MessageCircle, Copy, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CATEGORY_META, deadlineInfo, deadlineToneClasses, relativePosted, orgInitials, orgColor } from "@/lib/opportunities";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { opportunities, isSaved, toggleSaved, markViewed, reportOpportunity } = useApp();
  const opp = opportunities.find(o => o.id === id);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (opp) markViewed(opp.id); /* eslint-disable-next-line */ }, [opp?.id]);

  if (!opp) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="font-serif text-3xl">Opportunity not found.</div>
      <Button className="mt-6" onClick={() => navigate("/discover")}>Back to discover</Button>
    </div>
  );

  const d = deadlineInfo(opp.closing_date);
  const cat = CATEGORY_META[opp.category] || CATEGORY_META.job;
  const saved = isSaved(opp.id);

  const related = opportunities.filter(o => o.id !== opp.id && o.category === opp.category).slice(0, 3);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: opp.title, url }); return; } catch {} }
    await navigator.clipboard.writeText(url); setCopied(true); toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6" data-testid="breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/discover" className="hover:text-foreground">Discover</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[240px]">{opp.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <article>
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", cat.tone)}>{cat.label}</span>
            {opp.source_type === "official" && <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-emerald-800 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"><ShieldCheck className="h-3 w-3" /> Official source</span>}
            {opp.remote && <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"><Wifi className="h-3 w-3" /> Remote</span>}
          </div>

          <h1 data-testid="opp-title" className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">{opp.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md grid place-items-center text-white font-serif text-sm font-bold" style={{ background: orgColor(opp.organisation) }}>{orgInitials(opp.organisation)}</div>
              <div>
                <div className="font-medium">{opp.organisation}</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.location}</div>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            {opp.employment_type && <div><div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Type</div><div className="text-sm">{opp.employment_type}</div></div>}
            {opp.experience_level && <div><div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Experience</div><div className="text-sm">{opp.experience_level}</div></div>}
            {opp.salary && <div><div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Compensation</div><div className="text-sm">{opp.salary}</div></div>}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border", deadlineToneClasses(d.tone))}>
              {d.urgent && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}<CalendarClock className="h-3 w-3" /> {d.label} · closes {opp.closing_date}
            </span>
            <span className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-1">{relativePosted(opp.posted_date)}</span>
            {opp.reference_number && <span className="text-[11px] font-mono text-muted-foreground border border-border rounded-md px-2 py-1">Ref: {opp.reference_number}</span>}
          </div>

          {typeof opp.match_score === "number" && (
            <div data-testid="ai-match-panel" className="mt-8 border border-border rounded-lg bg-secondary/30 p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full grid place-items-center bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Opportunity match — <span className="text-primary">{opp.match_score}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary" style={{ width: `${opp.match_score}%` }} /></div>
                <div className="mt-2 text-xs text-muted-foreground">AI match score (beta) — based on your saved interests and typical requirements.</div>
              </div>
            </div>
          )}

          <div className="mt-10 space-y-10">
            <Section title="Overview">
              <p className="text-[15px] leading-relaxed text-foreground/85">{opp.description}</p>
            </Section>

            {opp.requirements?.length > 0 && (
              <Section title="Requirements">
                <ul className="space-y-2">{opp.requirements.map((r, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="mt-2 h-1 w-3 shrink-0 bg-primary" />{r}</li>)}</ul>
              </Section>
            )}

            {opp.responsibilities?.length > 0 && (
              <Section title="Responsibilities">
                <ul className="space-y-2">{opp.responsibilities.map((r, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="mt-2 h-1 w-3 shrink-0 bg-primary" />{r}</li>)}</ul>
              </Section>
            )}

            {opp.benefits?.length > 0 && (
              <Section title="Benefits">
                <div className="flex flex-wrap gap-2">{opp.benefits.map((b, i) => <span key={i} className="text-sm px-3 py-1.5 rounded-full border border-border bg-secondary/50">{b}</span>)}</div>
              </Section>
            )}

            {opp.application_instructions && (
              <div id="how-to-apply">
                <Section title="How to apply">
                  <p className="text-[15px] leading-relaxed text-foreground/85">{opp.application_instructions}</p>
                  {opp.application_url && (
                    <a data-testid="apply-link" href={opp.application_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary link-underline">Open application portal <ExternalLink className="h-4 w-4" /></a>
                  )}
                </Section>
              </div>
            )}

            <Section title="Source & verification">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Source</div>
                  <div className="mt-1 font-medium capitalize">{opp.source_type}</div>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Verification</div>
                  <div className="mt-1 font-medium capitalize inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" /> {opp.verification_status}</div>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Last checked</div>
                  <div className="mt-1 font-medium">{opp.verified_date || opp.updated_at?.slice(0, 10) || "—"}</div>
                </div>
              </div>
            </Section>

            <Section title="Safety guidance">
              <ul className="space-y-2 text-[15px] leading-relaxed text-foreground/85">
                <li>· Never pay any fee to secure a job, learnership or bursary.</li>
                <li>· Verify the organisation directly through their official website.</li>
                <li>· Be cautious of interviews conducted only via WhatsApp text.</li>
                <li>· Report suspicious listings — it helps protect the whole community.</li>
              </ul>
              <button data-testid="report-btn" onClick={() => setReportOpen(true)} className="mt-4 inline-flex items-center gap-2 text-sm text-destructive link-underline"><Flag className="h-4 w-4" /> Report this opportunity</button>
            </Section>

            {related.length > 0 && (
              <Section title="Related opportunities">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{related.map(r => <OpportunityCard key={r.id} opp={r} />)}</div>
              </Section>
            )}
          </div>
        </article>

        {/* Sticky action panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="border border-border rounded-lg bg-card p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Take action</div>
              <div className="mt-3 flex flex-col gap-2">
                {opp.application_url ? (
                  <Button asChild data-testid="detail-apply-button" className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <a href={opp.application_url} target="_blank" rel="noreferrer">Apply now <ExternalLink className="h-4 w-4 ml-2" /></a>
                  </Button>
                ) : (
                  <a href="#how-to-apply" data-testid="detail-apply-button" className="h-11 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm">
                    See how to apply <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                )}
                <Button data-testid="detail-save-button" variant="outline" onClick={() => toggleSaved(opp.id)} className="h-11">
                  <Bookmark className={cn("h-4 w-4 mr-2", saved && "fill-current")} /> {saved ? "Saved" : "Save for later"}
                </Button>
                <Button data-testid="detail-share-button" variant="ghost" onClick={share} className="h-11">
                  {copied ? <><Check className="h-4 w-4 mr-2" /> Copied</> : <><Share2 className="h-4 w-4 mr-2" /> Share</>}
                </Button>
                <Button data-testid="report-open-button" variant="ghost" onClick={() => setReportOpen(true)} className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Flag className="h-4 w-4 mr-2" /> Report suspicious
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-lg bg-card p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Need help?</div>
              <div className="mt-2 text-sm text-muted-foreground">Chat to a real person if you need help understanding or verifying this listing.</div>
              <Button asChild variant="outline" className="mt-3 w-full h-10" data-testid="side-whatsapp">
                <a href={`https://wa.me/27682337028?text=${encodeURIComponent(`Hi, I have a question about: ${opp.title}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp</a>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex gap-2" data-testid="mobile-action-bar">
        <Button data-testid="mobile-save" variant="outline" onClick={() => toggleSaved(opp.id)} className="h-11 w-11 p-0"><Bookmark className={cn("h-4 w-4", saved && "fill-current")} /></Button>
        <Button data-testid="mobile-share" variant="outline" onClick={share} className="h-11 w-11 p-0"><Share2 className="h-4 w-4" /></Button>
        {opp.application_url ? (
          <Button asChild data-testid="mobile-apply" className="h-11 flex-1 bg-primary text-primary-foreground"><a href={opp.application_url} target="_blank" rel="noreferrer">Apply now</a></Button>
        ) : (
          <Button asChild data-testid="mobile-help" className="h-11 flex-1 bg-primary text-primary-foreground"><a href={`https://wa.me/27682337028`} target="_blank" rel="noreferrer">Get help</a></Button>
        )}
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} opp={opp} onSubmit={reportOpportunity} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      <div className="editorial-rule mb-5" />
      {children}
    </section>
  );
}

function ReportDialog({ open, onOpenChange, opp, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!reason) { toast.error("Please pick a reason"); return; }
    setSubmitting(true);
    try {
      await onSubmit({ opportunity_id: opp.id, reason, details, reporter_contact: contact });
      toast.success("Report submitted. Thank you for helping keep the community safe.");
      onOpenChange(false); setReason(""); setDetails(""); setContact("");
    } catch { toast.error("Could not submit. Try again."); }
    finally { setSubmitting(false); }
  };
  const reasons = ["Suspected scam", "Asks for payment", "Broken/expired link", "Duplicate", "Other"];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="report-dialog">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Report suspicious opportunity</DialogTitle></DialogHeader>
        <div className="text-sm text-muted-foreground -mt-2">We review every report. Your input helps protect thousands of people.</div>
        <div className="mt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Reason</div>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map(r => (
              <button key={r} data-testid={`report-reason-${r.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setReason(r)}
                className={cn("text-xs px-2.5 py-1 rounded-full border", reason === r ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30")}>{r}</button>
            ))}
          </div>
        </div>
        <Textarea data-testid="report-details" placeholder="Optional details (what happened, links, screenshots)…" value={details} onChange={(e) => setDetails(e.target.value)} className="mt-4" />
        <Input data-testid="report-contact" placeholder="Your email or WhatsApp (optional — for follow up)" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-2" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="report-submit" onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit report"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
