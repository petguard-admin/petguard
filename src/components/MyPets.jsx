import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getDatabase, onValue, ref, remove, set, update } from 'firebase/database';

import app from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';
import OwnerSidebarLayout from './OwnerSidebarLayout';

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

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const db = getDatabase(app);

    const petsRef = ref(db, `petsByOwner/${user.uid}`);
    const unsubPets = onValue(petsRef, (snap) => {
      if (!snap.exists()) {
        setPets([]);
        return;
      }

      const val = snap.val();
      const arr = Object.keys(val).map((id) => ({ id, ...val[id] }));
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPets(arr);
    });

    const selectedRef = ref(db, `selectedPetByOwner/${user.uid}`);
    const unsubSelected = onValue(selectedRef, (snap) => {
      setSelectedPetId(snap.exists() ? snap.val() : '');
    });

    return () => {
      unsubPets();
      unsubSelected();
    };
  }, [user, loading]);

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
        ownership: selectedPet.ownership || '',
        habitat: selectedPet.habitat || '',
        species: selectedPet.species || '',
        sex: selectedPet.sex || '',
        spayedNeutered: selectedPet.spayedNeutered || '',
        weightKgs: selectedPet.weightKgs ?? '',
        breed: selectedPet.breed || '',
        animalColor: selectedPet.animalColor || '',
        dateOfBirth: selectedPet.dateOfBirth || '',
        tagType: selectedPet.tagType || '',
        tagNumber: selectedPet.tagNumber || '',
        contactWithOtherAnimals: selectedPet.contactWithOtherAnimals || '',
      });
    }
  }, [selectedPetId, selectedPet, editing]);

  const onSwitch = async (petId) => {
    if (!user) return;
    const db = getDatabase(app);
    await set(ref(db, `selectedPetByOwner/${user.uid}`), petId);
  };

  const onEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const savePet = async () => {
    if (!user || !selectedPetId || !editForm) return;
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const db = getDatabase(app);
      await update(ref(db, `petsByOwner/${user.uid}/${selectedPetId}`), {
        ...editForm,
        weightKgs: editForm.weightKgs === '' ? '' : Number(editForm.weightKgs),
        updatedAt: Date.now(),
      });
      setEditing(false);
      setMessage('Pet updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update pet.');
    } finally {
      setSaving(false);
    }
  };

  const deletePet = async () => {
    if (!user || !selectedPetId) return;

    const ok = window.confirm('Delete this pet? This cannot be undone.');
    if (!ok) return;

    setError('');
    setMessage('');
    setDeleting(true);
    try {
      const db = getDatabase(app);
      await remove(ref(db, `petsByOwner/${user.uid}/${selectedPetId}`));

      // If we deleted the selected pet, switch to another pet (if any)
      const remaining = pets.filter((p) => p.id !== selectedPetId);
      const nextId = remaining[0]?.id || '';
      await set(ref(db, `selectedPetByOwner/${user.uid}`), nextId);

      setEditing(false);
      setEditForm(null);
      setMessage('Pet deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete pet.');
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
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Manage your pets and choose the active pet.</p>
        </div>
        <Button asChild>
          <Link to="/register-pet">Register Pet</Link>
        </Button>
      </div>

      {message ? (
        <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!pets.length ? (
        <div className="bg-card rounded-lg shadow-md p-6">
          <p className="mb-4">You haven't registered any pets yet.</p>
          <Button asChild>
            <Link to="/register-pet">Register your first pet</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="font-semibold mb-4">Your pets</div>
            <div className="space-y-2">
              {pets.map((pet) => {
                const active = pet.id === selectedPetId;
                return (
                  <button
                    key={pet.id}
                    onClick={() => onSwitch(pet.id)}
                    className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                      active ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{pet.petName || 'Unnamed Pet'}</div>
                    <div className="text-xs text-muted-foreground">
                      {pet.species || '—'} • {pet.breed || '—'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-lg shadow-md p-6">
            <h2 className="font-semibold mb-4">Selected pet</h2>

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

              {selectedPet ? (
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setEditing((v) => !v)}>
                      {editing ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button variant="destructive" onClick={deletePet} disabled={deleting}>
                      {deleting ? 'Deleting...' : 'Delete pet'}
                    </Button>
                    {editing ? (
                      <Button onClick={savePet} disabled={saving}>
                        {saving ? 'Saving...' : 'Save changes'}
                      </Button>
                    ) : null}
                  </div>

                  {editing && editForm ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" htmlFor="petName">Pet Name</label>
                        <input id="petName" name="petName" value={editForm.petName} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="species">Species</label>
                        <input id="species" name="species" value={editForm.species} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="sex">Sex</label>
                        <input id="sex" name="sex" value={editForm.sex} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="spayedNeutered">Spayed/Neutered</label>
                        <input id="spayedNeutered" name="spayedNeutered" value={editForm.spayedNeutered} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="weightKgs">Weight (kgs)</label>
                        <input id="weightKgs" name="weightKgs" type="number" step="0.1" value={editForm.weightKgs} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="breed">Breed</label>
                        <input id="breed" name="breed" value={editForm.breed} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="animalColor">Animal Color</label>
                        <input id="animalColor" name="animalColor" value={editForm.animalColor} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="dateOfBirth">Date of Birth</label>
                        <input id="dateOfBirth" name="dateOfBirth" type="date" value={editForm.dateOfBirth} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="tagType">Tag Type</label>
                        <input id="tagType" name="tagType" value={editForm.tagType} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="tagNumber">Tag Number</label>
                        <input id="tagNumber" name="tagNumber" value={editForm.tagNumber} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" htmlFor="contactWithOtherAnimals">Contact with other animals</label>
                        <input id="contactWithOtherAnimals" name="contactWithOtherAnimals" value={editForm.contactWithOtherAnimals} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="petOrigin">Pet Origin</label>
                        <input id="petOrigin" name="petOrigin" value={editForm.petOrigin} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="ownership">Ownership</label>
                        <input id="ownership" name="ownership" value={editForm.ownership} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" htmlFor="habitat">Habitat</label>
                        <input id="habitat" name="habitat" value={editForm.habitat} onChange={onEditChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Pet Name</div>
                        <div className="font-medium">{selectedPet.petName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Species</div>
                        <div className="font-medium">{selectedPet.species || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Sex</div>
                        <div className="font-medium">{selectedPet.sex || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Spayed/Neutered</div>
                        <div className="font-medium">{selectedPet.spayedNeutered || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Weight (kgs)</div>
                        <div className="font-medium">{selectedPet.weightKgs ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Animal Color</div>
                        <div className="font-medium">{selectedPet.animalColor || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Date of Birth</div>
                        <div className="font-medium">{selectedPet.dateOfBirth || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tag</div>
                        <div className="font-medium">{selectedPet.tagType ? `${selectedPet.tagType} - ${selectedPet.tagNumber || ''}` : '—'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">Contact with other animals</div>
                        <div className="font-medium">{selectedPet.contactWithOtherAnimals || '—'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">Origin / Ownership / Habitat</div>
                        <div className="font-medium">
                          {(selectedPet.petOrigin || '—') + ' / ' + (selectedPet.ownership || '—') + ' / ' + (selectedPet.habitat || '—')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a pet from the list.</p>
              )}
          </div>
        </div>
      )}
    </OwnerSidebarLayout>
  );
};

export default MyPets;
