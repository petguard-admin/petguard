import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Announcements from './Announcements';
import HealthInfo from './HealthInfo';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Announcements />
      <HealthInfo />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
