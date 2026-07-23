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
  Briefcase, 
  Phone, 
  Mail, 
  ExternalLink 
} from "lucide-react";

const AboutUs = () => {
  return (
    <CosmicFrame>
      <LandingNav />
      
      <main className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-12 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              About Curezy
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mt-6 mb-6 tracking-tight">
              The AI Care Operating Layer
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Curezy OS automates patient acquisition, communication, and engagement — helping clinics and hospitals increase revenue and retention without adding headcount.
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

          {/* Core Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                To solve patient retention and manual front-desk chaos for healthcare providers. We leverage state-of-the-art voice telephony and automated WhatsApp CRM solutions to make patient touchpoints instant, smart, and fully integrated.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">The AI Workforce</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                We believe healthcare doesn't need more complex software; it needs an autonomous AI workforce. Our system multiplies the impact of clinic receptionists by handling patient check-ins, reminders, and follow-ups 24/7.
              </p>
            </div>
          </div>

          {/* Core Products / The 8 AI Agents */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-12 text-center">
              Eight Autonomous AI Agents. One CRM Platform.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6 hover:bg-white/[0.03] transition-colors">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Inbound Sales</h3>
                <p className="text-white/50 text-xs leading-relaxed">Qualifies and converts inbound patient inquiries instantly over call and chat.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6 hover:bg-white/[0.03] transition-colors">
                <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center mb-4">
                  <Activity className="h-4 w-4 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Outbound Sales</h3>
                <p className="text-white/50 text-xs leading-relaxed">Proactively call and reactivate dormant patient lists for routine checkups.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6 hover:bg-white/[0.03] transition-colors">
                <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center mb-4">
                  <Stethoscope className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Appointments</h3>
                <p className="text-white/50 text-xs leading-relaxed">Books, cancels, and reschedules appointments end-to-end dynamically.</p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-6 hover:bg-white/[0.03] transition-colors">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center mb-4">
                  <Pill className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">Patient Follow-up</h3>
                <p className="text-white/50 text-xs leading-relaxed">Automates post-visit medicine adherence check-ins and care sequences.</p>
              </div>
            </div>
          </div>

          {/* Founders & Leadership Section */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-12 text-center">
              The Leadership Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Founder 1 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Gourav Patidar" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Gourav Patidar</h3>
                <p className="text-xs text-blue-400 font-medium mb-3">Founder & CEO</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Cyber Security background. Former Lead Tech Engineer at AI marketing startup ($30K ARR). Leads product and AI strategy.
                </p>
              </div>

              {/* Founder 2 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" alt="Dharika Joshi" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Dharika Joshi</h3>
                <p className="text-xs text-blue-400 font-medium mb-3">Co-Founder & COO</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Healthcare relationship builder. Leads customer discovery, provider partnerships, operational logistics, and CRM success.
                </p>
              </div>

              {/* Founder 3 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" alt="Aniruddh Gupta" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">Aniruddh Gupta</h3>
                <p className="text-xs text-blue-400 font-medium mb-3">Co-Founder & CTO</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Cyber Security background. Leads backend systems, real-time telephony pipelines, AI architecture, and database integrations.
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
