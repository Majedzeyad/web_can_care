import React, { useState } from 'react';
import { signIn, mockLogin } from '../services/authService';
import './Login.css';

// تفعيل Mock Mode (يجب أن يكون نفس القيمة في App.js)
const USE_MOCK_AUTH = true;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (USE_MOCK_AUTH) {
        // استخدام Mock Login
        await mockLogin('admin'); // يمكن تغيير الافتراضي
      } else {
        // استخدام Firebase Login
        await signIn(email, password);
      }
      // التوجيه سيتم تلقائياً عبر App.js
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول المباشر لكل role (بدون تسجيل دخول فعلي)
  const handleRoleLogin = async (role) => {
    setError('');
    setLoading(true);
    
    try {
      if (USE_MOCK_AUTH) {
        // استخدام Mock Login - دخول مباشر بدون Firebase
        await mockLogin(role);
      } else {
        // استخدام Firebase Login (إذا تم تعطيل Mock Mode)
        const roleCredentials = {
          admin: { email: 'admin@cancare.com', password: 'admin123' },
          chief: { email: 'chief@cancare.com', password: 'chief123' },
          clerk: { email: 'clerk@cancare.com', password: 'clerk123' }
        };
        const creds = roleCredentials[role];
        if (creds) {
          await signIn(creds.email, creds.password);
        }
      }
      // التوجيه سيتم تلقائياً عبر App.js
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        {/* CURVED BACKGROUND */}
        <div className="curved-shape"></div>

        {/* INFO CONTENT */}
        <div className="info-content Login show">
          <h2>مرحباً بعودتك!</h2>
          <p>نحن سعداء لوجودك معنا مرة أخرى.</p>
        </div>

        {/* LOGIN FORM */}
        <div className="form-box Login show">
          <h2>تسجيل الدخول</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
              <label>البريد الإلكتروني</label>
            </div>
            <div className="input-box">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <label>كلمة المرور</label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="input-box">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </div>
          </form>

          {/* Role Selection Buttons */}
          <div className="role-buttons-container">
            <p className="role-buttons-title">الدخول السريع:</p>
            <div className="role-buttons">
              <button 
                type="button"
                onClick={() => handleRoleLogin('admin')}
                className="role-btn role-btn-admin"
                disabled={loading}
              >
                <span className="role-icon">👑</span>
                <span>Admin</span>
              </button>
              <button 
                type="button"
                onClick={() => handleRoleLogin('chief')}
                className="role-btn role-btn-chief"
                disabled={loading}
              >
                <span className="role-icon">🎖️</span>
                <span>Chief</span>
              </button>
              <button 
                type="button"
                onClick={() => handleRoleLogin('clerk')}
                className="role-btn role-btn-clerk"
                disabled={loading}
              >
                <span className="role-icon">📋</span>
                <span>Clerk</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;