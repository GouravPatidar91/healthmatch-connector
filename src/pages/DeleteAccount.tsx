import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Mail, Phone, MapPin, Trash2, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[0-9]{0,15}$/, "Digits only").max(15).optional().or(z.literal("")),
  reason: z.string().trim().max(500, "Max 500 characters").optional().or(z.literal("")),
  confirm: z.literal(true, { errorMap: () => ({ message: "You must confirm to proceed" }) }),
});

const SUPPORT_EMAIL = "admin@curezy.in";

export default function DeleteAccount() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", reason: "", confirm: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Delete Your Curezy Account – Account Deletion Request";
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.getAttribute("content");
    meta?.setAttribute(
      "content",
      "Request deletion of your Curezy account and associated data. Curezy LLP processes account deletion requests within 7 business days."
    );
    return () => { if (meta && original) meta.setAttribute("content", original); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const subject = encodeURIComponent("Account Deletion Request – Curezy");
    const body = encodeURIComponent(
      `Hello Curezy Team,\n\nI am requesting permanent deletion of my Curezy account and associated data.\n\n` +
      `Full Name: ${form.fullName}\nRegistered Email: ${form.email}\nRegistered Phone: ${form.phone || "(not provided)"}\n\n` +
      `Reason (optional): ${form.reason || "(not provided)"}\n\n` +
      `I confirm I understand this will permanently remove my profile, appointments, prescriptions, medical records, ` +
      `and authentication credentials, subject to legally required retention (invoices for 7 years).\n\nThank you.`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    toast({ title: "Email opened", description: "Send the prefilled email to complete your request." });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Curezy
          </Link>
          <span className="font-bold text-lg">Curezy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
            <Trash2 className="h-3.5 w-3.5" /> Account Deletion
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Delete Your Curezy Account</h1>
          <p className="text-muted-foreground leading-relaxed">
            This page lets users of the <strong>Curezy</strong> Android app (developed by Curezy LLP) request permanent
            deletion of their account and the personal data associated with it.
          </p>
        </div>

        {/* How to request */}
        <Card>
          <CardHeader><CardTitle className="text-lg">How to request deletion</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Option 1 — In the Curezy app</h3>
              <p className="text-muted-foreground">
                Open the app → <strong>Settings</strong> → <strong>Account</strong> → <strong>Delete Account</strong>.
                Confirm the prompt to submit your request instantly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Option 2 — Submit the form below</h3>
              <p className="text-muted-foreground">
                If you can't access the app, fill the form and we'll process your request from your registered email.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Account deletion request form</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name *</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={100} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Registered email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Registered phone (optional)</Label>
                <Input id="phone" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })} maxLength={15} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason for deletion (optional)</Label>
                <Textarea id="reason" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={500} />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/5 border border-destructive/20">
                <Checkbox id="confirm" checked={form.confirm} onCheckedChange={(v) => setForm({ ...form, confirm: !!v })} className="mt-0.5" />
                <Label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                  I understand this request will <strong>permanently delete</strong> my Curezy account and associated data,
                  and that this action cannot be undone.
                </Label>
              </div>
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}

              <Button type="submit" variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" /> Submit deletion request
              </Button>

              {submitted && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    Your email client should have opened with a prefilled message. If it didn't, please email us directly at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline">{SUPPORT_EMAIL}</a>.
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* What gets deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> Data that will be deleted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Profile information (name, phone, address, date of birth, health profile)</li>
              <li>Appointment history and uploaded prescriptions</li>
              <li>Cart, orders, and wallet balance (after final settlement)</li>
              <li>Saved medical records and AI symptom-check history</li>
              <li>Authentication credentials and login sessions</li>
              <li>Push notification tokens and device identifiers</li>
            </ul>
          </CardContent>
        </Card>

        {/* What is retained */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Data we are required to retain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong>Order invoices & payment records</strong> — retained for <strong>7 years</strong> as required by Indian Income Tax & GST law.</li>
              <li><strong>Anonymised prescription dispensing records</strong> — retained as required by the Drugs & Cosmetics Act, 1940 and Rules thereunder.</li>
              <li><strong>Aggregated, anonymised analytics</strong> — retained indefinitely. This data contains no personal identifiers.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Processing timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Verification:</strong> within 2 business days of receiving your request (we'll reply to your registered email).</p>
            <p>• <strong>Initial processing:</strong> within <strong>7 business days</strong>.</p>
            <p>• <strong>Full data erasure:</strong> completed within <strong>30 days</strong> of verification.</p>
            <p>• You'll receive a confirmation email once deletion is complete.</p>
          </CardContent>
        </Card>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">This action is permanent</p>
            <p className="text-amber-800 dark:text-amber-300/90">
              Once your account is deleted, it cannot be recovered. If you have an active wallet balance or unfulfilled
              orders, please withdraw / complete them before submitting your request.
            </p>
          </div>
        </div>

        {/* Contact */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Contact us directly</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">{SUPPORT_EMAIL}</a></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href="tel:+919165043258" className="hover:underline">+91 9165043258</a></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" /><span className="text-muted-foreground">Curezy LLP, 27-A Kushwah Shri Nagar, Indore Kumar Khadi, Indore – 452015, Madhya Pradesh, India</span></div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">
          App: Curezy (Android) · Developer: Curezy LLP · Last updated: April 2026
        </p>
      </main>
    </div>
  );
}
