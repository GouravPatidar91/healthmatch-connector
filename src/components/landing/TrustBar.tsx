const items = ["Clinics", "Hospitals", "Pharmacies", "Diagnostics", "Insurers", "Providers", "Care Teams"];

export default function TrustBar() {
  return (
    <section className="py-12 border-y hairline bg-white/50">
      <div className="container">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Built for the entire healthcare ecosystem
        </p>
        <div className="overflow-hidden">
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...items, ...items, ...items].map((it, i) => (
              <div key={i} className="text-2xl font-display font-medium text-muted-foreground/50">
                {it}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
