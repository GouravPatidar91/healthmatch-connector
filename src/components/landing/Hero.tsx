import { motion } from "framer-motion";
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react";
import HealthTwinOrb from "./HealthTwinOrb";

export default function Hero() {
  return (
    <section className="relative overflow-hidden hero-bg pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pill mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Introducing the AI Care Operating System
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-[44px] sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.02] font-semibold tracking-tight"
            >
              Building the{" "}
              <span className="text-gradient-ai animate-gradient-shift">AI Care Operating System</span>{" "}
              <span className="font-serif-accent text-muted-foreground">for</span> Continuous Healthcare.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Curezy creates an AI Health Twin for every patient, helping healthcare providers
              deliver personalized care before, during, and after every consultation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a href="#cta" className="btn-primary-ai">
                Get Early Access
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="mailto:admin@curezy.in?subject=Book%20a%20Demo" className="btn-ghost-ai">
                <PlayCircle className="w-4 h-4" />
                Book a Demo
              </a>
            </motion.div>

            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> DPDP-aligned</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ai-cyan))]" /> Enterprise-ready</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ai-violet))]" /> AI-first</div>
            </div>
          </div>

          <div className="relative">
            <HealthTwinOrb />
            {/* floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass absolute top-6 -left-2 md:left-0 rounded-2xl p-3 pr-4 animate-float-slow"
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Prescription</div>
              <div className="text-sm font-medium">Metformin 500mg · 2x daily</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="glass absolute bottom-8 -right-2 md:right-0 rounded-2xl p-3 pr-4 animate-float-slow"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WhatsApp Follow-up</div>
              <div className="text-sm font-medium">"How are you feeling today?"</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="glass absolute top-1/2 -right-6 md:right-8 rounded-2xl px-3 py-2 animate-float-slow"
              style={{ animationDelay: "0.7s" }}
            >
              <div className="text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Adherence 94%
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
