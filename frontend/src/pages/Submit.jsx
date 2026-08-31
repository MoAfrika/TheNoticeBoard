import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, ShieldCheck, Info } from "lucide-react";
import { PROVINCES, CATEGORIES, EXPERIENCE_LEVELS } from "@/lib/opportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Submit() {
  const [f, setF] = useState({
    title: "", organisation: "", category: "job", location: "",
    province: "Nationwide", remote: false,
    employment_type: "", experience_level: "", salary: "",
    closing_date: "", description: "",
    application_url: "", source_url: "", reference_number: "",
    submitter_name: "", submitter_email: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setF({ ...f, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title || !f.organisation || !f.description) { toast.error("Title, organisation and description are required"); return; }
    setBusy(true);
    try {
      await axios.post(`${API}/submissions`, f);
      setSubmitted(true);
      toast.success("Submission received — pending admin review");
    } catch (err) { toast.error("Could not submit. Please try again."); }
    finally { setBusy(false); }
  };

  if (submitted) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 mb-6"><ShieldCheck className="h-7 w-7" /></div>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Thank you — your submission is under review</h1>
      <p className="mt-4 text-muted-foreground">Every submission is reviewed by our admin team before publishing. This protects everyone. You'll only see the listing on The Notice Board once it's been reviewed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild data-testid="submit-back-home" className="bg-primary text-primary-foreground"><Link to="/">Back to home</Link></Button>
        <Button asChild variant="outline" data-testid="submit-another"><a onClick={(e) => { e.preventDefault(); setSubmitted(false); setF({ ...f, title:"", organisation:"", description:"" }); }} href="#">Submit another</a></Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Community contribution</div>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Submit an opportunity</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">Know of a job, learnership, bursary, tender or opportunity that belongs here? Submit it below. Every submission goes to an admin for review before it's published — nothing is auto-posted.</p>

      <div className="mt-6 flex items-start gap-3 p-4 rounded-lg border border-border bg-secondary/40">
        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="text-sm text-muted-foreground">Please include a <b className="text-foreground">source URL</b> where the opportunity is officially advertised — we won't publish anything we can't independently verify.</div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Field label="Opportunity title *"><Input data-testid="submit-title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Junior Developer" /></Field>
        <Field label="Organisation *"><Input data-testid="submit-org" value={f.organisation} onChange={(e) => set("organisation", e.target.value)} placeholder="e.g. Acme Corp / City of Cape Town" /></Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category">
            <Select value={f.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger data-testid="submit-category"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.filter(c => c.key !== "all").map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Province">
            <Select value={f.province} onValueChange={(v) => set("province", v)}>
              <SelectTrigger data-testid="submit-province"><SelectValue /></SelectTrigger>
              <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location (city)"><Input data-testid="submit-location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Cape Town" /></Field>
          <Field label="Closing date"><Input data-testid="submit-closing" type="date" value={f.closing_date} onChange={(e) => set("closing_date", e.target.value)} /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Experience level">
            <Select value={f.experience_level} onValueChange={(v) => set("experience_level", v)}>
              <SelectTrigger data-testid="submit-exp"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>{EXPERIENCE_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Salary / compensation"><Input data-testid="submit-salary" value={f.salary} onChange={(e) => set("salary", e.target.value)} placeholder="e.g. R15,000 – R20,000 / month" /></Field>
        </div>

        <Field label="Full description *">
          <Textarea data-testid="submit-description" rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Requirements, responsibilities, how to apply…" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Application URL"><Input data-testid="submit-apply-url" value={f.application_url} onChange={(e) => set("application_url", e.target.value)} placeholder="https://…" /></Field>
          <Field label="Source URL (official advert)"><Input data-testid="submit-source-url" value={f.source_url} onChange={(e) => set("source_url", e.target.value)} placeholder="https://…" /></Field>
        </div>

        <Field label="Reference number (if any)"><Input data-testid="submit-ref" value={f.reference_number} onChange={(e) => set("reference_number", e.target.value)} placeholder="e.g. COT-2027-INF-042" /></Field>

        <div className="editorial-rule my-8" />
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">About you (optional — for follow-up)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Your name"><Input data-testid="submit-your-name" value={f.submitter_name} onChange={(e) => set("submitter_name", e.target.value)} /></Field>
          <Field label="Your email"><Input data-testid="submit-your-email" type="email" value={f.submitter_email} onChange={(e) => set("submitter_email", e.target.value)} /></Field>
        </div>

        <div className="pt-4 flex justify-end">
          <Button data-testid="submit-submit-btn" type="submit" disabled={busy} className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Submitting…" : <>Submit for review <ArrowRight className="h-4 w-4 ml-2" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      {children}
    </label>
  );
}
