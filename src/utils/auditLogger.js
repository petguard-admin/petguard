import { getDatabase, ref, push, serverTimestamp, get } from 'firebase/database';
import { auth } from '../auth';
import app from '../firebaseConfig';

export const logAuditTrail = async (actionType, targetRecordId, targetRecordType, beforeValues = null, afterValues = null) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase(app);
    const auditRef = ref(db, 'auditTrail');

    // Get user role from database
    const userSnap = await get(ref(db, `users/${user.uid}`));
    const role = userSnap.exists() ? userSnap.val().role : '';

    await push(auditRef, {
      timestamp: serverTimestamp(),
      performedBy: user.uid,
      role: role,
      action: actionType,
      targetId: targetRecordId,
      targetType: targetRecordType,
      beforeValues,
      afterValues,
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
};
