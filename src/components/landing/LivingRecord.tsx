import HealthTwinOrb from "./HealthTwinOrb";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const highlights = [
  { k: "Living Profile", v: "Learns from every prescription, report and symptom." },
  { k: "Context-Aware", v: "Understands your history before any AI response." },
  { k: "Portable", v: "One health identity across doctors, pharmacies and labs." },
  { k: "Consent-First", v: "You own it. You decide who sees what." },
];

export default function LivingRecord() {
  return (
    <section id="health-twin" className="py-24 md:py-32 bg-gradient-to-b from-white via-[hsl(var(--ai-cyan)/0.03)] to-white overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="pill mb-4"><Sparkles className="w-3.5 h-3.5" /> AI Health Twin</div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
              A living record of <span className="text-gradient-ai">your health.</span>
            </h2>
            <p className="mt-5 text-muted-foreground text-lg">
              Your Health Twin is a unified profile that continuously evolves — so every recommendation,
              reminder and doctor visit starts with complete context.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="font-display font-semibold text-sm">{h.k}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{h.v}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <HealthTwinOrb size={440} />
          </div>
        </div>
      </div>
    </section>
  );
}
