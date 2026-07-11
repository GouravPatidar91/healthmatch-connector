import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";

export default function FinalCTA() {
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    toast.success("You're on the waitlist. We'll be in touch soon.");
    setEmail("");
  };

  return (
    <section id="cta" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center glass rounded-[32px] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,_hsl(var(--ai-cyan)/0.2)_0%,_transparent_60%)]" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
              The future of healthcare is <span className="text-gradient-ai">continuous.</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Join the waitlist or book a demo. We're onboarding a small cohort of providers.
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  className="w-full rounded-full border hairline bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[hsl(var(--ai-cyan))] transition-colors"
                />
              </div>
              <button type="submit" className="btn-primary-ai justify-center">
                Join Waitlist <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4">
              <a href="mailto:admin@curezy.in?subject=Book%20a%20Demo" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                Or book a demo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
