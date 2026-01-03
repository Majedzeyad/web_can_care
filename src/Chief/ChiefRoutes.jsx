import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './AppLayout';
import Dashboard from './Dashboard';
import Profile from './Profile/Profile';
import Patients from './Users/Patients';
import Doctors from './Users/Doctors';
import Nurses from './Users/Nurses';
import Appointments from './Appointments';
import Notifications from './Notifications';
import Community from './Community';
import UserProfile from './Profile/UserProfile';
import { signOut } from '../services/authService';

/**
 * Routing component for the Chief/Admin section of the application.
 * Defines all routes accessible to admin users and provides page titles
 * for the layout header. Handles logout functionality.
 * @returns {JSX.Element} Router with all admin routes configured
 */
const ChiefRoutes = () => {
  const location = useLocation();

  /**
   * Mapping of route paths to their display titles.
   * Used to set the page title in the AppLayout header.
   */
  const pageTitles = {
    '/': 'Dashboard',
    '/profile': 'Profile',
    '/patients': 'Patients',
    '/doctors': 'Doctors',
    '/nurses': 'Nurses',
    '/appointments': 'Appointments',
    '/notifications': 'Notifications',
    '/community': 'Community',
  };

  return (
    <AppLayout
      role="admin"
      pageTitle={pageTitles[location.pathname]}
      onLogout={() => signOut()}
    >
      <Routes>
        <Route path="/" element={<Dashboard role="admin" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/nurses" element={<Nurses />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/community" element={<Community />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
};

export default ChiefRoutes;
