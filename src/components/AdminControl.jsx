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

  const [addOpen, setAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [form, setForm] = React.useState({ firstname: '', lastname: '', email: '', phone: '' });

  const [viewOpen, setViewOpen] = React.useState(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState(null);

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

  const openAdd = () => {
    setForm({ firstname: '', lastname: '', email: '', phone: '' });
    setFormError('');
    setFormMessage('');
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
  };

  const onFormChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.firstname.trim()) return 'Firstname is required.';
    if (!form.lastname.trim()) return 'Lastname is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.phone.trim()) return 'Phone is required.';
    return '';
  };

  const submitAdd = async () => {
    setFormError('');
    setFormMessage('');
    const msg = validate();
    if (msg) {
      setFormError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const data = await adminService.inviteAdmin({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone: form.phone,
      });

      setFormMessage(data?.message || 'Admin created successfully. Email verification sent.');
      await loadAdmins();
      setAddOpen(false);
    } catch (e) {
      setFormError(e?.message || 'Could not invite admin. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
              className="w-full md:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <Button variant="green" type="button" onClick={openAdd}>Add New Admin</Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold w-1/6">
                    <button type="button" onClick={() => toggleSort('name')} className="hover:text-green-700 transition-colors">
                      Name
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold w-1/6">
                    <button type="button" onClick={() => toggleSort('email')} className="hover:text-green-700 transition-colors">
                      Email
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold w-1/6">
                    <button type="button" onClick={() => toggleSort('phone')} className="hover:text-green-700 transition-colors">
                      Phone
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold w-1/6">
                    <button type="button" onClick={() => toggleSort('role')} className="hover:text-green-700 transition-colors">
                      Role
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold w-1/6">
                    <button type="button" onClick={() => toggleSort('createdAt')} className="hover:text-green-700 transition-colors">
                      Date Created
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={6}>Loading...</td>
                  </tr>
                ) : filteredSorted.length ? (
                  filteredSorted.map((a) => {
                    const name = `${a.firstname || ''} ${a.lastname || ''}`.trim() || '—';
                    return (
                      <tr key={a.uid} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{name}</td>
                        <td className="py-3 px-4">{a.email || '—'}</td>
                        <td className="py-3 px-4">{a.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">{a.role || 'admin'}</span>
                        </td>
                        <td className="py-3 px-4">{fmtDate(a.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="blue" type="button" onClick={() => openView(a)}>View</Button>
                            <Button size="sm" variant="destructive" type="button" onClick={() => handleDelete(a)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={6}>No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Add New Admin"
        onClose={closeAdd}
        maxWidthClassName="max-w-lg"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            {formError ? (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            ) : null}
            {formMessage ? (
              <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">{formMessage}</div>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Firstname</label>
                <input
                  name="firstname"
                  value={form.firstname}
                  onChange={onFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Lastname</label>
                <input
                  name="lastname"
                  value={form.lastname}
                  onChange={onFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={closeAdd}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={submitAdd}
                disabled={submitting}
              >
                {submitting ? 'Inviting...' : 'Invite Admin'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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
    </AdminSidebarLayout>
  );
};

export default AdminControl;
