import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClerkAppLayout from './ClerkAppLayout';
import Dashboard from './Dashboard/Dashboard';
import Patients from './users/Patients';
import Doctors from './users/Doctors';
import Nurses from './users/Nurses';
import Appointments from './Appointments/Appointments';


/**
 * Routing component for the Clerk section of the application.
 * Defines all routes accessible to clerk users and handles default redirects.
 * @returns {JSX.Element} Router with all clerk routes configured
 */
const ClerkRoutes = () => {
  return (
    <Routes>
      <Route path="/clerk" element={<ClerkAppLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="nurses" element={<Nurses />} />
        <Route path="appointments" element={<Appointments />} />
      </Route>
      <Route path="*" element={<Navigate to="/clerk/dashboard" />} />
    </Routes>
  );
};

export default ClerkRoutes;
