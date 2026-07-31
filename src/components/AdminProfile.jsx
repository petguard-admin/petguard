import React from 'react';

import { sendPasswordResetEmail } from 'firebase/auth';
import { getDatabase, get, ref, update } from 'firebase/database';

import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';
import { auth } from '../auth';
import app from '../firebaseConfig';
import AdminSidebarLayout from './AdminSidebarLayout';
import { logAuditTrail } from '../utils/auditLogger';

const AdminProfile = () => {
  const { user, loading } = useAuth();

  const [profile, setProfile] = React.useState(null);
  const [form, setForm] = React.useState({ firstname: '', lastname: '', phone: '' });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;

    let active = true;
    (async () => {
      try {
        const db = getDatabase(app);
        const snap = await get(ref(db, `users/${user.uid}`));
        const data = snap.exists() ? snap.val() : null;
        if (!active) return;
        setProfile(data);
        const val = data || {};
        setForm({
          firstname: val.firstname || '',
          lastname: val.lastname || '',
          phone: val.phone || '',
        });
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load profile.');
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setError('');
    setMessage('');

    setSaving(true);
    try {
      const db = getDatabase(app);
      await update(ref(db, `users/${user.uid}`), {
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
        updatedAt: Date.now(),
      });
      setMessage('Profile updated.');
      await logAuditTrail('update', user.uid, 'admin_profile', profile, form);
    } catch (err) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage('Password reset email sent.');
    } catch (err) {
      setError(err?.message || 'Failed to send reset link.');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">Please login to view your profile.</div>;
  }

  return (
    <AdminSidebarLayout title="Profile">
      <div className="max-w-2xl">
        {error ? (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
            {message}
          </div>
        ) : null}

        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Role:</span> {profile?.role || 'admin'}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Firstname</label>
            <input
              name="firstname"
              value={form.firstname}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Lastname</label>
            <input
              name="lastname"
              value={form.lastname}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Phone no.</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={resetPassword}
            className="rounded-xl"
          >
            Reset Password
          </Button>
          <Button
            onClick={saveProfile}
            disabled={saving}
            variant="green"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminProfile;
