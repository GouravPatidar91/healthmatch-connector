import { motion } from "framer-motion";
import { MessageSquare, Phone, TrendingUp, Check } from "lucide-react";

function Step({ n, title, desc, children }: { n: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-14 items-center"
    >
      <div>
        <div className="text-white/40 text-sm font-medium mb-3">Step {n}.</div>
        <h3 className="font-display text-3xl md:text-4xl font-semibold text-white tracking-tight leading-[1.05]">{title}</h3>
        <p className="mt-4 text-white/50 text-lg leading-relaxed max-w-md">{desc}</p>
      </div>
      <div className="glass-dark-card rounded-[28px] p-6 md:p-8 min-h-[340px] relative overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-36 relative">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            Three moves. <span className="text-white/40">Continuous care.</span>
          </h2>
        </div>

        <div className="space-y-24 md:space-y-32">
          {/* Step 1 — Listen */}
          <Step
            n="1"
            title="Listen on every channel"
            desc="Curezy connects your clinic's WhatsApp and voice lines, then triages every incoming patient message in real time."
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp inbox · live
            </div>
            <div className="space-y-3">
              {[
                { name: "Priya M.", msg: "Need to refill my diabetes meds", tag: "Refill", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" },
                { name: "Rahul K.", msg: "Can I reschedule Friday's follow-up?", tag: "Follow-up", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
                { name: "Meera V.", msg: "Report link isn't opening", tag: "Query", color: "bg-violet-500/20 text-violet-300 border-violet-400/30" },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 grid place-items-center text-[11px] font-semibold text-white">
                    {m.name.split(" ")[0][0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{m.name}</div>
                    <div className="text-white/50 text-xs truncate">{m.msg}</div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full border ${m.color}`}>{m.tag}</span>
                </motion.div>
              ))}
            </div>
          </Step>

          {/* Step 2 — Engage */}
          <Step
            n="2"
            title="Engage with human-grade AI"
            desc="Our voice and chat agents reschedule, remind, and answer questions in your clinic's tone — 24/7, in the patient's language."
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Voice agent · call in progress
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white text-sm font-medium">Calling Anjali S.</div>
                <div className="text-[10px] text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </div>
              </div>
              <div className="flex items-end gap-1 h-10">
                {[3, 6, 9, 5, 8, 4, 7, 10, 6, 9, 4, 7, 5, 8, 3, 6, 9, 5, 7, 4, 8, 6, 3, 7].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[#2563ff] to-[#7cd4ff] rounded-full"
                    style={{ height: `${h * 10}%`, animation: `pulse-ring 1.2s ease-in-out ${i * 0.05}s infinite alternate`, opacity: 0.5 + (h / 20) }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/40 pl-1">"Hi Anjali, this is Curezy AI from Dr. Menon's clinic. Just checking if the new medication is working well…"</div>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Rescheduled", "Reminded", "Escalated to Dr."].map((t, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70">{t}</span>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 3 — Recover */}
          <Step
            n="3"
            title="Recover revenue, automatically"
            desc="Every recovered follow-up, refill, and escalation shows up as a line item — so you see ROI without lifting a finger."
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> This week · auto-generated
            </div>
            <div className="space-y-2">
              {[
                { label: "No-shows recovered", value: "+12", note: "≈ ₹18,000 revenue" },
                { label: "Refills confirmed", value: "+38", note: "adherence 92%" },
                { label: "Follow-ups booked", value: "+27", note: "via WhatsApp" },
                { label: "Escalations routed", value: "+6", note: "to on-call doctor" },
                { label: "Admin hours saved", value: "24h", note: "across clinic staff" },
              ].map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 grid place-items-center">
                      <Check className="w-3 h-3 text-emerald-300" />
                    </div>
                    <div className="text-white text-sm">{r.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">{r.value}</div>
                    <div className="text-[10px] text-white/40">{r.note}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Step>
        </div>
      </div>
    </section>
  );
}
