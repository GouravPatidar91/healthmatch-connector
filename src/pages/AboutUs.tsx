import React from "react";
import { Link } from "react-router-dom";
import CosmicFrame from "@/components/landing/CosmicFrame";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { 
  ArrowLeft, 
  Activity, 
  Stethoscope, 
  Pill, 
  Users, 
  Target, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  ExternalLink,
  Award,
  Sparkles,
  HeartHandshake
} from "lucide-react";

const AboutUs = () => {
  return (
    <CosmicFrame>
      {/* Import premium font styles directly in React for compatibility */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-grotesk { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <LandingNav />
      
      <main className="relative pt-36 pb-32 overflow-hidden bg-black font-jakarta">
        {/* Ambient background radial gradient glows */}
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 to-indigo-600/0 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/5 to-cyan-500/0 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px] pointer-events-none" />

        {/* Dynamic Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          
          {/* Back Navigation Link */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2.5 text-sm font-medium text-white/40 hover:text-white transition-all duration-300 group"
            >
              <span className="p-2 rounded-full border border-white/5 bg-white/[0.02] group-hover:bg-white/10 group-hover:border-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </span>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-28 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>NATIONAL HEALTH-TECH INNOVATION</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-grotesk font-bold text-white tracking-tight max-w-4xl mx-auto leading-[1.05] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              Pioneering Autonomous Clinical Care
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light">
              Curezy OS introduces the next generation of clinical operations. Through localized, multilingual autonomous AI systems, we eliminate administrative bottlenecks to let clinics and hospitals focus on what matters most—saving lives.
            </p>
            
            <div className="pt-4 flex justify-center">
              <a
                href="https://elevenlabs.io/startup-grants"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-xs font-medium text-white/40 hover:text-white/80 transition-all duration-300 border border-white/5 rounded-full px-5 py-2 bg-white/[0.01] hover:bg-white/[0.04]"
              >
                <span>Backed by ElevenLabs Startup Grants</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Key Innovation Pillars */}
          <div className="grid md:grid-cols-3 gap-8 mb-28">
            {/* Pillar 1 */}
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl hover:bg-white/[0.03] hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50" />
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <Cpu className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide font-grotesk">Decoupled AI Brain</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed font-light">
                Our core architecture separates telephony stream routers, multilingual LLM logic, and voice synthesis. This modular design gives clinics the flexibility to hot-swap models, preserve context, and retain total ownership of patient data.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Globe className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide font-grotesk">Democratizing Access</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed font-light">
                By bridging cellular networks and local SIP gateways, Curezy OS enables basic voice telephone triage. This allows rural populations to consult and book slots without requiring smartphones, apps, or active internet connections.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl hover:bg-white/[0.03] hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 opacity-50" />
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide font-grotesk">Compliance Standard</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed font-light">
                Designed for clinical security, Curezy OS features automatic PII/PHI transcript redaction and robust database isolation. The platform aligns with national digital health standards, including the **Ayushman Bharat Digital Mission (ABDM)**.
              </p>
            </div>
          </div>

          {/* Social Impact: Resolving Care Delivery Crisis */}
          <div className="bg-gradient-to-r from-white/[0.01] to-white/[0.02] border border-white/[0.06] rounded-3xl p-10 md:p-14 mb-28 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="grid md:grid-cols-5 gap-10 items-center">
              <div className="md:col-span-3 space-y-6">
                <h2 className="text-2xl md:text-4xl font-grotesk font-bold text-white leading-tight">
                  Addressing the 10 Million Care Worker Shortage
                </h2>
                <p className="text-white/70 text-sm md:text-base leading-relaxed font-light">
                  The World Health Organization estimates a global deficit of 10 million healthcare workers by 2030. Routine administrative overheads consume up to 40% of clinical workdays, driving provider burnout and patient drop-off.
                </p>
                <p className="text-white/70 text-sm md:text-base leading-relaxed font-light">
                  Curezy OS acts as a force multiplier. By automating post-visit follow-ups, scheduling, and information triage, we offload administrative friction, enabling clinical personnel to dedicate themselves entirely to patient care.
                </p>
              </div>
              <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-6 items-center justify-center text-center backdrop-blur-md">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <HeartHandshake className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">Curezy Impact</div>
                  <div className="text-white text-lg font-bold font-grotesk">Optimizing Clinic Capacity</div>
                </div>
                <div className="text-white/50 text-xs font-light px-2">
                  Empowering doctors to expand appointment availability and reduce patient wait times by over 30%.
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Care Coordinator Suite */}
          <div className="mb-28 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-white tracking-tight">
                The Autonomous Care Coordinator Suite
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-7 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-base font-grotesk">Automated Triage</h3>
                <p className="text-white/50 text-xs leading-relaxed font-light">Instantly qualifiers and logs patient symptoms over telephony networks, routing high-risk requests dynamically.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-7 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Stethoscope className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-base font-grotesk">Adaptive Scheduling</h3>
                <p className="text-white/50 text-xs leading-relaxed font-light">Optimizes physician schedules using 12-hour AM/PM real-time calendars, preventing slot overlaps.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-7 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <Pill className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-base font-grotesk">Adherence Loops</h3>
                <p className="text-white/50 text-xs leading-relaxed font-light">Coordinates medicine and follow-up checks, ensuring patients receive active medication checkups.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-7 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-base font-grotesk">Lead Retention</h3>
                <p className="text-white/50 text-xs leading-relaxed font-light">Runs intelligent outreach calls to reactivate dormant patient ledgers, recovery lost slots.</p>
              </div>
            </div>
          </div>

          {/* Founders & Leadership Section */}
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-white tracking-tight">
                The Innovation Team
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full" />
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Founder 1 */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 shadow-lg">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-2 border-blue-500/20 p-1 bg-black/40">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Gourav Patidar" className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-white font-grotesk">Gourav Patidar</h3>
                <p className="text-xs text-emerald-400 font-semibold mb-4 tracking-wider uppercase">Founder & CEO</p>
                <p className="text-white/50 text-xs leading-relaxed font-light">
                  Cyber Security background. Former Lead Tech Engineer at AI marketing startup ($30K ARR). Leads product architecture and AI strategy.
                </p>
              </div>

              {/* Founder 2 */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 shadow-lg">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-2 border-emerald-500/20 p-1 bg-black/40">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" alt="Dharika Joshi" className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-white font-grotesk">Dharika Joshi</h3>
                <p className="text-xs text-emerald-400 font-semibold mb-4 tracking-wider uppercase">Co-Founder & COO</p>
                <p className="text-white/50 text-xs leading-relaxed font-light">
                  Healthcare relationship builder. Leads customer discovery, medical provider partnerships, operational logistics, and CRM success.
                </p>
              </div>

              {/* Founder 3 */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-8 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 shadow-lg">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-2 border-purple-500/20 p-1 bg-black/40">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" alt="Aniruddh Gupta" className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-white font-grotesk">Aniruddh Gupta</h3>
                <p className="text-xs text-emerald-400 font-semibold mb-4 tracking-wider uppercase">Co-Founder & CTO</p>
                <p className="text-white/50 text-xs leading-relaxed font-light">
                  Cyber Security background. Leads backend architecture, real-time voice telephony pipelines, and cloud database integrations.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <LandingFooter />
    </CosmicFrame>
  );
};

export default AboutUs;
