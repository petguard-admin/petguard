import React from "react";
import { Button } from "./ui/Button";

const Hero = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-green-700 bg-green-50 rounded-full border border-green-100">
              Trusted Pet Healthcare Platform
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Better Care for Your
              <span className="text-green-700"> Cats & Dogs</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Manage your pet's health with ease—track medical records,
              monitor wellness, receive expert advice, and stay updated with
              important pet care information.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                variant="green"
              >
                Get Started
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-green-700 text-green-700 hover:bg-green-50 rounded-xl px-8"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-8 justify-center lg:justify-start">
              <div>
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-sm text-slate-500">Record Access</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">100%</p>
                <p className="text-sm text-slate-500">Secure Storage</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Easy</p>
                <p className="text-sm text-slate-500">Pet Management</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-6">
              <img
                src="src/img/hero-pet.png"
                alt="Pet healthcare"
                className="w-full max-w-lg mx-auto"
              />
            </div>

            
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
