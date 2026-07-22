import { motion } from "framer-motion";
import { Workflow, PhoneCall, BarChart3, Users, MessageSquare, Bot, Linkedin, Mail, MessageCircle, Phone, Smartphone, Instagram, Check, X, ChevronRight, Search } from "lucide-react";

/* -----------------------------------------------------------
   Shared card shell — matches Knotch's soft-glow dark tiles
------------------------------------------------------------ */
const Card = ({
  className = "",
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.015] p-6 md:p-7 backdrop-blur-xl transition-colors hover:border-white/[0.12] ${className}`}
  >
    {/* inner top gloss */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    {/* subtle vignette */}
    <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-[radial-gradient(120%_60%_at_50%_0%,rgba(120,150,255,0.08),transparent_60%)]" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const TitleBlock = ({ title, desc }: { title: string; desc: string }) => (
  <>
    <h3 className="font-display text-[22px] md:text-2xl font-semibold text-white leading-snug">
      <span className="text-white">{title}</span>{" "}
      <span className="text-white/45">{desc}</span>
    </h3>
  </>
);

/* -----------------------------------------------------------
   Card 1 — Workflow Automation (wide, animated pipeline)
------------------------------------------------------------ */
const WorkflowMock = () => {
  const steps = [
    { label: "Book consult", state: "ok" },
    { label: "Send pre-assessment", state: "run" },
    { label: "AI voice follow-up", state: "err" },
  ];
  return (
    <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0a0d16]/60 p-4">
      <div className="mx-auto max-w-[260px] space-y-3">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 * i, duration: 0.5 }}
            className="relative flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.05] border border-white/[0.08]">
                <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
              </div>
              <div className="text-sm text-white/85">{s.label}</div>
            </div>
            {s.state === "ok" && (
              <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
                <Check className="h-3 w-3" />
              </div>
            )}
            {s.state === "run" && (
              <div className="h-5 w-5 rounded-full border-2 border-amber-300/40 border-t-amber-300 animate-spin" />
            )}
            {s.state === "err" && (
              <div className="grid h-5 w-5 place-items-center rounded-full bg-rose-400/20 text-rose-300">
                <X className="h-3 w-3" />
              </div>
            )}
            {i < steps.length - 1 && (
              <div className="absolute -bottom-3 left-6 h-3 w-px bg-white/10" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
   Card 2 — Voice Agent (waveform + phone)
------------------------------------------------------------ */
const VoiceMock = () => (
  <div className="mt-6 flex h-[180px] items-center justify-center">
    <div className="flex items-center gap-2">
      {[3, 6, 4, 8, 5, 9].map((h, i) => (
        <motion.span
          key={`l-${i}`}
          className="w-[3px] rounded-full bg-gradient-to-t from-[#2563ff] to-[#7cd4ff]"
          animate={{ height: [`${h * 4}px`, `${h * 8}px`, `${h * 4}px`] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
        />
      ))}
      <div className="mx-3 grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a0d16] shadow-[0_0_30px_rgba(80,140,255,0.35)]">
        <PhoneCall className="h-6 w-6 text-white" />
      </div>
      {[9, 5, 8, 4, 6, 3].map((h, i) => (
        <motion.span
          key={`r-${i}`}
          className="w-[3px] rounded-full bg-gradient-to-t from-[#2563ff] to-[#7cd4ff]"
          animate={{ height: [`${h * 4}px`, `${h * 8}px`, `${h * 4}px`] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 + 0.3 }}
        />
      ))}
    </div>
  </div>
);

/* -----------------------------------------------------------
   Card 3 — Health Analytics (chart panel, Knotch style)
------------------------------------------------------------ */
const AnalyticsMock = () => {
  const rows = [
    { k: "Adherence", v: "+41%", w: "84%" },
    { k: "No-shows", v: "-32%", w: "68%" },
    { k: "Recovery", v: "+27%", w: "72%" },
    { k: "Revenue", v: "₹4.5L", w: "90%" },
    { k: "Retention", v: "+38%", w: "80%" },
  ];
  return (
    <div className="mt-2 rounded-2xl border border-white/[0.06] bg-[#0a0d16]/60 p-4">
      <div className="flex items-start justify-between text-[10px] uppercase tracking-widest text-white/40">
        <div>
          <div>Impact</div>
          <div className="mt-1 font-display text-xl font-semibold text-white normal-case tracking-normal">
            +41% <span className="text-white/40">adherence</span>
          </div>
        </div>
        <div className="text-right">
          <div>Saved</div>
          <div className="mt-1 font-display text-xl font-semibold text-white normal-case tracking-normal">24h/wk</div>
        </div>
      </div>

      {/* mini area chart */}
      <svg viewBox="0 0 220 60" className="mt-3 h-14 w-full">
        <defs>
          <linearGradient id="cx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cd4ff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#7cd4ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 50 L20 42 L40 46 L60 34 L80 38 L100 26 L120 30 L140 18 L160 22 L180 12 L200 16 L220 6 L220 60 L0 60 Z" fill="url(#cx)" />
        <path d="M0 50 L20 42 L40 46 L60 34 L80 38 L100 26 L120 30 L140 18 L160 22 L180 12 L200 16 L220 6" stroke="#7cd4ff" strokeWidth="1.5" fill="none" />
      </svg>

      <div className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <div className="w-16 text-white/50">{r.k}</div>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: r.w }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.08 }}
                className="h-full rounded-full bg-gradient-to-r from-[#2563ff] to-[#7cd4ff]"
              />
            </div>
            <div className="w-10 text-right text-white/70">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
   Card 4 — Care Team Agents (avatar rows)
------------------------------------------------------------ */
const agents = [
  { name: "Naya", role: "Nurse triage agent", color: "from-emerald-400/40 to-emerald-500/10", dot: "bg-emerald-400" },
  { name: "Ravi", role: "Follow-up voice agent", color: "from-sky-400/40 to-sky-500/10", dot: "bg-sky-400" },
  { name: "Meera", role: "Reception & booking", color: "from-violet-400/40 to-violet-500/10", dot: "bg-violet-400" },
  { name: "Kabir", role: "Adherence coach", color: "from-amber-400/40 to-amber-500/10", dot: "bg-amber-400" },
  { name: "Ira", role: "Records & billing", color: "from-rose-400/40 to-rose-500/10", dot: "bg-rose-400" },
];
const AgentsMock = () => (
  <div className="mt-2 grid grid-cols-2 gap-2">
    {agents.map((a, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
        className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
      >
        <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${a.color} text-white text-xs font-semibold`}>
          {a.name[0]}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] text-white/90">{a.name}</div>
          <div className="truncate text-[10px] text-white/45">{a.role}</div>
        </div>
        <span className={`ml-auto h-1.5 w-1.5 rounded-full ${a.dot}`} />
      </motion.div>
    ))}
  </div>
);

