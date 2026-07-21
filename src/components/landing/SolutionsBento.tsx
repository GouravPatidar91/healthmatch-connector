import { motion } from "framer-motion";
import { MessageSquare, PhoneCall, Pill, GitBranch, BarChart3 } from "lucide-react";

const Card = ({ className = "", children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay }}
    className={`glass-dark-card rounded-3xl p-6 md:p-7 relative overflow-hidden group hover:border-white/[0.12] transition-colors ${className}`}
  >
    {children}
  </motion.div>
);

const Label = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2 text-white/50 text-xs font-medium mb-4">
    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] grid place-items-center">
      <Icon className="w-3.5 h-3.5 text-white/70" />
    </div>
    {text}
  </div>
);

export default function SolutionsBento() {
  return (
    <section id="solutions" className="py-24 md:py-36">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <div className="eyebrow mb-4">Our solutions</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            AI care agents that <span className="text-white/40">work while you sleep.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {/* Patient Engagement — wide */}
          <Card className="md:col-span-2">
            <Label icon={MessageSquare} text="Patient Engagement Agent" />
            <h3 className="font-display text-2xl font-semibold text-white mb-2">Conversations that feel human — over WhatsApp.</h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-lg">Onboarding, reminders, education, and answers — all in your clinic's voice, in the patient's language.</p>

            <div className="mt-6 flex flex-col gap-2 max-w-md">
              <div className="self-start rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.06] px-4 py-2.5 text-sm text-white/80">Hi Ravi — reminder: your BP check is tomorrow at 10 AM 🌿</div>
              <div className="self-end rounded-2xl rounded-br-sm bg-emerald-500/15 border border-emerald-400/20 px-4 py-2.5 text-sm text-emerald-100">Thanks — I'll be there</div>
              <div className="self-start rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.06] px-4 py-2.5 text-sm text-white/80">Great. Shall I share the parking directions?</div>
            </div>
          </Card>

          {/* Voice */}
          <Card delay={0.05}>
            <Label icon={PhoneCall} text="Voice Follow-up Agent" />
            <h3 className="font-display text-2xl font-semibold text-white mb-2">AI voice that calls, not just texts.</h3>
            <p className="text-white/50 text-sm leading-relaxed">Post-op check-ins, missed-appointment recovery, medication safety calls.</p>
            <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Last call · 0:42</div>
              <div className="flex items-end gap-0.5 h-8">
                {[4, 7, 3, 8, 5, 9, 4, 6, 8, 3, 7, 5, 9, 4, 6, 8, 5, 7, 3, 9, 5, 4, 8, 6].map((h, i) => (
                  <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-[#2563ff] to-[#7cd4ff]" style={{ height: `${h * 10}%` }} />
                ))}
              </div>
              <div className="mt-3 text-xs text-emerald-300">✓ Rescheduled for Wednesday</div>
            </div>
          </Card>

          {/* Adherence */}
          <Card delay={0.1}>
            <Label icon={Pill} text="Adherence & Refills" />
            <h3 className="font-display text-2xl font-semibold text-white mb-2">Never miss a dose. Never miss a refill.</h3>
            <p className="text-white/50 text-sm leading-relaxed">Medication timelines with proactive nudges + one-tap pharmacy handoff.</p>
            <div className="mt-6 space-y-2">
              {[
                { t: "Metformin 500mg", s: "8:00 AM", d: true },
                { t: "Atorvastatin 10mg", s: "9:00 PM", d: true },
                { t: "Refill · Losartan", s: "in 3 days", d: false },
              ].map((x, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${x.d ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <div className="text-white text-sm">{x.t}</div>
                  </div>
                  <div className="text-[11px] text-white/40">{x.s}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Triage */}
          <Card delay={0.15}>
            <Label icon={GitBranch} text="Smart Triage & Routing" />
            <h3 className="font-display text-2xl font-semibold text-white mb-2">Right message. Right person. Instantly.</h3>
            <p className="text-white/50 text-sm leading-relaxed">Auto-routes queries to reception, nurse, or on-call doctor based on intent.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Reception", "Nurse", "On-call Doctor", "Pharmacy", "Billing"].map((t, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70">{t}</span>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-white/60">
              "I have chest pain" → <span className="text-red-300">On-call Doctor</span> · 0.4s
            </div>
          </Card>

          {/* Analytics — wide */}
          <Card className="md:col-span-2" delay={0.2}>
            <Label icon={BarChart3} text="Analytics & ROI" />
            <h3 className="font-display text-2xl font-semibold text-white mb-2">See exactly what care automation earns you.</h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-lg">Live dashboards on adherence, no-show recovery, revenue recaptured, and hours saved.</p>

            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { k: "No-shows", v: "-32%" },
                { k: "Adherence", v: "+41%" },
                { k: "Revenue rec.", v: "₹4.5L" },
                { k: "Hours saved", v: "24 / wk" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">{s.k}</div>
                  <div className="mt-1 text-white font-display text-xl font-semibold">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-end gap-1.5 h-16">
              {[30, 42, 38, 55, 48, 62, 58, 72, 68, 80, 76, 90].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#2563ff]/40 to-[#7cd4ff]/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
