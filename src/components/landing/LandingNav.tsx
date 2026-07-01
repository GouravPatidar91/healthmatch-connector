import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { label: "Product", href: "#features" },
  { label: "How it Works", href: "#how" },
  { label: "Why Curezy", href: "#why" },
  { label: "Vision", href: "#vision" },
];

export default function LandingNav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1120px,calc(100%-2rem))]"
    >
      <div className="glass rounded-full flex items-center justify-between pl-5 pr-2 py-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-cyan grid place-items-center text-white font-bold text-xs">C</div>
          <span className="font-display font-semibold tracking-tight text-[15px]">Curezy</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-3">
            Sign in
          </Link>
          <a href="#cta" className="btn-primary-ai !py-2 !px-4 text-[13px]">Get Early Access</a>
        </div>
      </div>
    </motion.header>
  );
}