/* -----------------------------------------------------------
   Card 5 — WhatsApp Engagement Suite (Knotch marketing-suite clone)
------------------------------------------------------------ */
const EngagementSuiteMock = () => {
  const channels = [
    { icon: MessageCircle, label: "WhatsApp", on: true },
    { icon: Phone, label: "Voice call", on: true },
    { icon: Smartphone, label: "SMS", on: true },
    { icon: Mail, label: "Email", on: false },
    { icon: Instagram, label: "Instagram", on: false },
    { icon: Linkedin, label: "LinkedIn", on: false },
  ];
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d16]/70">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500/20 text-emerald-300">
            <MessageCircle className="h-3 w-3" />
          </div>
          Engagement Suite
        </div>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/50">
          <Search className="h-3 w-3" />
          Searching for at-risk patients…
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/70">
          Outreach channels <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        {channels.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="flex items-center justify-between px-1 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${c.on ? "text-white/85" : "text-white/25"}`} />
                <span className={c.on ? "text-white/85" : "text-white/35"}>{c.label}</span>
              </div>
              <div className={`relative h-3.5 w-6 rounded-full ${c.on ? "bg-emerald-500/60" : "bg-white/[0.08]"}`}>
                <div className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${c.on ? "left-3" : "left-0.5"}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
   Card 6 — Custom Chatbot
------------------------------------------------------------ */
const ChatbotMock = () => (
  <div className="mt-4 space-y-2">
    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">
      <Bot className="h-3.5 w-3.5 text-[#7cd4ff]" />
      Curezy Copilot
      <ChevronRight className="ml-auto h-3 w-3" />
    </div>
    <div className="self-start rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white/80">
      "What are the side effects of my new BP medicine?"
    </div>
    <div className="self-end ml-6 rounded-2xl rounded-br-sm border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
      Common: mild dizziness in week 1. Escalating to Dr. Rao if severe.
    </div>
    <div className="flex items-center gap-1 pl-1 text-[10px] text-white/40">
      <span className="h-1 w-1 animate-pulse rounded-full bg-white/40" />
      typing…
    </div>
  </div>
);

/* -----------------------------------------------------------
   Section
------------------------------------------------------------ */
export default function SolutionsBento() {
  return (
    <section id="solutions" className="py-24 md:py-36">
      <div className="container">
        <div className="mb-14 text-center">
          <div className="eyebrow mb-4 inline-block">Our solutions</div>
          <h2 className="mx-auto max-w-3xl font-display text-4xl md:text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-white">
            AI care agents that <span className="text-white/40">help clinics run faster and heal deeper.</span>
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {/* Row 1 */}
          <Card className="md:col-span-2">
            <TitleBlock title="Workflow Automation." desc="Automate repetitive care tasks and streamline your clinic operations end-to-end." />
            <WorkflowMock />
          </Card>

          <Card delay={0.05}>
            <div className="flex flex-col h-full">
              <VoiceMock />
              <TitleBlock title="AI Voice Agents." desc="Let AI call, remind, and follow up with patients naturally — every single day." />
            </div>
          </Card>

          {/* Row 2 */}
          <Card delay={0.1}>
            <AnalyticsMock />
            <div className="mt-4">
              <TitleBlock title="Care Analytics." desc="Turn clinic data into clear, actionable insights you can act on today." />
            </div>
          </Card>

          <Card delay={0.15}>
            <TitleBlock title="Care Team Agents." desc="A pod of specialized AI teammates that think and act intelligently for your practice." />
            <AgentsMock />
          </Card>

          <Card delay={0.2}>
            <TitleBlock title="Patient Engagement." desc="Run reminders, follow-ups, and campaigns across WhatsApp, SMS and voice — automatically." />
            <EngagementSuiteMock />
          </Card>

          {/* Row 3 */}
          <Card delay={0.25} className="md:col-span-3">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <TitleBlock title="Custom Care Chatbots." desc="Give every patient a 24/7 medically-grounded copilot for symptoms, meds, and records." />
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Symptoms", "Medication", "Appointments", "Records", "Billing", "Escalation"].map((t) => (
                    <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">{t}</span>
                  ))}
                </div>
              </div>
              <ChatbotMock />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
