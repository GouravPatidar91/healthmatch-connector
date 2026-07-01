import { motion } from "framer-motion";
import { Sparkles, Stethoscope, Upload, Brain, MessageCircle, TrendingUp } from "lucide-react";

const steps = [
  { icon: Sparkles, title: "AI Pre-Assessment", desc: "Patient completes an intelligent intake." },
  { icon: Stethoscope, title: "Doctor Consultation", desc: "Doctor focuses on care, not paperwork." },
  { icon: Upload, title: "Prescription Upload", desc: "Any format — Curezy parses it." },
  { icon: Brain, title: "AI Health Twin", desc: "A living profile is built for the patient." },
  { icon: MessageCircle, title: "Continuous Follow-ups", desc: "WhatsApp + voice AI keep patients on track." },
  { icon: TrendingUp, title: "Better Outcomes", desc: "Adherence up. Readmissions down." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32 bg-gradient-to-b from-white to-[hsl(var(--ai-cyan)/0.04)]">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Six steps to <span className="text-gradient-ai">continuous healthcare.</span>
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-6 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[hsl(var(--ai-cyan))] to-transparent opacity-40" />
          <div className="grid md:grid-cols-6 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-white border-2 border-[hsl(var(--ai-cyan))] grid place-items-center text-[hsl(var(--ai-blue))] shadow-glass relative z-10">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Step {i + 1}</div>
                    <div className="font-display font-semibold text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
