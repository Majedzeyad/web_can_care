import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './UserProfile.css';
import { subscribeToPatients, subscribeToDoctors, subscribeToNurses, updatePatient } from '../../services/firestoreService';

/**
 * User Profile detail page component.
 * Displays comprehensive information about a specific user (Patient, Doctor, or Nurse).
 * For patients, shows medical records, doctor assignment, and allows adding notes.
 * @returns {JSX.Element} Detailed user profile view
 */
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

const UserProfile = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(state?.user || null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- HOOKS (ALWAYS FIRST) ---------------- */
  const [doctorInCharge, setDoctorInCharge] = useState(
    user?.doctorId || user?.assignedDoctorId || ''
  );

  const [notes, setNotes] = useState(
    user?.webData?.notes || []
  );

  const [newNote, setNewNote] = useState('');

  // Load user data from Firebase if not provided in state
  useEffect(() => {
    if (user) {
      setLoading(false);
      setDoctorInCharge(user.doctorId || user.assignedDoctorId || '');
      setNotes(user.webData?.notes || []);
      return;
    }

    // إذا لم يكن هناك user في state، نحاول جلبها من Firebase
    if (id) {
      const { subscribeToPatients, subscribeToDoctors, subscribeToNurses } = require('../../services/firestoreService');
      
      const unsubs = [
        subscribeToPatients((patients) => {
          const foundPatient = patients.find(p => p.id === id);
          if (foundPatient) {
            setUser({ ...foundPatient, role: 'Patient' });
            setDoctorInCharge(foundPatient.doctorId || foundPatient.assignedDoctorId || '');
            setNotes(foundPatient.webData?.notes || []);
            setLoading(false);
          }
        }),
        subscribeToDoctors((doctorsData) => {
          setDoctors(doctorsData);
          const foundDoctor = doctorsData.find(d => d.id === id || d.uid === id);
          if (foundDoctor) {
            setUser({ ...foundDoctor, role: 'Doctor' });
            setLoading(false);
          }
        }),
        subscribeToNurses((nurses) => {
          const foundNurse = nurses.find(n => n.id === id || n.uid === id);
          if (foundNurse) {
            setUser({ ...foundNurse, role: 'Nurse' });
            setLoading(false);
          }
        }),
      ];

      return () => unsubs.forEach(u => u());
    }
  }, [id, user]);

  // Load doctors for patient assignment
  useEffect(() => {
    if (user?.role === 'Patient') {
      const { subscribeToDoctors } = require('../../services/firestoreService');
      const unsubscribe = subscribeToDoctors(setDoctors);
      return () => unsubscribe();
    }
  }, [user]);

  /* ---------------- GUARD ---------------- */
  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <p>User data not found.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  /* ---------------- HELPERS ---------------- */
  /**
   * Adds a new note to the patient's medical records - saves to Firebase.
   * Creates a note with current timestamp and admin as author.
   */
  const addNote = async () => {
    if (!newNote.trim() || user.role !== 'Patient') return;

    const note = {
      author: 'Chief',
      authorId: null, // سيتم تعبئتها من getCurrentUserId
      date: new Date().toISOString(),
      text: newNote.trim(),
    };

    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setNewNote('');

    // حفظ الملاحظة في Firebase
    try {
      await updatePatient(user.id, {
        webData: {
          ...user.webData,
          notes: updatedNotes,
        },
      });
    } catch (error) {
      console.error('Error saving note:', error);
      alert(`Error saving note: ${error.message}`);
      // Rollback
      setNotes(notes);
    }
  };

  /**
   * Updates the assigned doctor for a patient - saves to Firebase.
   */
  const handleDoctorChange = async (doctorId) => {
    setDoctorInCharge(doctorId);
    
    if (user.role === 'Patient' && user.id) {
      try {
        await updatePatient(user.id, {
          doctorId: doctorId || null,
          assignedDoctorId: doctorId || null,
        });
      } catch (error) {
        console.error('Error updating doctor assignment:', error);
        alert(`Error updating doctor: ${error.message}`);
        // Rollback
        setDoctorInCharge(user.doctorId || user.assignedDoctorId || '');
      }
    }
  };

  /**
   * Formats a date string to a localized date-time string.
   * @param {string} date - ISO date string
   * @returns {string} Formatted date-time string
   */
  const formatDate = (date) =>
    new Date(date).toLocaleString();

  /* ---------------- RENDER ---------------- */
  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>{user.name}</h1>
        <span className="role-badge">{user.role}</span>
      </div>

      {/* Basic Info */}
      <div className="profile-card">
        <h2>Basic Information</h2>
        <div className="info-grid">
          <Info label="ID" value={user.id} />
          <Info label="Age" value={user.age || calculateAge(user.dob)} />
          <Info label="Gender" value={user.gender} />

          {user.role === 'Patient' && (
            <>
              <Info label="Status" value={user.status || 'Active'} />
              <Info label="Join Date" value={
                user.createdAt 
                  ? (user.createdAt instanceof Date 
                      ? user.createdAt.toLocaleDateString() 
                      : user.createdAt.toDate?.().toLocaleDateString() || user.createdAt)
                  : user.joinDate || '-'
              } />
            </>
          )}

          {user.role === 'Doctor' && (
            <>
              <Info label="Department" value={user.department} />
              <Info label="Specialization" value={user.specialization} />
            </>
          )}

          {user.role === 'Nurse' && (
            <>
              <Info label="Department" value={user.department} />
              <Info label="Shift" value={user.shift} />
            </>
          )}
        </div>
      </div>

      {/* Doctor in Charge (editable by admin only) */}
      {user.role === 'Patient' && (
        <div className="profile-card">
          <h2>Doctor in Charge</h2>
          <select
            value={doctorInCharge}
            onChange={(e) => handleDoctorChange(e.target.value)}
          >
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.uid || d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Medical Records */}
      {user.role === 'Patient' && (
        <div className="profile-card">
          <h2>Medical Records</h2>

          <Info
            label="Diagnosis"
            value={user.webData?.diagnosis || user.medicalRecords?.diagnosis || '-'}
          />

          <Info
            label="Blood Type"
            value={user.webData?.bloodType || user.bloodType || '-'}
          />

          <Info
            label="Phone"
            value={user.phone || '-'}
          />

          <Info
            label="Email"
            value={user.email || '-'}
          />
        </div>
      )}

      {/* Chief Notes */}
      {user.role === 'Patient' && (
        <div className="profile-card">
          <h2>Chief Notes</h2>

          {notes.length > 0 ? (
            notes.map((note, index) => (
              <div key={index} className="note">
                <div className="note-meta">
                  <strong>{note.author}</strong>
                  <span>{formatDate(note.date)}</span>
                </div>
                <p>{note.text}</p>
              </div>
            ))
          ) : (
            <p className="empty-text">No notes yet.</p>
          )}

          <textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <button className="primary-btn" onClick={addNote}>
            Add Note
          </button>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

/* ---------------- SMALL COMPONENT ---------------- */

/**
 * Small reusable component for displaying label-value pairs.
 * @param {Object} props - Component props
 * @param {string} props.label - Label text
 * @param {string|number} props.value - Value to display
 * @returns {JSX.Element} Info item display
 */
const Info = ({ label, value }) => (
  <div className="info-item">
    <span>{label}</span>
    <p>{value || '-'}</p>
  </div>
);

export default UserProfile;
