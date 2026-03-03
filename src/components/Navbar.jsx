import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';

const Navbar = () => {
  const { user, logout, loading, isAdmin } = useAuth();

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/" className="hover:text-accent">PetGuard</Link>
        </div>
        <ul className="flex space-x-6 items-center">
          <li>
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          </li>
          {user && isAdmin ? (
            <li>
              <Link to="/admin" className="hover:text-accent transition-colors">Dashboard</Link>
            </li>
          ) : (
            <>
              <li>
                <Link to="/my-pets" className="hover:text-accent transition-colors">My Pets</Link>
              </li>
              <li>
                <Link to="/medical-records" className="hover:text-accent transition-colors">Medical Records</Link>
              </li>
            </>
          )}
          <li>
            {loading ? (
              <span className="text-sm opacity-90">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link to={isAdmin ? '/admin' : '/profile'}>Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
