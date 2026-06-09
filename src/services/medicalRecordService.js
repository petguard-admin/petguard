import { database } from './firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';
import { petService } from './petService';
import { authService } from './authService';

export const medicalRecordService = {
  async getOwnerId() {
    const profile = await authService.getProfile();
    return profile.ownerId;
  },

  async getMedicalRecords(petId) {
    const ownerId = await this.getOwnerId();
    
    // Verify pet belongs to owner
    const petSnap = await get(ref(database, `petsByOwner/${ownerId}/${petId}`));
    if (!petSnap.exists()) throw new Error('Pet not found.');

    const snap = await get(ref(database, `medicalRecordsByPet/${petId}`));
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return { records: arr };
  },

  async createMedicalRecord(petId, record) {
    const ownerId = await this.getOwnerId();
    
    // Verify pet belongs to owner
    const petSnap = await get(ref(database, `petsByOwner/${ownerId}/${petId}`));
    if (!petSnap.exists()) throw new Error('Pet not found.');

    const recordType = String(record.recordType || '');
    if (!recordType) throw new Error('recordType is required.');
    if (!String(record.date || '').trim()) throw new Error('date is required.');

    const recRef = push(ref(database, `medicalRecordsByPet/${petId}`));
    const payload = {
      ...record,
      id: recRef.key,
      petId,
      ownerId,
      createdAt: Date.now()
    };
    
    await set(recRef, payload);
    return { record: payload };
  },

  async updateMedicalRecord(petId, recordId, recordUpdates) {
    const ownerId = await this.getOwnerId();
    
    // Verify pet belongs to owner
    const petSnap = await get(ref(database, `petsByOwner/${ownerId}/${petId}`));
    if (!petSnap.exists()) throw new Error('Pet not found.');

    const recRef = ref(database, `medicalRecordsByPet/${petId}/${recordId}`);
    const recSnap = await get(recRef);
    
    if (!recSnap.exists()) throw new Error('Record not found.');
    
    const rec = recSnap.val();
    if (rec.ownerId && rec.ownerId !== ownerId) {
      throw new Error('Forbidden.');
    }

    const updates = { ...recordUpdates, updatedAt: Date.now() };
    await update(recRef, updates);
    return { ok: true };
  },

  async deleteMedicalRecord(petId, recordId) {
    const ownerId = await this.getOwnerId();
    
    const recRef = ref(database, `medicalRecordsByPet/${petId}/${recordId}`);
    const recSnap = await get(recRef);
    
    if (!recSnap.exists()) throw new Error('Record not found.');
    
    const rec = recSnap.val();
    if (rec.ownerId && rec.ownerId !== ownerId) {
      throw new Error('Forbidden.');
    }

    await remove(recRef);
    return { ok: true };
  },

  // Admin functions
  async adminGetMedicalRecords(petId) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');

    const snap = await get(ref(database, `medicalRecordsByPet/${petId}`));
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return { records: arr };
  },

  async adminCreateMedicalRecord(petId, record) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');

    const recordType = String(record.recordType || '');
    if (!recordType) throw new Error('recordType is required.');
    if (!String(record.date || '').trim()) throw new Error('date is required.');

    const recRef = push(ref(database, `medicalRecordsByPet/${petId}`));
    const payload = {
      ...record,
      id: recRef.key,
      petId,
      createdBy: 'admin',
      createdAt: Date.now()
    };
    
    await set(recRef, payload);
    return { record: payload };
  },

  async adminUpdateMedicalRecord(petId, recordId, recordUpdates) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');

    const recRef = ref(database, `medicalRecordsByPet/${petId}/${recordId}`);
    const recSnap = await get(recRef);
    
    if (!recSnap.exists()) throw new Error('Record not found.');

    const updates = { ...recordUpdates, updatedAt: Date.now() };
    await update(recRef, updates);
    return { ok: true };
  },

  async adminDeleteMedicalRecord(petId, recordId) {
    const { isAdmin } = await authService.getUserRole();
    if (!isAdmin) throw new Error('Admin access required.');

    const recRef = ref(database, `medicalRecordsByPet/${petId}/${recordId}`);
    const recSnap = await get(recRef);
    
    if (!recSnap.exists()) throw new Error('Record not found.');

    await remove(recRef);
    return { ok: true };
  }
};

export default medicalRecordService;
