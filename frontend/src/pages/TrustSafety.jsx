import React from "react";
import { ShieldCheck, AlertTriangle, Eye, MessageCircle, Flag, CheckCircle2 } from "lucide-react";
import { LINKS } from "@/lib/links";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TrustSafety() {
  return (
    <div>
      <section className="border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-40 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Trust & Safety</div>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">Trust, made <em className="italic font-normal text-primary">visible.</em></h1>
          <p className="mt-6 max-w-2xl text-muted-foreground">Every opportunity carries a source and verification state. We tell you where a listing came from, when we last checked it, and how confident we are in it. If we don't know, we say so.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: ShieldCheck, label: "Official Source", desc: "Directly from the organisation's official channel.", tone: "emerald" },
            { icon: CheckCircle2, label: "Verified", desc: "Cross-checked against the original source by our team.", tone: "sky" },
            { icon: Eye, label: "Reviewing", desc: "Currently being cross-checked.", tone: "amber" },
            { icon: AlertTriangle, label: "Unverified", desc: "Source found but not yet checked.", tone: "slate" },
            { icon: Flag, label: "Community Reported", desc: "Flagged by users — investigating.", tone: "rose" },
          ].map(b => (
            <div key={b.label} data-testid={`trust-badge-${b.label.toLowerCase().replace(/\s+/g, "-")}`} className="p-5 border border-border rounded-lg bg-card">
              <b.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-serif text-lg font-semibold">{b.label}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Never pay for a job</div>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Scam warning signs to know</h2>
        <div className="editorial-rule mt-5" />
        <ul className="mt-6 space-y-4 text-[15px] leading-relaxed">
          <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-destructive" /> You are asked to pay a "registration", "training" or "background check" fee.</li>
          <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-destructive" /> The interview is conducted only via WhatsApp text and never on a call or in person.</li>
          <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-destructive" /> You are offered a role you did not apply for.</li>
          <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-destructive" /> You are asked to share banking details before signing a formal contract.</li>
          <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-destructive" /> The domain used to contact you doesn't match the organisation's real domain.</li>
        </ul>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-xl bg-primary text-primary-foreground p-8 sm:p-12">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-70">Report a listing</div>
          <h3 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight">If it feels wrong, tell us.</h3>
          <p className="mt-3 max-w-xl opacity-80">Every report is reviewed by a real person. Reporting takes 30 seconds and protects thousands of others.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild data-testid="trust-report-btn" className="h-11 bg-background text-foreground hover:bg-background/90"><Link to="/discover">Browse & report suspicious listing</Link></Button>
            <Button asChild variant="outline" data-testid="trust-whatsapp-btn" className="h-11 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <a href={LINKS.whatsappHelp} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> Message us on WhatsApp</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
