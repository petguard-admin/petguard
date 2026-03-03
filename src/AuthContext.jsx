import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, onValue, ref } from 'firebase/database';

import app from './firebaseConfig';
import { auth } from './auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      return;
    }

    const db = getDatabase(app);
    const roleRef = ref(db, `users/${user.uid}/role`);
    const unsub = onValue(roleRef, (snap) => {
      const role = snap.exists() ? snap.val() : '';
      setIsAdmin(role === 'admin');
    });

    return () => unsub();
  }, [user, loading]);

  const value = useMemo(() => {
    return {
      user,
      loading,
      isAdmin,
      logout: () => signOut(auth),
    };
  }, [user, loading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
