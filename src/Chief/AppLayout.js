import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style/AppLayout.css';

/**
 * Main layout component for the Chief/Admin interface.
 * Provides a sidebar navigation menu and main content area with header.
 * Conditionally shows admin-only navigation links based on user role.
 * @param {Object} props - Component props
 * @param {string} props.role - User role ('admin' or other)
 * @param {string} props.pageTitle - Title to display in the header
 * @param {Function} props.onLogout - Callback function for logout action
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 * @returns {JSX.Element} The layout structure with sidebar and main content
 */
const AppLayout = ({ role, pageTitle, onLogout, children }) => {
  const location = useLocation();

  /**
   * Navigation links configuration.
   * Includes role-based links (admin-only links for admin users).
   */
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Profile', path: '/profile' },
    ...(role === 'admin'
      ? [
          { name: 'Patients', path: '/patients' },
          { name: 'Doctors', path: '/doctors' },
          { name: 'Nurses', path: '/nurses' },
        ]
      : []),
    { name: 'Appointments', path: '/appointments' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Community', path: '/Community' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="layout-sidebar">
        <div className="logo">CanCare</div>

        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'active' : ''}
          >
            {link.name}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <div className="layout-main">
        {/* Navbar */}
        <header className="layout-navbar">
          <h3>{pageTitle}</h3>
          <button onClick={onLogout}>Logout</button>
        </header>

        {/* Page content */}
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
