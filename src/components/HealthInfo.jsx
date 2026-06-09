import React from "react";
import { Button } from "./ui/Button";

const HealthInfo = ({ items = [] }) => {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-green-100 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Image */}
                <div className="h-48 bg-green-50 overflow-hidden">
                  <img
                    src={item.imageUrl || "/placeholder.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">
                    Health Guide
                  </p>

                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                    {item.content}
                  </p>

                  {item.link && (
                    <Button
                      as="a"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 bg-white border border-green-700 text-green-700 hover:bg-green-50 rounded-lg"
                    >
                      View Material →
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 text-center text-slate-500">
              No health information yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HealthInfo;