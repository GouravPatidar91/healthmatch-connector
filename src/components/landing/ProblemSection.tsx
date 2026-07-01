import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock, EyeOff, PillBottle, Unlink } from "lucide-react";

const steps = [
  { icon: PillBottle, title: "Patient receives prescription", tone: "neutral" },
  { icon: ArrowRight, title: "Leaves the clinic", tone: "neutral" },
  { icon: Clock, title: "Misses medicines & follow-ups", tone: "warn" },
  { icon: EyeOff, title: "Doctor loses visibility", tone: "warn" },
  { icon: Unlink, title: "Healthcare becomes fragmented", tone: "warn" },
];

export default function ProblemSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="pill mb-4"><AlertCircle className="w-3.5 h-3.5" /> The problem</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Healthcare doesn't end <br /> after the consultation.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Traditional care stops the moment the patient walks out — leaving outcomes to chance.
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-5 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`glass rounded-2xl p-5 ${s.tone === "warn" ? "border-red-100" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl grid place-items-center mb-3 ${
                    s.tone === "warn" ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
                  <div className="text-sm font-medium leading-snug">{s.title}</div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 mx-auto max-w-xl text-center glass rounded-2xl p-6 border-[hsl(var(--ai-cyan)/0.3)]"
          >
            <div className="pill mb-3 mx-auto">Curezy</div>
            <p className="text-base">
              Curezy <span className="text-gradient-ai font-semibold">keeps the patient connected</span> — every day, not just consultation day.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
