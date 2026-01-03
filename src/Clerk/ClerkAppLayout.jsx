import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../services/authService';
import './ClerkLayout.css';

/**
 * Main layout component for the Clerk interface.
 * Provides sidebar navigation, header with page title, and logout functionality.
 * Uses React Router's Outlet to render child route components.
 * @returns {JSX.Element} Clerk layout structure with sidebar and main content area
 */
const ClerkAppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();  // needed for redirect

  /**
   * Mapping of route paths to their display titles.
   * Used to set the page title in the header.
   */
  const pageTitles = {
    '/clerk/dashboard': 'Dashboard',
    '/clerk/patients': 'Patients',
    '/clerk/doctors': 'Doctors',
    '/clerk/nurses': 'Nurses',
    '/clerk/appointments': 'Appointments',
  };

  const pageTitle = pageTitles[location.pathname] || 'CanCare';

  /**
   * Handles user logout by signing out from Firebase Auth.
   * Redirects to the login page after successful logout.
   * Logs errors to console if logout fails.
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');  // redirect to login page
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="clerk-app-layout">
      {/* Sidebar */}
      <aside className="clerk-sidebar">
        <div className="clerk-logo">CanCare</div>

        <nav className="clerk-nav">
          <NavLink to="/clerk/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/clerk/patients" className={({ isActive }) => isActive ? 'active' : ''}>
            Patients
          </NavLink>
          <NavLink to="/clerk/doctors" className={({ isActive }) => isActive ? 'active' : ''}>
            Doctors
          </NavLink>
          <NavLink to="/clerk/nurses" className={({ isActive }) => isActive ? 'active' : ''}>
            Nurses
          </NavLink>
          <NavLink to="/clerk/appointments" className={({ isActive }) => isActive ? 'active' : ''}>
            Appointments
          </NavLink>
        </nav>
      </aside>

      {/* Main area */}
      <div className="clerk-main">
        {/* NAVBAR */}
        <header className="clerk-navbar">
          <h3>{pageTitle}</h3>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        {/* PAGE CONTENT */}
        <main className="clerk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClerkAppLayout;
