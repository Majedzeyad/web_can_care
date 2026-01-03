import {
    collection,
  doc, 
  getDoc, 
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';

// ==================== HELPERS ====================

const getCurrentUserId = () => {
  return auth.currentUser?.uid;
};

const getPlatform = () => 'web';

// ==================== PATIENTS (موحد) ====================

/**
 * جلب جميع المرضى النشطين
 */
export const getPatients = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('status', '==', 'active'), orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

/**
 * الاشتراك في تحديثات المرضى (Real-time)
 * جلب جميع المرضى بدون فلترة - يمكن الفلترة في الـ UI
 */
export const subscribeToPatients = (callback) => {
  const patientsRef = collection(db, 'patients');
  
  // محاولة جلب جميع المرضى مع orderBy
  try {
    const q = query(patientsRef, orderBy('name'));
    
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
      }));
      console.log('Patients loaded:', patients.length);
      callback(patients);
    }, (error) => {
      console.error('Error in patients subscription:', error);
      // إذا فشل orderBy، جرب بدون orderBy
      const fallbackQuery = query(patientsRef);
      return onSnapshot(fallbackQuery, (snapshot) => {
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
        }));
        console.log('Patients loaded (fallback):', patients.length);
        callback(patients);
      }, (fallbackError) => {
        console.error('Error in patients subscription (fallback):', fallbackError);
        callback([]);
      });
    });
  } catch (error) {
    // إذا فشل الاستعلام تماماً، جرب بدون orderBy
    console.warn('Initial query failed, trying without orderBy:', error);
    const fallbackQuery = query(patientsRef);
    return onSnapshot(fallbackQuery, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
      }));
      console.log('Patients loaded (no orderBy):', patients.length);
      callback(patients);
    }, (fallbackError) => {
      console.error('Error in patients subscription (no orderBy):', fallbackError);
      callback([]);
    });
  }
};

/**
 * إنشاء مريض جديد
 */
