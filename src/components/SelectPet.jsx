import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PawPrint } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { petService } from '../services/petService';
import { Button } from './ui/Button';
import Modal from './Modal';
import ImageUpload from './ImageUpload';

const SelectPet = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    loadPets();
  }, [user, authLoading]);

  const loadPets = async () => {
    setLoading(true);
    setError('');
    try {
      const { pets: petList } = await petService.getPets();
      setPets(petList);
    } catch (e) {
      setError(e?.message || 'Failed to load pets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPet = async (petId) => {
    try {
      await petService.setSelectedPet(petId);
      navigate('/my-pets');
    } catch (e) {
      setError(e?.message || 'Failed to select pet.');
    }
  };

  const validate = () => {
    if (!form.petName.trim()) return 'Pet Name is required.';
    if (!form.species.trim()) return 'Species is required.';
    if (!form.sex.trim()) return 'Sex is required.';
    if (!form.weightKgs.toString().trim()) return 'Weight (kgs) is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const msg = validate();
    if (msg) {
      setFormError(msg);
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
      
      await petService.createPet(submitData);
      
      // Reset form and close modal
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
      setIsModalOpen(false);
      
      // Reload pets list
      await loadPets();
    } catch (err) {
      setFormError(err?.message || 'Failed to create pet.');
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const isFemale = form.sex === 'Female';
  const showPetOriginOther = form.petOrigin === 'others';
  const showOwnershipOther = form.ownership === 'others';
  const showTagTypeOther = form.tagType === 'others';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Loading your pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-lg">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Select a pet to continue or add a new one
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pet Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Add New Pet Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center aspect-square rounded-full bg-white shadow-md hover:shadow-xl transition-all duration-300 border-2 border-dashed border-green-300 hover:border-green-500"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <Plus className="w-10 h-10 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700">
              Add New Pet
            </span>
          </button>

          {/* Pet Cards */}
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => handleSelectPet(pet.id)}
              className="group flex flex-col items-center aspect-square"
            >
              {/* Round Image Container */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-4 border-white hover:border-green-300 hover:scale-105">
                {pet.image ? (
                  <img
                    src={pet.image}
                    alt={pet.petName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                    <PawPrint className="w-16 h-16 text-green-400" />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/20 transition-colors rounded-full" />
              </div>
              
              {/* Pet Name */}
              <div className="mt-4 text-center">
                <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                  {pet.petName || 'Unnamed'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pet.species || 'Pet'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {pets.length === 0 && !error && (
          <div className="text-center mt-12 py-12 bg-white/60 rounded-2xl backdrop-blur-sm">
            <PawPrint className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No pets yet
            </h3>
            <p className="text-gray-500 mb-6">
              Click "Add New Pet" to register your first pet
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Pet
            </Button>
          </div>
        )}
      </div>

      {/* Add Pet Modal */}
      <Modal
        open={isModalOpen}
        title="Add New Pet"
        onClose={() => !submitting && setIsModalOpen(false)}
        maxWidthClassName="max-w-2xl"
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Pet'}
            </Button>
          </>
        )}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Pet Photo Upload */}
          <div className="flex justify-center mb-6">
            <div className="w-32">
              <ImageUpload
                value={form.image}
                onChange={({ url }) => setForm((prev) => ({ ...prev, image: url }))}
                folder="pets"
                label="Pet Photo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="petName">
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                id="petName"
                name="petName"
                value={form.petName}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter pet name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="species">
                Species <span className="text-red-500">*</span>
              </label>
              <select
                id="species"
                name="species"
                value={form.species}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="sex">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                id="sex"
                name="sex"
                value={form.sex}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="spayedNeutered">
                Spayed/Neutered
              </label>
              <select
                id="spayedNeutered"
                name="spayedNeutered"
                value={form.spayedNeutered}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="weightKgs">
                Weight (kgs) <span className="text-red-500">*</span>
              </label>
              <input
                id="weightKgs"
                name="weightKgs"
                type="number"
                step="0.1"
                value={form.weightKgs}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="breed">
                Breed
              </label>
              <input
                id="breed"
                name="breed"
                value={form.breed}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter breed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="animalColor">
                Animal Color
              </label>
              <input
                id="animalColor"
                name="animalColor"
                value={form.animalColor}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="petOrigin">
                Pet Origin
              </label>
              <select
                id="petOrigin"
                name="petOrigin"
                value={form.petOrigin}
                onChange={onChange}
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
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                  placeholder="Specify origin"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="ownership">
                Ownership
              </label>
              <select
                id="ownership"
                name="ownership"
                value={form.ownership}
                onChange={onChange}
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
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                  placeholder="Specify ownership"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="habitat">
              Habitat
            </label>
            <select
              id="habitat"
              name="habitat"
              value={form.habitat}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select</option>
              <option value="caged">Caged</option>
              <option value="free roaming">Free Roaming</option>
              <option value="leashed">Leashed</option>
              <option value="house only">House Only</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="tagType">
                Tag Type
              </label>
              <select
                id="tagType"
                name="tagType"
                value={form.tagType}
                onChange={onChange}
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
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                  placeholder="Specify tag type"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="tagNumber">
                Tag Number
              </label>
              <input
                id="tagNumber"
                name="tagNumber"
                value={form.tagNumber}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter tag number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="contactWithOtherAnimals">
              Contact with other animals
            </label>
            <select
              id="contactWithOtherAnimals"
              name="contactWithOtherAnimals"
              value={form.contactWithOtherAnimals}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select</option>
              <option value="frequent">Frequent</option>
              <option value="seldom">Seldom</option>
              <option value="never">Never</option>
            </select>
          </div>
          
          {/* Female-specific fields */}
          {isFemale && (
            <div className="border border-gray-300 rounded-lg p-4 space-y-3 bg-green-50/50">
              <div className="font-medium text-sm text-green-800">Female-specific information</div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="pregnant"
                    checked={form.pregnant}
                    onChange={onChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Pregnant
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="lactating"
                    checked={form.lactating}
                    onChange={onChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Lactating with puppies
                </label>
              </div>
              {form.lactating && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-green-700">
                    Number of puppies
                  </label>
                  <input
                    name="puppyCount"
                    type="number"
                    min="0"
                    value={form.puppyCount}
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter number"
                  />
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default SelectPet;
