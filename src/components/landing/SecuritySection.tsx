import { Shield, Lock, Users, Cloud, FileCheck } from "lucide-react";

const items = [
  { icon: Lock, title: "Encrypted Health Records", desc: "At-rest and in-transit encryption for every byte." },
  { icon: Users, title: "Role-Based Access", desc: "Providers see only what they need — nothing more." },
  { icon: FileCheck, title: "Consent-Driven Sharing", desc: "Patients own and control every data grant." },
  { icon: Cloud, title: "Secure Cloud Infrastructure", desc: "Hardened, monitored, audit-ready." },
  { icon: Shield, title: "DPDP-aligned Privacy", desc: "Built to India's Digital Personal Data Protection Act." },
];

export default function SecuritySection() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-white to-[hsl(var(--ai-cyan)/0.04)]">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">Security & Privacy</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Trust is the <span className="text-gradient-ai">foundation</span> of healthcare.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--ai-cyan)/0.1)] text-[hsl(var(--ai-blue))] grid place-items-center mb-3">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="font-display font-semibold text-sm mb-1">{it.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{it.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
