import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#how" },
      { label: "Why Curezy", href: "#why" },
      { label: "Download App", href: "/download-app" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Vision", href: "#vision" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Play Store", href: "https://play.google.com/store/apps/details?id=com.curezy.app" },
      { label: "Delete Account", href: "/delete-account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-of-service" },
      { label: "Refund", href: "/refund-policy" },
      { label: "Shipping", href: "/shipping-policy" },
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
              <div className="w-8 h-8 rounded-lg bg-gradient-cyan grid place-items-center text-white font-bold text-sm">C</div>
              <span className="font-display font-semibold text-lg">Curezy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Building the AI Care Operating System for continuous healthcare.
            </p>
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
