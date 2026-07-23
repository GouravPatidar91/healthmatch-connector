import { ReactNode } from "react";

export default function CosmicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="cosmic-root min-h-screen bg-[#eef4fb] p-2 sm:p-3">
      <div className="cosmic-frame relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-slate-200/70 bg-white">
        {/* Soft cyan glows */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-80"
          style={{ background: "radial-gradient(closest-side, rgba(6,182,212,0.18), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.14), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.12), transparent 70%)" }}
        />

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
