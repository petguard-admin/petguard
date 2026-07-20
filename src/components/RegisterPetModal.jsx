import React, { useState, useEffect } from 'react';
import { petService } from '../services/petService';
import { Button } from './ui/Button';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import { logAuditTrail } from '../utils/auditLogger';

/**
 * RegisterPetModal - A reusable modal component for registering new pets
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onClose - Callback when modal is closed
 * @param {function} props.onSuccess - Callback when pet is successfully created (receives the new pet)
 * @param {string} props.title - Modal title (default: "Register Pet")
 */
const RegisterPetModal = ({ 
  open, 
  onClose, 
  onSuccess,
  title = "Register Pet"
}) => {
  const [form, setForm] = useState({
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
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
      setError('');
    }
  }, [open]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const isFemale = form.sex === 'Female';
  const showPetOriginOther = form.petOrigin === 'others';
  const showOwnershipOther = form.ownership === 'others';
  const showTagTypeOther = form.tagType === 'others';

  const validate = () => {
    if (!form.petName.trim()) return 'Pet Name is required.';
    if (!form.species.trim()) return 'Species is required.';
    if (!form.sex.trim()) return 'Sex is required.';
    if (!form.weightKgs.toString().trim()) return 'Weight (kgs) is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare form data with "others" values
      const submitData = {
        ...form,
        petOrigin: form.petOrigin === 'others' ? form.petOriginOther : form.petOrigin,
        ownership: form.ownership === 'others' ? form.ownershipOther : form.ownership,
        tagType: form.tagType === 'others' ? form.tagTypeOther : form.tagType,
        weightKgs: Number(form.weightKgs),
        puppyCount: form.puppyCount ? Number(form.puppyCount) : null,
      };
      // Clean up temporary fields
      delete submitData.petOriginOther;
      delete submitData.ownershipOther;
      delete submitData.tagTypeOther;
      
      const newPet = await petService.createPet(submitData);
      
      onSuccess?.(newPet.pet);
      onClose?.();
      await logAuditTrail('create', newPet.pet.id, 'pet', null, submitData);
    } catch (err) {
      setError('Could not register pet. Please try again.');
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

            <div className="md:col-span-2">
              <ImageUpload
                value={form.image}
                onChange={({ url }) => setForm((prev) => ({ ...prev, image: url }))}
                folder="pets"
                label="Pet Photo"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {/* Pet Name */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="petName"
                  name="petName"
                  value={form.petName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter pet name"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  id="species"
                  name="species"
                  value={form.species}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              {/* Sex */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  id="sex"
                  name="sex"
                  value={form.sex}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Spayed/Neutered */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Spayed/Neutered
                </label>
                <select
                  id="spayedNeutered"
                  name="spayedNeutered"
                  value={form.spayedNeutered}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Weight (kgs) <span className="text-red-500">*</span>
                </label>
                <input
                  id="weightKgs"
                  name="weightKgs"
                  type="number"
                  step="0.1"
                  value={form.weightKgs}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter weight"
                />
              </div>

              {/* Breed */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Breed
                </label>
                <input
                  id="breed"
                  name="breed"
                  value={form.breed}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter breed"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Animal Color
                </label>
                <input
                  id="animalColor"
                  name="animalColor"
                  value={form.animalColor}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter color"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Pet Origin */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Pet Origin
                </label>
                <select
                  id="petOrigin"
                  name="petOrigin"
                  value={form.petOrigin}
                  onChange={onChange}
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
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify origin"
                  />
                )}
              </div>

              {/* Ownership */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Ownership
                </label>
                <select
                  id="ownership"
                  name="ownership"
                  value={form.ownership}
                  onChange={onChange}
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
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify ownership"
                  />
                )}
              </div>

              {/* Tag Type */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Tag Type
                </label>
                <select
                  id="tagType"
                  name="tagType"
                  value={form.tagType}
                  onChange={onChange}
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
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors mt-2"
                    placeholder="Specify tag type"
                  />
                )}
              </div>

              {/* Tag Number */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Tag Number
                </label>
                <input
                  id="tagNumber"
                  name="tagNumber"
                  value={form.tagNumber}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter tag number"
                />
              </div>

              {/* Habitat */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Habitat
                </label>
                <select
                  id="habitat"
                  name="habitat"
                  value={form.habitat}
                  onChange={onChange}
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
                <label className="block text-xs text-slate-500 mb-1">
                  Contact with other animals
                </label>
                <select
                  id="contactWithOtherAnimals"
                  name="contactWithOtherAnimals"
                  value={form.contactWithOtherAnimals}
                  onChange={onChange}
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
                      onChange={onChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="lactating"
                      checked={form.lactating}
                      onChange={onChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    Lactating with puppies
                  </label>
                </div>
                {form.lactating && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Number of puppies
                    </label>
                    <input
                      name="puppyCount"
                      type="number"
                      min="0"
                      value={form.puppyCount}
                      onChange={onChange}
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
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Register Pet'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterPetModal;
