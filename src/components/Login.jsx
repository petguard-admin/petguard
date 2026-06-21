import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../auth';
import { Button } from './ui/Button';
import { logAuditTrail } from '../utils/auditLogger';

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
      await logAuditTrail('view', cred.user.uid, isAdmin ? 'admin' : 'owner', null, { email });
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
      await logAuditTrail('view', email, 'password_reset', null, { email });
    } catch (err) {
      setError(err?.message || 'Failed to send password reset email.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-10">
      <div className="w-full max-w-md bg-white text-card-foreground rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="src/img/OMV_logo.png" alt="OMV Logo" className="h-20 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600 mt-2">Sign in to continue</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {message}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="email"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={resetting || submitting}
            className="w-full text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-60"
          >
            {resetting ? 'Sending reset email...' : 'Forgot password?'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Don't have an account? <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
