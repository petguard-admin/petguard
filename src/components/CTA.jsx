import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { PawPrint, Heart, Shield } from 'lucide-react';
import { useAuth } from '../AuthContext';

const CTA = () => {
  const { user } = useAuth();

  return (
    <section className="relative py-2 md:py-5 bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1 md:mb-2">
            Register Your Pet Today
          </h2>
          <p className="text-sm md:text-lg lg:text-xl text-green-50 mb-2 md:mb-4 leading-relaxed">
            Start monitoring your pet's health with our comprehensive platform. It's quick, easy, and free to get started.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-2 md:mb-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 md:mb-2">
                <Heart size={16} className="text-white md:hidden" />
                <Heart size={24} className="text-white hidden md:block" />
              </div>
              <h3 className="text-white font-semibold mb-0.5 md:mb-1 text-[10px] md:text-xs md:text-sm">Health Tracking</h3>
              <p className="text-green-100 text-[9px] hidden md:block">Monitor vitals & records</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 md:mb-2">
                <Shield size={16} className="text-white md:hidden" />
                <Shield size={24} className="text-white hidden md:block" />
              </div>
              <h3 className="text-white font-semibold mb-0.5 md:mb-1 text-[10px] md:text-xs md:text-sm">Secure Data</h3>
              <p className="text-green-100 text-[9px] hidden md:block">Protected & private</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 md:mb-2">
                <PawPrint size={16} className="text-white md:hidden" />
                <PawPrint size={24} className="text-white hidden md:block" />
              </div>
              <h3 className="text-white font-semibold mb-0.5 md:mb-1 text-[10px] md:text-xs md:text-sm">Easy Access</h3>
              <p className="text-green-100 text-[9px] hidden md:block">Anytime, anywhere</p>
            </div>
          </div>

          <Link to={user ? "/my-pets" : "/login"}>
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 font-semibold px-6 md:px-8 py-4 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm md:text-base">
              Register pet
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
