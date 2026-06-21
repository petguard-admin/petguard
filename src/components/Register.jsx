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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-10">
      <div className="w-full max-w-md bg-white text-card-foreground rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="src/img/OMV_logo.png" alt="OMV Logo" className="h-20 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-600 mt-2">Register your pet owner profile</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="firstname">Firstname</label>
              <input
                id="firstname"
                name="firstname"
                value={form.firstname}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoComplete="given-name"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="lastname">Lastname</label>
              <input
                id="lastname"
                name="lastname"
                value={form.lastname}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoComplete="family-name"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="email"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="phone">Phone no.</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="tel"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="barangay">Barangay</label>
            <select
              id="barangay"
              name="barangay"
              value={form.barangay}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="address-level3"
            >
              <option value="">Select barangay</option>
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
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="birthday">Birthday</label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="bday"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="new-password"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="new-password"
              placeholder="Confirm your password"
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Already have an account? <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
