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
    if (!user) throw new Error('Not logged in.');
    const db = getDatabase(app);
    const mapSnap = await get(ref(db, `ownerUidMap/${user.uid}`));
    if (!mapSnap.exists()) throw new Error('No owner profile linked to this account.');
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
        setError(e?.message || 'Failed to load selected pet.');
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
        setError(e?.message || 'Failed to load medical records.');
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
              disease: editForm.hasDisease ? editForm.disease : '',
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
      setFormError(err?.message || 'Failed to update record.');
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
      setError(err?.message || 'Failed to delete record.');
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
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Records for your currently selected pet.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)} 
          disabled={!selectedPetId}
        >
          Add Record
        </Button>
      </div>

      {!selectedPetId ? (
        <div className="bg-card rounded-lg shadow-md p-6">
          <p className="mb-4">No selected pet. Select a pet first.</p>
          <Button asChild>
            <Link to="/my-pets">Select Pet</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 border-b border-border">
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

          {/* Medical Records Tab */}
          {activeTab === 'medical' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="medicalSearch">Search</label>
                  <input
                    id="medicalSearch"
                    value={medicalSearch}
                    onChange={(e) => setMedicalSearch(e.target.value)}
                    placeholder="Search by date, veterinarian, results"
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
                <div className="flex items-end">
                  <Button onClick={() => setIsAddModalOpen(true)}>Add New</Button>
                </div>
              </div>

              {error ? <div className="mb-3 text-sm text-destructive">{error}</div> : null}
              {message ? <div className="mb-3 text-sm text-green-600">{message}</div> : null}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setMedicalSortKey('date')} className="font-semibold hover:underline">
                          Date
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setMedicalSortKey('results')} className="font-semibold hover:underline">
                          Results
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setMedicalSortKey('veterinarian')} className="font-semibold hover:underline">
                          Veterinarian
                        </button>
                      </th>
                      <th className="py-2 pr-4">Notes</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : medicalPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No medical records found.
                        </td>
                      </tr>
                    ) : (
                      medicalPageItems.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4">{r.date || '—'}</td>
                          <td className="py-2 pr-4 max-w-xs truncate">{r.results ? r.results.substring(0, 50) + (r.results.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-2 pr-4">{r.veterinarian || '—'}</td>
                          <td className="py-2 pr-4 max-w-xs truncate">{r.notes ? r.notes.substring(0, 50) + (r.notes.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => onView(r)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteRecord(r)} disabled={deletingId === r.id}>
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

              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredMedical.length ? medicalStart + 1 : 0}-{Math.min(medicalStart + medicalPageSize, filteredMedical.length)} of {filteredMedical.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMedicalPage((p) => Math.max(1, p - 1))} disabled={medicalSafePage <= 1}>
                    Prev
                  </Button>
                  <div className="text-sm">
                    Page {medicalSafePage} / {medicalTotalPages}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setMedicalPage((p) => Math.min(medicalTotalPages, p + 1))} disabled={medicalSafePage >= medicalTotalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Vaccination Records Tab */}
          {activeTab === 'vaccination' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="vaccinationSearch">Search</label>
                  <input
                    id="vaccinationSearch"
                    value={vaccinationSearch}
                    onChange={(e) => setVaccinationSearch(e.target.value)}
                    placeholder="Search by date, vaccine type, vaccinated by"
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
                <div className="flex items-end">
                  <Button onClick={() => setIsAddModalOpen(true)}>Add New</Button>
                </div>
              </div>

              {error ? <div className="mb-3 text-sm text-destructive">{error}</div> : null}
              {message ? <div className="mb-3 text-sm text-green-600">{message}</div> : null}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setVaccinationSortKey('date')} className="font-semibold hover:underline">
                          Date
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setVaccinationSortKey('vaccineType')} className="font-semibold hover:underline">
                          Vaccine Type
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setVaccinationSortKey('vaccineSource')} className="font-semibold hover:underline">
                          Source
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => setVaccinationSortKey('vaccinatedBy')} className="font-semibold hover:underline">
                          Vaccinated By
                        </button>
                      </th>
                      <th className="py-2 pr-4">Reason</th>
                      <th className="py-2 pr-4">Disease</th>
                      <th className="py-2 pr-4">Notes</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : vaccinationPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-muted-foreground">
                          No vaccination records found.
                        </td>
                      </tr>
                    ) : (
                      vaccinationPageItems.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-b-0">
                          <td className="py-2 pr-4">{r.date || '—'}</td>
                          <td className="py-2 pr-4">{r.vaccineType || '—'}</td>
                          <td className="py-2 pr-4">{r.vaccineSource || '—'}</td>
                          <td className="py-2 pr-4">{r.vaccinatedBy || '—'}</td>
                          <td className="py-2 pr-4">{r.reason || '—'}</td>
                          <td className="py-2 pr-4">{r.disease || 'N/A'}</td>
                          <td className="py-2 pr-4 max-w-xs truncate">{r.notes ? r.notes.substring(0, 50) + (r.notes.length > 50 ? '...' : '') : '—'}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => onView(r)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteRecord(r)} disabled={deletingId === r.id}>
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

              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredVaccination.length ? vaccinationStart + 1 : 0}-{Math.min(vaccinationStart + vaccinationPageSize, filteredVaccination.length)} of {filteredVaccination.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setVaccinationPage((p) => Math.max(1, p - 1))} disabled={vaccinationSafePage <= 1}>
                    Prev
                  </Button>
                  <div className="text-sm">
                    Page {vaccinationSafePage} / {vaccinationTotalPages}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setVaccinationPage((p) => Math.min(vaccinationTotalPages, p + 1))} disabled={vaccinationSafePage >= vaccinationTotalPages}>
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccine Source</label>
                      <input
                        name="vaccineSource"
                        value={editForm.vaccineSource}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccine Stock</label>
                      <input
                        name="vaccineStock"
                        value={editForm.vaccineStock}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Vaccinated By</label>
                      <input
                        name="vaccinatedBy"
                        value={editForm.vaccinatedBy}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Reason</label>
                      <select
                        name="reason"
                        value={editForm.reason}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Veterinarian</label>
                      <input
                        name="veterinarian"
                        type="text"
                        value={editForm.veterinarian}
                        onChange={onEditChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
