import React from "react";
import { get, getDatabase, ref } from "firebase/database";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Announcements from "./Announcements";
import HealthInfo from "./HealthInfo";
import CTA from "./CTA";
import Footer from "./Footer";
import app from "../firebaseConfig";

const LandingPage = () => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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
        .slice(0, 6),
    [items]
  );

  const healthItems = React.useMemo(
    () =>
      items
        .filter((i) => String(i.type || "") === "health")
        .slice(0, 6),
    [items]
  );

  return (
    <div className="bg-[#f7faf7] text-slate-900 min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="border-b border-green-100 bg-white">
        <Hero />
      </section>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {loading ? (
          <div className="space-y-10 animate-pulse">
            <div className="h-8 bg-green-100 rounded-lg w-1/4"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white border border-green-100"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Announcements */}
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Latest Announcements
                  </h2>
                  <p className="mt-2 text-slate-600">
                    News, updates, and important notices.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 md:p-8">
                <Announcements items={announcementItems} />
              </div>
            </section>

            {/* Health Info */}
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Pet Health Information
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Trusted articles and wellness tips for your pets.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 md:p-8">
                <HealthInfo items={healthItems} />
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="bg-[#1f7a4d] rounded-3xl shadow-md overflow-hidden">
          <CTA />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;