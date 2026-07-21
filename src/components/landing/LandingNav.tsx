import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Solutions", href: "#solutions" },
  { label: "Case study", href: "#case" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNav() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1080px]"
      >
        <div className="rounded-full border border-white/[0.08] bg-black/50 backdrop-blur-xl grid grid-cols-[auto_1fr_auto] items-center gap-4 pl-4 pr-2 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <Link to="/" className="flex items-center gap-2" aria-label="Curezy home">
            <img src="/curezy logo.png" alt="Curezy" className="h-8 w-auto object-contain" />
            <span className="font-display font-semibold tracking-tight text-[15px] text-white">Curezy</span>
          </Link>
          <nav className="hidden md:flex items-center justify-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-[13px] font-medium text-white/60 hover:text-white rounded-full transition-colors whitespace-nowrap"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end">
            <Link to="/login" className="hidden sm:inline text-[13px] font-medium text-white/60 hover:text-white px-3 whitespace-nowrap">
              Sign in
            </Link>
            <a href="#cta" className="btn-white-pill text-[13px]">Book a demo</a>
          </div>
        </div>
      </motion.header>
    </div>
  );
}
