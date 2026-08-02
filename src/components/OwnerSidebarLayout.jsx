import React from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../AuthContext";

const nav = [
  { label: "Home", to: "/" },
  { label: "My Pets", to: "/my-pets" },
  { label: "Medical Records", to: "/medical-records" },
  { label: "Profile", to: "/profile" },
];

const OwnerSidebarLayout = ({ title, children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { logout } = useAuth();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  const renderNav = () => (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              active
                ? "bg-green-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full block rounded-xl px-4 py-3 text-sm font-medium text-left transition-all text-slate-700 hover:bg-red-50 hover:text-red-700"
      >
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <Navbar />

      <div className="flex flex-col md:flex-row gap-1">
        {/* Mobile Menu */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-green-100 bg-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            ☰ Menu
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Menu</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
              {renderNav()}
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="p-2">
            <div className="rounded-2xl bg-white border border-green-100 shadow-sm p-3">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                My Account
              </h2>
              {renderNav()}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-[70rem] mx-auto w-full">
            {title && (
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-500 mt-1 text-xs sm:text-sm">
                  Access and manage your pet information here.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl sm:rounded-2xl border border-green-100 shadow-sm p-3 sm:p-5 min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerSidebarLayout;