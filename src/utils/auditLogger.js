import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';
import { auth } from '../auth';
import app from '../firebaseConfig';

export const logAuditTrail = async (actionType, targetRecordId, targetRecordType, beforeValues = null, afterValues = null) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase(app);
    const auditRef = ref(db, 'auditTrail');

    await push(auditRef, {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userRole: 'admin', // You may need to fetch the actual role from Firebase
      actionType,
      targetRecordId,
      targetRecordType,
      beforeValues,
      afterValues,
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
};
