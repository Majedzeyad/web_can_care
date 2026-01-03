// src/ChiefDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./style/Dashboard.css";
import { subscribeToCollection, appAddDoc, appUpdateDoc, appDeleteDoc } from "../services/firestoreService";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---- Helpers (no external deps)
/**
 * Formats a Date object to ISO date string (YYYY-MM-DD).
 * @param {Date} d - Date object to format
 * @returns {string} ISO date string or undefined if date is invalid
 */
const fmtDay = (d) => d?.toISOString().split("T")[0];

/**
 * Parses an ISO date string (YYYY-MM-DD) into a Date object.
 * @param {string} s - ISO date string
 * @returns {Date} Parsed Date object or null if invalid
 */
const parseISO = (s) => {
  if (!s || typeof s !== 'string') return null;
  try {
  const [y, m, d] = s.split("-").map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
  } catch (e) {
    return null;
  }
};

/**
 * Checks if a date string falls within a start and end date range.
 * @param {string} dateStr - Date string to check.
 * @param {Date} start - Start date of the range.
 * @param {Date} end - End date of the range.
 * @returns {boolean} True if in range, false otherwise.
 */
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false; // إذا لم يكن هناك تاريخ، لا يتم تضمينه
  const d = parseISO(dateStr);
  if (!d) return false; // إذا فشل التحليل، لا يتم تضمينه
  return (!start || d >= start) && (!end || d <= end);
};

/**
 * Chief/Admin Dashboard component.
 * Displays comprehensive overview of hospital operations including KPIs, appointments,
 * calendar, department statistics, and allows creation of posts and notifications.
 * Provides read-first interface with intervention capabilities when needed.
 * @returns {JSX.Element} The complete dashboard interface
 */
