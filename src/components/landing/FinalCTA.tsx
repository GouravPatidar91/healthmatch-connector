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
    <section id="cta" className="py-24 md:py-36">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center glass-dark-card rounded-[36px] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-70"
            style={{ background: "radial-gradient(ellipse at top, rgba(37,99,255,0.25) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
              The future of clinics is <span className="text-white/40">continuous care.</span>
            </h2>
            <p className="mt-5 text-white/60 text-lg max-w-xl mx-auto">
              Book a demo or join the waitlist. We're onboarding a small cohort of providers.
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  className="w-full rounded-full border border-white/[0.1] bg-white/[0.04] pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#7cd4ff] transition-colors"
                />
              </div>
              <button type="submit" className="btn-white-pill justify-center">
                Join waitlist <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4">
              <a href="mailto:admin@curezy.in?subject=Book%20a%20Demo" className="text-sm text-white/50 hover:text-white underline underline-offset-4">
                Or book a demo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
