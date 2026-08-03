import React from 'react';

import { sendPasswordResetEmail } from 'firebase/auth';
import { getDatabase, get, ref, remove, update } from 'firebase/database';

import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';
import { auth } from '../auth';
import app from '../firebaseConfig';
import OwnerSidebarLayout from './OwnerSidebarLayout';
import { logAuditTrail } from '../utils/auditLogger';

const Profile = () => {
  const { user, logout, loading } = useAuth();

  const [profile, setProfile] = React.useState(null);
  const [form, setForm] = React.useState({ firstname: '', lastname: '', phone: '', barangay: '', gender: '', birthday: '' });
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const getOwnerId = React.useCallback(async () => {
    if (!user) throw new Error('Please log in to continue.');
    const db = getDatabase(app);
    const mapSnap = await get(ref(db, `ownerUidMap/${user.uid}`));
    if (!mapSnap.exists()) throw new Error('Account not found. Please contact support.');
    return String(mapSnap.val() || '');
  }, [user]);

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;

    let active = true;
    (async () => {
      try {
        const db = getDatabase(app);
        const ownerId = await getOwnerId();
        const snap = await get(ref(db, `owners/${ownerId}`));
        const data = snap.exists() ? snap.val() : null;
        if (!active) return;
        setProfile(data);
        const val = data || {};
        setForm({
          firstname: val.firstname || '',
          lastname: val.lastname || '',
          phone: val.phone || val.phoneNumber || '',
          barangay: val.barangay || '',
          gender: val.gender || '',
          birthday: val.birthday || '',
        });
      } catch (e) {
        if (!active) return;
        setError('Unable to load your profile. Please try again.');
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading, getOwnerId]);

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
      const ownerId = await getOwnerId();
      await update(ref(db, `owners/${ownerId}`), {
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
        phoneNumber: form.phone,
        barangay: form.barangay,
        gender: form.gender,
        birthday: form.birthday,
        updatedAt: Date.now(),
      });
      setMessage('Profile updated.');
      await logAuditTrail('update', ownerId, 'owner_profile', profile, form);
    } catch (err) {
      setError('Unable to update your profile. Please try again.');
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
      setError('Could not send reset link. Please try again.');
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
      const ownerId = await getOwnerId();
      await remove(ref(db, `ownerUidMap/${user.uid}`));
      await remove(ref(db, `owners/${ownerId}`));
      await remove(ref(db, `petsByOwner/${ownerId}`));
      await remove(ref(db, `selectedPetByOwner/${ownerId}`));
      await logout();
      await logAuditTrail('delete', ownerId, 'owner_account', profile, null);
    } catch (err) {
      setError('Could not delete account. Please try again.');
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
      <div className="max-w-2xl">
        {error ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-3 rounded-lg border border-border bg-muted px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
            {message}
          </div>
        ) : null}

        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Name:</span> {profile ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || '—' : '—'}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Firstname</label>
            <input
              name="firstname"
              value={form.firstname}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Lastname</label>
            <input
              name="lastname"
              value={form.lastname}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Phone no.</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Barangay</label>
            <select
              name="barangay"
              value={form.barangay}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs text-slate-500 mb-1">Birthday</label>
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={resetPassword}
            className="text-xs sm:text-sm"
          >
            Reset password
          </Button>
          <Button
            variant="green"
            onClick={saveProfile}
            disabled={saving}
            className="text-xs sm:text-sm"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={logout} className="text-xs sm:text-sm">
            Logout
          </Button>
          <Button variant="destructive" onClick={deleteAccount} disabled={deleting} className="text-xs sm:text-sm">
            {deleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </div>
    </OwnerSidebarLayout>
  );
};

export default Profile;
