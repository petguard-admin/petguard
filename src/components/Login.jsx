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
      navigate(isAdmin ? '/admin' : '/select-pet');
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
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to continue.</p>

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

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={resetting || submitting}
            className="w-full text-sm underline text-muted-foreground disabled:opacity-60"
          >
            {resetting ? 'Sending reset email...' : 'Forgot password?'}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Don’t have an account? <Link to="/register" className="underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
