"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, THEME_COLORS, ThemeColor } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, themeColor, setThemeColor, darkMode, toggleDarkMode, updateUser } = useAuth();
  const router = useRouter();
  const initialized = useRef(false);
  
  // Dark mode colors
  const isDark = darkMode;
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : 'white';
  const textColor = isDark ? '#e2e8f0' : '#1e2937';
  const borderColor = isDark ? '#334155' : '#f1f5f9';
  const inputBg = isDark ? '#334155' : '#f8fafc';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const headingColor = isDark ? '#f1f5f9' : '#0f172a';
  const formLabelColor = isDark ? '#94a3b8' : '#334155';
  const disabledBg = isDark ? '#1e293b' : '#f1f5f9';
  const disabledColor = isDark ? '#64748b' : '#94a3b8';

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Initialize form data from user
  useEffect(() => {
    if (!initialized.current && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name);
      setEmail(user.email);
      initialized.current = true;
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    // Validation
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setSaving(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const theme = THEME_COLORS[themeColor];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', system_ui, sans-serif;
          background: ${bgColor};
          color: ${textColor};
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
        }

        .profile-page {
          min-height: 100vh;
          padding: 2rem 10%;
          background: ${bgColor};
          transition: background 0.3s;
        }

        .profile-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .profile-back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 10px 20px;
          background: ${cardBg};
          border: 1px solid ${borderColor};
          border-radius: 12px;
          color: ${mutedColor};
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-back-btn:hover {
          background: ${borderColor};
          color: ${textColor};
        }

        .profile-card {
          background: ${cardBg};
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, ${isDark ? '0.2' : '0.07'});
          border: 1px solid ${borderColor};
          transition: background 0.3s;
        }

        .profile-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: ${headingColor};
          margin-bottom: 0.5rem;
          transition: color 0.3s;
        }

        .profile-subtitle {
          color: ${mutedColor};
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: ${theme.gradient};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1.25rem;
          box-shadow: ${theme.boxShadow};
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: ${formLabelColor};
          margin-bottom: 0.5rem;
          transition: color 0.3s;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid ${borderColor};
          border-radius: 12px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          background: ${inputBg};
          color: ${textColor};
        }

        .form-input:focus {
          border-color: ${theme.primary};
          box-shadow: 0 0 0 4px ${theme.primary}20;
        }

        .form-input:disabled {
          background: ${disabledBg};
          color: ${disabledColor};
        }

        .form-message {
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .form-message.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        .form-message.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .btn-primary {
          width: 100%;
          padding: 14px;
          background: ${theme.gradient};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: ${theme.boxShadow};
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px ${theme.primary}40;
        }

        .btn-primary:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-secondary {
          padding: 12px 24px;
          background: ${inputBg};
          color: ${mutedColor};
          border: 1px solid ${borderColor};
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: ${borderColor};
          color: ${textColor};
        }

        .btn-danger {
          padding: 12px 24px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #fee2e2;
        }

        .toggle-link {
          background: none;
          border: none;
          color: ${theme.primary};
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .toggle-link:hover {
          text-decoration: underline;
        }

        .theme-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid ${borderColor};
        }

        .theme-title {
          font-size: 1rem;
          font-weight: 600;
          color: ${textColor};
          margin-bottom: 1rem;
          transition: color 0.3s;
        }

        .theme-colors {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .theme-color-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-color-btn:hover {
          transform: scale(1.1);
        }

        .theme-color-btn.active {
          border-color: ${headingColor};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .logout-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid ${borderColor};
          display: flex;
          justify-content: flex-end;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: ${cardBg};
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: ${headingColor};
          margin-bottom: 0.5rem;
          transition: color 0.3s;
        }

        .modal-text {
          color: ${mutedColor};
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions button {
          flex: 1;
        }

        .profile-loading {
          text-align: center;
          padding: 4rem;
          color: ${mutedColor};
          font-size: 1.1rem;
        }

        @media (max-width: 640px) {
          .profile-page {
            padding: 1rem;
          }

          .profile-card {
            padding: 1.5rem;
            border-radius: 20px;
          }

          .profile-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .profile-back-btn {
            justify-content: center;
          }

          .profile-title {
            font-size: 1.5rem;
          }

          .theme-colors {
            gap: 8px;
          }

          .theme-color-btn {
            width: 40px;
            height: 40px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <button 
              className="profile-back-btn"
              onClick={() => router.push('/')}
            >
              ← Back to Todos
            </button>
            {/* Dark Mode Toggle - moved to top */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 16px',
              background: cardBg,
              borderRadius: '14px',
              border: `1px solid ${borderColor}`
            }}>
              <span style={{ fontSize: '1.2rem' }}>{darkMode ? '🌙' : '☀️'}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: textColor }}>
                {darkMode ? 'Dark' : 'Light'}
              </span>
              <button
                onClick={toggleDarkMode}
                style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  background: darkMode ? theme.primary : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
                title="Toggle dark mode"
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: darkMode ? '27px' : '3px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>

          <div className="profile-card">
            <div style={{ textAlign: 'center' }}>
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="profile-title">{user.name}</h1>
            </div>

            {message && (
              <div className={`form-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              {showPasswordSection && (
                <>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="form-input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                {!showPasswordSection ? (
                  <button
                    type="button"
                    className="toggle-link"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    type="button"
                    className="toggle-link"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Cancel Password Change
                  </button>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Appearance Section - Theme Color Only (Dark mode toggle is at top) */}
            <div className="theme-section">
              <h3 className="theme-title">Accent Color</h3>
              <div className="theme-colors">
                {(Object.keys(THEME_COLORS) as ThemeColor[]).map((color) => (
                  <button
                    key={color}
                    className={`theme-color-btn ${themeColor === color ? 'active' : ''}`}
                    style={{ background: THEME_COLORS[color].primary }}
                    onClick={() => setThemeColor(color)}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            </div>

            {/* Logout Section */}
            <div className="logout-section">
              <button className="btn-danger" onClick={() => setShowLogoutConfirm(true)}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Logout?</h2>
            <p className="modal-text">Are you sure you want to logout? You will be redirected to the login page.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}