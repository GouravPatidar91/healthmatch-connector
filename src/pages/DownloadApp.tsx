import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Stethoscope,
  Pill,
  Truck,
  Activity,
  ShieldCheck,
  FileText,
  CreditCard,
  Phone,
  CheckCircle2,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.curezy.app";
const UPTODOWN_URL = "https://curezy.en.uptodown.com/android";
const PLAY_BADGE =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";
const UPTODOWN_BADGE =
  "https://stc.utdstc.com/img/mediakit/download-gio-big-b.png";

const features = [
  {
    icon: <Activity className="w-6 h-6" />,
    title: "AI Symptom Checker",
    desc: "Describe your symptoms and get instant AI-powered insights with possible causes and next steps.",
  },
  {
    icon: <Stethoscope className="w-6 h-6" />,
    title: "Online Doctor Consultations",
    desc: "Book verified doctors near you and consult via chat, call, or in-person — payment-first, no surprises.",
  },
  {
    icon: <Pill className="w-6 h-6" />,
    title: "Instant Medicine Delivery",
    desc: "Order from nearby pharmacies, upload prescriptions, and track delivery live on the map.",
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "24/7 Emergency Assistance",
    desc: "One-tap emergency support with location sharing and rapid responder matching.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Medical Records Vault",
    desc: "Securely store prescriptions and reports. AI-extracted summaries make follow-ups effortless.",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Secure Payments",
    desc: "Razorpay-powered checkout with UPI, cards, and wallets. End-to-end encrypted.",
  },
];

const trustPoints = [
  "HIPAA-aligned data handling",
  "India DPDP Act 2023 compliant",
  "Verified pharmacies & doctors",
  "Made in India 🇮🇳 — Indore, MP",
];

const faqs = [
  {
    q: "Is the Curezy app free to download?",
    a: "Yes. Curezy is completely free to download from Google Play. You only pay for the medical services or medicines you order through the app.",
  },
  {
    q: "Which devices are supported?",
    a: "Curezy currently supports Android 7.0 (Nougat) and above. An iOS version is on our roadmap.",
  },
  {
    q: "Is my health data safe?",
    a: "Absolutely. Your data is encrypted in transit and at rest, stored on secure infrastructure, and never sold to third parties. See our Privacy Policy for full details.",
  },
  {
    q: "Do I need a prescription to order medicines?",
    a: "For prescription medicines, yes — you can upload a photo of your prescription during checkout. Over-the-counter products can be ordered directly.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at admin@curezy.in or call +91 9165043258. Our team is available 24/7 for emergencies.",
  },
];

const DownloadApp = () => {
  useEffect(() => {
    document.title = "Download Curezy App — AI Health Assistant on Google Play";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Download the Curezy Android app on Google Play. AI symptom checker, online doctor consultations, medicine delivery, and 24/7 emergency assistance. Free."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-white text-gray-900 antialiased overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xl font-bold tracking-tight">Curezy</span>
          </Link>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
          >
            Get it on Google Play
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide mb-6"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            NOW LIVE ON GOOGLE PLAY
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
          >
            Healthcare in your pocket.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Download Curezy.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI symptom checks, verified doctor consultations, instant medicine
            delivery, and 24/7 emergency support — all in one beautifully simple
            Android app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center gap-4"
          >
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Curezy on Google Play"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src={PLAY_BADGE}
                alt="Get it on Google Play"
                className="h-20 w-auto"
              />
            </a>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Free</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Android 7.0+</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                4.8
              </span>
            </div>

            <a
              href={UPTODOWN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-blue-600 underline-offset-4 hover:underline mt-2"
            >
              Can't access Play Store? Download from Uptodown
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase mb-3">
              What's Inside
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need for better health
            </h2>
            <p className="text-gray-600 text-lg">
              Built for India. Designed for everyone.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Curezy */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              Why patients trust Curezy
            </h2>
            <p className="text-blue-100 text-lg">
              Privacy-first, regulator-aligned, and built for real Indian
              healthcare.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {trustPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4"
              >
                <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />
                <span className="font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase mb-3">
              Get Started
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Three steps to better care
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Install the app", d: "Download Curezy free from Google Play in seconds." },
              { n: "02", t: "Create your profile", d: "Sign up with your phone, add health info securely." },
              { n: "03", t: "Get care instantly", d: "Symptoms, doctors, medicines, emergency — all in one tap." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-5xl font-extrabold text-blue-100 mb-3">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold mb-2">{s.t}</h3>
                <p className="text-gray-600 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              Frequently asked questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know before downloading.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white border border-gray-100 rounded-2xl px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready when you are.
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Join thousands using Curezy every day. Free, secure, and built for
            India.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Curezy on Google Play"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src={PLAY_BADGE}
                alt="Get it on Google Play"
                className="h-20 w-auto"
              />
            </a>
            <a
              href={UPTODOWN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-blue-600 underline-offset-4 hover:underline"
            >
              Also available on Uptodown
            </a>
          </div>
        </div>
      </section>

      {/* Mini footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Curezy LLP. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-blue-600">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-blue-600">
              Terms
            </Link>
            <Link to="/contact-us" className="hover:text-blue-600">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DownloadApp;
