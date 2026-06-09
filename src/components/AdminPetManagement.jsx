import React from 'react';

import { getDatabase, get, push, ref, set, update } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import { auth } from '../auth';
import app from '../firebaseConfig';
import { logAuditTrail } from '../utils/auditLogger';

const AdminPetManagement = () => {
  const [activeTab, setActiveTab] = React.useState('pets');
  const [pets, setPets] = React.useState([]);
  const [owners, setOwners] = React.useState([]);
  const [medicalRecords, setMedicalRecords] = React.useState([]);
  const [vaccinationRecords, setVaccinationRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [selected, setSelected] = React.useState(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Medical records state
  const [selectedMedicalRecord, setSelectedMedicalRecord] = React.useState(null);
  const [medicalViewOpen, setMedicalViewOpen] = React.useState(false);
  const [medicalEditOpen, setMedicalEditOpen] = React.useState(false);
  const [medicalAddOpen, setMedicalAddOpen] = React.useState(false);
  const [medicalForm, setMedicalForm] = React.useState({
    petId: '',
    date: '',
    results: '',
    veterinarian: '',
    notes: '',
  });

  // Vaccination records state
  const [selectedVaccinationRecord, setSelectedVaccinationRecord] = React.useState(null);
  const [vaccinationViewOpen, setVaccinationViewOpen] = React.useState(false);
  const [vaccinationEditOpen, setVaccinationEditOpen] = React.useState(false);
  const [vaccinationAddOpen, setVaccinationAddOpen] = React.useState(false);
  const [vaccinationForm, setVaccinationForm] = React.useState({
    petId: '',
    date: '',
    vaccineType: '',
    vaccineSource: '',
    vaccinatedBy: '',
    reason: '',
    hasDisease: false,
    disease: '',
    notes: '',
  });

  const [formError, setFormError] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [form, setForm] = React.useState({
    image: '',
    petName: '',
    petOrigin: '',
    petOriginOther: '',
    ownership: '',
    ownershipOther: '',
    habitat: '',
    species: '',
    sex: '',
    pregnant: false,
    lactating: false,
    puppyCount: '',
    spayedNeutered: '',
    weightKgs: '',
    breed: '',
    animalColor: '',
    dateOfBirth: '',
    tagType: '',
    tagTypeOther: '',
    tagNumber: '',
    contactWithOtherAnimals: '',
  });
  
  const isFemale = form.sex === 'Female';
  const showPetOriginOther = form.petOrigin === 'others';
  const showOwnershipOther = form.ownership === 'others';
  const showTagTypeOther = form.tagType === 'others';

  const [ownerSearch, setOwnerSearch] = React.useState('');
  const [selectedOwner, setSelectedOwner] = React.useState(null);

  const [search, setSearch] = React.useState('');
  const [speciesFilter, setSpeciesFilter] = React.useState('');
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  // Medical records state
  const [medicalSearch, setMedicalSearch] = React.useState('');
  const [medicalSpeciesFilter, setMedicalSpeciesFilter] = React.useState('');
  const [medicalSortKey, setMedicalSortKey] = React.useState('date');
  const [medicalSortDir, setMedicalSortDir] = React.useState('desc');
  const [medicalPage, setMedicalPage] = React.useState(1);
  const medicalPageSize = 10;

  // Vaccination records state
  const [vaccinationSearch, setVaccinationSearch] = React.useState('');
  const [vaccinationSpeciesFilter, setVaccinationSpeciesFilter] = React.useState('');
  const [vaccinationSortKey, setVaccinationSortKey] = React.useState('date');
  const [vaccinationSortDir, setVaccinationSortDir] = React.useState('desc');
  const [vaccinationPage, setVaccinationPage] = React.useState(1);
  const vaccinationPageSize = 10;

  const fetchPets = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const [ownersSnap, petsSnap] = await Promise.all([
        get(ref(db, 'owners')),
        get(ref(db, 'petsByOwner')),
      ]);

      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
      const petsVal = petsSnap.exists() ? petsSnap.val() : {};

      const ownersById = {};
      const ownersArr = [];
      Object.keys(ownersVal || {})
        .filter((k) => k !== '__meta')
        .forEach((ownerId) => {
          const o = { ownerId, ...ownersVal[ownerId] };
          ownersById[ownerId] = o;
          ownersArr.push({
            ownerId: o.ownerId,
            firstname: o.firstname || '',
            lastname: o.lastname || '',
            phone: o.phoneNumber || o.phone || '',
            barangay: o.barangay || '',
          });
        });

      ownersArr.sort((a, b) => {
        const an = `${a.lastname || ''} ${a.firstname || ''}`.toLowerCase();
        const bn = `${b.lastname || ''} ${b.firstname || ''}`.toLowerCase();
        return an.localeCompare(bn);
      });

      const arr = [];
      Object.keys(petsVal || {}).forEach((ownerId) => {
        const ownerPets = petsVal?.[ownerId] || {};
        Object.keys(ownerPets || {}).forEach((petId) => {
          const p = ownerPets?.[petId] || {};
          const owner = ownersById[ownerId] || {};
          const ownerName = `${owner.firstname || ''} ${owner.lastname || ''}`.trim();
          arr.push({
            petId: String(p.id || petId),
            ownerId: String(p.ownerId || ownerId),
            petName: p.petName || '',
            species: p.species || '',
            breed: p.breed || '',
            sex: p.sex || '',
            dateOfBirth: p.dateOfBirth || '',
            tagType: p.tagType || '',
            tagNumber: p.tagNumber || '',
            createdAt: p.createdAt || 0,
            barangay: owner.barangay || '',
            ownerName,
            raw: p,
          });
        });
      });

      arr.sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      setPets(arr);
      setOwners(ownersArr);
    } catch (e) {
      setPets([]);
      setOwners([]);
      setError(e?.message || 'Failed to load pets.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await fetchPets();
      } catch (e) {
        if (!cancelled) {
          setPets([]);
          setError(e?.message || 'Failed to load pets.');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchPets]);

  const fetchMedicalRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const [petsSnap, medicalSnap, ownersSnap] = await Promise.all([
        get(ref(db, 'petsByOwner')),
        get(ref(db, 'medicalRecordsByPet')),
        get(ref(db, 'owners')),
      ]);

      const petsVal = petsSnap.exists() ? petsSnap.val() : {};
      const medicalVal = medicalSnap.exists() ? medicalSnap.val() : {};
      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};

      const ownersById = {};
      Object.keys(ownersVal || {})
        .filter((k) => k !== '__meta')
        .forEach((ownerId) => {
          const o = ownersVal[ownerId] || {};
          ownersById[ownerId] = {
            firstname: o.firstname || '',
            lastname: o.lastname || '',
            barangay: o.barangay || '',
          };
        });

      const petsById = {};
      Object.keys(petsVal || {}).forEach((ownerId) => {
        const ownerPets = petsVal[ownerId] || {};
        Object.keys(ownerPets).forEach((petId) => {
          const p = ownerPets[petId] || {};
          const owner = ownersById[ownerId] || {};
          petsById[petId] = {
            petId,
            petName: p.petName || '',
            species: p.species || '',
            ownerId,
            barangay: owner.barangay || '',
            ownerName: `${owner.firstname || ''} ${owner.lastname || ''}`.trim(),
          };
        });
      });

      const arr = [];
      Object.keys(medicalVal || {}).forEach((petId) => {
        const petRecords = medicalVal[petId] || {};
        const pet = petsById[petId] || {};
        Object.keys(petRecords).forEach((recordId) => {
          const r = petRecords[recordId] || {};
          if (r.recordType === 'medical') {
            arr.push({
              recordId,
              petId,
              petName: pet.petName || '—',
              species: pet.species || '—',
              ownerId: pet.ownerId || '',
              barangay: pet.barangay || '',
              ownerName: pet.ownerName || '—',
              date: r.date || '',
              results: r.results || '',
              veterinarian: r.veterinarian || '',
              notes: r.notes || '',
              createdAt: r.createdAt || 0,
            });
          }
        });
      });

      arr.sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      setMedicalRecords(arr);
    } catch (e) {
      setMedicalRecords([]);
      setError(e?.message || 'Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVaccinationRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const [petsSnap, medicalSnap, ownersSnap] = await Promise.all([
        get(ref(db, 'petsByOwner')),
        get(ref(db, 'medicalRecordsByPet')),
        get(ref(db, 'owners')),
      ]);

      const petsVal = petsSnap.exists() ? petsSnap.val() : {};
      const medicalVal = medicalSnap.exists() ? medicalSnap.val() : {};
      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};

      const ownersById = {};
      Object.keys(ownersVal || {})
        .filter((k) => k !== '__meta')
        .forEach((ownerId) => {
          const o = ownersVal[ownerId] || {};
          ownersById[ownerId] = {
            firstname: o.firstname || '',
            lastname: o.lastname || '',
            barangay: o.barangay || '',
          };
        });

      const petsById = {};
      Object.keys(petsVal || {}).forEach((ownerId) => {
        const ownerPets = petsVal[ownerId] || {};
        Object.keys(ownerPets).forEach((petId) => {
          const p = ownerPets[petId] || {};
          const owner = ownersById[ownerId] || {};
          petsById[petId] = {
            petId,
            petName: p.petName || '',
            species: p.species || '',
            ownerId,
            barangay: owner.barangay || '',
            ownerName: `${owner.firstname || ''} ${owner.lastname || ''}`.trim(),
          };
        });
      });

      const arr = [];
      Object.keys(medicalVal || {}).forEach((petId) => {
        const petRecords = medicalVal[petId] || {};
        const pet = petsById[petId] || {};
        Object.keys(petRecords).forEach((recordId) => {
          const r = petRecords[recordId] || {};
          if (r.recordType === 'vaccination') {
            arr.push({
              recordId,
              petId,
              petName: pet.petName || '—',
              species: pet.species || '—',
              ownerId: pet.ownerId || '',
              barangay: pet.barangay || '',
              ownerName: pet.ownerName || '—',
              date: r.date || '',
              vaccineType: r.vaccineType || '',
              vaccineSource: r.vaccineSource || '',
              vaccinatedBy: r.vaccinatedBy || '',
              reason: r.reason || '',
              hasDisease: r.hasDisease || false,
              disease: r.disease || '',
              notes: r.notes || '',
              createdAt: r.createdAt || 0,
            });
          }
        });
      });

      arr.sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      setVaccinationRecords(arr);
    } catch (e) {
      setVaccinationRecords([]);
      setError(e?.message || 'Failed to load vaccination records.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'medical') {
      fetchMedicalRecords();
    } else if (activeTab === 'vaccination') {
      fetchVaccinationRecords();
    }
  }, [activeTab, fetchMedicalRecords, fetchVaccinationRecords]);

  const filteredMedicalRecords = React.useMemo(() => {
    const q = medicalSearch.trim().toLowerCase();
    return medicalRecords.filter((r) => {
      if (medicalSpeciesFilter && String(r.species || '') !== medicalSpeciesFilter) return false;
      if (!q) return true;
      const petName = String(r.petName || '').toLowerCase();
      const species = String(r.species || '').toLowerCase();
      const date = String(r.date || '').toLowerCase();
      const veterinarian = String(r.veterinarian || '').toLowerCase();
      return petName.includes(q) || species.includes(q) || date.includes(q) || veterinarian.includes(q);
    });
  }, [medicalRecords, medicalSearch, medicalSpeciesFilter]);

  React.useEffect(() => {
    setMedicalPage(1);
  }, [medicalSearch, medicalSpeciesFilter, medicalSortKey, medicalSortDir]);

  const medicalTotalPages = Math.max(1, Math.ceil(filteredMedicalRecords.length / medicalPageSize));
  const medicalSafePage = Math.min(medicalPage, medicalTotalPages);
  const medicalStart = (medicalSafePage - 1) * medicalPageSize;
  const medicalPageItems = filteredMedicalRecords.slice(medicalStart, medicalStart + medicalPageSize);

  const filteredVaccinationRecords = React.useMemo(() => {
    const q = vaccinationSearch.trim().toLowerCase();
    return vaccinationRecords.filter((r) => {
      if (vaccinationSpeciesFilter && String(r.species || '') !== vaccinationSpeciesFilter) return false;
      if (!q) return true;
      const petName = String(r.petName || '').toLowerCase();
      const species = String(r.species || '').toLowerCase();
      const date = String(r.date || '').toLowerCase();
      const vaccineType = String(r.vaccineType || '').toLowerCase();
      return petName.includes(q) || species.includes(q) || date.includes(q) || vaccineType.includes(q);
    });
  }, [vaccinationRecords, vaccinationSearch, vaccinationSpeciesFilter]);

  React.useEffect(() => {
    setVaccinationPage(1);
  }, [vaccinationSearch, vaccinationSpeciesFilter, vaccinationSortKey, vaccinationSortDir]);

  const vaccinationTotalPages = Math.max(1, Math.ceil(filteredVaccinationRecords.length / vaccinationPageSize));
  const vaccinationSafePage = Math.min(vaccinationPage, vaccinationTotalPages);
  const vaccinationStart = (vaccinationSafePage - 1) * vaccinationPageSize;
  const vaccinationPageItems = filteredVaccinationRecords.slice(vaccinationStart, vaccinationStart + vaccinationPageSize);

  const createPet = async () => {
    setFormError('');
    setFormMessage('');

    if (!selectedOwner?.ownerId) {
      setFormError('Please select an owner.');
      return;
    }
    if (!String(form.petName || '').trim()) {
      setFormError('Pet name is required.');
      return;
    }
    if (!String(form.species || '').trim()) {
      setFormError('Species is required.');
      return;
    }
    if (!String(form.sex || '').trim()) {
      setFormError('Sex is required.');
      return;
    }
    if (!String(form.weightKgs).toString().trim()) {
      setFormError('Weight (kgs) is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const ownerId = String(selectedOwner.ownerId);

      const petsRef = push(ref(db, `petsByOwner/${ownerId}`));
      const petId = petsRef.key;
      await set(petsRef, {
        id: petId,
        ownerId,
        image: form.image,
        petName: form.petName,
        petOrigin: form.petOrigin === 'others' ? form.petOriginOther : form.petOrigin,
        ownership: form.ownership === 'others' ? form.ownershipOther : form.ownership,
        habitat: form.habitat,
        species: form.species,
        sex: form.sex,
        pregnant: form.pregnant || false,
        lactating: form.lactating || false,
        puppyCount: form.puppyCount ? Number(form.puppyCount) : null,
        spayedNeutered: form.spayedNeutered,
        weightKgs: Number(form.weightKgs),
        breed: form.breed,
        animalColor: form.animalColor,
        dateOfBirth: form.dateOfBirth,
        tagType: form.tagType === 'others' ? form.tagTypeOther : form.tagType,
        tagNumber: form.tagNumber,
        contactWithOtherAnimals: form.contactWithOtherAnimals,
        createdAt: Date.now(),
      });

      setFormMessage('Pet added.');
      await fetchPets();
      setAddOpen(false);
    } catch (e) {
      setFormError(e?.message || 'Failed to add pet.');
    } finally {
      setSubmitting(false);
    }
  };

  const calcAge = React.useCallback((dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const d = new Date(dateOfBirth);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
    if (years < 0) years = 0;
    return `${years}`;
  }, []);

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = pets.filter((p) => {
      if (speciesFilter && String(p.species || '') !== speciesFilter) return false;
      if (!q) return true;
      const petName = String(p.petName || '').toLowerCase();
      const species = String(p.species || '').toLowerCase();
      const breed = String(p.breed || '').toLowerCase();
      const sex = String(p.sex || '').toLowerCase();
      const tag = `${p.tagType || ''} ${p.tagNumber || ''}`.trim().toLowerCase();
      const barangay = String(p.barangay || '').toLowerCase();
      const owner = String(p.ownerName || '').toLowerCase();
      return petName.includes(q) || species.includes(q) || breed.includes(q) || sex.includes(q) || tag.includes(q) || barangay.includes(q) || owner.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const getValue = (p) => {
      if (sortKey === 'petName') return String(p.petName || '').toLowerCase();
      if (sortKey === 'species') return String(p.species || '').toLowerCase();
      if (sortKey === 'breed') return String(p.breed || '').toLowerCase();
      if (sortKey === 'sex') return String(p.sex || '').toLowerCase();
      if (sortKey === 'age') return Number(calcAge(p.dateOfBirth) === '—' ? -1 : calcAge(p.dateOfBirth));
      if (sortKey === 'tag') return `${p.tagType || ''} ${p.tagNumber || ''}`.trim().toLowerCase();
      if (sortKey === 'barangay') return String(p.barangay || '').toLowerCase();
      if (sortKey === 'owner') return String(p.ownerName || '').toLowerCase();
      if (sortKey === 'createdAt') return Number(p.createdAt || 0);
      return '';
    };

    filtered.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return filtered;
  }, [pets, search, speciesFilter, sortKey, sortDir, calcAge]);

  React.useEffect(() => {
    setPage(1);
  }, [search, speciesFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filteredSorted.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  const tagLabel = (p) => {
    const fmt = (v) => {
      const s = String(v ?? '').trim();
      return s || '—';
    };

    const s = `${p?.tagType || ''} ${p?.tagNumber || ''}`.trim();
    return s || '—';
  };

  const loadIntoForm = (p) => {
    const src = p?.raw ? p.raw : p;
    setForm({
      image: src?.image || '',
      petName: src?.petName || '',
      petOrigin: src?.petOrigin || '',
      petOriginOther: '',
      ownership: src?.ownership || '',
      ownershipOther: '',
      habitat: src?.habitat || '',
      species: src?.species || '',
      sex: src?.sex || '',
      pregnant: src?.pregnant || false,
      lactating: src?.lactating || false,
      puppyCount: src?.puppyCount || '',
      spayedNeutered: src?.spayedNeutered || '',
      weightKgs: String(src?.weightKgs ?? ''),
      breed: src?.breed || '',
      animalColor: src?.animalColor || '',
      dateOfBirth: src?.dateOfBirth || '',
      tagType: src?.tagType || '',
      tagTypeOther: '',
      tagNumber: src?.tagNumber || '',
      contactWithOtherAnimals: src?.contactWithOtherAnimals || '',
    });
    setFormError('');
    setFormMessage('');
  };

  React.useEffect(() => {
    if (!editOpen || !selected) return;
    loadIntoForm(selected);
  }, [editOpen, selected]);

  const closeView = () => {
    setViewOpen(false);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setSelected(null);
    setFormError('');
    setFormMessage('');
  };

  const resetAdd = () => {
    setForm({
      image: '',
      petName: '',
      petOrigin: '',
      petOriginOther: '',
      ownership: '',
      ownershipOther: '',
      habitat: '',
      species: '',
      sex: '',
      pregnant: false,
      lactating: false,
      puppyCount: '',
      spayedNeutered: '',
      weightKgs: '',
      breed: '',
      animalColor: '',
      dateOfBirth: '',
      tagType: '',
      tagTypeOther: '',
      tagNumber: '',
      contactWithOtherAnimals: '',
    });
    setOwnerSearch('');
    setSelectedOwner(null);
    setFormError('');
    setFormMessage('');
  };

  const openAdd = () => {
    resetAdd();
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setFormError('');
    setFormMessage('');
  };

  const onView = (p) => {
    setSelected(p);
    setViewOpen(true);
  };

  const onEdit = (p) => {
    setSelected(p);
    loadIntoForm(p);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selected?.ownerId || !selected?.petId) return;
    setFormError('');
    setFormMessage('');

    if (!String(form.petName || '').trim()) {
      setFormError('Pet name is required.');
      return;
    }
    if (!String(form.species || '').trim()) {
      setFormError('Species is required.');
      return;
    }
    if (!String(form.sex || '').trim()) {
      setFormError('Sex is required.');
      return;
    }
    if (!String(form.weightKgs).toString().trim()) {
      setFormError('Weight (kgs) is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');
      const db = getDatabase(app);
      await update(ref(db, `petsByOwner/${selected.ownerId}/${selected.petId}`), {
        image: form.image,
        petName: form.petName,
        petOrigin: form.petOrigin === 'others' ? form.petOriginOther : form.petOrigin,
        ownership: form.ownership === 'others' ? form.ownershipOther : form.ownership,
        habitat: form.habitat,
        species: form.species,
        sex: form.sex,
        pregnant: form.pregnant || false,
        lactating: form.lactating || false,
        puppyCount: form.puppyCount ? Number(form.puppyCount) : null,
        spayedNeutered: form.spayedNeutered,
        weightKgs: Number(form.weightKgs),
        breed: form.breed,
        animalColor: form.animalColor,
        dateOfBirth: form.dateOfBirth,
        tagType: form.tagType === 'others' ? form.tagTypeOther : form.tagType,
        tagNumber: form.tagNumber,
        contactWithOtherAnimals: form.contactWithOtherAnimals,
        updatedAt: Date.now(),
      });

      setFormMessage('Saved.');
      await fetchPets();
      await logAuditTrail('update', selected.petId, 'pet', selected, form);
    } catch (e) {
      setFormError(e?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (p) => {
    const ok = window.confirm('Delete this pet? This cannot be undone.');
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const ownerId = String(p.ownerId || '');
      const petId = String(p.petId || '');
      if (!ownerId || !petId) throw new Error('Invalid pet record.');

      const multi = {};
      multi[`petsByOwner/${ownerId}/${petId}`] = null;
      multi[`medicalRecordsByPet/${petId}`] = null;

      const selectedSnap = await get(ref(db, `selectedPetByOwner/${ownerId}`));
      if (selectedSnap.exists() && String(selectedSnap.val() || '') === petId) {
        multi[`selectedPetByOwner/${ownerId}`] = '';
      }

      await update(ref(db), multi);
      await fetchPets();
      await logAuditTrail('delete', petId, 'pet', p, null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  // Medical Records CRUD Functions
  const addMedicalRecord = async () => {
    setFormError('');
    setFormMessage('');

    if (!medicalForm.petId) {
      setFormError('Pet is required.');
      return;
    }
    if (!medicalForm.date) {
      setFormError('Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const medicalRef = push(ref(db, `medicalRecordsByPet/${medicalForm.petId}`));
      const recordId = medicalRef.key;
      await set(medicalRef, {
        id: recordId,
        petId: medicalForm.petId,
        recordType: 'medical',
        date: medicalForm.date,
        results: medicalForm.results,
        veterinarian: medicalForm.veterinarian,
        notes: medicalForm.notes,
        createdAt: Date.now(),
      });

      setFormMessage('Medical record added.');
      await fetchMedicalRecords();
      setMedicalAddOpen(false);
      setMedicalForm({ petId: '', date: '', results: '', veterinarian: '', notes: '' });
      await logAuditTrail('create', recordId, 'medical_record', null, { petId: medicalForm.petId, date: medicalForm.date, results: medicalForm.results, veterinarian: medicalForm.veterinarian, notes: medicalForm.notes });
    } catch (e) {
      setFormError(e?.message || 'Failed to add medical record.');
    } finally {
      setSubmitting(false);
    }
  };

  const editMedicalRecord = async () => {
    if (!selectedMedicalRecord?.petId || !selectedMedicalRecord?.recordId) return;
    setFormError('');
    setFormMessage('');

    if (!medicalForm.date) {
      setFormError('Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${selectedMedicalRecord.petId}/${selectedMedicalRecord.recordId}`), {
        date: medicalForm.date,
        results: medicalForm.results,
        veterinarian: medicalForm.veterinarian,
        notes: medicalForm.notes,
        updatedAt: Date.now(),
      });

      setFormMessage('Saved.');
      await fetchMedicalRecords();
      setMedicalEditOpen(false);
      await logAuditTrail('update', selectedMedicalRecord.recordId, 'medical_record', selectedMedicalRecord, { date: medicalForm.date, results: medicalForm.results, veterinarian: medicalForm.veterinarian, notes: medicalForm.notes });
    } catch (e) {
      setFormError(e?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMedicalRecord = async (r) => {
    const ok = window.confirm('Delete this medical record? This cannot be undone.');
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${r.petId}/${r.recordId}`), null);
      await fetchMedicalRecords();
      await logAuditTrail('delete', r.recordId, 'medical_record', r, null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  // Vaccination Records CRUD Functions
  const addVaccinationRecord = async () => {
    setFormError('');
    setFormMessage('');

    if (!vaccinationForm.petId) {
      setFormError('Pet is required.');
      return;
    }
    if (!vaccinationForm.date) {
      setFormError('Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      const vaccinationRef = push(ref(db, `medicalRecordsByPet/${vaccinationForm.petId}`));
      const recordId = vaccinationRef.key;
      await set(vaccinationRef, {
        id: recordId,
        petId: vaccinationForm.petId,
        recordType: 'vaccination',
        date: vaccinationForm.date,
        vaccineType: vaccinationForm.vaccineType,
        vaccineSource: vaccinationForm.vaccineSource,
        vaccinatedBy: vaccinationForm.vaccinatedBy,
        reason: vaccinationForm.reason,
        hasDisease: vaccinationForm.hasDisease,
        disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '',
        notes: vaccinationForm.notes,
        createdAt: Date.now(),
      });

      setFormMessage('Vaccination record added.');
      await fetchVaccinationRecords();
      setVaccinationAddOpen(false);
      setVaccinationForm({ petId: '', date: '', vaccineType: '', vaccineSource: '', vaccinatedBy: '', reason: '', hasDisease: false, disease: '', notes: '' });
      await logAuditTrail('create', recordId, 'vaccination_record', null, { petId: vaccinationForm.petId, date: vaccinationForm.date, vaccineType: vaccinationForm.vaccineType, vaccineSource: vaccinationForm.vaccineSource, vaccinatedBy: vaccinationForm.vaccinatedBy, reason: vaccinationForm.reason, hasDisease: vaccinationForm.hasDisease, disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '', notes: vaccinationForm.notes });
    } catch (e) {
      setFormError(e?.message || 'Failed to add vaccination record.');
    } finally {
      setSubmitting(false);
    }
  };

  const editVaccinationRecord = async () => {
    if (!selectedVaccinationRecord?.petId || !selectedVaccinationRecord?.recordId) return;
    setFormError('');
    setFormMessage('');

    if (!vaccinationForm.date) {
      setFormError('Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${selectedVaccinationRecord.petId}/${selectedVaccinationRecord.recordId}`), {
        date: vaccinationForm.date,
        vaccineType: vaccinationForm.vaccineType,
        vaccineSource: vaccinationForm.vaccineSource,
        vaccinatedBy: vaccinationForm.vaccinatedBy,
        reason: vaccinationForm.reason,
        hasDisease: vaccinationForm.hasDisease,
        disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '',
        notes: vaccinationForm.notes,
        updatedAt: Date.now(),
      });

      setFormMessage('Saved.');
      await fetchVaccinationRecords();
      setVaccinationEditOpen(false);
      await logAuditTrail('update', selectedVaccinationRecord.recordId, 'vaccination_record', selectedVaccinationRecord, { date: vaccinationForm.date, vaccineType: vaccinationForm.vaccineType, vaccineSource: vaccinationForm.vaccineSource, vaccinatedBy: vaccinationForm.vaccinatedBy, reason: vaccinationForm.reason, hasDisease: vaccinationForm.hasDisease, disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '', notes: vaccinationForm.notes });
    } catch (e) {
      setFormError(e?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVaccinationRecord = async (r) => {
    const ok = window.confirm('Delete this vaccination record? This cannot be undone.');
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${r.petId}/${r.recordId}`), null);
      await fetchVaccinationRecords();
      await logAuditTrail('delete', r.recordId, 'vaccination_record', r, null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminSidebarLayout title="Pet Management">
      <div className="flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pets'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-600 hover:text-green-700'
            }`}
          >
            Pet Records
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'medical'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-600 hover:text-green-700'
            }`}
          >
            Medical Records
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vaccination')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'vaccination'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-600 hover:text-green-700'
            }`}
          >
            Vaccination Records
          </button>
        </div>

        {/* Pet Records Tab */}
        {activeTab === 'pets' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="petSearch">Search</label>
                  <input
                    id="petSearch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by pet, owner, tag, barangay"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="w-full md:w-56">
                  <label className="block text-sm font-medium mb-1" htmlFor="speciesFilter">Species</label>
                  <select
                    id="speciesFilter"
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={openAdd}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('petName')} className="hover:text-green-700 transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('species')} className="hover:text-green-700 transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('breed')} className="hover:text-green-700 transition-colors">
                          Breed
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('sex')} className="hover:text-green-700 transition-colors">
                          Sex
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('age')} className="hover:text-green-700 transition-colors">
                          Age
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('tag')} className="hover:text-green-700 transition-colors">
                          Tag
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('barangay')} className="hover:text-green-700 transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => toggleSort('owner')} className="hover:text-green-700 transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : pageItems.length ? (
                      pageItems.map((p) => (
                        <tr key={`${p.ownerId}_${p.petId}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <button type="button" className="text-green-700 hover:underline font-medium" onClick={() => onView(p)}>
                              {p.petName || '—'}
                            </button>
                          </td>
                          <td className="py-3 px-4">{p.species || '—'}</td>
                          <td className="py-3 px-4">{p.breed || '—'}</td>
                          <td className="py-3 px-4">{p.sex || '—'}</td>
                          <td className="py-3 px-4">{calcAge(p.dateOfBirth)}</td>
                          <td className="py-3 px-4">{tagLabel(p)}</td>
                          <td className="py-3 px-4">{p.barangay || '—'}</td>
                          <td className="py-3 px-4">{p.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => onView(p)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => onEdit(p)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => doDelete(p)} disabled={deleting}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No pets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {filteredSorted.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, filteredSorted.length)} of{' '}
            {filteredSorted.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage === 1}>
              First
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="text-sm">
              Page {safePage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
              Last
            </Button>
          </div>
        </div>
          </>
        )}

        {/* Medical Records Tab */}
        {activeTab === 'medical' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="medicalSearch">Search</label>
                  <input
                    id="medicalSearch"
                    value={medicalSearch}
                    onChange={(e) => setMedicalSearch(e.target.value)}
                    placeholder="Search by pet, date, veterinarian"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="medicalSpeciesFilter">Species</label>
                  <select
                    id="medicalSpeciesFilter"
                    value={medicalSpeciesFilter}
                    onChange={(e) => setMedicalSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setMedicalAddOpen(true)}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setMedicalSortKey('petName')} className="hover:text-green-700 transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setMedicalSortKey('species')} className="hover:text-green-700 transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setMedicalSortKey('date')} className="hover:text-green-700 transition-colors">
                          Date
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Results</th>
                      <th className="py-3 px-4 text-left font-semibold">Veterinarian</th>
                      <th className="py-3 px-4 text-left font-semibold">Notes</th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setMedicalSortKey('barangay')} className="hover:text-green-700 transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setMedicalSortKey('ownerName')} className="hover:text-green-700 transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : medicalPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No medical records found.
                        </td>
                      </tr>
                    ) : (
                      medicalPageItems.map((r) => (
                        <tr key={r.recordId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">{r.petName || '—'}</td>
                          <td className="py-3 px-4">{r.species || '—'}</td>
                          <td className="py-3 px-4">{r.date || '—'}</td>
                          <td className="py-3 px-4 max-w-xs truncate">{r.results ? r.results.substring(0, 50) + (r.results.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-3 px-4">{r.veterinarian || '—'}</td>
                          <td className="py-3 px-4 max-w-xs truncate">{r.notes ? r.notes.substring(0, 50) + (r.notes.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-3 px-4">{r.barangay || '—'}</td>
                          <td className="py-3 px-4">{r.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedMedicalRecord(r); setMedicalViewOpen(true); }}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedMedicalRecord(r); setMedicalEditOpen(true); }}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteMedicalRecord(r)} disabled={deleting}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredMedicalRecords.length === 0 ? 0 : medicalStart + 1} - {Math.min(medicalStart + medicalPageSize, filteredMedicalRecords.length)} of{' '}
                {filteredMedicalRecords.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setMedicalPage(1)} disabled={medicalSafePage === 1}>
                  First
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMedicalPage((p) => Math.max(1, p - 1))} disabled={medicalSafePage === 1}>
                  Prev
                </Button>
                <div className="text-sm">
                  Page {medicalSafePage} / {medicalTotalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMedicalPage((p) => Math.min(medicalTotalPages, p + 1))}
                  disabled={medicalSafePage === medicalTotalPages}
                >
                  Next
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMedicalPage(medicalTotalPages)} disabled={medicalSafePage === medicalTotalPages}>
                  Last
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Vaccination Records Tab */}
        {activeTab === 'vaccination' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="vaccinationSearch">Search</label>
                  <input
                    id="vaccinationSearch"
                    value={vaccinationSearch}
                    onChange={(e) => setVaccinationSearch(e.target.value)}
                    placeholder="Search by pet, date, vaccine type"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="vaccinationSpeciesFilter">Species</label>
                  <select
                    id="vaccinationSpeciesFilter"
                    value={vaccinationSpeciesFilter}
                    onChange={(e) => setVaccinationSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setVaccinationAddOpen(true)}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setVaccinationSortKey('petName')} className="hover:text-green-700 transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setVaccinationSortKey('species')} className="hover:text-green-700 transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setVaccinationSortKey('date')} className="hover:text-green-700 transition-colors">
                          Date
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Vaccine Type</th>
                      <th className="py-3 px-4 text-left font-semibold">Source</th>
                      <th className="py-3 px-4 text-left font-semibold">Vaccinated By</th>
                      <th className="py-3 px-4 text-left font-semibold">Reason</th>
                      <th className="py-3 px-4 text-left font-semibold">Disease</th>
                      <th className="py-3 px-4 text-left font-semibold">Notes</th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setVaccinationSortKey('barangay')} className="hover:text-green-700 transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        <button type="button" onClick={() => setVaccinationSortKey('ownerName')} className="hover:text-green-700 transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : vaccinationPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          No vaccination records found.
                        </td>
                      </tr>
                    ) : (
                      vaccinationPageItems.map((r) => (
                        <tr key={r.recordId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">{r.petName || '—'}</td>
                          <td className="py-3 px-4">{r.species || '—'}</td>
                          <td className="py-3 px-4">{r.date || '—'}</td>
                          <td className="py-3 px-4">{r.vaccineType || '—'}</td>
                          <td className="py-3 px-4">{r.vaccineSource || '—'}</td>
                          <td className="py-3 px-4">{r.vaccinatedBy || '—'}</td>
                          <td className="py-3 px-4">{r.reason || '—'}</td>
                          <td className="py-3 px-4">{r.disease || 'N/A'}</td>
                          <td className="py-3 px-4 max-w-xs truncate">{r.notes ? r.notes.substring(0, 50) + (r.notes.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-3 px-4">{r.barangay || '—'}</td>
                          <td className="py-3 px-4">{r.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedVaccinationRecord(r); setVaccinationViewOpen(true); }}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedVaccinationRecord(r); setVaccinationEditOpen(true); }}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteVaccinationRecord(r)} disabled={deleting}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredVaccinationRecords.length === 0 ? 0 : vaccinationStart + 1} - {Math.min(vaccinationStart + vaccinationPageSize, filteredVaccinationRecords.length)} of{' '}
                {filteredVaccinationRecords.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setVaccinationPage(1)} disabled={vaccinationSafePage === 1}>
                  First
                </Button>
                <Button variant="outline" size="sm" onClick={() => setVaccinationPage((p) => Math.max(1, p - 1))} disabled={vaccinationSafePage === 1}>
                  Prev
                </Button>
                <div className="text-sm">
                  Page {vaccinationSafePage} / {vaccinationTotalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVaccinationPage((p) => Math.min(vaccinationTotalPages, p + 1))}
                  disabled={vaccinationSafePage === vaccinationTotalPages}
                >
                  Next
                </Button>
                <Button variant="outline" size="sm" onClick={() => setVaccinationPage(vaccinationTotalPages)} disabled={vaccinationSafePage === vaccinationTotalPages}>
                  Last
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewOpen && selected ? (
        <Modal open={viewOpen} title="Pet Details" onClose={closeView} maxWidthClassName="max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Pet:</span> {selected.petName || '—'}</div>
            <div><span className="font-medium">Owner:</span> {selected.ownerName || '—'}</div>
            <div><span className="font-medium">Species:</span> {selected.species || '—'}</div>
            <div><span className="font-medium">Breed:</span> {selected.breed || '—'}</div>
            <div><span className="font-medium">Sex:</span> {selected.sex || '—'}</div>
            <div><span className="font-medium">Age:</span> {calcAge(selected.dateOfBirth)}</div>
            <div><span className="font-medium">Tag:</span> {tagLabel(selected)}</div>
            <div><span className="font-medium">Barangay:</span> {selected.barangay || '—'}</div>
          </div>
          
          <div className="flex items-center space-x-4 border-t border-default pt-4">
            <Button onClick={() => { setViewOpen(false); onEdit(selected); }}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => doDelete(selected)} disabled={deleting}>
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

    {editOpen && selected ? (
      <Modal open={editOpen} title="Edit Pet" onClose={closeEdit} maxWidthClassName="max-w-xl">
        {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
        {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}

        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            <div className="md:col-span-2">
              <ImageUpload
                value={form.image}
                onChange={({ url }) => setForm((p) => ({ ...p, image: url }))}
                folder="pets"
                label="Pet Photo"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pet Name</label>
                <input
                  name="petName"
                  value={form.petName}
                  onChange={(e) => setForm((p) => ({ ...p, petName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Species</label>
                <select
                  name="species"
                  value={form.species}
                  onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sex</label>
                <select
                  name="sex"
                  value={form.sex}
                  onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Breed</label>
                <input
                  name="breed"
                  value={form.breed}
                  onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Color</label>
                <input
                  name="animalColor"
                  value={form.animalColor}
                  onChange={(e) => setForm((p) => ({ ...p, animalColor: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                <input
                  name="weightKgs"
                  type="number"
                  step="0.1"
                  value={form.weightKgs}
                  onChange={(e) => setForm((p) => ({ ...p, weightKgs: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Spayed/Neutered</label>
                <select
                  name="spayedNeutered"
                  value={form.spayedNeutered}
                  onChange={(e) => setForm((p) => ({ ...p, spayedNeutered: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pet Origin</label>
                <select
                  name="petOrigin"
                  value={form.petOrigin}
                  onChange={(e) => setForm((p) => ({ ...p, petOrigin: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="local">Local</option>
                  <option value="others">Others</option>
                </select>
                {showPetOriginOther && (
                  <input
                    name="petOriginOther"
                    value={form.petOriginOther}
                    onChange={(e) => setForm((p) => ({ ...p, petOriginOther: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                    placeholder="Specify origin"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ownership</label>
                <select
                  name="ownership"
                  value={form.ownership}
                  onChange={(e) => setForm((p) => ({ ...p, ownership: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="household">Household</option>
                  <option value="community">Community</option>
                  <option value="others">Others</option>
                </select>
                {showOwnershipOther && (
                  <input
                    name="ownershipOther"
                    value={form.ownershipOther}
                    onChange={(e) => setForm((p) => ({ ...p, ownershipOther: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                    placeholder="Specify ownership"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tag Type</label>
                <select
                  name="tagType"
                  value={form.tagType}
                  onChange={(e) => setForm((p) => ({ ...p, tagType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="collar tag">Collar Tag</option>
                  <option value="microchip">Microchip</option>
                  <option value="tattoo code">Tattoo Code</option>
                  <option value="none">None</option>
                  <option value="others">Others</option>
                </select>
                {showTagTypeOther && (
                  <input
                    name="tagTypeOther"
                    value={form.tagTypeOther}
                    onChange={(e) => setForm((p) => ({ ...p, tagTypeOther: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                    placeholder="Specify tag type"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tag Number</label>
                <input
                  name="tagNumber"
                  value={form.tagNumber}
                  onChange={(e) => setForm((p) => ({ ...p, tagNumber: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Habitat</label>
                <select
                  name="habitat"
                  value={form.habitat}
                  onChange={(e) => setForm((p) => ({ ...p, habitat: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="caged">Caged</option>
                  <option value="free roaming">Free Roaming</option>
                  <option value="leashed">Leashed</option>
                  <option value="house only">House Only</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Contact with other animals</label>
                <select
                  name="contactWithOtherAnimals"
                  value={form.contactWithOtherAnimals}
                  onChange={(e) => setForm((p) => ({ ...p, contactWithOtherAnimals: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="frequent">Frequent</option>
                  <option value="seldom">Seldom</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            {/* Female-specific fields */}
            {isFemale && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-green-50/50 mt-4">
                <div className="font-medium text-sm text-green-800">Female-specific information</div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="pregnant"
                      checked={form.pregnant}
                      onChange={(e) => setForm((p) => ({ ...p, pregnant: e.target.checked }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="lactating"
                      checked={form.lactating}
                      onChange={(e) => setForm((p) => ({ ...p, lactating: e.target.checked }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    Lactating with puppies
                  </label>
                </div>
                {form.lactating && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Number of puppies</label>
                    <input
                      name="puppyCount"
                      type="number"
                      min="0"
                      value={form.puppyCount}
                      onChange={(e) => setForm((p) => ({ ...p, puppyCount: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter number"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={closeEdit}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={submitting}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
        </Modal>
      ) : null}

      {addOpen ? (
        <Modal open={addOpen} title="Add Pet" onClose={closeAdd} maxWidthClassName="max-w-2xl">
          {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
          {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}

          <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
            <div className="space-y-4">
              {/* Owner Selection */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Select owner *</label>
                <select
                  value={selectedOwner?.ownerId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const found = owners.find((o) => o.ownerId === id) || null;
                    setSelectedOwner(found);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  {owners
                    .filter((o) => {
                      const q = ownerSearch.trim().toLowerCase();
                      if (!q) return true;
                      const name = `${o.firstname || ''} ${o.lastname || ''}`.trim().toLowerCase();
                      const phone = String(o.phone || '').toLowerCase();
                      const barangay = String(o.barangay || '').toLowerCase();
                      return name.includes(q) || phone.includes(q) || barangay.includes(q);
                    })
                    .slice(0, 200)
                    .map((o) => {
                      const label = `${o.firstname || ''} ${o.lastname || ''}`.trim() || '—';
                      const meta = `${o.phone || '—'} · ${o.barangay || '—'}`;
                      return (
                        <option key={o.ownerId} value={o.ownerId}>
                          {label} ({meta})
                        </option>
                      );
                    })}
                </select>
                <div className="text-xs text-slate-500 mt-1">
                  Selected: {selectedOwner ? `${selectedOwner.firstname} ${selectedOwner.lastname}`.trim() : 'None'}
                </div>
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  value={form.image}
                  onChange={({ url }) => setForm((p) => ({ ...p, image: url }))}
                  folder="pets"
                  label="Pet Photo"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pet Name</label>
                  <input
                    name="petName"
                    value={form.petName}
                    onChange={(e) => setForm((p) => ({ ...p, petName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Species</label>
                  <select
                    name="species"
                    value={form.species}
                    onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Sex</label>
                  <select
                    name="sex"
                    value={form.sex}
                    onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Breed</label>
                  <input
                    name="breed"
                    value={form.breed}
                    onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Color</label>
                  <input
                    name="animalColor"
                    value={form.animalColor}
                    onChange={(e) => setForm((p) => ({ ...p, animalColor: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    name="weightKgs"
                    type="number"
                    step="0.1"
                    value={form.weightKgs}
                    onChange={(e) => setForm((p) => ({ ...p, weightKgs: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Spayed/Neutered</label>
                  <select
                    name="spayedNeutered"
                    value={form.spayedNeutered}
                    onChange={(e) => setForm((p) => ({ ...p, spayedNeutered: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pet Origin</label>
                  <select
                    name="petOrigin"
                    value={form.petOrigin}
                    onChange={(e) => setForm((p) => ({ ...p, petOrigin: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="local">Local</option>
                    <option value="others">Others</option>
                  </select>
                  {showPetOriginOther && (
                    <input
                      name="petOriginOther"
                      value={form.petOriginOther}
                      onChange={(e) => setForm((p) => ({ ...p, petOriginOther: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                      placeholder="Specify origin"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ownership</label>
                  <select
                    name="ownership"
                    value={form.ownership}
                    onChange={(e) => setForm((p) => ({ ...p, ownership: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="household">Household</option>
                    <option value="community">Community</option>
                    <option value="others">Others</option>
                  </select>
                  {showOwnershipOther && (
                    <input
                      name="ownershipOther"
                      value={form.ownershipOther}
                      onChange={(e) => setForm((p) => ({ ...p, ownershipOther: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                      placeholder="Specify ownership"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tag Type</label>
                  <select
                    name="tagType"
                    value={form.tagType}
                    onChange={(e) => setForm((p) => ({ ...p, tagType: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="collar tag">Collar Tag</option>
                    <option value="microchip">Microchip</option>
                    <option value="tattoo code">Tattoo Code</option>
                    <option value="none">None</option>
                    <option value="others">Others</option>
                  </select>
                  {showTagTypeOther && (
                    <input
                      name="tagTypeOther"
                      value={form.tagTypeOther}
                      onChange={(e) => setForm((p) => ({ ...p, tagTypeOther: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                      placeholder="Specify tag type"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tag Number</label>
                  <input
                    name="tagNumber"
                    value={form.tagNumber}
                    onChange={(e) => setForm((p) => ({ ...p, tagNumber: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Habitat</label>
                  <select
                    name="habitat"
                    value={form.habitat}
                    onChange={(e) => setForm((p) => ({ ...p, habitat: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="caged">Caged</option>
                    <option value="free roaming">Free Roaming</option>
                    <option value="leashed">Leashed</option>
                    <option value="house only">House Only</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Contact with other animals</label>
                  <select
                    name="contactWithOtherAnimals"
                    value={form.contactWithOtherAnimals}
                    onChange={(e) => setForm((p) => ({ ...p, contactWithOtherAnimals: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select</option>
                    <option value="frequent">Frequent</option>
                    <option value="seldom">Seldom</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>

              {/* Female-specific fields */}
              {isFemale && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-green-50/50 mt-4">
                  <div className="font-medium text-sm text-green-800">Female-specific information</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="pregnant"
                        checked={form.pregnant}
                        onChange={(e) => setForm((p) => ({ ...p, pregnant: e.target.checked }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Pregnant
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="lactating"
                        checked={form.lactating}
                        onChange={(e) => setForm((p) => ({ ...p, lactating: e.target.checked }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Lactating with puppies
                    </label>
                  </div>
                  {form.lactating && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Number of puppies</label>
                      <input
                        name="puppyCount"
                        type="number"
                        min="0"
                        value={form.puppyCount}
                        onChange={(e) => setForm((p) => ({ ...p, puppyCount: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter number"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={closeAdd}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPet}
                  disabled={submitting}
                  className="bg-green-700 hover:bg-green-800 text-white rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Add Pet'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Medical Record View Modal */}
      {medicalViewOpen && selectedMedicalRecord ? (
        <Modal open={medicalViewOpen} title="Medical Record Details" onClose={() => setMedicalViewOpen(false)} maxWidthClassName="max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Pet:</span> {selectedMedicalRecord.petName || '—'}</div>
            <div><span className="font-medium">Species:</span> {selectedMedicalRecord.species || '—'}</div>
            <div><span className="font-medium">Date:</span> {selectedMedicalRecord.date || '—'}</div>
            <div><span className="font-medium">Veterinarian:</span> {selectedMedicalRecord.veterinarian || '—'}</div>
            <div><span className="font-medium">Barangay:</span> {selectedMedicalRecord.barangay || '—'}</div>
            <div><span className="font-medium">Owner:</span> {selectedMedicalRecord.ownerName || '—'}</div>
            <div className="md:col-span-2"><span className="font-medium">Results:</span> {selectedMedicalRecord.results || '—'}</div>
            <div className="md:col-span-2"><span className="font-medium">Notes:</span> {selectedMedicalRecord.notes || '—'}</div>
          </div>
          <div className="flex items-center space-x-4 border-t border-default pt-4">
            <Button onClick={() => { setMedicalViewOpen(false); setMedicalEditOpen(true); }}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => deleteMedicalRecord(selectedMedicalRecord)} disabled={deleting}>
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

      {/* Medical Record Edit Modal */}
      {medicalEditOpen && selectedMedicalRecord ? (
        <Modal open={medicalEditOpen} title="Edit Medical Record" onClose={() => setMedicalEditOpen(false)} maxWidthClassName="max-w-xl">
          {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
          {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={medicalForm.date}
                onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Results</label>
              <textarea
                value={medicalForm.results}
                onChange={(e) => setMedicalForm({ ...medicalForm, results: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
              <input
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMedicalEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editMedicalRecord} disabled={submitting}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Medical Record Add Modal */}
      {medicalAddOpen ? (
        <Modal open={medicalAddOpen} title="Add Medical Record" onClose={() => setMedicalAddOpen(false)} maxWidthClassName="max-w-xl">
          {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
          {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Pet *</label>
              <select
                value={medicalForm.petId}
                onChange={(e) => setMedicalForm({ ...medicalForm, petId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a pet</option>
                {pets.map((p) => (
                  <option key={`${p.ownerId}_${p.petId}`} value={p.petId}>
                    {p.petName} ({p.species}) - {p.ownerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date *</label>
              <input
                type="date"
                value={medicalForm.date}
                onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Results</label>
              <textarea
                value={medicalForm.results}
                onChange={(e) => setMedicalForm({ ...medicalForm, results: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
              <input
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMedicalAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addMedicalRecord} disabled={submitting}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
                {submitting ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Vaccination Record View Modal */}
      {vaccinationViewOpen && selectedVaccinationRecord ? (
        <Modal open={vaccinationViewOpen} title="Vaccination Record Details" onClose={() => setVaccinationViewOpen(false)} maxWidthClassName="max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Pet:</span> {selectedVaccinationRecord.petName || '—'}</div>
            <div><span className="font-medium">Species:</span> {selectedVaccinationRecord.species || '—'}</div>
            <div><span className="font-medium">Date:</span> {selectedVaccinationRecord.date || '—'}</div>
            <div><span className="font-medium">Vaccine Type:</span> {selectedVaccinationRecord.vaccineType || '—'}</div>
            <div><span className="font-medium">Source:</span> {selectedVaccinationRecord.vaccineSource || '—'}</div>
            <div><span className="font-medium">Vaccinated By:</span> {selectedVaccinationRecord.vaccinatedBy || '—'}</div>
            <div><span className="font-medium">Reason:</span> {selectedVaccinationRecord.reason || '—'}</div>
            <div><span className="font-medium">Disease:</span> {selectedVaccinationRecord.disease || 'N/A'}</div>
            <div><span className="font-medium">Barangay:</span> {selectedVaccinationRecord.barangay || '—'}</div>
            <div><span className="font-medium">Owner:</span> {selectedVaccinationRecord.ownerName || '—'}</div>
            <div className="md:col-span-2"><span className="font-medium">Notes:</span> {selectedVaccinationRecord.notes || '—'}</div>
          </div>
          <div className="flex items-center space-x-4 border-t border-default pt-4">
            <Button onClick={() => { setVaccinationViewOpen(false); setVaccinationEditOpen(true); }}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => deleteVaccinationRecord(selectedVaccinationRecord)} disabled={deleting}>
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

      {/* Vaccination Record Edit Modal */}
      {vaccinationEditOpen && selectedVaccinationRecord ? (
        <Modal open={vaccinationEditOpen} title="Edit Vaccination Record" onClose={() => setVaccinationEditOpen(false)} maxWidthClassName="max-w-xl">
          {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
          {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={vaccinationForm.date}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Type</label>
              <input
                value={vaccinationForm.vaccineType}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
              <input
                value={vaccinationForm.vaccineSource}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineSource: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
              <input
                value={vaccinationForm.vaccinatedBy}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccinatedBy: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason</label>
              <select
                value={vaccinationForm.reason}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Mass">Mass</option>
                <option value="Routine">Routine</option>
                <option value="Outbreak">Outbreak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Has Disease</label>
              <select
                value={vaccinationForm.hasDisease ? 'yes' : 'no'}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, hasDisease: e.target.value === 'yes' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            {vaccinationForm.hasDisease && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Disease</label>
                <input
                  value={vaccinationForm.disease}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, disease: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Specify disease"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={vaccinationForm.notes}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setVaccinationEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editVaccinationRecord} disabled={submitting}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Vaccination Record Add Modal */}
      {vaccinationAddOpen ? (
        <Modal open={vaccinationAddOpen} title="Add Vaccination Record" onClose={() => setVaccinationAddOpen(false)} maxWidthClassName="max-w-xl">
          {formError ? <div className="mb-3 text-sm text-destructive">{formError}</div> : null}
          {formMessage ? <div className="mb-3 text-sm">{formMessage}</div> : null}
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Pet *</label>
              <select
                value={vaccinationForm.petId}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, petId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a pet</option>
                {pets.map((p) => (
                  <option key={`${p.ownerId}_${p.petId}`} value={p.petId}>
                    {p.petName} ({p.species}) - {p.ownerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date *</label>
              <input
                type="date"
                value={vaccinationForm.date}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Type</label>
              <input
                value={vaccinationForm.vaccineType}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
              <input
                value={vaccinationForm.vaccineSource}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineSource: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
              <input
                value={vaccinationForm.vaccinatedBy}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccinatedBy: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason</label>
              <select
                value={vaccinationForm.reason}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Mass">Mass</option>
                <option value="Routine">Routine</option>
                <option value="Outbreak">Outbreak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Has Disease</label>
              <select
                value={vaccinationForm.hasDisease ? 'yes' : 'no'}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, hasDisease: e.target.value === 'yes' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            {vaccinationForm.hasDisease && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Disease</label>
                <input
                  value={vaccinationForm.disease}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, disease: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Specify disease"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={vaccinationForm.notes}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setVaccinationAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addVaccinationRecord} disabled={submitting}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
                {submitting ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </AdminSidebarLayout>
  );
};

export default AdminPetManagement;
