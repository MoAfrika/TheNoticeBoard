import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, Bookmark, Bell, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home, id: "home" },
  { to: "/discover", label: "Discover", icon: Compass, id: "discover" },
  { to: "/business-tenders", label: "Tenders", icon: Briefcase, id: "tenders" },
  { to: "/saved", label: "Saved", icon: Bookmark, id: "saved" },
  { to: "/preferences", label: "Alerts", icon: Bell, id: "alerts" },
];

export default function MobileBottomNav() {
  return (
    <nav data-testid="mobile-bottom-nav" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.to === "/"}
            data-testid={`bottom-nav-${it.id}`}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
            {({ isActive }) => (
              <>
                <it.icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} />
                <span>{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
