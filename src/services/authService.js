import { auth, database } from './firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { ref, get, set, update, remove } from 'firebase/database';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (phone) => String(phone || '').replace(/\s+/g, '').trim();
const emailKey = (email) => {
  try {
    return btoa(unescape(encodeURIComponent(normalizeEmail(email))));
  } catch {
    return '';
  }
};
const genOwnerId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `owner_${ts}_${rand}`;
};

export const authService = {
  async getCurrentUser() {
    return auth.currentUser;
  },

  async getToken(forceRefresh = false) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return getIdToken(user, forceRefresh);
  },

  async getUserRole() {
    const user = auth.currentUser;
    if (!user) return { isAdmin: false, role: '' };
    const tokenResult = await getIdTokenResult(user, true);
    const isAdmin = tokenResult.claims?.admin === true;
    return { isAdmin, role: isAdmin ? 'admin' : '' };
  },

  async register(email, password, profile = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const { firstname, lastname } = profile;
    if (firstname || lastname) {
      await updateProfile(cred.user, {
        displayName: `${firstname || ''} ${lastname || ''}`.trim() || undefined
      });
    }
    return cred;
  },

  async login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    return signOut(auth);
  },

  async sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  },

  async getProfile() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const uid = user.uid;
    const ownerIdSnap = await get(ref(database, `ownerUidMap/${uid}`));
    const ownerId = ownerIdSnap.exists() ? ownerIdSnap.val() : null;
    
    if (!ownerId) {
      throw new Error('No owner profile linked to this account.');
    }
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) {
      throw new Error('Owner profile not found.');
    }
    
    const selectedPetSnap = await get(ref(database, `selectedPetByOwner/${ownerId}`));
    const selectedPetId = selectedPetSnap.exists() ? selectedPetSnap.val() : '';
    
    return {
      uid,
      ownerId,
      profile: { ...ownerSnap.val(), selectedPetId }
    };
  },

  async updateProfileData(updates) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const uid = user.uid;
    const ownerIdSnap = await get(ref(database, `ownerUidMap/${uid}`));
    const ownerId = ownerIdSnap.exists() ? ownerIdSnap.val() : null;
    
    if (!ownerId) throw new Error('No owner profile found.');
    
    const allowed = { updatedAt: Date.now() };
    if (updates.firstname !== undefined) allowed.firstname = updates.firstname;
    if (updates.lastname !== undefined) allowed.lastname = updates.lastname;
    if (updates.barangay !== undefined) allowed.barangay = updates.barangay;
    if (updates.gender !== undefined) allowed.gender = updates.gender;
    if (updates.birthday !== undefined) allowed.birthday = updates.birthday;
    
    await update(ref(database, `owners/${ownerId}`), allowed);
    return { ok: true };
  },

  async linkOwnerByPhone(profile) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const { email, phoneNumber, firstname, lastname, barangay, gender, birthday } = profile;
    const phone = normalizePhone(phoneNumber || profile.phone);
    const normEmail = normalizeEmail(email);
    
    if (!normEmail) throw new Error('Email is required.');
    if (!phone) throw new Error('Phone number is required.');
    
    const existingMapSnap = await get(ref(database, `ownerUidMap/${user.uid}`));
    if (existingMapSnap.exists()) {
      throw new Error('This account is already linked to an owner.');
    }
    
    const key = emailKey(normEmail);
    const emailIdxSnap = await get(ref(database, `emailIndex/${key}`));
    if (emailIdxSnap.exists()) {
      const existingOwnerId = emailIdxSnap.val();
      const existingOwnerSnap = await get(ref(database, `owners/${existingOwnerId}`));
      const existingOwner = existingOwnerSnap.exists() ? existingOwnerSnap.val() : null;
      if (existingOwner?.uid && existingOwner.uid !== user.uid) {
        throw new Error('Email already exists in database.');
      }
    }
    
    const phoneSnap = await get(ref(database, `phoneIndex/${phone}`));
    
    if (phoneSnap.exists()) {
      const ownerId = phoneSnap.val();
      const ownerRef = ref(database, `owners/${ownerId}`);
      const ownerSnap = await get(ownerRef);
      
      if (!ownerSnap.exists()) {
        throw new Error('Phone index is corrupted (owner not found).');
      }
      
      const owner = ownerSnap.val();
      if (owner.uid && owner.uid !== user.uid) {
        throw new Error('This phone number is already linked to another account.');
      }
      
      const updates = {
        email: normEmail,
        uid: user.uid,
        hasLoginAccess: true,
        phoneNumber: phone,
        phone: phone,
        updatedAt: Date.now()
      };
      
      if (String(firstname || '').trim()) updates.firstname = String(firstname).trim();
      if (String(lastname || '').trim()) updates.lastname = String(lastname).trim();
      if (String(barangay || '').trim()) updates.barangay = String(barangay).trim();
      if (String(gender || '').trim()) updates.gender = String(gender).trim();
      if (String(birthday || '').trim()) updates.birthday = String(birthday).trim();
      
      await update(ownerRef, updates);
      await set(ref(database, `ownerUidMap/${user.uid}`), ownerId);
      await set(ref(database, `emailIndex/${key}`), ownerId);
      
      return { ownerId, linkedExistingOwner: true };
    }
    
    const ownerId = genOwnerId();
    const ownerPayload = {
      ownerId,
      phoneNumber: phone,
      email: normEmail,
      uid: user.uid,
      hasLoginAccess: true,
      createdAt: Date.now()
    };
    
    if (firstname != null) ownerPayload.firstname = String(firstname);
    if (lastname != null) ownerPayload.lastname = String(lastname);
    if (String(barangay || '').trim()) ownerPayload.barangay = String(barangay).trim();
    if (String(gender || '').trim()) ownerPayload.gender = String(gender).trim();
    if (String(birthday || '').trim()) ownerPayload.birthday = String(birthday).trim();
    
    await set(ref(database, `owners/${ownerId}`), ownerPayload);
    await set(ref(database, `phoneIndex/${phone}`), ownerId);
    await set(ref(database, `ownerUidMap/${user.uid}`), ownerId);
    await set(ref(database, `emailIndex/${key}`), ownerId);
    
    return { ownerId, linkedExistingOwner: false };
  },

  async bootstrapProfile(profile) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const { email, firstname, lastname, phone, barangay, gender, birthday } = profile;
    const normEmail = normalizeEmail(email);
    const key = emailKey(normEmail);
    
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    if (idxSnap.exists()) {
      throw new Error('Email already exists.');
    }
    
    const ownerId = genOwnerId();
    
    await set(ref(database, `owners/${ownerId}`), {
      ownerId,
      uid: user.uid,
      hasLoginAccess: true,
      firstname,
      lastname,
      email: normEmail,
      phoneNumber: normalizePhone(phone),
      phone: normalizePhone(phone),
      barangay,
      gender,
      birthday,
      createdAt: Date.now()
    });
    
    await set(ref(database, `ownerUidMap/${user.uid}`), ownerId);
    await set(ref(database, `phoneIndex/${normalizePhone(phone)}`), ownerId);
    await set(ref(database, `emailIndex/${key}`), ownerId);
    
    return { ok: true };
  },

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const uid = user.uid;
    const ownerIdSnap = await get(ref(database, `ownerUidMap/${uid}`));
    const ownerId = ownerIdSnap.exists() ? ownerIdSnap.val() : null;
    
    if (!ownerId) throw new Error('Owner profile not found.');
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    const owner = ownerSnap.exists() ? ownerSnap.val() : {};
    const phone = normalizePhone(owner.phoneNumber || owner.phone);
    
    if (phone) await remove(ref(database, `phoneIndex/${phone}`));
    if (owner.email) await remove(ref(database, `emailIndex/${emailKey(owner.email)}`));
    await remove(ref(database, `ownerUidMap/${uid}`));
    await remove(ref(database, `owners/${ownerId}`));
    await remove(ref(database, `petsByOwner/${ownerId}`));
    await remove(ref(database, `selectedPetByOwner/${ownerId}`));
    
    await user.delete();
    return { ok: true };
  }
};

export default authService;
