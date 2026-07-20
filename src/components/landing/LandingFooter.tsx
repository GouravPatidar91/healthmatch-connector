import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

const cols = [
  {
    title: "Platform",
    links: [
      { label: "WhatsApp Automation", href: "#whatsapp" },
      { label: "AI Voice Agents", href: "#voice" },
      { label: "EMR Integrations", href: "#integrations" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Sales", href: "mailto:sales@curezy.in" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "API Documentation", href: "#api" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "HIPAA Compliance", href: "/hipaa" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="border-t hairline bg-white">
      <div className="container py-16">
        <div className="grid md:grid-cols-6 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/curezy logo.png" alt="Curezy" className="h-9 w-auto object-contain" />
              <span className="font-display font-semibold text-lg">Curezy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The intelligent care automation platform for modern healthcare providers.
            </p>
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Supported by</p>
              <a
                href="https://elevenlabs.io/startup-grants"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ElevenLabs Startup Grants"
              >
                <img
                  src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp"
                  alt="ElevenLabs Grants"
                  className="w-[150px] h-auto object-contain"
                />
              </a>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <a href="mailto:admin@curezy.in" className="w-9 h-9 rounded-full border hairline grid place-items-center hover:border-[hsl(var(--ai-cyan))] transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border hairline grid place-items-center hover:border-[hsl(var(--ai-cyan))] transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border hairline grid place-items-center hover:border-[hsl(var(--ai-cyan))] transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link to={l.href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t hairline flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Curezy LLP. All rights reserved.</div>
          <div className="text-xs text-muted-foreground">Made with care in India.</div>
        </div>
      </div>
    </footer>
  );
}
