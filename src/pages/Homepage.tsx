import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import LivingRecord from "@/components/landing/LivingRecord";
import ImpactStats from "@/components/landing/ImpactStats";
import Testimonials from "@/components/landing/Testimonials";
import SecuritySection from "@/components/landing/SecuritySection";
import FAQSection from "@/components/landing/FAQSection";
import VisionSection from "@/components/landing/VisionSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <TrustBar />
        <LivingRecord />
        <FeaturesGrid />
        <ImpactStats />
        <Testimonials />
        <SecuritySection />
        <FAQSection />
        <VisionSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
