import { motion } from "framer-motion";
import { FileText, Activity, Stethoscope, ShieldCheck } from "lucide-react";
import whatsappLoop from "@/assets/hero-whatsapp-loop.mp4.asset.json";
import voiceLoop from "@/assets/hero-voice-loop.mp4.asset.json";

/**
 * Professional AI Care OS visualization.
 * Live motion-graphic feel: animated connection lines with traveling data pulses,
 * reactive icons (WhatsApp tick pop, live voice waveform, ECG trace, prescription
 * check-off), rotating orbit rings, and a breathing core.
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

/** Live animated voice waveform — bars pulse continuously. */
function LiveVoiceMark({ className = "w-4 h-4" }: { className?: string }) {
  const bars = [
    { x: 2, base: 4, amp: 2, dur: 0.9 },
    { x: 6, base: 10, amp: 5, dur: 0.7 },
    { x: 10, base: 18, amp: 8, dur: 0.6 },
    { x: 14, base: 10, amp: 5, dur: 0.75 },
    { x: 18, base: 4, amp: 2, dur: 0.95 },
  ];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="voiceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          width={2}
          rx={1}
          fill="url(#voiceGrad)"
          y={12 - b.base / 2}
          height={b.base}
        >
          <animate
            attributeName="height"
            values={`${b.base};${b.base + b.amp};${b.base}`}
            dur={`${b.dur}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            values={`${12 - b.base / 2};${12 - (b.base + b.amp) / 2};${12 - b.base / 2}`}
            dur={`${b.dur}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </svg>
  );
}

/** Live ECG trace — a path scrolls across a small window. */
function EcgMark({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="ecgGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M0 12 L8 12 L10 6 L12 18 L14 4 L16 20 L18 12 L26 12 L28 6 L30 18 L32 4 L34 20 L36 12 L40 12"
          fill="none"
          stroke="url(#ecgGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0 120;120 0"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}

type NodePos = { xPct: number; yPct: number };

type Node = {
  label: string;
  sub: string;
  icon: React.ReactNode;
  pos: NodePos; // card position (top-left corner) in % of container
  anchor: NodePos; // connection endpoint on card edge, in % of container
  delay: number;
  accent: string; // rgb/hsl color for the connection glow
  videoUrl?: string; // optional looping motion-graphic behind the icon
};

// Positions tuned around a 480px container (percentages).
const nodes: Node[] = [
  {
    label: "WhatsApp",
    sub: "Follow-ups & Reminders",
    icon: <WhatsAppMark />,
    pos: { xPct: -6, yPct: 8 },
    anchor: { xPct: 30, yPct: 22 },
    delay: 0.2,
    accent: "#25D366",
    videoUrl: whatsappLoop.url,
  },
  {
    label: "AI Voice Agent",
    sub: "Post-visit calls",
    icon: <LiveVoiceMark />,
    pos: { xPct: 78, yPct: 12 },
    anchor: { xPct: 78, yPct: 24 },
    delay: 0.35,
    accent: "#7C5CFF",
    videoUrl: voiceLoop.url,
  },
  {
    label: "Prescription",
    sub: "Metformin 500mg · 2x",
    icon: <FileText className="w-4 h-4 text-[hsl(var(--ai-blue))]" />,
    pos: { xPct: -10, yPct: 62 },
    anchor: { xPct: 28, yPct: 70 },
    delay: 0.5,
    accent: "#3B82F6",
  },
  {
    label: "Vitals",
    sub: "BP 118/76 · HR 72",
    icon: <EcgMark />,
    pos: { xPct: 82, yPct: 60 },
    anchor: { xPct: 82, yPct: 70 },
    delay: 0.65,
    accent: "#10B981",
  },
  {
    label: "Consult Notes",
    sub: "Dr. Sharma · Today",
    icon: <Stethoscope className="w-4 h-4 text-[hsl(var(--ai-violet))]" />,
    pos: { xPct: 36, yPct: 92 },
    anchor: { xPct: 50, yPct: 82 },
    delay: 0.8,
    accent: "#8B5CF6",
  },
];

export default function HealthTwinOrb({ size = 480 }: { size?: number }) {
  const cx = 50; // % center
  const cy = 50;

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

      {/* SVG: connection lines with live traveling pulses */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {nodes.map((n, i) => (
            <linearGradient
              key={i}
              id={`line-${i}`}
              x1={`${n.anchor.xPct}%`}
              y1={`${n.anchor.yPct}%`}
              x2={`${cx}%`}
              y2={`${cy}%`}
            >
              <stop offset="0%" stopColor={n.accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={n.accent} stopOpacity="0.05" />
            </linearGradient>
          ))}
        </defs>
        {nodes.map((n, i) => {
          const x1 = n.anchor.xPct;
          const y1 = n.anchor.yPct;
          // control point curves lines gracefully toward the core
          const mx = (x1 + cx) / 2 + (y1 - cy) * 0.15;
          const my = (y1 + cy) / 2 - (x1 - cx) * 0.15;
          const d = `M ${x1} ${y1} Q ${mx} ${my} ${cx} ${cy}`;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={`url(#line-${i})`}
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="1.2 1.2"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-24"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </path>
              {/* Traveling data pulse along the same curve */}
              <circle r="0.9" fill={n.accent}>
                <animateMotion
                  dur={`${2.4 + i * 0.35}s`}
                  repeatCount="indefinite"
                  path={d}
                  rotate="auto"
                  begin={`${n.delay}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${2.4 + i * 0.35}s`}
                  repeatCount="indefinite"
                  begin={`${n.delay}s`}
                />
              </circle>
              <circle r="0.5" fill="#ffffff">
                <animateMotion
                  dur={`${2.4 + i * 0.35}s`}
                  repeatCount="indefinite"
                  path={d}
                  begin={`${n.delay}s`}
                />
              </circle>
            </g>
          );
        })}
      </svg>

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
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
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
        {/* expanding pulse ring emitted from core */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white/40"
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-white/30"
          animate={{ scale: [1, 1.9], opacity: [0.35, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
        />
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
          style={{ left: `${n.pos.xPct}%`, top: `${n.pos.yPct}%` }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 4 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            className="glass rounded-2xl pl-2.5 pr-3.5 py-2 flex items-center gap-2.5 shadow-lg shadow-black/[0.06]"
          >
            <div className="relative w-7 h-7 rounded-lg bg-background/80 border border-border/60 grid place-items-center overflow-hidden">
              {n.videoUrl && (
                <video
                  src={n.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              )}
              {/* subtle receive-flash when a pulse arrives */}
              <motion.div
                className="absolute inset-0 rounded-lg mix-blend-overlay"
                style={{ background: n.accent }}
                animate={{ opacity: [0, 0.22, 0] }}
                transition={{
                  duration: 2.4 + i * 0.35,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: n.delay,
                }}
              />
              <div className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">{n.icon}</div>
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold text-foreground">{n.label}</div>
              <div className="text-[10px] text-muted-foreground">{n.sub}</div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
