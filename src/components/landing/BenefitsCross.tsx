import { motion } from "framer-motion";
import { Clock, Heart, Zap, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Time Saving.", desc: "Automate follow-ups instantly.", pos: "top-left" },
  { icon: Heart, title: "Better Adherence.", desc: "Patients rarely miss a dose.", pos: "top-right" },
  { icon: Zap, title: "Faster Consults.", desc: "AI pre-assessment ready.", pos: "mid-left" },
  { icon: Sparkles, title: "Predictive Insights.", desc: "See risks before they arise.", pos: "mid-left-2" },
  { icon: ShieldCheck, title: "Higher Trust.", desc: "Encrypted, compliant, private.", pos: "mid-right" },
  { icon: TrendingUp, title: "Easy Scaling.", desc: "Grow without extra headcount.", pos: "mid-right-2" },
];

const Tile = ({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: any;
  title: string;
  desc: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.015] p-5 backdrop-blur-xl"
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/80">
      <Icon className="h-4 w-4" />
    </div>
    <div className="mt-3 font-display text-[17px] font-semibold text-white">{title}</div>
    <div className="mt-1 text-sm text-white/45">{desc}</div>
  </motion.div>
);

export default function BenefitsCross() {
  return (
    <section id="benefits" className="py-24 md:py-36">
      <div className="container">
        <div className="mb-14 max-w-2xl">
          <div className="eyebrow mb-4">Benefits</div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-white">
            What makes Curezy <span className="text-white/40">better for your practice.</span>
          </h2>
        </div>

        {/* Knotch-style cross layout */}
        <div className="relative mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
            {/* Row 1 */}
            <div className="md:col-span-1 md:col-start-1">
              <Tile icon={benefits[0].icon} title={benefits[0].title} desc={benefits[0].desc} />
            </div>
            <div className="md:col-span-1 md:col-start-2">
              <Tile icon={benefits[2].icon} title={benefits[2].title} desc={benefits[2].desc} delay={0.05} />
            </div>

            {/* Center logo tile — spans two rows on md */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="hidden md:block md:col-span-1 md:col-start-3 md:row-span-2"
            >
              <div className="relative h-full min-h-[240px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a0d16]/60">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(80,140,255,0.35),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className="relative grid h-full place-items-center p-6">
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="grid h-20 w-20 place-items-center rounded-2xl border border-white/[0.14] bg-gradient-to-br from-[#0f1730] to-[#1a2450] shadow-[0_0_80px_-10px_rgba(120,150,255,0.6)]"
                  >
                    <img src="/logo.png" alt="Curezy" className="h-10 w-10 object-contain" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <div className="md:col-span-1 md:col-start-4">
              <Tile icon={benefits[4].icon} title={benefits[4].title} desc={benefits[4].desc} delay={0.1} />
            </div>
            <div className="md:col-span-1 md:col-start-5">
              <Tile icon={benefits[1].icon} title={benefits[1].title} desc={benefits[1].desc} delay={0.15} />
            </div>

            {/* Row 2 */}
            <div className="md:col-span-1 md:col-start-1 md:row-start-2">
              <Tile icon={benefits[3].icon} title={benefits[3].title} desc={benefits[3].desc} delay={0.2} />
            </div>
            <div className="md:col-span-1 md:col-start-2 md:row-start-2">
              <Tile icon={benefits[5].icon} title={benefits[5].title} desc={benefits[5].desc} delay={0.25} />
            </div>
            <div className="md:col-span-1 md:col-start-4 md:row-start-2">
              <Tile icon={Heart} title="Continuous Care." desc="Beyond the consult, always on." delay={0.3} />
            </div>
            <div className="md:col-span-1 md:col-start-5 md:row-start-2">
              <Tile icon={Zap} title="Zero Manual Work." desc="Care runs while you sleep." delay={0.35} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
