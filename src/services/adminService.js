import { database } from './firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';
import { authService } from './authService';
import { auth } from '../auth';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (phone) => String(phone || '').replace(/\s+/g, '').trim();
const emailKey = (email) => {
  try {
    return btoa(unescape(encodeURIComponent(normalizeEmail(email))));
  } catch {
    return '';
  }
};

export const adminService = {
  async verifyAdmin() {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    return true;
  },

  async getStats() {
    await this.verifyAdmin();
    
    const ownersSnap = await get(ref(database, 'owners'));
    const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
    const keys = Object.keys(ownersVal || {}).filter((k) => k !== '__meta');
    const totalUsers = keys.length;

    const petsSnap = await get(ref(database, 'petsByOwner'));
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};
    let totalPets = 0;
    Object.values(petsVal).forEach((ownerPets) => {
      if (!ownerPets) return;
      Object.values(ownerPets).forEach((pet) => {
        if (pet && typeof pet === 'object') totalPets += 1;
      });
    });

    return { totalUsers, totalPets };
  },

  async getAdmins() {
    await this.verifyAdmin();

    const usersSnap = await get(ref(database, 'users'));
    const val = usersSnap.exists() ? usersSnap.val() : {};

    const admins = Object.keys(val || {})
      .filter((uid) => uid !== '__meta')
      .map((uid) => ({ uid, ...val[uid] }))
      .filter((u) => u?.role === 'admin')
      .map((u) => ({
        uid: u.uid,
        firstname: u.firstname || '',
        lastname: u.lastname || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || '',
        createdAt: u.createdAt || 0
      }));

    return { admins };
  },

  async searchUsers(query) {
    await this.verifyAdmin();

    const [usersSnap, mapSnap, ownersSnap] = await Promise.all([
      get(ref(database, 'users')),
      get(ref(database, 'ownerUidMap')),
      get(ref(database, 'owners')),
    ]);

    const usersVal = usersSnap.exists() ? usersSnap.val() : {};
    const mapVal = mapSnap.exists() ? mapSnap.val() : {};
    const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};

    const uidToOwnerId = {};
    Object.keys(mapVal || {}).forEach((uid) => {
      if (uid !== '__meta') uidToOwnerId[uid] = mapVal[uid];
    });

    const ownerIdsFromUsers = new Set(Object.values(uidToOwnerId));

    const results = [];
    const seen = new Set();

    Object.keys(ownersVal || {}).forEach((ownerId) => {
      if (ownerId === '__meta') return;
      const owner = ownersVal[ownerId] || {};
      const uid = owner.uid || '';

      const entry = {
        uid,
        ownerId,
        firstname: owner.firstname || '',
        lastname: owner.lastname || '',
        email: owner.email || '',
        phone: owner.phoneNumber || owner.phone || '',
        role: uid && usersVal[uid] ? (usersVal[uid].role || 'owner') : 'owner',
        hasLoginAccess: owner.hasLoginAccess || false,
      };

      results.push(entry);
      if (uid) seen.add(uid);
    });

    Object.keys(usersVal || {}).forEach((uid) => {
      if (uid === '__meta' || seen.has(uid)) return;
      const user = usersVal[uid] || {};
      results.push({
        uid,
        ownerId: uidToOwnerId[uid] || '',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        hasLoginAccess: true,
      });
    });

    const searchTerm = String(query || '').trim().toLowerCase();
    const filtered = searchTerm
      ? results.filter((u) => {
          const name = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase();
          const email = String(u.email || '').toLowerCase();
          const phone = String(u.phone || '').toLowerCase();
          return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
        })
      : results;

    return { users: filtered };
  },

  async createAdmin(adminProfile) {
    await this.verifyAdmin();
    
    const { firstname, lastname, email, phone } = adminProfile;
    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);
    const eKey = emailKey(normEmail);

    // Check if email exists
    const emailSnap = await get(ref(database, `emailIndex/${eKey}`));
    if (emailSnap.exists()) {
      throw new Error('Email already exists');
    }

    // Note: Admin must be created manually in Firebase Console or via signup
    // This function only creates the database record after the user exists in Auth
    throw new Error('Please create the user account in Firebase Console first, then use promoteToAdmin');
  },

  async promoteToAdmin(uid, ownerId) {
    await this.verifyAdmin();

    let userSnap = await get(ref(database, `users/${uid}`));
    let beforeRole = 'owner';

    if (!userSnap.exists() && ownerId) {
      const ownerSnap = await get(ref(database, `owners/${ownerId}`));
      if (!ownerSnap.exists()) {
        throw new Error('Owner not found in database.');
      }
      const owner = ownerSnap.val();
      if (!owner.uid) {
        throw new Error('This owner has not signed up yet. They must create an account first before being promoted.');
      }
      await set(ref(database, `users/${owner.uid}`), { role: 'owner', email: owner.email || '', createdAt: Date.now() });
      userSnap = await get(ref(database, `users/${owner.uid}`));
    }

    if (!userSnap.exists()) {
      throw new Error('User not found in database. User must sign up first.');
    }

    const user = userSnap.val();
    const targetUid = uid || userSnap.key;

    await update(ref(database, `users/${targetUid}`), {
      role: 'admin',
      promotedBy: auth.currentUser.uid,
      promotedAt: Date.now()
    });

    const auditRef = ref(database, 'auditTrail');
    const newAuditRef = push(auditRef);
    await set(newAuditRef, {
      action: 'promote_to_admin',
      targetId: targetUid,
      targetType: 'user',
      performedBy: auth.currentUser.uid,
      beforeValues: { role: user.role || beforeRole },
      afterValues: { role: 'admin' },
      timestamp: Date.now()
    });

    return { ok: true, message: 'User promoted to admin successfully' };
  },

  async inviteAdmin(adminProfile) {
    // Firebase-only approach: provide instructions for manual setup
    const { email } = adminProfile;
    return {
      ok: true,
      message: `To add admin ${email}: 1) Have them sign up at the app, 2) Then use "Promote to Admin" feature`,
      requiresManualSetup: true
    };
  },

  async deleteAdmin(uid) {
    await this.verifyAdmin();
    
    if (uid === auth.currentUser.uid) {
      throw new Error('Cannot delete yourself');
    }

    const userSnap = await get(ref(database, `users/${uid}`));
    if (!userSnap.exists()) {
      throw new Error('Admin not found');
    }

    const user = userSnap.val();
    if (user.role !== 'admin') {
      throw new Error('User is not an admin');
    }

    // Note: Cannot delete from Firebase Auth client-side
    // This only removes admin role and database record
    await update(ref(database, `users/${uid}`), {
      role: 'user',
      demotedBy: auth.currentUser.uid,
      demotedAt: Date.now()
    });

    // Log audit
    const auditRef = ref(database, 'auditTrail');
    const newAuditRef = push(auditRef);
    await set(newAuditRef, {
      action: 'demote_admin',
      targetId: uid,
      targetType: 'user',
      performedBy: auth.currentUser.uid,
      beforeValues: { role: 'admin' },
      afterValues: { role: 'user' },
      timestamp: Date.now()
    });

    return { ok: true, message: 'Admin demoted to user. Note: Auth account still exists - delete manually in Firebase Console if needed' };
  },

  async sendPasswordResetToUser(email) {
    await this.verifyAdmin();
    
    const { sendPasswordResetEmail } = await import('firebase/auth');
    
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  },

  async checkEmailExists(email) {
    await this.verifyAdmin();
    
    const key = emailKey(email);
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    
    return {
      existsInDatabase: idxSnap.exists(),
      existsInAuth: false // Client SDK cannot check auth users
    };
  },

  async activateOwner(ownerId, email) {
    await this.verifyAdmin();
    
    const normEmail = normalizeEmail(email);
    if (!normEmail) throw new Error('Email is required.');
    
    const key = emailKey(normEmail);
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    
    if (idxSnap.exists()) {
      throw new Error('Email already exists.');
    }
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) {
      throw new Error('Owner not found in DB.');
    }
    
    const owner = ownerSnap.val();
    
    await update(ref(database, `owners/${ownerId}`), {
      email: normEmail,
      accountStatus: 'pending',
      activatedBy: 'admin',
      activatedAt: Date.now()
    });
    
    await set(ref(database, `emailIndex/${key}`), ownerId);
    
    return { 
      ok: true, 
      note: 'Owner database record updated. Auth account must be created separately.' 
    };
  },

  async resetOwnerPassword(ownerId) {
    await this.verifyAdmin();
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) throw new Error('Owner not found.');
    
    const owner = ownerSnap.val();
    if (!owner.email) throw new Error('Owner has no email.');
    if (!owner.uid) throw new Error('Owner has no linked account.');
    
    const { sendPasswordResetEmail } = await import('firebase/auth');
    
    await sendPasswordResetEmail(auth, owner.email);
    return { ok: true };
  }
};

export default adminService;
