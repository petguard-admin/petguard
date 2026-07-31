import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';

const CTA = () => {
  const { user } = useAuth();

  return (
    <section className="relative py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Pet Silhouettes Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        {/* Dog silhouette */}
        <svg className="absolute top-10 left-10 w-48 h-48" viewBox="0 0 100 100" fill="currentColor">
          <path d="M30 20 C25 20 20 25 20 35 C20 45 25 50 30 50 C35 50 40 45 40 35 C40 25 35 20 30 20 Z M30 28 C33 28 35 30 35 35 C35 40 33 42 30 42 C27 42 25 40 25 35 C25 30 27 28 30 28 Z M70 25 C65 25 60 30 60 40 C60 50 65 55 70 55 C75 55 80 50 80 40 C80 30 75 25 70 25 Z M70 33 C73 33 75 35 75 40 C75 45 73 47 70 47 C67 47 65 45 65 40 C65 35 67 33 70 33 Z M50 50 C40 50 35 55 35 65 L35 85 C35 88 38 90 42 90 L58 90 C62 90 65 88 65 85 L65 65 C65 55 60 50 50 50 Z M45 60 L55 60 L55 70 L45 70 L45 60 Z" />
        </svg>
        {/* Cat silhouette */}
        <svg className="absolute top-32 right-16 w-40 h-40" viewBox="0 0 100 100" fill="currentColor">
          <path d="M25 30 L30 15 L40 25 L50 20 L60 25 L70 15 L75 30 C80 35 82 45 82 55 C82 70 70 85 50 85 C30 85 18 70 18 55 C18 45 20 35 25 30 Z M50 40 C55 40 58 43 58 48 C58 53 55 56 50 56 C45 56 42 53 42 48 C42 43 45 40 50 40 Z" />
        </svg>
        {/* Paw prints */}
        <svg className="absolute bottom-16 left-24 w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
          <ellipse cx="50" cy="65" rx="20" ry="18" />
          <ellipse cx="30" cy="40" rx="8" ry="10" />
          <ellipse cx="45" cy="30" rx="8" ry="10" />
          <ellipse cx="55" cy="30" rx="8" ry="10" />
          <ellipse cx="70" cy="40" rx="8" ry="10" />
        </svg>
        <svg className="absolute bottom-24 right-32 w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
          <ellipse cx="50" cy="65" rx="20" ry="18" />
          <ellipse cx="30" cy="40" rx="8" ry="10" />
          <ellipse cx="45" cy="30" rx="8" ry="10" />
          <ellipse cx="55" cy="30" rx="8" ry="10" />
          <ellipse cx="70" cy="40" rx="8" ry="10" />
        </svg>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <div className="inline-block px-4 py-1.5 mb-6 bg-green-600/20 backdrop-blur-sm rounded-full border border-green-500/30">
          <span className="text-green-400 text-sm font-medium">Getting Started</span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
          Owner's Guide
        </h2>
        <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Learn how to register your pets and manage their health records with our simple step-by-step guide.
        </p>

        {/* Guide Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 group-hover:border-green-600/50 transition-colors duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-600/20">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-white font-semibold mb-3 text-lg">Create Account</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Sign up and complete your owner profile with basic information.</p>
            </div>
          </div>
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 group-hover:border-green-600/50 transition-colors duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-600/20">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-white font-semibold mb-3 text-lg">Register Your Pet</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Add your pet's details including name, breed, age, and photo.</p>
            </div>
          </div>
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 group-hover:border-green-600/50 transition-colors duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-600/20">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-white font-semibold mb-3 text-lg">Track Health</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Monitor vaccinations, medical records, and wellness milestones.</p>
            </div>
          </div>
        </div>

        <Link to={user ? "/my-pets" : "/register"}>
          <Button 
            size="lg" 
            variant="green" 
            className="px-10 py-4 rounded-xl text-base md:text-lg font-semibold shadow-xl shadow-green-600/30 hover:shadow-2xl hover:shadow-green-600/40 transition-all duration-300"
          >
            {user ? "Manage Your Pets" : "Get Started"}
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTA;
