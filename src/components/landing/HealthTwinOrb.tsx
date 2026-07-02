import { motion } from "framer-motion";
import { FileText, Activity, Stethoscope, ShieldCheck } from "lucide-react";

/**
 * Professional AI Care OS visualization.
 * - Central "AI Health Twin" core with orbiting rings
 * - Real brand marks (WhatsApp, AI Voice) plus clinical data nodes
 * - Static composed layout (no gimmicky rotation) with subtle motion
 */

function WhatsAppMark({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        fill="#25D366"
        d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z"
      />
      <path
        fill="#fff"
        d="M23.4 19.6c-.32-.16-1.87-.92-2.16-1.02-.29-.11-.5-.16-.71.16-.21.32-.82 1.02-1 1.23-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.77-2.19-.18-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.4 5.39 4.77.75.32 1.34.52 1.8.66.75.24 1.44.21 1.98.13.6-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37z"
      />
    </svg>
  );
}

function VoiceAgentMark({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="voiceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="10" width="2" height="4" rx="1" fill="url(#voiceGrad)" />
      <rect x="6" y="7" width="2" height="10" rx="1" fill="url(#voiceGrad)" />
      <rect x="10" y="3" width="2" height="18" rx="1" fill="url(#voiceGrad)" />
      <rect x="14" y="7" width="2" height="10" rx="1" fill="url(#voiceGrad)" />
      <rect x="18" y="10" width="2" height="4" rx="1" fill="url(#voiceGrad)" />
    </svg>
  );
}

type Node = {
  label: string;
  sub: string;
  icon: React.ReactNode;
  x: string;
  y: string;
  delay: number;
};

const nodes: Node[] = [
  {
    label: "WhatsApp",
    sub: "Follow-ups & Reminders",
    icon: <WhatsAppMark />,
    x: "-6%",
    y: "8%",
    delay: 0.2,
  },
  {
    label: "AI Voice Agent",
    sub: "Post-visit calls",
    icon: <VoiceAgentMark />,
    x: "78%",
    y: "12%",
    delay: 0.35,
  },
  {
    label: "Prescription",
    sub: "Metformin 500mg · 2x",
    icon: <FileText className="w-4 h-4 text-[hsl(var(--ai-blue))]" />,
    x: "-10%",
    y: "62%",
    delay: 0.5,
  },
  {
    label: "Vitals",
    sub: "BP 118/76 · HR 72",
    icon: <Activity className="w-4 h-4 text-emerald-500" />,
    x: "82%",
    y: "60%",
    delay: 0.65,
  },
  {
    label: "Consult Notes",
    sub: "Dr. Sharma · Today",
    icon: <Stethoscope className="w-4 h-4 text-[hsl(var(--ai-violet))]" />,
    x: "36%",
    y: "92%",
    delay: 0.8,
  },
];

export default function HealthTwinOrb({ size = 480 }: { size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* concentric rings */}
      {[0.5, 0.72, 0.95].map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 m-auto rounded-full border border-border/40"
          style={{ width: size * s, height: size * s }}
        />
      ))}

      {/* orbit dots */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-[hsl(var(--ai-cyan))] shadow-glow-cyan"
          style={{ transform: `translate(${size * 0.36}px, -50%)` }}
        />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--ai-violet))]"
          style={{ transform: `translate(-${size * 0.475}px, -50%)` }}
        />
      </motion.div>

      {/* outer glow */}
      <div
        className="absolute inset-0 m-auto rounded-full bg-gradient-cyan opacity-10 blur-3xl"
        style={{ width: size * 0.55, height: size * 0.55 }}
      />

      {/* core sphere */}
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 m-auto rounded-full grid place-items-center"
        style={{
          width: size * 0.34,
          height: size * 0.34,
          background:
            "radial-gradient(circle at 30% 25%, hsl(var(--ai-cyan)) 0%, hsl(var(--ai-blue)) 45%, hsl(var(--ai-violet)) 100%)",
          boxShadow:
            "0 20px 60px -20px hsl(var(--ai-blue) / 0.55), inset 0 -10px 30px hsl(var(--ai-violet) / 0.35), inset 0 10px 30px hsl(var(--ai-cyan) / 0.35)",
        }}
      >
        {/* specular highlight */}
        <div
          className="absolute rounded-full bg-white/30 blur-md"
          style={{ width: "35%", height: "22%", top: "12%", left: "20%" }}
        />
        <div className="relative text-center text-white">
          <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">Curezy</div>
          <div className="font-display font-semibold text-[15px] leading-tight mt-0.5">
            AI Health<br />Twin
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider bg-white/15 backdrop-blur px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-2.5 h-2.5" /> DPDP Secure
          </div>
        </div>
      </motion.div>

      {/* nodes */}
      {nodes.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: n.delay }}
          className="absolute"
          style={{ left: n.x, top: n.y }}
        >
          <div className="glass rounded-2xl pl-2.5 pr-3.5 py-2 flex items-center gap-2.5 shadow-lg shadow-black/[0.04]">
            <div className="w-7 h-7 rounded-lg bg-background/80 border border-border/60 grid place-items-center">
              {n.icon}
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold text-foreground">{n.label}</div>
              <div className="text-[10px] text-muted-foreground">{n.sub}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
