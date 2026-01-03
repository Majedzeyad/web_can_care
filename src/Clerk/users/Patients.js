import React, { useMemo, useState, useEffect } from 'react';
import './Users.css';
import { useApp } from '../context/AppContext';

/**
 * Calculates age from a date of birth string.
 * @param {string} dob - Date of birth (YYYY-MM-DD format)
 * @returns {number|string} Age in years or "-" if invalid
 */
const calculateAge = (dob) => {
  if (!dob) return '-';
  const d = new Date(dob); if (isNaN(d)) return '-';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

/**
 * Patients management page for Clerk.
 * Displays list of patients with search functionality and CRUD operations.
 * All data is synchronized with Firestore through AppContext.
 * @returns {JSX.Element} Patients management interface
 */
const Patients = () => {
  const {
    patients, doctors, nurses, doctorById, addPatient, editPatient, deletePatient,
  } = useApp();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: '', patient: null });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredPatients = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter(p => p.name?.toLowerCase().includes(s) || p.id?.toLowerCase().includes(s));
  }, [patients, search]);

  /**
   * Gets doctor name for a patient.
   * @param {Object} p - Patient object
   * @returns {string} Doctor name or "—"
   */
  const docName  = (p) => p.doctorId ? (doctorById[p.doctorId]?.name || '—') : '—';
  
  /**
   * Gets nurse name for a patient.
   * @param {Object} p - Patient object
   * @returns {string} Nurse name or "—"
   */
  const nurseName = (p) => p.nurseId ? (nurses.find(n => n.id === p.nurseId)?.name || '—') : '—';

  /**
   * Handles adding a new patient.
   * @param {Object} patient - Patient data
   */
  const handleAddPatient  = (patient) => { addPatient(patient);  setModal({ type: '', patient: null }); };
  
  /**
   * Handles editing an existing patient.
   * @param {Object} patient - Updated patient data
   */
  const handleEditPatient = (patient) => { editPatient(patient); setModal({ type: '', patient: null }); };
  
  /**
   * Handles deleting a patient.
   * @param {string} id - Patient ID to delete
   */
  const handleDeletePatient = (id) => { deletePatient(id);      setModal({ type: '', patient: null }); };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Patients</h1>
        <p>Manage registered patients and access their medical profiles.</p>
      </div>

      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setModal({ type: 'add', patient: null })}>+ Add Patient</button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Age</th><th>Status</th><th>Doctor</th><th>Nurse</th><th>Phone</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="empty-state">Loading...</td></tr>
            ) : filteredPatients.length ? (
              filteredPatients.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{calculateAge(p.dob)}</td>
                  <td><span className={`status ${String(p.status || 'Unknown').toLowerCase().replace(/\s+/g,'-')}`}>{p.status || 'Unknown'}</span></td>
                  <td>{docName(p)}</td>
                  <td>{nurseName(p)}</td>
                  <td>{p.phone || '—'}</td>
                  <td className="table-actions">
                    <button className="view-btn"  onClick={() => setModal({ type: 'view', patient: p })}>View</button>
                    <button className="edit-btn"  onClick={() => setModal({ type: 'edit', patient: p })}>Edit</button>
                    <button className="delete-btn" onClick={() => setModal({ type: 'delete', patient: p })}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="empty-state">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <PatientModal
          type={modal.type}
          patient={modal.patient}
          doctors={doctors}
          nurses={nurses}
          onSave={modal.type === 'add' ? handleAddPatient : handleEditPatient}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}

      {modal.type === 'view' && (
        <PatientViewModal
          patient={modal.patient}
          doctorName={docName(modal.patient)}
          nurseName={nurseName(modal.patient)}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteModal
          patient={modal.patient}
          onDelete={() => handleDeletePatient(modal.patient.id)}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}
    </div>
  );
};

/* -------- Modals -------- */
/**
 * Modal component for adding or editing patient information.
 * Allows assignment of doctor and nurse, and setting patient status.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'add' or 'edit'
 * @param {Object} props.patient - Existing patient data (for edit mode)
 * @param {Array} props.doctors - List of available doctors
 * @param {Array} props.nurses - List of available nurses
 * @param {Function} props.onSave - Callback when patient is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Patient form modal
 */
