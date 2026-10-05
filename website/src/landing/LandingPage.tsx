import BackToTop from "../components/BackToTop";
import ScrollProgress from "../components/ScrollProgress";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import Audience from "./Audience";
import BatchDemo from "./BatchDemo";
import BeforeAfter from "./BeforeAfter";
import Comparison from "./Comparison";
import Cta from "./Cta";
import Definition from "./Definition";
import Faq from "./Faq";
import Features from "./Features";
import Hero from "./Hero";
import OpenSource from "./OpenSource";
import Pain from "./Pain";
import ProofStrip from "./ProofStrip";
import Simulator from "./Simulator";
import Steps from "./Steps";

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader />
      <main id="main">
        <Hero />
        <ProofStrip />
        <Definition />
        <Pain />
        <BeforeAfter />
        <Features />
        <Steps />
        <Audience />
        <Simulator />
        <BatchDemo />
        <OpenSource />
        <Comparison />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
