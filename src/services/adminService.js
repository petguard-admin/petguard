import { database } from './firebase';
import { ref, get, set, update, remove } from 'firebase/database';
import { authService } from './authService';

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

  async createAdmin(adminProfile) {
    await this.verifyAdmin();
    
    const { firstname, lastname, email, phone } = adminProfile;
    const normEmail = normalizeEmail(email);
    
    if (!String(firstname || '').trim()) throw new Error('Firstname is required.');
    if (!String(lastname || '').trim()) throw new Error('Lastname is required.');
    if (!normEmail) throw new Error('Email is required.');
    if (!String(phone || '').trim()) throw new Error('Phone is required.');
    
    const key = emailKey(normEmail);
    
    // Check if email exists in database
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    if (idxSnap.exists()) {
      throw new Error('Email already exists in database.');
    }
    
    // Note: Client SDK cannot create users or set custom claims
    // This requires Firebase Admin SDK which can only run server-side
    // In a monolithic client-only app, admin creation would need to:
    // 1. Use Firebase Functions, or
    // 2. Have the new admin register themselves, then manually update the database
    // For now, we'll create the database entry only
    
    const uid = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      uid,
      role: 'admin',
      firstname,
      lastname,
      email: normEmail,
      phone,
      createdAt: Date.now(),
      createdBy: auth.currentUser?.uid,
      emailKey: key,
      status: 'pending_activation'
    };
    
    await set(ref(database, `users/${uid}`), payload);
    await set(ref(database, `emailIndex/${key}`), uid);
    
    return {
      uid,
      email: normEmail,
      status: 'pending',
      note: 'Admin must register with this email to activate account'
    };
  },

  async inviteAdmin(adminProfile) {
    await this.verifyAdmin();
    
    const { email, firstname, lastname, phone } = adminProfile;
    const normEmail = normalizeEmail(email);
    
    if (!normEmail) throw new Error('Email is required.');
    
    const key = emailKey(normEmail);
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    if (idxSnap.exists()) {
      throw new Error('Email already exists in database.');
    }
    
    const uid = `invited_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      uid,
      role: 'admin',
      firstname: String(firstname || '').trim(),
      lastname: String(lastname || '').trim(),
      email: normEmail,
      phone: String(phone || '').trim(),
      createdAt: Date.now(),
      createdBy: auth.currentUser?.uid,
      emailKey: key,
      invitedBy: auth.currentUser?.uid,
      invitedAt: Date.now(),
      status: 'invited'
    };
    
    await set(ref(database, `users/${uid}`), payload);
    await set(ref(database, `emailIndex/${key}`), uid);
    
    return {
      uid,
      email: normEmail,
      status: 'invited',
      sendPasswordResetEmail: true
    };
  },

  async deleteAdmin(uid) {
    await this.verifyAdmin();
    
    const userSnap = await get(ref(database, `users/${uid}`));
    if (!userSnap.exists()) throw new Error('Admin not found.');
    
    const user = userSnap.val();
    if (user.role !== 'admin') throw new Error('User is not an admin.');
    
    // Remove from database
    await remove(ref(database, `users/${uid}`));
    if (user.email) {
      await remove(ref(database, `emailIndex/${emailKey(user.email)}`));
    }
    
    return { ok: true };
  },

  async sendPasswordResetToUser(email) {
    await this.verifyAdmin();
    
    const { auth } = await import('./firebase');
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
    
    // Note: Client SDK cannot create auth users
    // This would need Firebase Functions or manual admin action
    // For now, we update the database record
    
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
    
    const { auth } = await import('./firebase');
    const { sendPasswordResetEmail } = await import('firebase/auth');
    
    await sendPasswordResetEmail(auth, owner.email);
    return { ok: true };
  }
};

export default adminService;
