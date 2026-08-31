import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, MapPin, Sparkles, Shield, Zap, MessageCircle, Facebook, Compass, Briefcase, GraduationCap, Building2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PROVINCES, CATEGORIES, deadlineInfo } from "@/lib/opportunities";
import { LINKS } from "@/lib/links";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PATHWAYS = [
  { key: "starting", title: "I'm starting my career", desc: "No-experience jobs, learnerships, internships, apprenticeships & graduate programmes.", icon: GraduationCap, filters: { experience_level: "No Experience" } },
  { key: "building", title: "I'm building my career", desc: "Professional roles, remote work and government opportunities for experienced talent.", icon: Compass, filters: { experience_level: "Mid Level" } },
  { key: "studying", title: "I'm studying", desc: "Bursaries, scholarships and skills programmes across sectors.", icon: Sparkles, filters: { category: "bursary" } },
  { key: "business", title: "I'm growing a business", desc: "Tenders, RFQs, supplier opportunities and enterprise funding.", icon: Building2, filters: { category: "tender" } },
];

export default function Home() {
  const { opportunities, loading } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [category, setCategory] = useState("all");

  const stats = useMemo(() => {
    const total = opportunities.length;
    const closingWeek = opportunities.filter(o => { const d = deadlineInfo(o.closing_date); return d.tone !== "expired" && (d.label.includes("day") || d.label.includes("today") || d.label.includes("tomorrow") || d.label.includes("this week")); }).length;
    const provincesCovered = new Set(opportunities.map(o => o.province)).size;
    return { total, closingWeek, provincesCovered };
  }, [opportunities]);

  const closingSoon = useMemo(() =>
    opportunities.filter(o => { const d = deadlineInfo(o.closing_date); return d.urgent || d.label.includes("this week"); })
      .sort((a, b) => (a.closing_date || "").localeCompare(b.closing_date || "")).slice(0, 4)
  , [opportunities]);

  const featured = useMemo(() => opportunities.filter(o => o.featured).slice(0, 3), [opportunities]);

  const runSearch = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (province && province !== "All Provinces") params.set("province", province);
    if (category && category !== "all") params.set("cat", category);
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO */}
      <section data-testid="hero" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 grain" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-6">
              <span className="h-px w-8 bg-border" />
              The South African Opportunity Network
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl leading-[1.02] tracking-tight text-foreground">
              Find the opportunity <br className="hidden sm:block" />
              that <em className="italic font-normal text-primary">changes what happens next.</em>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Discover verified jobs, learnerships, bursaries, internships, skills programmes, tenders and business opportunities — from one intelligent platform built for South Africa.
            </p>
          </div>

          {/* Universal search */}
          <div data-testid="universal-search" className="mt-10 bg-card border border-border rounded-lg p-2 sm:p-3 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_auto] gap-2">
              <div className="flex items-center gap-2 px-3 border-b lg:border-b-0 lg:border-r border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input data-testid="hero-search-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="What are you looking for?"
                  className="border-0 h-12 focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground" />
              </div>
              <div className="lg:border-r border-border">
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger data-testid="hero-province-select" className="h-12 border-0 shadow-none focus:ring-0"><SelectValue placeholder="Province" /></SelectTrigger>
                  <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="hero-category-select" className="h-12 border-0 shadow-none focus:ring-0"><SelectValue placeholder="Opportunity" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button data-testid="hero-search-btn" onClick={runSearch} className="h-12 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "No Experience", to: "/discover?exp=No%20Experience" },
              { label: "Remote", to: "/discover?remote=true" },
              { label: "Closing Soon", to: "/discover?closing=soon" },
              { label: "Learnerships", to: "/discover?cat=learnership" },
              { label: "Government", to: "/discover?cat=government" },
              { label: "Tenders", to: "/discover?cat=tender" },
            ].map((c) => (
              <Link key={c.label} data-testid={`quick-filter-${c.label.toLowerCase().replace(/\s+/g, "-")}`} to={c.to}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/40 hover:text-primary transition-colors">
                {c.label}
              </Link>
            ))}
          </div>

          {/* Live pulse */}
          <div data-testid="live-pulse" className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-border">
            <PulseStat n={stats.total} label="Opportunities tracked" />
            <PulseStat n={stats.closingWeek} label="Closing this week" tone="text-amber-700 dark:text-amber-300" />
            <PulseStat n={stats.provincesCovered} label="Provinces covered" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Covering</div>
              <div className="mt-2 text-sm font-medium leading-tight">Jobs · Learnerships · Bursaries · Tenders · Business</div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVER BY GOAL */}
      <section data-testid="discover-by-goal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <SectionHeader eyebrow="Discover by goal" title="Where are you in your journey?" desc="Human-centred pathways, not just categories." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PATHWAYS.map((p) => (
            <button key={p.key} data-testid={`pathway-${p.key}`}
              onClick={() => {
                const params = new URLSearchParams();
                if (p.filters.category) params.set("cat", p.filters.category);
                if (p.filters.experience_level) params.set("exp", p.filters.experience_level);
                navigate(`/discover?${params.toString()}`);
              }}
              className="group text-left bg-card border border-border rounded-lg p-6 sm:p-8 card-hover">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-md bg-primary/10 text-primary grid place-items-center">
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-medium">
                    Explore pathway <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CLOSING SOON */}
      <section data-testid="closing-soon" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <SectionHeader eyebrow="Deadline intelligence" title="Closing soon" desc="Don't let these pass by." />
          <Link to="/discover?closing=soon" className="hidden sm:inline-flex text-sm items-center gap-1 text-primary link-underline">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closingSoon.map((o) => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        )}
      </section>

      {/* FEATURED */}
      <section data-testid="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <SectionHeader eyebrow="Editorial picks" title="Featured opportunities" desc="Hand-picked highlights from across the country." />
          <Link to="/discover" className="hidden sm:inline-flex text-sm items-center gap-1 text-primary link-underline">Browse all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((o) => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS + TRUST */}
      <section data-testid="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader eyebrow="How it works" title="A simple, transparent process." />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "01", title: "Search", desc: "Find opportunities by category, keyword or province.", icon: Search },
            { n: "02", title: "Explore", desc: "Read requirements, closing dates and full detail.", icon: Compass },
            { n: "03", title: "Verify", desc: "Trust badges show the source and verification status.", icon: Shield },
            { n: "04", title: "Connect", desc: "Need help? Chat to a real person on WhatsApp.", icon: MessageCircle },
          ].map((s) => (
            <div key={s.n} className="p-6 border border-border rounded-lg bg-card">
              <div className="font-mono text-[11px] tracking-widest text-muted-foreground">{s.n}</div>
              <s.icon className="h-5 w-5 mt-3 text-primary" />
              <div className="mt-3 font-serif text-lg font-semibold">{s.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section data-testid="community" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-xl overflow-hidden bg-primary text-primary-foreground p-8 sm:p-14 relative">
          <div className="absolute inset-0 grain opacity-30" />
          <div className="relative max-w-3xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-70">Community ecosystem</div>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">Stay close to opportunity. Every day.</h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl">Join the WhatsApp community for daily broadcasts, get help from a real human, and never miss what's happening on the national opportunity feed.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button data-testid="cta-whatsapp-community" onClick={() => window.open(LINKS.whatsappCommunity, "_blank")}
                className="bg-background text-foreground hover:bg-background/90 h-11 px-5"><MessageCircle className="h-4 w-4 mr-2" /> Join WhatsApp community</Button>
              <Button data-testid="cta-facebook-page" variant="outline" onClick={() => window.open("https://web.facebook.com/thenoticeboardpage/", "_blank")}
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 h-11 px-5"><Facebook className="h-4 w-4 mr-2" /> Follow public page</Button>
              <Button data-testid="cta-whatsapp-help" variant="outline" onClick={() => window.open(LINKS.whatsappHelp, "_blank")}
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 h-11 px-5">Chat with a human</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PulseStat({ n, label, tone }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-serif text-3xl sm:text-4xl font-semibold ${tone || ""}`}>{n.toLocaleString()}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h2>
      {desc && <p className="mt-2 text-muted-foreground max-w-2xl">{desc}</p>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-secondary/50 animate-pulse" />
      ))}
    </div>
  );
}
