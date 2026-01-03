
import React, { useEffect, useMemo, useState } from 'react';
import './Users.css';
import { useApp } from '../context/AppContext';

/* ---------- Utilities ---------- */
/**
 * Calculates age from a date of birth string.
 * @param {string} dob - Date of birth (YYYY-MM-DD format)
 * @returns {number|string} Age in years or "—" if invalid
 */
const calculateAge = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob); if (isNaN(d)) return '—';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

/* ---------- Small patient view modal (inline) ---------- */
/**
 * Small modal component for viewing patient details in read-only mode.
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

/* ---------- Page ---------- */
/**
 * Doctors management page for Clerk.
 * Displays list of doctors with search functionality and CRUD operations.
 * All data is synchronized with Firestore through AppContext.
 * @returns {JSX.Element} Doctors management interface
 */
const Doctors = () => {
  const { doctors, patients, appointments, nurses, addDoctor, editDoctor, deleteDoctor } = useApp();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: '', doctor: null, warn: '' });

  // NEW: in-page patient details modal state
  const [viewPatient, setViewPatient] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredDoctors = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter(d =>
      d.name?.toLowerCase().includes(s) ||
      d.id?.toLowerCase().includes(s) ||
      (d.specialization || d.specialty || '').toLowerCase().includes(s)
    );
  }, [doctors, search]);

  /**
   * Counts the number of patients assigned to a doctor.
   * Supports both new (doctorId) and legacy (doctorName) formats.
   * @param {Object} doc - Doctor object
   * @returns {number} Number of assigned patients
   */
  const countPatientsFor = (doc) => {
    const byId   = patients.filter(p => p.doctorId === doc.id).length;
    const legacy = patients.filter(p => !p.doctorId && p.doctorName === doc.name).length;
    return byId + legacy;
  };
  
  /**
   * Counts the number of appointments for a doctor.
   * Supports both new (doctorId) and legacy (doctor name) formats.
   * @param {Object} doc - Doctor object
   * @returns {number} Number of appointments
   */
  const countAppointmentsFor = (doc) => {
    const byId   = appointments.filter(a => a.doctorId === doc.id).length;
    const legacy = appointments.filter(a => !a.doctorId && a.doctor === doc.name).length;
    return byId + legacy;
  };

  /**
   * Resolves doctor name from patient data.
   * Supports both new (doctorId) and legacy (doctorName/doctor) formats.
   * @param {Object} p - Patient object
   * @returns {string} Doctor name or "—"
   */
  const resolveDoctorName = (p) => {
    if (p?.doctorId) {
      const d = doctors.find(doc => doc.id === p.doctorId);
      if (d?.name) return d.name;
    }
    return p?.doctorName || p?.doctor || '—';
  };
  
  /**
   * Resolves nurse name from patient data.
   * Supports both new (nurseId) and legacy (nurseName) formats.
   * @param {Object} p - Patient object
   * @returns {string} Nurse name or "—"
   */
  const resolveNurseName = (p) => {
    if (p?.nurseId) {
      const n = nurses.find(nu => nu.id === p.nurseId);
      if (n?.name) return n.name;
    }
    return p?.nurseName || '—';
  };

  /**
   * Handles adding a new doctor.
   * @param {Object} d - Doctor data
   */
  const handleAddDoctor = (d) => { addDoctor(d); setModal({ type: '', doctor: null, warn: '' }); };
  
  /**
   * Handles editing an existing doctor.
   * @param {Object} d - Updated doctor data
   */
  const handleEditDoctor = (d) => { editDoctor(d); setModal({ type: '', doctor: null, warn: '' }); };
  
  /**
   * Handles deleting a doctor.
   * Prevents deletion if doctor has assigned patients or appointments.
   * @param {string} id - Doctor ID to delete
   */
  const handleDeleteDoctor = (id) => {
    const doc = doctors.find(x => x.id === id);
    const pc = countPatientsFor(doc);
    const ac = countAppointmentsFor(doc);
    if (pc > 0 || ac > 0) {
      setModal(m => ({ ...m, warn: `Cannot delete. This doctor still has ${pc} patient(s) and ${ac} appointment(s).` }));
      return;
    }
    deleteDoctor(id);
    setModal({ type: '', doctor: null, warn: '' });
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Doctors</h1>
        <p>Manage doctors and see their specialties and patient count.</p>
      </div>

      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name, ID, or specialty"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setModal({ type: 'add', doctor: null, warn: '' })}>+ Add Doctor</button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Specialty</th><th>Patients</th><th>Phone</th><th>Actions</th></tr>
          </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
          ) : filteredDoctors.length ? (
            filteredDoctors.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td><td>{d.name}</td>
                <td>{d.specialization || d.specialty || '—'}</td>
                <td>{countPatientsFor(d)}</td>
                <td>{d.phone || '—'}</td>
                <td className="table-actions">
                  <button className="view-btn"  onClick={() => setModal({ type: 'view', doctor: d, warn: '' })}>View</button>
                  <button className="edit-btn"  onClick={() => setModal({ type: 'edit', doctor: d, warn: '' })}>Edit</button>
                  <button className="delete-btn" onClick={() => setModal({ type: 'delete', doctor: d, warn: '' })}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" className="empty-state">No doctors found</td></tr>
          )}
        </tbody>
        </table>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <DoctorModal
          type={modal.type}
          doctor={modal.doctor}
          onSave={modal.type === 'add' ? handleAddDoctor : handleEditDoctor}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
        />
      )}

      {modal.type === 'view' && (
        <ViewDoctorModal
          doctor={modal.doctor}
          patientsForDoctor={[
            ...patients.filter(p => p.doctorId === modal.doctor.id),
            ...patients.filter(p => !p.doctorId && p.doctorName === modal.doctor.name),
          ]}
          appointmentCount={countAppointmentsFor(modal.doctor)}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
          // NEW: clean callback to open patient modal instead of navigate
          onPatientClick={(p) => setViewPatient(p)}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteDoctorModal
          doctor={modal.doctor}
          inUsePatients={countPatientsFor(modal.doctor)}
          inUseAppointments={countAppointmentsFor(modal.doctor)}
          warn={modal.warn}
          onDelete={() => handleDeleteDoctor(modal.doctor.id)}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
        />
      )}

      {/* In-page Patient View (no redirect) */}
      {viewPatient && (
        <PatientViewModal
          patient={viewPatient}
          doctorName={resolveDoctorName(viewPatient)}
          nurseName={resolveNurseName(viewPatient)}
          onClose={() => setViewPatient(null)}
        />
      )}
    </div>
  );
};

