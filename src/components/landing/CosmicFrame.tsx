import { ReactNode } from "react";

export default function CosmicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="cosmic-root min-h-screen bg-[#040610] p-2 sm:p-3">
      <div className="cosmic-frame relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/[0.06] bg-[#06080f]">
        {/* Starfield */}
        <div className="pointer-events-none absolute inset-0 starfield opacity-70" />
        {/* Radial glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(120,140,255,0.18), transparent 70%)" }} />
        <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(closest-side, rgba(180,140,255,0.14), transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(closest-side, rgba(80,200,255,0.10), transparent 70%)" }} />

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
