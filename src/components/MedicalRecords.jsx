import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getDatabase, get, ref, remove, update, set } from 'firebase/database';

import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import Modal from './Modal';
import AddMedicalRecordModal from './AddMedicalRecordModal';
import app from '../firebaseConfig';
import OwnerSidebarLayout from './OwnerSidebarLayout';
import { logAuditTrail } from '../utils/auditLogger';

const MedicalRecords = () => {
  const { user, loading } = useAuth();

  const [selectedPetId, setSelectedPetId] = useState('');
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('medical');

  // Add record modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // View/Edit modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [formError, setFormError] = useState('');

  // Search, sort, pagination for medical records
  const [medicalSearch, setMedicalSearch] = useState('');
  const [medicalSpeciesFilter, setMedicalSpeciesFilter] = useState('');
  const [medicalSortKey, setMedicalSortKey] = useState('date');
  const [medicalSortDir, setMedicalSortDir] = useState('desc');
  const [medicalPage, setMedicalPage] = useState(1);
  const medicalPageSize = 10;

  // Search, sort, pagination for vaccination records
  const [vaccinationSearch, setVaccinationSearch] = useState('');
  const [vaccinationSpeciesFilter, setVaccinationSpeciesFilter] = useState('');
  const [vaccinationSortKey, setVaccinationSortKey] = useState('date');
  const [vaccinationSortDir, setVaccinationSortDir] = useState('desc');
  const [vaccinationPage, setVaccinationPage] = useState(1);
  const vaccinationPageSize = 10;

  const getOwnerId = React.useCallback(async () => {
    if (!user) throw new Error('Please log in to continue.');
    const db = getDatabase(app);
    const mapSnap = await get(ref(db, `ownerUidMap/${user.uid}`));
    if (!mapSnap.exists()) throw new Error('Account not found. Please contact support.');
    return String(mapSnap.val() || '');
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let active = true;
    (async () => {
      try {
        const db = getDatabase(app);
        const ownerId = await getOwnerId();

        const selectedSnap = await get(ref(db, `selectedPetByOwner/${ownerId}`));
        const selected = selectedSnap.exists() ? String(selectedSnap.val() || '') : '';
        if (selected) {
          if (!active) return;
          setSelectedPetId(selected);
          return;
        }

        const petsSnap = await get(ref(db, `petsByOwner/${ownerId}`));
        const petsVal = petsSnap.exists() ? petsSnap.val() : {};
        const petIds = Object.keys(petsVal || {});
        const firstPetId = petIds[0] || '';
        if (!firstPetId) {
          setSelectedPetId('');
          return;
        }

        await set(ref(db, `selectedPetByOwner/${ownerId}`), firstPetId);

        if (!active) return;
        setSelectedPetId(firstPetId);
      } catch (e) {
        if (!active) return;
        setError('Unable to load pet information. Please try again.');
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading, getOwnerId]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!selectedPetId) {
      setRecords([]);
      return;
    }

    let active = true;
    setRecordsLoading(true);
    (async () => {
      try {
        const db = getDatabase(app);
        const ownerId = await getOwnerId();
        const snap = await get(ref(db, `medicalRecordsByPet/${selectedPetId}`));
        const val = snap.exists() ? snap.val() : {};
        const arr = Object.keys(val || {}).map((id) => ({ id, ...val[id] }));
        const mine = arr.filter((r) => !r.ownerId || r.ownerId === ownerId);
        if (!active) return;
        setRecords(mine);
      } catch (e) {
        if (!active) return;
        setError('Unable to load medical records. Please try again.');
      } finally {
        if (active) setRecordsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading, selectedPetId, getOwnerId]);

  // Separate records into medical and vaccination
  const medicalRecords = useMemo(() => {
    return records.filter((r) => r.recordType === 'medical');
  }, [records]);

  const vaccinationRecords = useMemo(() => {
    return records.filter((r) => r.recordType === 'vaccination');
  }, [records]);

  // Filtered and sorted medical records
  const filteredMedical = useMemo(() => {
    const q = medicalSearch.trim().toLowerCase();

    const filtered = medicalRecords.filter((r) => {
      if (medicalSpeciesFilter && String(r.species || '') !== medicalSpeciesFilter) return false;
      if (!q) return true;
      const results = String(r.results || '').toLowerCase();
      const veterinarian = String(r.veterinarian || '').toLowerCase();
      const notes = String(r.notes || '').toLowerCase();
      const date = String(r.date || '').toLowerCase();

      return results.includes(q) || veterinarian.includes(q) || notes.includes(q) || date.includes(q);
    });

    const dir = medicalSortDir === 'asc' ? 1 : -1;

    const getValue = (r) => {
      if (medicalSortKey === 'date') return String(r.date || '');
      if (medicalSortKey === 'results') return String(r.results || '').toLowerCase();
      if (medicalSortKey === 'veterinarian') return String(r.veterinarian || '').toLowerCase();
      if (medicalSortKey === 'createdAt') return Number(r.createdAt || 0);
      return '';
    };

    filtered.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return filtered;
  }, [medicalRecords, medicalSearch, medicalSpeciesFilter, medicalSortKey, medicalSortDir]);

  // Filtered and sorted vaccination records
  const filteredVaccination = useMemo(() => {
    const q = vaccinationSearch.trim().toLowerCase();

    const filtered = vaccinationRecords.filter((r) => {
      if (vaccinationSpeciesFilter && String(r.species || '') !== vaccinationSpeciesFilter) return false;
      if (!q) return true;
      const vaccineType = String(r.vaccineType || '').toLowerCase();
      const vaccineSource = String(r.vaccineSource || '').toLowerCase();
      const vaccinatedBy = String(r.vaccinatedBy || '').toLowerCase();
      const notes = String(r.notes || '').toLowerCase();
      const date = String(r.date || '').toLowerCase();

      return vaccineType.includes(q) || vaccineSource.includes(q) ||
             vaccinatedBy.includes(q) || notes.includes(q) || date.includes(q);
    });

    const dir = vaccinationSortDir === 'asc' ? 1 : -1;

    const getValue = (r) => {
      if (vaccinationSortKey === 'date') return String(r.date || '');
      if (vaccinationSortKey === 'vaccineType') return String(r.vaccineType || '').toLowerCase();
      if (vaccinationSortKey === 'vaccineSource') return String(r.vaccineSource || '').toLowerCase();
      if (vaccinationSortKey === 'vaccinatedBy') return String(r.vaccinatedBy || '').toLowerCase();
      if (vaccinationSortKey === 'createdAt') return Number(r.createdAt || 0);
      return '';
    };

    filtered.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return filtered;
  }, [vaccinationRecords, vaccinationSearch, vaccinationSpeciesFilter, vaccinationSortKey, vaccinationSortDir]);

  useEffect(() => {
    setMedicalPage(1);
  }, [medicalSearch, medicalSpeciesFilter, medicalSortKey, medicalSortDir]);

  useEffect(() => {
    setVaccinationPage(1);
  }, [vaccinationSearch, vaccinationSpeciesFilter, vaccinationSortKey, vaccinationSortDir]);

  const medicalTotalPages = Math.max(1, Math.ceil(filteredMedical.length / medicalPageSize));
  const medicalSafePage = Math.min(medicalPage, medicalTotalPages);
  const medicalStart = (medicalSafePage - 1) * medicalPageSize;
  const medicalPageItems = filteredMedical.slice(medicalStart, medicalStart + medicalPageSize);

  const vaccinationTotalPages = Math.max(1, Math.ceil(filteredVaccination.length / vaccinationPageSize));
  const vaccinationSafePage = Math.min(vaccinationPage, vaccinationTotalPages);
  const vaccinationStart = (vaccinationSafePage - 1) * vaccinationPageSize;
  const vaccinationPageItems = filteredVaccination.slice(vaccinationStart, vaccinationStart + vaccinationPageSize);

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const onView = (rec) => {
    setSelectedRecord(rec);
    setViewOpen(true);
  };
  
  const onEdit = (rec) => {
    setSelectedRecord(rec);
    setFormError('');
    if (rec.recordType === 'vaccination') {
      setEditForm({
        recordType: 'vaccination',
        date: rec.date || '',
        vaccineSource: rec.vaccineSource || '',
        vaccineType: rec.vaccineType || '',
        vaccineStock: rec.vaccineStock || '',
        vaccinatedBy: rec.vaccinatedBy || '',
        reason: rec.reason || '',
        hasDisease: rec.hasDisease || false,
        disease: rec.disease || '',
        notes: rec.notes || '',
      });
    } else {
      setEditForm({
        recordType: 'medical',
        date: rec.date || '',
        results: rec.results || '',
        veterinarian: rec.veterinarian || '',
        notes: rec.notes || '',
      });
    }
    setEditOpen(true);
  };

  const onEditChange = (e) => {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    if (!user || !selectedPetId || !selectedRecord?.id || !editForm) return;
    setFormError('');
    setSavingEdit(true);
    try {
      const db = getDatabase(app);
      const patch =
        editForm.recordType === 'vaccination'
          ? {
              date: editForm.date,
              vaccineSource: editForm.vaccineSource,
              vaccineType: editForm.vaccineType,
              vaccineStock: editForm.vaccineStock,
              vaccinatedBy: editForm.vaccinatedBy,
              reason: editForm.reason,
              hasDisease: editForm.hasDisease,
              disease: editForm.hasDisease ? editForm.disease : null,
              notes: editForm.notes,
            }
          : {
              date: editForm.date,
              results: editForm.results,
              veterinarian: editForm.veterinarian,
              notes: editForm.notes,
            };

      await update(ref(db, `medicalRecordsByPet/${selectedPetId}/${selectedRecord.id}`), {
        ...patch,
        updatedAt: Date.now(),
      });

      setRecords((prev) => prev.map((r) => (r.id === selectedRecord.id ? { ...r, ...patch, updatedAt: Date.now() } : r)));
      setMessage('Record updated.');
      setEditOpen(false);
      setSelectedRecord(null);
      setEditForm(null);
      await logAuditTrail('update', selectedRecord.id, editForm.recordType === 'vaccination' ? 'vaccination_record' : 'medical_record', selectedRecord, patch);
    } catch (err) {
      setFormError('Unable to update record. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteRecord = async (rec) => {
    if (!user || !selectedPetId || !rec?.id) return;
    const ok = window.confirm('Delete this record?');
    if (!ok) return;

    setError('');
    setMessage('');
    setDeletingId(rec.id);
    try {
      const db = getDatabase(app);
      await remove(ref(db, `medicalRecordsByPet/${selectedPetId}/${rec.id}`));
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      setMessage('Record deleted.');
      await logAuditTrail('delete', rec.id, rec.recordType === 'vaccination' ? 'vaccination_record' : 'medical_record', rec, null);
    } catch (err) {
      setError('Unable to delete record. Please try again.');
    } finally {
      setDeletingId('');
    }
  };

  const handleRecordAdded = (newRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setMessage('Record saved.');
    logAuditTrail('create', newRecord.id, newRecord.recordType === 'vaccination' ? 'vaccination_record' : 'medical_record', null, newRecord);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4">Please login to view medical records.</p>
        <Button asChild>
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <OwnerSidebarLayout title="Medical Records">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4 sm:mb-6">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Records for your currently selected pet.</p>
        </div>
        <Button
          variant="green"
          onClick={() => setIsAddModalOpen(true)}
          disabled={!selectedPetId}
          className="text-xs sm:text-sm"
        >
          Add Record
        </Button>
      </div>

      {!selectedPetId ? (
        <div className="bg-card rounded-lg shadow-sm p-4 sm:p-6">
          <p className="mb-3 sm:mb-4 text-xs sm:text-sm">No selected pet. Select a pet first.</p>
          <Button asChild className="text-xs sm:text-sm">
            <Link to="/my-pets">Select Pet</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm">
          {/* Tab Navigation */}
          <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('medical')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'medical'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Medical Records
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vaccination')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'vaccination'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Vaccination Records
            </button>
          </div>

          {/* Medical Records Tab */}
          {activeTab === 'medical' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1" htmlFor="medicalSearch">Search</label>
                  <input
                    id="medicalSearch"
                    value={medicalSearch}
                    onChange={(e) => setMedicalSearch(e.target.value)}
                    placeholder="Search by date, veterinarian, results"
                    className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1" htmlFor="medicalSpeciesFilter">Species</label>
                  <select
                    id="medicalSpeciesFilter"
                    value={medicalSpeciesFilter}
                    onChange={(e) => setMedicalSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>

              {error ? <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-destructive">{error}</div> : null}
              {message ? <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-green-600">{message}</div> : null}

              <div className="w-full min-w-0 rounded-lg border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse min-w-[350px] sm:min-w-[450px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setMedicalSortKey('date')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Date
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setMedicalSortKey('results')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Results
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setMedicalSortKey('veterinarian')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Veterinarian
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Notes</th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsLoading ? (
                        <tr>
                          <td colSpan={5} className="py-6 sm:py-10 text-center text-slate-400 text-xs sm:text-sm">
                            <div className="flex flex-col items-center gap-1 sm:gap-2">
                              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                              <span>Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : medicalPageItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 sm:py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-1">
                              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="text-xs sm:text-sm font-medium">No medical records found.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        medicalPageItems.map((r, idx) => (
                          <tr key={r.id} className={`border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm">{r.date || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 max-w-[150px] truncate text-slate-400 text-[10px] sm:text-xs" title={r.results}>{r.results || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm max-w-[120px] truncate" title={r.veterinarian}>{r.veterinarian || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 max-w-[150px] truncate text-slate-400 text-[10px] sm:text-xs" title={r.notes}>{r.notes || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex gap-1">
                                <Button variant="blue" size="xs" onClick={() => onView(r)} className="text-[10px] sm:text-xs">
                                  View
                                </Button>
                                <Button variant="outline" size="xs" onClick={() => onEdit(r)} className="text-[10px] sm:text-xs">
                                  Edit
                                </Button>
                                <Button variant="destructive" size="xs" onClick={() => deleteRecord(r)} disabled={deletingId === r.id} className="text-[10px] sm:text-xs">
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

              <div className="mt-3 sm:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Showing {filteredMedical.length ? medicalStart + 1 : 0}-{Math.min(medicalStart + medicalPageSize, filteredMedical.length)} of {filteredMedical.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => setMedicalPage((p) => Math.max(1, p - 1))} disabled={medicalSafePage <= 1} className="text-[10px] sm:text-xs">
                    Prev
                  </Button>
                  <div className="text-xs sm:text-sm">
                    Page {medicalSafePage} / {medicalTotalPages}
                  </div>
                  <Button variant="outline" size="xs" onClick={() => setMedicalPage((p) => Math.min(medicalTotalPages, p + 1))} disabled={medicalSafePage >= medicalTotalPages} className="text-[10px] sm:text-xs">
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Vaccination Records Tab */}
          {activeTab === 'vaccination' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1" htmlFor="vaccinationSearch">Search</label>
                  <input
                    id="vaccinationSearch"
                    value={vaccinationSearch}
                    onChange={(e) => setVaccinationSearch(e.target.value)}
                    placeholder="Search by date, vaccine type, vaccinated by"
                    className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1" htmlFor="vaccinationSpeciesFilter">Species</label>
                  <select
                    id="vaccinationSpeciesFilter"
                    value={vaccinationSpeciesFilter}
                    onChange={(e) => setVaccinationSpeciesFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
              </div>

              {error ? <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-destructive">{error}</div> : null}
              {message ? <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-green-600">{message}</div> : null}

              <div className="w-full min-w-0 rounded-lg border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse min-w-[400px] sm:min-w-[600px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setVaccinationSortKey('date')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Date
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setVaccinationSortKey('vaccineType')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Vaccine Type
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden lg:table-cell">
                          <button type="button" onClick={() => setVaccinationSortKey('vaccineSource')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Source
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">
                          <button type="button" onClick={() => setVaccinationSortKey('vaccinatedBy')} className="inline-flex items-center gap-1 text-slate-100 hover:text-white transition-colors">
                            Vaccinated By
                          </button>
                        </th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden md:table-cell">Reason</th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden xl:table-cell">Disease</th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap hidden md:table-cell">Notes</th>
                        <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsLoading ? (
                        <tr>
                          <td colSpan={8} className="py-6 sm:py-10 text-center text-slate-400 text-xs sm:text-sm">
                            <div className="flex flex-col items-center gap-1 sm:gap-2">
                              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                              <span>Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : vaccinationPageItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 sm:py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-1">
                              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                              <span className="text-xs sm:text-sm font-medium">No vaccination records found.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        vaccinationPageItems.map((r, idx) => (
                          <tr key={r.id} className={`border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm">{r.date || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm max-w-[120px] truncate" title={r.vaccineType}>{r.vaccineType || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 hidden lg:table-cell text-xs sm:text-sm max-w-[120px] truncate" title={r.vaccineSource}>{r.vaccineSource || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm max-w-[120px] truncate" title={r.vaccinatedBy}>{r.vaccinatedBy || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 hidden md:table-cell text-xs sm:text-sm max-w-[120px] truncate" title={r.reason}>{r.reason || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-300 hidden xl:table-cell text-xs sm:text-sm">{r.disease || 'N/A'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 max-w-[150px] truncate text-slate-400 text-[10px] sm:text-xs hidden md:table-cell" title={r.notes}>{r.notes || '—'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex gap-1">
                                <Button variant="blue" size="xs" onClick={() => onView(r)} className="text-[10px] sm:text-xs">
                                  View
                                </Button>
                                <Button variant="outline" size="xs" onClick={() => onEdit(r)} className="text-[10px] sm:text-xs">
                                  Edit
                                </Button>
                                <Button variant="destructive" size="xs" onClick={() => deleteRecord(r)} disabled={deletingId === r.id} className="text-[10px] sm:text-xs">
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

              <div className="mt-3 sm:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Showing {filteredVaccination.length ? vaccinationStart + 1 : 0}-{Math.min(vaccinationStart + vaccinationPageSize, filteredVaccination.length)} of {filteredVaccination.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => setVaccinationPage((p) => Math.max(1, p - 1))} disabled={vaccinationSafePage <= 1} className="text-[10px] sm:text-xs">
                    Prev
                  </Button>
                  <div className="text-xs sm:text-sm">
                    Page {vaccinationSafePage} / {vaccinationTotalPages}
                  </div>
                  <Button variant="outline" size="xs" onClick={() => setVaccinationPage((p) => Math.min(vaccinationTotalPages, p + 1))} disabled={vaccinationSafePage >= vaccinationTotalPages} className="text-[10px] sm:text-xs">
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Medical Record Modal */}
      <AddMedicalRecordModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRecordAdded}
        selectedPetId={selectedPetId}
        title={activeTab === 'medical' ? 'Add Medical Record' : 'Add Vaccination Record'}
        recordType={activeTab}
      />
      
      {/* View Modal */}
      {viewOpen && selectedRecord ? (
        <Modal open={viewOpen} title={selectedRecord.recordType === 'vaccination' ? 'Vaccination Record' : 'Medical Record'} onClose={() => setViewOpen(false)} maxWidthClassName="max-w-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Date:</span> {selectedRecord.date || '—'}</div>
            <div><span className="font-medium">Type:</span> {selectedRecord.recordType === 'vaccination' ? 'Vaccination' : 'Medical'}</div>
            {selectedRecord.recordType === 'vaccination' ? (
              <>
                <div><span className="font-medium">Vaccine Type:</span> {selectedRecord.vaccineType || '—'}</div>
                <div><span className="font-medium">Source:</span> {selectedRecord.vaccineSource || '—'}</div>
                <div><span className="font-medium">Stock:</span> {selectedRecord.vaccineStock || '—'}</div>
                <div><span className="font-medium">Vaccinated By:</span> {selectedRecord.vaccinatedBy || '—'}</div>
                <div><span className="font-medium">Reason:</span> {selectedRecord.reason || '—'}</div>
                <div><span className="font-medium">Disease:</span> {selectedRecord.disease || 'N/A'}</div>
                {selectedRecord.notes && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 whitespace-pre-wrap">{selectedRecord.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <span className="font-medium">Results:</span>
                  <p className="mt-1 whitespace-pre-wrap">{selectedRecord.results || '—'}</p>
                </div>
                <div><span className="font-medium">Veterinarian:</span> {selectedRecord.veterinarian || '—'}</div>
                {selectedRecord.notes && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 whitespace-pre-wrap">{selectedRecord.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      ) : null}
      
      {/* Edit Modal */}
      {editOpen && selectedRecord && editForm ? (
        <Modal open={editOpen} title="Edit Record" onClose={() => setEditOpen(false)} maxWidthClassName="max-w-lg">
          <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
            <div className="space-y-4">
              {formError ? (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    value={editForm.date}
                    onChange={onEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                {editForm.recordType === 'vaccination' ? (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccine Type</label>
                      <input
                        name="vaccineType"
                        value={editForm.vaccineType}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
                      <input
                        name="vaccineSource"
                        value={editForm.vaccineSource}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccine Stock</label>
                      <input
                        name="vaccineStock"
                        value={editForm.vaccineStock}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
                      <input
                        name="vaccinatedBy"
                        value={editForm.vaccinatedBy}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Reason</label>
                      <select
                        name="reason"
                        value={editForm.reason}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                        name="hasDisease"
                        value={editForm.hasDisease ? 'yes' : 'no'}
                        onChange={(e) => setEditForm({ ...editForm, hasDisease: e.target.value === 'yes' })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {editForm.hasDisease && (
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Disease</label>
                        <input
                          name="disease"
                          value={editForm.disease}
                          onChange={onEditChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          placeholder="Specify disease"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        rows={3}
                        value={editForm.notes}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Results</label>
                      <textarea
                        name="results"
                        rows={6}
                        value={editForm.results}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
                      <input
                        name="veterinarian"
                        type="text"
                        value={editForm.veterinarian}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Enter veterinarian name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        rows={4}
                        value={editForm.notes}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="bg-green-700 hover:bg-green-800 text-white rounded-xl"
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </OwnerSidebarLayout>
  );
};

export default MedicalRecords;
