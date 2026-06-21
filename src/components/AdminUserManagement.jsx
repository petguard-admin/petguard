import React from 'react';

import { getDatabase, get, ref, update } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';
import Modal from './Modal';
import { auth } from '../auth';
import app from '../firebaseConfig';
import { logAuditTrail } from '../utils/auditLogger';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const emailKey = (email) => {
  const e = normalizeEmail(email);
  try {
    return btoa(unescape(encodeURIComponent(e)));
  } catch {
    return btoa(e);
  }
};

const normalizePhone = (phone) => String(phone || '').replace(/\s+/g, '').trim();

const genOwnerId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `owner_${ts}_${rand}`;
};

const AdminUserManagement = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [form, setForm] = React.useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    barangay: '',
    gender: '',
    birthday: '',
  });
  const [search, setSearch] = React.useState('');
  const [barangayFilter, setBarangayFilter] = React.useState('');
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const fetchOwners = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const [ownersSnap, petsSnap] = await Promise.all([
        get(ref(db, 'owners')),
        get(ref(db, 'petsByOwner')),
      ]);

      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
      const petsVal = petsSnap.exists() ? petsSnap.val() : {};

      const petCounts = {};
      Object.keys(petsVal || {}).forEach((ownerId) => {
        const ownerPets = petsVal[ownerId] || {};
        petCounts[ownerId] = Object.keys(ownerPets || {}).length;
      });

      const arr = Object.keys(ownersVal || {})
        .filter((ownerId) => ownerId !== '__meta')
        .map((ownerId) => ({ ownerId, ...ownersVal[ownerId] }))
        .map((o) => ({
          rowType: 'owner',
          uid: o.uid || null,
          ownerId: o.ownerId,
          firstname: o.firstname || '',
          lastname: o.lastname || '',
          email: o.email || '',
          phone: o.phoneNumber || o.phone || '',
          barangay: o.barangay || '',
          gender: o.gender || '',
          birthday: o.birthday || '',
          createdAt: o.createdAt || 0,
          pets: petCounts[o.ownerId] || 0,
          accountStatus: o.uid ? 'active' : 'inactive',
        }));

      setUsers(arr);
    } catch (e) {
      setUsers([]);
      setError('Could not load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await fetchOwners();
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setError('Could not load users. Please try again.');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchOwners]);

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = users.filter((u) => {
      if (u?.role === 'admin') return false;
      if (barangayFilter && String(u.barangay || '') !== barangayFilter) return false;
      if (!q) return true;
      const name = `${u.firstname || ''} ${u.lastname || ''}`.trim().toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const phone = String(u.phone || '').toLowerCase();
      const barangay = String(u.barangay || '').toLowerCase();
      const gender = String(u.gender || '').toLowerCase();
      const birthday = String(u.birthday || '').toLowerCase();
      const status = String(u.accountStatus || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || barangay.includes(q) || gender.includes(q) || birthday.includes(q) || status.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    const getValue = (u) => {
      if (sortKey === 'name') return `${u.lastname || ''} ${u.firstname || ''}`.toLowerCase();
      if (sortKey === 'email') return String(u.email || '').toLowerCase();
      if (sortKey === 'phone') return String(u.phone || '').toLowerCase();
      if (sortKey === 'barangay') return String(u.barangay || '').toLowerCase();
      if (sortKey === 'gender') return String(u.gender || '').toLowerCase();
      if (sortKey === 'birthday') return String(u.birthday || '').toLowerCase();
      if (sortKey === 'status') return String(u.accountStatus || '').toLowerCase();
      if (sortKey === 'pets') return Number(u.pets || 0);
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
  }, [users, search, barangayFilter, sortKey, sortDir]);

  React.useEffect(() => {
    setPage(1);
  }, [search, barangayFilter, sortKey, sortDir]);

  const uniqueBarangays = React.useMemo(() => {
    const barangays = new Set();
    users.forEach((u) => {
      if (u.barangay) barangays.add(u.barangay);
    });
    return Array.from(barangays).sort();
  }, [users]);

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

  const resetAdd = () => {
    setForm({
      firstname: '',
      lastname: '',
      phone: '',
      email: '',
      barangay: '',
      gender: '',
      birthday: '',
    });
    setFormError('');
    setFormMessage('');
  };

  const loadIntoForm = (u) => {
    setForm({
      firstname: u?.firstname || '',
      lastname: u?.lastname || '',
      phone: u?.phone || '',
      email: u?.email || '',
      barangay: u?.barangay || '',
      gender: u?.gender || '',
      birthday: u?.birthday || '',
    });
    setFormError('');
    setFormMessage('');
  };

  const openAdd = () => {
    resetAdd();
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
  };

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validateOwner = () => {
    if (!form.phone.trim()) return 'Phone no. is required.';
    return '';
  };

  const preRegisterOwner = async () => {
    setFormError('');
    setFormMessage('');

    const msg = validateOwner();
    if (msg) {
      setFormError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const phone = normalizePhone(form.phone);
      if (!phone) throw new Error('Please enter a phone number.');

      const phoneSnap = await get(ref(db, `phoneIndex/${phone}`));
      if (phoneSnap.exists()) throw new Error('This phone number is already registered.');

      const email = normalizeEmail(form.email);
      const eKey = email ? emailKey(email) : '';
      if (email) {
        const emailSnap = await get(ref(db, `emailIndex/${eKey}`));
        if (emailSnap.exists()) throw new Error('This email is already registered.');
      }

      const ownerId = genOwnerId();
      const now = Date.now();
      const payload = {
        ownerId,
        firstname: form.firstname,
        lastname: form.lastname,
        phoneNumber: phone,
        phone,
        email: email || '',
        barangay: form.barangay,
        gender: form.gender,
        birthday: form.birthday,
        hasLoginAccess: false,
        createdAt: now,
      };

      const multi = {};
      multi[`owners/${ownerId}`] = payload;
      multi[`phoneIndex/${phone}`] = ownerId;
      if (email) multi[`emailIndex/${eKey}`] = ownerId;

      await update(ref(db), multi);

      setFormMessage('Owner pre-registered successfully.');
      await fetchOwners();
      await logAuditTrail('create', ownerId, 'owner', null, payload);
    } catch (e) {
      setFormError('Could not create owner. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!selected?.ownerId) return;
    setFormError('');
    setFormMessage('');

    if (!form.phone.trim()) {
      setFormError('Phone no. is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const ownerId = String(selected.ownerId);
      const ownerSnap = await get(ref(db, `owners/${ownerId}`));
      if (!ownerSnap.exists()) throw new Error('Owner not found.');
      const owner = ownerSnap.val() || {};

      const nextPhone = normalizePhone(form.phone);
      if (!nextPhone) throw new Error('Please enter a phone number.');
      const prevPhone = normalizePhone(owner.phoneNumber || owner.phone);
      if (nextPhone !== prevPhone) {
        const phoneSnap = await get(ref(db, `phoneIndex/${nextPhone}`));
        if (phoneSnap.exists() && String(phoneSnap.val() || '') !== ownerId) {
          throw new Error('This phone number is already registered.');
        }
      }

      const nextEmail = normalizeEmail(form.email);
      const prevEmail = normalizeEmail(owner.email);
      const nextEmailKey = nextEmail ? emailKey(nextEmail) : '';
      const prevEmailKey = prevEmail ? emailKey(prevEmail) : '';
      if (nextEmail && nextEmail !== prevEmail) {
        const emailSnap = await get(ref(db, `emailIndex/${nextEmailKey}`));
        if (emailSnap.exists() && String(emailSnap.val() || '') !== ownerId) {
          throw new Error('This email is already registered.');
        }
      }

      const now = Date.now();
      const multi = {};
      multi[`owners/${ownerId}/firstname`] = form.firstname;
      multi[`owners/${ownerId}/lastname`] = form.lastname;
      multi[`owners/${ownerId}/phoneNumber`] = nextPhone;
      multi[`owners/${ownerId}/phone`] = nextPhone;
      multi[`owners/${ownerId}/email`] = nextEmail;
      multi[`owners/${ownerId}/barangay`] = form.barangay;
      multi[`owners/${ownerId}/gender`] = form.gender;
      multi[`owners/${ownerId}/birthday`] = form.birthday;
      multi[`owners/${ownerId}/updatedAt`] = now;

      if (nextPhone !== prevPhone) {
        if (prevPhone) multi[`phoneIndex/${prevPhone}`] = null;
        multi[`phoneIndex/${nextPhone}`] = ownerId;
      }

      if (nextEmail !== prevEmail) {
        if (prevEmailKey) multi[`emailIndex/${prevEmailKey}`] = null;
        if (nextEmailKey) multi[`emailIndex/${nextEmailKey}`] = ownerId;
      }

      await update(ref(db), multi);
      setFormMessage('Saved.');
      await fetchOwners();
      await logAuditTrail('update', ownerId, 'owner', owner, { firstname: form.firstname, lastname: form.lastname, phone: nextPhone, email: nextEmail, barangay: form.barangay, gender: form.gender, birthday: form.birthday });
    } catch (e) {
      setFormError('Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (u) => {
    const ok = window.confirm('Delete this owner? This cannot be undone.');
    if (!ok) return;
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const ownerId = String(u.ownerId || '');
      if (!ownerId) throw new Error('Invalid owner information.');

      const ownerSnap = await get(ref(db, `owners/${ownerId}`));
      if (!ownerSnap.exists()) throw new Error('Owner not found.');
      const owner = ownerSnap.val() || {};

      const multi = {};
      const phone = normalizePhone(owner.phoneNumber || owner.phone);
      if (phone) multi[`phoneIndex/${phone}`] = null;
      const email = normalizeEmail(owner.email);
      if (email) multi[`emailIndex/${emailKey(email)}`] = null;
      if (owner.uid) multi[`ownerUidMap/${owner.uid}`] = null;
      multi[`petsByOwner/${ownerId}`] = null;
      multi[`selectedPetByOwner/${ownerId}`] = null;
      multi[`owners/${ownerId}`] = null;

      await update(ref(db), multi);
      await fetchOwners();
      await logAuditTrail('delete', ownerId, 'owner', owner, null);
    } catch (e) {
      setError('Could not delete. Please try again.');
    }
  };

  const onNewUser = () => {
    openAdd();
  };

  const onView = (u) => {
    setSelected(u);
    setViewOpen(true);
  };
  const onEdit = (u) => {
    setSelected(u);
    loadIntoForm(u);
    setEditOpen(true);
  };
  const onDelete = (u) => doDelete(u);

  return (
    <AdminSidebarLayout title="User Management">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="userSearch">Search</label>
              <input
                id="userSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, barangay"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="barangayFilter">Barangay</label>
              <select
                id="barangayFilter"
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {uniqueBarangays.map((barangay) => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="green" onClick={onNewUser}>New User</Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('name')} className="hover:text-green-700 transition-colors">
                      Name
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('email')} className="hover:text-green-700 transition-colors">
                      Email
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('phone')} className="hover:text-green-700 transition-colors">
                      Phone
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('barangay')} className="hover:text-green-700 transition-colors">
                      Barangay
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('gender')} className="hover:text-green-700 transition-colors">
                      Gender
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('birthday')} className="hover:text-green-700 transition-colors">
                      Birthday
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('pets')} className="hover:text-green-700 transition-colors">
                      No. of Pets
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('status')} className="hover:text-green-700 transition-colors">
                      Status
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    <button type="button" onClick={() => toggleSort('createdAt')} className="hover:text-green-700 transition-colors">
                      Date of Registration
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((u) => {
                    const name = `${u.firstname || ''} ${u.lastname || ''}`.trim() || '—';
                    const canMutate = Boolean(u.ownerId);
                    return (
                      <tr key={u.uid || u.ownerId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">{name}</td>
                        <td className="py-3 px-4">{u.email || '—'}</td>
                        <td className="py-3 px-4">{u.phone || '—'}</td>
                        <td className="py-3 px-4">{u.barangay || '—'}</td>
                        <td className="py-3 px-4">{u.gender || '—'}</td>
                        <td className="py-3 px-4">{u.birthday || '—'}</td>
                        <td className="py-3 px-4">{u.pets ?? 0}</td>
                        <td className="py-3 px-4">{u.accountStatus === 'active' ? 'Active' : 'Inactive'}</td>
                        <td className="py-3 px-4">{fmtDate(u.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="blue" size="sm" onClick={() => onView(u)} disabled={!canMutate}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onEdit(u)} disabled={!canMutate}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(u)} disabled={!canMutate}>
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
        </div>

        {viewOpen && selected ? (
          <Modal open={viewOpen} title="Owner Details" onClose={() => setViewOpen(false)} maxWidthClassName="max-w-lg">
            <div className="text-sm text-muted-foreground mb-4">Status: {selected.accountStatus === 'active' ? 'Active' : 'Inactive'}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">Firstname:</span> {selected.firstname || '—'}</div>
              <div><span className="font-medium">Lastname:</span> {selected.lastname || '—'}</div>
              <div className="md:col-span-2"><span className="font-medium">Email:</span> {selected.email || '—'}</div>
              <div><span className="font-medium">Phone:</span> {selected.phone || '—'}</div>
              <div><span className="font-medium">Barangay:</span> {selected.barangay || '—'}</div>
              <div><span className="font-medium">Gender:</span> {selected.gender || '—'}</div>
              <div><span className="font-medium">Birthday:</span> {selected.birthday || '—'}</div>
              <div><span className="font-medium">Registered:</span> {fmtDate(selected.createdAt)}</div>
              <div><span className="font-medium">Pets:</span> {selected.pets ?? 0}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                Close
              </Button>
              <Button variant="blue" onClick={() => { setViewOpen(false); onEdit(selected); }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => { setViewOpen(false); onDelete(selected); }}>
                Delete
              </Button>
            </div>
          </Modal>
        ) : null}

        {editOpen && selected ? (
          <Modal open={editOpen} title="Edit Owner" onClose={() => setEditOpen(false)} maxWidthClassName="max-w-lg">
            <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
              <div className="space-y-4">
                <div className="text-sm text-slate-500 mb-4">Status: {selected.accountStatus === 'active' ? 'Active' : 'Inactive'}</div>

                {formError ? (
                  <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                ) : null}

                {formMessage ? (
                  <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                    {formMessage}
                  </div>
                ) : null}

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Firstname</label>
                    <input
                      name="firstname"
                      value={form.firstname}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Lastname</label>
                    <input
                      name="lastname"
                      value={form.lastname}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Email (optional)</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Phone no.</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Barangay</label>
                    <select
                      name="barangay"
                      value={form.barangay}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Poblacion 1">Poblacion 1</option>
                      <option value="Poblacion 2">Poblacion 2</option>
                      <option value="Poblacion 3">Poblacion 3</option>
                      <option value="Poblacion 4">Poblacion 4</option>
                      <option value="Poblacion 5">Poblacion 5</option>
                      <option value="Poblacion 6">Poblacion 6</option>
                      <option value="Poblacion 7">Poblacion 7</option>
                      <option value="Poblacion 8">Poblacion 8</option>
                      <option value="Balansay">Balansay</option>
                      <option value="Fatima">Fatima</option>
                      <option value="Payompon">Payompon</option>
                      <option value="San Luis">San Luis</option>
                      <option value="Talabaan">Talabaan</option>
                      <option value="Tangkalan">Tangkalan</option>
                      <option value="Tayamaan">Tayamaan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Birthday</label>
                    <input
                      name="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="green"
                    onClick={saveEdit}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        ) : null}

        {addOpen ? (
          <Modal open={addOpen} title="Add New Owner" onClose={closeAdd} maxWidthClassName="max-w-lg">
            <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
              <div className="space-y-4">
                <div className="text-sm text-slate-500 mb-4">
                  Pre-register an owner using phone number. No login account is created.
                </div>

                {formError ? (
                  <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                ) : null}

                {formMessage ? (
                  <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                    {formMessage}
                  </div>
                ) : null}

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Firstname</label>
                    <input
                      name="firstname"
                      value={form.firstname}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Lastname</label>
                    <input
                      name="lastname"
                      value={form.lastname}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Email (optional)</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Phone no.</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Barangay</label>
                    <select
                      name="barangay"
                      value={form.barangay}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Poblacion 1">Poblacion 1</option>
                      <option value="Poblacion 2">Poblacion 2</option>
                      <option value="Poblacion 3">Poblacion 3</option>
                      <option value="Poblacion 4">Poblacion 4</option>
                      <option value="Poblacion 5">Poblacion 5</option>
                      <option value="Poblacion 6">Poblacion 6</option>
                      <option value="Poblacion 7">Poblacion 7</option>
                      <option value="Poblacion 8">Poblacion 8</option>
                      <option value="Balansay">Balansay</option>
                      <option value="Fatima">Fatima</option>
                      <option value="Payompon">Payompon</option>
                      <option value="San Luis">San Luis</option>
                      <option value="Talabaan">Talabaan</option>
                      <option value="Tangkalan">Tangkalan</option>
                      <option value="Tayamaan">Tayamaan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Birthday</label>
                    <input
                      name="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={onChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={closeAdd}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="green"
                    onClick={preRegisterOwner}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Pre-register Owner'}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        ) : null}

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
