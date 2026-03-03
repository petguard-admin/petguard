import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import admin from 'firebase-admin';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const app = express();
app.use(cors());
app.use(express.json());

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.authUid = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: e?.message || 'Unauthorized.' });
  }
};

const requireVet = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const roleSnap = await admin.database().ref(`users/${decoded.uid}/role`).get();
    const role = roleSnap.exists() ? roleSnap.val() : '';

    if (role !== 'vet') {
      return res.status(403).json({ error: 'Forbidden. Vet role required.' });
    }

    req.vetUid = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: e?.message || 'Unauthorized.' });
  }
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const emailKey = (email) => Buffer.from(normalizeEmail(email), 'utf8').toString('base64');

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const userSnap = await admin.database().ref(`users/${req.authUid}`).get();
    return res.json({ uid: req.authUid, profile: userSnap.exists() ? userSnap.val() : null });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load profile.' });
  }
});

app.patch('/api/me', requireAuth, async (req, res) => {
  try {
    const updates = req.body?.profile || {};
    const allowed = {
      firstname: updates.firstname,
      lastname: updates.lastname,
      phone: updates.phone,
      barangay: updates.barangay,
      gender: updates.gender,
      birthday: updates.birthday,
      updatedAt: Date.now(),
    };

    Object.keys(allowed).forEach((k) => {
      if (allowed[k] === undefined) delete allowed[k];
    });

    await admin.database().ref(`users/${req.authUid}`).update(allowed);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to update profile.' });
  }
});

app.post('/api/me/reset-password-link', requireAuth, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.authUid);
    if (!user?.email) return res.status(400).json({ error: 'No email found for this user.' });

    const link = await admin.auth().generatePasswordResetLink(user.email);
    return res.json({ resetLink: link });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to generate reset link.' });
  }
});

app.delete('/api/me', requireAuth, async (req, res) => {
  try {
    await admin.database().ref(`users/${req.authUid}`).remove();

    const idxKeySnap = await admin.database().ref(`users/${req.authUid}/emailKey`).get();
    if (idxKeySnap.exists()) {
      await admin.database().ref(`emailIndex/${idxKeySnap.val()}`).remove();
    }

    await admin.auth().deleteUser(req.authUid);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to delete account.' });
  }
});

app.get('/api/me/pets', requireAuth, async (req, res) => {
  try {
    const snap = await admin.database().ref(`petsByOwner/${req.authUid}`).get();
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json({ pets: arr });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load pets.' });
  }
});

app.post('/api/me/pets', requireAuth, async (req, res) => {
  try {
    const pet = req.body?.pet || {};
    if (!String(pet.petName || '').trim()) return res.status(400).json({ error: 'Pet Name is required.' });
    if (!String(pet.species || '').trim()) return res.status(400).json({ error: 'Species is required.' });
    if (!String(pet.sex || '').trim()) return res.status(400).json({ error: 'Sex is required.' });
    if (pet.weightKgs === undefined || pet.weightKgs === null || String(pet.weightKgs).trim() === '') {
      return res.status(400).json({ error: 'Weight (kgs) is required.' });
    }

    const petsRef = admin.database().ref(`petsByOwner/${req.authUid}`).push();
    const payload = {
      ...pet,
      id: petsRef.key,
      ownerUid: req.authUid,
      weightKgs: pet.weightKgs === '' ? '' : Number(pet.weightKgs),
      createdAt: Date.now(),
    };
    await petsRef.set(payload);
    await admin.database().ref(`selectedPetByOwner/${req.authUid}`).set(petsRef.key);
    return res.json({ pet: payload });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to create pet.' });
  }
});

app.patch('/api/me/pets/:petId', requireAuth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const pet = req.body?.pet || {};
    const refPath = admin.database().ref(`petsByOwner/${req.authUid}/${petId}`);
    const snap = await refPath.get();
    if (!snap.exists()) return res.status(404).json({ error: 'Pet not found.' });

    const updates = { ...pet };
    if ('weightKgs' in updates) {
      updates.weightKgs = updates.weightKgs === '' ? '' : Number(updates.weightKgs);
    }
    updates.updatedAt = Date.now();

    await refPath.update(updates);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to update pet.' });
  }
});

