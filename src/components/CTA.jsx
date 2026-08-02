import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';

const CTA = () => {
  const { user } = useAuth();

  return (
    <section className="py-12 sm:py-16 bg-slate-900">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Getting Started
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mb-8 sm:mb-10 max-w-xl mx-auto">
          Register your pets and manage their health records in 3 simple steps
        </p>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm sm:text-base">1</span>
            </div>
            <h3 className="text-white font-semibold text-xs sm:text-sm mb-1">Create Account</h3>
            <p className="text-slate-400 text-[10px] sm:text-xs">Sign up</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm sm:text-base">2</span>
            </div>
            <h3 className="text-white font-semibold text-xs sm:text-sm mb-1">Register Pet</h3>
            <p className="text-slate-400 text-[10px] sm:text-xs">Add details</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm sm:text-base">3</span>
            </div>
            <h3 className="text-white font-semibold text-xs sm:text-sm mb-1">Track Health</h3>
            <p className="text-slate-400 text-[10px] sm:text-xs">Monitor records</p>
          </div>
        </div>

        <Link to={user ? "/my-pets" : "/register"}>
          <Button variant="green" className="text-xs sm:text-sm">
            {user ? "Manage Your Pets" : "Get Started"}
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTA;
