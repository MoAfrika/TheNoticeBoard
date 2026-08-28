// Utility helpers for The Notice Board
import { format, differenceInCalendarDays, parseISO } from "date-fns";

export const PROVINCES = [
  "All Provinces",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "Limpopo",
  "North West",
  "Northern Cape",
  "Nationwide",
];

export const CATEGORIES = [
  { key: "all", label: "All Opportunities", short: "All" },
  { key: "job", label: "Jobs", short: "Jobs" },
  { key: "learnership", label: "Learnerships", short: "Learnerships" },
  { key: "internship", label: "Internships", short: "Internships" },
  { key: "apprenticeship", label: "Apprenticeships", short: "Apprenticeships" },
  { key: "bursary", label: "Bursaries", short: "Bursaries" },
  { key: "skills", label: "Skills Programmes", short: "Skills" },
  { key: "tender", label: "Tenders", short: "Tenders" },
  { key: "rfq", label: "RFQs", short: "RFQs" },
  { key: "business", label: "Business Opportunities", short: "Business" },
  { key: "government", label: "Government", short: "Government" },
];

export const EXPERIENCE_LEVELS = ["No Experience", "Entry Level", "Mid Level", "Senior Level", "Business"];

export const CATEGORY_META = {
  job: { label: "Job", tone: "text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  learnership: { label: "Learnership", tone: "text-teal-800 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800" },
  internship: { label: "Internship", tone: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
  apprenticeship: { label: "Apprenticeship", tone: "text-orange-800 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
  bursary: { label: "Bursary", tone: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  skills: { label: "Skills Programme", tone: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  tender: { label: "Tender", tone: "text-cyan-800 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800" },
  rfq: { label: "RFQ", tone: "text-sky-800 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" },
  business: { label: "Business Opportunity", tone: "text-emerald-800 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  government: { label: "Government", tone: "text-indigo-800 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
};

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    return differenceInCalendarDays(parseISO(dateStr), new Date());
  } catch { return null; }
}

export function deadlineInfo(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return { label: "Open", tone: "open", urgent: false };
  if (d < 0) return { label: "Expired", tone: "expired", urgent: false };
  if (d === 0) return { label: "Closing today", tone: "closing-today", urgent: true };
  if (d === 1) return { label: "Closing tomorrow", tone: "closing-today", urgent: true };
  if (d <= 3) return { label: `${d} days left`, tone: "closing-soon", urgent: true };
  if (d <= 7) return { label: "Closes this week", tone: "closing-soon", urgent: false };
  if (d <= 30) return { label: `${d} days left`, tone: "open", urgent: false };
  return { label: `Closes ${format(parseISO(dateStr), "dd MMM")}`, tone: "open", urgent: false };
}

export function deadlineToneClasses(tone) {
  switch (tone) {
    case "closing-today": return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
    case "closing-soon": return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
    case "expired": return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    default: return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
  }
}

export function relativePosted(dateStr) {
  if (!dateStr) return "";
  const d = differenceInCalendarDays(new Date(), parseISO(dateStr));
  if (d <= 0) return "Posted today";
  if (d === 1) return "Posted yesterday";
  if (d < 7) return `Posted ${d} days ago`;
  if (d < 30) return `Posted ${Math.floor(d/7)} weeks ago`;
  return `Posted ${format(parseISO(dateStr), "dd MMM")}`;
}

export function orgInitials(name) {
  if (!name) return "??";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
}

export function orgColor(name) {
  const palette = ["#0A2540", "#1F3A5F", "#0F4C81", "#3A506B", "#233D4D", "#1B4965", "#264653"];
  const n = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[n % palette.length];
}

export function getDeviceId() {
  const key = "tnb.deviceId";
  let id = localStorage.getItem(key);
  if (!id) { id = "dev-" + Math.random().toString(36).slice(2, 12); localStorage.setItem(key, id); }
  return id;
}

// Simple analytics stub
export function track(event, props = {}) {
  try { console.debug("[analytics]", event, props); } catch {}
}
