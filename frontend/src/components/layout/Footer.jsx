import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Facebook, ExternalLink } from "lucide-react";
import { LINKS } from "@/lib/links";

const cols = [
  { title: "Discover", links: [
    { to: "/discover?cat=job", label: "Career Opportunities" },
    { to: "/discover?cat=learnership", label: "Learnerships" },
    { to: "/discover?cat=bursary", label: "Bursaries" },
    { to: "/discover?cat=internship", label: "Internships" },
    { to: "/discover?cat=government", label: "Government" },
  ]},
  { title: "Business & Tenders", links: [
    { to: "/business-tenders", label: "Tenders" },
    { to: "/business-tenders?cat=rfq", label: "RFQs" },
    { to: "/business-tenders?cat=business", label: "Funding & Supplier" },
  ]},
  { title: "Resources", links: [
    { to: "/trust-safety", label: "Trust & Safety" },
    { to: "/sources", label: "Sources & Verification" },
    { to: "/preferences", label: "Alerts & Preferences" },
    { to: "/saved", label: "My Workspace" },
    { to: "/digest", label: "Daily Digest" },
  ]},
];

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="mt-20 border-t border-border bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-serif text-lg font-bold">N</div>
              <div className="leading-tight">
                <div className="font-serif text-lg font-bold">The Notice Board</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">SA Opportunity Network</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Opportunity is everywhere. Finding it should not depend on who you know. An independent, editorial platform for discovering verified opportunities across South Africa.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a data-testid="footer-whatsapp" href={LINKS.whatsappCommunity} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm hover:border-primary/40">
                <MessageCircle className="h-4 w-4" /> WhatsApp community
              </a>
              <a data-testid="footer-facebook" href={LINKS.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm hover:border-primary/40">
                <Facebook className="h-4 w-4" /> Facebook Page
              </a>
              <a data-testid="footer-submit" href="/submit" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm hover:border-primary/40">
                Submit an Opportunity <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-muted-foreground mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-foreground/80 hover:text-foreground link-underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} The Notice Board. Independent. Editorial. Trusted.</div>
          <div className="flex gap-4">
            <Link to="/trust-safety" className="hover:text-foreground">Verification Policy</Link>
            <Link to="/trust-safety" className="hover:text-foreground">Report Suspicious Listing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
