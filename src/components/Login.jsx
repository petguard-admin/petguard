import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

import { auth } from '../auth';
import { Button } from './ui/Button';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetting, setResetting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    // Check if account is locked
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
      setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }

    // Reset lockout if time has passed
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      setAttempts(0);
      setLockoutUntil(null);
    }

    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Check database role instead of Firebase Auth custom claims
      const db = getDatabase();
      const userRef = ref(db, `users/${cred.user.uid}`);
      const userSnap = await get(userRef);
      
      let isAdmin = false;
      if (userSnap.exists()) {
        const userData = userSnap.val();
        isAdmin = userData.role === 'admin';
      }
      
      navigate(isAdmin ? '/admin' : '/');
      // Reset attempts on successful login
      setAttempts(0);
      setLockoutUntil(null);
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Lock account after 5 failed attempts for 15 minutes
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 15 * 60 * 1000);
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
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
      setError('Unable to send password reset email. Please try again later.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src="/img/OMV_logo.png" alt="PetGuard" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-slate-900">
              Pet<span className="text-green-700">Guard</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Sign in to your account to continue</p>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs sm:text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={resetting || submitting}
                className="text-xs sm:text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
              >
                {resetting ? 'Sending...' : 'Forgot password?'}
              </button>
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
                  Signing in...
                </span>
              ) : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-500 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