export const createPatient = async (patientData) => {
  try {
    const patientsRef = collection(db, 'patients');
    let uid = patientData.uid;
    
    // إنشاء حساب في Firebase Authentication إذا كان هناك email و password
    if (patientData.email && patientData.password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          patientData.email,
          patientData.password
        );
        uid = userCredential.user.uid;
        console.log('Patient account created in Firebase Auth:', uid);
      } catch (authError) {
        console.error('Error creating Firebase Auth account:', authError);
        throw new Error(`Failed to create account: ${authError.message}`);
      }
    }
    
    const docRef = await addDoc(patientsRef, {
      name: patientData.name,
      dob: patientData.dob,
      gender: patientData.gender || null,
      bloodType: patientData.bloodType || null,
      phone: patientData.phone || '',
      email: patientData.email || '',
      uid: uid || null,
      
      // معلومات الرعاية - استخدام uid للأطباء والممرضات
      assignedDoctorId: patientData.assignedDoctorId || patientData.doctorId || null,
      assignedNurseId: patientData.assignedNurseId || patientData.nurseId || null,
      responsiblePartyId: patientData.responsiblePartyId || null,
      
      // الحالة
      status: patientData.status || 'active',
      currentDepartment: patientData.department || patientData.currentDepartment || 'General',
      
      // بيانات React Web
      webData: {
        diagnosis: patientData.diagnosis || patientData.webData?.diagnosis || '',
        admissionDate: patientData.admissionDate ? serverTimestamp() : null
      },
      
      // بيانات Flutter Mobile (فارغة للـ web)
      mobileData: {
        medicalHistory: [],
        allergies: []
      },
      
      // Metadata
      createdAt: serverTimestamp(),
      createdBy: getCurrentUserId(),
      createdPlatform: getPlatform(),
      updatedAt: serverTimestamp(),
      updatedBy: null // سيتم تعبئته عند التحديث
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

/**
 * تحديث بيانات مريض
 */
export const updatePatient = async (patientId, updates) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    
    // إذا كان هناك password جديد، نحذر أن تحديث كلمة السر يحتاج Admin SDK
    let updateData = { ...updates };
    if (updates.password && updates.password.trim()) {
      console.warn('Password update requires admin privileges. Please use Firebase Admin SDK or update manually in Firebase Console.');
      // إزالة password من updates لأننا لا نريد حفظه في Firestore
      const { password, ...rest } = updateData;
      updateData = rest;
    }
    
    // تحديث webData بشكل منفصل إذا كان موجوداً
    if (updates.diagnosis !== undefined || updates.admissionDate !== undefined) {
      const currentDoc = await getDoc(patientRef);
      const currentData = currentDoc.data();
      updateData.webData = {
        ...currentData?.webData,
        ...(updates.diagnosis !== undefined && { diagnosis: updates.diagnosis }),
        ...(updates.admissionDate !== undefined && { admissionDate: updates.admissionDate ? serverTimestamp() : null })
      };
      delete updateData.diagnosis;
      delete updateData.admissionDate;
    }
    
    // تحويل doctorId/nurseId إلى assignedDoctorId/assignedNurseId إذا لزم الأمر
    if (updates.doctorId !== undefined) {
      updateData.assignedDoctorId = updates.doctorId;
      delete updateData.doctorId;
    }
    if (updates.nurseId !== undefined) {
      updateData.assignedNurseId = updates.nurseId;
      delete updateData.nurseId;
    }
    
    await updateDoc(patientRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: getCurrentUserId()
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * حذف مريض (Soft delete)
 */
export const deletePatient = async (patientId) => {
  try {
    await updatePatient(patientId, { status: 'inactive' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// ==================== DOCTORS ====================

export const getDoctors = async () => {
  try {
    const doctorsRef = collection(db, 'doctors');
    const snapshot = await getDocs(doctorsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting doctors:', error);
    throw error;
  }
};

export const subscribeToDoctors = (callback) => {
  const doctorsRef = collection(db, 'doctors');
  
  return onSnapshot(doctorsRef, (snapshot) => {
    const doctors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(doctors);
  });
};

export const createDoctor = async (doctorData) => {
  try {
    const doctorsRef = collection(db, 'doctors');
    let uid = doctorData.uid;
    
    // إنشاء حساب في Firebase Authentication إذا كان هناك email و password
    if (doctorData.email && doctorData.password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          doctorData.email,
          doctorData.password
        );
        uid = userCredential.user.uid;
        console.log('Doctor account created in Firebase Auth:', uid);
      } catch (authError) {
        console.error('Error creating Firebase Auth account:', authError);
        throw new Error(`Failed to create account: ${authError.message}`);
      }
    } else {
      // إذا لم يكن هناك email/password، إنشاء UID فريد
      uid = uid || `doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // الهيكل الأساسي للطبيب
    const doctorDoc = {
      name: doctorData.name,
      department: doctorData.department || '',
      phone: doctorData.phone || '',
      specialization: doctorData.specialization || doctorData.specialty || '',
      email: doctorData.email || '',
      uid: uid,
      
      // Stats - القيم الافتراضية
      stats: {
        activePatients: 0,
        appointmentsToday: 0,
        pendingLabTests: 0,
        ...doctorData.stats // السماح بتجاوز القيم الافتراضية
      },
      
      // Work Schedule - هيكل أيام الأسبوع
      workSchedule: doctorData.workSchedule || {
        monday: {
          enabled: true,
          slots: ['09:00', '09:30', '10:00']
        },
        tuesday: {
          enabled: true,
          slots: ['09:00', '09:30', '10:00']
        },
        wednesday: {
          enabled: true,
          slots: ['09:00', '09:30', '10:00']
        },
        thursday: {
          enabled: true,
          slots: ['09:00', '09:30', '10:00']
        },
        friday: {
          enabled: false,
          slots: []
        },
        saturday: {
          enabled: false,
          slots: []
        },
        sunday: {
          enabled: true,
          slots: ['09:00', '09:30', '10:00']
        }
      },
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(doctorsRef, doctorDoc);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating doctor:', error);
    throw error;
  }
};

export const updateDoctor = async (doctorId, updates) => {
  try {
    const doctorRef = doc(db, 'doctors', doctorId);
    
    // إذا كان هناك password جديد، تحديث كلمة السر في Firebase Auth
    if (updates.password && updates.password.trim()) {
      try {
        const doctorDoc = await getDoc(doctorRef);
        const doctorData = doctorDoc.data();
        
        if (doctorData?.uid) {
          // هنا نحتاج إلى sign in كـ admin لتحديث كلمة السر
          // أو استخدام Firebase Admin SDK (Server-side)
          // في الوقت الحالي، سنحفظ email فقط ونترك تحديث كلمة السر للـ admin
          console.warn('Password update requires admin privileges. Please use Firebase Admin SDK or update manually in Firebase Console.');
        }
      } catch (authError) {
        console.error('Error updating password:', authError);
      }
      
      // إزالة password من updates لأننا لا نريد حفظه في Firestore
      const { password, ...updatesWithoutPassword } = updates;
      updates = updatesWithoutPassword;
    }
    
    await updateDoc(doctorRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    throw error;
  }
};

export const deleteDoctor = async (doctorId) => {
  try {
    const doctorRef = doc(db, 'doctors', doctorId);
    await deleteDoc(doctorRef);
  } catch (error) {
    console.error('Error deleting doctor:', error);
    throw error;
  }
};

// ==================== NURSES ====================

export const getNurses = async () => {
  try {
    const nursesRef = collection(db, 'nurses');
    const snapshot = await getDocs(nursesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting nurses:', error);
    throw error;
  }
};

export const subscribeToNurses = (callback) => {
  const nursesRef = collection(db, 'nurses');
  
  return onSnapshot(nursesRef, (snapshot) => {
    const nurses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(nurses);
  });
};

export const createNurse = async (nurseData) => {
  try {
    const nursesRef = collection(db, 'nurses');
    let uid = nurseData.uid;
    
    // إنشاء حساب في Firebase Authentication إذا كان هناك email و password
    if (nurseData.email && nurseData.password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          nurseData.email,
          nurseData.password
        );
        uid = userCredential.user.uid;
        console.log('Nurse account created in Firebase Auth:', uid);
      } catch (authError) {
        console.error('Error creating Firebase Auth account:', authError);
        throw new Error(`Failed to create account: ${authError.message}`);
      }
    } else {
      // إذا لم يكن هناك email/password، إنشاء UID فريد
      uid = uid || `nurse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const docRef = await addDoc(nursesRef, {
      uid: uid,
      name: nurseData.name,
      department: nurseData.department || '',
      phone: nurseData.phone || '',
      email: nurseData.email || '',
      shift: nurseData.shift || 'morning', // morning | evening | night
      
      // Stats - القيم الافتراضية
      stats: {
        assignedPatients: 0,
        ...nurseData.stats // السماح بتجاوز القيم الافتراضية
      },
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating nurse:', error);
    throw error;
  }
};

export const updateNurse = async (nurseId, updates) => {
  try {
    const nurseRef = doc(db, 'nurses', nurseId);
    
    // إذا كان هناك password جديد، نحذر أن تحديث كلمة السر يحتاج Admin SDK
    let updateData = { ...updates };
    if (updates.password && updates.password.trim()) {
      console.warn('Password update requires admin privileges. Please use Firebase Admin SDK or update manually in Firebase Console.');
      // إزالة password من updates لأننا لا نريد حفظه في Firestore
      const { password, ...rest } = updateData;
      updateData = rest;
    }
    
    await updateDoc(nurseRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating nurse:', error);
    throw error;
  }
};

export const deleteNurse = async (nurseId) => {
  try {
    const nurseRef = doc(db, 'nurses', nurseId);
    await deleteDoc(nurseRef);
  } catch (error) {
    console.error('Error deleting nurse:', error);
    throw error;
  }
};

// ==================== WEB APPOINTMENTS ====================

export const getWebAppointments = async () => {
  try {
    const appointmentsRef = collection(db, 'web_appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};

export const subscribeToWebAppointments = (callback) => {
  const appointmentsRef = collection(db, 'web_appointments');
  
  return onSnapshot(appointmentsRef, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    callback(appointments);
  });
};

/**
 * التحقق من التعارض في المواعيد
 */
const checkAppointmentConflict = async (doctorId, date, time, excludeId = null) => {
  const appointmentsRef = collection(db, 'web_appointments');
  const q = query(
    appointmentsRef,
    where('doctorId', '==', doctorId),
    where('date', '==', date),
    where('time', '==', time),
    where('status', '==', 'scheduled')
  );
  
  const snapshot = await getDocs(q);
  
  // استبعاد الموعد الحالي عند التحديث
  if (excludeId) {
    return snapshot.docs.some(doc => doc.id !== excludeId);
  }
  
  return !snapshot.empty;
};

export const createWebAppointment = async (appointmentData) => {
  try {
    // التحقق من عدم التعارض
    const hasConflict = await checkAppointmentConflict(
      appointmentData.doctorId,
      appointmentData.date,
      appointmentData.time
    );
    
    if (hasConflict) {
      throw new Error('هذا الموعد محجوز بالفعل');
    }
    
    const appointmentsRef = collection(db, 'web_appointments');
    
    // التأكد من أن الوقت موجود
    if (!appointmentData.time || appointmentData.time.trim() === '') {
      throw new Error('الوقت مطلوب');
    }
    
    const docRef = await addDoc(appointmentsRef, {
      patientId: appointmentData.patientId || null,
      patientName: appointmentData.patientName || '',
      doctorId: appointmentData.doctorId || null,
      doctorName: appointmentData.doctorName || '',
      date: appointmentData.date || '',
      time: appointmentData.time.trim(), // إزالة المسافات الزائدة
      status: appointmentData.status || 'scheduled',
      notes: appointmentData.notes || '',
      createdAt: serverTimestamp(),
      createdBy: getCurrentUserId()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const updateWebAppointment = async (appointmentId, updates) => {
  try {
    // إذا كان التحديث يتضمن تغيير الوقت، تحقق من التعارض
    if (updates.doctorId || updates.date || updates.time) {
      const appointmentRef = doc(db, 'web_appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      const currentData = appointmentDoc.data();
      
      const hasConflict = await checkAppointmentConflict(
        updates.doctorId || currentData.doctorId,
        updates.date || currentData.date,
        updates.time || currentData.time,
        appointmentId
      );
      
      if (hasConflict) {
        throw new Error('هذا الموعد محجوز بالفعل');
      }
    }
    
    const appointmentRef = doc(db, 'web_appointments', appointmentId);
    
    // تنظيف البيانات قبل التحديث
    const cleanUpdates = { ...updates };
    if (cleanUpdates.time) {
      cleanUpdates.time = cleanUpdates.time.trim(); // إزالة المسافات الزائدة
    }
    
    await updateDoc(appointmentRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
      updatedBy: getCurrentUserId()
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};


export const deleteWebAppointment = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, 'web_appointments', appointmentId);
    await deleteDoc(appointmentRef);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// ==================== WEB WAITLIST ====================

export const subscribeToWebWaitlist = (callback) => {
  const waitlistRef = collection(db, 'web_waitlist');
  const q = query(waitlistRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const waitlist = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    callback(waitlist);
  });
};

export const createWebWaitlistEntry = async (data) => {
  try {
    const waitlistRef = collection(db, 'web_waitlist');
    
    const docRef = await addDoc(waitlistRef, {
      patient: data.patient,
      department: data.department,
      preferredDate: data.preferredDate,
      notes: data.notes || '',
      status: 'waiting',
      createdAt: serverTimestamp(),
      createdBy: getCurrentUserId()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating waitlist entry:', error);
    throw error;
  }
};

export const deleteWebWaitlistEntry = async (entryId) => {
  try {
    const entryRef = doc(db, 'web_waitlist', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting waitlist entry:', error);
    throw error;
  }
};

// ==================== WEB TRANSFERS ====================

export const subscribeToWebTransfers = (callback) => {
  const transfersRef = collection(db, 'web_transfers');
  const q = query(transfersRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const transfers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    callback(transfers);
  });
};

export const createWebTransfer = async (data) => {
  try {
    const transfersRef = collection(db, 'web_transfers');
    
    const docRef = await addDoc(transfersRef, {
      patientId: data.patientId,
      patient: data.patient,
      fromDept: data.fromDept,
      toDept: data.toDept,
      reason: data.reason,
      status: 'pending',
      assignedDoctorId: data.assignedDoctorId || null,
      createdAt: serverTimestamp(),
      createdBy: getCurrentUserId(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw error;
  }
};

export const updateWebTransfer = async (transferId, updates) => {
  try {
    const transferRef = doc(db, 'web_transfers', transferId);
    
    await updateDoc(transferRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: getCurrentUserId()
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    throw error;
  }
};

export const deleteWebTransfer = async (transferId) => {
  try {
    const transferRef = doc(db, 'web_transfers', transferId);
    await deleteDoc(transferRef);
  } catch (error) {
    console.error('Error deleting transfer:', error);
    throw error;
  }
};

// ==================== WEB POSTS ====================

export const subscribeToWebPosts = (callback) => {
  const postsRef = collection(db, 'web_posts');
  
  try {
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));
      console.log('Posts loaded:', posts.length);
      callback(posts);
    }, (error) => {
      console.error('Error in posts subscription (with orderBy):', error);
      // Fallback without orderBy
      const fallbackQuery = query(postsRef);
      return onSnapshot(fallbackQuery, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
        }));
        // Sort manually by createdAt
        posts.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        console.log('Posts loaded (fallback):', posts.length);
        callback(posts);
      }, (fallbackError) => {
        console.error('Error in posts subscription (fallback):', fallbackError);
        callback([]);
      });
    });
  } catch (error) {
    console.warn('Initial query failed, trying without orderBy:', error);
    const fallbackQuery = query(postsRef);
    return onSnapshot(fallbackQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));
      posts.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      console.log('Posts loaded (no orderBy):', posts.length);
      callback(posts);
    }, (fallbackError) => {
      console.error('Error in posts subscription (no orderBy):', fallbackError);
      callback([]);
    });
  }
};

export const createWebPost = async (postData) => {
  try {
    const postsRef = collection(db, 'web_posts');
    
    const docRef = await addDoc(postsRef, {
      title: postData.title,
      content: postData.content,
      category: postData.category,
      image: postData.image || '',
      authorId: getCurrentUserId(),
      authorName: postData.authorName,
      likes: 0,
      comments: [],
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updateWebPost = async (postId, updates) => {
  try {
    const postRef = doc(db, 'web_posts', postId);
    
    await updateDoc(postRef, updates);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// ==================== WEB NOTIFICATIONS ====================

export const subscribeToWebNotifications = (callback) => {
  const notificationsRef = collection(db, 'web_notifications');
  const q = query(notificationsRef, orderBy('sentAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate()
    }));
    callback(notifications);
  });
};

export const createWebNotification = async (notificationData) => {
  try {
    const notificationsRef = collection(db, 'web_notifications');
    
    const docRef = await addDoc(notificationsRef, {
      audience: notificationData.audience,
      toId: notificationData.toId || null,
      subject: notificationData.subject,
      message: notificationData.message,
      priority: notificationData.priority || 'medium',
      status: 'sent',
      sentAt: serverTimestamp(),
      sentBy: getCurrentUserId()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const updateWebNotification = async (notificationId, updates) => {
  try {
    const notificationRef = doc(db, 'web_notifications', notificationId);
    
    await updateDoc(notificationRef, {
      ...updates,
      reviewedAt: updates.reviewedAt ? serverTimestamp() : undefined
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

// ==================== LEGACY COMPATIBILITY ====================
// هذه الدوال للتوافق مع الكود القديم

export const getCollection = async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToCollection = (collectionName, callback) => {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
};

export const appAddDoc = async (collectionName, data) => {
  // استخدام createDoctor للهيكل الصحيح عند إضافة طبيب
  if (collectionName === 'doctors') {
    const doctorId = await createDoctor(data);
    return { id: doctorId, ...data };
  }
  
  // استخدام createNurse للهيكل الصحيح عند إضافة ممرضة
  if (collectionName === 'nurses') {
    const nurseId = await createNurse(data);
    return { id: nurseId, ...data };
  }
  
  // استخدام createPatient للهيكل الصحيح عند إضافة مريض
  if (collectionName === 'patients') {
    const patientId = await createPatient(data);
    return { id: patientId, ...data };
  }
  
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
};

export const appUpdateDoc = async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
};

export const appDeleteDoc = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};
