import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      setRole('');
      setRoleLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        if (active) setRoleLoading(true);
        const tokenRes = await user.getIdTokenResult(true);
        const isAdmin = tokenRes?.claims?.admin === true;
        if (!active) return;
        setIsAdmin(isAdmin);
        setRole(isAdmin ? 'admin' : '');
        setRoleLoading(false);
      } catch {
        if (!active) return;
        setIsAdmin(false);
        setRole('');
        setRoleLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading]);

  const value = useMemo(() => {
    return {
      user,
      loading,
      roleLoading,
      isAdmin,
      role,
      logout: () => signOut(auth),
    };
  }, [user, loading, roleLoading, isAdmin, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
