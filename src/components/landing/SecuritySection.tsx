import { Shield, Lock, Users, Cloud, FileCheck } from "lucide-react";

const items = [
  { icon: Lock, title: "Encrypted end-to-end", desc: "At-rest and in-transit encryption for every byte." },
  { icon: Users, title: "Role-based access", desc: "Providers see only what they need." },
  { icon: FileCheck, title: "Consent-driven sharing", desc: "Patients own and control every grant." },
  { icon: Cloud, title: "Secure cloud infra", desc: "Hardened, monitored, audit-ready." },
  { icon: Shield, title: "HIPAA & DPDP aligned", desc: "Built to the strictest health-data standards." },
];

export default function SecuritySection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Security & Privacy</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            Trust is the <span className="text-white/40">foundation</span> of healthcare.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="glass-dark-card rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] grid place-items-center mb-3">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <div className="font-display font-semibold text-sm mb-1 text-white">{it.title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{it.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
