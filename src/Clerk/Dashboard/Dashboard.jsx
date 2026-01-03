
// src/Clerk/Dashboard/Dashboard.jsx
// === Top-level imports (working & necessary) ===
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Dashboard.css";
import { subscribeToCollection, appAddDoc, appUpdateDoc, appDeleteDoc } from "../../services/firestoreService";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// === Mock data & helpers ===
// Keeping slots as configuration for now
const doctorSlots = {
  "Dr. Omar Khaled": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"],
  "Dr. Lina Yousef": ["10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"],
};

// Utility helpers
/**
 * Generates a random ID with a given prefix.
 * @param {string} p - Prefix for the ID
 * @returns {string} Generated ID string
 */
const genId = (p) => `${p}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD).
 * @param {Date} d - Date object to format
 * @returns {string} ISO date string or undefined if date is invalid
 */
const fmtDay = (d) => {
  if (!d) return undefined;
  try {
    return d.toISOString().split("T")[0];
  } catch (e) {
    return undefined;
  }
};

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
 * @param {string} dateStr - Date string to check
 * @param {Date} start - Start date of the range
 * @param {Date} end - End date of the range
 * @returns {boolean} True if in range, false otherwise
 */
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false; // إذا لم يكن هناك تاريخ، لا يتم تضمينه
  const d = parseISO(dateStr);
  if (!d) return false; // إذا فشل التحليل، لا يتم تضمينه
  return (!start || d >= start) && (!end || d <= end);
};

// Age helpers
/**
 * Calculates age from a date of birth string.
 * @param {string} dob - Date of birth (YYYY-MM-DD).
 * @returns {number|string} Age in years or "—" if invalid.
 */
const calculateAge = (dob) => {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
const calcAge = (dob) => calculateAge(dob);

// === Main localStorage-based dashboard ===
/**
 * Clerk Dashboard component with comprehensive hospital management features.
 * Provides calendar, appointment management, patient/doctor/nurse CRUD operations,
 * waitlist and transfer queue management, utilization tracking, and analytics.
 * All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Complete clerk dashboard interface
 */
const ClerkDashboardModern = () => {
  // State with persistence (Firestore)
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [clerk, setClerk] = useState({
    name: "Clinic Clerk",
    email: "clerk@example.com",
    phone: "0790000000",
  });

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

  useEffect(() => {
    const { subscribeToWebAppointments, subscribeToWebWaitlist, subscribeToWebTransfers } = require('../../services/firestoreService');
    
    const unsubs = [
      subscribeToWebAppointments(setAppointments), // استخدام web_appointments
      subscribeToCollection("patients", setPatients),
      subscribeToCollection("doctors", setDoctors),
      subscribeToCollection("nurses", setNurses),
      subscribeToWebWaitlist(setWaitlist), // استخدام web_waitlist
      subscribeToWebTransfers(setTransfers) // استخدام web_transfers
    ];
    setLoading(false);
    return () => unsubs.forEach(u => u());
  }, []);

  // تحديث الإحصائيات اليومية عند تغيير التاريخ
  useEffect(() => {
    // تحديث الإحصائيات عند تغيير اليوم
    const todayStr = fmtDay(currentDate);
    const previousDayStr = fmtDay(new Date(currentDate.getTime() - 86400000));
    
    // إذا تغير اليوم، تحديث الإحصائيات
    if (todayStr !== previousDayStr) {
      console.log('New day detected, refreshing daily statistics...');
      setLastUpdateTime(new Date());
    }
  }, [currentDate]);

  // Calendar & timeframe
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayStr = fmtDay(selectedDate);
  const [timeframe, setTimeframe] = useState("7d"); // today, 7d, 30d, all, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // استخدام currentDate المحدث تلقائياً للتحديث اليومي
  const now = currentDate;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const makeOffset = (days) => new Date(todayStart.getTime() - days * 86400000);
  let rangeStart = null,
    rangeEnd = null;
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
  }

  // Filters
  const [filters, setFilters] = useState({ specialization: "", city: "", date: "" });

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const spec =
        !filters.specialization ||
        d.specialization?.toLowerCase().includes(filters.specialization.toLowerCase());
      const city =
        !filters.city || d.city?.toLowerCase().includes(filters.city.toLowerCase());
      return spec && city;
    });
  }, [doctors, filters]);

  /**
   * Calculates available appointment time slots for a doctor on a specific date.
   * Filters out time slots that are already booked.
   * @param {string} docName - Doctor's name
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Array<string>} List of available time slots
   */
  const availableSlots = (docName, dateStr) => {
    // Slots افتراضية شاملة
    const defaultSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    // البحث عن الطبيب
    const doctor = doctors.find(d => d.name === docName);
    
    if (!dateStr) {
      // إذا لم يكن هناك تاريخ، إرجاع slots افتراضية
      if (doctor && doctor.workSchedule) {
        // إرجاع slots من أول يوم مفعل
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (const day of dayNames) {
          const daySchedule = doctor.workSchedule[day];
          if (daySchedule && daySchedule.enabled && daySchedule.slots && daySchedule.slots.length > 0) {
            return daySchedule.slots;
          }
        }
      }
      // Fallback
      const fallback = doctorSlots[docName] ?? defaultSlots;
      return Array.isArray(fallback) ? fallback : defaultSlots;
    }
    
    // الحصول على slots من workSchedule
    let base = [];
    if (doctor && doctor.workSchedule) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[date.getDay()];
          const daySchedule = doctor.workSchedule[dayName];
          
          if (daySchedule && daySchedule.enabled && daySchedule.slots && daySchedule.slots.length > 0) {
            base = daySchedule.slots || [];
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    // Fallback 1: استخدام doctorSlots القديم
    if (base.length === 0) {
      base = doctorSlots[docName] ?? [];
      // تحويل من "09:00 AM" إلى "09:00" إذا لزم الأمر
      if (base.length > 0 && (base[0].includes('AM') || base[0].includes('PM'))) {
        base = base.map(slot => slot.replace(/\s*(AM|PM)/i, '').trim());
      }
    }
    
    // Fallback 2: استخدام slots افتراضية شاملة
    if (base.length === 0) {
      base = defaultSlots;
    }
    
    // فلترة المواعيد المحجوزة
    const taken = appointments
      .filter((a) => {
        const aDoctor = a.doctor || a.doctorName;
        const aDoctorId = a.doctorId;
        const matchesDoctor = aDoctor === docName || 
                             aDoctorId === doctor?.id || 
                             aDoctorId === doctor?.uid;
        return matchesDoctor && 
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

  /**
   * Helper to find doctor's department.
   * @param {string} docName - Name of the doctor.
   * @returns {string} Department name or "Unknown".
   */
  const getDeptByDoctorName = (docName) =>
    doctors.find((d) => d.name === docName)?.department ?? "Unknown";

  // Time-filtered appointments
  const apptsInTimeframe = useMemo(() => {
    if (timeframe === "all") return appointments;
    return appointments.filter((a) => inRange(a.date, rangeStart, rangeEnd));
  }, [appointments, timeframe, customStart, customEnd]);

  // Dept donut data
  const deptData = useMemo(() => {
    const counts = {};
    apptsInTimeframe.forEach((a) => {
      // دعم كل من doctor و doctorName (للتوافق مع web_appointments)
      const doctorName = a.doctor || a.doctorName;
      if (!doctorName) return; // تخطي إذا لم يكن هناك طبيب
      const dep = getDeptByDoctorName(doctorName);
      counts[dep] = (counts[dep] ?? 0) + 1;
    });
    if (!Object.keys(counts).length) {
      filteredDoctors.forEach((d) => {
        const key = d.department ?? "Unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [apptsInTimeframe, doctors, filteredDoctors]);

  // Daily statistics - تحديث يومي تلقائي
  const todayStr = fmtDay(currentDate);
  const todaysVisits = useMemo(() => {
    return appointments.filter((a) => a.date === todayStr);
  }, [appointments, todayStr, currentDate]);

  const cancelledVisits = useMemo(() => {
    return apptsInTimeframe.filter((a) => a.status === "Cancelled" || a.status === "cancelled");
  }, [apptsInTimeframe]);

  // Daily statistics calculations - إحصائيات يومية
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
      lastUpdate: lastUpdateTime
    };
  }, [appointments, patients, doctors, currentDate, lastUpdateTime]);

  // CRUD helpers
  // CRUD helpers
  /**
   * Saves an appointment (Create or Update).
   * Checks for client-side clashes before saving.
   * @param {Object} ap - Appointment data.
   */
  const saveAppointment = async (ap) => {
    const { createWebAppointment, updateWebAppointment } = require('../../services/firestoreService');
    
    const clash = appointments.some(
      (a) =>
        a.id !== ap.id &&
        (a.doctor === ap.doctor || a.doctorId === ap.doctorId || a.doctorName === ap.doctor) &&
        a.date === ap.date &&
        a.time === ap.time &&
        a.status !== "Cancelled"
    );
    if (clash) return alert("This slot is already booked for the selected doctor.");

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
  };

  /**
   * Updates an appointment's status.
   * If cancelled, prompts to add the patient to the waitlist.
   * @param {string} id - Appointment ID.
   * @param {string} status - New status.
   */
  const updateStatus = async (id, status) => {
    const { updateWebAppointment, createWebWaitlistEntry } = require('../../services/firestoreService');
    
    await updateWebAppointment(id, { status });
    if (status === "Cancelled") {
      const ap = appointments.find((a) => a.id === id);
      if (ap) {
        const dep = getDeptByDoctorName(ap.doctor || ap.doctorName);
        if (window.confirm(`Add ${ap.patient || ap.patientName} to waitlist for ${dep}?`)) {
          await createWebWaitlistEntry({
            patient: ap.patient || ap.patientName,
            department: dep,
            preferredDate: ap.date,
            notes: `Cancelled ${ap.doctor || ap.doctorName} ${ap.time}`,
          });
        }
      }
    }
  };

  /**
   * Deletes an appointment from Firestore.
   * @param {string} id - Appointment ID
   */
  const deleteAppointment = async (id) => {
    try {
      const { deleteWebAppointment } = require('../../services/firestoreService');
      await deleteWebAppointment(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(`Error deleting appointment: ${error.message}`);
    }
  };

  /**
   * Saves a patient to Firestore (Create or Update).
   * Determines if it's an update or new record based on ID format.
   * @param {Object} p - Patient data
   */
  const savePatient = async (p) => {
    if (p.id && !p.id.startsWith("P-")) {
      await appUpdateDoc("patients", p.id, p);
    } else {
      const { id, ...data } = p;
      await appAddDoc("patients", data);
    }
  };

  /**
   * Saves a doctor to Firestore (Create or Update).
   * Determines if it's an update or new record based on ID format.
   * @param {Object} d - Doctor data
   */
  const saveDoctor = async (d) => {
    if (d.id && !d.id.startsWith("D-")) {
      await appUpdateDoc("doctors", d.id, d);
    } else {
      const { id, ...data } = d;
      // استخدام createDoctor لإنشاء الهيكل الصحيح
      const { createDoctor } = await import('../../services/firestoreService');
      await createDoctor(data);
    }
  };

  /**
   * Saves a nurse to Firestore (Create or Update).
   * Determines if it's an update or new record based on ID format.
   * @param {Object} n - Nurse data
   */
  const saveNurse = async (n) => {
    if (n.id && !n.id.startsWith("N-")) {
      await appUpdateDoc("nurses", n.id, n);
    } else {
      const { id, ...data } = n;
      await appAddDoc("nurses", data);
    }
  };

  // UI modals state
  const [editingAppt, setEditingAppt] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingNurse, setEditingNurse] = useState(null);

  const [showWaitlistModal, setShowWaitlistModal] = useState(null); // null or {entry}
  const [newWaitlist, setNewWaitlist] = useState(null);
  const [newTransfer, setNewTransfer] = useState(null);
  const [assignTransfer, setAssignTransfer] = useState(null); // transfer object for assigning doctor
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id }

  // NEW: View & Delete states for richer modals
  const [viewPatient, setViewPatient] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewNurse, setViewNurse] = useState(null);

  const [deletePatient, setDeletePatient] = useState(null);
  const [deleteDoctor, setDeleteDoctor] = useState(null);
  const [deleteNurse, setDeleteNurse] = useState(null);

  const COLORS = ["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"];

  // Utilization
  const next7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return fmtDay(d);
  });

  const utilizationRows = useMemo(() => {
    return doctors.map((doc) => {
      const slotsPerDay = (doctorSlots[doc.name] ?? []).length;
      return {
        doctor: doc.name,
        department: doc.department,
        days: next7Days.map((day) => {
          const filled = appointments.filter((a) => a.doctor === doc.name && a.date === day).length;
          const total = slotsPerDay || 1;
          const pct = Math.round((filled / total) * 100);
          return { day, filled, total, pct };
        }),
      };
    });
  }, [doctors, appointments]);

  // Transfer helpers
  // Transfer helpers
  /**
   * Adds a new transfer request.
   * @param {Object} tr - Transfer data.
   */
  const addTransfer = async (tr) => {
    const { id, ...data } = tr;
    await appAddDoc("transfers", { ...data, status: "Pending", assignedDoctorId: null });
  };

  /**
   * Updates the status of a transfer request.
   * @param {string} id - Transfer ID
   * @param {string} status - New status value
   */
  const setTransferStatus = async (id, status) => {
    await appUpdateDoc("transfers", id, { status });
  };

  /**
   * Assigns a doctor to a transfer request.
   * @param {string} id - Transfer ID.
   * @param {string} doctorId - ID of the assigned doctor.
   */
  const assignTransferDoctor = async (id, doctorId) => {
    await appUpdateDoc("transfers", id, { assignedDoctorId: doctorId, status: "Assigned" });
  };

  // === Render ===
  return (
    <div className="clerk-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Hospital clerk workspace</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Last updated: {lastUpdateTime.toLocaleTimeString()} | Today: {todayStr}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="make-appointment"
            onClick={() =>
              setEditingAppt({
                id: genId("A"),
                patient: patients[0]?.name ?? "",
                doctor: doctors[0]?.name ?? "",
                date: fmtDay(selectedDate),
                time: "",
                status: "Scheduled",
              })
            }
          >
            Make an appointment
          </button>
          <div className="clerk-card" onClick={() => setEditingProfile(clerk)}>
            <div className="avatar">{(clerk.name ?? "C")[0].toUpperCase()}</div>
            <div>
              <strong>{clerk.name}</strong>
              <span>Edit profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Statistics */}
      <div className="grid-4" style={{ marginBottom: '16px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Today's Appointments</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dailyStats.todayAppointments}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
            Scheduled: {dailyStats.todayScheduled} | Completed: {dailyStats.todayCompleted} | Cancelled: {dailyStats.todayCancelled}
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>New Patients Today</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dailyStats.newPatientsToday}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
            Registered today
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Active Doctors</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dailyStats.activeDoctorsToday}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
            With appointments today
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Total Resources</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{doctors.length + nurses.length + patients.length}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
            Doctors: {doctors.length} | Nurses: {nurses.length} | Patients: {patients.length}
          </div>
        </div>
      </div>

      {/* Top row */}
      <div className="grid-3">
        <div className="card">
          <h3>Calendar</h3>
          <Calendar value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Utilization */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="panel-title">
            <h3>Utilization (next 7 days)</h3>
          </div>
          <div className="utilization">
            {/* Header row */}
            <div className="util-row" style={{ fontSize: 12, color: "#666" }}>
              <div className="name">Doctor / Day</div>
              {next7Days.map((d) => (
                <div key={d} className="util-cell" style={{ fontWeight: 600 }}>
                  {d.slice(5)}
                </div>
              ))}
            </div>
            {utilizationRows.map((row) => (
              <div key={row.doctor} className="util-row">
                <div className="name">{row.doctor}</div>
                {row.days.map((cell) => {
                  const level = Math.min(5, Math.floor((cell.pct / 100) * 5));
                  return (
                    <div
                      key={cell.day}
                      className="util-cell"
                      data-level={level}
                      title={`${cell.filled}/${cell.total} (${cell.pct}%)`}
                    >
                      {cell.pct}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Search panel */}
        <div className="card search-panel">
          <h3>Search a doctor</h3>
          <div className="row">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            >
              <option value="">Specialization</option>
              {[...new Set(doctors.map((d) => d.specialization).filter(Boolean))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
              <option value="">City</option>
              {[...new Set(doctors.map((d) => d.city).filter(Boolean)), ""].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <input
              type="date"
              value={filters.date || dayStr}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="row">
            <button onClick={() => { /* reserved for backend search later */ }}>Search</button>
          </div>

          {/* Quick booking slots */}
          <div style={{ marginTop: 10 }}>
            {filteredDoctors.map((d) => {
              const slots = availableSlots(d.name, filters.date || dayStr);
              return (
                <div key={d.id} style={{ marginBottom: 10 }}>
                  <strong>{d.name}</strong>
                  <div className="slots" style={{ marginTop: 6 }}>
                    {slots.length ? (
                      slots.map((s) => (
                        <span
                          key={s}
                          className="slot"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            const selectedPatient = patients[0];
                            setEditingAppt({
                              id: genId("A"),
                              patient: selectedPatient?.name ?? "",
                              patientId: selectedPatient?.id ?? null,
                              doctor: d.name,
                              doctorId: (d.uid || d.id) ?? null,
                              date: filters.date || dayStr || fmtDay(new Date()),
                              time: s,
                              status: "Scheduled",
                            });
                          }}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="slot none">No slots</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeframe & quick add */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Timeframe:</strong>
          <select style={{ borderRadius: "8px" }} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn secondary"
              onClick={() => setEditingPatient({ name: "", phone: "" })} // empty name => type: 'add'
            >
              + Add Patient
            </button>
            <button
              className="btn secondary"
              onClick={() => setEditingDoctor({ name: "", department: "", city: "", specialization: "" })}
            >
              + Add Doctor
            </button>
            <button className="btn secondary" onClick={() => setEditingNurse({ name: "", department: "" })}>
              + Add Nurse
            </button>
            <button
              className="btn"
              onClick={() =>
                setNewWaitlist({
                  id: null,
                  patient: "",
                  department: "",
                  preferredDate: fmtDay(new Date()),
                  notes: "",
                })
              }
            >
              + Add Waitlist
            </button>
            <button
              className="btn"
              onClick={() =>
                setNewTransfer({
                  id: null,
                  patient: "",
                  fromDept: "",
                  toDept: "",
                  reason: "",
                })
              }
            >
              + New Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Alerts + Appointments + Donut */}
      <div className="section-grid">
        {/* Alerts */}
        <div className="alerts">
          <div className="alert">
            <h4>Alerts</h4>
            <ul>
              {todaysVisits.length ? (
                todaysVisits.map((v) => {
                  const patientName = v.patient || v.patientName || 'Unknown';
                  const doctorName = v.doctor || v.doctorName || 'Unknown';
                  return (
                  <li key={v.id}>
                      Today: <strong>{patientName}</strong> with <strong>{doctorName}</strong> at {v.time || 'N/A'}.
                  </li>
                  );
                })
              ) : (
                <li>No visits today.</li>
              )}
            </ul>
          </div>
          <div className="alert danger">
            <h4>Cancelled visits</h4>
            <ul>
              {cancelledVisits.length ? (
                cancelledVisits.map((v) => {
                  const patientName = v.patient || v.patientName || 'Unknown';
                  const doctorName = v.doctor || v.doctorName || 'Unknown';
                  return (
                  <li key={v.id}>
                      {patientName} — {doctorName} on {v.date || 'N/A'} ({v.time || 'N/A'})
                  </li>
                  );
                })
              ) : (
                <li>No cancellations in selected range.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Appointments */}
        <div className="card">
          <div className="appointments-head">
            <h3>Appointments</h3>
            <div>
              <button
                className="btn secondary"
                onClick={() => {
                  setEditingAppt({
                    id: genId("A"),
                    patient: patients[0]?.name ?? "",
                    patientId: patients[0]?.id ?? null,
                    doctor: doctors[0]?.name ?? "",
                    doctorId: (doctors[0]?.uid || doctors[0]?.id) ?? null,
                    date: fmtDay(selectedDate) || fmtDay(new Date()),
                    time: "",
                    status: "Scheduled",
                  });
                }}
              >
                + Add
              </button>
            </div>
          </div>
          <div className="appointment-list">
            {apptsInTimeframe.length ? (
              apptsInTimeframe.map((a) => {
                const doctorName = a.doctor || a.doctorName || 'Unknown';
                const patientName = a.patient || a.patientName || 'Unknown';
                const doctorInitial = doctorName.split(" ")[1]?.[0] || doctorName[0] || "D";
                return (
                <div className="app-card" key={a.id}>
                  <div className="top">
                    <div className="avatar">{doctorInitial}</div>
                    <div>
                      <strong>{doctorName}</strong>
                      <div className="meta">
                        {patientName} • {a.date || 'N/A'} • {a.time || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                  <div className="actions">
                    {a.status !== "Completed" && (
                      <button className="btn secondary" onClick={() => updateStatus(a.id, "Completed")}>
                        Confirm
                      </button>
                    )}
                    {a.status !== "Cancelled" && (
                      <button className="btn danger" onClick={() => updateStatus(a.id, "Cancelled")}>
                        Cancel
                      </button>
                    )}
                    <button className="btn" onClick={() => setEditingAppt({ ...a })}>
                      Edit
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setConfirmDelete({ type: "appointment", id: a.id })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })
            ) : (
              <div
                className="app-card"
                style={{ gridColumn: "1/-1", textAlign: "center", color: "#777" }}
              >
                No appointments in selected range.
              </div>
            )}
          </div>
        </div>

        {/* Department Donut */}
        <div className="card" style={{ height: 360 }}>
          <h3>Patient Visit by Department</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={deptData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {deptData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"][index % 6]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Waitlist • Transfer • Patient List */}
      <div className="section-grid" style={{ marginTop: 16 }}>
        {/* WAITLIST */}
        <div className="card">
          <div className="panel-title">
            <h3>Waitlist</h3>
            <span className="badge">{waitlist.length}</span>
          </div>
          <div className="list">
            {waitlist.length ? (
              waitlist.map((w) => {
                const deptDocs = doctors.filter((d) => d.department === w.department);
                return (
                  <div className="item" key={w.id}>
                    <h4>
                      {w.patient} <span className="badge">{w.department}</span>
                    </h4>
                    <div className="meta">Preferred: {w.preferredDate ?? "—"}</div>
                    {w.notes && <div className="meta">Notes: {w.notes}</div>}
                    <div className="row-actions">
                      <button className="btn" onClick={() => setShowWaitlistModal({ entry: w })}>
                        Fill slot…
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => appDeleteDoc("waitlist", w.id)}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Quick suggestions */}
                    {!!deptDocs.length && (
                      <div style={{ marginTop: 6 }}>
                        <div className="meta">Quick slots:</div>
                        <div className="slots" style={{ marginTop: 6 }}>
                          {deptDocs.slice(0, 2).flatMap((d) => {
                            const day = w.preferredDate ?? dayStr;
                            const slots = availableSlots(d.name, day).slice(0, 2);
                            return slots.map((s) => (
                              <span
                                key={d.name + s}
                                className="slot"
                                style={{ cursor: "pointer" }}
                                title={`Book ${d.name} ${day} ${s}`}
                                onClick={() => {
                                  setEditingAppt({
                                    id: genId("A"),
                                    patient: w.patient,
                                    doctor: d.name,
                                    date: day,
                                    time: s,
                                    status: "Scheduled",
                                  });
                                  setShowWaitlistModal(null);
                                }}
                              >
                                {d.name.split(" ")[1] ?? d.name}: {s}
                              </span>
                            ));
                          })}
                          {!deptDocs.length && <span className="slot none">No doctors in dept</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="meta">No patients on waitlist.</div>
            )}
          </div>
        </div>

        {/* TRANSFER QUEUE */}
        <div className="card">
          <div className="panel-title">
            <h3>Transfer Queue</h3>
            <span className="badge">{transfers.length}</span>
          </div>
          <div className="list">
            {transfers.length ? (
              transfers.map((t) => {
                const assigned = t.assignedDoctorId
                  ? doctors.find((d) => d.id === t.assignedDoctorId)?.name
                  : null;
                return (
                  <div className="item" key={t.id}>
                    <h4>
                      {t.patient}
                      <span className="badge">
                        {t.fromDept} → {t.toDept}
                      </span>
                      <span
                        className={`badge ${t.status === "Pending" ? "pending" : t.status === "Assigned" ? "assigned" : "info"
                          }`}
                      >
                        {t.status}
                      </span>
                    </h4>
                    {t.reason && <div className="meta">Reason: {t.reason}</div>}
                    <div className="meta">Assigned: {assigned ?? "—"}</div>
                    <div className="row-actions">
                      <button className="btn" onClick={() => setAssignTransfer(t)}>
                        Assign doctor
                      </button>
                      <button className="btn secondary" onClick={() => setTransferStatus(t.id, "Need Info")}>
                        Need Info
                      </button>
                      <button className="btn" onClick={() => setTransferStatus(t.id, "Approved")}>
                        Approve
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => appDeleteDoc("transfers", t.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="meta">No transfer requests.</div>
            )}
          </div>
        </div>

        {/* PATIENT LIST */}
        <div className="card">
          <h3>Patient List</h3>
          <ul className="compact-list">
            {patients.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <span>
                  {p.phone ?? "-"}
                  {/* NEW: View / Edit / Delete using richer modals */}
                  <button className="btn" onClick={() => setViewPatient(p)} style={{ marginLeft: 8 }}>
                    View
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setEditingPatient({ ...p })}
                    style={{ marginLeft: 6 }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => setDeletePatient(p)}
                    style={{ marginLeft: 6 }}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
            {!patients.length && <li>No patients.</li>}
          </ul>
        </div>
      </div>

      {/* ===== Modals ===== */}
      {editingAppt && (
        <AppointmentModal
          initial={editingAppt}
          patients={patients}
          doctors={doctors}
          appointments={appointments}
          onSave={(ap) => {
            saveAppointment(ap);
            setEditingAppt(null);
          }}
          onClose={() => setEditingAppt(null)}
        />
      )}

      {editingProfile && (
        <ClerkModal
          initial={clerk}
          onSave={(data) => {
            setClerk(data);
            setEditingProfile(null);
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* NEW: Rich Patient/Nurse/Doctor modals */}
      {editingPatient && (
        <PatientModal
          type={editingPatient?.name ? "edit" : "add"}
          patient={editingPatient}
          doctors={doctors}
          nurses={nurses}
          onSave={(p) => {
            savePatient(p);
            setEditingPatient(null);
          }}
          onClose={() => setEditingPatient(null)}
        />
      )}
      {viewPatient && (
        <PatientViewModal
          patient={viewPatient}
          doctorName={doctors.find(d => d.id === viewPatient.doctorId)?.name || "—"}
          nurseName={nurses.find(n => n.id === viewPatient.nurseId)?.name || "—"}
          onClose={() => setViewPatient(null)}
        />
      )}
      {deletePatient && (
        <DeletePatientModal
          patient={deletePatient}
          onDelete={async () => {
            await appDeleteDoc("patients", deletePatient.id);
            setDeletePatient(null);
          }}
          onClose={() => setDeletePatient(null)}
        />
      )}

      {editingNurse && (
        <NurseModal
          type={editingNurse?.name ? "edit" : "add"}
          nurse={editingNurse}
          onSave={(n) => {
            saveNurse(n);
            setEditingNurse(null);
          }}
          onClose={() => setEditingNurse(null)}
        />
      )}
      {viewNurse && (
        <ViewNurseModal
          nurse={viewNurse}
          patientsForNurse={patients.filter(p => p.nurseId === viewNurse.id)}
          onClose={() => setViewNurse(null)}
          navigate={() => { /* noop in this file */ }}
        />
      )}
      {deleteNurse && (
        <DeleteNurseModal
          nurse={deleteNurse}
          inUsePatients={patients.filter(p => p.nurseId === deleteNurse.id).length}
          onDelete={async () => {
            await appDeleteDoc("nurses", deleteNurse.id);
            setDeleteNurse(null);
          }}
          onClose={() => setDeleteNurse(null)}
        />
      )}

      {editingDoctor && (
        <DoctorModal
          type={editingDoctor?.name ? "edit" : "add"}
          doctor={editingDoctor}
          onSave={(d) => {
            saveDoctor(d);
            setEditingDoctor(null);
          }}
          onClose={() => setEditingDoctor(null)}
        />
      )}
      {viewDoctor && (
        <ViewDoctorModal
          doctor={viewDoctor}
          patientsForDoctor={patients.filter(p => p.doctorId === viewDoctor.id || p.assignedDoctorId === viewDoctor.uid)}
          appointmentCount={appointments.filter((a) => {
            const aDoctor = a.doctor || a.doctorName;
            return aDoctor === viewDoctor.name || a.doctorId === viewDoctor.id || a.doctorId === viewDoctor.uid;
          }).length}
          onClose={() => setViewDoctor(null)}
          navigate={() => { /* noop */ }}
        />
      )}
      {deleteDoctor && (
        <DeleteDoctorModal
          doctor={deleteDoctor}
          inUsePatients={patients.filter(p => p.doctorId === deleteDoctor.id).length}
          inUseAppointments={appointments.filter((a) => a.doctor === deleteDoctor.name).length}
          onDelete={async () => {
            await appDeleteDoc("doctors", deleteDoctor.id);
            setDeleteDoctor(null);
          }}
          onClose={() => setDeleteDoctor(null)}
        />
      )}

      {/* Keep your other modals */}
      {newWaitlist && (
        <WaitlistModal
          initial={newWaitlist}
          onSave={async (entry) => {
            const { createWebWaitlistEntry } = require('../../services/firestoreService');
            const { id, ...data } = entry;
            await createWebWaitlistEntry(data);
            setNewWaitlist(null);
          }}
          onClose={() => setNewWaitlist(null)}
        />
      )}
      {showWaitlistModal && (
        <FillFromWaitlistModal
          entry={showWaitlistModal.entry}
          doctors={doctors}
          availableSlots={availableSlots}
          defaultDate={dayStr}
          onPick={(doctorName, date, time) => {
            const doctor = doctors.find(d => d.name === doctorName);
            const patient = patients.find(p => p.name === showWaitlistModal.entry.patient);
            setEditingAppt({
              id: genId("A"),
              patient: showWaitlistModal.entry.patient,
              patientId: patient?.id ?? null,
              doctor: doctorName,
              doctorId: (doctor?.uid || doctor?.id) ?? null,
              date: date || fmtDay(new Date()),
              time: time || "",
              status: "Scheduled",
            });
            setShowWaitlistModal(null);
          }}
          onClose={() => setShowWaitlistModal(null)}
        />
      )}
      {newTransfer && (
        <TransferCreateModal
          initial={newTransfer}
          onSave={(t) => {
            addTransfer(t);
            setNewTransfer(null);
          }}
          onClose={() => setNewTransfer(null)}
        />
      )}
      {assignTransfer && (
        <TransferAssignModal
          transfer={assignTransfer}
          doctors={doctors.filter((d) => d.department === assignTransfer.toDept)}
          onSave={(doctorId) => {
            assignTransferDoctor(assignTransfer.id, doctorId);
            setAssignTransfer(null);
          }}
          onClose={() => setAssignTransfer(null)}
        />
      )}

      {/* Keep ConfirmDialog for Appointment deletes */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type}?`}
          message="This action cannot be undone."
          onConfirm={async () => {
            const { type, id } = confirmDelete;
            if (type === "appointment") await deleteAppointment(id);
            if (type === "patient") await appDeleteDoc("patients", id);
            if (type === "doctor") await appDeleteDoc("doctors", id);
            if (type === "nurse") await appDeleteDoc("nurses", id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ===== Modals (kept / updated) =====
/**
 * Modal component for editing clerk profile information.
 * Allows updating name, email, phone, and password.
 * @param {Object} props - Component props
 * @param {Object} props.initial - Initial clerk data
 * @param {Function} props.onSave - Callback when profile is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Clerk profile edit modal
 */
const ClerkModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  
  /**
   * Validates and saves the profile form.
   * Checks password fields if password change is attempted.
   */
  const saveClerkProfileForm = () => {
    if (pass.next || pass.confirm || pass.current) {
      if (!pass.current) return alert("Enter current password.");
      if (pass.next !== pass.confirm) return alert("Password confirmation mismatch.");
    }
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>My Profile</h2>
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <hr />
        <input
          type="password"
          placeholder="Current Password"
          value={pass.current}
          onChange={(e) => setPass({ ...pass, current: e.target.value })}
        />
        <input
          type="password"
          placeholder="New Password"
          value={pass.next}
          onChange={(e) => setPass({ ...pass, next: e.target.value })}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={pass.confirm}
          onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={saveClerkProfileForm}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

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
const AppointmentModal = ({
  initial,
  patients,
  doctors,
  appointments,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState(initial);
  
  /**
   * Calculates available appointment time slots for the selected doctor and date.
   * Filters out slots that are already booked.
   * @type {Array<string>}
   */
  const slots = useMemo(() => {
    if (!form.doctor || !form.date) {
      console.log('Slots: Missing doctor or date', { doctor: form.doctor, date: form.date });
      return [];
    }
    
    // البحث عن الطبيب بواسطة الاسم
    const doctor = doctors.find(d => d.name === form.doctor || d.id === form.doctor || d.uid === form.doctor);
    
    if (!doctor) {
      console.log('Slots: Doctor not found', form.doctor);
    }
    
    // Slots افتراضية شاملة (من 9 صباحاً إلى 5 مساءً بفترات 30 دقيقة)
    const defaultSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    // الحصول على slots من workSchedule
    let base = [];
    if (doctor && doctor.workSchedule && form.date) {
      try {
        const date = new Date(form.date + 'T00:00:00'); // إضافة الوقت لتجنب مشاكل timezone
        if (!isNaN(date.getTime())) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[date.getDay()];
          const daySchedule = doctor.workSchedule[dayName];
          
          if (daySchedule && daySchedule.enabled && daySchedule.slots && Array.isArray(daySchedule.slots) && daySchedule.slots.length > 0) {
            base = daySchedule.slots;
            console.log('Slots from workSchedule:', { dayName, slots: base });
          } else {
            console.log('Slots: Day schedule not enabled or empty', { dayName, enabled: daySchedule?.enabled, slots: daySchedule?.slots });
          }
        } else {
          console.log('Slots: Invalid date', form.date);
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    // Fallback 1: استخدام doctorSlots القديم
    if (base.length === 0) {
      base = doctorSlots[form.doctor] ?? [];
      // تحويل من "09:00 AM" إلى "09:00" إذا لزم الأمر
      if (base.length > 0 && (base[0].includes('AM') || base[0].includes('PM'))) {
        base = base.map(slot => slot.replace(/\s*(AM|PM)/i, '').trim());
      }
      console.log('Slots from doctorSlots fallback:', base);
    }
    
    // Fallback 2: استخدام slots افتراضية شاملة (يجب أن يكون دائماً متاح)
    if (base.length === 0) {
      base = defaultSlots;
      console.log('Slots from default fallback:', base);
    }
    
    // فلترة المواعيد المحجوزة
    const taken = appointments
      .filter((a) => {
        const aDoctor = a.doctor || a.doctorName;
        const aDoctorId = a.doctorId;
        const matchesDoctor = aDoctor === form.doctor || 
                           aDoctorId === doctor?.id || 
                           aDoctorId === doctor?.uid;
        return a.id !== form.id && 
               matchesDoctor && 
               a.date === form.date && 
               a.status !== 'cancelled' &&
               a.status !== 'Cancelled';
      })
      .map((a) => {
        // تطبيع الوقت (إزالة AM/PM إذا كان موجوداً)
        const time = a.time || '';
        return time.replace(/\s*(AM|PM)/i, '').trim();
      })
      .filter(Boolean);
    
    // تطبيع base slots أيضاً
    const normalizedBase = base.map(s => {
      const normalized = s.replace(/\s*(AM|PM)/i, '').trim();
      return normalized;
    });
    
    const available = normalizedBase.filter((s) => !taken.includes(s));
    console.log('Final available slots:', { total: normalizedBase.length, taken: taken.length, available: available.length, slots: available });
    
    return available;
  }, [form.doctor, form.date, appointments, form.id, doctors]);

  /**
   * Validates and saves the appointment form data.
   * Shows an alert if required fields are missing.
   */
  const saveClerkAppointmentForm = () => {
    if (!form.patient || !form.doctor || !form.date || !form.time) {
      return alert("Please fill all fields: Patient, Doctor, Date, and Time are required.");
    }
    if (!form.time || form.time === '') {
      return alert("Please select a time slot.");
    }
    // التأكد من أن الوقت محفوظ بشكل صحيح
    const appointmentData = {
      ...form,
      time: form.time // التأكد من أن الوقت موجود
    };
    onSave(appointmentData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 420 }}>
        <h2>{String(form.id).startsWith("A-") ? "Edit Appointment" : "New Appointment"}</h2>
        <label>Patient</label>
        <select
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {[form.patient, ...patients.map((p) => p.name)].filter(Boolean).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label>Doctor</label>
        <select
          value={form.doctor}
          onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {[form.doctor, ...doctors.map((d) => d.name)].filter(Boolean).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>Time</label>
        <select
          value={form.time || ''}
          onChange={(e) => {
            setForm({ ...form, time: e.target.value });
          }}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          disabled={!form.doctor || !form.date}
        >
          <option value="">
            {!form.doctor ? 'Select doctor first' : !form.date ? 'Select date first' : slots.length === 0 ? 'No available slots - all booked' : 'Select time'}
          </option>
          {slots.length > 0 ? (
            slots.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))
          ) : form.doctor && form.date ? (
            // إذا لم تكن هناك slots متاحة، عرض رسالة
            <option value="" disabled>All slots are booked for this date</option>
          ) : null}
        </select>
        {form.doctor && form.date && slots.length === 0 && (
          <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '-8px', marginBottom: '10px' }}>
            ⚠️ All time slots are booked for this doctor on this date. Please select another date.
          </div>
        )}
        {form.doctor && form.date && slots.length > 0 && (
          <div style={{ color: '#2ecc71', fontSize: '12px', marginTop: '-8px', marginBottom: '10px' }}>
            ✓ {slots.length} available slot(s)
          </div>
        )}
        <label>Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {["Scheduled", "Completed", "Cancelled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="modal-actions">
          <button className="btn" onClick={saveClerkAppointmentForm}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* -------- Patients: Add/Edit + View + Delete -------- */
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
const PatientModal = ({ type, patient, doctors = [], nurses = [], onSave, onClose }) => {
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? patient?.id : "",
    name: isEdit ? patient?.name : "",
    dob: isEdit ? patient?.dob : "",
    status: isEdit ? (patient?.status || "Active") : "Active",
    gender: isEdit ? (patient?.gender || "") : "",
    phone: isEdit ? (patient?.phone || "") : "",
    doctorId: isEdit ? (patient?.doctorId || doctors[0]?.id || "") : (doctors[0]?.id || ""),
    nurseId: isEdit ? (patient?.nurseId || nurses[0]?.id || "") : (nurses[0]?.id || ""),
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
  const handleSaveClerkPatient = () => {
    if (!form.name.trim()) return alert("Name is required.");
    if (!form.doctorId) return alert("Please select a doctor.");
    if (!form.nurseId) return alert("Please select a nurse.");
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Patient" : "Add Patient"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Patient ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleClerkPatientFormChange} />
        <label>Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={handleClerkPatientFormChange} />
        <label>Status</label>
        <select name="status" value={form.status} onChange={handleClerkPatientFormChange}>
          <option>Active</option><option>In Treatment</option><option>Recovered</option>
          <option>Discharged</option><option>Unknown</option>
        </select>
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleClerkPatientFormChange}>
          <option value="">Select Gender</option><option>Female</option><option>Male</option>
        </select>
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleClerkPatientFormChange} />
        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleClerkPatientFormChange} disabled={!doctors.length}>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label>Nurse</label>
        <select name="nurseId" value={form.nurseId} onChange={handleClerkPatientFormChange} disabled={!nurses.length}>
          {nurses.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <div className="modal-actions">
          <button onClick={handleSaveClerkPatient}>{isEdit ? "Save" : "Add"}</button>
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
      <p><strong>Status:</strong> {patient.status || "Unknown"}</p>
      <p><strong>Gender:</strong> {patient.gender || "—"}</p>
      <p><strong>Phone:</strong> {patient.phone || "—"}</p>
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
const DeletePatientModal = ({ patient, onDelete, onClose }) => (
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

/* -------- Nurses: Add/Edit + View + Delete -------- */
/**
 * Modal component for adding or editing nurse information.
 * Validates phone number format and required fields.
 * @param {Object} props - Component props
 * @param {string} props.type - Modal type: 'add' or 'edit'
 * @param {Object} props.nurse - Existing nurse data (for edit mode)
 * @param {Function} props.onSave - Callback when nurse is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Nurse form modal
 */
const NurseModal = ({ type, nurse, onSave, onClose }) => {
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? nurse?.id : "",
    name: isEdit ? nurse?.name : "",
    department: isEdit ? (nurse?.department || "") : "",
    phone: isEdit ? (nurse?.phone || "") : "",
    dob: isEdit ? (nurse?.dob || "") : "",
  });

  /**
   * Handles form field changes.
   * @param {Event} e - Input change event
   */
  const handleClerkNurseFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  /**
   * Validates phone number format (9-12 digits).
   * @param {string} p - Phone number to validate
   * @returns {boolean} True if valid or empty
   */
  const validateClerkNursePhone = (p) => (!p || /^\d{9,12}$/.test(p));
  
  /**
   * Validates and saves the nurse form.
   * Ensures name, department, and phone format are valid.
   */
  const handleSaveClerkNurse = () => {
    if (!form.name.trim()) return alert("Nurse name is required.");
    if (!form.department.trim()) return alert("Department is required.");
    if (!validateClerkNursePhone(form.phone)) return alert("Phone must be 9–12 digits.");
    const payload = {
      id: form.id,
      name: form.name.trim(),
      department: form.department.trim(),
      phone: form.phone?.trim() || "",
      dob: form.dob || "",
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Nurse" : "Add Nurse"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Nurse ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleClerkNurseFormChange} />
        <input name="department" placeholder="Department/Shift" value={form.department} onChange={handleClerkNurseFormChange} />
        <input name="phone" placeholder="Phone (9–12 digits)" value={form.phone} onChange={handleClerkNurseFormChange} />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleClerkNurseFormChange} />
        <div className="modal-actions">
          <button onClick={handleSaveClerkNurse}>{isEdit ? "Save" : "Add"}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for viewing nurse details in read-only mode.
 * Shows assigned patients and allows navigation to patient profiles.
 * @param {Object} props - Component props
 * @param {Object} props.nurse - Nurse data to display
 * @param {Array} props.patientsForNurse - List of patients assigned to this nurse
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.navigate - Navigation function (currently noop)
 * @returns {JSX.Element} Nurse view modal
 */
const ViewNurseModal = ({ nurse, patientsForNurse = [], onClose, navigate }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Nurse Details</h2>
      <p><strong>ID:</strong> {nurse.id}</p>
      <p><strong>Name:</strong> {nurse.name}</p>
      <p><strong>Department:</strong> {nurse.department || "—"}</p>
      <p><strong>Phone:</strong> {nurse.phone || "—"}</p>
      <p><strong>DOB:</strong> {nurse.dob || "—"} {nurse.dob ? `(${calcAge(nurse.dob)} yrs)` : ""}</p>
      <p><strong>Patients Assigned:</strong> {patientsForNurse.length}</p>
      {!!patientsForNurse.length && (
        <ul>
          {patientsForNurse.map((p) => (
            <li key={p.id}>
              <button className="link-btn" onClick={() => navigate(`/users/Patients/${p.id}`, { state: { user: p } })}>
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
 * Confirmation modal for deleting a nurse.
 * Shows warning if nurse has assigned patients.
 * @param {Object} props - Component props
 * @param {Object} props.nurse - Nurse to delete
 * @param {number} props.inUsePatients - Number of patients assigned to this nurse
 * @param {string} props.warn - Custom warning message
 * @param {Function} props.onDelete - Callback when deletion is confirmed
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Delete confirmation modal
 */
const DeleteNurseModal = ({ nurse, inUsePatients = 0, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Nurse</h2>
      <p>Delete <strong>{nurse.name}</strong> ({nurse.id})?</p>
      {inUsePatients > 0 && (
        <p style={{ color: "#b54708", background: "#fff6e6", padding: "8px 10px", borderRadius: 8 }}>
          {warn || `This nurse has ${inUsePatients} patient(s). Reassign or remove them first.`}
        </p>
      )}
      <div className="modal-actions">
        <button className="danger" onClick={onDelete} disabled={inUsePatients > 0}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

/* -------- Doctors: Add/Edit + View + Delete -------- */
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
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? doctor?.id : "",
    name: isEdit ? doctor?.name : "",
    specialization: isEdit ? (doctor?.specialization || doctor?.specialty || "") : "",
    department: isEdit ? (doctor?.department || "") : "",
    city: isEdit ? (doctor?.city || "") : "",
    phone: isEdit ? (doctor?.phone || "") : "",
    dob: isEdit ? (doctor?.dob || "") : "",
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
  const validateClerkDoctorPhone = (p) => (!p || /^\d{9,12}$/.test(p));

  /**
   * Validates and saves the doctor form.
   * Ensures name, specialization, and phone format are valid.
   */
  const handleSaveClerkDoctor = () => {
    if (!form.name.trim()) return alert("Doctor name is required.");
    if (!form.specialization.trim()) return alert("Specialization is required.");
    if (!validateClerkDoctorPhone(form.phone)) return alert("Phone must be 9–12 digits.");
    const payload = {
      id: form.id,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      department: form.department?.trim() || "",
      city: form.city?.trim() || "",
      phone: form.phone?.trim() || "",
      dob: form.dob || "",
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Doctor" : "Add Doctor"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Doctor ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleClerkDoctorFormChange} />
        <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleClerkDoctorFormChange} />
        <input name="department" placeholder="Department (optional)" value={form.department} onChange={handleClerkDoctorFormChange} />
        <input name="city" placeholder="City (optional)" value={form.city} onChange={handleClerkDoctorFormChange} />
        <input name="phone" placeholder="Phone (9–12 digits)" value={form.phone} onChange={handleClerkDoctorFormChange} />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleClerkDoctorFormChange} />
        <div className="modal-actions">
          <button onClick={handleSaveClerkDoctor}>{isEdit ? "Save" : "Add"}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for viewing doctor details in read-only mode.
 * Shows assigned patients, appointment count, and allows navigation to patient profiles.
 * @param {Object} props - Component props
 * @param {Object} props.doctor - Doctor data to display
 * @param {Array} props.patientsForDoctor - List of patients assigned to this doctor
 * @param {number} props.appointmentCount - Number of appointments for this doctor
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.navigate - Navigation function (currently noop)
 * @returns {JSX.Element} Doctor view modal
 */
const ViewDoctorModal = ({ doctor, patientsForDoctor = [], appointmentCount = 0, onClose, navigate }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Doctor Details</h2>
      <p><strong>ID:</strong> {doctor.id}</p>
      <p><strong>Name:</strong> {doctor.name}</p>
      <p><strong>Specialization:</strong> {doctor.specialization || doctor.specialty || "—"}</p>
      <p><strong>Department:</strong> {doctor.department || "—"}</p>
      <p><strong>City:</strong> {doctor.city || "—"}</p>
      <p><strong>Phone:</strong> {doctor.phone || "—"}</p>
      <p><strong>DOB:</strong> {doctor.dob || "—"} {doctor.dob ? `(${calcAge(doctor.dob)} yrs)` : ""}</p>
      <p><strong>Patients:</strong> {patientsForDoctor.length}</p>
      <p><strong>Appointments:</strong> {appointmentCount}</p>
      {!!patientsForDoctor.length && (
        <ul style={{ marginTop: 8 }}>
          {patientsForDoctor.map((p) => (
            <li key={p.id}>
              <button className="link-btn" onClick={() => navigate(`/users/Patients/${p.id}`, { state: { user: p } })}>
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
const DeleteDoctorModal = ({ doctor, inUsePatients = 0, inUseAppointments = 0, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>Delete <strong>{doctor.name}</strong> ({doctor.id})?</p>
      {(inUsePatients > 0 || inUseAppointments > 0) && (
        <p style={{ color: "#b54708", background: "#fff6e6", padding: "8px 10px", borderRadius: 8 }}>
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

// Keep: Waitlist / FillFromWaitlist / Transfer / ConfirmDialog (unchanged from your file)
/**
 * Modal component for adding patients to the waitlist.
 * @param {Object} props - Component props
 * @param {Object} props.initial - Initial waitlist entry data
 * @param {Function} props.onSave - Callback when waitlist entry is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Waitlist form modal
 */
const WaitlistModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  
  /**
   * Validates and saves the waitlist form.
   * Ensures patient and department are provided.
   */
  const saveWaitlistForm = () => {
    if (!form.patient || !form.department) return alert("Patient and department are required.");
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>Add to Waitlist</h2>
        <input
          placeholder="Patient name"
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
        />
        <input
          placeholder="Department (e.g., Dermatology)"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
        <label>Preferred Date</label>
        <input
          type="date"
          value={form.preferredDate ?? ""}
          onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
        />
        <input
          placeholder="Notes (optional)"
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={saveWaitlistForm}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for booking an appointment from a waitlist entry.
 * Allows selection of doctor, date, and available time slot.
 * @param {Object} props - Component props
 * @param {Object} props.entry - Waitlist entry data
 * @param {Array} props.doctors - List of available doctors
 * @param {Function} props.availableSlots - Function to get available slots
 * @param {string} props.defaultDate - Default date for the appointment
 * @param {Function} props.onPick - Callback when slot is selected
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Waitlist booking modal
 */
const FillFromWaitlistModal = ({
  entry,
  doctors,
  availableSlots,
  defaultDate,
  onPick,
  onClose,
}) => {
  const [form, setForm] = useState({
    doctor: doctors.find((d) => d.department === entry.department)?.name ?? "",
    date: entry.preferredDate ?? defaultDate,
    time: "",
  });
  
  /**
   * Calculates available time slots for the selected doctor and date.
   * @type {Array<string>}
   */
  const slots = useMemo(() => {
    if (!form.doctor || !form.date) return [];
    return availableSlots(form.doctor, form.date);
  }, [form.doctor, form.date, availableSlots]);

  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>Fill slot for {entry.patient}</h2>
        <label>Doctor</label>
        <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
          {doctors
            .filter((d) => d.department === entry.department)
            .map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
        </select>
        <label>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>Time</label>
        <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
          <option value="">Select time</option>
          {slots.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="modal-actions">
          <button
            className="btn"
            onClick={() => {
              if (!form.doctor || !form.date || !form.time) return alert("Pick doctor, date and time.");
              onPick(form.doctor, form.date, form.time);
            }}
          >
            Book
          </button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for creating a new transfer request.
 * @param {Object} props - Component props
 * @param {Object} props.initial - Initial transfer data
 * @param {Function} props.onSave - Callback when transfer is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Transfer creation form modal
 */
const TransferCreateModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  
  /**
   * Validates and saves the transfer form.
   * Ensures patient, from department, and to department are provided.
   */
  const saveTransferForm = () => {
    if (!form.patient || !form.fromDept || !form.toDept)
      return alert("Patient, from and to departments are required.");
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>New Transfer</h2>
        <input
          placeholder="Patient name"
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
        />
        <input
          placeholder="From department"
          value={form.fromDept}
          onChange={(e) => setForm({ ...form, fromDept: e.target.value })}
        />
        <input
          placeholder="To department"
          value={form.toDept}
          onChange={(e) => setForm({ ...form, toDept: e.target.value })}
        />
        <input
          placeholder="Reason (optional)"
          value={form.reason ?? ""}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={saveTransferForm}>Create</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for assigning a doctor to a transfer request.
 * @param {Object} props - Component props
 * @param {Object} props.transfer - Transfer request data
 * @param {Array} props.doctors - List of available doctors
 * @param {Function} props.onSave - Callback when doctor is assigned
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Doctor assignment modal
 */
const TransferAssignModal = ({ transfer, doctors, onSave, onClose }) => {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Assign Doctor</h2>
        <div className="meta" style={{ marginBottom: 8 }}>
          {transfer.patient}: {transfer.fromDept} → {transfer.toDept}
        </div>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="modal-actions">
          <button className="btn" onClick={() => onSave(doctorId)}>Assign</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Generic confirmation dialog component for delete operations.
 * Displays a warning message and requires explicit confirmation.
 * @param {Object} props - Component props
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Warning message to display
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {Function} props.onClose - Callback to close the dialog
 * @returns {JSX.Element} Confirmation dialog
 */
const ConfirmDialog = ({ title, message, onConfirm, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h3>{title}</h3>
      <p style={{ marginBottom: 16, color: "#555" }}>{message}</p>
      <div className="modal-actions">
        <button className="btn" onClick={onConfirm}>Delete</button>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

// === Export only the working default ===
export default ClerkDashboardModern;
