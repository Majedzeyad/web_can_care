/**
 * Authentication Service
 * 
 * يدعم نظامين للمصادقة:
 * 1. Firebase Authentication (الحقيقي)
 * 2. Mock Authentication (للتنمية والتجربة بدون Firebase)
 * 
 * لتغيير الوضع، غيّر قيمة USE_MOCK_AUTH في:
 * - src/App.js
 * - src/components/Login.jsx  
 * - src/services/authService.js (في دالة signOut)
 * 
 * USE_MOCK_AUTH = true  -> Mock Mode (لا يحتاج Firebase)
 * USE_MOCK_AUTH = false -> Firebase Mode (يحتاج Firebase Config)
 */

import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * تسجيل الدخول
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // جلب بيانات المستخدم من Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('بيانات المستخدم غير موجودة');
    }
    
    const userData = userDoc.data();
    
    // تحديث آخر دخول
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      lastLoginPlatform: 'web'
    });
    
    return {
      uid: user.uid,
      email: user.email,
      ...userData
    };
  } catch (error) {
    console.error('Error signing in:', error);
    
    // رسائل خطأ واضحة بالعربي
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('البريد الإلكتروني غير مسجل');
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        throw new Error('كلمة المرور غير صحيحة');
      case 'auth/invalid-email':
        throw new Error('صيغة البريد الإلكتروني غير صحيحة');
      case 'auth/user-disabled':
        throw new Error('هذا الحساب معطل');
      default:
        throw new Error('حدث خطأ في تسجيل الدخول');
    }
  }
};

/**
 * تسجيل الخروج
 */
export const signOut = async () => {
  try {
    // تفعيل Mock Mode (يجب أن يكون نفس القيمة في App.js)
    const USE_MOCK_AUTH = true;
    
    if (USE_MOCK_AUTH) {
      await mockSignOut();
    } else {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * الحصول على المستخدم الحالي
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * الاستماع لتغيرات حالة المستخدم
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        callback({
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * التحقق من وجود دور معين
 */
export const hasRole = (user, role) => {
  return user?.roles?.includes(role) || false;
};

/**
 * الحصول على الدور النشط
 */
export const getActiveRole = (user) => {
  if (!user || !user.roles || user.roles.length === 0) return null;
  
  // استخدام activeRole إذا كان موجود
  if (user.activeRole && user.roles.includes(user.activeRole)) {
    return user.activeRole;
  }
  
  // الترتيب الافتراضي للأدوار
  const rolePriority = ['admin', 'chief', 'clerk', 'doctor', 'nurse', 'patient'];
  
  for (const role of rolePriority) {
    if (user.roles.includes(role)) {
      return role;
    }
  }
  
  return user.roles[0];
};

// ==================== MOCK AUTHENTICATION (للتنمية والتجربة) ====================

// Mock users data
const mockUsers = {
  admin: {
    uid: 'mock-admin-001',
    email: 'admin@cancare.com',
    name: 'Admin User',
    roles: ['admin'],
    activeRole: 'admin',
    createdAt: new Date().toISOString()
  },
  chief: {
    uid: 'mock-chief-001',
    email: 'chief@cancare.com',
    name: 'Chief User',
    roles: ['chief'],
    activeRole: 'chief',
    createdAt: new Date().toISOString()
  },
  clerk: {
    uid: 'mock-clerk-001',
    email: 'clerk@cancare.com',
    name: 'Clerk User',
    roles: ['clerk'],
    activeRole: 'clerk',
    createdAt: new Date().toISOString()
  }
};

// Mock auth state listener
let mockAuthCallback = null;
let mockCurrentUser = null;

/**
 * تسجيل الدخول الوهمي (Mock Login) - للتجربة بدون Firebase
 */
export const mockLogin = async (role) => {
  const user = mockUsers[role];
  if (!user) {
    throw new Error(`Role ${role} غير موجود`);
  }
  
  // تخزين المستخدم الحالي
  mockCurrentUser = user;
  
  // استدعاء callback إذا كان موجود
  if (mockAuthCallback) {
    mockAuthCallback(user);
  }
  
  return user;
};

/**
 * تسجيل الخروج الوهمي (Mock Logout)
 */
export const mockSignOut = async () => {
  mockCurrentUser = null;
  if (mockAuthCallback) {
    mockAuthCallback(null);
  }
};

/**
 * الاشتراك في حالة المصادقة الوهمية
 */
export const subscribeToMockAuthState = (callback) => {
  mockAuthCallback = callback;
  
  // استدعاء فوري إذا كان هناك مستخدم حالي
  if (mockCurrentUser) {
    callback(mockCurrentUser);
  } else {
    callback(null);
  }
  
  // إرجاع دالة إلغاء الاشتراك
  return () => {
    mockAuthCallback = null;
  };
};

/**
 * الحصول على المستخدم الوهمي الحالي
 */
export const getMockCurrentUser = () => {
  return mockCurrentUser;
};
