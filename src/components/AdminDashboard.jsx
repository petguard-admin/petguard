import React from 'react';

import { getDatabase, get, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [totalPets, setTotalPets] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const db = getDatabase(app);
        const [ownersSnap, petsSnap] = await Promise.all([
          get(ref(db, 'owners')),
          get(ref(db, 'petsByOwner')),
        ]);

        const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
        const totalUsers = Object.keys(ownersVal || {}).filter((k) => k !== '__meta').length;

        const petsVal = petsSnap.exists() ? petsSnap.val() : {};
        let totalPets = 0;
        Object.values(petsVal || {}).forEach((ownerPets) => {
          if (!ownerPets) return;
          Object.values(ownerPets).forEach((pet) => {
            if (pet && typeof pet === 'object') totalPets += 1;
          });
        });

        setTotalUsers(totalUsers);
        setTotalPets(totalPets);
        setLoading(false);
      } catch (e) {
        setError(e?.message || 'Failed to load stats.');
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

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
