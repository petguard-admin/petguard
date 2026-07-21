import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../auth';
import { Button } from './ui/Button';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetting, setResetting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenRes = await cred.user.getIdTokenResult(true);
      const isAdmin = tokenRes?.claims?.admin === true;
      navigate(isAdmin ? '/admin' : '/');
    } catch (err) {
      setError(err?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Enter your email above, then click "Forgot password".');
      return;
    }

    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err?.message || 'Failed to send password reset email.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7faf7]">
      {/* Left Panel - Branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDJ2Mmgydi0yaDJ2LTJoLTJ2LTJ6TTIyIDE4aC0ydjJoMnYtMnptMTItMTJoLTJ2MmgyVjZ6TTM0IDM4aDJ2NkgzNFYzOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <img
            src="/src/img/hero-pet.png"
            alt="Happy pets"
            className="w-72 h-72 object-contain mb-8 drop-shadow-2xl"
          />
          <h2 className="text-3xl font-bold text-white text-center leading-tight">
            Your pet's health,<br />simplified.
          </h2>
          <p className="text-green-100 text-center mt-3 max-w-sm text-base">
            Track vaccinations, medical records, and keep your furry friends safe with PetGuard.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 mb-6">
              <img src="/src/img/OMV_logo.png" alt="PetGuard" className="w-11 h-11 rounded-xl" />
              <span className="text-2xl font-bold text-slate-900">
                Pet<span className="text-green-700">Guard</span>
              </span>
            </Link>
          </div>

          {/* Desktop logo */}
          <div className="hidden lg:flex items-center gap-2.5 mb-8">
            <img src="/src/img/OMV_logo.png" alt="PetGuard" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold text-slate-900">
              Pet<span className="text-green-700">Guard</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-[1.7rem] font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1.5 text-sm">Sign in to your account to continue</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={resetting || submitting}
                  className="text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
                >
                  {resetting ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-green-600/20 hover:shadow-md hover:shadow-green-600/30"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
