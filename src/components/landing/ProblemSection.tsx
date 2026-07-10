import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock, EyeOff, PillBottle, Unlink } from "lucide-react";

const steps = [
  { icon: PillBottle, title: "Consultation ends", tone: "neutral" },
  { icon: ArrowRight, title: "Patient leaves the clinic", tone: "neutral" },
  { icon: Clock, title: "Patient misses follow-up", tone: "warn" },
  { icon: EyeOff, title: "Clinic loses 30% LTV", tone: "warn" },
  { icon: Unlink, title: "Admin staff overwhelmed", tone: "warn" },
];

export default function ProblemSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="pill mb-4"><AlertCircle className="w-3.5 h-3.5" /> The Clinic Leakage Problem</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold tracking-tight">
            Providers lose up to 40% of revenue <br /> to missed follow-ups.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Manual patient communication is unscalable. Front-desk staff are overwhelmed making reminder calls, and patients still slip through the cracks.
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
            <div className="pill mb-3 mx-auto">The Curezy Solution</div>
            <p className="text-base text-muted-foreground">
              Curezy acts as an <span className="text-foreground font-semibold">intelligent patient engagement layer</span>, automatically recovering lost revenue without increasing staff headcount.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
