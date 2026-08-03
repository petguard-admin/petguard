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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Invalid email format.';
    if (!form.phone.trim()) return 'Phone no. is required.';
    if (!form.barangay.trim()) return 'Barangay is required.';
    if (!form.gender.trim()) return 'Gender is required.';
    if (!form.birthday.trim()) return 'Birthday is required.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(form.password)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(form.password)) return 'Password must contain at least one number.';
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

      await authService.register(form.email, form.password, {
        firstname: form.firstname,
        lastname: form.lastname,
      });

      await authService.bootstrapProfile({
        email: form.email,
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
        barangay: form.barangay,
        gender: form.gender,
        birthday: form.birthday,
      });

      navigate('/');
      await logAuditTrail('create', email, 'owner', null, { email, firstname: form.firstname, lastname: form.lastname, phone: form.phone, barangay: form.barangay, gender: form.gender, birthday: form.birthday });
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in with your existing account.');
      } else {
        setError(err?.message || 'Registration failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-950 px-3 py-4 sm:px-4 sm:py-6 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <img src="/img/OMV_logo.png" alt="PetGuard" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-slate-900">
              Pet<span className="text-green-700">Guard</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Register your pet owner profile to get started</p>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="firstname">
                  First name
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  value={form.firstname}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="given-name"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="lastname">
                  Last name
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  value={form.lastname}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="family-name"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                autoComplete="tel"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Barangay & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="barangay">
                  Barangay
                </label>
                <select
                  id="barangay"
                  name="barangay"
                  value={form.barangay}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all appearance-none"
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
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all appearance-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="birthday">
                Birthday
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                autoComplete="bday"
              />
            </div>

            {/* Password fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="green"
              className="w-full text-xs sm:text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