const ChiefDashboard = () => {
  // Persistent state (Firestore)
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  // تحديث التاريخ الحالي كل دقيقة للتحقق من تغيير اليوم
  useEffect(() => {
    const updateCurrentDate = () => {
      const now = new Date();
      setCurrentDate(now);
      setLastUpdateTime(now);
    };

    // تحديث فوري
    updateCurrentDate();

    // تحديث كل دقيقة
    const interval = setInterval(updateCurrentDate, 60000);

    return () => clearInterval(interval);
  }, []);

  // Firestore Subscriptions - استخدام collections الجديدة
  useEffect(() => {
    const { subscribeToWebAppointments, subscribeToWebWaitlist, subscribeToWebTransfers, subscribeToWebPosts, subscribeToWebNotifications } = require("../services/firestoreService");
    
    const unsubs = [
      subscribeToWebAppointments(setAppointments), // استخدام web_appointments
      subscribeToCollection("doctors", setDoctors),
      subscribeToCollection("nurses", setNurses),
      subscribeToCollection("patients", setPatients),
      subscribeToWebWaitlist(setWaitlist), // استخدام web_waitlist
      subscribeToWebTransfers(setTransfers), // استخدام web_transfers
      subscribeToWebPosts(setPosts), // استخدام web_posts
      subscribeToWebNotifications(setNotifications) // استخدام web_notifications
    ];
    setLoading(false);
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  // تحديث الإحصائيات اليومية عند تغيير التاريخ
  useEffect(() => {
    const todayStr = fmtDay(currentDate);
    const previousDayStr = fmtDay(new Date(currentDate.getTime() - 86400000));
    
    if (todayStr !== previousDayStr) {
      console.log('New day detected in Chief Dashboard, refreshing daily statistics...');
      setLastUpdateTime(new Date());
    }
  }, [currentDate]);

  // Calendar + timeframe (same logic you sent)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayStr = fmtDay(selectedDate);

  const [timeframe, setTimeframe] = useState("7d"); // today, 7d, 30d, all, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // استخدام currentDate المحدث تلقائياً للتحديث اليومي
  const now = currentDate;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const makeOffset = (days) => new Date(todayStart.getTime() - days * 86400000);

  let rangeStart = null, rangeEnd = null;
  if (timeframe === "today") {
    rangeStart = todayStart;
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "7d") {
    rangeStart = makeOffset(6);
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "30d") {
    rangeStart = makeOffset(29);
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "custom") {
    rangeStart = customStart ? parseISO(customStart) : null;
    rangeEnd = customEnd ? parseISO(customEnd) : null;
  } // all => nulls

  // Daily Statistics - إحصائيات يومية من Firebase
  const todayStr = fmtDay(currentDate);
  const dailyStats = useMemo(() => {
    const today = fmtDay(currentDate);
    
    // المواعيد اليوم
    const todayAppointments = appointments.filter((a) => a.date === today);
    const todayScheduled = todayAppointments.filter((a) => 
      a.status === 'scheduled' || a.status === 'Scheduled'
    ).length;
    const todayCompleted = todayAppointments.filter((a) => 
      a.status === 'completed' || a.status === 'Completed'
    ).length;
    const todayCancelled = todayAppointments.filter((a) => 
      a.status === 'cancelled' || a.status === 'Cancelled'
    ).length;
    
    // المرضى الجدد اليوم
    const newPatientsToday = patients.filter((p) => {
      if (!p.createdAt) return false;
      const createdDate = p.createdAt instanceof Date ? p.createdAt : p.createdAt.toDate();
      return fmtDay(createdDate) === today;
    }).length;
    
    // الأطباء النشطين اليوم
    const activeDoctorsToday = doctors.filter((d) => {
      const doctorAppointments = todayAppointments.filter((a) => 
        a.doctorId === d.uid || a.doctorId === d.id || a.doctorName === d.name || a.doctor === d.name
      );
      return doctorAppointments.length > 0;
    }).length;
    
    return {
      todayAppointments: todayAppointments.length,
      todayScheduled,
      todayCompleted,
      todayCancelled,
      newPatientsToday,
      activeDoctorsToday,
    };
  }, [appointments, patients, doctors, currentDate]);

  // KPIs - من Firebase فقط
  const kpis = useMemo(() => [
    { label: "Patients Under Care", value: patients.length },
    { label: "Doctors On Duty", value: doctors.length },
    { label: "Nurses Assigned", value: nurses.length },
    { label: "Appointments Today", value: dailyStats.todayAppointments },
    { label: "Completed Today", value: dailyStats.todayCompleted },
    { label: "Active Doctors Today", value: dailyStats.activeDoctorsToday },
  ], [patients.length, doctors.length, nurses.length, dailyStats]);

  // Data in timeframe
  const apptsInTimeframe = useMemo(() => {
    if (timeframe === "all") return appointments;
    return appointments.filter((a) => inRange(a.date, rangeStart, rangeEnd));
  }, [appointments, timeframe, customStart, customEnd]);

  /**
   * Retrieves the department name for a given doctor name or ID.
   * Supports both doctor and doctorName fields.
   * @param {string} doctorIdentifier - Doctor's name or ID
   * @returns {string} Department name or "Unknown" if not found
   */
  const getDeptByDoctorName = (doctorIdentifier) => {
    const doctor = doctors.find((d) => 
      d.name === doctorIdentifier || 
      d.id === doctorIdentifier || 
      d.uid === doctorIdentifier
    );
    return doctor?.department ?? "Unknown";
  };

  // Department statistics from Firebase appointments
  const deptData = useMemo(() => {
    const counts = {};
    apptsInTimeframe.forEach((a) => {
      // دعم كل من doctor و doctorName
      const doctorName = a.doctor || a.doctorName;
      if (!doctorName) return; // تخطي إذا لم يكن هناك طبيب
      const dep = getDeptByDoctorName(doctorName);
      counts[dep] = (counts[dep] ?? 0) + 1;
    });
    if (!Object.keys(counts).length) {
      // إذا لم تكن هناك مواعيد، عرض جميع الأقسام
      doctors.forEach((d) => {
        const key = d.department ?? "Unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [apptsInTimeframe, doctors]);

  const COLORS = ["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"];

  // Alerts - من Firebase فقط
  const todaysVisits = useMemo(() => {
    return appointments.filter((a) => {
      const appointmentDate = a.date || '';
      return appointmentDate === todayStr;
    });
  }, [appointments, todayStr]);

  const cancelledInRange = useMemo(() => {
    return apptsInTimeframe.filter((a) => 
      a.status === "Cancelled" || a.status === "cancelled"
    );
  }, [apptsInTimeframe]);

  // Interventions
  const [editingAppt, setEditingAppt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /**
   * Saves an appointment to Firestore (Create or Update) - using web_appointments.
   * @param {Object} ap - Appointment data.
   */
  const saveAppointment = async (ap) => {
    try {
      const { createWebAppointment, updateWebAppointment } = require('../services/firestoreService');
      
      if (ap.id && !ap.id.startsWith("A-")) {
        // تحديث موعد موجود
        const updates = {};
        if (ap.patient || ap.patientName) updates.patientName = ap.patient || ap.patientName;
        if (ap.patientId) updates.patientId = ap.patientId;
        if (ap.doctor || ap.doctorName) {
          const doctor = doctors.find(d => d.name === ap.doctor || d.id === ap.doctorId || d.uid === ap.doctorId);
          if (doctor) {
            updates.doctorId = doctor.uid || doctor.id;
            updates.doctorName = doctor.name;
          }
        }
        if (ap.date) updates.date = ap.date;
        if (ap.time) updates.time = ap.time;
        if (ap.status) updates.status = ap.status;
        if (ap.notes !== undefined) updates.notes = ap.notes;
        
        await updateWebAppointment(ap.id, updates);
      } else {
        // إنشاء موعد جديد
        const doctor = doctors.find(d => d.name === ap.doctor || d.id === ap.doctorId || d.uid === ap.doctorId);
        const patient = patients.find(p => p.name === ap.patient || p.id === ap.patientId);
        
        await createWebAppointment({
          patientId: patient?.id || ap.patientId || null,
          patientName: patient?.name || ap.patient || ap.patientName,
          doctorId: doctor?.uid || doctor?.id || ap.doctorId,
          doctorName: doctor?.name || ap.doctor || ap.doctorName,
          date: ap.date,
          time: ap.time,
          status: ap.status || 'scheduled',
          notes: ap.notes || ''
        });
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert(`Error: ${error.message}`);
    }
  };

  /**
   * Updates status of an appointment - using web_appointments.
   * @param {string} id - Appointment ID.
   * @param {string} status - New status.
   */
  const updateStatus = async (id, status) => {
    try {
      const { updateWebAppointment } = require('../services/firestoreService');
      await updateWebAppointment(id, { status });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert(`Error: ${error.message}`);
    }
  };

  /**
   * Deletes an appointment - using web_appointments.
   * @param {string} id - Appointment ID.
   */
  const deleteAppointment = async (id) => {
    try {
      const { deleteWebAppointment } = require('../services/firestoreService');
      await deleteWebAppointment(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // NEW: Actions — post & notification modals
  const [showPost, setShowPost] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  /**
   * Creates a new post in the 'web_posts' collection.
   * @param {Object} payload - Post data (title, content, category).
   */
  const onCreatePost = async (payload) => {
    try {
      const { createWebPost } = require('../services/firestoreService');
      await createWebPost({
        title: payload.title,
        content: payload.content,
        category: payload.category || 'General',
        image: payload.image ? payload.image.name : '', // image file name or URL
        authorName: 'Chief',
      });
    alert("Post created ✅");
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Error creating post: ${error.message}`);
    }
  };

  /**
   * Sends a new notification to the 'web_notifications' collection.
   * @param {Object} payload - Notification details (audience, message, priority).
   */
  const onSendNotification = async (payload) => {
    try {
      const { createWebNotification } = require('../services/firestoreService');
      await createWebNotification({
        audience: payload.audience || 'All',
        toId: payload.toId || null,
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority ? payload.priority.toLowerCase() : 'medium',
      });
    alert("Notification sent ✅");
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`Error sending notification: ${error.message}`);
    }
  };

  // Derived flags (optional): to auto-collapse when empty
  const hasAppointments = apptsInTimeframe.length > 0;
  const hasAlertsToday = todaysVisits.length > 0;
  const hasAlertsCancelled = cancelledInRange.length > 0;
  const hasAnyAlerts = hasAlertsToday || hasAlertsCancelled;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="chief-page">
      {/* Header with quick actions */}
      <header className="chief-header">
        <div>
          <h1>Department Oversight</h1>
          <p>Read-first, intervene when needed</p>
        </div>
        <div className="chief-toolbar">
          <span className="chief-badge">Today: {todayStr}</span>
          <span className="chief-badge" style={{ fontSize: '11px' }}>Updated: {lastUpdateTime.toLocaleTimeString()}</span>
          <button className="chief-btn primary" onClick={() => setShowPost(true)}>Create Post</button>
          <button className="chief-btn primary" onClick={() => setShowNotif(true)}>Send Notification</button>
        </div>
      </header>

      {/* KPIs */}
      <section className="chief-kpis" aria-label="Key medical activity">
        {kpis.map((k) => (
          <div key={k.label} className="chief-kpi">
            <div className="chief-kpi-label">{k.label}</div>
            <div className="chief-kpi-value">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Two-column grid */}
      <div className="chief-grid">
        {/* LEFT COLUMN */}
        <section className="chief-card">
          {/* Calendar */}
          <div className="chief-card-title"><h3>Calendar</h3></div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: 8 }}>
            <Calendar value={selectedDate} onChange={setSelectedDate} />
            <div style={{ marginTop: 8, color: "var(--muted)" }}>Selected: {dayStr}</div>
          </div>

          {/* Timeframe */}
          <div className="chief-subcard">
            <div className="chief-subcard-title">
              <h4>Timeframe</h4>
              <span className="chief-badge">{apptsInTimeframe.length}</span>
            </div>
            <div className="chief-inline-actions">
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All</option>
                <option value="custom">Custom</option>
              </select>
              {timeframe === "custom" && (
                <>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  <span>to</span>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
              Range: {rangeStart ? fmtDay(rangeStart) : "—"} → {rangeEnd ? fmtDay(rangeEnd) : "—"}
            </div>
          </div>

          {/* On‑Duty Roster (compact stacked) */}
          <div className="chief-panel" style={{ marginTop: 14 }}>
            <div className="chief-subcard-title"><h4>On‑Duty Roster</h4></div>
            <div className="chief-roster">
              <div>
                <h5>Doctors</h5>
                <ul className="compact-list">{(doctors || []).filter(d => d && d.id).map((d) => <li key={d.id}>{d.name || 'Unknown'}</li>)}</ul>
              </div>
              <div>
                <h5>Nurses</h5>
                <ul className="compact-list">{(nurses || []).filter(n => n && n.id).map((n) => <li key={n.id}>{n.name || 'Unknown'}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* Queues (compact stacked) */}
          <div className="chief-panel" style={{ marginTop: 14 }}>
            <div className="chief-card-title" style={{ marginBottom: 8 }}>
              <h4>Queues</h4>
              <span className="chief-badge">{waitlist.length + transfers.length}</span>
            </div>
            <div className="chief-status">
              <div className="chip">Waitlist: {waitlist.length}</div>
              <div className="chip">Transfers: {transfers.length}</div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="chief-card">
          {/* Donut chart at top */}
          <div className="chief-subcard">
            <div className="chief-subcard-title"><h4>Visits by Department</h4></div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={deptData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {deptData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts (auto‑collapse when no alerts) */}
          {hasAnyAlerts && (
            <div className="chief-block">
              <h3>Alerts</h3>
              <div className="chief-quick" style={{ marginBottom: 10 }}>
                <span className="chief-badge">Today’s: {todaysVisits.length}</span>
                <span className="chief-badge">Cancelled: {cancelledInRange.length}</span>
              </div>

              {hasAlertsToday && (
                <>
                  <h4 style={{ margin: 0 }}>Today’s Visits</h4>
                  <ul className="chief-activity">
              {todaysVisits.map((v) => {
                    const patientName = v.patient || v.patientName || 'Unknown';
                    const doctorName = v.doctor || v.doctorName || 'Unknown';
                    return (
                      <li key={v.id}>
                        Today: <strong>{patientName}</strong> with <strong>{doctorName}</strong> at {v.time || 'N/A'}.
                      </li>
                    );
                  })}
                  </ul>
                </>
              )}

              {hasAlertsCancelled && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
                  <h4 style={{ margin: 0 }}>Cancelled (selected range)</h4>
                  <ul className="chief-activity">
                    {cancelledInRange.map((v) => {
                      const patientName = v.patient || v.patientName || 'Unknown';
                      const doctorName = v.doctor || v.doctorName || 'Unknown';
                      return (
                        <li key={v.id}>
                          {patientName} — {doctorName} on {v.date || 'N/A'} ({v.time || 'N/A'})
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Appointments */}
          {hasAppointments ? (
            <div className="chief-block">
              <h3>Appointments (selected range)</h3>
              <ul className="chief-today-list">
                {apptsInTimeframe.map((a) => {
                  const patientName = a.patient || a.patientName || 'Unknown';
                  const doctorName = a.doctor || a.doctorName || 'Unknown';
                  return (
                  <li key={a.id} className="chief-today-item">
                    <div className="chief-today-main">
                      <span className="chief-strong">{patientName}</span> with {doctorName}
                    </div>
                    <div className="chief-today-meta">
                      {a.date || 'N/A'} · {a.time || 'N/A'} · <span className={`chief-badge chip ${(a.status || '').toLowerCase()}`}>{a.status || 'Unknown'}</span>
                    </div>
                    <div className="chief-list-actions">
                      {a.status !== "Completed" && (
                        <button className="chief-btn" onClick={() => updateStatus(a.id, "Completed")}>Mark Completed</button>
                      )}
                      {a.status !== "Cancelled" && (
                        <button className="chief-btn danger" onClick={() => updateStatus(a.id, "Cancelled")}>Cancel</button>
                      )}
                      <button className="chief-link" onClick={() => setEditingAppt({ ...a })}>Edit</button>
                      <button className="chief-link danger" onClick={() => setConfirmDelete({ type: "appointment", id: a.id })}>Delete</button>
                    </div>
                  </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="chief-block">
              <h3>Appointments (selected range)</h3>
              <div className="chief-status"><div className="chip">No appointments in selected range</div></div>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {editingAppt && (
        <AppointmentModal
          initial={editingAppt || {}}
          patients={patients || []}
          doctors={doctors || []}
          appointments={appointments || []}
          onSave={(ap) => { saveAppointment(ap); setEditingAppt(null); }}
          onClose={() => setEditingAppt(null)}
        />
      )}

      {showPost && (
        <PostModal
          onSave={(payload) => { onCreatePost(payload); setShowPost(false); }}
          onClose={() => setShowPost(false)}
        />
      )}

      {showNotif && (
        <NotifyModal
          onSend={(payload) => { onSendNotification(payload); setShowNotif(false); }}
          onClose={() => setShowNotif(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type}?`}
          message="This action cannot be undone."
          onConfirm={() => {
            const { type, id } = confirmDelete;
            if (type === "appointment") deleteAppointment(id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ====== Modals ======

/**
 * Modal component for creating or editing appointments.
 * Allows selection of patient, doctor, date, time, and status.
 * Automatically filters available time slots based on existing appointments.
 * @param {Object} props - Component props
 * @param {Object} props.initial - Initial appointment data for editing
 * @param {Array} props.patients - List of available patients
 * @param {Array} props.doctors - List of available doctors
 * @param {Array} props.appointments - List of existing appointments
 * @param {Function} props.onSave - Callback when appointment is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Appointment form modal
 */
const AppointmentModal = ({ initial, patients, doctors, appointments, onSave, onClose }) => {
  // التأكد من أن initial ليس null
  const defaultForm = {
    id: '',
    patient: '',
    patientName: '',
    patientId: '',
    doctor: '',
    doctorName: '',
    doctorId: '',
    date: '',
    time: '',
    status: 'scheduled',
    notes: '',
  };
  
  // دمج initial مع defaultForm للتأكد من وجود جميع الحقول
  const initialForm = initial ? { ...defaultForm, ...initial } : defaultForm;
  const [form, setForm] = useState(initialForm);
  
  // التأكد من أن form ليس null أبداً
  const safeForm = form || defaultForm;

  /**
   * Calculates available appointment time slots for a doctor on a specific date.
   * Filters out time slots that are already booked.
   * @param {string} docName - Doctor's name
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Array<string>} List of available time slots
   */
  const availableSlots = (docName, dateStr) => {
    // البحث عن الطبيب
    const doctor = doctors.find(d => d.name === docName);
    
    // Slots افتراضية شاملة
    const defaultSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    // الحصول على slots من workSchedule
    let base = [];
    if (doctor && doctor.workSchedule && dateStr) {
      try {
        const date = new Date(dateStr + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[date.getDay()];
          const daySchedule = doctor.workSchedule[dayName];
          
          if (daySchedule && daySchedule.enabled && daySchedule.slots && daySchedule.slots.length > 0) {
            base = daySchedule.slots;
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    // Fallback إلى slots افتراضية
    if (base.length === 0) {
      base = defaultSlots;
    }
    
    // فلترة المواعيد المحجوزة
    const taken = (appointments || [])
      .filter((a) => {
        if (!a) return false;
        const aDoctor = a.doctor || a.doctorName;
        const aDoctorId = a.doctorId;
        const matchesDoctor = aDoctor === docName || 
                             aDoctorId === doctor?.id || 
                             aDoctorId === doctor?.uid;
        return (safeForm?.id ? a.id !== safeForm.id : true) && 
               matchesDoctor && 
               a.date === dateStr && 
               a.status !== 'cancelled' &&
               a.status !== 'Cancelled';
      })
      .map((a) => {
        // تطبيع الوقت
        const time = a.time || '';
        return time.replace(/\s*(AM|PM)/i, '').trim();
      })
      .filter(Boolean);
    
    // تطبيع base slots
    const normalizedBase = base.map(s => s.replace(/\s*(AM|PM)/i, '').trim());
    
    return normalizedBase.filter((s) => !taken.includes(s));
  };

  const slots = useMemo(() => {
    if (!safeForm || !safeForm.doctor || !safeForm.date) return [];
    return availableSlots(safeForm.doctor, safeForm.date);
  }, [safeForm?.doctor, safeForm?.date, appointments, safeForm?.id]);

  /**
   * Validates and saves the appointment form data.
   * Shows an alert if required fields are missing.
   */
  const saveChiefAppointmentForm = () => {
    if (!safeForm || !safeForm.patient || !safeForm.doctor || !safeForm.date || !safeForm.time) {
      return alert("Fill all fields.");
    }
    onSave(safeForm);
  };

  return (
    <div className="chief-overlay">
      <div className="chief-modal" style={{ maxWidth: 480 }}>
        <div className="chief-modal-head">
          <h4>{safeForm?.id && String(safeForm.id).startsWith("A-") ? "Edit Appointment" : "New Appointment"}</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>Patient</label>
            <select value={safeForm?.patient || safeForm?.patientName || ''} onChange={(e) => setForm({ ...safeForm, patient: e.target.value, patientName: e.target.value })}>
              <option value="">Select Patient</option>
              {(patients || []).filter(p => p && p.id).map((p) => (
                <option key={p.id} value={p.name}>{p.name || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Doctor</label>
            <select value={safeForm?.doctor || safeForm?.doctorName || ''} onChange={(e) => setForm({ ...safeForm, doctor: e.target.value, doctorName: e.target.value })}>
              <option value="">Select Doctor</option>
              {(doctors || []).filter(d => d && d.id).map((d) => (
                <option key={d.id} value={d.name}>{d.name || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Date</label>
            <input type="date" value={safeForm?.date || ''} onChange={(e) => setForm({ ...safeForm, date: e.target.value })} />
          </div>
          <div className="field"><label>Time</label>
            <select value={safeForm?.time || ''} onChange={(e) => setForm({ ...safeForm, time: e.target.value })} disabled={!safeForm?.doctor || !safeForm?.date || slots.length === 0}>
              <option value="">{!safeForm?.doctor || !safeForm?.date ? "Select doctor and date first" : slots.length === 0 ? "No slots available" : "Select time"}</option>
              {slots.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field col2"><label>Status</label>
            <select value={safeForm?.status || 'scheduled'} onChange={(e) => setForm({ ...safeForm, status: e.target.value })}>
              {["scheduled", "confirmed", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={saveChiefAppointmentForm}>Save</button>
          <button className="chief-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for creating community posts.
 * Allows users to add posts with title, content, category, and optional image.
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Callback when post is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Post creation form modal
 */
const PostModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ title: "", content: "", category: "Diet", image: null });
  
  /**
   * Handles form field changes for text inputs.
   * @param {Event} e - Input change event
   */
  const handlePostFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  /**
   * Handles file input changes for image uploads.
   * @param {Event} e - File input change event
   */
  const handlePostImageChange = (e) => setForm({ ...form, image: e.target.files?.[0] ?? null });
  
  /**
   * Determines if the form can be saved (all required fields filled).
   * @type {boolean}
   */
  const canSave = form.title.trim() && form.content.trim();

  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>Create Post</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body">
          <div className="field"><label>Title</label>
            <input name="title" value={form.title} onChange={handlePostFormChange} />
          </div>
          <div className="field"><label>Category</label>
            <select name="category" value={form.category} onChange={handlePostFormChange}>
              <option>Diet</option><option>Exercise</option><option>Mental Health</option><option>Tips</option>
            </select>
          </div>
          <div className="field"><label>Content</label>
            <textarea name="content" rows={5} value={form.content} onChange={handlePostFormChange} />
          </div>
          <div className="field">
            <label>Image (optional)</label>
            <label className="chief-attach">
              <input type="file" hidden accept="image/*" onChange={handlePostImageChange} />
              <span className="chief-btn">📎 Attach image</span>
              {form.image && <span className="chief-file">{form.image.name}</span>}
            </label>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Cancel</button>
          <button className="chief-btn primary" disabled={!canSave} onClick={() => onSave(form)}>Add</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for sending notifications to users.
 * Allows targeting specific audiences (All, Doctors, Nurses, or Specific User)
 * with customizable priority levels.
 * @param {Object} props - Component props
 * @param {Function} props.onSend - Callback when notification is sent
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Notification form modal
 */
const NotifyModal = ({ onSend, onClose }) => {
  const [form, setForm] = useState({
    audience: "All", toId: "", subject: "", message: "", priority: "Normal"
  });
  
  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleNotificationFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  /**
   * Determines if the notification can be sent (required fields filled).
   * @type {boolean}
   */
  const canSend = form.subject.trim() && form.message.trim();

  return (
    <div className="chief-overlay">
      <div className="chief-modal wide">
        <div className="chief-modal-head">
          <h4>Send Notification</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>Audience</label>
            <select name="audience" value={form.audience} onChange={handleNotificationFormChange}>
              <option>All</option><option>Doctors</option><option>Nurses</option><option>Specific User</option>
            </select>
          </div>
          <div className="field"><label>To (optional)</label>
            <input name="toId" value={form.toId} onChange={handleNotificationFormChange} placeholder="User ID (if Specific User)" />
          </div>
          <div className="field col2"><label>Subject</label>
            <input name="subject" value={form.subject} onChange={handleNotificationFormChange} />
          </div>
          <div className="field col2"><label>Message</label>
            <textarea name="message" rows={6} value={form.message} onChange={handleNotificationFormChange} />
          </div>
          <div className="field"><label>Priority</label>
            <select name="priority" value={form.priority} onChange={handleNotificationFormChange}>
              <option>Low</option><option>Normal</option><option>High</option><option>Critical</option>
            </select>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Cancel</button>
          <button className="chief-btn primary" disabled={!canSend} onClick={() => onSend(form)}>Send</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation dialog component for delete operations.
 * Displays a warning message and requires explicit confirmation before proceeding.
 * @param {Object} props - Component props
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Warning message to display
 * @param {Function} props.onConfirm - Callback when user confirms deletion
 * @param {Function} props.onClose - Callback to close the dialog
 * @returns {JSX.Element} Confirmation dialog
 */
const ConfirmDialog = ({ title, message, onConfirm, onClose }) => (
  <div className="chief-overlay">
    <div className="chief-modal" style={{ maxWidth: 420 }}>
      <div className="chief-modal-head">
        <h4>{title}</h4>
        <button className="chief-icon" onClick={onClose}>✕</button>
      </div>
      <div className="chief-modal-body">
        <p style={{ color: "var(--muted)" }}>{message}</p>
      </div>
      <div className="chief-modal-actions">
        <button className="chief-btn danger" onClick={onConfirm}>Delete</button>
        <button className="chief-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default ChiefDashboard;
