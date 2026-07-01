import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import HealthTwinOrb from "./HealthTwinOrb";

const flow = ["Patient", "Prescription", "Medical Reports", "Symptoms", "Treatment Timeline", "AI Health Twin", "Continuous Personalized Care"];

export default function SolutionSection() {
  return (
    <section id="solution" className="py-24 md:py-32 bg-gradient-to-b from-white via-[hsl(var(--ai-cyan)/0.03)] to-white">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="pill mb-4"><Brain className="w-3.5 h-3.5" /> The solution</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Meet your <span className="text-gradient-ai">AI Health Twin.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            One intelligent profile that continuously learns from every prescription, report,
            and symptom — organizing care into a living, personal healthcare record.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 space-y-2">
            {flow.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-medium ${
                  i === flow.length - 1
                    ? "bg-gradient-cyan text-white"
                    : i === 5
                    ? "bg-[hsl(var(--ai-violet)/0.15)] text-[hsl(var(--ai-violet))]"
                    : "bg-muted text-muted-foreground"
                }`}>{i + 1}</div>
                <div className={`glass rounded-xl px-4 py-3 flex-1 ${i === 5 || i === 6 ? "border-[hsl(var(--ai-cyan)/0.3)]" : ""}`}>
                  <div className="text-sm font-medium">{f}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <HealthTwinOrb size={420} />
          </div>
        </div>
      </div>
    </section>
  );
}
