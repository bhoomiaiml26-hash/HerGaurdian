import Navbar from "../../components/navbar/Navbar";
import HeroSection from "../../components/common/HeroSection";
import QuoteBanner from "../../components/common/QuoteBanner";
import WomenIllustration from "../../components/common/WomenIllustration";
import WhyChoose from "../../components/common/WhyChoose";
import Testimonials from "../../components/common/Testimonials";
import Statistics from "../../components/common/Statistics";
import AboutSection from "../../components/common/AboutSection";
import FAQ from "../../components/common/FAQ";
import Footer from "../../components/footer/Footer";

function Welcome() {
  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18]">
      <Navbar />
      <HeroSection />
      <QuoteBanner />
      <WomenIllustration />
      <WhyChoose />
      <Statistics />
      <Testimonials />
      <AboutSection />
      <FAQ />
      <Footer />
    </div>
  );
}

export default Welcome;