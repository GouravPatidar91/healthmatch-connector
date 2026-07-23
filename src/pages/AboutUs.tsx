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
  ShieldAlert, 
  ExternalLink 
} from "lucide-react";

const AboutUs = () => {
  return (
    <CosmicFrame>
      <LandingNav />
      
      <main className="relative pt-32 pb-24 overflow-hidden">
        {/* Advanced tech grids & background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-12 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          {/* Hero Innovation Pitch */}
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              National Health-Tech Innovation
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mt-6 mb-6 tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Pioneering Autonomous Clinical Care Operations
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Curezy OS is a groundbreaking clinical operating layer. By deploying an autonomous, multilingual AI workforce, we solve the critical healthcare workforce crisis and democratize patient care coordination at scale.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <a
                href="https://elevenlabs.io/startup-grants"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 rounded-full px-4 py-1.5 bg-white/[0.02]"
              >
                <span>Backed by ElevenLabs Startup Grants</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* The Innovation Pillars (Grant Value Proposition) */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Decoupled AI Brain</h2>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Unlike generic wrappers, our platform houses an independent, modular AI Brain. We separate telephony streams, multilingual LLM logic, and voice synthesis—allowing hospitals to swap models, preserve patient context, and retain complete data ownership.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Democratizing Access</h2>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                By bridging physical SIM cards and local telephony interfaces, Curezy OS allows patients to consult, triage, and schedule appointments using basic voice calls—democratizing digital healthcare for rural populations without internet or smartphones.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Clinical Compliance</h2>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Engineered for security, our systems deploy automatic PII/PHI redaction algorithms on live transcripts and enforce end-to-end encryption. The architecture is built to align with national digital healthcare initiatives, including the **Ayushman Bharat Digital Mission (ABDM)**.
              </p>
            </div>
          </div>

          {/* Social Impact: Resolving the Care Delivery Crisis */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-8 md:p-12 mb-24 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-6">
              Addressing the 10 Million Healthcare Worker Shortage
            </h2>
            <p className="text-white/75 leading-relaxed mb-6 text-sm md:text-base">
              The World Health Organization projects a shortage of 10 million healthcare workers by 2030. Manual clinic operations—answering booking requests, tracking lab results, following up on medication adherence—consume up to 40% of a medical professional's day.
            </p>
            <p className="text-white/75 leading-relaxed text-sm md:text-base">
              Curezy OS introduces the solution: a system of **Autonomous AI Care Coordinators** that work continuously. By managing clinical check-ins, tracking patient adherence sequences, and handling support FAQs, we free up physical medical staff to focus on direct patient care, scaling hospital capacity, and saving lives.
            </p>
          </div>

          {/* Core Products / The 8 AI Agents */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-12 text-center">
              The Curezy Autonomous Care Coordinator Suite
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center mb-4">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Automated Triage</h3>
                <p className="text-white/50 text-xs leading-relaxed">Qualifies and registers patient symptoms instantly, dynamically routing urgent cases to emergency physicians.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center mb-4">
                  <Stethoscope className="h-4 w-4 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Adaptive Scheduling</h3>
                <p className="text-white/50 text-xs leading-relaxed">Manages physician slots and bookings dynamically in 12-hour local time formats over voice and text.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center mb-4">
                  <Pill className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Adherence Monitoring</h3>
                <p className="text-white/50 text-xs leading-relaxed">Runs conversational loops monitoring post-visit medicine adherence and schedules checkup alerts.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center mb-4">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Lead Retention</h3>
                <p className="text-white/50 text-xs leading-relaxed">Proactively contacts dormant patient registers to schedule vital checkups and follow-up lab screenings.</p>
              </div>
            </div>
          </div>

          {/* Founders & Leadership Section */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-12 text-center">
              The Innovation Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Founder 1 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Gourav Patidar" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Gourav Patidar</h3>
                <p className="text-xs text-emerald-400 font-medium mb-3">Founder & CEO</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Cyber Security background. Former Lead Tech Engineer at AI marketing startup ($30K ARR). Leads product architecture and AI strategy.
                </p>
              </div>

              {/* Founder 2 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" alt="Dharika Joshi" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Dharika Joshi</h3>
                <p className="text-xs text-emerald-400 font-medium mb-3">Co-Founder & COO</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Healthcare relationship builder. Leads customer discovery, medical provider partnerships, operational logistics, and CRM success.
                </p>
              </div>

              {/* Founder 3 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" alt="Aniruddh Gupta" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Aniruddh Gupta</h3>
                <p className="text-xs text-emerald-400 font-medium mb-3">Co-Founder & CTO</p>
                <p className="text-white/60 text-xs leading-relaxed">
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
