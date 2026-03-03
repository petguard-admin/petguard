import React from 'react';
import { Navigate } from 'react-router-dom';

import { getDatabase, onValue, ref } from 'firebase/database';

import app from '../firebaseConfig';
import { useAuth } from '../AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  const [isVet, setIsVet] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      setIsVet(false);
      return;
    }

    const db = getDatabase(app);
    const roleRef = ref(db, `users/${user.uid}/role`);

    const unsub = onValue(roleRef, (snap) => {
      const role = snap.exists() ? snap.val() : '';
      setIsVet(role === 'vet');
      setChecking(false);
    });

    return () => unsub();
  }, [user, loading]);

  if (loading || checking) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isVet) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
