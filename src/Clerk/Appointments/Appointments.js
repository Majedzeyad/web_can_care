import React, { useMemo, useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Appointments.css';
import { useApp } from '../context/AppContext';

/**
 * Appointments management page for Clerk.
 * Displays and manages all appointments with search, calendar filtering, and CRUD operations.
 * All data is synchronized with Firestore through AppContext.
 * @returns {JSX.Element} Appointments management interface
 */
const Appointments = () => {
  const {
    patients, doctors, appointments,
    patientById, doctorById,
    availableSlots, addAppointment, editAppointment, removeAppointment, genId
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [modal, setModal] = useState({ type: '', appointment: null, err: '' });

  /**
   * Debounces search input for smooth typing experience.
   * Updates search state 300ms after user stops typing.
   */
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  /**
   * Filters appointments based on search query and selected date.
   * Matches against patient name, doctor name, or date string.
   * @type {Array}
   */
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return appointments.filter(a => {
      const patientName = patientById[a.patientId]?.name || '';
      const doctorName  = doctorById[a.doctorId]?.name  || '';
      const match =
        patientName.toLowerCase().includes(s) ||
        doctorName.toLowerCase().includes(s) ||
        a.date.includes(s);

      if (selectedDate) {
        return match && a.date === selectedDate;
      }
      return match;
    });
  }, [appointments, search, selectedDate, patientById, doctorById]);

  /**
   * Gets available time slots for a specific doctor on the selected date.
   * @param {string} doctorId - Doctor ID
   * @returns {Array<string>} List of available time slots
   */
  const slotsForDoctor = (doctorId) => {
    const day = selectedDate || new Date().toISOString().split('T')[0];
    return availableSlots(doctorId, day);
  };

  /**
   * Opens a modal dialog for appointment operations (add, edit, delete).
   * @param {string} type - Modal type: 'add', 'edit', or 'delete'
   * @param {Object|null} appointment - Appointment data (null for add operation)
   */
  const openClerkAppointmentModal  = (type, appointment = null) => setModal({ type, appointment, err: '' });
  
  /**
   * Closes the modal dialog and resets error state.
   */
  const closeClerkAppointmentModal = () => setModal({ type: '', appointment: null, err: '' });

  /**
   * Handles saving an appointment (add or edit).
   * Catches and displays errors if save operation fails.
   * @param {Object} form - Appointment form data
   */
  const handleSave = (form) => {
    try {
      if (modal.type === 'add') addAppointment(form);
      else editAppointment(form);
      closeClerkAppointmentModal();
    } catch (e) {
      setModal(m => ({ ...m, err: e.message || 'Failed to save appointment' }));
    }
  };

  /**
   * Handles deleting an appointment.
   * @param {string} id - Appointment ID to delete
   */
  const handleDeleteClerkAppointment = (id) => { removeAppointment(id); closeClerkAppointmentModal(); };

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <h2>Appointments</h2>
        <button
          className="add-btn"
          onClick={() =>
            openClerkAppointmentModal('add', {
              id: genId('A'),
              patientId: patients[0]?.id || '',
              doctorId: doctors[0]?.id || '',
              date: selectedDate || new Date().toISOString().split('T')[0],
              time: '',
              status: 'Scheduled',
            })
          }
        >
          Add Appointment
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="Search by patient, doctor or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Calendar + Slots */}
      <div className="appointments-calendar-section">
        <Calendar value={selectedDate ? new Date(selectedDate) : null} onChange={d => setSelectedDate(d.toISOString().split('T')[0])} className="calendar" />

        <div className="doctor-slots">
          <h3>Available Slots</h3>
          {doctors.map((doc) => {
            const slots = slotsForDoctor(doc.id);
            return (
              <div key={doc.id} className="doctor-slot">
                <strong>{doc.name}</strong>
                <div className="slots">
                  {slots.length ? slots.map(slot => (
                    <span
                      key={slot}
                      className="slot"
                      style={{ cursor: 'pointer' }}
                      title="Book this slot"
                      onClick={() =>
                        openClerkAppointmentModal('add', {
                          id: genId('A'),
                          patientId: patients[0]?.id || '',
                          doctorId: doc.id,
                          date: selectedDate || new Date().toISOString().split('T')[0],
                          time: slot,
                          status: 'Scheduled',
                        })
                      }
                    >
                      {slot}
                    </span>
                  )) : (
                    <span className="slot none">No slots available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date filter */}
      <div className="appointments-filters">
        <div className="date-filter-wrapper">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="clear-date-btn" onClick={() => setSelectedDate('')} disabled={!selectedDate}>×</button>
        </div>
      </div>

      {/* Table */}
      <div className="appointments-table-wrapper">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(a => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{patientById[a.patientId]?.name || '—'}</td>
                <td>{doctorById[a.doctorId]?.name || '—'}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td className="actions">
                  <button className="edit" onClick={() => openClerkAppointmentModal('edit', a)}>Edit</button>
                  <button className="delete" onClick={() => openClerkAppointmentModal('delete', a)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="empty">No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(modal.type === 'add' || modal.type === 'edit') && (
        <AppointmentModal
          type={modal.type}
          appointment={modal.appointment}
          onSave={handleSave}
          onClose={closeClerkAppointmentModal}
          patients={patients}
          doctors={doctors}
          availableSlots={availableSlots}
          errorMessage={modal.err}
        />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          appointment={modal.appointment}
          patientName={patientById[modal.appointment.patientId]?.name}
          doctorName={doctorById[modal.appointment.doctorId]?.name}
          onDelete={() => handleDeleteClerkAppointment(modal.appointment.id)}
          onClose={closeClerkAppointmentModal}
        />
      )}
    </div>
  );
};

// ---------- Modals (unchanged) ----------
/**
 * Modal component for adding or editing appointments.
 * Allows selection of patient, doctor, date, time, and status.
 * Automatically filters available time slots based on existing appointments.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'add' or 'edit'
 * @param {Object} props.appointment - Existing appointment data (for edit mode)
 * @param {Function} props.onSave - Callback when appointment is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Array} props.patients - List of available patients
 * @param {Array} props.doctors - List of available doctors
 * @param {Function} props.availableSlots - Function to get available slots
 * @param {string} props.errorMessage - Error message to display
 * @returns {JSX.Element} Appointment form modal
 */
const AppointmentModal = ({ type, appointment = {}, onSave, onClose, patients, doctors, availableSlots, errorMessage }) => {
  const [form, setForm] = useState({
    id: appointment?.id || '',
    patientId: appointment?.patientId || patients[0]?.id || '',
    doctorId: appointment?.doctorId || doctors[0]?.id || '',
    date: appointment?.date || '',
    time: appointment?.time || '',
    status: appointment?.status || 'Scheduled',
  });

  /**
   * Calculates available appointment time slots for the selected doctor and date.
   * Filters out slots that are already booked.
   * @type {Array<string>}
   */
  const slots = useMemo(() => {
    if (!form.doctorId || !form.date) return [];
    return availableSlots(form.doctorId, form.date);
  }, [form.doctorId, form.date, availableSlots]);

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleClerkAppointmentFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type === 'add' ? 'Add' : 'Edit'} Appointment</h2>
        <label>Patient</label>
        <select name="patientId" value={form.patientId} onChange={handleClerkAppointmentFormChange}>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleClerkAppointmentFormChange}>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <label>Date</label>
        <input type="date" name="date" value={form.date} onChange={handleClerkAppointmentFormChange} />

        <label>Time</label>
        <select name="time" value={form.time} onChange={handleClerkAppointmentFormChange}>
          <option value="">Select time</option>
          {slots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Status</label>
        <select name="status" value={form.status} onChange={handleClerkAppointmentFormChange}>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        {!!errorMessage && <div style={{ color: '#f44336', fontSize: 13, marginTop: 4 }}>{errorMessage}</div>}

        <div className="modal-actions">
          <button onClick={() => onSave(form)}>Save</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation modal for deleting an appointment.
 * @param {Object} props - Component props
 * @param {Object} props.appointment - Appointment to delete
 * @param {string} props.patientName - Patient name for display
 * @param {string} props.doctorName - Doctor name for display
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteModal = ({ appointment, patientName, doctorName, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Appointment</h2>
      <p>Delete appointment for <strong>{patientName}</strong> with {doctorName} on {appointment.date}?</p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Appointments;
