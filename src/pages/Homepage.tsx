import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyCurezy from "@/components/landing/WhyCurezy";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ProductScreens from "@/components/landing/ProductScreens";
import TechStack from "@/components/landing/TechStack";
import SecuritySection from "@/components/landing/SecuritySection";
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
        <ProblemSection />
        <SolutionSection />
        <FeaturesGrid />
        <HowItWorks />
        <WhyCurezy />
        <BenefitsSection />
        <ProductScreens />
        <TechStack />
        <SecuritySection />
        <VisionSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
