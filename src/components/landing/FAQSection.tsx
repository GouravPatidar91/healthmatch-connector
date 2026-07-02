import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What exactly is an AI Health Twin?",
    a: "It's a continuously-updated digital profile of your health — built from your prescriptions, reports, symptoms and follow-ups — that gives every AI response and care recommendation real context.",
  },
  {
    q: "Is my health data private and secure?",
    a: "Yes. All data is encrypted at rest and in transit, access is role-based and consent-driven, and our practices are aligned with India's Digital Personal Data Protection (DPDP) Act.",
  },
  {
    q: "Do I need a smartphone to use Curezy?",
    a: "The Curezy app gives you the best experience, but many follow-ups and reminders work over WhatsApp and voice calls — no app required.",
  },
  {
    q: "Can my doctor or clinic use Curezy too?",
    a: "Absolutely. Curezy has a dedicated dashboard for providers to manage patients, review Health Twins and automate follow-ups.",
  },
  {
    q: "Does Curezy replace my doctor?",
    a: "No. Curezy is a care operating system that supports doctors and patients between visits — it does not diagnose or replace clinical judgement.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-gradient-to-b from-[hsl(var(--ai-cyan)/0.04)] to-white">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="pill mb-4">FAQ</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Answers, in <span className="text-gradient-ai">plain language.</span>
          </h2>
        </div>
        <div className="max-w-3xl mx-auto glass rounded-3xl p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b hairline last:border-0">
                <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
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
