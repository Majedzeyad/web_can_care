// src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import './style/Appointments.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

/**
 * Appointments management page for Chief/Admin.
 * Displays and manages all appointments with search, calendar filtering, and CRUD operations.
 * Note: Currently uses mock data and is not connected to Firestore.
 * @returns {JSX.Element} Appointments management interface
 */
const Appointments = () => {

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [appointments, setAppointments] = useState([
    {
      id: 'A-001',
      patient: 'Ahmad Saleh',
      doctor: 'Dr. Omar Khaled',
      date: '2025-12-20',
      time: '10:00 AM',
      status: 'Pending',
    },
    {
      id: 'A-002',
      patient: 'Sara Mahmoud',
      doctor: 'Dr. Lina Yousef',
      date: '2025-12-21',
      time: '02:00 PM',
      status: 'Confirmed',
    },
  ]);

  const [modal, setModal] = useState({ type: '', appointment: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);


  /**
   * Filters appointments based on search query and selected date.
   * Matches against patient name, doctor name, or date string.
   * @type {Array}
   */
  const filteredAppointments = appointments.filter(
    (a) =>
      (a.patient.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor.toLowerCase().includes(search.toLowerCase()) ||
        a.date.includes(search)) &&
      (!selectedDate || new Date(a.date).toDateString() === selectedDate.toDateString())
  );

  /**
   * Gets the next 3 upcoming appointments sorted by date.
   * @type {Array}
   */
  const nextAppointments = appointments
    .filter(a => new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  /**
   * Opens a modal dialog for appointment operations (add, edit, delete).
   * @param {string} type - Modal type: 'add', 'edit', or 'delete'
   * @param {Object|null} appointment - Appointment data (null for add operation)
   */
  const openChiefAppointmentModal = (type, appointment = null) => {
    setModal({ type, appointment });
  };

  /**
   * Saves an appointment (MOCK ONLY).
   * ! NOT CONNECTED TO FIRESTORE.
   * @param {Object} appt - Appointment data.
   */
  const handleSaveAppointment = (appt) => {
    if (modal.type === 'add') {
      setAppointments([...appointments, appt]);
    } else if (modal.type === 'edit') {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, ...appt } : a))
      );
    }
    setModal({ type: '', appointment: null });
  };

  /**
   * Deletes an appointment (MOCK ONLY).
   * ! NOT CONNECTED TO FIRESTORE.
   * @param {string} id - Appointment ID.
   */
  const handleDeleteAppointment = (id) => {
    setAppointments(appointments.filter((a) => a.id !== id));
    setModal({ type: '', appointment: null });
  };

  return (
    <div className="appointments-page">
      <h1>Appointments</h1>
      <p>Manage all appointments for patients and doctors.</p>

      {/* Actions */}
      <div className="appointments-actions">
        <input
          type="text"
          placeholder="Search by patient, doctor, or date"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => openChiefAppointmentModal('add')}>Add Appointment</button>
      </div>

      {/* Calendar & Next Appointments */}
      <div className="appointments-calendar-section">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          className="calendar"
        />
        <div className="next-appointments">
          <h3>Next Appointments</h3>
          {nextAppointments.length > 0 ? (
            <ul>
              {nextAppointments.map((a) => (
                <li key={a.id}>
                  <strong>{a.patient}</strong> with {a.doctor} <br />
                  {a.date} at {a.time} - <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming appointments</p>
          )}
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
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading appointments...
                </td>
              </tr>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>
                    <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                  </td>
                  <td>
                    <button onClick={() => openChiefAppointmentModal('edit', a)}>Edit</button>
                    <button onClick={() => openChiefAppointmentModal('delete', a)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'add' || modal.type === 'edit' ? (
        <AppointmentModal
          type={modal.type}
          appointment={modal.appointment}
          onSave={handleSaveAppointment}
          onClose={() => openChiefAppointmentModal('', null)}
        />
      ) : null}

      {modal.type === 'delete' && (
        <DeleteModal
          appointment={modal.appointment}
          onDelete={() => handleDeleteAppointment(modal.appointment.id)}
          onClose={() => openChiefAppointmentModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

/**
 * Modal component for adding or editing appointments.
 * Provides form fields for patient, doctor, date, time, and status.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'add' or 'edit'
 * @param {Object} props.appointment - Existing appointment data (for edit mode)
 * @param {Function} props.onSave - Callback when appointment is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Appointment form modal
 */
const AppointmentModal = ({ type, appointment = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    id: appointment.id || `A-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    patient: appointment.patient || '',
    doctor: appointment.doctor || '',
    date: appointment.date || '',
    time: appointment.time || '',
    status: appointment.status || 'Pending',
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleChiefAppointmentFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type === 'add' ? 'Add' : 'Edit'} Appointment</h2>
        <input name="patient" value={form.patient} onChange={handleChiefAppointmentFormChange} placeholder="Patient Name" />
        <input name="doctor" value={form.doctor} onChange={handleChiefAppointmentFormChange} placeholder="Doctor Name" />
        <input type="date" name="date" value={form.date} onChange={handleChiefAppointmentFormChange} />
        <input type="time" name="time" value={form.time} onChange={handleChiefAppointmentFormChange} />
        <select name="status" value={form.status} onChange={handleChiefAppointmentFormChange}>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
        <div className="modal-actions">
          <button onClick={() => onSave(form)}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation modal for deleting an appointment.
 * @param {Object} props - Component props
 * @param {Object} props.appointment - Appointment to delete
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteModal = ({ appointment, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Appointment</h2>
      <p>
        Delete <strong>{appointment.patient}</strong> with {appointment.doctor} on {appointment.date}?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Appointments;