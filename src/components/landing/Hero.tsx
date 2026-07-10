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
              Enterprise Patient Engagement & Care Automation
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-[44px] sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.02] font-semibold tracking-tight"
            >
              <span className="text-gradient-ai animate-gradient-shift">Automate Patient Engagement.</span>{" "}
              <br className="hidden md:block" />
              <span className="font-serif-accent text-muted-foreground">Recover</span> Lost Clinic Revenue.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Curezy is the AI-powered care automation platform that drives medication adherence, reschedules missed follow-ups, and manages routine queries entirely through WhatsApp and Voice.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a href="#demo" className="btn-primary-ai">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#roi" className="btn-ghost-ai">
                <PlayCircle className="w-4 h-4" />
                Calculate ROI
              </a>
            </motion.div>

            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> HIPAA & DPDP Compliant</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ai-cyan))]" /> EMR Integration</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ai-violet))]" /> Zero App Downloads</div>
            </div>
          </div>

          <div className="relative">
            <HealthTwinOrb />
          </div>
        </div>
      </div>
    </section>
  );
}
