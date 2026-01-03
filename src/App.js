import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { subscribeToAuthState, subscribeToMockAuthState, getActiveRole } from './services/authService';
import Login from './components/Login';
import ChiefRoutes from './Chief/ChiefRoutes';
import ClerkRoutes from './Clerk/ClerkRoutes';
import { AppProvider } from './Clerk/context/AppContext';
import './App.css';

// تفعيل Mock Mode للتجربة بدون Firebase (غيّر إلى false لاستخدام Firebase الحقيقي)
const USE_MOCK_AUTH = true;

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // اختيار نظام المصادقة (Mock أو Firebase)
    const authSubscription = USE_MOCK_AUTH 
      ? subscribeToMockAuthState 
      : subscribeToAuthState;

    // الاستماع لتغيرات حالة المستخدم
    const unsubscribe = authSubscription((authUser) => {
      if (authUser) {
        setUser(authUser);
        setRole(getActiveRole(authUser));
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    // تنظيف الاشتراك عند إغلاق المكون
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '20px' }}>جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // التوجيه حسب الدور
  return (
    <AppProvider>
      <Router>
        {(role === 'admin' || role === 'chief') && <ChiefRoutes user={user} />}
        {role === 'clerk' && <ClerkRoutes user={user} />}
        {role !== 'admin' && role !== 'chief' && role !== 'clerk' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>دور غير معروف</h2>
            <p>الرجاء التواصل مع المسؤول</p>
          </div>
        )}
      </Router>
    </AppProvider>
  );
}

export default App;