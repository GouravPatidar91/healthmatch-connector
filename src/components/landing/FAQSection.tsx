import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "How is Curezy different from a regular WhatsApp bot?",
    a: "Curezy isn't a script — it's an AI Care OS. It listens, triages, engages via voice and WhatsApp, and closes the loop into your clinic's workflow with EMR-ready integrations.",
  },
  {
    q: "Do my patients need to install an app?",
    a: "No. Every core interaction — reminders, follow-ups, voice check-ins — works over WhatsApp and phone calls patients already use.",
  },
  {
    q: "Is my clinic's data private and secure?",
    a: "Yes. End-to-end encryption, role-based access, and DPDP + HIPAA-aligned practices. You control what's shared, with whom, and when.",
  },
  {
    q: "How quickly can we go live?",
    a: "Most clinics onboard within 48 hours. We handle number setup, voice agent training on your tone, and staff walk-throughs.",
  },
  {
    q: "Does Curezy replace my staff or doctors?",
    a: "No. Curezy handles repetitive engagement so your team can focus on clinical care. Escalations always route to a human.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">FAQ</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-[-0.03em] text-white">
            Answers, in <span className="text-white/40">plain language.</span>
          </h2>
        </div>
        <div className="max-w-3xl glass-dark-card rounded-3xl p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/[0.08] last:border-0">
                <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5 text-white">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/60 leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
