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

export const petService = {
  async getOwnerId() {
    const profile = await authService.getProfile();
    return profile.ownerId;
  },

  async getPets() {
    const ownerId = await this.getOwnerId();
    const snap = await get(ref(database, `petsByOwner/${ownerId}`));
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { pets: arr };
  },

  async getPetById(petId) {
    const ownerId = await this.getOwnerId();
    const snap = await get(ref(database, `petsByOwner/${ownerId}/${petId}`));
    if (!snap.exists()) throw new Error('Pet not found.');
    return { pet: { id: petId, ...snap.val() } };
  },

  async createPet(pet) {
    const ownerId = await this.getOwnerId();
    
    if (!String(pet.petName || '').trim()) throw new Error('Pet Name is required.');
    if (!String(pet.species || '').trim()) throw new Error('Species is required.');
    if (!String(pet.sex || '').trim()) throw new Error('Sex is required.');
    if (pet.weightKgs === undefined || pet.weightKgs === null || String(pet.weightKgs).trim() === '') {
      throw new Error('Weight (kgs) is required.');
    }

    const petsRef = push(ref(database, `petsByOwner/${ownerId}`));
    const payload = {
      ...pet,
      id: petsRef.key,
      ownerId,
      weightKgs: pet.weightKgs === '' ? '' : Number(pet.weightKgs),
      createdAt: Date.now()
    };
    
    await set(petsRef, payload);
    await set(ref(database, `selectedPetByOwner/${ownerId}`), petsRef.key);
    
    return { pet: payload };
  },

  async updatePet(petId, petUpdates) {
    const ownerId = await this.getOwnerId();
    const petRef = ref(database, `petsByOwner/${ownerId}/${petId}`);
    const snap = await get(petRef);
    
    if (!snap.exists()) throw new Error('Pet not found.');

    const updates = { ...petUpdates };
    if ('weightKgs' in updates) {
      updates.weightKgs = updates.weightKgs === '' ? '' : Number(updates.weightKgs);
    }
    updates.updatedAt = Date.now();

    await update(petRef, updates);
    return { ok: true };
  },

  async deletePet(petId) {
    const ownerId = await this.getOwnerId();
    const petRef = ref(database, `petsByOwner/${ownerId}/${petId}`);
    const snap = await get(petRef);
    
    if (!snap.exists()) throw new Error('Pet not found.');
    
    await remove(petRef);

    const selectedRef = ref(database, `selectedPetByOwner/${ownerId}`);
    const selectedSnap = await get(selectedRef);
    
    if (selectedSnap.exists() && selectedSnap.val() === petId) {
      const remainingSnap = await get(ref(database, `petsByOwner/${ownerId}`));
      const remaining = remainingSnap.exists() ? remainingSnap.val() : {};
      const nextId = Object.keys(remaining || {})[0] || '';
      await set(selectedRef, nextId);
    }

    return { ok: true };
  },

  async setSelectedPet(petId) {
    const ownerId = await this.getOwnerId();
    const petSnap = await get(ref(database, `petsByOwner/${ownerId}/${petId}`));
    
    if (!petSnap.exists()) throw new Error('Pet not found.');
    
    await set(ref(database, `selectedPetByOwner/${ownerId}`), petId);
    return { ok: true };
  },

  async getSelectedPetId() {
    const ownerId = await this.getOwnerId();
    const snap = await get(ref(database, `selectedPetByOwner/${ownerId}`));
    return snap.exists() ? snap.val() : '';
  },

  // Admin functions
  async getAllPets() {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const petsSnap = await get(ref(database, 'petsByOwner'));
    const ownersSnap = await get(ref(database, 'owners'));
    
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};
    const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
    
    const allPets = [];
    Object.keys(petsVal || {}).forEach((ownerId) => {
      const ownerPets = petsVal[ownerId] || {};
      const owner = ownersVal[ownerId] || {};
      Object.keys(ownerPets).forEach((petId) => {
        const pet = ownerPets[petId];
        if (pet && typeof pet === 'object') {
          allPets.push({
            id: petId,
            ...pet,
            ownerId,
            ownerName: `${owner.firstname || ''} ${owner.lastname || ''}`.trim() || 'Unknown'
          });
        }
      });
    });
    
    allPets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { pets: allPets };
  },

  async adminCreatePet(ownerId, pet) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const ownerSnap = await get(ref(database, `owners/${ownerId}`));
    if (!ownerSnap.exists()) throw new Error('Owner not found.');

    if (!String(pet.petName || '').trim()) throw new Error('Pet Name is required.');
    if (!String(pet.species || '').trim()) throw new Error('Species is required.');
    if (!String(pet.sex || '').trim()) throw new Error('Sex is required.');

    const petsRef = push(ref(database, `petsByOwner/${ownerId}`));
    const payload = {
      ...pet,
      id: petsRef.key,
      ownerId,
      weightKgs: pet.weightKgs === '' ? '' : Number(pet.weightKgs),
      createdAt: Date.now()
    };
    
    await set(petsRef, payload);
    return { pet: payload };
  },

  async adminUpdatePet(ownerId, petId, petUpdates) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const petRef = ref(database, `petsByOwner/${ownerId}/${petId}`);
    const snap = await get(petRef);
    
    if (!snap.exists()) throw new Error('Pet not found.');

    const updates = { ...petUpdates };
    if ('weightKgs' in updates) {
      updates.weightKgs = updates.weightKgs === '' ? '' : Number(updates.weightKgs);
    }
    updates.updatedAt = Date.now();

    await update(petRef, updates);
    return { ok: true };
  },

  async adminDeletePet(ownerId, petId) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');
    
    const petRef = ref(database, `petsByOwner/${ownerId}/${petId}`);
    const snap = await get(petRef);
    
    if (!snap.exists()) throw new Error('Pet not found.');
    
    await remove(petRef);
    return { ok: true };
  }
};

export default petService;
