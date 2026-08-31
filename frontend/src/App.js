import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import CommandPalette from "@/components/search/CommandPalette";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import BusinessTenders from "@/pages/BusinessTenders";
import OpportunityDetail from "@/pages/OpportunityDetail";
import Saved from "@/pages/Saved";
import Preferences from "@/pages/Preferences";
import TrustSafety from "@/pages/TrustSafety";
import Digest from "@/pages/Digest";
import Sources from "@/pages/Sources";
import Submit from "@/pages/Submit";
import Admin from "@/pages/Admin";

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CommandPalette />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/business-tenders" element={<BusinessTenders />} />
            <Route path="/opportunity/:id" element={<OpportunityDetail />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/trust-safety" element={<TrustSafety />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/digest" element={<Digest />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AppProvider>
  );
}
