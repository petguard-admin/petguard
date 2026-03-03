import React from 'react';
import { Button } from './ui/Button';

const CTA = () => {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Register Your Pet Today</h2>
        <p className="text-xl mb-8">
          Start monitoring your pet's health with our comprehensive platform. It's quick, easy, and free to get started.
        </p>
        <Button size="lg" variant="secondary">
          Register Now
        </Button>
      </div>
    </section>
  );
};

export default CTA;
