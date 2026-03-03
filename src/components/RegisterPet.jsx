import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthContext';
import { Button } from './ui/Button';

const RegisterPet = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [form, setForm] = useState({
    image: '',
    petName: '',
    petOrigin: '',
    ownership: '',
    habitat: '',
    species: '',
    sex: '',
    spayedNeutered: '',
    weightKgs: '',
    breed: '',
    animalColor: '',
    dateOfBirth: '',
    tagType: '',
    tagNumber: '',
    contactWithOtherAnimals: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const authedFetch = React.useCallback(
    async (path, options) => {
      if (!user) throw new Error('Not logged in.');
      const token = await user.getIdToken();
      const res = await fetch(path, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Request failed.');
      return data;
    },
    [user]
  );

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.petName.trim()) return 'Pet Name is required.';
    if (!form.species.trim()) return 'Species is required.';
    if (!form.sex.trim()) return 'Sex is required.';
    if (!form.weightKgs.toString().trim()) return 'Weight (kgs) is required.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    if (!user) {
      setError('You must be logged in to register a pet.');
      return;
    }

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        image: form.image,
        petName: form.petName,
        petOrigin: form.petOrigin,
        ownership: form.ownership,
        habitat: form.habitat,
        species: form.species,
        sex: form.sex,
        spayedNeutered: form.spayedNeutered,
        weightKgs: Number(form.weightKgs),
        breed: form.breed,
        animalColor: form.animalColor,
        dateOfBirth: form.dateOfBirth,
        tagType: form.tagType,
        tagNumber: form.tagNumber,
        contactWithOtherAnimals: form.contactWithOtherAnimals,
      };

      await authedFetch('/api/me/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet: payload }),
      });

      navigate('/my-pets');
    } catch (err) {
      setError(err?.message || 'Failed to register a pet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="container mx-auto max-w-2xl bg-card text-card-foreground rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-1">Register Pet</h1>
        <p className="text-sm text-muted-foreground mb-6">Add a new pet to your account.</p>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="image">Image (URL for now)</label>
            <input
              id="image"
              name="image"
              value={form.image}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="petName">Pet Name *</label>
              <input id="petName" name="petName" value={form.petName} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="species">Species *</label>
              <select id="species" name="species" value={form.species} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="sex">Sex *</label>
              <select id="sex" name="sex" value={form.sex} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="spayedNeutered">Spayed/Neutered</label>
              <select id="spayedNeutered" name="spayedNeutered" value={form.spayedNeutered} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="weightKgs">Weight (kgs) *</label>
              <input
                id="weightKgs"
                name="weightKgs"
                type="number"
                step="0.1"
                value={form.weightKgs}
                onChange={onChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="breed">Breed</label>
              <input id="breed" name="breed" value={form.breed} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="animalColor">Animal Color</label>
              <input id="animalColor" name="animalColor" value={form.animalColor} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dateOfBirth">Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="petOrigin">Pet Origin</label>
              <input id="petOrigin" name="petOrigin" value={form.petOrigin} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="ownership">Ownership</label>
              <input id="ownership" name="ownership" value={form.ownership} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="habitat">Habitat</label>
            <input id="habitat" name="habitat" value={form.habitat} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="tagType">Tag Type</label>
              <input id="tagType" name="tagType" value={form.tagType} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="tagNumber">Tag Number</label>
              <input id="tagNumber" name="tagNumber" value={form.tagNumber} onChange={onChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="contactWithOtherAnimals">Contact with other animals</label>
            <select
              id="contactWithOtherAnimals"
              name="contactWithOtherAnimals"
              value={form.contactWithOtherAnimals}
              onChange={onChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || loading}>
            {submitting ? 'Saving...' : 'Save Pet'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPet;
