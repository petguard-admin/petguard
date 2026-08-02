import React from 'react';

import { getDatabase, get, push, ref, set, update } from 'firebase/database';

import AdminSidebarLayout from './AdminSidebarLayout';
import { Button } from './ui/Button';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import SearchableSelect from './ui/SearchableSelect';
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
    vaccineTypeOther: '',
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
  const showVaccineTypeOther = vaccinationForm.vaccineType === 'others';

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
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const [ownersSnap, petsSnap, usersSnap] = await Promise.all([
        get(ref(db, 'owners')),
        get(ref(db, 'petsByOwner')),
        get(ref(db, 'users')),
      ]);

      const ownersVal = ownersSnap.exists() ? ownersSnap.val() : {};
      const petsVal = petsSnap.exists() ? petsSnap.val() : {};
      const usersVal = usersSnap.exists() ? usersSnap.val() : {};

      const ownersById = {};
      const ownersArr = [];
      Object.keys(ownersVal || {})
        .filter((k) => k !== '__meta')
        .forEach((ownerId) => {
          const o = { ownerId, ...ownersVal[ownerId] };
          ownersById[ownerId] = o;
          // Get role from users collection if available
          const userRecord = usersVal[o.uid] || {};
          ownersArr.push({
            ownerId: o.ownerId,
            firstname: o.firstname || '',
            lastname: o.lastname || '',
            phone: o.phoneNumber || o.phone || '',
            barangay: o.barangay || '',
            role: userRecord.role || 'owner',
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
      setError('Could not load pets. Please try again.');
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
          setError('Could not load pets. Please try again.');
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
      if (!user) throw new Error('Please log in to continue.');

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
      setError('Could not load medical records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVaccinationRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

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
      setError('Could not load vaccination records. Please try again.');
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
      setFormError('Please enter a pet name.');
      return;
    }
    if (!String(form.species || '').trim()) {
      setFormError('Please select a species.');
      return;
    }
    if (!String(form.sex || '').trim()) {
      setFormError('Please select a sex.');
      return;
    }
    if (!String(form.weightKgs).toString().trim()) {
      setFormError('Please enter a weight.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

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
      setFormError('Could not add pet. Please try again.');
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
      setFormError('Please enter a pet name.');
      return;
    }
    if (!String(form.species || '').trim()) {
      setFormError('Please select a species.');
      return;
    }
    if (!String(form.sex || '').trim()) {
      setFormError('Please select a sex.');
      return;
    }
    if (!String(form.weightKgs).toString().trim()) {
      setFormError('Please enter a weight.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');
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
      setTimeout(() => {
        closeEdit();
      }, 1500);
    } catch (e) {
      setFormError('Could not save. Please try again.');
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
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const ownerId = String(p.ownerId || '');
      const petId = String(p.petId || '');
      if (!ownerId || !petId) throw new Error('Invalid pet information.');

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
      setError('Could not delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Medical Records CRUD Functions
  const addMedicalRecord = async () => {
    setFormError('');
    setFormMessage('');

    if (!medicalForm.petId) {
      setFormError('Please select a pet.');
      return;
    }
    if (!medicalForm.date) {
      setFormError('Please enter a date.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

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
      setFormError('Could not add medical record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const editMedicalRecord = async () => {
    if (!selectedMedicalRecord?.petId || !selectedMedicalRecord?.recordId) return;
    setFormError('');
    setFormMessage('');

    if (!medicalForm.date) {
      setFormError('Please enter a date.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

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
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${r.petId}/${r.recordId}`), null);
      await fetchMedicalRecords();
      await logAuditTrail('delete', r.recordId, 'medical_record', r, null);
    } catch (e) {
      setError('Could not delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Vaccination Records CRUD Functions
  const addVaccinationRecord = async () => {
    setFormError('');
    setFormMessage('');

    if (!vaccinationForm.petId) {
      setFormError('Please select a pet.');
      return;
    }
    if (!vaccinationForm.date) {
      setFormError('Please enter a date.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      const vaccinationRef = push(ref(db, `medicalRecordsByPet/${vaccinationForm.petId}`));
      const recordId = vaccinationRef.key;
      await set(vaccinationRef, {
        id: recordId,
        petId: vaccinationForm.petId,
        recordType: 'vaccination',
        date: vaccinationForm.date,
        vaccineType: vaccinationForm.vaccineType === 'others' ? vaccinationForm.vaccineTypeOther : vaccinationForm.vaccineType,
        vaccineSource: vaccinationForm.vaccineSource,
        vaccinatedBy: vaccinationForm.vaccinatedBy,
        reason: vaccinationForm.reason,
        hasDisease: vaccinationForm.hasDisease,
        disease: vaccinationForm.hasDisease ? vaccinationForm.disease : null,
        notes: vaccinationForm.notes,
        createdAt: Date.now(),
      });

      setFormMessage('Vaccination record added.');
      await fetchVaccinationRecords();
      setVaccinationAddOpen(false);
      setVaccinationForm({ petId: '', date: '', vaccineType: '', vaccineTypeOther: '', vaccineSource: '', vaccinatedBy: '', reason: '', hasDisease: false, disease: '', notes: '' });
      await logAuditTrail('create', recordId, 'vaccination_record', null, { petId: vaccinationForm.petId, date: vaccinationForm.date, vaccineType: vaccinationForm.vaccineType === 'others' ? vaccinationForm.vaccineTypeOther : vaccinationForm.vaccineType, vaccineSource: vaccinationForm.vaccineSource, vaccinatedBy: vaccinationForm.vaccinatedBy, reason: vaccinationForm.reason, hasDisease: vaccinationForm.hasDisease, disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '', notes: vaccinationForm.notes });
    } catch (e) {
      setFormError('Could not add vaccination record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const editVaccinationRecord = async () => {
    if (!selectedVaccinationRecord?.petId || !selectedVaccinationRecord?.recordId) return;
    setFormError('');
    setFormMessage('');

    if (!vaccinationForm.date) {
      setFormError('Please enter a date.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${selectedVaccinationRecord.petId}/${selectedVaccinationRecord.recordId}`), {
        date: vaccinationForm.date,
        vaccineType: vaccinationForm.vaccineType === 'others' ? vaccinationForm.vaccineTypeOther : vaccinationForm.vaccineType,
        vaccineSource: vaccinationForm.vaccineSource,
        vaccinatedBy: vaccinationForm.vaccinatedBy,
        reason: vaccinationForm.reason,
        hasDisease: vaccinationForm.hasDisease,
        disease: vaccinationForm.hasDisease ? vaccinationForm.disease : null,
        notes: vaccinationForm.notes,
        updatedAt: Date.now(),
      });

      setFormMessage('Saved.');
      await fetchVaccinationRecords();
      setVaccinationEditOpen(false);
      await logAuditTrail('update', selectedVaccinationRecord.recordId, 'vaccination_record', selectedVaccinationRecord, { date: vaccinationForm.date, vaccineType: vaccinationForm.vaccineType === 'others' ? vaccinationForm.vaccineTypeOther : vaccinationForm.vaccineType, vaccineSource: vaccinationForm.vaccineSource, vaccinatedBy: vaccinationForm.vaccinatedBy, reason: vaccinationForm.reason, hasDisease: vaccinationForm.hasDisease, disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '', notes: vaccinationForm.notes });
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
      if (!user) throw new Error('Please log in to continue.');

      const db = getDatabase(app);
      await update(ref(db, `medicalRecordsByPet/${r.petId}/${r.recordId}`), null);
      await fetchVaccinationRecords();
      await logAuditTrail('delete', r.recordId, 'vaccination_record', r, null);
    } catch (e) {
      setError('Could not delete. Please try again.');
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="w-full md:w-56">
                  <label className="block text-sm font-medium mb-1" htmlFor="speciesFilter">Species</label>
                  <select
                    id="speciesFilter"
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="green" onClick={openAdd}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('petName')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('species')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('breed')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Breed
                        </button>
                      </th>
                      <th className="hidden md:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('sex')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Sex
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('age')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Age
                        </button>
                      </th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('tag')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Tag
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('barangay')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="hidden md:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort('owner')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pageItems.length ? (
                      pageItems.map((p, idx) => (
                        <tr key={`${p.ownerId}_${p.petId}`} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="py-3 px-4">
                            <button type="button" className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium" onClick={() => onView(p)}>
                              {p.petName || '—'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.species === 'Dog' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {p.species || '—'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={p.breed}>{p.breed || '—'}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-slate-600">{p.sex || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">{calcAge(p.dateOfBirth)}</td>
                          <td className="hidden lg:table-cell py-3 px-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-semibold">{tagLabel(p)}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-[120px] truncate" title={p.barangay}>{p.barangay || '—'}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-slate-600 max-w-[150px] truncate" title={p.ownerName}>{p.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="blue" size="xs" onClick={() => onView(p)}>
                                View
                              </Button>
                              <Button variant="outline" size="xs" onClick={() => onEdit(p)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="xs" onClick={() => doDelete(p)} disabled={deleting}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-1">
                            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            <span className="text-sm font-medium">No pets found.</span>
                          </div>
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
            <Button variant="outline" size="xs" onClick={() => setPage(1)} disabled={safePage === 1}>
              First
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <div className="text-sm">
              Page {safePage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="xs" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="medicalSpeciesFilter">Species</label>
                  <select
                    id="medicalSpeciesFilter"
                    value={medicalSpeciesFilter}
                    onChange={(e) => setMedicalSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="green" onClick={() => setMedicalAddOpen(true)}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setMedicalSortKey('petName')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setMedicalSortKey('species')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setMedicalSortKey('date')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Date
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Results</th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Veterinarian</th>
                      <th className="hidden md:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Notes</th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setMedicalSortKey('barangay')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="hidden md:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setMedicalSortKey('ownerName')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : medicalPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-1">
                            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="text-sm font-medium">No medical records found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      medicalPageItems.map((r, idx) => (
                        <tr key={r.recordId} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="py-3 px-4 text-slate-600">{r.petName || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.species === 'Dog' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {r.species || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.date || '—'}</td>
                          <td className="py-3 px-4 max-w-[150px] truncate text-slate-500 text-xs" title={r.results}>{r.results || '—'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.veterinarian}>{r.veterinarian || '—'}</td>
                          <td className="hidden md:table-cell py-3 px-4 max-w-[150px] truncate text-slate-500 text-xs" title={r.notes}>{r.notes || '—'}</td>
                          <td className="hidden lg:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.barangay}>{r.barangay || '—'}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-slate-600 max-w-[150px] truncate" title={r.ownerName}>{r.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="blue" size="xs" onClick={() => { setSelectedMedicalRecord(r); setMedicalViewOpen(true); }}>
                                View
                              </Button>
                              <Button variant="outline" size="xs" onClick={() => {
                                setSelectedMedicalRecord(r);
                                setMedicalForm({
                                  petId: r.petId || '',
                                  date: r.date || '',
                                  results: r.results || '',
                                  veterinarian: r.veterinarian || '',
                                  notes: r.notes || '',
                                });
                                setMedicalEditOpen(true);
                              }}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="xs" onClick={() => deleteMedicalRecord(r)} disabled={deleting}>
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
                <Button variant="outline" size="xs" onClick={() => setMedicalPage(1)} disabled={medicalSafePage === 1}>
                  First
                </Button>
                <Button variant="outline" size="xs" onClick={() => setMedicalPage((p) => Math.max(1, p - 1))} disabled={medicalSafePage === 1}>
                  Prev
                </Button>
                <div className="text-sm">
                  Page {medicalSafePage} / {medicalTotalPages}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setMedicalPage((p) => Math.min(medicalTotalPages, p + 1))}
                  disabled={medicalSafePage === medicalTotalPages}
                >
                  Next
                </Button>
                <Button variant="outline" size="xs" onClick={() => setMedicalPage(medicalTotalPages)} disabled={medicalSafePage === medicalTotalPages}>
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="vaccinationSpeciesFilter">Species</label>
                  <select
                    id="vaccinationSpeciesFilter"
                    value={vaccinationSpeciesFilter}
                    onChange={(e) => setVaccinationSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="green" onClick={() => setVaccinationAddOpen(true)}>Add New</Button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setVaccinationSortKey('petName')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Pet
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setVaccinationSortKey('species')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Species
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setVaccinationSortKey('date')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Date
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Vaccine Type</th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Source</th>
                      <th className="hidden md:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Vaccinated By</th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Reason</th>
                      <th className="hidden xl:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Disease</th>
                      <th className="hidden xl:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Notes</th>
                      <th className="hidden lg:table-cell py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setVaccinationSortKey('barangay')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Barangay
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                        <button type="button" onClick={() => setVaccinationSortKey('ownerName')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                          Owner
                        </button>
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="py-10 text-center text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : vaccinationPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-1">
                            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            <span className="text-sm font-medium">No vaccination records found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      vaccinationPageItems.map((r, idx) => (
                        <tr key={r.recordId} className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="py-3 px-4 text-slate-600">{r.petName || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.species === 'Dog' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {r.species || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.date || '—'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.vaccineType}>{r.vaccineType || '—'}</td>
                          <td className="hidden lg:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.vaccineSource}>{r.vaccineSource || '—'}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.vaccinatedBy}>{r.vaccinatedBy || '—'}</td>
                          <td className="hidden lg:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.reason}>{r.reason || '—'}</td>
                          <td className="hidden xl:table-cell py-3 px-4 text-slate-600">{r.disease || 'N/A'}</td>
                          <td className="hidden xl:table-cell py-3 px-4 max-w-[150px] truncate text-slate-500 text-xs" title={r.notes}>{r.notes || '—'}</td>
                          <td className="hidden lg:table-cell py-3 px-4 text-slate-600 max-w-[120px] truncate" title={r.barangay}>{r.barangay || '—'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={r.ownerName}>{r.ownerName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="blue" size="xs" onClick={() => { setSelectedVaccinationRecord(r); setVaccinationViewOpen(true); }}>
                                View
                              </Button>
                              <Button variant="outline" size="xs" onClick={() => {
                                setSelectedVaccinationRecord(r);
                                setVaccinationForm({
                                  petId: r.petId || '',
                                  date: r.date || '',
                                  vaccineType: r.vaccineType || '',
                                  vaccineTypeOther: r.vaccineType === 'others' ? r.vaccineType : '',
                                  vaccineSource: r.vaccineSource || '',
                                  vaccinatedBy: r.vaccinatedBy || '',
                                  reason: r.reason || '',
                                  hasDisease: r.hasDisease || false,
                                  disease: r.disease || '',
                                  notes: r.notes || '',
                                });
                                setVaccinationEditOpen(true);
                              }}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="xs" onClick={() => deleteVaccinationRecord(r)} disabled={deleting}>
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
                <Button variant="outline" size="xs" onClick={() => setVaccinationPage(1)} disabled={vaccinationSafePage === 1}>
                  First
                </Button>
                <Button variant="outline" size="xs" onClick={() => setVaccinationPage((p) => Math.max(1, p - 1))} disabled={vaccinationSafePage === 1}>
                  Prev
                </Button>
                <div className="text-sm">
                  Page {vaccinationSafePage} / {vaccinationTotalPages}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setVaccinationPage((p) => Math.min(vaccinationTotalPages, p + 1))}
                  disabled={vaccinationSafePage === vaccinationTotalPages}
                >
                  Next
                </Button>
                <Button variant="outline" size="xs" onClick={() => setVaccinationPage(vaccinationTotalPages)} disabled={vaccinationSafePage === vaccinationTotalPages}>
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
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={closeView}>
              Close
            </Button>
            <Button variant="blue" onClick={() => { setViewOpen(false); onEdit(selected); }}>
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
                allowUrl={false}
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Species</label>
                <select
                  name="species"
                  value={form.species}
                  onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Color</label>
                <input
                  name="animalColor"
                  value={form.animalColor}
                  onChange={(e) => setForm((p) => ({ ...p, animalColor: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Spayed/Neutered</label>
                <select
                  name="spayedNeutered"
                  value={form.spayedNeutered}
                  onChange={(e) => setForm((p) => ({ ...p, spayedNeutered: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Habitat</label>
                <select
                  name="habitat"
                  value={form.habitat}
                  onChange={(e) => setForm((p) => ({ ...p, habitat: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="lactating"
                      checked={form.lactating}
                      onChange={(e) => setForm((p) => ({ ...p, lactating: e.target.checked }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={saveEdit}
                disabled={submitting}
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
                <SearchableSelect
                  value={selectedOwner?.ownerId || ''}
                  onChange={(value) => {
                    const found = owners.find((o) => o.ownerId === value) || null;
                    setSelectedOwner(found);
                  }}
                  options={owners
                    .filter((o) => o.role !== 'admin')
                    .map((o) => ({
                      value: o.ownerId,
                      label: `${o.firstname || ''} ${o.lastname || ''}`.trim() || '—',
                      meta: `${o.phone || '—'} · ${o.barangay || '—'}`,
                    }))}
                  placeholder="Search owner by name, phone, or barangay..."
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  value={form.image}
                  onChange={({ url }) => setForm((p) => ({ ...p, image: url }))}
                  folder="pets"
                  label="Pet Photo"
                  allowUrl={false}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pet Name</label>
                  <input
                    name="petName"
                    value={form.petName}
                    onChange={(e) => setForm((p) => ({ ...p, petName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Species</label>
                  <select
                    name="species"
                    value={form.species}
                    onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Color</label>
                  <input
                    name="animalColor"
                    value={form.animalColor}
                    onChange={(e) => setForm((p) => ({ ...p, animalColor: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Spayed/Neutered</label>
                  <select
                    name="spayedNeutered"
                    value={form.spayedNeutered}
                    onChange={(e) => setForm((p) => ({ ...p, spayedNeutered: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Habitat</label>
                  <select
                    name="habitat"
                    value={form.habitat}
                    onChange={(e) => setForm((p) => ({ ...p, habitat: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                        className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                      Pregnant
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="lactating"
                        checked={form.lactating}
                        onChange={(e) => setForm((p) => ({ ...p, lactating: e.target.checked }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                >
                  Cancel
                </Button>
                <Button
                  variant="green"
                  onClick={createPet}
                  disabled={submitting}
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setMedicalViewOpen(false)}>
              Close
            </Button>
            <Button variant="blue" onClick={() => {
              setMedicalViewOpen(false);
              setMedicalForm({
                petId: selectedMedicalRecord.petId || '',
                date: selectedMedicalRecord.date || '',
                results: selectedMedicalRecord.results || '',
                veterinarian: selectedMedicalRecord.veterinarian || '',
                notes: selectedMedicalRecord.notes || '',
              });
              setMedicalEditOpen(true);
            }}>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Results</label>
              <textarea
                value={medicalForm.results}
                onChange={(e) => setMedicalForm({ ...medicalForm, results: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
              <input
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMedicalEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="green" onClick={editMedicalRecord} disabled={submitting}>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Results</label>
              <textarea
                value={medicalForm.results}
                onChange={(e) => setMedicalForm({ ...medicalForm, results: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
              <input
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMedicalAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="green" onClick={addMedicalRecord} disabled={submitting}>
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setVaccinationViewOpen(false)}>
              Close
            </Button>
            <Button variant="blue" onClick={() => {
              setVaccinationViewOpen(false);
              setVaccinationForm({
                petId: selectedVaccinationRecord.petId || '',
                date: selectedVaccinationRecord.date || '',
                vaccineType: selectedVaccinationRecord.vaccineType || '',
                vaccineTypeOther: selectedVaccinationRecord.vaccineType === 'others' ? selectedVaccinationRecord.vaccineType : '',
                vaccineSource: selectedVaccinationRecord.vaccineSource || '',
                vaccinatedBy: selectedVaccinationRecord.vaccinatedBy || '',
                reason: selectedVaccinationRecord.reason || '',
                hasDisease: selectedVaccinationRecord.hasDisease || false,
                disease: selectedVaccinationRecord.disease || '',
                notes: selectedVaccinationRecord.notes || '',
              });
              setVaccinationEditOpen(true);
            }}>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Type</label>
              <select
                value={vaccinationForm.vaccineType}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">Select</option>
                <option value="anti-rabies">Anti-rabies</option>
                <option value="others">Other</option>
              </select>
            </div>
            {showVaccineTypeOther && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Specify Vaccine Type</label>
                <input
                  value={vaccinationForm.vaccineTypeOther}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineTypeOther: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
              <input
                value={vaccinationForm.vaccineSource}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineSource: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
              <input
                value={vaccinationForm.vaccinatedBy}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccinatedBy: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason</label>
              <select
                value={vaccinationForm.reason}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Specify disease"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={vaccinationForm.notes}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setVaccinationEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="green" onClick={editVaccinationRecord} disabled={submitting}>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Type</label>
              <select
                value={vaccinationForm.vaccineType}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">Select</option>
                <option value="anti-rabies">Anti-rabies</option>
                <option value="others">Other</option>
              </select>
            </div>
            {showVaccineTypeOther && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Specify Vaccine Type</label>
                <input
                  value={vaccinationForm.vaccineTypeOther}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineTypeOther: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
              <input
                value={vaccinationForm.vaccineSource}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineSource: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
              <input
                value={vaccinationForm.vaccinatedBy}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccinatedBy: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason</label>
              <select
                value={vaccinationForm.reason}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Specify disease"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea
                value={vaccinationForm.notes}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setVaccinationAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="green" onClick={addVaccinationRecord} disabled={submitting}>
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
