import { database } from './firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';
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
const genOwnerId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `owner_${ts}_${rand}`;
};

export const ownerService = {
  async getOwnerProfile() {
    return authService.getProfile();
  },

  async updateOwnerProfile(updates) {
    return authService.updateProfileData(updates);
  },

  async preRegisterOwner(ownerData) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const { phoneNumber, phone, firstname, lastname, email, barangay, gender, birthday } = ownerData;
    const normalizedPhone = normalizePhone(phoneNumber || phone);
    
    if (!normalizedPhone) throw new Error('Phone number is required.');
    
    const phoneSnap = await get(ref(database, `phoneIndex/${normalizedPhone}`));
    if (phoneSnap.exists()) {
      throw new Error('Phone number already exists.');
    }
    
    const ownerId = genOwnerId();
    const payload = {
      ownerId,
      phoneNumber: normalizedPhone,
      phone: normalizedPhone,
      uid: null,
      hasLoginAccess: false,
      createdAt: Date.now(),
      createdByUid: auth.currentUser?.uid
    };
    
    if (String(firstname || '').trim()) payload.firstname = String(firstname).trim();
    if (String(lastname || '').trim()) payload.lastname = String(lastname).trim();
    if (String(email || '').trim()) payload.email = normalizeEmail(email);
    if (String(barangay || '').trim()) payload.barangay = String(barangay).trim();
    if (String(gender || '').trim()) payload.gender = String(gender).trim();
    if (String(birthday || '').trim()) payload.birthday = String(birthday).trim();
    
    await set(ref(database, `owners/${ownerId}`), payload);
    await set(ref(database, `phoneIndex/${normalizedPhone}`), ownerId);
    
    return { ownerId };
  },

  async getAllOwners() {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const [ownersSnap, petsSnap] = await Promise.all([
      get(ref(database, 'owners')),
      get(ref(database, 'petsByOwner'))
    ]);
    
    const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};
    
    const petCounts = {};
    Object.keys(petsVal || {}).forEach((uid) => {
      const ownerPets = petsVal[uid] || {};
      let count = 0;
      Object.values(ownerPets).forEach((pet) => {
        if (pet && typeof pet === 'object') count += 1;
      });
      petCounts[uid] = count;
    });
    
    const owners = Object.keys(ownersVal || {})
      .filter((ownerId) => ownerId !== '__meta')
      .map((ownerId) => ({
        rowType: 'owner',
        uid: ownersVal[ownerId].uid || null,
        ownerId,
        firstname: ownersVal[ownerId].firstname || '',
        lastname: ownersVal[ownerId].lastname || '',
        email: ownersVal[ownerId].email || '',
        phone: ownersVal[ownerId].phoneNumber || ownersVal[ownerId].phone || '',
        barangay: ownersVal[ownerId].barangay || '',
        gender: ownersVal[ownerId].gender || '',
        birthday: ownersVal[ownerId].birthday || '',
        createdAt: ownersVal[ownerId].createdAt || 0,
        pets: petCounts[ownerId] || 0,
        accountStatus: ownersVal[ownerId].uid ? 'active' : 'inactive'
      }));
    
    return { owners };
  },

  async getOwnerById(ownerId) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) throw new Error('Owner not found.');
    
    return { owner: { ownerId, ...ownerSnap.val() } };
  },

  async updateOwner(ownerId, updates) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const ownerRef = ref(database, `owners/${ownerId}`);
    const ownerSnap = await get(ownerRef);
    if (!ownerSnap.exists()) throw new Error('Owner not found.');
    
    const owner = ownerSnap.val();
    const nextPhone = updates.phoneNumber != null || updates.phone != null
      ? normalizePhone(updates.phoneNumber || updates.phone)
      : null;
    
    if (nextPhone !== null && !nextPhone) {
      throw new Error('Phone number is required.');
    }
    
    if (nextPhone && nextPhone !== normalizePhone(owner.phoneNumber || owner.phone)) {
      const existingPhoneSnap = await get(ref(database, `phoneIndex/${nextPhone}`));
      if (existingPhoneSnap.exists() && existingPhoneSnap.val() !== ownerId) {
        throw new Error('Phone number already exists.');
      }
    }
    
    const nextEmail = String(updates.email || '').trim() ? normalizeEmail(updates.email) : null;
    const nextFirstname = String(updates.firstname || '').trim() ? String(updates.firstname).trim() : null;
    const nextLastname = String(updates.lastname || '').trim() ? String(updates.lastname).trim() : null;
    const nextBarangay = String(updates.barangay || '').trim() ? String(updates.barangay).trim() : null;
    const nextGender = String(updates.gender || '').trim() ? String(updates.gender).trim() : null;
    const nextBirthday = String(updates.birthday || '').trim() ? String(updates.birthday).trim() : null;
    
    const ownerUpdates = { updatedAt: Date.now() };
    if (nextPhone !== null) {
      ownerUpdates.phoneNumber = nextPhone;
      ownerUpdates.phone = nextPhone;
    }
    if (nextEmail !== null) ownerUpdates.email = nextEmail;
    if (nextFirstname !== null) ownerUpdates.firstname = nextFirstname;
    if (nextLastname !== null) ownerUpdates.lastname = nextLastname;
    if (nextBarangay !== null) ownerUpdates.barangay = nextBarangay;
    if (nextGender !== null) ownerUpdates.gender = nextGender;
    if (nextBirthday !== null) ownerUpdates.birthday = nextBirthday;
    
    const updates_multi = {};
    updates_multi[`owners/${ownerId}`] = { ...ownerUpdates };
    
    if (nextPhone && nextPhone !== normalizePhone(owner.phoneNumber || owner.phone)) {
      const prevPhone = normalizePhone(owner.phoneNumber || owner.phone);
      if (prevPhone) updates_multi[`phoneIndex/${prevPhone}`] = null;
      updates_multi[`phoneIndex/${nextPhone}`] = ownerId;
    }
    
    await update(ref(database), updates_multi);
    return { ok: true };
  },

  async deleteOwner(ownerId) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) throw new Error('Owner not found.');
    
    const owner = ownerSnap.val();
    const multi = {};
    const phone = normalizePhone(owner.phoneNumber || owner.phone);
    if (phone) multi[`phoneIndex/${phone}`] = null;

    const email = normalizeEmail(owner.email);
    if (email) multi[`emailIndex/${emailKey(email)}`] = null;

    if (owner.uid) {
      multi[`ownerUidMap/${owner.uid}`] = null;
    }

    multi[`petsByOwner/${ownerId}`] = null;
    multi[`selectedPetByOwner/${ownerId}`] = null;
    multi[`owners/${ownerId}`] = null;
    
    await update(ref(database), multi);
    return { ok: true };
  },

  async checkEmailExists(email) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const key = emailKey(email);
    const idxSnap = await get(ref(database, `emailIndex/${key}`));
    
    let existsInAuth = false;
    // Note: Client SDK cannot check auth users, only database
    // The backend would do this check. In monolithic, we rely on
    // Firebase Auth rules and handle conflicts during creation
    
    return {
      existsInDatabase: idxSnap.exists(),
      existsInAuth: false // Client SDK limitation
    };
  }
};

export default ownerService;
