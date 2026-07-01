import { motion } from "framer-motion";

const screens = [
  { title: "Patient Dashboard", tint: "from-[hsl(var(--ai-cyan))] to-[hsl(var(--ai-blue))]", meta: "Home · Upcoming visits" },
  { title: "Prescription OCR", tint: "from-[hsl(var(--ai-violet))] to-[hsl(var(--ai-blue))]", meta: "AI extraction · 98% accuracy" },
  { title: "AI Health Twin", tint: "from-[hsl(var(--ai-cyan))] to-[hsl(var(--ai-violet))]", meta: "Living health profile" },
  { title: "WhatsApp Follow-up", tint: "from-emerald-400 to-teal-500", meta: "Auto-personalized nudges" },
  { title: "Doctor Dashboard", tint: "from-slate-700 to-slate-900", meta: "Practice command center" },
];

function Phone({ title, tint, meta, index }: { title: string; tint: string; meta: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative shrink-0"
    >
      <div className="w-[220px] h-[440px] rounded-[38px] bg-slate-900 p-2 shadow-elevated">
        <div className={`w-full h-full rounded-[30px] bg-gradient-to-br ${tint} relative overflow-hidden`}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black/50" />
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute bottom-6 left-4 right-4 glass rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta}</div>
            <div className="text-sm font-semibold mt-0.5">{title}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductScreens() {
  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">Product screens</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Designed for <span className="text-gradient-ai">every screen</span> that matters.
          </h2>
        </div>
      </div>
      <div className="relative">
        <div className="flex gap-6 px-8 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none">
          {screens.map((s, i) => (
            <div key={i} className="snap-center"><Phone {...s} index={i} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
