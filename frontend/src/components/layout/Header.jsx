import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Bookmark, Bell, Menu, Command, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/discover", label: "Discover", desc: "Jobs, learnerships, bursaries" },
  { to: "/business-tenders", label: "Business & Tenders", desc: "Tenders, RFQs, funding" },
  { to: "/trust-safety", label: "Trust & Safety", desc: "Verification & protection" },
];

export default function Header() {
  const { setPaletteOpen, savedIds } = useApp();
  const navigate = useNavigate();

  return (
    <header data-testid="site-header" className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 sm:gap-8 h-16">
        <Link data-testid="logo-link" to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-serif text-lg font-bold tracking-tight">N</div>
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-[17px] font-bold tracking-tight">The Notice Board</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">SA Opportunity Network</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV.map((n) => (
            <NavLink key={n.to} data-testid={`nav-${n.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              to={n.to} className={({ isActive }) => cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <button data-testid="global-search-trigger"
          onClick={() => setPaletteOpen(true)}
          className="hidden md:inline-flex items-center gap-3 h-10 px-3 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground text-sm min-w-[220px] transition-colors">
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search opportunities…</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">⌘K</kbd>
        </button>

        <button data-testid="mobile-search-trigger" onClick={() => setPaletteOpen(true)} className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>

        <Link data-testid="header-saved-link" to="/saved" className="relative hidden sm:grid h-10 w-10 place-items-center rounded-md hover:bg-secondary" aria-label="Saved">
          <Bookmark className="h-5 w-5" />
          {savedIds.length > 0 && (
            <span data-testid="header-saved-count" className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono grid place-items-center">{savedIds.length}</span>
          )}
        </Link>

        <Link data-testid="header-alerts-link" to="/preferences" className="hidden sm:grid h-10 w-10 place-items-center rounded-md hover:bg-secondary" aria-label="Alerts">
          <Bell className="h-5 w-5" />
        </Link>

        <Button data-testid="header-join-cta" onClick={() => window.open("https://chat.whatsapp.com/", "_blank")}
          className="hidden md:inline-flex h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground">
          Join Community
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <button data-testid="mobile-menu-trigger" className="lg:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86%] sm:w-96">
            <SheetHeader><SheetTitle className="font-serif text-2xl">Menu</SheetTitle></SheetHeader>
            <div className="mt-6 flex flex-col divide-y divide-border">
              {NAV.map((n) => (
                <Link key={n.to} data-testid={`mobile-nav-${n.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  to={n.to} className="py-4 group flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{n.label}</div>
                    <div className="text-sm text-muted-foreground">{n.desc}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
              <Link to="/saved" data-testid="mobile-nav-saved" className="py-4">Saved <span className="text-muted-foreground">({savedIds.length})</span></Link>
              <Link to="/preferences" data-testid="mobile-nav-preferences" className="py-4">Alerts & Preferences</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
