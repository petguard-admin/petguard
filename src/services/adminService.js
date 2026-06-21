import { database } from './firebase';
import { ref, get, set, update, remove } from 'firebase/database';
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

// Backend API URL - configure this based on your deployment
const BACKEND_URL = 'https://petguard-backend.onrender.com';

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
    
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/admin/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get admins');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get admins error:', error.message);
      // Fallback to client-side if backend is unavailable
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
    }
  },

  async createAdmin(adminProfile) {
    await this.verifyAdmin();
    
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/admin/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminProfile)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create admin error:', error.message);
      throw error;
    }
  },

  async inviteAdmin(adminProfile) {
    // This now uses the same createAdmin endpoint
    return this.createAdmin(adminProfile);
  },

  async deleteAdmin(uid) {
    await this.verifyAdmin();
    
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/admin/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete admin');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete admin error:', error.message);
      throw error;
    }
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