/* -------- Modals -------- */
/**
 * Modal component for adding or editing doctor information.
 * Validates phone number format and required fields.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'add' or 'edit'
 * @param {Object} props.doctor - Existing doctor data (for edit mode)
 * @param {Function} props.onSave - Callback when doctor is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Doctor form modal
 */
const DoctorModal = ({ type, doctor, onSave, onClose }) => {
  const isEdit = type === 'edit';
  const [form, setForm] = useState({
    id: isEdit ? doctor?.id : '',
    name: isEdit ? doctor?.name : '',
    specialization: isEdit ? (doctor?.specialization || doctor?.specialty || '') : '',
    department: isEdit ? (doctor?.department || '') : '',
    city: isEdit ? (doctor?.city || '') : '',
    phone: isEdit ? (doctor?.phone || '') : '',
    dob: isEdit ? (doctor?.dob || '') : '',
    email: isEdit ? (doctor?.email || '') : '',
    password: '', // لا نعرض كلمة السر القديمة، فقط للتحديث
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleClerkDoctorFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  /**
   * Validates phone number format (9-12 digits).
   * @param {string} p - Phone number to validate
   * @returns {boolean} True if valid or empty
   */
  const validateClerkDoctorPhoneNumber = (p) => (!p || /^\d{9,12}$/.test(p));
  
  /**
   * Validates and saves the doctor form.
   * Ensures name, specialization, and phone format are valid.
   */
  const handleSaveClerkDoctorForm = () => {
    if (!form.name.trim()) return alert('Doctor name is required.');
    if (!form.specialization.trim()) return alert('Specialization is required.');
    if (!validateClerkDoctorPhoneNumber(form.phone)) return alert('Phone must be 9–12 digits.');
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && (!form.email.trim() || !emailRegex.test(form.email))) {
      return alert('Valid email is required for new doctors.');
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters for new doctors.');
    }
    
    const payload = {
      id: form.id,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      department: form.department?.trim() || '',
      city: form.city?.trim() || '',
      phone: form.phone?.trim() || '',
      dob: form.dob || '',
      email: form.email.trim(),
      password: form.password, // فقط للأطباء الجدد أو عند التحديث
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h2>
        {isEdit && <input value={form.id} disabled />}
        <input name="name"           placeholder="Full Name"          value={form.name}           onChange={handleClerkDoctorFormChange} />
        <input name="specialization" placeholder="Specialization"     value={form.specialization} onChange={handleClerkDoctorFormChange} />
        <input name="department"     placeholder="Department (optional)" value={form.department} onChange={handleClerkDoctorFormChange} />
        <input name="city"           placeholder="City (optional)"       value={form.city}       onChange={handleClerkDoctorFormChange} />
        <input name="phone"          placeholder="Phone (9–12 digits)"   value={form.phone}      onChange={handleClerkDoctorFormChange} />
        <input name="email"          type="email" placeholder="Email"    value={form.email}      onChange={handleClerkDoctorFormChange} required={!isEdit} />
        {!isEdit && (
          <input name="password"     type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={handleClerkDoctorFormChange} required />
        )}
        {isEdit && (
          <input name="password"     type="password" placeholder="New password (optional, leave empty to keep current)" value={form.password} onChange={handleClerkDoctorFormChange} />
        )}
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleClerkDoctorFormChange} />
        <div className="modal-actions">
          <button onClick={handleSaveClerkDoctorForm}>{isEdit ? 'Save' : 'Add'}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for viewing doctor details in read-only mode.
 * Shows assigned patients and appointment count, allows viewing patient details.
 * @param {Object} props - Component props
 * @param {Object} props.doctor - Doctor data to display
 * @param {Array} props.patientsForDoctor - List of patients assigned to this doctor
 * @param {number} props.appointmentCount - Number of appointments for this doctor
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onPatientClick - Callback when a patient is clicked
 * @returns {JSX.Element} Doctor view modal
 */
const ViewDoctorModal = ({ doctor, patientsForDoctor, appointmentCount, onClose, onPatientClick }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Doctor Details</h2>
      <p><strong>ID:</strong> {doctor.id}</p>
      <p><strong>Name:</strong> {doctor.name}</p>
      <p><strong>Specialization:</strong> {doctor.specialization || doctor.specialty || '—'}</p>
      <p><strong>Department:</strong> {doctor.department || '—'}</p>
      <p><strong>City:</strong> {doctor.city || '—'}</p>
      <p><strong>Phone:</strong> {doctor.phone || '—'}</p>
      <p><strong>DOB:</strong> {doctor.dob || '—'} {doctor.dob ? `(${calculateAge(doctor.dob)} yrs)` : ''}</p>
      <p><strong>Patients:</strong> {patientsForDoctor.length}</p>
      <p><strong>Appointments:</strong> {appointmentCount}</p>

      {!!patientsForDoctor.length && (
        <ul style={{ marginTop: 8 }}>
          {patientsForDoctor.map(p => (
            <li key={p.id}>
              {/* Open the small patient view modal in the same page */}
              <button className="link-btn" onClick={() => onPatientClick(p)}>
                {p.name} ({p.id})
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

/**
 * Confirmation modal for deleting a doctor.
 * Shows warning if doctor has assigned patients or appointments.
 * @param {Object} props - Component props
 * @param {Object} props.doctor - Doctor to delete
 * @param {number} props.inUsePatients - Number of patients assigned to this doctor
 * @param {number} props.inUseAppointments - Number of appointments for this doctor
 * @param {string} props.warn - Custom warning message
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteDoctorModal = ({ doctor, inUsePatients, inUseAppointments, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>Delete <strong>{doctor.name}</strong> ({doctor.id})?</p>
      {(inUsePatients > 0 || inUseAppointments > 0) && (
        <p style={{ color: '#b54708', background: '#fff6e6', padding: '8px 10px', borderRadius: 8 }}>
          {warn || `This doctor has ${inUsePatients} patient(s) and ${inUseAppointments} appointment(s). Reassign or remove them first.`}
        </p>
      )}
      <div className="modal-actions">
        <button className="danger" onClick={onDelete} disabled={inUsePatients > 0 || inUseAppointments > 0}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Doctors;
