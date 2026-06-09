import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import { useAuth } from "../AuthContext";
import { PawPrint } from "lucide-react";

const Navbar = () => {
  const { user, logout, loading, roleLoading, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-100">
      <nav className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-slate-900"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-700 text-white">
            <PawPrint size={20} />
          </div>
          <span>
            Pet<span className="text-green-700">Guard</span>
          </span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
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
        <div className="flex items-center gap-3">
          {loading || (user && roleLoading) ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-green-700 text-green-700 hover:bg-green-50 rounded-xl"
              >
                <Link to={isAdmin ? "/admin/profile" : "/profile"}>
                  Profile
                </Link>
              </Button>

              <Button
                size="sm"
                onClick={logout}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-xl"
              >
                <Link to="/login">Login</Link>
              </Button>

              <Button
                size="sm"
                asChild
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-5"
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