import React from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const nav = [
  { label: "Dashboard", to: "/admin" },
  { label: "User Management", to: "/admin/users" },
  { label: "Pet Management", to: "/admin/pets" },
  { label: "Information Center", to: "/admin/info" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Audit Trail", to: "/admin/audit-trail" },
  { label: "Profile", to: "/admin/profile" },
];

const adminControls = [{ label: "Admins", to: "/admin/control" }];

const AdminSidebarLayout = ({ title, children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [adminControlsOpen, setAdminControlsOpen] = React.useState(true);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Admin Controls */}
      <div className="pt-3 border-t border-slate-800 mt-3">
        <button
          type="button"
          onClick={() => setAdminControlsOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
        >
          <span>Admin Controls</span>
          <span className="text-xs">{adminControlsOpen ? "−" : "+"}</span>
        </button>

        {adminControlsOpen && (
          <div className="mt-2 space-y-1">
            {adminControls.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-lg px-4 py-2 text-sm ml-3 transition-all ${
                    active
                      ? "bg-emerald-900/50 text-emerald-400 font-medium"
                      : "text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar dark />

      <div className="flex flex-col md:flex-row gap-1">
        {/* Mobile Menu */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium shadow-sm text-slate-200"
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
            <div className="absolute left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-50">Admin Panel</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-400 hover:text-slate-100"
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
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm p-3">
              <h2 className="text-base font-bold text-slate-50 mb-3">
                Admin Panel
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
                <h1 className="text-xl sm:text-2xl font-bold text-slate-50">{title}</h1>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">
                  Manage and monitor system information here.
                </p>
              </div>
            )}

            <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 shadow-sm p-3 sm:p-5 min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSidebarLayout;