import { motion } from "framer-motion";
import { Activity, FileText, MessageCircle, Stethoscope, Pill, HeartPulse } from "lucide-react";

const nodes = [
  { icon: FileText, label: "Prescription", angle: 0 },
  { icon: Activity, label: "Reports", angle: 60 },
  { icon: HeartPulse, label: "Symptoms", angle: 120 },
  { icon: Stethoscope, label: "Timeline", angle: 180 },
  { icon: MessageCircle, label: "Follow-ups", angle: 240 },
  { icon: Pill, label: "Medication", angle: 300 },
];

export default function HealthTwinOrb({ size = 460 }: { size?: number }) {
  const radius = size * 0.36;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* rings */}
      {[0.55, 0.75, 0.95].map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 m-auto rounded-full border hairline"
          style={{ width: size * s, height: size * s, left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ))}
      {/* pulse */}
      <div className="absolute inset-0 m-auto rounded-full bg-gradient-cyan opacity-20 animate-pulse-ring"
           style={{ width: size * 0.35, height: size * 0.35 }} />
      {/* core */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 m-auto rounded-full bg-gradient-cyan shadow-glow-cyan grid place-items-center text-white font-display font-semibold"
        style={{ width: size * 0.32, height: size * 0.32 }}
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.2em] opacity-80">AI</div>
          <div className="text-lg leading-tight">Health<br/>Twin</div>
        </div>
      </motion.div>

      {/* rotating orbit container */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const Icon = n.icon;
          return (
            <motion.div
              key={i}
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 whitespace-nowrap">
                <Icon className="w-4 h-4 text-[hsl(var(--ai-blue))]" />
                <span className="text-xs font-medium">{n.label}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