app.delete('/api/me/pets/:petId', requireAuth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const petRef = admin.database().ref(`petsByOwner/${req.authUid}/${petId}`);
    const snap = await petRef.get();
    if (!snap.exists()) return res.status(404).json({ error: 'Pet not found.' });
    await petRef.remove();

    const selectedRef = admin.database().ref(`selectedPetByOwner/${req.authUid}`);
    const selectedSnap = await selectedRef.get();
    if (selectedSnap.exists() && selectedSnap.val() === petId) {
      const remainingSnap = await admin.database().ref(`petsByOwner/${req.authUid}`).get();
      const remaining = remainingSnap.exists() ? remainingSnap.val() : {};
      const nextId = Object.keys(remaining || {})[0] || '';
      await selectedRef.set(nextId);
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to delete pet.' });
  }
});

app.post('/api/me/selected-pet', requireAuth, async (req, res) => {
  try {
    const petId = String(req.body?.petId || '');
    if (!petId) return res.status(400).json({ error: 'petId is required.' });
    const snap = await admin.database().ref(`petsByOwner/${req.authUid}/${petId}`).get();
    if (!snap.exists()) return res.status(404).json({ error: 'Pet not found.' });
    await admin.database().ref(`selectedPetByOwner/${req.authUid}`).set(petId);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to switch pet.' });
  }
});

app.get('/api/me/pets/:petId/medical-records', requireAuth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const petSnap = await admin.database().ref(`petsByOwner/${req.authUid}/${petId}`).get();
    if (!petSnap.exists()) return res.status(404).json({ error: 'Pet not found.' });

    const snap = await admin.database().ref(`medicalRecordsByPet/${petId}`).get();
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json({ records: arr });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load medical records.' });
  }
});

app.post('/api/me/pets/:petId/medical-records', requireAuth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const petSnap = await admin.database().ref(`petsByOwner/${req.authUid}/${petId}`).get();
    if (!petSnap.exists()) return res.status(404).json({ error: 'Pet not found.' });

    const record = req.body?.record || {};
    const recordType = String(record.recordType || '');
    if (!recordType) return res.status(400).json({ error: 'recordType is required.' });
    if (!String(record.date || '').trim()) return res.status(400).json({ error: 'date is required.' });

    const recRef = admin.database().ref(`medicalRecordsByPet/${petId}`).push();
    const payload = {
      ...record,
      id: recRef.key,
      petId,
      ownerUid: req.authUid,
      createdAt: Date.now(),
    };
    await recRef.set(payload);
    return res.json({ record: payload });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to create medical record.' });
  }
});

app.patch('/api/me/pets/:petId/medical-records/:recordId', requireAuth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const recordId = req.params.recordId;
    const petSnap = await admin.database().ref(`petsByOwner/${req.authUid}/${petId}`).get();
    if (!petSnap.exists()) return res.status(404).json({ error: 'Pet not found.' });

    const recRef = admin.database().ref(`medicalRecordsByPet/${petId}/${recordId}`);
    const recSnap = await recRef.get();
    if (!recSnap.exists()) return res.status(404).json({ error: 'Record not found.' });
    const rec = recSnap.val() || {};
    if (rec.ownerUid && rec.ownerUid !== req.authUid) return res.status(403).json({ error: 'Forbidden.' });

    const updates = { ...(req.body?.record || {}), updatedAt: Date.now() };
    await recRef.update(updates);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to update medical record.' });
  }
});

