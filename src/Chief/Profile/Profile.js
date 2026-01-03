import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { subscribeToPatients, subscribeToDoctors, subscribeToNurses } from '../../services/firestoreService';

/**
 * Calculates age from a date of birth string.
 */
const calculateAge = (dob) => {
  if (!dob) return '-';
  const d = new Date(dob);
  if (isNaN(d)) return '-';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

/**
 * Admin Profile page component.
 * Displays admin information and provides tabbed interface to view
 * and manage doctors, nurses, and patients. All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Admin profile interface with user management tabs
 */
const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients');
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loggedInRole = 'Admin';

  // Subscribe to Firebase collections
  useEffect(() => {
    const unsubs = [
      subscribeToPatients(setPatients),
      subscribeToDoctors(setDoctors),
      subscribeToNurses(setNurses),
    ];

    setLoading(false);
    return () => unsubs.forEach(u => u());
  }, []);

  /**
   * Combines all users from Firebase collections for display.
   * @type {Array}
   */
  const users = [
    ...patients.map(p => ({ ...p, role: 'Patient', age: calculateAge(p.dob) })),
    ...doctors.map(d => ({ ...d, role: 'Doctor' })),
    ...nurses.map(n => ({ ...n, role: 'Nurse' })),
  ];

  /**
   * Maps tab names to user role names.
   * @type {Object}
   */
  const roleMap = { doctors: 'Doctor', nurses: 'Nurse', patients: 'Patient' };

  /**
   * Filters users based on active tab and search query.
   * @type {Array}
   */
  const filteredUsers = users.filter(
    (u) => u.role === roleMap[activeTab] && u.name.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Column definitions for each tab's table.
   * @type {Object}
   */
  const columnsMap = {
    patients: ['Name', 'Age', 'Gender', 'Blood Type', 'Diagnosis', 'Action'],
    doctors: ['Name', 'Age', 'Gender', 'Department', 'Specialization', 'Action'],
    nurses: ['Name', 'Age', 'Gender', 'Department', 'Shift', 'Action'],
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>Admin Profile</h1>
        <span className="role-badge admin">{loggedInRole}</span>
      </div>

      {/* Admin Info */}
      <div className="profile-card">
        <h2>Admin Information</h2>
        <div className="admin-info">
          <div className="admin-info-item"><span>Name</span><p>System Admin</p></div>
          <div className="admin-info-item"><span>Email</span><p>admin@cancare.com</p></div>
          <div className="admin-info-item"><span>Role</span><p>Administrator</p></div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="profile-search"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabs */}
      <div className="profile-tabs">
        {['doctors', 'nurses', 'patients'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="profile-card">
        <table className="users-table">
          <thead>
            <tr>
              {columnsMap[activeTab].map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnsMap[activeTab].length} className="empty-state">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user.id}>
                {activeTab === 'patients' && <>
                  <td>{user.name || 'Unknown'}</td>
                  <td>{user.age || '-'}</td>
                  <td>{user.gender || '-'}</td>
                  <td>{user.bloodType || user.webData?.bloodType || '-'}</td>
                  <td>{user.webData?.diagnosis || user.diagnosis || '-'}</td>
                </>}
                {activeTab === 'doctors' && <>
                  <td>{user.name || 'Unknown'}</td>
                  <td>{user.age || calculateAge(user.dob) || '-'}</td>
                  <td>{user.gender || '-'}</td>
                  <td>{user.department || '-'}</td>
                  <td>{user.specialization || '-'}</td>
                </>}
                {activeTab === 'nurses' && <>
                  <td>{user.name || 'Unknown'}</td>
                  <td>{user.age || calculateAge(user.dob) || '-'}</td>
                  <td>{user.gender || '-'}</td>
                  <td>{user.department || '-'}</td>
                  <td>{user.shift || '-'}</td>
                </>}
                <td>
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/users/${user.id}`, { state: { user } })}
                  >
                    View Full Profile
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={columnsMap[activeTab].length} className="empty-state">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;
