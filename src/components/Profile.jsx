import React from 'react';

import { getDatabase, onValue, ref, remove, update } from 'firebase/database';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';

import app from '../firebaseConfig';
import { auth } from '../auth';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';
import OwnerSidebarLayout from './OwnerSidebarLayout';

const Profile = () => {
  const { user, logout, loading } = useAuth();

  const [profile, setProfile] = React.useState(null);
  const [form, setForm] = React.useState({ firstname: '', lastname: '', phone: '', barangay: '' });
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;

    const db = getDatabase(app);
    const userRef = ref(db, `users/${user.uid}`);
    const unsub = onValue(userRef, (snap) => {
      if (!snap.exists()) {
        setProfile(null);
        return;
      }
      const val = snap.val();
      setProfile(val);
      setForm({
        firstname: val.firstname || '',
        lastname: val.lastname || '',
        phone: val.phone || '',
        barangay: val.barangay || '',
      });
    });

    return () => unsub();
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
        barangay: form.barangay,
        updatedAt: Date.now(),
      });
      setMessage('Profile updated.');
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
      setMessage('Password reset link sent to your email.');
    } catch (err) {
      setError(err?.message || 'Failed to send reset link.');
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    const ok = window.confirm('Delete your account? This will remove your profile and sign you out.');
    if (!ok) return;

    setError('');
    setMessage('');
    setDeleting(true);

    try {
      const db = getDatabase(app);
      await remove(ref(db, `users/${user.uid}`));

      // Best-effort: deleting auth user may require recent login.
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4">Please login to view your profile.</p>
        <Button asChild>
          <a href="/login">Go to Login</a>
        </Button>
      </div>
    );
  }

  return (
    <OwnerSidebarLayout title="Profile">
      <div className="max-w-2xl bg-card rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
            {message}
          </div>
        ) : null}

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Name:</span> {user.displayName || '—'}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstname">Firstname</label>
            <input
              id="firstname"
              name="firstname"
              value={form.firstname}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastname">Lastname</label>
            <input
              id="lastname"
              name="lastname"
              value={form.lastname}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone no.</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="barangay">Barangay</label>
            <input
              id="barangay"
              name="barangay"
              value={form.barangay}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button variant="outline" onClick={resetPassword}>
            Reset password (email link)
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
          <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </div>
    </OwnerSidebarLayout>
  );
};

export default Profile;
