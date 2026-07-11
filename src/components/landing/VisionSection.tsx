import { motion } from "framer-motion";

export default function VisionSection() {
  return (
    <section id="vision" className="py-24 md:py-32 navy-bg text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_20%_30%,_hsl(var(--ai-cyan)/0.4)_0%,_transparent_60%),_radial-gradient(ellipse_at_80%_70%,_hsl(var(--ai-violet)/0.3)_0%,_transparent_60%)]" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-white/10 border border-white/15 text-white/80 mb-6">
            Our Vision
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl leading-[1.05] font-semibold text-white"
          >
            Creating an <span className="text-gradient-ai">AI Health Twin</span><br />
            for every patient.
          </motion.h2>
          <p className="mt-6 text-lg text-white/70 leading-relaxed">
            Curezy is building the intelligence layer connecting patients, providers, clinics, hospitals,
            pharmacies, diagnostics, and insurers into one continuous healthcare ecosystem.
          </p>
        </div>
      </div>
    </section>
  );
}
