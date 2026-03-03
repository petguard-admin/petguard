import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-muted text-muted-foreground py-6">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2025 PetGuard. All rights reserved. Dedicated to the health of your pets.</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="hover:text-accent">Privacy Policy</a>
          <a href="#" className="hover:text-accent">Terms of Service</a>
          <a href="#" className="hover:text-accent">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
