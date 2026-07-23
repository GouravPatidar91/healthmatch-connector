import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

const cols = [
  {
    title: "Platform",
    links: [
      { label: "WhatsApp Automation", href: "#solutions" },
      { label: "AI Voice Agents", href: "#solutions" },
      { label: "EMR Integrations", href: "#solutions" },
      { label: "Case study", href: "#case" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact Sales", href: "mailto:sales@curezy.in" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "App",
    links: [
      { label: "Download App", href: "/download" },
      { label: "Help Center", href: "#help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Delete Account", href: "/delete-account" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="container py-16">
        <div className="grid md:grid-cols-6 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/curezy logo.png" alt="Curezy" className="h-8 w-auto object-contain" />
              <span className="font-display font-semibold text-lg text-white">Curezy</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              The AI Care Operating System for modern clinics. WhatsApp + Voice, automated end-to-end.
            </p>
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Backed by</p>
              <a
                href="https://elevenlabs.io/startup-grants"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ElevenLabs Startup Grants"
                className="opacity-80 hover:opacity-100 transition-opacity inline-block"
              >
                <img
                  src="/elevenlabs-grants.webp"
                  alt="ElevenLabs Grants"
                  className="w-[180px] h-auto object-contain invert"
                />
              </a>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <a href="mailto:admin@curezy.in" className="w-9 h-9 rounded-full border border-white/[0.1] grid place-items-center text-white/70 hover:text-white hover:border-white/30 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/[0.1] grid place-items-center text-white/70 hover:text-white hover:border-white/30 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/[0.1] grid place-items-center text-white/70 hover:text-white hover:border-white/30 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-[0.18em] text-white/40 mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link to={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/40">© {new Date().getFullYear()} Curezy LLP. All rights reserved.</div>
          <div className="text-xs text-white/40">Made with care in India.</div>
        </div>
      </div>
    </footer>
  );
}
