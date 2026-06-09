import React from "react";
import { Button } from "./ui/Button";

const Announcements = ({ items = [] }) => {
  const fmtDate = (ts) => {
    if (!ts) return "";
    try {
      return new Date(Number(ts)).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length ? (
            items.map((announcement) => (
              <div
                key={announcement.id}
                className="group bg-white rounded-2xl border border-green-100 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Image */}
                <div className="h-48 bg-green-50 overflow-hidden">
                  <img
                    src={announcement.imageUrl || "/placeholder.jpg"}
                    alt={announcement.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  {announcement.createdAt && (
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">
                      {fmtDate(announcement.createdAt)}
                    </p>
                  )}

                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                    {announcement.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                    {announcement.content}
                  </p>

                  {announcement.link && (
                    <Button
                      as="a"
                      href={announcement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 bg-green-700 hover:bg-green-800 text-white rounded-lg"
                    >
                      Read More →
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 text-center text-slate-500">
              No announcements yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Announcements;