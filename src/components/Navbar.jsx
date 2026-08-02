import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import { useAuth } from "../AuthContext";

const Navbar = () => {
  const { user, logout, loading, roleLoading, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-100">
      <nav className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex justify-between items-center">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold text-slate-900"
        >
          <img
            src="/img/OMV_logo.png"
            alt="OMV Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg"
          />
          <span>
            Pet<span className="text-green-700">Guard</span>
          </span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-700">
          <li>
            <Link
              to="/"
              className="hover:text-green-700 transition-colors"
            >
              Home
            </Link>
          </li>

          {user && isAdmin ? (
            <li>
              <Link
                to="/admin"
                className="hover:text-green-700 transition-colors"
              >
                Dashboard
              </Link>
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/my-pets"
                  className="hover:text-green-700 transition-colors"
                >
                  My Pets
                </Link>
              </li>
              <li>
                <Link
                  to="/medical-records"
                  className="hover:text-green-700 transition-colors"
                >
                  Medical Records
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Auth Actions */}
        <div className="flex items-center gap-2">
          {loading || (user && roleLoading) ? (
            <span className="text-xs sm:text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to={isAdmin ? "/admin/profile" : "/profile"}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-700 text-green-700 hover:bg-green-50 rounded-lg text-xs sm:text-sm px-2 sm:px-3"
                >
                  Profile
                </Button>
              </Link>

              <Button
                size="sm"
                onClick={logout}
                className="bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                <Link to="/login">Login</Link>
              </Button>

              <Button
                size="sm"
                asChild
                className="bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs sm:text-sm px-3 sm:px-4"
              >
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;