app.post('/api/me/bootstrap-profile', requireAuth, async (req, res) => {
  try {
    const profile = req.body?.profile || {};
    const email = normalizeEmail(profile.email);
    const key = emailKey(email);

    const idxSnap = await admin.database().ref(`emailIndex/${key}`).get();
    if (idxSnap.exists()) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const payload = {
      uid: req.authUid,
      role: 'pet_owner',
      lastname: profile.lastname,
      firstname: profile.firstname,
      email,
      phone: profile.phone,
      barangay: profile.barangay,
      gender: profile.gender,
      birthday: profile.birthday,
      createdAt: Date.now(),
      emailKey: key,
    };

    await admin.database().ref(`users/${req.authUid}`).set(payload);
    await admin.database().ref(`emailIndex/${key}`).set(req.authUid);

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to bootstrap profile.' });
  }
});

app.get('/api/admin/stats', requireVet, async (req, res) => {
  try {
    const usersSnap = await admin.database().ref('users').get();
    const val = usersSnap.exists() ? usersSnap.val() : {};
    const keys = Object.keys(val || {}).filter((k) => k !== '__meta');
    const totalUsers = keys.length;

    const petsSnap = await admin.database().ref('petsByOwner').get();
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};
    let totalPets = 0;
    Object.values(petsVal).forEach((ownerPets) => {
      if (!ownerPets) return;
      Object.values(ownerPets).forEach((pet) => {
        if (pet && typeof pet === 'object') totalPets += 1;
      });
    });

    return res.json({ totalUsers, totalPets });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to get stats.' });
  }
});

app.get('/api/admin/users', requireVet, async (req, res) => {
  try {
    const usersSnap = await admin.database().ref('users').get();
    const petsSnap = await admin.database().ref('petsByOwner').get();

    const val = usersSnap.exists() ? usersSnap.val() : {};
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};

    const petCounts = {};
    Object.keys(petsVal).forEach((uid) => {
      const ownerPets = petsVal[uid] || {};
      let count = 0;
      Object.values(ownerPets).forEach((pet) => {
        if (pet && typeof pet === 'object') count += 1;
      });
      petCounts[uid] = count;
    });

    const arr = Object.keys(val).filter((uid) => uid !== '__meta').map((uid) => ({ uid, ...val[uid], pets: petCounts[uid] || 0 }));
    return res.json({ users: arr });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to get users.' });
  }
});

app.post('/api/admin/owners/check-email', requireVet, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const key = emailKey(email);

    let existsInAuth = false;
    try {
      await admin.auth().getUserByEmail(email);
      existsInAuth = true;
    } catch (e) {
      if (e?.code !== 'auth/user-not-found') throw e;
    }

    const idxSnap = await admin.database().ref(`emailIndex/${key}`).get();
    const uidFromIndex = idxSnap.exists() ? idxSnap.val() : '';

    let existsInDb = false;
    let dbUser = null;
    if (uidFromIndex) {
      const userSnap = await admin.database().ref(`users/${uidFromIndex}`).get();
      if (userSnap.exists()) {
        existsInDb = true;
        dbUser = { uid: uidFromIndex, ...userSnap.val() };
      }
    }

    return res.json({
      email,
      emailKey: key,
      existsInAuth,
      existsInDb,
      uidFromIndex: uidFromIndex || null,
      dbUser,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to check email.' });
  }
});

