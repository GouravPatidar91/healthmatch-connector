import { motion } from "framer-motion";

const metrics = [
  { v: "175+", k: "Patients onboarded" },
  { v: "30%", k: "Fewer no-shows" },
  { v: "4 hrs", k: "Saved per staff / day" },
  { v: "₹4.5L", k: "Revenue recovered / mo" },
];

export default function CaseStudy() {
  return (
    <section id="case" className="py-24 md:py-36">
      <div className="container">
        <div className="max-w-3xl mb-14">
          <div className="eyebrow mb-4">Case study</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            How clinics use Curezy to <span className="text-white/40">scale care without scaling headcount.</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-dark-card rounded-[32px] p-6 md:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center"
        >
          <div>
            <div className="text-white/50 text-sm mb-3">A 3-doctor OPD clinic · Bengaluru</div>
            <p className="text-white text-xl md:text-2xl leading-snug font-display font-medium">
              "We replaced two spreadsheets, one call center, and a lot of chasing —
              with Curezy. Our follow-up rate doubled in six weeks."
            </p>
            <div className="mt-6 text-white/50 text-sm">— Practice Manager, verified partner clinic</div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {metrics.map((m, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="font-display text-3xl font-semibold text-white">{m.v}</div>
                  <div className="text-white/50 text-xs mt-1">{m.k}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] aspect-[3/4] bg-gradient-to-br from-[#0b1220] to-[#122036]" />
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] aspect-[3/4] bg-gradient-to-br from-[#141127] to-[#251b3a] mt-8" />
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] aspect-[3/4] bg-gradient-to-br from-[#0d1a1f] to-[#123037]" />
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] aspect-[3/4] bg-gradient-to-br from-[#1a1023] to-[#2c1638] mt-8" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
