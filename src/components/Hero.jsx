import React from 'react';
import { Button } from './ui/Button';

const Hero = () => {
  return (
    <section className="bg-linear-to-r from-green-400 to-blue-500 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to PetGuard
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Your trusted partner in pet healthcare for cats and dogs
        </p>
        <p className="text-lg mb-8">
          Comprehensive health monitoring, medical records, and expert advice all in one place.
        </p>
        <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
          Get Started
        </Button>
      </div>
    </section>
  );
};

export default Hero;
