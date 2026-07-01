import React from "react";
import {
  LandingHeader,
  LandingHero,
  LandingFeatures,
  LandingAbout,
  LandingFooter,
} from "./components";
import "./landingpage.css";

const LandingPage = () => {
  return (
    <div className="lp-wrapper">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingAbout />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
