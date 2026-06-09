import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from './ui/Button';
import RegisterPetModal from './RegisterPetModal';

/**
 * RegisterPet - Page wrapper that displays the RegisterPetModal
 * This maintains backward compatibility with the /register-pet route
 */
const RegisterPet = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/my-pets');
  };

  const handleSuccess = () => {
    navigate('/my-pets');
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-card text-card-foreground rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Register Pet</h1>
          <p className="text-muted-foreground mb-6">Add a new pet to your account.</p>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Open Registration Form
          </Button>
        </div>
      </div>

      <RegisterPetModal
        open={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        title="Register Pet"
      />
    </div>
  );
};

export default RegisterPet;