const PatientModal = ({ type, patient, doctors, nurses, onSave, onClose }) => {
  const isEdit = type === 'edit';
  const [form, setForm] = useState({
    id: isEdit ? patient?.id : '',
    name: isEdit ? patient?.name : '',
    dob: isEdit ? patient?.dob : '',
    status: isEdit ? (patient?.status || 'Active') : 'Active',
    gender: isEdit ? (patient?.gender || '') : '',
    phone: isEdit ? (patient?.phone || '') : '',
    doctorId: isEdit ? (patient?.doctorId || doctors[0]?.id || '') : (doctors[0]?.id || ''),
    nurseId: isEdit ? (patient?.nurseId || nurses[0]?.id || '')   : (nurses[0]?.id || ''),
    email: isEdit ? (patient?.email || '') : '',
    password: '', // لا نعرض كلمة السر القديمة
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleClerkPatientFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  /**
   * Validates and saves the patient form.
   * Ensures name, doctor, and nurse are selected.
   */
  const handleSaveClerkPatientForm = () => {
    if (!form.name.trim()) return alert('Name is required.');
    if (!form.doctorId)    return alert('Please select a doctor.');
    if (!form.nurseId)     return alert('Please select a nurse.');
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && (!form.email.trim() || !emailRegex.test(form.email))) {
      return alert('Valid email is required for new patients.');
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters for new patients.');
    }
    
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? 'Edit Patient' : 'Add Patient'}</h2>
        {isEdit && <input value={form.id} disabled />}
        <input name="name"  placeholder="Full Name" value={form.name}  onChange={handleClerkPatientFormChange} />
        <label>Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={handleClerkPatientFormChange} />
        <label>Status</label>
        <select name="status" value={form.status} onChange={handleClerkPatientFormChange}>
          <option>Active</option><option>In Treatment</option><option>Recovered</option><option>Discharged</option><option>Unknown</option>
        </select>
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleClerkPatientFormChange}>
          <option value="">Select Gender</option><option>Female</option><option>Male</option>
        </select>
        <input name="phone"  placeholder="Phone" value={form.phone}  onChange={handleClerkPatientFormChange} />
        <input name="email"  type="email" placeholder="Email" value={form.email}  onChange={handleClerkPatientFormChange} required={!isEdit} />
        {!isEdit && (
          <input name="password" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={handleClerkPatientFormChange} required />
        )}
        {isEdit && (
          <input name="password" type="password" placeholder="New password (optional, leave empty to keep current)" value={form.password} onChange={handleClerkPatientFormChange} />
        )}
        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleClerkPatientFormChange}>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label>Nurse</label>
        <select name="nurseId" value={form.nurseId} onChange={handleClerkPatientFormChange}>
          {nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <div className="modal-actions">
          <button onClick={handleSaveClerkPatientForm}>{isEdit ? 'Save' : 'Add'}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for viewing patient details in read-only mode.
 * @param {Object} props - Component props
 * @param {Object} props.patient - Patient data to display
 * @param {string} props.doctorName - Name of assigned doctor
 * @param {string} props.nurseName - Name of assigned nurse
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Patient view modal
 */
const PatientViewModal = ({ patient, doctorName, nurseName, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Patient Details</h2>
      <p><strong>ID:</strong> {patient.id}</p>
      <p><strong>Name:</strong> {patient.name}</p>
      <p><strong>Age:</strong> {calculateAge(patient.dob)}</p>
      <p><strong>Status:</strong> {patient.status || 'Unknown'}</p>
      <p><strong>Gender:</strong> {patient.gender || '—'}</p>
      <p><strong>Phone:</strong> {patient.phone || '—'}</p>
      <p><strong>Doctor:</strong> {doctorName}</p>
      <p><strong>Nurse:</strong> {nurseName}</p>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

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
      <p>Delete <strong>{patient.name}</strong> ({patient.id})?</p>
      <div className="modal-actions">
        <button className="danger" onClick={onDelete}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Patients;
