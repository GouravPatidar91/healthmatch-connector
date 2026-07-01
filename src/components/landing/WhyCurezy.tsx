import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { trad: "Consultation Ends", cur: "Continuous Care" },
  { trad: "Manual Follow-ups", cur: "AI Automation" },
  { trad: "Fragmented Records", cur: "Unified AI Health Twin" },
  { trad: "Reactive Healthcare", cur: "Predictive Healthcare" },
];

export default function WhyCurezy() {
  return (
    <section id="why" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="pill mb-4">Why Curezy</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            A different kind of <span className="text-gradient-ai">healthcare stack.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Traditional Healthcare</div>
            <ul className="space-y-3">
              {rows.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 grid place-items-center text-red-500 shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-muted-foreground line-through decoration-red-200">{r.trad}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-3xl p-6 border-[hsl(var(--ai-cyan)/0.3)] bg-gradient-to-br from-white to-[hsl(var(--ai-cyan)/0.04)]"
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(var(--ai-blue))] mb-4 font-semibold">Curezy</div>
            <ul className="space-y-3">
              {rows.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-cyan grid place-items-center text-white shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{r.cur}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
