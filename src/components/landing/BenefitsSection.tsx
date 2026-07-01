import { Heart, Stethoscope, CheckCircle2 } from "lucide-react";

const patients = ["Personalized Care", "Medication Adherence", "Health Timeline", "Easy Health Records", "AI Companion"];
const providers = ["Less Manual Work", "Higher Patient Retention", "Better Outcomes", "Continuous Monitoring", "Workflow Automation"];

export default function BenefitsSection() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-[hsl(var(--ai-cyan)/0.04)] to-white">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">Benefits</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Wins for both sides of the <span className="text-gradient-ai">care equation.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-cyan grid place-items-center text-white">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">For Patients</h3>
            </div>
            <ul className="space-y-2.5">
              {patients.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ai-blue))]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--ai-violet))] to-[hsl(var(--ai-blue))] grid place-items-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">For Healthcare Providers</h3>
            </div>
            <ul className="space-y-2.5">
              {providers.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ai-violet))]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
