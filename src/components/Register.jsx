import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';
import { Button } from './ui/Button';
import { logAuditTrail } from '../utils/auditLogger';

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    lastname: '',
    firstname: '',
    email: '',
    phone: '',
    barangay: '',
    gender: '',
    birthday: '',
    password: '',
    confirmPassword: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.lastname.trim()) return 'Lastname is required.';
    if (!form.firstname.trim()) return 'Firstname is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.phone.trim()) return 'Phone no. is required.';
    if (!form.barangay.trim()) return 'Barangay is required.';
    if (!form.gender.trim()) return 'Gender is required.';
    if (!form.birthday.trim()) return 'Birthday is required.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const email = form.email.trim().toLowerCase();

      // Register user with authService
      await authService.register(form.email, form.password, {
        firstname: form.firstname,
        lastname: form.lastname,
      });

      // Link owner profile
      await authService.linkOwnerByPhone({
        email,
        phoneNumber: form.phone,
        firstname: form.firstname,
        lastname: form.lastname,
        barangay: form.barangay,
        gender: form.gender,
        birthday: form.birthday,
      });

      navigate('/');
      await logAuditTrail('create', email, 'owner', null, { email, firstname: form.firstname, lastname: form.lastname, phone: form.phone, barangay: form.barangay, gender: form.gender, birthday: form.birthday });
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Register your pet owner profile.</p>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="firstname">Firstname</label>
              <input
                id="firstname"
                name="firstname"
                value={form.firstname}
                onChange={onChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                autoComplete="given-name"
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
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="email"
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
              autoComplete="tel"
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
              autoComplete="address-level3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="gender">Gender</label>
            <select
              id="gender"
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
            <label className="block text-sm font-medium mb-1" htmlFor="birthday">Birthday</label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="bday"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
