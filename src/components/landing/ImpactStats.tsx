import { motion } from "framer-motion";
import { TrendingUp, Clock, HeartPulse, Users } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: "+32%", label: "Increase in follow-up show rates", tint: "text-[hsl(var(--ai-blue))]" },
  { icon: Clock, value: "-24 hrs", label: "Admin time saved per week", tint: "text-[hsl(var(--ai-violet))]" },
  { icon: HeartPulse, value: "$4.5k", label: "Avg. monthly revenue recovered", tint: "text-[hsl(var(--ai-blue))]" },
  { icon: Users, value: "100%", label: "Automated patient engagement", tint: "text-[hsl(var(--ai-violet))]" },
];

export default function ImpactStats() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="pill mb-4">Enterprise ROI</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold tracking-tight">
            Hard metrics that <span className="text-gradient-ai">drive clinic growth.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass rounded-3xl p-6 md:p-8"
              >
                <div className={`w-10 h-10 rounded-xl bg-[hsl(var(--ai-cyan)/0.1)] grid place-items-center mb-4 ${s.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-semibold leading-none">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-3 leading-relaxed">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
