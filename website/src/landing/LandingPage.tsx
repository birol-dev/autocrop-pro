import BackToTop from "../components/BackToTop";
import ScrollProgress from "../components/ScrollProgress";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import Cta from "./Cta";
import Faq from "./Faq";
import Hero from "./Hero";
import Promises from "./Promises";
import Simulator from "./Simulator";
import Statement from "./Statement";
import Steps from "./Steps";

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader overHero />
      <main id="main">
        <Hero />
        <Statement />
        <Steps />
        <Promises />
        <Simulator />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
