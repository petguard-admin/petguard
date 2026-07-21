/**
 * Database Migration Script
 * Migrates data from old structure to new Firebase-only architecture
 * 
 * OLD STRUCTURE:
 * - owners/{ownerId}
 * - petsByOwner/{ownerId}/{petId}
 * - medicalRecordsByPet/{petId}/{recordId}
 * - ownerUidMap/{uid}
 * 
 * NEW STRUCTURE:
 * - users/{uid}
 * - adminClaims/{uid}
 * - pets/{petId}
 * - pets/ownerIndex/{ownerId}/{petId}
 * - medicalRecords/{recordId}
 * - medicalRecords/petIndex/{petId}/{recordId}
 */

// OPTION 1: Run in your existing app (recommended)
// Add this function to your adminService and call it from a button

export async function migrateDatabaseInApp(database) {
  const { ref, get, set, remove } = await import('firebase/database');
  
  console.log('Starting migration...');
  
  try {
    // Step 1: Migrate owners to users
    console.log('Step 1: Migrating owners to users...');
    const ownersSnap = await get(ref(database, 'owners'));
    const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
    
    for (const ownerId of Object.keys(ownersVal || {})) {
      if (ownerId === '__meta') continue;
      
      const owner = ownersVal[ownerId];
      const uid = owner.uid || ownerId;
      
      const userPayload = {
        uid,
        email: owner.email || '',
        phone: owner.phoneNumber || owner.phone || '',
        firstname: owner.firstname || '',
        lastname: owner.lastname || '',
        barangay: owner.barangay || '',
        gender: owner.gender || '',
        birthday: owner.birthday || '',
        role: 'owner',
        createdAt: owner.createdAt || Date.now(),
        status: owner.uid ? 'active' : 'inactive'
      };
      
      await set(ref(database, `users/${uid}`), userPayload);
      
      if (owner.phoneNumber || owner.phone) {
        const phone = (owner.phoneNumber || owner.phone).replace(/\s+/g, '').trim();
        await set(ref(database, `phoneIndex/${phone}`), uid);
      }
      
      if (owner.email) {
        const emailKey = btoa(unescape(encodeURIComponent(owner.email.toLowerCase().trim())));
        await set(ref(database, `emailIndex/${emailKey}`), uid);
      }
      
      console.log(`Migrated owner: ${ownerId} -> user: ${uid}`);
    }
    
    // Step 2: Migrate pets
    console.log('Step 2: Migrating pets...');
    const petsByOwnerSnap = await get(ref(database, 'petsByOwner'));
    const petsByOwnerVal = petsByOwnerSnap.exists() ? petsByOwnerSnap.val() : {};
    
    for (const ownerId of Object.keys(petsByOwnerVal || {})) {
      const ownerPets = petsByOwnerVal[ownerId];
      
      for (const petId of Object.keys(ownerPets || {})) {
        const pet = ownerPets[petId];
        
        const petPayload = {
          id: petId,
          ownerId,
          name: pet.petName || pet.name || '',
          species: pet.species || '',
          breed: pet.breed || '',
          sex: pet.sex || '',
          weightKgs: pet.weightKgs || 0,
          age: pet.age || 0,
          createdAt: pet.createdAt || Date.now(),
          updatedAt: pet.updatedAt || null
        };
        
        await set(ref(database, `pets/${petId}`), petPayload);
        await set(ref(database, `pets/ownerIndex/${ownerId}/${petId}`), true);
        
        console.log(`Migrated pet: ${petId} for owner: ${ownerId}`);
      }
    }
    
    // Step 3: Migrate medical records
    console.log('Step 3: Migrating medical records...');
    const medicalRecordsByPetSnap = await get(ref(database, 'medicalRecordsByPet'));
    const medicalRecordsByPetVal = medicalRecordsByPetSnap.exists() ? medicalRecordsByPetSnap.val() : {};
    
    for (const petId of Object.keys(medicalRecordsByPetVal || {})) {
      const petRecords = medicalRecordsByPetVal[petId];
      
      const petSnap = await get(ref(database, `pets/${petId}`));
      const ownerId = petSnap.exists() ? petSnap.val().ownerId : null;
      
      for (const recordId of Object.keys(petRecords || {})) {
        const record = petRecords[recordId];
        
        const recordPayload = {
          id: recordId,
          petId,
          ownerId,
          type: record.recordType || record.type || '',
          date: record.date || '',
          description: record.description || '',
          veterinarian: record.veterinarian || '',
          notes: record.notes || '',
          createdAt: record.createdAt || Date.now(),
          updatedAt: record.updatedAt || null
        };
        
        await set(ref(database, `medicalRecords/${recordId}`), recordPayload);
        await set(ref(database, `medicalRecords/petIndex/${petId}/${recordId}`), true);
        
        console.log(`Migrated medical record: ${recordId} for pet: ${petId}`);
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('Please verify the data before cleaning up the old structure');
    
    return { success: true, message: 'Migration completed' };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// OPTION 2: Add a migration button to your AdminControl component
// Add this to your AdminControl.jsx:

/*
import { database } from '../services/firebase';
import { ref, get, set } from 'firebase/database';

// Add this function inside AdminControl component
const handleMigration = async () => {
  if (!confirm('Are you sure you want to migrate the database? This cannot be undone.')) {
    return;
  }
  
  try {
    const result = await migrateDatabaseInApp(database);
    alert(result.message);
  } catch (error) {
    alert('Migration failed: ' + error.message);
  }
};

// Add this button to your JSX (in the admin section)
<Button variant="warning" onClick={handleMigration}>Run Migration</Button>
*/
