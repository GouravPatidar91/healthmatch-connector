import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 md:pt-52 md:pb-32">
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#2563ff] text-white text-[11px] font-semibold px-3 py-1 mb-8 shadow-[0_0_30px_-5px_rgba(37,99,255,0.6)]"
          >
            New · AI Care OS for Clinics
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-white text-[44px] sm:text-6xl md:text-7xl lg:text-[84px] leading-[0.98] font-semibold tracking-[-0.045em]"
          >
            We make AI work for your clinic.
            <br />
            <span className="text-white/50">Not against your patients.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Curezy automates patient engagement, medication adherence, and follow-ups over
            WhatsApp and Voice — so your team focuses on care, not chasing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <a href="#cta" className="btn-white-pill">
              Book a demo <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#solutions" className="btn-glass-pill">
              View solutions
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-white/40 font-medium"
          >
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> HIPAA & DPDP</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2563ff]" /> EMR-ready</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Zero downloads</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
