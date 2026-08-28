import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getDeviceId } from "@/lib/opportunities";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AppContext = createContext(null);

const RECENT_KEY = "tnb.recentlyViewed";
const SAVED_KEY = "tnb.savedIds";
const PREFS_KEY = "tnb.preferences";

export function AppProvider({ children }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
  });
  const [recentIds, setRecentIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  });
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "null") || { categories: [], provinces: [], remote_only: false, frequency: "daily", channel: ["email"], contact: "" }; } catch { return { categories: [], provinces: [], remote_only: false, frequency: "daily", channel: ["email"], contact: "" }; }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);

  const deviceId = getDeviceId();

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/opportunities`, { params: { limit: 200 } });
      setOpportunities(res.data);
    } catch (e) {
      console.error("Load opportunities failed", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds)); }, [savedIds]);
  useEffect(() => { localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds)); }, [recentIds]);
  useEffect(() => { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); }, [preferences]);

  const isSaved = (id) => savedIds.includes(id);
  const toggleSaved = async (id) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        if (next.includes(id)) axios.post(`${API}/saved`, { device_id: deviceId, opportunity_id: id });
        else axios.delete(`${API}/saved/${deviceId}/${id}`);
      } catch (e) { console.error(e); }
      return next;
    });
  };

  const markViewed = (id) => {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12));
  };

  const savePreferences = async (next) => {
    setPreferences(next);
    try {
      await axios.post(`${API}/preferences`, { device_id: deviceId, ...next });
    } catch (e) { console.error(e); }
  };

  const reportOpportunity = async (payload) => {
    return axios.post(`${API}/report`, payload);
  };

  // Global ⌘K listener
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((document.activeElement || {}).tagName)) { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = {
    opportunities, loading, reload: loadOpportunities,
    savedIds, isSaved, toggleSaved,
    recentIds, markViewed,
    preferences, savePreferences,
    reportOpportunity,
    paletteOpen, setPaletteOpen,
    deviceId,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
