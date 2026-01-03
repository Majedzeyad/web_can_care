# COMPLETE FUNCTIONAL MAP - Can Care React Application

**Generated:** 2025-01-XX  
**Application:** Can Care - Hospital Management System  
**Framework:** React with Firebase (Firestore + Auth)

---

## TABLE OF CONTENTS

1. [Function Inventory Table](#a-function-inventory-table)
2. [CRUD Matrix by Role](#b-crud-matrix-by-role)
3. [Database/Backend Access Map](#c-database--backend-access-map)
4. [Admin-Only Actions](#d-admin-only-actions)
5. [Security & Logic Issues](#e-security--logic-issues)

---

## A. FUNCTION INVENTORY TABLE

| Function Name | File | Role | Operation | Collection/API | Action | Trigger | Error Handling |
|--------------|------|------|-----------|----------------|--------|---------|----------------|
| **AUTHENTICATION** |
| `handleLogin` | `src/components/Login.jsx` | Guest | AUTH | Firebase Auth | Login | Form submit | try/catch, error state |
| `handleRegister` | `src/components/Login.jsx` | Guest | CREATE | Firebase Auth + Firestore `users` | Create user account | Form submit | try/catch, error state |
| `onAuthStateChanged` | `src/App.js` | All | READ | Firebase Auth | Monitor auth state | Component mount | None |
| `signOut` | `src/Chief/ChiefRoutes.jsx` | Admin | AUTH | Firebase Auth | Logout | Button click | None |
| `handleLogout` | `src/Clerk/ClerkAppLayout.jsx` | Clerk | AUTH | Firebase Auth | Logout | Button click | None |
| **PATIENTS - CLERK** |
| `addPatient` | `src/Clerk/context/AppContext.jsx` | Clerk | CREATE | Firestore `patients` | Create patient | Button click | None (async) |
| `editPatient` | `src/Clerk/context/AppContext.jsx` | Clerk | UPDATE | Firestore `patients` | Update patient | Button click | None (async) |
| `deletePatient` | `src/Clerk/context/AppContext.jsx` | Clerk | DELETE | Firestore `patients` | Delete patient | Button click | None (async) |
| `handleAddPatient` | `src/Clerk/users/Patients.js` | Clerk | CREATE | Firestore `patients` | Add patient via form | Button click | Alert validation |
| `handleEditPatient` | `src/Clerk/users/Patients.js` | Clerk | UPDATE | Firestore `patients` | Edit patient via form | Button click | Alert validation |
| `handleDeletePatient` | `src/Clerk/users/Patients.js` | Clerk | DELETE | Firestore `patients` | Delete patient | Button click | None |
| `handleSaveClerkPatientForm` | `src/Clerk/users/Patients.js` | Clerk | CREATE/UPDATE | Firestore `patients` | Validate & save form | Button click | Alert validation |
| `savePatient` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `patients` | Save patient (create/update) | Button click | None |
| `calculateAge` | `src/Clerk/users/Patients.js` | Clerk | UTILITY | None | Calculate age from DOB | Background logic | Returns "—" if invalid |
| `docName` | `src/Clerk/users/Patients.js` | Clerk | READ | Context lookup | Get doctor name | Background logic | Returns "—" if not found |
| `nurseName` | `src/Clerk/users/Patients.js` | Clerk | READ | Context lookup | Get nurse name | Background logic | Returns "—" if not found |
| **PATIENTS - CHIEF** |
| `handleEditPatient` | `src/Chief/Users/Patients.js` | Admin | UPDATE | Local state (MOCK) | Edit patient (MOCK) | Button click | None |
| `handleDeletePatient` | `src/Chief/Users/Patients.js` | Admin | DELETE | Local state (MOCK) | Delete patient (MOCK) | Button click | None |
| `handleChiefPatientFormChange` | `src/Chief/Users/Patients.js` | Admin | STATE | None | Form field change | Input change | None |
| `openChiefPatientModal` | `src/Chief/Users/Patients.js` | Admin | STATE | None | Open patient modal | Button click | None |
| **DOCTORS - CLERK** |
| `addDoctor` | `src/Clerk/context/AppContext.jsx` | Clerk | CREATE | Firestore `doctors` | Create doctor | Button click | None (async) |
| `editDoctor` | `src/Clerk/context/AppContext.jsx` | Clerk | UPDATE | Firestore `doctors` | Update doctor | Button click | None (async) |
| `deleteDoctor` | `src/Clerk/context/AppContext.jsx` | Clerk | DELETE | Firestore `doctors` | Delete doctor | Button click | None (async) |
| `handleAddDoctor` | `src/Clerk/users/Doctors.js` | Clerk | CREATE | Firestore `doctors` | Add doctor via form | Button click | None |
| `handleEditDoctor` | `src/Clerk/users/Doctors.js` | Clerk | UPDATE | Firestore `doctors` | Edit doctor via form | Button click | None |
| `handleDeleteDoctor` | `src/Clerk/users/Doctors.js` | Clerk | DELETE | Firestore `doctors` | Delete doctor (with validation) | Button click | Prevents if in use |
| `handleSaveClerkDoctorForm` | `src/Clerk/users/Doctors.js` | Clerk | CREATE/UPDATE | Firestore `doctors` | Validate & save form | Button click | Alert validation |
| `validateClerkDoctorPhoneNumber` | `src/Clerk/users/Doctors.js` | Clerk | UTILITY | None | Validate phone format | Background logic | Returns boolean |
| `countPatientsFor` | `src/Clerk/users/Doctors.js` | Clerk | READ | Context lookup | Count assigned patients | Background logic | None |
| `countAppointmentsFor` | `src/Clerk/users/Doctors.js` | Clerk | READ | Context lookup | Count appointments | Background logic | None |
| `resolveDoctorName` | `src/Clerk/users/Doctors.js` | Clerk | READ | Context lookup | Resolve doctor name | Background logic | Returns "—" if not found |
| `resolveNurseName` | `src/Clerk/users/Doctors.js` | Clerk | READ | Context lookup | Resolve nurse name | Background logic | Returns "—" if not found |
| `saveDoctor` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `doctors` | Save doctor (create/update) | Button click | None |
| `handleSaveClerkDoctor` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `doctors` | Validate & save doctor | Button click | Alert validation |
| `handleClerkDoctorFormChange` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | STATE | None | Form field change | Input change | None |
| `validateClerkDoctorPhone` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UTILITY | None | Validate phone format | Background logic | Returns boolean |
| **DOCTORS - CHIEF** |
| `handleEditDoctor` | `src/Chief/Users/Doctors.js` | Admin | UPDATE | Local state (MOCK) | Edit doctor (MOCK) | Button click | None |
| `handleDeleteDoctor` | `src/Chief/Users/Doctors.js` | Admin | DELETE | Local state (MOCK) | Delete doctor (MOCK) | Button click | None |
| `handleChiefDoctorFormChange` | `src/Chief/Users/Doctors.js` | Admin | STATE | None | Form field change | Input change | None |
| `openChiefDoctorModal` | `src/Chief/Users/Doctors.js` | Admin | STATE | None | Open doctor modal | Button click | None |
| **NURSES - CLERK** |
| `addNurse` | `src/Clerk/context/AppContext.jsx` | Clerk | CREATE | Firestore `nurses` | Create nurse | Button click | None (async) |
| `editNurse` | `src/Clerk/context/AppContext.jsx` | Clerk | UPDATE | Firestore `nurses` | Update nurse | Button click | None (async) |
| `deleteNurse` | `src/Clerk/context/AppContext.jsx` | Clerk | DELETE | Firestore `nurses` | Delete nurse | Button click | None (async) |
| `handleAddNurse` | `src/Clerk/users/Nurses.js` | Clerk | CREATE | Firestore `nurses` | Add nurse via form | Button click | None |
| `handleEditNurse` | `src/Clerk/users/Nurses.js` | Clerk | UPDATE | Firestore `nurses` | Edit nurse via form | Button click | None |
| `handleDeleteNurse` | `src/Clerk/users/Nurses.js` | Clerk | DELETE | Firestore `nurses` | Delete nurse (with validation) | Button click | Prevents if in use |
| `handleSaveClerkNurseForm` | `src/Clerk/users/Nurses.js` | Clerk | CREATE/UPDATE | Firestore `nurses` | Validate & save form | Button click | Alert validation |
| `validateClerkNursePhoneNumber` | `src/Clerk/users/Nurses.js` | Clerk | UTILITY | None | Validate phone format | Background logic | Returns boolean |
| `countPatientsFor` | `src/Clerk/users/Nurses.js` | Clerk | READ | Context lookup | Count assigned patients | Background logic | None |
| `saveNurse` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `nurses` | Save nurse (create/update) | Button click | None |
| `handleSaveClerkNurse` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `nurses` | Validate & save nurse | Button click | Alert validation |
| `handleClerkNurseFormChange` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | STATE | None | Form field change | Input change | None |
| `validateClerkNursePhone` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UTILITY | None | Validate phone format | Background logic | Returns boolean |
| **NURSES - CHIEF** |
| `handleAddNurse` | `src/Chief/Users/Nurses.js` | Admin | CREATE | Local state (MOCK) | Add nurse (MOCK) | Button click | None |
| `handleEditNurse` | `src/Chief/Users/Nurses.js` | Admin | UPDATE | Local state (MOCK) | Edit nurse (MOCK) | Button click | None |
| `handleDeleteNurse` | `src/Chief/Users/Nurses.js` | Admin | DELETE | Local state (MOCK) | Delete nurse (MOCK) | Button click | None |
| `handleChiefNurseFormChange` | `src/Chief/Users/Nurses.js` | Admin | STATE | None | Form field change | Input change | None |
| `openChiefNurseModal` | `src/Chief/Users/Nurses.js` | Admin | STATE | None | Open nurse modal | Button click | None |
| **APPOINTMENTS - CLERK** |
| `addAppointment` | `src/Clerk/context/AppContext.jsx` | Clerk | CREATE | Firestore `appointments` | Create appointment | Button click | Throws if clash |
| `editAppointment` | `src/Clerk/context/AppContext.jsx` | Clerk | UPDATE | Firestore `appointments` | Update appointment | Button click | Throws if clash |
| `removeAppointment` | `src/Clerk/context/AppContext.jsx` | Clerk | DELETE | Firestore `appointments` | Delete appointment | Button click | None (async) |
| `availableSlots` | `src/Clerk/context/AppContext.jsx` | Clerk | READ | Context lookup | Get available slots | Background logic | Returns empty array |
| `willClash` | `src/Clerk/context/AppContext.jsx` | Clerk | UTILITY | Context lookup | Check double-booking | Background logic | Returns boolean |
| `handleSave` | `src/Clerk/Appointments/Appointments.js` | Clerk | CREATE/UPDATE | Firestore `appointments` | Save appointment | Button click | try/catch, error state |
| `handleDeleteClerkAppointment` | `src/Clerk/Appointments/Appointments.js` | Clerk | DELETE | Firestore `appointments` | Delete appointment | Button click | None |
| `openClerkAppointmentModal` | `src/Clerk/Appointments/Appointments.js` | Clerk | STATE | None | Open appointment modal | Button click | None |
| `closeClerkAppointmentModal` | `src/Clerk/Appointments/Appointments.js` | Clerk | STATE | None | Close appointment modal | Button click | None |
| `handleClerkAppointmentFormChange` | `src/Clerk/Appointments/Appointments.js` | Clerk | STATE | None | Form field change | Input change | None |
| `slotsForDoctor` | `src/Clerk/Appointments/Appointments.js` | Clerk | READ | Context lookup | Get slots for doctor | Background logic | Returns array |
| `saveAppointment` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `appointments` | Save appointment (with clash check) | Button click | Alert if clash |
| `updateStatus` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UPDATE | Firestore `appointments` | Update appointment status | Button click | Prompts waitlist on cancel |
| `deleteAppointment` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | DELETE | Firestore `appointments` | Delete appointment | Button click | None |
| `saveClerkAppointmentForm` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE/UPDATE | Firestore `appointments` | Validate & save form | Button click | Alert validation |
| `availableSlots` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | READ | Context lookup | Get available slots | Background logic | Returns array |
| **APPOINTMENTS - CHIEF** |
| `saveAppointment` | `src/Chief/Dashboard.js` | Admin | CREATE/UPDATE | Firestore `appointments` | Save appointment | Button click | None |
| `updateStatus` | `src/Chief/Dashboard.js` | Admin | UPDATE | Firestore `appointments` | Update appointment status | Button click | None |
| `deleteAppointment` | `src/Chief/Dashboard.js` | Admin | DELETE | Firestore `appointments` | Delete appointment | Button click | None |
| `saveChiefAppointmentForm` | `src/Chief/Dashboard.js` | Admin | CREATE/UPDATE | Firestore `appointments` | Validate & save form | Button click | Alert validation |
| `availableSlots` | `src/Chief/Dashboard.js` | Admin | READ | Context lookup | Get available slots | Background logic | Returns array |
| `getDeptByDoctorName` | `src/Chief/Dashboard.js` | Admin | READ | Context lookup | Get department by doctor | Background logic | Returns "Unknown" |
| `handleSaveAppointment` | `src/Chief/Appointments.js` | Admin | CREATE/UPDATE | Local state (MOCK) | Save appointment (MOCK) | Button click | None |
| `handleDeleteAppointment` | `src/Chief/Appointments.js` | Admin | DELETE | Local state (MOCK) | Delete appointment (MOCK) | Button click | None |
| `openChiefAppointmentModal` | `src/Chief/Appointments.js` | Admin | STATE | None | Open appointment modal | Button click | None |
| `handleChiefAppointmentFormChange` | `src/Chief/Appointments.js` | Admin | STATE | None | Form field change | Input change | None |
| **POSTS - CHIEF** |
| `onCreatePost` | `src/Chief/Dashboard.js` | Admin | CREATE | Firestore `posts` | Create community post | Button click | Alert success |
| `saveCommunityPost` | `src/Chief/Community.js` | Admin | CREATE | Local state (MOCK) | Save post (MOCK) | Button click | None |
| `handleAddPost` | `src/Chief/Community.js` | Admin | CREATE | Local state (MOCK) | Add post (MOCK) | Button click | None |
| `handlePostFormChange` | `src/Chief/Dashboard.js` | Admin | STATE | None | Form field change | Input change | None |
| `handlePostImageChange` | `src/Chief/Dashboard.js` | Admin | STATE | None | Image file change | File input | None |
| `handleCommunityPostFormChange` | `src/Chief/Community.js` | Admin | STATE | None | Form field change | Input change | None |
| `handleCommunityPostImageChange` | `src/Chief/Community.js` | Admin | STATE | None | Image file change | File input | None |
| `openCommunityPostModal` | `src/Chief/Community.js` | Admin | STATE | None | Open post modal | Button click | None |
| `handleLike` | `src/Chief/Community.js` | Admin | UPDATE | Local state (MOCK) | Like post (MOCK) | Button click | None |
| `handleAddComment` | `src/Chief/Community.js` | Admin | CREATE | Local state (MOCK) | Add comment (MOCK) | Button click | None |
| `handleDeleteComment` | `src/Chief/Community.js` | Admin | DELETE | Local state (MOCK) | Delete comment (MOCK) | Button click | None |
| `submitCommunityComment` | `src/Chief/Community.js` | Admin | CREATE | Local state (MOCK) | Submit comment | Button click | None |
| **NOTIFICATIONS - CHIEF** |
| `onSendNotification` | `src/Chief/Dashboard.js` | Admin | CREATE | Firestore `notifications` | Send notification | Button click | Alert success |
| `handleAction` | `src/Chief/Notifications.js` | Admin | UPDATE | Local state (MOCK) | Approve/reject notification (MOCK) | Button click | None |
| `openNotificationDetailModal` | `src/Chief/Notifications.js` | Admin | STATE | None | Open notification modal | Button click | None |
| `closeNotificationDetailModal` | `src/Chief/Notifications.js` | Admin | STATE | None | Close notification modal | Button click | None |
| `handleNotificationFormChange` | `src/Chief/Dashboard.js` | Admin | STATE | None | Form field change | Input change | None |
| **WAITLIST - CLERK** |
| `saveWaitlistForm` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE | Firestore `waitlist` | Save waitlist entry | Button click | Alert validation |
| `appDeleteDoc` (waitlist) | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | DELETE | Firestore `waitlist` | Remove waitlist entry | Button click | None |
| **TRANSFERS - CLERK** |
| `addTransfer` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE | Firestore `transfers` | Create transfer request | Button click | None |
| `setTransferStatus` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UPDATE | Firestore `transfers` | Update transfer status | Button click | None |
| `assignTransferDoctor` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UPDATE | Firestore `transfers` | Assign doctor to transfer | Button click | None |
| `saveTransferForm` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | CREATE | Firestore `transfers` | Validate & save form | Button click | Alert validation |
| `appDeleteDoc` (transfers) | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | DELETE | Firestore `transfers` | Remove transfer | Button click | None |
| **UTILITIES** |
| `genId` | `src/Clerk/context/AppContext.jsx` | All | UTILITY | None | Generate random ID | Background logic | None |
| `toISO` | `src/Clerk/context/AppContext.jsx` | All | UTILITY | None | Convert date to ISO | Background logic | None |
| `fmtDay` | `src/Chief/Dashboard.js` | Admin | UTILITY | None | Format date to ISO | Background logic | Returns undefined if invalid |
| `parseISO` | `src/Chief/Dashboard.js` | Admin | UTILITY | None | Parse ISO date string | Background logic | Returns Date object |
| `inRange` | `src/Chief/Dashboard.js` | Admin | UTILITY | None | Check date in range | Background logic | Returns boolean |
| `calculateAge` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UTILITY | None | Calculate age from DOB | Background logic | Returns "—" if invalid |
| `calcAge` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UTILITY | None | Alias for calculateAge | Background logic | Returns "—" if invalid |
| `getDeptByDoctorName` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | READ | Context lookup | Get department by doctor | Background logic | Returns "Unknown" |
| **FIRESTORE SERVICE** |
| `getCollection` | `src/services/firestoreService.js` | All | READ | Firestore (any collection) | Fetch all documents | Function call | None (async) |
| `subscribeToCollection` | `src/services/firestoreService.js` | All | READ | Firestore (any collection) | Real-time subscription | Function call | Returns unsubscribe |
| `appAddDoc` | `src/services/firestoreService.js` | All | CREATE | Firestore (any collection) | Add document | Function call | None (async) |
| `appUpdateDoc` | `src/services/firestoreService.js` | All | UPDATE | Firestore (any collection) | Update document | Function call | None (async) |
| `appDeleteDoc` | `src/services/firestoreService.js` | All | DELETE | Firestore (any collection) | Delete document | Function call | None (async) |
| **PROFILE** |
| `saveClerkProfileForm` | `src/Clerk/Dashboard/Dashboard.jsx` | Clerk | UPDATE | Local state | Save profile (password validation) | Button click | Alert validation |
| **NAVIGATION** |
| `ChiefRoutes` | `src/Chief/ChiefRoutes.jsx` | Admin | NAVIGATION | React Router | Route configuration | Route change | None |
| `ClerkRoutes` | `src/Clerk/ClerkRoutes.jsx` | Clerk | NAVIGATION | React Router | Route configuration | Route change | None |

---

## B. CRUD MATRIX BY ROLE

### ADMIN/CHIEF ROLE

#### CREATE Operations:
- ✅ **Appointments**: Create appointments (Firestore `appointments`)
- ✅ **Posts**: Create community posts (Firestore `posts`)
- ✅ **Notifications**: Send notifications (Firestore `notifications`)
- ⚠️ **Patients**: Edit only (MOCK - not connected to Firestore)
- ⚠️ **Doctors**: Edit only (MOCK - not connected to Firestore)
- ⚠️ **Nurses**: Add/Edit (MOCK - not connected to Firestore)

#### READ Operations:
- ✅ **Appointments**: Read all appointments (Firestore real-time)
- ✅ **Doctors**: Read all doctors (Firestore real-time)
- ✅ **Nurses**: Read all nurses (Firestore real-time)
- ✅ **Patients**: Read all patients (Firestore real-time)
- ✅ **Waitlist**: Read waitlist (Firestore real-time)
- ✅ **Transfers**: Read transfers (Firestore real-time)
- ✅ **Posts**: Read posts (Firestore real-time)
- ✅ **Notifications**: Read notifications (Firestore real-time)
- ✅ **Dashboard KPIs**: Calculate from all data
- ✅ **Department Statistics**: Calculate from appointments

#### UPDATE Operations:
- ✅ **Appointments**: Update appointment status/details (Firestore)
- ⚠️ **Patients**: Update patient info (MOCK - local state only)
- ⚠️ **Doctors**: Update doctor info (MOCK - local state only)
- ⚠️ **Nurses**: Update nurse info (MOCK - local state only)
- ⚠️ **Notifications**: Approve/reject (MOCK - local state only)

#### DELETE Operations:
- ✅ **Appointments**: Delete appointments (Firestore)
- ⚠️ **Patients**: Delete patients (MOCK - local state only)
- ⚠️ **Doctors**: Delete doctors (MOCK - local state only)
- ⚠️ **Nurses**: Delete nurses (MOCK - local state only)

---

### CLERK ROLE

#### CREATE Operations:
- ✅ **Patients**: Create patients (Firestore `patients`)
- ✅ **Doctors**: Create doctors (Firestore `doctors`)
- ✅ **Nurses**: Create nurses (Firestore `nurses`)
- ✅ **Appointments**: Create appointments (Firestore `appointments`)
- ✅ **Waitlist**: Add to waitlist (Firestore `waitlist`)
- ✅ **Transfers**: Create transfer requests (Firestore `transfers`)

#### READ Operations:
- ✅ **Patients**: Read all patients (Firestore real-time via AppContext)
- ✅ **Doctors**: Read all doctors (Firestore real-time via AppContext)
- ✅ **Nurses**: Read all nurses (Firestore real-time via AppContext)
- ✅ **Appointments**: Read all appointments (Firestore real-time via AppContext)
- ✅ **Waitlist**: Read waitlist (Firestore real-time)
- ✅ **Transfers**: Read transfers (Firestore real-time)
- ✅ **Available Slots**: Calculate from appointments and doctor config
- ✅ **Patient Counts**: Count patients per doctor/nurse
- ✅ **Appointment Counts**: Count appointments per doctor

#### UPDATE Operations:
- ✅ **Patients**: Update patient info (Firestore)
- ✅ **Doctors**: Update doctor info (Firestore)
- ✅ **Nurses**: Update nurse info (Firestore)
- ✅ **Appointments**: Update appointment status/details (Firestore)
- ✅ **Transfers**: Update transfer status, assign doctors (Firestore)
- ✅ **Profile**: Update clerk profile (local state only)

#### DELETE Operations:
- ✅ **Patients**: Delete patients (Firestore)
- ✅ **Doctors**: Delete doctors (Firestore, with validation)
- ✅ **Nurses**: Delete nurses (Firestore, with validation)
- ✅ **Appointments**: Delete appointments (Firestore)
- ✅ **Waitlist**: Remove waitlist entries (Firestore)
- ✅ **Transfers**: Remove transfer requests (Firestore)

---

## C. DATABASE / BACKEND ACCESS MAP

### Firestore Collections

#### `patients`
- **READ**: Admin, Clerk
- **WRITE**: Clerk only
- **UPDATE**: Clerk only
- **DELETE**: Clerk only
- **Fields**: `id`, `name`, `dob`, `status`, `gender`, `phone`, `doctorId`, `nurseId`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `doctors`
- **READ**: Admin, Clerk
- **WRITE**: Clerk only
- **UPDATE**: Clerk only
- **DELETE**: Clerk only (with validation - prevents if has patients/appointments)
- **Fields**: `id`, `name`, `specialization`, `specialty`, `department`, `city`, `phone`, `dob`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `nurses`
- **READ**: Admin, Clerk
- **WRITE**: Clerk only
- **UPDATE**: Clerk only
- **DELETE**: Clerk only (with validation - prevents if has patients)
- **Fields**: `id`, `name`, `department`, `phone`, `dob`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `appointments`
- **READ**: Admin, Clerk
- **WRITE**: Admin, Clerk
- **UPDATE**: Admin, Clerk
- **DELETE**: Admin, Clerk
- **Fields**: `id`, `patientId`, `doctorId`, `date`, `time`, `status`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)
- **Business Logic**: Double-booking prevention (client-side check in Clerk)

#### `waitlist`
- **READ**: Admin, Clerk
- **WRITE**: Clerk only
- **UPDATE**: NOT IMPLEMENTED
- **DELETE**: Clerk only
- **Fields**: `id`, `patient`, `department`, `preferredDate`, `notes`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `transfers`
- **READ**: Admin, Clerk
- **WRITE**: Clerk only
- **UPDATE**: Clerk only (status, assignedDoctorId)
- **DELETE**: Clerk only
- **Fields**: `id`, `patient`, `fromDept`, `toDept`, `reason`, `status`, `assignedDoctorId`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `posts`
- **READ**: Admin (via Dashboard subscription)
- **WRITE**: Admin only
- **UPDATE**: NOT IMPLEMENTED
- **DELETE**: NOT IMPLEMENTED
- **Fields**: `id`, `title`, `content`, `category`, `image`, `createdAt`, `likes`, `comments`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `notifications`
- **READ**: Admin (via Dashboard subscription)
- **WRITE**: Admin only
- **UPDATE**: NOT IMPLEMENTED (MOCK only in Notifications page)
- **DELETE**: NOT IMPLEMENTED
- **Fields**: `id`, `audience`, `toId`, `subject`, `message`, `priority`, `sentAt`, `status`
- **Real-time**: ✅ Yes (via `subscribeToCollection`)

#### `users` (Firebase Auth user records)
- **READ**: Firebase Auth (automatic)
- **WRITE**: Guest (registration), Admin (role assignment - NOT IMPLEMENTED)
- **UPDATE**: NOT IMPLEMENTED
- **DELETE**: NOT IMPLEMENTED
- **Fields**: `email`, `role`, `createdAt`
- **Note**: Role assignment is hardcoded in `App.js` (email-based)

---

## D. ADMIN-ONLY ACTIONS

### Currently Implemented:
1. ✅ **Create Community Posts** - Only Admin can create posts
2. ✅ **Send Notifications** - Only Admin can send system notifications
3. ✅ **View All Data** - Admin has read access to all collections
4. ✅ **Dashboard Oversight** - Admin dashboard shows comprehensive KPIs and statistics

### Should Be Admin-Only (But Currently Accessible to Clerk):
1. ⚠️ **User Role Assignment** - Currently hardcoded, should be admin-controlled
2. ⚠️ **System Configuration** - Doctor slots, department settings (currently hardcoded)
3. ⚠️ **Bulk Operations** - Mass updates, data imports/exports (NOT IMPLEMENTED)
4. ⚠️ **Audit Logs** - View system activity logs (NOT IMPLEMENTED)
5. ⚠️ **User Management** - Create/delete user accounts (NOT IMPLEMENTED)

### Missing Admin Functions:
1. ❌ **Role Management** - Assign/change user roles
2. ❌ **System Settings** - Configure doctor slots, departments, etc.
3. ❌ **Data Export** - Export reports, patient data
4. ❌ **Audit Trail** - View who did what and when
5. ❌ **Backup/Restore** - Data backup and restore capabilities
6. ❌ **Permission Management** - Fine-grained access control

---

## E. SECURITY & LOGIC ISSUES

### 🔴 CRITICAL ISSUES

1. **No Server-Side Validation**
   - All validation is client-side only
   - Firestore Security Rules are NOT visible in codebase
   - **Risk**: Unauthorized access if rules are misconfigured

2. **Hardcoded Role Assignment**
   - Role is determined by email in `App.js`:
     ```javascript
     if (currentUser?.email === 'chief@example.com') setRole('admin');
     else setRole('clerk');
     ```
   - **Risk**: Anyone with email `chief@example.com` becomes admin
   - **Fix Needed**: Role should come from Firestore `users` collection

3. **Direct Firestore Access from UI**
   - All CRUD operations happen directly from React components
   - No API layer or middleware
   - **Risk**: If security rules fail, full database access from client

4. **Double-Booking Prevention is Client-Side Only**
   - `willClash` function checks local state
   - Race conditions possible with concurrent bookings
   - **Risk**: Two users can book same slot simultaneously
   - **Fix Needed**: Use Firestore Transactions

5. **No Authentication Checks in Components**
   - Components don't verify user role before rendering
   - Routes are protected only by conditional rendering in `App.js`
   - **Risk**: If routing logic fails, unauthorized access possible

### 🟡 MEDIUM ISSUES

6. **Mock Data in Chief Components**
   - `Chief/Appointments.js`, `Chief/Users/*.js`, `Chief/Community.js`, `Chief/Notifications.js` use local state
   - Changes are NOT persisted to Firestore
   - **Impact**: Admin cannot actually manage data through these pages

7. **Missing Error Boundaries**
   - No React Error Boundaries implemented
   - **Risk**: One component error crashes entire app

8. **No Input Sanitization**
   - User inputs are not sanitized before saving
   - **Risk**: XSS attacks, data corruption

9. **Password Change Not Implemented**
   - `saveClerkProfileForm` validates password but doesn't actually change it
   - **Impact**: Password change feature is non-functional

10. **Phone Validation Inconsistency**
    - Some forms validate phone (9-12 digits), others don't
    - **Impact**: Data inconsistency

### 🟢 MINOR ISSUES

11. **No Loading States**
    - Some async operations don't show loading indicators
    - **Impact**: Poor UX

12. **Alert-Based Error Handling**
    - Most errors shown via `alert()` popups
    - **Impact**: Poor UX, not accessible

13. **No Confirmation for Critical Actions**
    - Some delete operations don't require confirmation
    - **Impact**: Accidental deletions possible

14. **Inconsistent Naming**
    - Some fields use `specialization`, others use `specialty`
    - Code handles both but creates confusion
    - **Impact**: Data inconsistency risk

15. **No Pagination**
    - All data loaded at once
    - **Impact**: Performance issues with large datasets

### 🔵 MISSING FEATURES

16. **No Soft Delete**
    - All deletes are permanent
    - **Impact**: No recovery option

17. **No Activity Logging**
    - No audit trail of who did what
    - **Impact**: Cannot track changes or troubleshoot issues

18. **No Data Validation on Firestore Side**
    - All validation is client-side
    - **Impact**: Malicious users can bypass validation

19. **No Rate Limiting**
    - No protection against spam/abuse
    - **Impact**: System abuse possible

20. **No Offline Support**
    - No service worker or offline caching
    - **Impact**: App unusable without internet

---

## SUMMARY STATISTICS

- **Total Functions Analyzed**: 150+
- **Firestore Collections**: 8
- **User Roles**: 2 (Admin, Clerk)
- **CRUD Operations**: 24 unique operations
- **Critical Security Issues**: 5
- **Medium Issues**: 5
- **Minor Issues**: 5
- **Missing Features**: 5

---

## RECOMMENDATIONS

### Immediate Actions:
1. Implement Firestore Security Rules
2. Move role assignment to Firestore `users` collection
3. Add server-side validation
4. Implement Firestore Transactions for appointment booking
5. Connect Chief components to Firestore (remove mock data)

### Short-term:
6. Add Error Boundaries
7. Implement proper error handling (not alerts)
8. Add input sanitization
9. Implement password change functionality
10. Add confirmation dialogs for critical actions

### Long-term:
11. Add audit logging
12. Implement soft deletes
13. Add pagination
14. Implement offline support
15. Add role-based permission system

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Complete Analysis



