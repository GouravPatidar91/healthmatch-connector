import { motion } from "framer-motion";
import { Brain, FileScan, ClipboardList, MessageSquare, Phone, FolderHeart, MapPin, Pill, LayoutDashboard, User2, Workflow } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Health Twin", desc: "A continuously updated digital twin of every patient's health, medications, and history." , span: "md:col-span-2" },
  { icon: FileScan, title: "AI Prescription Intelligence", desc: "OCR + medical NLP extracts drugs, dosages, and schedules from any prescription in seconds." },
  { icon: ClipboardList, title: "AI Pre-Assessment", desc: "Patients complete an intelligent triage before the consult — doctors save minutes per visit." },
  { icon: MessageSquare, title: "WhatsApp Follow-ups", desc: "Automated, personalized nudges that keep adherence high without manual work." },
  { icon: Phone, title: "AI Voice Follow-up Calls", desc: "Human-like voice AI checks in on patients between visits and flags escalations." },
  { icon: FolderHeart, title: "Health Records", desc: "Encrypted, patient-owned records with role-based access for every provider." },
  { icon: MapPin, title: "Nearby & Virtual Doctors", desc: "Discover physical clinics or book instant virtual consults, all in one flow." },
  { icon: Pill, title: "Medicine Ordering", desc: "One-tap ordering from verified pharmacies with real-time delivery tracking." },
  { icon: LayoutDashboard, title: "Doctor Dashboard", desc: "Practice command center for patient timelines, follow-ups, and revenue." },
  { icon: User2, title: "Patient Dashboard", desc: "A single home for appointments, prescriptions, records, and AI care companion." },
  { icon: Workflow, title: "Workflow Automation", desc: "Care pathways that run themselves — from onboarding to post-care recovery." , span: "md:col-span-2" },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mb-14">
          <div className="pill mb-4">Product</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-semibold">
            An operating system for <span className="text-gradient-ai">continuous care.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Eleven interlocking capabilities that turn every consultation into a lifelong care journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className={`group relative glass rounded-3xl p-6 hover:shadow-elevated transition-all hover:-translate-y-0.5 ${f.span || ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-cyan grid place-items-center text-white mb-4 shadow-glow-cyan/50">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_hsl(var(--ai-cyan)/0.08)_0%,_transparent_60%)]" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
