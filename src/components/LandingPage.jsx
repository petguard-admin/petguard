import React from "react";
import { Link, useLocation } from "react-router-dom";
import { get, getDatabase, ref } from "firebase/database";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Announcements from "./Announcements";
import HealthInfo from "./HealthInfo";
import CTA from "./CTA";
import Footer from "./Footer";
import app from "../firebaseConfig";
import { useAuth } from "../AuthContext";

const nav = [
  { label: "Home", to: "/" },
  { label: "My Pets", to: "/my-pets" },
  { label: "Medical Records", to: "/medical-records" },
  { label: "Profile", to: "/profile" },
];

const LandingPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [viewAllAnnouncements, setViewAllAnnouncements] = React.useState(false);
  const [viewAllHealthInfo, setViewAllHealthInfo] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const db = getDatabase(app);
        const snap = await get(ref(db, "announcements"));
        const val = snap.exists() ? snap.val() : {};

        const arr = Object.keys(val || {})
          .filter((id) => id !== "__meta")
          .map((id) => ({ id, ...val[id] }))
          .filter((a) => a?.isPublished);

        arr.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        if (mounted) setItems(arr);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const announcementItems = React.useMemo(
    () =>
      items
        .filter((i) => String(i.type || "") === "announcement")
        .slice(0, viewAllAnnouncements ? undefined : 6),
    [items, viewAllAnnouncements]
  );

  const healthItems = React.useMemo(
    () =>
      items
        .filter((i) => String(i.type || "") === "health")
        .slice(0, viewAllHealthInfo ? undefined : 6),
    [items, viewAllHealthInfo]
  );

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

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
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full block rounded-xl px-4 py-3 text-sm font-medium text-left transition-all text-slate-300 hover:bg-red-950/40 hover:text-red-400"
      >
        Logout
      </button>
    </nav>
  );

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Navbar */}
      <Navbar dark />

      {/* Mobile Menu */}
      {user && !mobileOpen && !modalOpen && (
        <div className="md:hidden fixed top-20 left-4 z-60">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium shadow-sm text-slate-200"
          >
            ☰ Menu
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-50">Menu</h2>
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

      {/* Hero */}
      <Hero />

      {/* Main */}
      <main className="max-w-7xl mx-auto my-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {loading ? (
          <div className="space-y-10 animate-pulse">
            <div>
              <div className="h-8 bg-slate-800 rounded-lg w-1/4 mb-2" />
              <div className="h-4 bg-slate-800 rounded-lg w-1/3" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
                  <div className="h-48 bg-slate-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-slate-800 rounded w-1/4" />
                    <div className="h-5 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Announcements */}
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-50">
                    Latest Announcements
                  </h2>
                  <div className="h-1 bg-green-500 mt-2 w-24"></div>
                  <p className="mt-2 text-slate-400">
                    News, updates, and important notices.
                  </p>
                </div>
                {items.filter((i) => String(i.type || "") === "announcement").length > 6 && (
                  <button
                    onClick={() => setViewAllAnnouncements(!viewAllAnnouncements)}
                    className="hidden md:block text-emerald-400 hover:text-emerald-300 font-semibold text-sm"
                  >
                    {viewAllAnnouncements ? 'Show less' : 'View all'}
                  </button>
                )}
              </div>

              <div className="border border-slate-800 shadow-sm p-6 md:p-8 -mx-4 md:mx-0">
                <Announcements items={announcementItems} onItemClick={handleItemClick} compact={viewAllAnnouncements} alwaysScrollOnMobile />
              </div>
            </section>

            {/* Health Info */}
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-50">
                    Pet Health Information
                  </h2>
                  <div className="h-1 bg-green-500 mt-2 w-24"></div>
                  <p className="mt-2 text-slate-400">
                    Trusted articles and wellness tips for your pets.
                  </p>
                </div>
                {items.filter((i) => String(i.type || "") === "health").length > 6 && (
                  <button
                    onClick={() => setViewAllHealthInfo(!viewAllHealthInfo)}
                    className="hidden md:block text-emerald-400 hover:text-emerald-300 font-semibold text-sm"
                  >
                    {viewAllHealthInfo ? 'Show less' : 'View all'}
                  </button>
                )}
              </div>

              <div className="border border-slate-800 shadow-sm p-6 md:p-8 -mx-4 md:mx-0">
                <HealthInfo items={healthItems} onItemClick={handleItemClick} compact={viewAllHealthInfo} alwaysScrollOnMobile />
              </div>
            </section>
          </>
        )}

      </main>

      {/* CTA */}
      <CTA />

      {/* Footer */}
      <Footer />

      {/* Modal */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-800">
            {selectedItem.imageUrl && (
              <div className="h-72 md:h-96 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-slate-50">{selectedItem.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-invert max-w-none">
                {selectedItem.content && (
                  <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                )}
                {selectedItem.description && (
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedItem.description}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 active:scale-[0.97] transition-all duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
