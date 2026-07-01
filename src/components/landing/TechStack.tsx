const tech = [
  ["React Native", "Node.js", "Supabase", "AI Health Twin Engine"],
  ["OCR", "WhatsApp API", "Voice AI", "Cloud Infrastructure"],
];

export default function TechStack() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="pill mb-4">Technology</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Enterprise architecture, <span className="text-gradient-ai">AI-native.</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto glass rounded-3xl p-8 relative">
          <div className="absolute inset-0 grid-bg opacity-30 rounded-3xl pointer-events-none" />
          <div className="relative space-y-4">
            {tech.map((row, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {row.map((t) => (
                  <div key={t} className="rounded-2xl border hairline bg-white/70 p-4 text-center">
                    <div className="text-sm font-medium">{t}</div>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-6 flex justify-center">
              <div className="rounded-full bg-gradient-cyan text-white text-sm font-medium px-5 py-2.5 shadow-glow-cyan">
                Curezy AI Care OS
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
