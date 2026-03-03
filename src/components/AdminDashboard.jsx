import React from 'react';

import { getDatabase, onValue, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [totalPets, setTotalPets] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const db = getDatabase(app);
    setLoading(true);
    setError('');

    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
      const val = snap.exists() ? snap.val() : {};
      const keys = Object.keys(val || {}).filter((k) => k !== '__meta');
      setTotalUsers(keys.length);
      setLoading(false);
    }, (err) => {
      setError(err?.message || 'Failed to load users count.');
      setLoading(false);
    });

    const petsRef = ref(db, 'petsByOwner');
    const unsubPets = onValue(petsRef, (snap) => {
      if (!snap.exists()) {
        setTotalPets(0);
        return;
      }
      const val = snap.val() || {};
      let count = 0;
      Object.values(val).forEach((ownerPets) => {
        if (!ownerPets) return;
        Object.values(ownerPets).forEach((pet) => {
          if (pet && typeof pet === 'object') count += 1;
        });
      });
      setTotalPets(count);
    }, (err) => {
      setError(err?.message || 'Failed to load pets count.');
    });

    return () => {
      unsubUsers();
      unsubPets();
    };
  }, []);

  return (
    <AdminSidebarLayout title="Dashboard">
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : totalUsers}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Pets</div>
          <div className="mt-2 text-3xl font-bold">{loading ? '—' : totalPets}</div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminDashboard;
