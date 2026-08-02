import React from 'react';
import { PawPrint } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-slate-400">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PawPrint size={20} className="text-emerald-500" />
              <span className="text-lg font-bold text-white">
                Pet<span className="text-emerald-500">Guard</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Dedicated to the health and well-being of your pets. Manage medical records, track wellness, and stay informed.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-emerald-400 transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-emerald-400 transition-colors">Terms of Service</a>
              <a href="#" className="block hover:text-emerald-400 transition-colors">Contact Us</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <div className="space-y-2 text-sm">
              <p>Mamburao, Occidental Mindoro</p>
              <p>petguard.admin@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} PetGuard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
