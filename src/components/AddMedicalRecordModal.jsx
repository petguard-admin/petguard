import React, { useMemo, useState, useEffect } from 'react';
import { getDatabase, get, push, ref, set } from 'firebase/database';
import { Button } from './ui/Button';
import Modal from './Modal';
import { useAuth } from '../AuthContext';
import app from '../firebaseConfig';

/**
 * AddMedicalRecordModal - Modal for adding vaccination or medical records
 */
const AddMedicalRecordModal = ({
  open,
  onClose,
  onSuccess,
  selectedPetId,
  title = 'Add Medical Record',
}) => {
  const { user, loading } = useAuth();

  const [recordType, setRecordType] = useState('vaccination');

  const [vaccinationForm, setVaccinationForm] = useState({
    date: '',
    vaccineSource: '',
    vaccineSourceOther: '',
    vaccineType: '',
    vaccineTypeOther: '',
    vaccineStock: '',
    vaccinatedBy: '',
    reason: '',
    hasDisease: false,
    disease: '',
    notes: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    date: '',
    results: '',
    veterinarian: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRecordType('vaccination');
      setVaccinationForm({
        date: '',
        vaccineSource: '',
        vaccineSourceOther: '',
        vaccineType: '',
        vaccineTypeOther: '',
        vaccineStock: '',
        vaccinatedBy: '',
        reason: '',
        hasDisease: false,
        disease: '',
        notes: '',
      });
      setMedicalForm({
        date: '',
        results: '',
        veterinarian: '',
        notes: '',
      });
      setError('');
    }
  }, [open]);
  
  const showVaccineSourceOther = vaccinationForm.vaccineSource === 'others';
  const showVaccineTypeOther = vaccinationForm.vaccineType === 'others';

  const getOwnerId = React.useCallback(async () => {
    if (!user) throw new Error('Please log in to continue.');
    const db = getDatabase(app);
    const mapSnap = await get(ref(db, `ownerUidMap/${user.uid}`));
    if (!mapSnap.exists()) throw new Error('No account found. Please contact support.');
    return String(mapSnap.val() || '');
  }, [user]);

  const canSubmit = useMemo(() => {
    if (!selectedPetId) return false;

    if (recordType === 'vaccination') {
      return Boolean(vaccinationForm.date && vaccinationForm.vaccineType && vaccinationForm.vaccinatedBy);
    }

    return Boolean(medicalForm.date && medicalForm.results);
  }, [recordType, vaccinationForm, medicalForm, selectedPetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    if (!user) {
      setError('Please log in to continue.');
      return;
    }
    if (!selectedPetId) {
      setError('Please select a pet first.');
      return;
    }

    if (!canSubmit) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const db = getDatabase(app);
      const ownerId = await getOwnerId();
      const vaccinationPayload = {
        recordType: 'vaccination',
        date: vaccinationForm.date,
        vaccineSource: vaccinationForm.vaccineSource === 'others'
          ? vaccinationForm.vaccineSourceOther
          : vaccinationForm.vaccineSource,
        vaccineType: vaccinationForm.vaccineType === 'others'
          ? vaccinationForm.vaccineTypeOther
          : vaccinationForm.vaccineType,
        vaccineStock: vaccinationForm.vaccineStock,
        vaccinatedBy: vaccinationForm.vaccinatedBy,
        reason: vaccinationForm.reason,
        hasDisease: vaccinationForm.hasDisease,
        disease: vaccinationForm.hasDisease ? vaccinationForm.disease : '',
        notes: vaccinationForm.notes,
      };
      
      const payload =
        recordType === 'vaccination'
          ? vaccinationPayload
          : {
              recordType: 'medical',
              date: medicalForm.date,
              results: medicalForm.results,
              veterinarian: medicalForm.veterinarian,
              notes: medicalForm.notes,
            };

      const recRef = push(ref(db, `medicalRecordsByPet/${selectedPetId}`));
      const rec = {
        ...payload,
        id: recRef.key,
        petId: selectedPetId,
        ownerId,
        createdAt: Date.now(),
      };
      await set(recRef, rec);

      onSuccess?.(rec);
      onClose?.();
    } catch (err) {
      setError('Could not save record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose?.();
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} maxWidthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            {error && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Record Type
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="vaccination">Vaccination</option>
                <option value="medical">Medical</option>
              </select>
            </div>
            {recordType === 'vaccination' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="vDate">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="vDate"
                    type="date"
                    value={vaccinationForm.date}
                    onChange={(e) => setVaccinationForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" htmlFor="vSource">
                      Vaccine source
                    </label>
                    <select
                      id="vSource"
                      value={vaccinationForm.vaccineSource}
                      onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineSource: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="BAI">BAI</option>
                      <option value="DARFO">DARFO</option>
                      <option value="PLGU">PLGU</option>
                      <option value="MLGU">MLGU</option>
                      <option value="DOH">DOH</option>
                      <option value="NGO">NGO</option>
                      <option value="OIE">OIE</option>
                      <option value="others">Others</option>
                    </select>
                    {showVaccineSourceOther && (
                      <input
                        value={vaccinationForm.vaccineSourceOther}
                        onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineSourceOther: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                        placeholder="Specify source"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" htmlFor="vType">
                      Vaccine type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vType"
                      value={vaccinationForm.vaccineType}
                      onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineType: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="anti-rabies">Anti-Rabies</option>
                      <option value="others">Others</option>
                    </select>
                    {showVaccineTypeOther && (
                      <input
                        value={vaccinationForm.vaccineTypeOther}
                        onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineTypeOther: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                        placeholder="Specify type"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" htmlFor="vStock">
                      Vaccine stock
                    </label>
                    <input
                      id="vStock"
                      type="text"
                      value={vaccinationForm.vaccineStock}
                      onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccineStock: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter vaccine stock"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" htmlFor="vBy">
                      Vaccinated by <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="vBy"
                      type="text"
                      value={vaccinationForm.vaccinatedBy}
                      onChange={(e) => setVaccinationForm((p) => ({ ...p, vaccinatedBy: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter vaccinated by"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="vReason">
                    Reason
                  </label>
                  <select
                    id="vReason"
                    value={vaccinationForm.reason}
                    onChange={(e) => setVaccinationForm((p) => ({ ...p, reason: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="Mass">Mass</option>
                    <option value="Routine">Routine</option>
                    <option value="Outbreak">Outbreak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="vHasDisease">
                    Has Disease
                  </label>
                  <select
                    id="vHasDisease"
                    value={vaccinationForm.hasDisease ? 'yes' : 'no'}
                    onChange={(e) => setVaccinationForm((p) => ({ ...p, hasDisease: e.target.value === 'yes' }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {vaccinationForm.hasDisease && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" htmlFor="vDisease">
                      Disease
                    </label>
                    <input
                      id="vDisease"
                      type="text"
                      value={vaccinationForm.disease}
                      onChange={(e) => setVaccinationForm((p) => ({ ...p, disease: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Specify disease"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="vNotes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="vNotes"
                    rows={4}
                    value={vaccinationForm.notes}
                    onChange={(e) => setVaccinationForm((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="mDate">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mDate"
                    type="date"
                    value={medicalForm.date}
                    onChange={(e) => setMedicalForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="mResults">
                    Results <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="mResults"
                    rows={6}
                    value={medicalForm.results}
                    onChange={(e) => setMedicalForm((p) => ({ ...p, results: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="mVeterinarian">
                    Veterinarian
                  </label>
                  <input
                    id="mVeterinarian"
                    type="text"
                    value={medicalForm.veterinarian}
                    onChange={(e) => setMedicalForm((p) => ({ ...p, veterinarian: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Enter veterinarian name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1" htmlFor="mNotes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="mNotes"
                    rows={4}
                    value={medicalForm.notes}
                    onChange={(e) => setMedicalForm((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                type="submit"
                disabled={submitting || !canSubmit}
              >
                {submitting ? 'Saving...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddMedicalRecordModal;
