import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import Navbar from './Navbar';

const nav = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'User Management', to: '/admin/users' },
  { label: 'Pet Management', to: '/admin/pets' },
  { label: 'Information Center', to: '/admin/info' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Audit Trail', to: '/admin/audit-trail' },
  { label: 'Settings', to: '/admin/settings' },
];

const AdminSidebarLayout = ({ title, children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
            className={
              'block rounded-md px-3 py-2 text-sm transition-colors ' +
              (active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted')
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm"
          >
            Menu
          </button>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Admin</div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  Close
                </button>
              </div>
              {renderNav()}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          <aside className="hidden md:block md:sticky md:top-6">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="text-sm font-semibold mb-3">Admin</div>
              {renderNav()}
            </div>
          </aside>

          <main>
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebarLayout;
