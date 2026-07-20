import React from "react";

const Announcements = ({ items = [], onItemClick, compact = false, alwaysScrollOnMobile = false }) => {
  const fmtDate = (ts) => {
    if (!ts) return "";
    try {
      return new Date(Number(ts)).toLocaleDateString();
    } catch {
      return "";
    }
  };

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
            items.map((announcement) => (
              <div
                key={announcement.id}
                className={`${compact ? '' : 'w-[300px] snap-start flex-shrink-0 md:w-auto'} group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer`}
                onClick={() => onItemClick && onItemClick(announcement)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-50 overflow-hidden">
                  <img
                    src={announcement.imageUrl || "/placeholder.jpg"}
                    alt={announcement.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  {announcement.createdAt && (
                    <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-emerald-700 backdrop-blur-sm shadow-sm">
                      {fmtDate(announcement.createdAt)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-200">
                    {announcement.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {announcement.content}
                  </p>

                  <div className="mt-4 flex items-center text-sm font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
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
              No announcements yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Announcements;
