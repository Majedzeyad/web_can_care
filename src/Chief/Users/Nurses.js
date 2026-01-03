import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';
import { subscribeToNurses, createNurse, updateNurse, deleteNurse } from '../../services/firestoreService';

/**
 * Nurses management page for Chief/Admin.
 * Displays list of nurses with search functionality, statistics cards,
 * and CRUD operations. All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Nurses management interface
 */
const Nurses = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [nurses, setNurses] = useState([]);
  const [modal, setModal] = useState({ type: '', nurse: null });

  // Subscribe to Firebase nurses collection
  useEffect(() => {
    const unsubscribe = subscribeToNurses((nursesData) => {
      setNurses(nursesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Filters nurses based on search query (matches name or ID).
   * @type {Array}
   */
  const filteredNurses = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.id.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Opens a modal dialog for nurse operations (add, edit, or delete).
   * @param {string} type - Modal type: 'add', 'edit', or 'delete'
   * @param {Object|null} nurse - Nurse data (null for add operation)
   */
  const openChiefNurseModal = (type, nurse = null) => {
    setModal({ type, nurse });
  };

  /**
   * Adds a new nurse - saves to Firebase.
   * @param {Object} newNurse - New nurse data
   */
  const handleAddNurse = async (newNurse) => {
    try {
      const { id, ...data } = newNurse;
      await createNurse(data);
    setModal({ type: '', nurse: null });
    } catch (error) {
      console.error('Error adding nurse:', error);
      alert(`Error adding nurse: ${error.message}`);
    }
  };

  /**
   * Updates an existing nurse's information - saves to Firebase.
   * @param {Object} updatedNurse - Updated nurse data
   */
  const handleEditNurse = async (updatedNurse) => {
    try {
      const { id, email, password, ...updateData } = updatedNurse;
      
      if (id && !id.startsWith('N-')) {
        await updateNurse(id, updateData);
        
        // إذا كان هناك password جديد
        if (password && password.trim()) {
          console.warn('Password update requires admin privileges.');
        }
      }
    setModal({ type: '', nurse: null });
    } catch (error) {
      console.error('Error updating nurse:', error);
      alert(`Error updating nurse: ${error.message}`);
    }
  };

  /**
   * Deletes a nurse - removes from Firebase.
   * @param {string} id - Nurse ID to delete
   */
  const handleDeleteNurse = async (id) => {
    try {
      await deleteNurse(id);
    setModal({ type: '', nurse: null });
    } catch (error) {
      console.error('Error deleting nurse:', error);
      alert(`Error deleting nurse: ${error.message}`);
    }
  };

  // Dashboard cards - من Firebase
  const totalNurses = nurses.length;
  const activeNurses = nurses.filter(n => n.status === 'Active' || !n.status).length;
  const morningShift = nurses.filter(n => 
    n.shift === 'Morning' || n.shift === 'morning' || 
    (n.shift && n.shift.toLowerCase().includes('morning'))
  ).length;
  const nightShift = nurses.filter(n => 
    n.shift === 'Night' || n.shift === 'night' || 
    (n.shift && n.shift.toLowerCase().includes('night'))
  ).length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Nurses</h1>
        <p>Manage registered nurses and their shifts.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Nurses</h3>
          <span>{totalNurses}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{activeNurses}</span>
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
              <th>Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading nurses...
                </td>
              </tr>
            ) : filteredNurses.length > 0 ? (
              filteredNurses.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.name || 'Unknown'}</td>
                  <td>{n.department || '—'}</td>
                  <td>{n.shift || '—'}</td>
                  <td>
                    <span className={`status ${(n.status || 'Active').toLowerCase()}`}>
                      {n.status || 'Active'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${n.id}`, { state: { role: 'Nurse' } })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openChiefNurseModal('edit', n)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openChiefNurseModal('delete', n)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No nurses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'add' && (
        <NurseModal type="Add" onSave={handleAddNurse} onClose={() => openChiefNurseModal('', null)} />
      )}
      {modal.type === 'edit' && (
        <NurseModal type="Edit" nurse={modal.nurse} onSave={handleEditNurse} onClose={() => openChiefNurseModal('', null)} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          nurse={modal.nurse}
          onDelete={() => handleDeleteNurse(modal.nurse.id)}
          onClose={() => openChiefNurseModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

/**
 * Modal component for adding or editing nurse information.
 * Allows modification of nurse details including department, shift, and status.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'Add' or 'Edit'
 * @param {Object} props.nurse - Existing nurse data (for edit mode)
 * @param {Function} props.onSave - Callback when nurse is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Nurse form modal
 */
const NurseModal = ({ type, nurse = {}, onSave, onClose }) => {
  const isEdit = !!nurse.id;
  const [form, setForm] = useState({
    id: nurse.id || '',
    name: nurse.name || '',
    department: nurse.department || '',
    shift: nurse.shift || 'morning',
    phone: nurse.phone || '',
    dob: nurse.dob || '',
    email: nurse.email || '',
    password: '',
    status: nurse.status || 'Active',
    uid: nurse.uid || '',
    // Stats
    assignedPatients: nurse.stats?.assignedPatients || 0,
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleChiefNurseFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Validates and saves the nurse form.
   */
  const handleSave = async () => {
    if (!form.name.trim()) return alert('Nurse name is required.');
    
    // التحقق من صحة البريد الإلكتروني للممرضين الجدد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && (!form.email.trim() || !emailRegex.test(form.email))) {
      return alert('Valid email is required for new nurses.');
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters for new nurses.');
    }

    // إعداد البيانات للحفظ
    const saveData = {
      ...form,
      stats: {
        assignedPatients: Number(form.assignedPatients) || 0,
      },
    };
    
    // إزالة الحقول التي لا يجب حفظها
    const { id, uid, assignedPatients, ...rest } = saveData;
    const finalData = {
      ...rest,
      stats: saveData.stats,
    };

    if (isEdit && nurse.id && !nurse.id.startsWith('N-')) {
      // تحديث ممرض موجود
      await onSave({ ...finalData, id });
    } else {
      // إنشاء ممرض جديد
      await onSave(finalData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type} Nurse</h2>
        {isEdit && <input name="id" value={form.id} disabled placeholder="ID" />}
        <input name="name" value={form.name} onChange={handleChiefNurseFormChange} placeholder="Full Name *" required />
        <input name="department" value={form.department} onChange={handleChiefNurseFormChange} placeholder="Department/Shift" />
        <input name="phone" value={form.phone} onChange={handleChiefNurseFormChange} placeholder="Phone (9–12 digits)" />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChiefNurseFormChange} />
        <input name="email" type="email" value={form.email} onChange={handleChiefNurseFormChange} placeholder="Email *" required={!isEdit} />
        {!isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefNurseFormChange} placeholder="Password (min 6 characters) *" required />
        )}
        {isEdit && (
          <input name="password" type="password" value={form.password} onChange={handleChiefNurseFormChange} placeholder="New password (optional)" />
        )}
        <select name="shift" value={form.shift} onChange={handleChiefNurseFormChange}>
          <option>Morning</option>
          <option>Night</option>
        </select>
        <select name="status" value={form.status} onChange={handleChiefNurseFormChange}>
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
 * Confirmation modal for deleting a nurse.
 * @param {Object} props - Component props
 * @param {Object} props.nurse - Nurse to delete
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteModal = ({ nurse, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Nurse</h2>
      <p>
        Delete <strong>{nurse.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Nurses;
