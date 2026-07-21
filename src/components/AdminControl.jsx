import React from 'react';

import AdminSidebarLayout from './AdminSidebarLayout';
import Modal from './Modal';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';
import adminService from '../services/adminService';
import { auth } from '../services/firebase';

const AdminControl = () => {
  const { user } = useAuth();

  const [admins, setAdmins] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');


  const [viewOpen, setViewOpen] = React.useState(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState(null);

  const [promoteOpen, setPromoteOpen] = React.useState(false);
  const [promoteSearch, setPromoteSearch] = React.useState('');
  const [promoteUsers, setPromoteUsers] = React.useState([]);
  const [promoteSearching, setPromoteSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [promoteSubmitting, setPromoteSubmitting] = React.useState(false);
  const [promoteError, setPromoteError] = React.useState('');
  const [promoteMessage, setPromoteMessage] = React.useState('');

  const loadAdmins = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdmins();
      setAdmins(Array.isArray(data?.admins) ? data.admins : []);
    } catch (e) {
      setError('Could not load admins. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleDelete = async (adminRow) => {
    const ok = window.confirm('Delete this admin? This cannot be undone.');
    if (!ok) return;
    setError('');
    try {
      await adminService.deleteAdmin(adminRow.uid);
      await loadAdmins();
    } catch (e) {
      setError('Could not delete admin. Please try again.');
    }
  };

  const openView = (adminRow) => {
    setSelectedAdmin(adminRow);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelectedAdmin(null);
  };

  const openPromote = () => {
    setPromoteSearch('');
    setPromoteUsers([]);
    setSelectedUser(null);
    setPromoteError('');
    setPromoteMessage('');
    setPromoteOpen(true);
  };

  const closePromote = () => {
    setPromoteOpen(false);
  };

  const searchUsers = async () => {
    if (!promoteSearch.trim()) {
      setPromoteUsers([]);
      return;
    }

    setPromoteSearching(true);
    setPromoteError('');
    try {
      const data = await adminService.searchUsers(promoteSearch);
      setPromoteUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setPromoteError(e?.message || 'Could not search users. Please try again.');
      setPromoteUsers([]);
    } finally {
      setPromoteSearching(false);
    }
  };

  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (promoteOpen && promoteSearch.trim()) {
        searchUsers();
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [promoteSearch, promoteOpen]);

  const selectUser = (user) => {
    setSelectedUser(user);
    setPromoteSearch('');
    setPromoteUsers([]);
  };

  const submitPromote = async () => {
    setPromoteError('');
    setPromoteMessage('');
    
    if (!selectedUser?.uid && !selectedUser?.ownerId) {
      setPromoteError('Please select a user to promote.');
      return;
    }

    setPromoteSubmitting(true);
    try {
      const data = await adminService.promoteToAdmin(selectedUser.uid, selectedUser.ownerId);
      setPromoteMessage(data?.message || 'User promoted to admin successfully.');
      await loadAdmins();
      setPromoteOpen(false);
    } catch (e) {
      setPromoteError(e?.message || 'Could not promote user. Please try again.');
    } finally {
      setPromoteSubmitting(false);
    }
  };

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = admins.filter((a) => {
      if (!q) return true;
      const name = `${a.firstname || ''} ${a.lastname || ''}`.trim().toLowerCase();
      const email = String(a.email || '').toLowerCase();
      const phone = String(a.phone || '').toLowerCase();
      const role = String(a.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    const getValue = (a) => {
      if (sortKey === 'name') return `${a.lastname || ''} ${a.firstname || ''}`.toLowerCase();
      if (sortKey === 'email') return String(a.email || '').toLowerCase();
      if (sortKey === 'phone') return String(a.phone || '').toLowerCase();
      if (sortKey === 'role') return String(a.role || '').toLowerCase();
      if (sortKey === 'createdAt') return Number(a.createdAt || 0);
      return '';
    };

    filtered.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return filtered;
  }, [admins, search, sortKey, sortDir]);

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

  return (
    <AdminSidebarLayout title="Admin Control">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins..."
              className="w-full md:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="green" type="button" onClick={openPromote}>Promote to Admin</Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[480px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6">
                    <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                      Name
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6">
                    <button type="button" onClick={() => toggleSort('email')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                      Email
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6 hidden md:table-cell">
                    <button type="button" onClick={() => toggleSort('phone')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                      Phone
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6">
                    <button type="button" onClick={() => toggleSort('role')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                      Role
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6 hidden lg:table-cell">
                    <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                      Date Created
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-10 text-center text-slate-400 text-sm" colSpan={6}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSorted.length ? (
                  filteredSorted.map((a, idx) => {
                    const name = `${a.firstname || ''} ${a.lastname || ''}`.trim() || '—';
                    return (
                      <tr key={a.uid} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="py-3 px-4 font-medium text-slate-800">{name}</td>
                        <td className="py-3 px-4 text-slate-600">{a.email || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 hidden md:table-cell">{a.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2.5 py-0.5 text-xs font-semibold">{a.role || 'admin'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">{fmtDate(a.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            <Button size="xs" variant="blue" type="button" onClick={() => openView(a)}>View</Button>
                            <Button size="xs" variant="destructive" type="button" onClick={() => handleDelete(a)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="py-12 text-center text-slate-400" colSpan={6}>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">No admins found</span>
                        <span className="text-xs text-slate-300">Try adjusting your search</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={viewOpen} title="Admin Details" onClose={closeView}>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {`${selectedAdmin?.firstname || ''} ${selectedAdmin?.lastname || ''}`.trim() || '—'}</div>
          <div><span className="font-medium">Email:</span> {selectedAdmin?.email || '—'}</div>
          <div><span className="font-medium">Phone:</span> {selectedAdmin?.phone || '—'}</div>
          <div><span className="font-medium">Role:</span> {selectedAdmin?.role || 'admin'}</div>
          <div><span className="font-medium">Date created:</span> {fmtDate(selectedAdmin?.createdAt)}</div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={closeView}>
            Close
          </Button>
          <Button variant="destructive" onClick={() => { closeView(); handleDelete(selectedAdmin); }}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal
        open={promoteOpen}
        title="Promote User to Admin"
        onClose={closePromote}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-4">
          {promoteError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{promoteError}</div>
          ) : null}
          {promoteMessage ? (
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">{promoteMessage}</div>
          ) : null}

          {selectedUser ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Selected User:</div>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Name:</span> {selectedUser.firstname} {selectedUser.lastname}</div>
                <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                <div><span className="font-medium">Phone:</span> {selectedUser.phone}</div>
                <div><span className="font-medium">Current Role:</span> {selectedUser.role || 'user'}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Change selection
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Search Users by Name, Email, or Phone</label>
                <input
                  value={promoteSearch}
                  onChange={(e) => setPromoteSearch(e.target.value)}
                  placeholder="Type to search users..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {promoteSearching ? (
                <div className="text-sm text-slate-500">Searching...</div>
              ) : promoteUsers.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {promoteUsers.map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => selectUser(u)}
                      className="p-3 border-b border-gray-100 hover:bg-slate-50 cursor-pointer last:border-b-0"
                    >
                      <div className="text-sm font-medium">{u.firstname} {u.lastname}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      <div className="text-xs text-slate-500">{u.phone}</div>
                      <div className="text-xs text-slate-400">Role: {u.role || 'user'}</div>
                    </div>
                  ))}
                </div>
              ) : promoteSearch.trim() ? (
                <div className="text-sm text-slate-500">No users found.</div>
              ) : null}
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={closePromote}
              disabled={promoteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={submitPromote}
              disabled={promoteSubmitting || !selectedUser}
            >
              {promoteSubmitting ? 'Promoting...' : 'Promote to Admin'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminSidebarLayout>
  );
};

export default AdminControl;
