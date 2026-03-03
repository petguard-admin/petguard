import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database';

import app from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import OwnerSidebarLayout from './OwnerSidebarLayout';

const MedicalRecords = () => {
  const { user, loading } = useAuth();

  const [selectedPetId, setSelectedPetId] = useState('');
  const [records, setRecords] = useState([]);

  const [recordType, setRecordType] = useState('vaccination');

  const [vaccinationForm, setVaccinationForm] = useState({
    date: '',
    vaccineSource: '',
    vaccineType: '',
    vaccineStock: '',
    vaccinatedBy: '',
    notes: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    date: '',
    results: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const db = getDatabase(app);

    const selectedRef = ref(db, `selectedPetByOwner/${user.uid}`);
    const unsubSelected = onValue(selectedRef, (snap) => {
      setSelectedPetId(snap.exists() ? snap.val() : '');
    });

    return () => unsubSelected();
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!selectedPetId) {
      setRecords([]);
      return;
    }

    const db = getDatabase(app);
    const recordsRef = ref(db, `medicalRecordsByPet/${selectedPetId}`);

    const unsub = onValue(recordsRef, (snap) => {
      if (!snap.exists()) {
        setRecords([]);
        return;
      }
      const val = snap.val();
      const arr = Object.keys(val).map((id) => ({ id, ...val[id] }));
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecords(arr);
    });

    return () => unsub();
  }, [user, loading, selectedPetId]);

  const canSubmit = useMemo(() => {
    if (!selectedPetId) return false;

    if (recordType === 'vaccination') {
      return Boolean(vaccinationForm.date && vaccinationForm.vaccineType && vaccinationForm.vaccinatedBy);
    }

    return Boolean(medicalForm.date && medicalForm.results);
  }, [recordType, vaccinationForm, medicalForm, selectedPetId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (loading) return;
    if (!user) {
      setError('Please login first.');
      return;
    }
    if (!selectedPetId) {
      setError('No selected pet. Go to My Pets and select a pet.');
      return;
    }

    if (!canSubmit) {
      setError('Please fill out the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const db = getDatabase(app);
      const recRef = push(ref(db, `medicalRecordsByPet/${selectedPetId}`));

      const base = {
        id: recRef.key,
        petId: selectedPetId,
        ownerUid: user.uid,
        recordType,
        createdAt: Date.now(),
      };

      const payload =
        recordType === 'vaccination'
          ? {
              ...base,
              date: vaccinationForm.date,
              vaccineSource: vaccinationForm.vaccineSource,
              vaccineType: vaccinationForm.vaccineType,
              vaccineStock: vaccinationForm.vaccineStock,
              vaccinatedBy: vaccinationForm.vaccinatedBy,
              notes: vaccinationForm.notes,
            }
          : {
              ...base,
              date: medicalForm.date,
              results: medicalForm.results,
            };

      await set(recRef, payload);

      if (recordType === 'vaccination') {
        setVaccinationForm({
          date: '',
          vaccineSource: '',
          vaccineType: '',
          vaccineStock: '',
          vaccinatedBy: '',
          notes: '',
        });
      } else {
        setMedicalForm({ date: '', results: '' });
      }

      setMessage('Record saved.');
    } catch (err) {
      setError(err?.message || 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (rec) => {
    setError('');
    setMessage('');
    setEditingId(rec.id);
    if (rec.recordType === 'vaccination') {
      setEditForm({
        recordType: 'vaccination',
        date: rec.date || '',
        vaccineSource: rec.vaccineSource || '',
        vaccineType: rec.vaccineType || '',
        vaccineStock: rec.vaccineStock || '',
        vaccinatedBy: rec.vaccinatedBy || '',
        notes: rec.notes || '',
      });
    } else {
      setEditForm({
        recordType: 'medical',
        date: rec.date || '',
        results: rec.results || '',
      });
    }
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm(null);
  };

  const onEditChange = (e) => {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    if (!user || !selectedPetId || !editingId || !editForm) return;
    setError('');
    setMessage('');
    setSavingEdit(true);
    try {
      const db = getDatabase(app);
      const recPath = ref(db, `medicalRecordsByPet/${selectedPetId}/${editingId}`);

      const patch =
        editForm.recordType === 'vaccination'
          ? {
              date: editForm.date,
              vaccineSource: editForm.vaccineSource,
              vaccineType: editForm.vaccineType,
              vaccineStock: editForm.vaccineStock,
              vaccinatedBy: editForm.vaccinatedBy,
              notes: editForm.notes,
              updatedAt: Date.now(),
            }
          : {
              date: editForm.date,
              results: editForm.results,
              updatedAt: Date.now(),
            };

      await update(recPath, patch);
      setMessage('Record updated.');
      cancelEdit();
    } catch (err) {
      setError(err?.message || 'Failed to update record.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteRecord = async (recId) => {
    if (!user || !selectedPetId || !recId) return;
    const ok = window.confirm('Delete this record?');
    if (!ok) return;

    setError('');
    setMessage('');
    setDeletingId(recId);
    try {
      const db = getDatabase(app);
      await remove(ref(db, `medicalRecordsByPet/${selectedPetId}/${recId}`));
      if (editingId === recId) cancelEdit();
      setMessage('Record deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete record.');
    } finally {
      setDeletingId('');
    }
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
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Records for your currently selected pet.</p>
      </div>

      {!selectedPetId ? (
        <div className="bg-card rounded-lg shadow-md p-6">
          <p className="mb-4">No selected pet. Select a pet first.</p>
          <Button asChild>
            <Link to="/my-pets">Select Pet</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="font-semibold mb-4">Add record</h2>

              {error ? (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                  {message}
                </div>
              ) : null}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="recordType">Record type</label>
                  <select
                    id="recordType"
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="vaccination">Vaccination</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>

                {recordType === 'vaccination' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="vDate">Date *</label>
                      <input
                        id="vDate"
                        type="date"
                        value={vaccinationForm.date}
                        onChange={(e) => setVaccinationForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="vSource">Vaccine source</label>
                        <input
                          id="vSource"
                          value={vaccinationForm.vaccineSource}
                          onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineSource: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="vType">Vaccine type *</label>
                        <input
                          id="vType"
                          value={vaccinationForm.vaccineType}
                          onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineType: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="vStock">Vaccine stock</label>
                        <input
                          id="vStock"
                          value={vaccinationForm.vaccineStock}
                          onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineStock: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="vBy">Vaccinated by *</label>
                        <input
                          id="vBy"
                          value={vaccinationForm.vaccinatedBy}
                          onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccinatedBy: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="vNotes">Notes (optional)</label>
                      <textarea
                        id="vNotes"
                        rows={4}
                        value={vaccinationForm.notes}
                        onChange={(e) => setVaccinationForm((p) => ({ ...p, notes: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="mDate">Date *</label>
                      <input
                        id="mDate"
                        type="date"
                        value={medicalForm.date}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="mResults">Results *</label>
                      <textarea
                        id="mResults"
                        rows={6}
                        value={medicalForm.results}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, results: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
                  {submitting ? 'Saving...' : 'Save record'}
                </Button>
              </form>
            </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="font-semibold mb-4">Record history</h2>

              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records yet for this pet.</p>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <div key={r.id} className="rounded-md border border-input p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {r.recordType === 'vaccination' ? 'Vaccination' : 'Medical'}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.date || '—'}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {editingId === r.id ? (
                          <>
                            <Button onClick={saveEdit} disabled={savingEdit}>
                              {savingEdit ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => startEdit(r)}>
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => deleteRecord(r.id)} disabled={deletingId === r.id}>
                              {deletingId === r.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}
                      </div>

                      {editingId === r.id && editForm ? (
                        editForm.recordType === 'vaccination' ? (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editDate-${r.id}`}>Date</label>
                              <input
                                id={`editDate-${r.id}`}
                                name="date"
                                type="date"
                                value={editForm.date}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editType-${r.id}`}>Vaccine type</label>
                              <input
                                id={`editType-${r.id}`}
                                name="vaccineType"
                                value={editForm.vaccineType}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editSource-${r.id}`}>Vaccine source</label>
                              <input
                                id={`editSource-${r.id}`}
                                name="vaccineSource"
                                value={editForm.vaccineSource}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editStock-${r.id}`}>Vaccine stock</label>
                              <input
                                id={`editStock-${r.id}`}
                                name="vaccineStock"
                                value={editForm.vaccineStock}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-1" htmlFor={`editBy-${r.id}`}>Vaccinated by</label>
                              <input
                                id={`editBy-${r.id}`}
                                name="vaccinatedBy"
                                value={editForm.vaccinatedBy}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-1" htmlFor={`editNotes-${r.id}`}>Notes</label>
                              <textarea
                                id={`editNotes-${r.id}`}
                                name="notes"
                                rows={3}
                                value={editForm.notes}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-3 text-sm">
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editDate-${r.id}`}>Date</label>
                              <input
                                id={`editDate-${r.id}`}
                                name="date"
                                type="date"
                                value={editForm.date}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1" htmlFor={`editResults-${r.id}`}>Results</label>
                              <textarea
                                id={`editResults-${r.id}`}
                                name="results"
                                rows={5}
                                value={editForm.results}
                                onChange={onEditChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        )
                      ) : r.recordType === 'vaccination' ? (
                        <div className="mt-2 text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Type:</span> {r.vaccineType || '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Source:</span> {r.vaccineSource || '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stock:</span> {r.vaccineStock || '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vaccinated by:</span> {r.vaccinatedBy || '—'}
                          </div>
                          {r.notes ? (
                            <div>
                              <span className="text-muted-foreground">Notes:</span> {r.notes}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm">
                          <div className="text-muted-foreground mb-1">Results:</div>
                          <div className="whitespace-pre-wrap">{r.results || '—'}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </OwnerSidebarLayout>
  );
};

export default MedicalRecords;
