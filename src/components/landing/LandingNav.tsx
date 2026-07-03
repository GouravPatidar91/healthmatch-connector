import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { label: "How it Works", href: "#how" },
  { label: "Why Curezy", href: "#why" },
  { label: "Vision", href: "#vision" },
];

export default function LandingNav() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1120px,calc(100%-2rem))]">
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="glass rounded-full grid grid-cols-[auto_1fr_auto] items-center gap-4 pl-5 pr-2 py-2">
        <Link to="/" className="flex items-center gap-2" aria-label="Curezy home">
          <img src="/logo.png" alt="Curezy" className="h-7 w-auto object-contain" />
          <span className="font-display font-semibold tracking-tight text-[15px]">Curezy</span>
        </Link>
        <nav className="hidden md:flex items-center justify-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors whitespace-nowrap"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-3 whitespace-nowrap">
            Sign in
          </Link>
          <a href="#cta" className="btn-primary-ai !py-2 !px-4 text-[13px] whitespace-nowrap">Get Early Access</a>
        </div>
      </div>
    </motion.header>
    </div>
  );
}
