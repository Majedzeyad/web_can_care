import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';
import { subscribeToDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../services/firestoreService';

/**
 * Doctors management page for Chief/Admin.
 * Displays list of doctors with search functionality, statistics cards,
 * and CRUD operations. All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Doctors management interface
 */
const Doctors = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [modal, setModal] = useState({ type: '', doctor: null });

  // Subscribe to Firebase doctors collection
  useEffect(() => {
    const unsubscribe = subscribeToDoctors((doctorsData) => {
      setDoctors(doctorsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Filters doctors based on search query (matches name or ID).
   * @type {Array}
   */
  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Opens a modal dialog for doctor operations (edit or delete).
   * @param {string} type - Modal type: 'edit' or 'delete'
   * @param {Object|null} doctor - Doctor data (null for add operation)
   */
  const openChiefDoctorModal = (type, doctor = null) => {
    setModal({ type, doctor });
  };



  /**
   * Edits a doctor's details - saves to Firebase.
   * @param {Object} updatedDoctor - Doctor data.
   */
  const handleEditDoctor = async (updatedDoctor) => {
    try {
      const { id, email, password, ...updateData } = updatedDoctor;
      
      if (id && !id.startsWith('D-')) {
        // تحديث طبيب موجود في Firebase
        await updateDoctor(id, updateData);
        
        // إذا كان هناك password جديد، نحذر أن التحديث يحتاج Admin SDK
        if (password && password.trim()) {
          console.warn('Password update requires admin privileges.');
        }
      }
    setModal({ type: '', doctor: null });
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert(`Error updating doctor: ${error.message}`);
    }
  };

  /**
   * Deletes a doctor - removes from Firebase.
   * @param {string} id - Doctor ID.
   */
  const handleDeleteDoctor = async (id) => {
    try {
      await deleteDoctor(id);
    setModal({ type: '', doctor: null });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert(`Error deleting doctor: ${error.message}`);
    }
  };

  // Dashboard card counts - من Firebase
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.status === 'Active' || !d.status).length;
  
  // حساب shift من workSchedule
  const morningShift = doctors.filter(d => {
    if (!d.workSchedule) return false;
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    return dayNames.some(day => d.workSchedule[day]?.enabled);
  }).length;
  
  const nightShift = doctors.filter(d => {
    if (!d.workSchedule) return false;
    return d.workSchedule.saturday?.enabled || d.workSchedule.sunday?.enabled;
  }).length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Doctors</h1>
        <p>Manage registered doctors and their details.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Doctors</h3>
          <span>{totalDoctors}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{activeDoctors}</span>
        </div>
        <div className="users-card">
          <h3>Morning Shift</h3>
          <span>{morningShift}</span>
        </div>
        <div className="users-card">
          <h3>Night Shift</h3>
          <span>{nightShift}</span>
        </div>
      </div>

      {/* Search & Add */}
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
              <th>Department</th>
              <th>Specialization</th>
              <th>Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  Loading doctors...
                </td>
              </tr>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.name || 'Unknown'}</td>
                  <td>{d.department || '—'}</td>
                  <td>{d.specialization || '—'}</td>
                  <td>
                    {d.workSchedule ? (
                      Object.keys(d.workSchedule).filter(day => d.workSchedule[day]?.enabled).length > 0 
                        ? `${Object.keys(d.workSchedule).filter(day => d.workSchedule[day]?.enabled).length} days` 
                        : 'No schedule'
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`status ${(d.status || 'Active').toLowerCase()}`}>
                      {d.status || 'Active'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${d.id}`, { state: { role: 'Doctor' } })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openChiefDoctorModal('edit', d)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openChiefDoctorModal('delete', d)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">
                  No doctors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'edit' && (
        <DoctorModal type="Edit" doctor={modal.doctor} onSave={handleEditDoctor} onClose={() => openChiefDoctorModal('', null)} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          doctor={modal.doctor}
          onDelete={() => handleDeleteDoctor(modal.doctor.id)}
          onClose={() => openChiefDoctorModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

/**
 * Modal component for editing doctor information.
 * Allows modification of doctor details including department, specialization, shift, and status.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'Edit'
 * @param {Object} props.doctor - Existing doctor data
 * @param {Function} props.onSave - Callback when doctor is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Doctor edit form modal
 */
const DoctorModal = ({ type, doctor = {}, onSave, onClose }) => {
  const isEdit = !!doctor.id;
  
  // تهيئة workSchedule
  const defaultSchedule = {
    monday: { enabled: true, slots: ['09:00', '09:30', '10:00'] },
    tuesday: { enabled: true, slots: ['09:00', '09:30', '10:00'] },
    wednesday: { enabled: true, slots: ['09:00', '09:30', '10:00'] },
    thursday: { enabled: true, slots: ['09:00', '09:30', '10:00'] },
    friday: { enabled: false, slots: [] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: true, slots: ['09:00', '09:30', '10:00'] }
  };
  
  const [form, setForm] = useState({
    id: doctor.id || '',
    name: doctor.name || '',
    department: doctor.department || '',
    specialization: doctor.specialization || '',
    city: doctor.city || '',
    phone: doctor.phone || '',
    dob: doctor.dob || '',
    email: doctor.email || '',
    password: '',
    status: doctor.status || 'Active',
    uid: doctor.uid || '',
    // Stats
    activePatients: doctor.stats?.activePatients || 0,
    appointmentsToday: doctor.stats?.appointmentsToday || 0,
    pendingLabTests: doctor.stats?.pendingLabTests || 0,
    // Work Schedule
    workSchedule: doctor.workSchedule || defaultSchedule,
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleChiefDoctorFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Validates and saves the doctor form.
   */
  const handleSave = async () => {
    if (!form.name.trim()) return alert('Doctor name is required.');
    if (!form.specialization.trim()) return alert('Specialization is required.');
    
    // التحقق من صحة البريد الإلكتروني للأطباء الجدد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && (!form.email.trim() || !emailRegex.test(form.email))) {
      return alert('Valid email is required for new doctors.');
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters for new doctors.');
    }

    // إعداد البيانات للحفظ
    const saveData = {
      ...form,
      stats: {
        activePatients: Number(form.activePatients) || 0,
        appointmentsToday: Number(form.appointmentsToday) || 0,
        pendingLabTests: Number(form.pendingLabTests) || 0,
      },
      workSchedule: form.workSchedule,
    };
    
    // إزالة الحقول التي لا يجب حفظها
    const { id, uid, activePatients, appointmentsToday, pendingLabTests, ...rest } = saveData;
    const finalData = {
      ...rest,
      stats: saveData.stats,
      workSchedule: saveData.workSchedule,
    };

    if (isEdit && doctor.id && !doctor.id.startsWith('D-')) {
      // تحديث طبيب موجود
      await onSave({ ...finalData, id });
    } else {
      // إنشاء طبيب جديد
      try {
        await createDoctor(finalData);
        onClose();
      } catch (error) {
        console.error('Error creating doctor:', error);
        alert(`Error creating doctor: ${error.message}`);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type} Doctor</h2>
        {isEdit && <input name="id" value={form.id} disabled placeholder="ID" />}
        <input name="name" value={form.name} onChange={handleChiefDoctorFormChange} placeholder="Full Name *" required />
        <input name="specialization" value={form.specialization} onChange={handleChiefDoctorFormChange} placeholder="Specialization *" required />
        <input name="department" value={form.department} onChange={handleChiefDoctorFormChange} placeholder="Department" />
        <input name="city" value={form.city} onChange={handleChiefDoctorFormChange} placeholder="City" />
        <input name="phone" value={form.phone} onChange={handleChiefDoctorFormChange} placeholder="Phone (9–12 digits)" />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChiefDoctorFormChange} />
        <input name="email" type="email" value={form.email} onChange={handleChiefDoctorFormChange} placeholder="Email *" required={!isEdit} />
        {!isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefDoctorFormChange} placeholder="Password (min 6 characters) *" required />
        )}
        {isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefDoctorFormChange} placeholder="New password (optional, leave empty to keep current)" />
        )}
        <select name="status" value={form.status} onChange={handleChiefDoctorFormChange}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="modal-actions">
          <button onClick={handleSave}>{type}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation modal for deleting a doctor.
 * @param {Object} props - Component props
 * @param {Object} props.doctor - Doctor to delete
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteModal = ({ doctor, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>
        Delete <strong>{doctor.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Doctors;
