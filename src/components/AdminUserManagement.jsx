import React from 'react';

import { getDatabase, onValue, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';

const AdminUserManagement = () => {
  const [users, setUsers] = React.useState([]);
  const [petsByOwner, setPetsByOwner] = React.useState({});
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    const db = getDatabase(app);

    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
      if (!snap.exists()) {
        setUsers([]);
        return;
      }
      const val = snap.val() || {};
      const arr = Object.keys(val).map((uid) => ({ uid, ...val[uid] }));
      setUsers(arr);
    });

    const petsRef = ref(db, 'petsByOwner');
    const unsubPets = onValue(petsRef, (snap) => {
      setPetsByOwner(snap.exists() ? snap.val() : {});
    });

    return () => {
      unsubUsers();
      unsubPets();
    };
  }, []);

  const petCounts = React.useMemo(() => {
    const out = {};
    const root = petsByOwner || {};
    Object.keys(root).forEach((uid) => {
      const ownerPets = root[uid] || {};
      let count = 0;
      Object.values(ownerPets).forEach((pet) => {
        if (pet && typeof pet === 'object') count += 1;
      });
      out[uid] = count;
    });
    return out;
  }, [petsByOwner]);

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = users.filter((u) => {
      if (!q) return true;
      const name = `${u.firstname || ''} ${u.lastname || ''}`.trim().toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const phone = String(u.phone || '').toLowerCase();
      const barangay = String(u.barangay || '').toLowerCase();
      const gender = String(u.gender || '').toLowerCase();
      const birthday = String(u.birthday || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || barangay.includes(q) || gender.includes(q) || birthday.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    const getValue = (u) => {
      if (sortKey === 'name') return `${u.lastname || ''} ${u.firstname || ''}`.toLowerCase();
      if (sortKey === 'email') return String(u.email || '').toLowerCase();
      if (sortKey === 'phone') return String(u.phone || '').toLowerCase();
      if (sortKey === 'barangay') return String(u.barangay || '').toLowerCase();
      if (sortKey === 'gender') return String(u.gender || '').toLowerCase();
      if (sortKey === 'birthday') return String(u.birthday || '').toLowerCase();
      if (sortKey === 'pets') return petCounts[u.uid] || 0;
      if (sortKey === 'createdAt') return Number(u.createdAt || 0);
      return '';
    };

    filtered.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return filtered;
  }, [users, search, sortKey, sortDir, petCounts]);

  React.useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filteredSorted.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const onNewUser = () => {
    window.alert('New User (UI only for now)');
  };

  const onView = (u) => window.alert(`View user: ${u.uid}`);
  const onEdit = (u) => window.alert(`Edit user: ${u.uid}`);
  const onDelete = (u) => window.alert(`Delete user: ${u.uid}`);

  return (
    <AdminSidebarLayout title="User Management">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="userSearch">Search</label>
            <input
              id="userSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, barangay"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onNewUser}>New User</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('name')} className="font-semibold hover:underline">
                    Name
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('email')} className="font-semibold hover:underline">
                    Email
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('phone')} className="font-semibold hover:underline">
                    Phone
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('barangay')} className="font-semibold hover:underline">
                    Barangay
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('gender')} className="font-semibold hover:underline">
                    Gender
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('birthday')} className="font-semibold hover:underline">
                    Birthday
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('pets')} className="font-semibold hover:underline">
                    No. of Pets
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button type="button" onClick={() => toggleSort('createdAt')} className="font-semibold hover:underline">
                    Date of Registration
                  </button>
                </th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                pageItems.map((u) => {
                  const name = `${u.firstname || ''} ${u.lastname || ''}`.trim() || '—';
                  return (
                    <tr key={u.uid} className="border-b border-border last:border-b-0">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">{name}</td>
                      <td className="py-2 pr-4">{u.email || '—'}</td>
                      <td className="py-2 pr-4">{u.phone || '—'}</td>
                      <td className="py-2 pr-4">{u.barangay || '—'}</td>
                      <td className="py-2 pr-4">{u.gender || '—'}</td>
                      <td className="py-2 pr-4">{u.birthday || '—'}</td>
                      <td className="py-2 pr-4">{petCounts[u.uid] ?? 0}</td>
                      <td className="py-2 pr-4">{fmtDate(u.createdAt)}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => onView(u)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onEdit(u)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => onDelete(u)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {filteredSorted.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, filteredSorted.length)} of{' '}
            {filteredSorted.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage === 1}>
              First
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="text-sm">
              Page {safePage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
              Last
            </Button>
          </div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminUserManagement;
