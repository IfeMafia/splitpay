import LandingNav from "./components/landing/LandingNav";
import HeroSection from "./components/landing/HeroSection";
import ProblemSection from "./components/landing/ProblemSection";
import SplitsSection from "./components/landing/SplitsSection";
import FlowSection from "./components/landing/FlowSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import FAQSection from "./components/landing/FAQSection";
import PricingSection from "./components/landing/PricingSection";
import FinalCTASection from "./components/landing/FinalCTASection";
import LandingFooter from "./components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        {/* 1. Hero */}
        <HeroSection />
        {/* 2. Problem — the pain without Splitpay */}
        <ProblemSection />
        {/* 3. Solution — how Splitpay distributes */}
        <SplitsSection />
        {/* 4. How it works — step flow */}
        <FlowSection />
        {/* 5. Features — bento grid */}
        <FeaturesSection />
        {/* 6. Pricing */}
        <PricingSection />
        {/* 7. FAQ */}
        <FAQSection />
        {/* 7. Final CTA */}
        <FinalCTASection />
      </main>
      <LandingFooter />
    </>
  );
}
