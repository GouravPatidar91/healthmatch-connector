import { motion } from "framer-motion";

const stats = [
  { value: "175+", label: "Patients actively onboarded" },
  { value: "+32%", label: "Increase in follow-up show rates" },
  { value: "-24h", label: "Admin time saved per week" },
  { value: "₹4.5L", label: "Avg. monthly revenue recovered" },
];

export default function ImpactStats() {
  return (
    <section id="impact" className="py-24 md:py-32 border-y border-white/[0.06]">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Enterprise ROI</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            Hard metrics that <span className="text-white/40">drive clinic growth.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-dark-card rounded-3xl p-6 md:p-8"
            >
              <div className="font-display text-5xl md:text-6xl font-semibold leading-none text-white tracking-[-0.03em]">{s.value}</div>
              <div className="text-sm text-white/50 mt-4 leading-relaxed">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
