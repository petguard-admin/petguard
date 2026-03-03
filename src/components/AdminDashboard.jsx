import React from 'react';

import { getDatabase, onValue, ref } from 'firebase/database';

import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [totalPets, setTotalPets] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [addOpen, setAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [form, setForm] = React.useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    barangay: '',
    gender: '',
    birthday: '',
  });
  const [choice, setChoice] = React.useState('A');
  const [emailState, setEmailState] = React.useState(null);

  React.useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load stats.');
        setTotalUsers(data.totalUsers);
        setTotalPets(data.totalPets);
        setLoading(false);
      } catch (e) {
        setError(e?.message || 'Failed to load stats.');
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const resetAdd = () => {
    setForm({ firstname: '', lastname: '', email: '', phone: '', barangay: '', gender: '', birthday: '' });
    setChoice('A');
    setEmailState(null);
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
    if (!form.firstname.trim()) return 'Firstname is required.';
    if (!form.lastname.trim()) return 'Lastname is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.phone.trim()) return 'Phone no. is required.';
    if (!form.barangay.trim()) return 'Barangay is required.';
    if (!form.gender.trim()) return 'Gender is required.';
    if (!form.birthday.trim()) return 'Birthday is required.';
    return '';
  };

  const authedFetch = async (path, body) => {
    if (!user) throw new Error('Not logged in.');
    const token = await user.getIdToken();
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Request failed.');
    }
    return data;
  };

  const checkEmail = async () => {
    setFormError('');
    setFormMessage('');
    setEmailState(null);

    const msg = validateOwner();
    if (msg) {
      setFormError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const data = await authedFetch('/api/admin/owners/check-email', { email: form.email });
      setEmailState(data);

      if (data.existsInAuth) {
        setFormError('An account with this email already exists.');
      } else if (data.existsInDb) {
        setFormMessage('Owner exists in DB without login access. You can activate the account.');
      } else {
        setFormMessage('Email is available. Choose an option and create owner.');
      }
    } catch (e) {
      setFormError(e?.message || 'Failed to check email.');
    } finally {
      setSubmitting(false);
    }
  };

  const createOwner = async () => {
    setFormError('');
    setFormMessage('');

    const msg = validateOwner();
    if (msg) {
      setFormError(msg);
      return;
    }

    if (!emailState) {
      setFormError('Please check email first.');
      return;
    }

    if (emailState.existsInAuth) {
      setFormError('An account with this email already exists.');
      return;
    }

    if (emailState.existsInDb) {
      setFormError('Owner exists in DB without login access. Activate instead.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await authedFetch('/api/admin/owners/create', {
        option: choice,
        owner: {
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          phone: form.phone,
          barangay: form.barangay,
          gender: form.gender,
          birthday: form.birthday,
        },
      });

      if (data?.passwordSetupLink) {
        setFormMessage('Owner created. Password setup link generated (shown once).');
        window.prompt('Password setup link (copy):', data.passwordSetupLink);
      } else {
        setFormMessage('Owner created (DB only).');
      }
    } catch (e) {
      setFormError(e?.message || 'Failed to create owner.');
    } finally {
      setSubmitting(false);
    }
  };

  const activateOwner = async () => {
    setFormError('');
    setFormMessage('');

    if (!emailState?.existsInDb || emailState?.existsInAuth) {
      setFormError('Activation is only for DB-only owners with no Auth account yet.');
      return;
    }

    const ok = window.confirm('Activate this owner account and send password setup email?');
    if (!ok) return;

    setSubmitting(true);
    try {
      const data = await authedFetch('/api/admin/owners/activate', { email: form.email });
      setFormMessage('Activation started. Password setup link generated (shown once).');
      window.prompt('Password setup link (copy):', data.passwordSetupLink);
    } catch (e) {
      setFormError(e?.message || 'Failed to activate owner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminSidebarLayout title="Dashboard">
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {role !== 'vet' ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Vet role required to add new owners.
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-end">
        <Button onClick={openAdd} disabled={role !== 'vet'}>
          Add New Owner
        </Button>
      </div>

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

      {addOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" onClick={closeAdd} className="absolute inset-0 bg-black/40" aria-label="Close" />
          <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-semibold">Add New Owner</div>
                <div className="text-sm text-muted-foreground">
                  Check email first, then create (A/B) or activate if DB-only.
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={closeAdd}>
                Close
              </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerFirstname">Firstname</label>
                <input
                  id="ownerFirstname"
                  name="firstname"
                  value={form.firstname}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerLastname">Lastname</label>
                <input
                  id="ownerLastname"
                  name="lastname"
                  value={form.lastname}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="ownerEmail">Email</label>
                <input
                  id="ownerEmail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerPhone">Phone no.</label>
                <input
                  id="ownerPhone"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerBarangay">Barangay</label>
                <input
                  id="ownerBarangay"
                  name="barangay"
                  value={form.barangay}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerGender">Gender</label>
                <select
                  id="ownerGender"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="ownerBirthday">Birthday</label>
                <input
                  id="ownerBirthday"
                  name="birthday"
                  type="date"
                  value={form.birthday}
                  onChange={onChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-sm font-semibold mb-2">Create options</div>
              <div className="space-y-2 text-sm">
                <label className="flex items-start gap-2">
                  <input type="radio" name="createOption" value="A" checked={choice === 'A'} onChange={() => setChoice('A')} />
                  <span>
                    <span className="font-medium">Option A</span> – Create with login access (Auth user + password setup email)
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="radio" name="createOption" value="B" checked={choice === 'B'} onChange={() => setChoice('B')} />
                  <span>
                    <span className="font-medium">Option B</span> – Create without login access (DB only)
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={checkEmail} disabled={submitting}>
                {submitting ? 'Checking...' : 'Check Email'}
              </Button>
              <Button onClick={createOwner} disabled={submitting || emailState?.existsInAuth || emailState?.existsInDb}>
                Create Owner
              </Button>
              <Button variant="secondary" onClick={activateOwner} disabled={submitting || !emailState?.existsInDb || emailState?.existsInAuth}>
                Activate Account
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSidebarLayout>
  );
};

export default AdminDashboard;
