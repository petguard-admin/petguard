import React from "react";
import { Button } from "./ui/Button";

const Hero = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-3 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium text-green-700 bg-green-50 rounded-full border border-green-100">
              Trusted Pet Healthcare Platform
            </span>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Better Care for Your
              <span className="text-green-700"> Cats & Dogs</span>
            </h1>

            <p className="mt-3 sm:mt-6 text-sm sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Manage your pet's health with ease—track medical records,
              monitor wellness, receive expert advice, and stay updated with
              important pet care information.
            </p>

            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button
                size="md"
                variant="green"
                className="text-sm sm:text-base"
              >
                Get Started
              </Button>

              <Button
                size="md"
                variant="outline"
                className="border-green-700 text-green-700 hover:bg-green-50 rounded-lg px-4 sm:px-6 text-sm sm:text-base"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 sm:mt-10 flex flex-wrap gap-4 sm:gap-8 justify-center lg:justify-start">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-xs sm:text-sm text-slate-500">Record Access</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs sm:text-sm text-slate-500">Secure Storage</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">Easy</p>
                <p className="text-xs sm:text-sm text-slate-500">Pet Management</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6">
              <img
                src="/img/hero-pet.png"
                alt="Pet healthcare"
                className="w-full max-w-md sm:max-w-lg mx-auto"
              />
            </div>

            
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
