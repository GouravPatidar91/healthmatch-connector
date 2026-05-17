import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, Lock, Eye, Users, FileText, Phone, Mail, MapPin,
  Clock, Database, Globe, Baby, RefreshCw, Trash2, ArrowLeft
} from "lucide-react";

const LAST_UPDATED = "May 1, 2026";
const EFFECTIVE_DATE = "May 1, 2026";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy – Curezy LLP";
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.getAttribute("content");
    meta?.setAttribute(
      "content",
      "Curezy Privacy Policy — what data we collect, how we use it, who we share it with, and how long we retain it. Curezy LLP, India."
    );
    return () => { if (meta && original) meta.setAttribute("content", original); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-3">
            <Shield className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-600">How Curezy LLP collects, uses, shares, and retains your data.</p>
          <p className="text-sm text-slate-500 mt-2">Effective date: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}</p>
        </div>

        {/* 1. Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Eye className="h-6 w-6 text-blue-600" /> 1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              This Privacy Policy describes how <strong>Curezy LLP</strong> ("Curezy", "we", "our", "us") — the developer
              of the <strong>Curezy</strong> Android application and the website at{" "}
              <a href="https://healthmatch-connector.lovable.app" className="text-blue-600 hover:underline">healthmatch-connector.lovable.app</a>{" "}
              — collects, uses, shares, and retains your personal data.
            </p>
            <p>
              By creating an account or using Curezy you confirm that you have read and understood this Policy.
              It is governed by the Indian Information Technology Act, 2000, the SPDI Rules, 2011, and the
              Digital Personal Data Protection Act, 2023 (DPDP Act).
            </p>
          </CardContent>
        </Card>

        {/* 2. Data we collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><FileText className="h-6 w-6 text-green-600" /> 2. Data We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">a) Account & profile</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Name, email, phone number, date of birth, gender</li>
                <li>Delivery / clinic addresses</li>
                <li>Emergency contact (only if you choose to add one)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">b) Health data</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Symptoms and AI symptom-check history</li>
                <li>Uploaded prescriptions and medical records (images / PDFs)</li>
                <li>Appointment history and chosen pharmacies / doctors</li>
                <li>Health profile (blood group, allergies, chronic conditions) — optional</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">c) Location</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Precise (GPS)</strong> location — only while you are placing an order, tracking a delivery, or using SOS emergency, and only after you grant permission.</li>
                <li><strong>Approximate</strong> location — to show nearby pharmacies and doctors.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">d) Camera & photos</h3>
              <p>Used only when you choose to upload a prescription, medical record, or profile photo. We do not access the camera or gallery in the background.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">e) Device & technical</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Device model, OS version, app version, language</li>
                <li>IP address, crash logs, diagnostic data</li>
                <li>Firebase Cloud Messaging (FCM) push notification token</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">f) Payment data</h3>
              <p>Payments are processed by <strong>Razorpay</strong>. We store the order amount, status, and a payment reference ID. <strong>We never store your full card number, CVV, or UPI PIN.</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* 3. How we use it */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Users className="h-6 w-6 text-purple-600" /> 3. How We Use Your Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Provide AI symptom analysis and personalised health guidance</li>
              <li>Connect you with doctors, pharmacies, and delivery partners</li>
              <li>Process orders, payments, and deliver medicines</li>
              <li>Route SOS emergency requests and share your location with responders</li>
              <li>Send transactional notifications (order status, appointment reminders, OTPs)</li>
              <li>Detect fraud, abuse, and ensure platform security</li>
              <li>Comply with legal, tax, and regulatory obligations</li>
              <li>Improve the app through aggregated, anonymised analytics</li>
            </ul>
          </CardContent>
        </Card>

        {/* 4. Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Globe className="h-6 w-6 text-indigo-600" /> 4. Who We Share Data With</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-700">
            <p>We share the minimum data necessary, only with the following categories of recipients:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Healthcare providers</strong> — doctors and pharmacies you book or order from receive your name, contact, and the relevant medical context.</li>
              <li><strong>Delivery partners</strong> — receive your delivery address and contact number, only for the duration of the delivery.</li>
              <li><strong>Payment processor</strong> — <strong>Razorpay Software Pvt. Ltd.</strong> processes payments (PCI-DSS compliant).</li>
              <li><strong>Cloud & infrastructure</strong> — <strong>Supabase</strong> (database, authentication, file storage) and <strong>Google Firebase Cloud Messaging</strong> (push notifications).</li>
              <li><strong>Maps & routing</strong> — <strong>Mapbox</strong> and <strong>OpenStreetMap / OSRM</strong> for maps, geocoding, and route ETAs.</li>
              <li><strong>Communications</strong> — <strong>Twilio</strong> for emergency voice calls and SMS where applicable.</li>
              <li><strong>AI providers</strong> — <strong>Google Gemini</strong> and <strong>Groq</strong> for symptom analysis and prescription extraction. Inputs are processed transiently and are not used to train their models.</li>
              <li><strong>Distribution</strong> — <strong>Uptodown</strong> hosts the Android APK; they do not receive your in-app data.</li>
              <li><strong>Analytics</strong> — <strong>Google Analytics</strong> on the website only (no PII).</li>
              <li><strong>Law enforcement</strong> — only when required by Indian law or to protect user safety.</li>
            </ul>
            <p className="text-sm text-slate-600 pt-2"><strong>We do not sell your personal data.</strong> We do not share health data with advertisers.</p>
          </CardContent>
        </Card>

        {/* 5. Data Retention — fixes the rejection */}
        <Card className="mb-6 border-blue-200 bg-blue-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Clock className="h-6 w-6 text-blue-600" /> 5. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <p>We retain your data only for as long as needed to provide the service or to meet a legal obligation. Specific periods:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 bg-white rounded-lg">
                <thead className="bg-slate-100 text-slate-900">
                  <tr>
                    <th className="text-left p-3 border-b border-slate-200">Data category</th>
                    <th className="text-left p-3 border-b border-slate-200">Retention period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-3 border-b border-slate-100">Account profile, health profile, addresses</td><td className="p-3 border-b border-slate-100">Until you delete your account, then <strong>erased within 30 days</strong></td></tr>
                  <tr><td className="p-3 border-b border-slate-100">AI symptom-check history, medical records, prescriptions</td><td className="p-3 border-b border-slate-100">Until you delete them, or within <strong>30 days of account deletion</strong></td></tr>
                  <tr><td className="p-3 border-b border-slate-100">Push notification tokens, device identifiers</td><td className="p-3 border-b border-slate-100">Until logout or account deletion, then erased immediately</td></tr>
                  <tr><td className="p-3 border-b border-slate-100">Location data (live tracking)</td><td className="p-3 border-b border-slate-100">Retained for <strong>90 days</strong> for dispute resolution, then deleted</td></tr>
                  <tr><td className="p-3 border-b border-slate-100">Order invoices & payment records</td><td className="p-3 border-b border-slate-100"><strong>7 years</strong> (Income Tax Act 1961 §44AA &amp; CGST Act 2017 §36)</td></tr>
                  <tr><td className="p-3 border-b border-slate-100">Prescription dispensing records (anonymised)</td><td className="p-3 border-b border-slate-100">As required by the <strong>Drugs &amp; Cosmetics Act, 1940</strong></td></tr>
                  <tr><td className="p-3 border-b border-slate-100">Inactive accounts (no login for 24 months)</td><td className="p-3 border-b border-slate-100">Notified, then <strong>deleted after 36 months</strong> of inactivity</td></tr>
                  <tr><td className="p-3">Aggregated, anonymised analytics</td><td className="p-3">Retained indefinitely (contains no personal identifiers)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              When retention ends, data is permanently deleted from production systems and removed from backups
              within the next backup-rotation cycle (maximum 35 days).
            </p>
          </CardContent>
        </Card>

        {/* 6. Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Lock className="h-6 w-6 text-red-600" /> 6. Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700">
            <ul className="list-disc list-inside space-y-1">
              <li>TLS 1.2+ encryption for all data in transit</li>
              <li>AES-256 encryption at rest for files and database backups</li>
              <li>Row-Level Security (RLS) so users can only access their own data</li>
              <li>Multi-factor authentication for staff with production access</li>
              <li>Regular security audits and vulnerability scans</li>
              <li>Breach notification to affected users and CERT-In within <strong>72 hours</strong> as required by Indian law</li>
            </ul>
          </CardContent>
        </Card>

        {/* 7. Your rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Shield className="h-6 w-6 text-blue-600" /> 7. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-700">
            <p>Under the DPDP Act, 2023 you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Access</strong> a copy of your personal data</li>
              <li><strong>Correct</strong> inaccurate or outdated information</li>
              <li><strong>Delete</strong> your account and associated data — visit our{" "}
                <Link to="/delete-account" className="text-blue-600 hover:underline font-medium">Delete Account page</Link> or use Settings → Account → Delete Account in the app
              </li>
              <li><strong>Export</strong> your data in a portable format</li>
              <li><strong>Withdraw consent</strong> to optional processing at any time</li>
              <li><strong>Nominate</strong> another person to exercise your rights in case of death or incapacity</li>
              <li><strong>Complain</strong> to the Data Protection Board of India</li>
            </ul>
            <p>To exercise any right, email <a href="mailto:privacy@curezy.in" className="text-blue-600 hover:underline">privacy@curezy.in</a>. We respond within <strong>7 business days</strong>.</p>
          </CardContent>
        </Card>

        {/* 8. Account deletion */}
        <Card className="mb-6 border-red-200 bg-red-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Trash2 className="h-6 w-6 text-red-600" /> 8. Account &amp; Data Deletion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700">
            <p>You can request permanent deletion of your account and personal data at any time:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>In-app:</strong> Settings → Account → Delete Account</li>
              <li><strong>Web:</strong> <Link to="/delete-account" className="text-blue-600 hover:underline font-medium">https://healthmatch-connector.lovable.app/delete-account</Link></li>
              <li><strong>Email:</strong> <a href="mailto:admin@curezy.in" className="text-blue-600 hover:underline">admin@curezy.in</a></li>
            </ul>
            <p className="text-sm">Deletion is completed within <strong>30 days</strong>, except for data we are legally required to retain (see Section 5).</p>
          </CardContent>
        </Card>

        {/* 9. Children */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Baby className="h-6 w-6 text-pink-500" /> 9. Children</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700">
            <p>
              Curezy is not directed at children under 18. We do not knowingly collect personal data from minors
              without verifiable parental consent. If you believe a child has provided us with personal data,
              email <a href="mailto:privacy@curezy.in" className="text-blue-600 hover:underline">privacy@curezy.in</a> and we will delete it.
            </p>
          </CardContent>
        </Card>

        {/* 10. International transfers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Database className="h-6 w-6 text-cyan-600" /> 10. Where Your Data Is Stored</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-2">
            <p>
              Your data is stored on Supabase infrastructure in secure data centres. Some of our processors
              (Google, Razorpay, Mapbox, Twilio) may process limited data outside India under contractual
              safeguards required by the DPDP Act, 2023.
            </p>
          </CardContent>
        </Card>

        {/* 11. Changes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><RefreshCw className="h-6 w-6 text-amber-600" /> 11. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified through the
              app or via email at least <strong>30 days</strong> before they take effect. The "Last updated" date
              at the top of this page always reflects the current version.
            </p>
          </CardContent>
        </Card>

        {/* 12. Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><Phone className="h-6 w-6 text-green-600" /> 12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700">
            <p><strong>Curezy LLP</strong> — Grievance &amp; Data Protection Officer</p>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" /><a href="mailto:privacy@curezy.in" className="hover:underline">privacy@curezy.in</a> (privacy)</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" /><a href="mailto:admin@curezy.in" className="hover:underline">admin@curezy.in</a> (general)</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /><a href="tel:+919165043258" className="hover:underline">+91 9165043258</a></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-slate-500 mt-0.5" /><span>Curezy LLP, 27-A Kushwah Shri Nagar, Indore Kumar Khadi, Indore – 452015, Madhya Pradesh, India</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