app.post('/api/admin/owners/create', requireVet, async (req, res) => {
  try {
    const owner = req.body?.owner || {};
    const option = req.body?.option;

    const email = normalizeEmail(owner.email);
    if (!owner.firstname?.trim()) return res.status(400).json({ error: 'Firstname is required.' });
    if (!owner.lastname?.trim()) return res.status(400).json({ error: 'Lastname is required.' });
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    if (!owner.phone?.trim()) return res.status(400).json({ error: 'Phone is required.' });
    if (!owner.barangay?.trim()) return res.status(400).json({ error: 'Barangay is required.' });
    if (!owner.gender?.trim()) return res.status(400).json({ error: 'Gender is required.' });
    if (!owner.birthday?.trim()) return res.status(400).json({ error: 'Birthday is required.' });

    if (option !== 'A' && option !== 'B') {
      return res.status(400).json({ error: 'Option must be A or B.' });
    }

    const key = emailKey(email);

    let existsInAuth = false;
    try {
      await admin.auth().getUserByEmail(email);
      existsInAuth = true;
    } catch (e) {
      if (e?.code !== 'auth/user-not-found') throw e;
    }

    const idxRef = admin.database().ref(`emailIndex/${key}`);
    const idxSnap = await idxRef.get();
    const uidFromIndex = idxSnap.exists() ? idxSnap.val() : '';

    if (existsInAuth) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    if (uidFromIndex) {
      const dbUserSnap = await admin.database().ref(`users/${uidFromIndex}`).get();
      if (dbUserSnap.exists()) {
        const dbUser = dbUserSnap.val();
        return res.status(409).json({
          error: 'Owner exists in database but not in Auth. Activate instead.',
          code: 'DB_ONLY_OWNER',
          uid: uidFromIndex,
        });
      }
    }

    const createdAt = Date.now();

    if (option === 'B') {
      const uid = admin.database().ref('users').push().key;
      const ownerPayload = {
        uid,
        role: 'owner',
        firstname: owner.firstname,
        lastname: owner.lastname,
        email,
        phone: owner.phone,
        barangay: owner.barangay,
        gender: owner.gender,
        birthday: owner.birthday,
        hasLoginAccess: false,
        accountStatus: 'inactive',
        createdBy: 'admin',
        createdByUid: req.vetUid,
        createdAt,
      };

      await admin.database().ref().update({
        [`users/${uid}`]: ownerPayload,
        [`emailIndex/${key}`]: uid,
      });

      return res.json({ ok: true, mode: 'db_only', uid });
    }

    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      displayName: `${owner.firstname} ${owner.lastname}`.trim(),
    });

    const link = await admin.auth().generatePasswordResetLink(email);

    const ownerPayload = {
      uid: userRecord.uid,
      role: 'owner',
      firstname: owner.firstname,
      lastname: owner.lastname,
      email,
      phone: owner.phone,
      barangay: owner.barangay,
      gender: owner.gender,
      birthday: owner.birthday,
      hasLoginAccess: true,
      accountStatus: 'pending',
      createdBy: 'admin',
      createdByUid: req.vetUid,
      createdAt,
    };

    await admin.database().ref().update({
      [`users/${userRecord.uid}`]: ownerPayload,
      [`emailIndex/${key}`]: userRecord.uid,
    });

    return res.json({ ok: true, mode: 'auth', uid: userRecord.uid, passwordSetupLink: link });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to create owner.' });
  }
});

app.post('/api/admin/owners/activate', requireVet, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const key = emailKey(email);
    const idxSnap = await admin.database().ref(`emailIndex/${key}`).get();
    if (!idxSnap.exists()) return res.status(404).json({ error: 'Owner not found in DB.' });

    const uid = idxSnap.val();
    const userSnap = await admin.database().ref(`users/${uid}`).get();
    if (!userSnap.exists()) return res.status(404).json({ error: 'Owner not found in DB.' });

    let existsInAuth = false;
    try {
      await admin.auth().getUserByEmail(email);
      existsInAuth = true;
    } catch (e) {
      if (e?.code !== 'auth/user-not-found') throw e;
    }

    if (existsInAuth) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const dbUser = userSnap.val();

    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      displayName: `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim(),
    });

    const link = await admin.auth().generatePasswordResetLink(email);

    await admin.database().ref(`users/${uid}`).update({
      uid: userRecord.uid,
      hasLoginAccess: true,
      accountStatus: 'pending',
      activatedBy: 'admin',
      activatedByUid: req.vetUid,
      activatedAt: Date.now(),
    });

    if (uid !== userRecord.uid) {
      await admin.database().ref().update({
        [`users/${userRecord.uid}`]: { ...dbUser, uid: userRecord.uid, hasLoginAccess: true, accountStatus: 'pending' },
        [`users/${uid}`]: null,
        [`emailIndex/${key}`]: userRecord.uid,
      });
    }

    return res.json({ ok: true, uid: userRecord.uid, passwordSetupLink: link });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to activate owner.' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`petguard server listening on http://localhost:${port}`);
});
