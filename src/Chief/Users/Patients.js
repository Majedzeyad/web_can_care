import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';
import { subscribeToPatients, subscribeToDoctors, subscribeToNurses, createPatient, updatePatient, deletePatient } from '../../services/firestoreService';

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
 * Patients management page for Chief/Admin.
 * Displays list of patients with search functionality, statistics cards,
 * and CRUD operations. All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Patients management interface
 */
const Patients = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [modal, setModal] = useState({ type: '', patient: null });

  // Subscribe to Firebase collections
  useEffect(() => {
    const unsubs = [
      subscribeToPatients((patientsData) => {
        console.log('Patients received:', patientsData.length);
        setPatients(patientsData || []);
        setLoading(false);
      }),
      subscribeToDoctors((doctorsData) => {
        console.log('Doctors received:', doctorsData.length);
        setDoctors(doctorsData || []);
      }),
      subscribeToNurses((nursesData) => {
        console.log('Nurses received:', nursesData.length);
        setNurses(nursesData || []);
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  /**
   * Filters patients based on search query (matches name or ID).
   * @type {Array}
   */
  const filteredPatients = patients.filter(
    (p) => {
      const searchLower = search.toLowerCase();
      return p.name?.toLowerCase().includes(searchLower) ||
             p.id?.toLowerCase().includes(searchLower);
    }
  );

  /**
   * Opens a modal dialog for patient operations (edit or delete).
   * @param {string} type - Modal type: 'edit' or 'delete'
   * @param {Object|null} patient - Patient data (null for add operation)
   */
  const openChiefPatientModal = (type, patient = null) => {
    setModal({ type, patient });
  };

  /**
   * Updates an existing patient's information - saves to Firebase.
   * @param {Object} updatedPatient - Updated patient data
   */
  const handleEditPatient = async (updatedPatient) => {
    try {
      const { id, email, password, ...updateData } = updatedPatient;
      
      if (id && !id.startsWith('P-')) {
        await updatePatient(id, updateData);
        
        // إذا كان هناك password جديد
        if (password && password.trim()) {
          console.warn('Password update requires admin privileges.');
        }
      }
    setModal({ type: '', patient: null });
    } catch (error) {
      console.error('Error updating patient:', error);
      alert(`Error updating patient: ${error.message}`);
    }
  };

  /**
   * Deletes a patient - removes from Firebase.
   * @param {string} id - Patient ID to delete
   */
  const handleDeletePatient = async (id) => {
    try {
      await deletePatient(id);
    setModal({ type: '', patient: null });
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert(`Error deleting patient: ${error.message}`);
    }
  };

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Patients</h1>
        <p>Manage registered patients and access their medical profiles.</p>
      </div>

      {/* Dashboard */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Patients</h3>
          <span>{patients.length}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{patients.filter(p => 
            p.status === 'Active' || 
            p.status === 'active' || 
            !p.status
          ).length}</span>
        </div>
        <div className="users-card">
          <h3>In Treatment</h3>
          <span>{patients.filter(p => 
            p.status === 'In Treatment' || 
            p.status === 'in_treatment' ||
            p.status === 'in-treatment'
          ).length}</span>
        </div>
        <div className="users-card">
          <h3>Discharged</h3>
          <span>{patients.filter(p => 
            p.status === 'Discharged' || 
            p.status === 'discharged'
          ).length}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        </div>
      {/* Table */}
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Loading patients...
                </td>
              </tr>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name || 'Unknown'}</td>
                  <td>{calculateAge(p.dob)}</td>
                  <td>
                    <span className={`status ${(p.status || 'active').toLowerCase().replace(/\s+/g, '-')}`}>
                      {p.status || 'Active'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${p.id}`, {
                          state: {
                            user: {
                              ...p,
                              role: 'Patient',
                            },
                          },
                        })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openChiefPatientModal('edit', p)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openChiefPatientModal('delete', p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
     
      {modal.type === 'edit' && (
        <PatientModal
          type="Edit"
          patient={modal.patient}
          doctors={doctors}
          nurses={nurses}
          onSave={handleEditPatient}
          onClose={() => openChiefPatientModal('', null)}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteModal
          patient={modal.patient}
          onDelete={() => handleDeletePatient(modal.patient.id)}
          onClose={() => openChiefPatientModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

/**
 * Modal component for editing patient information.
 * Allows modification of patient details including name, age, and status.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'Edit'
 * @param {Object} props.patient - Existing patient data
 * @param {Function} props.onSave - Callback when patient is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Patient edit form modal
 */
const PatientModal = ({ type, patient = {}, doctors = [], nurses = [], onSave, onClose }) => {
  const isEdit = !!patient.id;
  const [form, setForm] = useState({
    id: patient.id || '',
    name: patient.name || '',
    dob: patient.dob || '',
    gender: patient.gender || '',
    phone: patient.phone || '',
    status: patient.status || 'active',
    doctorId: patient.doctorId || patient.assignedDoctorId || '',
    nurseId: patient.nurseId || patient.assignedNurseId || '',
    email: patient.email || '',
    password: '',
    bloodType: patient.bloodType || '',
    currentDepartment: patient.currentDepartment || '',
    responsiblePartyId: patient.responsiblePartyId || '',
    // Web Data
    diagnosis: patient.webData?.diagnosis || '',
    admissionDate: patient.webData?.admissionDate ? 
      (patient.webData.admissionDate.toDate ? 
        patient.webData.admissionDate.toDate().toISOString().split('T')[0] : 
        patient.webData.admissionDate
      ) : '',
    // Mobile Data
    allergies: patient.mobileData?.allergies?.join(', ') || '',
    medicalHistory: patient.mobileData?.medicalHistory?.join(', ') || '',
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleChiefPatientFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Validates and saves the patient form.
   */
  const handleSave = async () => {
    if (!form.name.trim()) return alert('Patient name is required.');
    
    // التحقق من صحة البريد الإلكتروني للمرضى الجدد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && (!form.email.trim() || !emailRegex.test(form.email))) {
      return alert('Valid email is required for new patients.');
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters for new patients.');
    }

    // إعداد البيانات للحفظ
    const saveData = {
      ...form,
      webData: {
        diagnosis: form.diagnosis || '',
        admissionDate: form.admissionDate ? new Date(form.admissionDate) : null,
      },
      mobileData: {
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medicalHistory: form.medicalHistory ? form.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
    };
    
    // إزالة الحقول التي لا يجب حفظها مباشرة
    const { id, diagnosis, admissionDate, allergies, medicalHistory, ...rest } = saveData;
    const finalData = {
      ...rest,
      webData: saveData.webData,
      mobileData: saveData.mobileData,
    };

    if (isEdit && patient.id && !patient.id.startsWith('P-')) {
      // تحديث مريض موجود
      await onSave({ ...finalData, id });
    } else {
      // إنشاء مريض جديد
      try {
        await createPatient(finalData);
        onClose();
      } catch (error) {
        console.error('Error creating patient:', error);
        alert(`Error creating patient: ${error.message}`);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    return timestamp.toString();
  };

  return (
    <div className="modal-overlay" style={{ overflow: 'auto' }}>
      <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{type} Patient</h2>
        
        {/* Basic Info */}
        <h3>Basic Information</h3>
        {isEdit && (
          <>
            <label>ID (read-only)</label>
            <input name="id" value={form.id} disabled />
          </>
        )}
        <input name="name" value={form.name} onChange={handleChiefPatientFormChange} placeholder="Full Name *" required />
        <label>Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChiefPatientFormChange} />
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChiefPatientFormChange}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input name="phone" value={form.phone} onChange={handleChiefPatientFormChange} placeholder="Phone" />
        <input name="email" type="email" value={form.email} onChange={handleChiefPatientFormChange} placeholder="Email *" required={!isEdit} />
        {!isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefPatientFormChange} placeholder="Password (min 6 characters) *" required />
        )}
        {isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefPatientFormChange} placeholder="New password (optional)" />
        )}
        <label>Blood Type</label>
        <select name="bloodType" value={form.bloodType} onChange={handleChiefPatientFormChange}>
          <option value="">Select Blood Type</option>
          <option>A+</option>
          <option>A-</option>
          <option>B+</option>
          <option>B-</option>
          <option>AB+</option>
          <option>AB-</option>
          <option>O+</option>
          <option>O-</option>
        </select>
        <label>Current Department</label>
        <input name="currentDepartment" value={form.currentDepartment} onChange={handleChiefPatientFormChange} placeholder="Current Department" />
        <label>Responsible Party ID</label>
        <input name="responsiblePartyId" value={form.responsiblePartyId} onChange={handleChiefPatientFormChange} placeholder="Responsible Party ID" />

        {/* Assignments */}
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        <h3>Assignments</h3>
        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleChiefPatientFormChange}>
          <option value="">Select Doctor</option>
          {doctors.map(d => <option key={d.id} value={d.uid || d.id}>{d.name}</option>)}
        </select>
        <label>Nurse</label>
        <select name="nurseId" value={form.nurseId} onChange={handleChiefPatientFormChange}>
          <option value="">Select Nurse</option>
          {nurses.map(n => <option key={n.id} value={n.uid || n.id}>{n.name}</option>)}
        </select>
        <label>Status</label>
        <select name="status" value={form.status} onChange={handleChiefPatientFormChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="in_treatment">In Treatment</option>
          <option value="recovered">Recovered</option>
          <option value="discharged">Discharged</option>
        </select>

        {/* Web Data */}
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        <h3>Web Data</h3>
        <label>Diagnosis</label>
        <textarea name="diagnosis" value={form.diagnosis} onChange={handleChiefPatientFormChange} placeholder="Diagnosis" rows="3" />
        <label>Admission Date</label>
        <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChiefPatientFormChange} />

        {/* Mobile Data */}
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        <h3>Mobile Data</h3>
        <label>Allergies (comma separated)</label>
        <input name="allergies" value={form.allergies} onChange={handleChiefPatientFormChange} placeholder="e.g., Penicillin, Latex" />
        <label>Medical History (comma separated)</label>
        <input name="medicalHistory" value={form.medicalHistory} onChange={handleChiefPatientFormChange} placeholder="e.g., Diabetes, Hypertension" />

        {/* Timestamps (read-only) */}
        {isEdit && (
          <>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <h3>Timestamps (read-only)</h3>
            <label>Created At</label>
            <input value={formatDate(patient.createdAt)} disabled />
            <label>Created By</label>
            <input value={patient.createdBy || 'N/A'} disabled />
            <label>Created Platform</label>
            <input value={patient.createdPlatform || 'N/A'} disabled />
            <label>Updated At</label>
            <input value={formatDate(patient.updatedAt)} disabled />
            <label>Updated By</label>
            <input value={patient.updatedBy || 'N/A'} disabled />
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button onClick={handleSave}>{type}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation modal for deleting a patient.
 * @param {Object} props - Component props
 * @param {Object} props.patient - Patient to delete
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteModal = ({ patient, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Patient</h2>
      <p>
        Delete <strong>{patient.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Patients;
