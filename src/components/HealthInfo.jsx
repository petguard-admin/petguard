import React from "react";

const HealthInfo = ({ items = [], onItemClick, compact = false, alwaysScrollOnMobile = false }) => {
  const getGridClass = () => {
    if (alwaysScrollOnMobile) {
      return 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0';
    }
    if (compact) {
      return 'grid grid-cols-2 gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6';
    }
    return 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0';
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className={getGridClass()}>
          {items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className={`${compact ? '' : 'w-[300px] snap-start flex-shrink-0 md:w-auto'} group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer`}
                onClick={() => onItemClick && onItemClick(item)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-sky-100 to-blue-50 overflow-hidden">
                  <img
                    src={item.imageUrl || "/placeholder.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-sky-700 backdrop-blur-sm shadow-sm">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    Health Guide
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-sky-700 transition-colors duration-200">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-4 flex items-center text-sm font-semibold text-sky-700 group-hover:text-sky-800 transition-colors">
                    Read more
                    <svg className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 text-center text-slate-500 py-12">
              No health information yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HealthInfo;
