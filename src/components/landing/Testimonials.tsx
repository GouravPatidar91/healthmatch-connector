import { motion } from "framer-motion";

const quotes = [
  {
    quote: "My mother finally takes her medicines on time. The WhatsApp reminders sound like they're written by us — not by a bot.",
    name: "Ananya S.",
    role: "Daughter · Bengaluru",
  },
  {
    quote: "The AI Health Twin gives me the full picture of a patient in seconds. I spend less time on notes and more time on care.",
    name: "Dr. Rajeev Menon",
    role: "General Physician · Kochi",
  },
  {
    quote: "Prescription upload is magic. It reads even my handwritten notes correctly and structures them beautifully.",
    name: "Dr. Priya Kulkarni",
    role: "Pediatrician · Pune",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">Loved by</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            Patients and providers, <span className="text-gradient-ai">on the same page.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {quotes.map((q, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass rounded-3xl p-6 md:p-8 flex flex-col"
            >
              <div className="text-[hsl(var(--ai-blue))] text-4xl font-display leading-none mb-2">"</div>
              <blockquote className="text-base leading-relaxed flex-1">{q.quote}</blockquote>
              <figcaption className="mt-6 pt-4 border-t hairline">
                <div className="font-display font-semibold text-sm">{q.name}</div>
                <div className="text-xs text-muted-foreground">{q.role}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
