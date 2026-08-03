import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import { useAuth } from "../AuthContext";

const Hero = () => {
  const { user, isAdmin } = useAuth();

  const getStartedLink = () => {
    if (!user) return "/login";
    if (isAdmin) return "/admin/dashboard";
    return "/my-pets";
  };
  return (
    <section className="bg-slate-950">
      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-3 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium text-emerald-300 bg-emerald-950/40 rounded-full border border-emerald-800/50">
              Trusted Pet Healthcare Platform
            </span>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-50 leading-tight">
              Better Care for Your
              <span className="text-emerald-400"> Cats & Dogs</span>
            </h1>

            <p className="mt-3 sm:mt-6 text-sm sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Manage your pet's health with ease—track medical records,
              monitor wellness, receive expert advice, and stay updated with
              important pet care information.
            </p>

            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to={getStartedLink()}>
                <Button
                  size="md"
                  variant="green"
                  className="text-sm mx-4 sm:text-base"
                >
                  Get Started
                </Button>
              </Link>

              <Link to="/#health-info">
                <Button
                  size="md"
                  variant="outline"
                  className="border-emerald-500 mx-4 text-emerald-400 hover:bg-emerald-950/30 rounded-lg px-4 sm:px-6 text-sm sm:text-base"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-6 sm:mt-10 flex flex-wrap gap-4 sm:gap-8 justify-center lg:justify-start">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-50">24/7</p>
                <p className="text-xs sm:text-sm text-slate-500">Record Access</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-50">100%</p>
                <p className="text-xs sm:text-sm text-slate-500">Secure Storage</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-50">Easy</p>
                <p className="text-xs sm:text-sm text-slate-500">Pet Management</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6">
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
