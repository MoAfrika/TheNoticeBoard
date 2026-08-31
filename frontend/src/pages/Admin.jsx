import React, { useEffect, useState } from "react";
import axios from "axios";
import { Lock, ShieldCheck, X, Check, ExternalLink, Loader2, LogOut } from "lucide-react";
import { CATEGORY_META, deadlineInfo } from "@/lib/opportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "tnb.adminToken";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("pending");
  const [subs, setSubs] = useState([]);
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const verify = async (t = token) => {
    setChecking(true);
    try {
      await axios.post(`${API}/admin/verify`, {}, { headers: { Authorization: `Bearer ${t}` } });
      setAuthed(true); localStorage.setItem(TOKEN_KEY, t); setToken(t);
    } catch { setAuthed(false); toast.error("Invalid admin key"); localStorage.removeItem(TOKEN_KEY); }
    finally { setChecking(false); }
  };

  useEffect(() => { if (token) verify(token); /* eslint-disable-next-line */ }, []);

  const load = async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/submissions?status=${tab}`, { headers: authHeader });
      setSubs(data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [authed, tab]);

  const act = async (id, action) => {
    try {
      await axios.post(`${API}/admin/submissions/${id}/${action}`, {}, { headers: authHeader });
      toast.success(action === "approve" ? "Published to feed" : "Rejected");
      setSubs(s => s.filter(x => x.id !== id));
    } catch { toast.error(`Could not ${action}`); }
  };

  const signOut = () => { localStorage.removeItem(TOKEN_KEY); setToken(""); setAuthed(false); };

  if (!authed) return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-4"><Lock className="h-6 w-6" /></div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Admin sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your admin key to review pending submissions.</p>
      </div>
      <div className="space-y-3">
        <Input data-testid="admin-token-input" type="password" placeholder="Admin key" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verify(input)} />
        <Button data-testid="admin-signin-btn" onClick={() => verify(input)} disabled={!input || checking} className="w-full h-11 bg-primary text-primary-foreground">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Moderation</div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Admin review</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Community-submitted opportunities. Nothing is published without your approval.</p>
        </div>
        <Button data-testid="admin-signout" variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        {[{k:"pending",l:"Pending"},{k:"approved",l:"Approved"},{k:"rejected",l:"Rejected"}].map(t => (
          <button key={t.k} data-testid={`admin-tab-${t.k}`} onClick={() => setTab(t.k)}
            className={cn("relative -mb-px px-4 py-3 text-sm font-medium border-b-2",
              tab === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? <div className="h-24 bg-secondary/50 animate-pulse rounded-lg" /> :
         subs.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-12 text-center">
            <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="mt-3 font-serif text-2xl">Nothing {tab}</div>
            <p className="mt-1 text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(s => <SubRow key={s.id} s={s} onApprove={() => act(s.id, "approve")} onReject={() => act(s.id, "reject")} showActions={tab === "pending"} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SubRow({ s, onApprove, onReject, showActions }) {
  const cat = CATEGORY_META[s.category] || CATEGORY_META.job;
  const d = s.closing_date ? deadlineInfo(s.closing_date) : null;
  return (
    <article data-testid={`admin-sub-${s.id}`} className="border border-border rounded-lg p-5 sm:p-6 bg-card">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border", cat.tone)}>{cat.label}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.province}</span>
            {d && <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">· {d.label}</span>}
          </div>
          <div className="font-serif text-xl font-semibold leading-snug">{s.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{s.organisation} · {s.location || s.province}</div>
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{s.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {s.reference_number && <span className="font-mono">Ref: {s.reference_number}</span>}
            {s.experience_level && <span>· {s.experience_level}</span>}
            {s.salary && <span>· {s.salary}</span>}
            {s.submitter_email && <span>· by {s.submitter_name || "anonymous"} ({s.submitter_email})</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer" className="text-primary link-underline inline-flex items-center gap-1">Source <ExternalLink className="h-3 w-3" /></a>}
            {s.application_url && <a href={s.application_url} target="_blank" rel="noreferrer" className="text-primary link-underline inline-flex items-center gap-1">Application <ExternalLink className="h-3 w-3" /></a>}
          </div>
        </div>
        {showActions && (
          <div className="flex flex-col gap-2">
            <Button data-testid={`admin-approve-${s.id}`} onClick={onApprove} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="h-4 w-4 mr-1.5" /> Approve & publish</Button>
            <Button data-testid={`admin-reject-${s.id}`} onClick={onReject} variant="outline" className="h-9 text-destructive hover:text-destructive"><X className="h-4 w-4 mr-1.5" /> Reject</Button>
          </div>
        )}
      </div>
    </article>
  );
}
