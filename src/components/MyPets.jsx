import React, { useEffect, useMemo, useState } from 'react';

import { getDatabase, get, ref, remove, update, set } from 'firebase/database';

import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import ImageUpload from './ImageUpload';
import RegisterPetModal from './RegisterPetModal';
import Modal from './Modal';
import app from '../firebaseConfig';
import OwnerSidebarLayout from './OwnerSidebarLayout';
import { logAuditTrail } from '../utils/auditLogger';

const MyPets = () => {
  const { user, loading } = useAuth();

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Register pet modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  // Edit pet modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Helper to check conditional fields
  const isEditFemale = editForm?.sex === 'Female';
  const showEditPetOriginOther = editForm?.petOrigin === 'others';
  const showEditOwnershipOther = editForm?.ownership === 'others';
  const showEditTagTypeOther = editForm?.tagType === 'others';

  const getOwnerId = React.useCallback(async () => {
    if (!user) throw new Error('Please log in to continue.');
    const db = getDatabase(app);
    const mapSnap = await get(ref(db, `ownerUidMap/${user.uid}`));
    if (!mapSnap.exists()) throw new Error('No account found. Please contact support.');
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

        const [petsSnap, selectedSnap] = await Promise.all([
          get(ref(db, `petsByOwner/${ownerId}`)),
          get(ref(db, `selectedPetByOwner/${ownerId}`)),
        ]);
        const petsVal = petsSnap.exists() ? petsSnap.val() : {};
        const arr = Object.keys(petsVal || {}).map((id) => ({ id, ...petsVal[id] }));
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const selected = selectedSnap.exists() ? String(selectedSnap.val() || '') : '';
        const effectiveSelected = selected || arr[0]?.id || '';
        if (!selected && effectiveSelected) {
          await set(ref(db, `selectedPetByOwner/${ownerId}`), effectiveSelected);
        }

        if (!active) return;
        setPets(arr);
        setSelectedPetId(effectiveSelected);
      } catch (e) {
        if (!active) return;
        setError('Could not load pets. Please try again.');
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading, getOwnerId]);

  const selectedPet = useMemo(() => {
    return pets.find((p) => p.id === selectedPetId) || null;
  }, [pets, selectedPetId]);

  useEffect(() => {
    if (!selectedPet) {
      setEditing(false);
      setEditForm(null);
      return;
    }

    if (!editing) {
      setEditForm({
        image: selectedPet.image || '',
        petName: selectedPet.petName || '',
        petOrigin: selectedPet.petOrigin || '',
        petOriginOther: '',
        ownership: selectedPet.ownership || '',
        ownershipOther: '',
        habitat: selectedPet.habitat || '',
        species: selectedPet.species || '',
        sex: selectedPet.sex || '',
        pregnant: selectedPet.pregnant || false,
        lactating: selectedPet.lactating || false,
        puppyCount: selectedPet.puppyCount || '',
        spayedNeutered: selectedPet.spayedNeutered || '',
        weightKgs: selectedPet.weightKgs ?? '',
        breed: selectedPet.breed || '',
        animalColor: selectedPet.animalColor || '',
        dateOfBirth: selectedPet.dateOfBirth || '',
        tagType: selectedPet.tagType || '',
        tagTypeOther: '',
        tagNumber: selectedPet.tagNumber || '',
        contactWithOtherAnimals: selectedPet.contactWithOtherAnimals || '',
      });
    }
  }, [selectedPetId, selectedPet, editing]);

  const onSwitch = async (petId) => {
    if (!user) return;
    try {
      const db = getDatabase(app);
      const ownerId = await getOwnerId();
      await set(ref(db, `selectedPetByOwner/${ownerId}`), petId);
      setSelectedPetId(petId);
      setEditing(false);
      setIsEditModalOpen(false);
    } catch (e) {
      setError('Could not switch pet. Please try again.');
    }
  };
  
  const openEditModal = () => {
    setEditing(true);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setEditing(false);
    setIsEditModalOpen(false);
  };

  const onEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const savePet = async () => {
    if (!user || !selectedPetId || !editForm) return;
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const db = getDatabase(app);
      const ownerId = await getOwnerId();
      // Prepare data with "others" values
      const updateData = {
        ...editForm,
        petOrigin: editForm.petOrigin === 'others' ? editForm.petOriginOther : editForm.petOrigin,
        ownership: editForm.ownership === 'others' ? editForm.ownershipOther : editForm.ownership,
        tagType: editForm.tagType === 'others' ? editForm.tagTypeOther : editForm.tagType,
        weightKgs: editForm.weightKgs === '' ? '' : Number(editForm.weightKgs),
        puppyCount: editForm.puppyCount ? Number(editForm.puppyCount) : null,
        updatedAt: Date.now(),
      };
      // Clean up temporary fields
      delete updateData.petOriginOther;
      delete updateData.ownershipOther;
      delete updateData.tagTypeOther;
      
      await update(ref(db, `petsByOwner/${ownerId}/${selectedPetId}`), updateData);

      setPets((prev) =>
        prev.map((p) =>
          p.id === selectedPetId
            ? { ...p, ...editForm, weightKgs: editForm.weightKgs === '' ? '' : Number(editForm.weightKgs), updatedAt: Date.now() }
            : p
        )
      );
      closeEditModal();
      setMessage('Pet updated.');
      await logAuditTrail('update', selectedPetId, 'pet', selectedPet, updateData);
    } catch (err) {
      setError('Could not update pet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPetAge = (dateOfBirth) => {
  if (!dateOfBirth) return "—";

  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years <= 0) {
      return `${months} month${months !== 1 ? "s" : ""}`;
    }

    return `${years} year${years !== 1 ? "s" : ""}${
      months > 0 ? ` ${months} mo` : ""
    }`;
  } catch {
    return "—";
  }
};

  const reloadPets = React.useCallback(async () => {
  try {
    const db = getDatabase(app);
    const ownerId = await getOwnerId();

    const petsSnap = await get(ref(db, `petsByOwner/${ownerId}`));
    const petsVal = petsSnap.exists() ? petsSnap.val() : {};

    const arr = Object.keys(petsVal || {}).map((id) => ({
      id,
      ...petsVal[id],
    }));

    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setPets(arr);

    // auto-select newest pet
    if (arr.length) {
      setSelectedPetId(arr[0].id);
    }
  } catch (e) {
    setError('Could not reload pets. Please try again.');
  }
}, [getOwnerId]);

  const deletePet = async () => {
    if (!user || !selectedPetId) return;

    const ok = window.confirm('Delete this pet? This cannot be undone.');
    if (!ok) return;

    setError('');
    setMessage('');
    setDeleting(true);

    try {
      const deletingId = selectedPetId;
      const db = getDatabase(app);
      const ownerId = await getOwnerId();
      await remove(ref(db, `petsByOwner/${ownerId}/${deletingId}`));

      const selectedRef = ref(db, `selectedPetByOwner/${ownerId}`);
      const selectedSnap = await get(selectedRef);
      if (selectedSnap.exists() && String(selectedSnap.val() || '') === deletingId) {
        const remainingSnap = await get(ref(db, `petsByOwner/${ownerId}`));
        const remainingVal = remainingSnap.exists() ? remainingSnap.val() : {};
        const nextId = Object.keys(remainingVal || {})[0] || '';
        await set(selectedRef, nextId);
      }

      setPets((prev) => {
        const remaining = prev.filter((p) => p.id !== deletingId);
        if (selectedPetId === deletingId) {
          setSelectedPetId(remaining[0]?.id || '');
        }
        return remaining;
      });
      setMessage('Pet deleted.');
      await logAuditTrail('delete', selectedPetId, 'pet', selectedPet, null);
    } catch (err) {
      setError('Could not delete pet. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4">Please login to view your pets.</p>
        <Button asChild>
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

    return (
  <OwnerSidebarLayout title="My Pets">
    
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div>
        <p className="text-slate-600 text-sm">
          Manage your pets and select an active profile.
        </p>
      </div>
      <Button
        variant="green"
        onClick={() => setIsRegisterModalOpen(true)}
      >
        + Register Pet
      </Button>
    </div>

    {/* Alerts */}
    {message && (
      <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        {message}
      </div>
    )}

    {error && (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )}

    {/* Empty State */}
    {!pets.length ? (
      <div className="bg-white border border-green-100 rounded-3xl p-10 text-center shadow-sm">
        <p className="text-slate-600 mb-4">
          You have not registered any pets yet.
        </p>
        <Button
          variant="green"
          onClick={() => setIsRegisterModalOpen(true)}
        >
          Register your first pet
        </Button>
      </div>
    ) : (
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT: Pet List */}
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Your Pets</h2>

          <div className="space-y-3">
            {pets.map((pet) => {
              const active = pet.id === selectedPetId;

              return (
                <button
                  key={pet.id}
                  onClick={() => onSwitch(pet.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    active
                      ? "border-green-600 bg-green-50"
                      : "border-slate-200 hover:bg-green-50"
                  }`}
                >
                  {/* Image */}
                  <div className="w-12 h-12 rounded-xl bg-green-100 overflow-hidden shrink-0">
                    {pet.image ? (
                      <img
                        src={pet.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-green-700">
                        🐾
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-left">
                    <div className="font-medium text-slate-900">
                      {pet.petName || "Unnamed"}
                    </div>
                    <p className="text-sm text-slate-500">
  {pet.species || "—"} • {pet.breed || "—"} •{" "}
  {getPetAge(pet.dateOfBirth)}
</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Pet Details */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-green-100 shadow-sm p-6">
          {selectedPet ? (
            <>
              {/* Top Section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-green-100 overflow-hidden">
                    {selectedPet.image ? (
                      <img
                        src={selectedPet.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-green-700">
                        🐾
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedPet.petName || "Unnamed Pet"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedPet.species || "—"} • {selectedPet.breed || "—"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="blue"
                    onClick={openEditModal}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={deletePet}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              {/* Pet Info View */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  ["Species", selectedPet.species],
                  ["Sex", selectedPet.sex],
                  ["Age", getPetAge(selectedPet.dateOfBirth)],
                  ["Weight", selectedPet.weightKgs ? `${selectedPet.weightKgs} kg` : null],
                  ["Color", selectedPet.animalColor],
                  ["Breed", selectedPet.breed],
                  ["Date of Birth", selectedPet.dateOfBirth],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="font-medium text-slate-900">
                      {value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select a pet to view details.</p>
          )}
        </div>
      </div>
    )}

    {/* Register Pet Modal */}
    <RegisterPetModal
      open={isRegisterModalOpen}
      onClose={() => setIsRegisterModalOpen(false)}
      onSuccess={async () => {
        setIsRegisterModalOpen(false);
        setMessage('Pet registered successfully.');
        await reloadPets();
      }}
      title="Register Pet"
    />
    
    {/* Edit Pet Modal */}
    <Modal
      open={isEditModalOpen}
      title="Edit Pet"
      onClose={closeEditModal}
      maxWidthClassName="max-w-2xl"
    >
      {editForm && selectedPet && (
        <div className="max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div className="space-y-4">
            <div className="md:col-span-2">
              <ImageUpload
                value={editForm.image}
                onChange={({ url }) =>
                  setEditForm((prev) => ({ ...prev, image: url }))
                }
                folder="pets"
                label="Pet Photo"
                allowUrl={false}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {/* Pet Name */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pet Name</label>
                <input
                  name="petName"
                  value={editForm.petName}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Species */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Species</label>
                <select
                  name="species"
                  value={editForm.species}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>
              
              {/* Sex */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sex</label>
                <select
                  name="sex"
                  value={editForm.sex}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              {/* Breed */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Breed</label>
                <input
                  name="breed"
                  value={editForm.breed}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Color</label>
                <input
                  name="animalColor"
                  value={editForm.animalColor}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Weight */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                <input
                  name="weightKgs"
                  type="number"
                  step="0.1"
                  value={editForm.weightKgs}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Date of Birth */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Spayed/Neutered */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Spayed/Neutered</label>
                <select
                  name="spayedNeutered"
                  value={editForm.spayedNeutered}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              
              {/* Pet Origin */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pet Origin</label>
                <select
                  name="petOrigin"
                  value={editForm.petOrigin}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="local">Local</option>
                  <option value="others">Others</option>
                </select>
                {showEditPetOriginOther && (
                  <input
                    name="petOriginOther"
                    value={editForm.petOriginOther}
                    onChange={onEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify origin"
                  />
                )}
              </div>
              
              {/* Ownership */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ownership</label>
                <select
                  name="ownership"
                  value={editForm.ownership}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="household">Household</option>
                  <option value="community">Community</option>
                  <option value="others">Others</option>
                </select>
                {showEditOwnershipOther && (
                  <input
                    name="ownershipOther"
                    value={editForm.ownershipOther}
                    onChange={onEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify ownership"
                  />
                )}
              </div>
              
              {/* Tag Type */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tag Type</label>
                <select
                  name="tagType"
                  value={editForm.tagType}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="collar tag">Collar Tag</option>
                  <option value="microchip">Microchip</option>
                  <option value="tattoo code">Tattoo Code</option>
                  <option value="none">None</option>
                  <option value="others">Others</option>
                </select>
                {showEditTagTypeOther && (
                  <input
                    name="tagTypeOther"
                    value={editForm.tagTypeOther}
                    onChange={onEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify tag type"
                  />
                )}
              </div>
              
              {/* Tag Number */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tag Number</label>
                <input
                  name="tagNumber"
                  value={editForm.tagNumber}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              {/* Habitat */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Habitat</label>
                <select
                  name="habitat"
                  value={editForm.habitat}
                  onChange={onEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="caged">Caged</option>
                  <option value="free roaming">Free Roaming</option>
                  <option value="leashed">Leashed</option>
                  <option value="house only">House Only</option>
                </select>
              </div>
              
              {/* Contact with other animals */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Contact with other animals</label>
                <select
                  name="contactWithOtherAnimals"
                  value={editForm.contactWithOtherAnimals}
                  onChange={onEditChange}
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
            {isEditFemale && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-green-50/50 mt-4">
                <div className="font-medium text-sm text-green-800">Female-specific information</div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="pregnant"
                      checked={editForm.pregnant}
                      onChange={onEditChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="lactating"
                      checked={editForm.lactating}
                      onChange={onEditChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    Lactating with puppies
                  </label>
                </div>
                {editForm.lactating && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Number of puppies</label>
                    <input
                      name="puppyCount"
                      type="number"
                      min="0"
                      value={editForm.puppyCount}
                      onChange={onEditChange}
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
                onClick={closeEditModal}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                onClick={savePet}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  </OwnerSidebarLayout>
);  
};

export default MyPets;
