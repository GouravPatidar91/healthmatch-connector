import { motion } from "framer-motion";
import { DollarSign, Lightbulb, Hourglass, FastForward, Target, BarChart3 } from "lucide-react";

/* Knotch-style benefit tile — dark card, round icon badge, bold title,
   muted description on the next line, tight sans font. */
const Tile = ({
  icon: Icon,
  title,
  desc,
  delay = 0,
  className = "",
}: {
  icon: any;
  title: string;
  desc: string;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`group relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-5 backdrop-blur-xl ${className}`}
  >
    {/* top hairline */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    {/* soft top glow */}
    <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(closest-side,rgba(120,150,255,0.12),transparent_70%)]" />

    {/* icon badge — dark round pill with 1px inner ring */}
    <div className="relative grid h-7 w-7 place-items-center rounded-full bg-[#0a0d16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      <Icon className="h-3.5 w-3.5 text-white/80" strokeWidth={1.75} />
    </div>

    <div className="mt-5">
      <div className="font-display text-[17px] font-semibold leading-tight tracking-[-0.01em] text-white">
        {title}
      </div>
      <div className="mt-1 font-display text-[17px] font-semibold leading-tight tracking-[-0.01em] text-white/45">
        {desc}
      </div>
    </div>
  </motion.div>
);

/* Center logo tile — Knotch has a big black square with a soft radial glow
   and the brand mark centered. */
const CenterLogoTile = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="relative h-full min-h-[220px]"
  >
    {/* outer glow */}
    <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-[radial-gradient(closest-side,rgba(120,150,255,0.28),transparent_70%)]" />
    <div className="relative h-full overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-b from-[#0a0d16] to-[#050810]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(closest-side,black,transparent_75%)]" />
      <div className="relative grid h-full place-items-center p-6">
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_0_60px_-5px_rgba(120,150,255,0.6)]"
        >
          <img
            src="/curezy logo.png"
            alt="Curezy"
            className="h-8 w-8 object-contain"
          />
        </motion.div>
      </div>
    </div>
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

        {/* Knotch cross layout: 5-col grid, top row uses cols 2/3/4,
            bottom row uses all 5, center col 3 spans both rows. */}
        <div className="relative mx-auto max-w-6xl">
          {/* Mobile — simple stack */}
          <div className="grid gap-4 md:hidden">
            <Tile icon={DollarSign} title="Cost Efficient." desc="Reduce manual workload." />
            <Tile icon={Lightbulb} title="Better Insights." desc="Understand patient data quickly." delay={0.05} />
            <Tile icon={Hourglass} title="Time Saving." desc="Automate follow-ups instantly." delay={0.1} />
            <Tile icon={FastForward} title="Faster Consults." desc="Speed up your care flow." delay={0.15} />
            <Tile icon={Target} title="Higher Accuracy." desc="Minimize clinical errors." delay={0.2} />
            <Tile icon={BarChart3} title="Easy Scaling." desc="Grow without extra effort." delay={0.25} />
          </div>

          {/* Desktop — Knotch cross */}
          <div className="hidden md:grid md:grid-cols-5 md:grid-rows-2 md:gap-5">
            {/* Top row */}
            <div className="md:col-start-2 md:row-start-1">
              <Tile icon={DollarSign} title="Cost Efficient." desc="Reduce manual workload." />
            </div>
            <div className="md:col-start-3 md:row-span-2 md:row-start-1">
              <CenterLogoTile />
            </div>
            <div className="md:col-start-4 md:row-start-1">
              <Tile icon={Lightbulb} title="Better Insights." desc="Understand patient data quickly." delay={0.1} />
            </div>

            {/* Bottom row */}
            <div className="md:col-start-1 md:row-start-2">
              <Tile icon={Hourglass} title="Time Saving." desc="Automate follow-ups instantly." delay={0.15} />
            </div>
            <div className="md:col-start-2 md:row-start-2">
              <Tile icon={FastForward} title="Faster Consults." desc="Speed up your care flow." delay={0.2} />
            </div>
            <div className="md:col-start-4 md:row-start-2">
              <Tile icon={Target} title="Higher Accuracy." desc="Minimize clinical errors." delay={0.25} />
            </div>
            <div className="md:col-start-5 md:row-start-2">
              <Tile icon={BarChart3} title="Easy Scaling." desc="Grow without extra effort." delay={0.3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
