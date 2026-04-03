"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, THEME_COLORS, ThemeColor } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, themeColor, setThemeColor, darkMode, toggleDarkMode, updateUser } = useAuth();
  const router = useRouter();
  const initialized = useRef(false);

  const isDark = darkMode;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'appearance'>('profile');

  useEffect(() => {
    if (!initialized.current && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name);
      setEmail(user.email);
      initialized.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: isDark ? '#080c14' : '#f0f2f8' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: isDark ? '#4a5568' : '#a0aec0', fontSize: '1rem', letterSpacing: '0.1em' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const theme = THEME_COLORS[themeColor];

  const navItems = [
    { id: 'profile', label: 'Profile', icon: '◈' },
    { id: 'security', label: 'Security', icon: '◎' },
    { id: 'appearance', label: 'Appearance', icon: '◐' },
  ] as const;

  // Derived dark/light tokens
  const bg = isDark ? '#080c14' : '#f0f2f8';
  const sidebar = isDark ? '#0d1220' : '#ffffff';
  const panel = isDark ? '#111827' : '#ffffff';
  const panelBorder = isDark ? '#1f2a3d' : '#e8ecf4';
  const text = isDark ? '#e2e8f0' : '#1a202c';
  const muted = isDark ? '#4a5878' : '#8a94a8';
  const subtle = isDark ? '#1a2235' : '#f5f7fc';
  const inputBorder = isDark ? '#1f2a3d' : '#dde2ef';
  const inputBg = isDark ? '#0d1220' : '#f8f9fd';
  const inputText = isDark ? '#c8d4e8' : '#2d3748';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: ${bg};
          color: ${text};
          transition: background 0.4s ease, color 0.4s ease;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Layout Shell ── */
        .pp-shell {
          display: grid;
          grid-template-columns: 260px 1fr;
          grid-template-rows: 100vh;
          min-height: 100vh;
          background: ${bg};
          transition: background 0.4s;
        }

        /* ── Sidebar ── */
        .pp-sidebar {
          background: ${sidebar};
          border-right: 1px solid ${panelBorder};
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: background 0.4s, border-color 0.4s;
        }

        .pp-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: ${isDark
            ? `radial-gradient(ellipse 120% 60% at 50% 0%, ${theme.primary}14 0%, transparent 70%)`
            : `radial-gradient(ellipse 120% 60% at 50% 0%, ${theme.primary}0a 0%, transparent 70%)`
          };
          pointer-events: none;
        }

        .pp-sidebar-top {
          padding: 2.5rem 2rem 2rem;
          border-bottom: 1px solid ${panelBorder};
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pp-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: ${text};
          letter-spacing: -0.01em;
        }

        .pp-brand-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${theme.primary};
          flex-shrink: 0;
          box-shadow: 0 0 10px ${theme.primary}80;
        }

        /* Avatar block */
        .pp-avatar-block {
          padding: 2rem 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid ${panelBorder};
        }

        .pp-avatar-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          padding: 3px;
          background: ${theme.gradient};
          position: relative;
        }

        .pp-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${isDark ? '#0d1220' : '#fff'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          color: ${theme.primary};
        }

        .pp-avatar-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: ${text};
          letter-spacing: -0.01em;
          text-align: center;
        }

        .pp-avatar-email {
          font-size: 0.8rem;
          color: ${muted};
          font-family: 'DM Mono', monospace;
          text-align: center;
          letter-spacing: 0.01em;
        }

        /* Nav */
        .pp-nav {
          padding: 1.25rem 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .pp-nav-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${muted};
          padding: 0 0.75rem;
          margin-bottom: 0.5rem;
        }

        .pp-nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          background: none;
          text-align: left;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.925rem;
          font-weight: 500;
          color: ${muted};
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .pp-nav-item:hover {
          background: ${subtle};
          color: ${text};
        }

        .pp-nav-item.active {
          background: ${isDark ? `${theme.primary}18` : `${theme.primary}10`};
          border-color: ${isDark ? `${theme.primary}30` : `${theme.primary}20`};
          color: ${theme.primary};
        }

        .pp-nav-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .pp-nav-pip {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: ${theme.primary};
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pp-nav-item.active .pp-nav-pip {
          opacity: 1;
        }

        /* Sidebar bottom */
        .pp-sidebar-footer {
          padding: 1rem 1.25rem 1.5rem;
          border-top: 1px solid ${panelBorder};
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pp-back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.875rem;
          border-radius: 10px;
          border: none;
          background: none;
          color: ${muted};
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .pp-back-btn:hover {
          background: ${subtle};
          color: ${text};
        }

        .pp-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.875rem;
          border-radius: 10px;
          border: none;
          background: none;
          color: #f87171;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .pp-logout-btn:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* ── Main Panel ── */
        .pp-main {
          overflow-y: auto;
          background: ${bg};
          display: flex;
          flex-direction: column;
          transition: background 0.4s;
        }

        /* Top bar */
        .pp-topbar {
          padding: 1.75rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${panelBorder};
          background: ${isDark ? 'rgba(8,12,20,0.8)' : 'rgba(240,242,248,0.8)'};
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
          transition: background 0.4s, border-color 0.4s;
        }

        .pp-topbar-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: ${text};
          letter-spacing: -0.02em;
        }

        .pp-topbar-sub {
          font-size: 0.85rem;
          color: ${muted};
          margin-top: 0.15rem;
        }

        /* Dark toggle in topbar */
        .pp-dark-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.875rem;
          background: ${panel};
          border: 1px solid ${panelBorder};
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-dark-toggle:hover {
          border-color: ${theme.primary}50;
        }

        .pp-dark-toggle-label {
          font-size: 0.825rem;
          font-weight: 500;
          color: ${muted};
        }

        .pp-toggle-track {
          width: 38px;
          height: 22px;
          border-radius: 11px;
          background: ${isDark ? theme.primary : '#cbd5e1'};
          position: relative;
          transition: background 0.3s;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .pp-toggle-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 3px;
          left: ${isDark ? '19px' : '3px'};
          transition: left 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        /* Content area */
        .pp-content {
          padding: 2.5rem 3rem;
          flex: 1;
          max-width: 680px;
        }

        /* Section card */
        .pp-card {
          background: ${panel};
          border: 1px solid ${panelBorder};
          border-radius: 20px;
          overflow: hidden;
          transition: background 0.4s, border-color 0.4s;
        }

        .pp-card-header {
          padding: 1.75rem 2rem 1.25rem;
          border-bottom: 1px solid ${panelBorder};
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .pp-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: ${text};
          letter-spacing: -0.01em;
        }

        .pp-card-desc {
          font-size: 0.85rem;
          color: ${muted};
          margin-top: 0.2rem;
          line-height: 1.5;
        }

        .pp-card-body {
          padding: 1.75rem 2rem;
        }

        /* Form */
        .pp-field {
          margin-bottom: 1.25rem;
        }

        .pp-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${muted};
          margin-bottom: 0.5rem;
        }

        .pp-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: ${inputBg};
          border: 1.5px solid ${inputBorder};
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: ${inputText};
          outline: none;
          transition: all 0.2s;
        }

        .pp-input:focus {
          border-color: ${theme.primary};
          box-shadow: 0 0 0 3px ${theme.primary}1a;
          background: ${isDark ? '#0d1220' : '#fff'};
        }

        .pp-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pp-input-hint {
          margin-top: 0.4rem;
          font-size: 0.78rem;
          color: ${muted};
        }

        /* Message */
        .pp-message {
          padding: 0.875rem 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .pp-message.success {
          background: ${isDark ? '#052e16' : '#f0fdf4'};
          border: 1px solid ${isDark ? '#14532d' : '#bbf7d0'};
          color: ${isDark ? '#4ade80' : '#16a34a'};
        }

        .pp-message.error {
          background: ${isDark ? '#2d0a0a' : '#fef2f2'};
          border: 1px solid ${isDark ? '#7f1d1d' : '#fecaca'};
          color: ${isDark ? '#f87171' : '#dc2626'};
        }

        /* Buttons */
        .pp-btn-primary {
          padding: 0.875rem 2rem;
          background: ${theme.gradient};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.925rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px ${theme.primary}30;
          letter-spacing: 0.01em;
        }

        .pp-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px ${theme.primary}40;
        }

        .pp-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pp-btn-ghost {
          padding: 0.75rem 1.25rem;
          background: none;
          border: 1.5px solid ${inputBorder};
          border-radius: 10px;
          color: ${muted};
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-btn-ghost:hover {
          border-color: ${theme.primary}60;
          color: ${theme.primary};
          background: ${isDark ? `${theme.primary}10` : `${theme.primary}08`};
        }

        .pp-btn-link {
          background: none;
          border: none;
          color: ${theme.primary};
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
        }

        .pp-btn-link:hover { opacity: 0.75; }

        /* Row layout helpers */
        .pp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .pp-spacer { flex: 1; }

        /* Theme colors */
        .pp-colors {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 0.25rem;
        }

        .pp-color-swatch {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .pp-color-swatch:hover { transform: scale(1.12); }

        .pp-color-swatch.active {
          border-color: ${isDark ? '#fff' : '#1a202c'};
          box-shadow: 0 0 0 1px ${isDark ? '#fff4' : '#0002'}, 0 4px 12px rgba(0,0,0,0.15);
        }

        .pp-color-check {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pp-color-swatch.active .pp-color-check { opacity: 1; }

        /* Appearance big cards */
        .pp-appearance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
          margin-top: 0.25rem;
        }

        .pp-mode-card {
          padding: 1.25rem;
          border-radius: 14px;
          border: 2px solid ${inputBorder};
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: ${inputBg};
        }

        .pp-mode-card:hover { border-color: ${theme.primary}50; }

        .pp-mode-card.active {
          border-color: ${theme.primary};
          background: ${isDark ? `${theme.primary}10` : `${theme.primary}08`};
        }

        .pp-mode-preview {
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          gap: 3px;
          padding: 6px;
        }

        .pp-mode-preview.light { background: #f0f2f8; }
        .pp-mode-preview.dark  { background: #080c14; }

        .pp-mode-preview-bar {
          flex: 1;
          border-radius: 4px;
          background: currentColor;
          opacity: 0.15;
        }

        .pp-mode-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${text};
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pp-mode-check {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${theme.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.55rem;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pp-mode-card.active .pp-mode-check { opacity: 1; }

        /* Divider */
        .pp-divider {
          height: 1px;
          background: ${panelBorder};
          margin: 1.5rem 0;
        }

        /* Security section toggle */
        .pp-password-toggle {
          padding: 1rem;
          border-radius: 12px;
          border: 1.5px dashed ${isDark ? '#1f2a3d' : '#dde2ef'};
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
          color: ${muted};
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
        }

        .pp-password-toggle:hover {
          border-color: ${theme.primary}60;
          color: ${theme.primary};
          background: ${isDark ? `${theme.primary}08` : `${theme.primary}05`};
        }

        .pp-password-toggle-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: ${isDark ? '#1a2235' : '#f0f2f8'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
          transition: background 0.2s;
        }

        /* Modal */
        .pp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .pp-modal {
          background: ${panel};
          border: 1px solid ${panelBorder};
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.3);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }

        .pp-modal-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .pp-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: ${text};
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }

        .pp-modal-body {
          font-size: 0.9rem;
          color: ${muted};
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }

        .pp-modal-actions {
          display: flex;
          gap: 0.75rem;
        }

        .pp-modal-actions > * { flex: 1; }

        .pp-btn-cancel {
          padding: 0.875rem 1rem;
          background: ${subtle};
          border: 1px solid ${inputBorder};
          border-radius: 12px;
          color: ${muted};
          font-size: 0.9rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-btn-cancel:hover { background: ${isDark ? '#1f2a3d' : '#e8ecf4'}; }

        .pp-btn-danger {
          padding: 0.875rem 1rem;
          background: #dc2626;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(220,38,38,0.3);
        }

        .pp-btn-danger:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220,38,38,0.4);
        }

        /* Mobile */
        @media (max-width: 768px) {
          .pp-shell {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .pp-sidebar {
            flex-direction: row;
            border-right: none;
            border-bottom: 1px solid ${panelBorder};
            overflow-x: auto;
            padding: 0;
          }

          .pp-sidebar::before { display: none; }
          .pp-sidebar-top { display: none; }
          .pp-avatar-block { display: none; }
          .pp-sidebar-footer { display: none; }

          .pp-nav {
            flex-direction: row;
            padding: 0.5rem;
            gap: 0.25rem;
            overflow-x: auto;
          }

          .pp-nav-label { display: none; }

          .pp-nav-item {
            flex-shrink: 0;
            padding: 0.6rem 1rem;
            white-space: nowrap;
          }

          .pp-topbar { padding: 1rem 1.25rem; }
          .pp-content { padding: 1.25rem; }
          .pp-card-body { padding: 1.25rem; }
          .pp-card-header { padding: 1.25rem; }
          .pp-appearance-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pp-shell">
        
        {/* ── Sidebar ── */}
        <aside className="pp-sidebar">
           <button className="pp-back-btn" onClick={() => router.push('/')}>
              ← Back to Todos
            </button>
          <div className="pp-sidebar-top">
            <div className="pp-brand-dot" />
            <span className="pp-brand">My Account</span>
          </div>

          <div className="pp-avatar-block">
            <div className="pp-avatar-ring">
              <div className="pp-avatar-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="pp-avatar-name">{user.name}</div>
              <div className="pp-avatar-email">{user.email}</div>
            </div>
          </div>

          <nav className="pp-nav">
            <div className="pp-nav-label">Settings</div>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`pp-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="pp-nav-icon">{item.icon}</span>
                {item.label}
                <span className="pp-nav-pip" />
              </button>
            ))}
          </nav>

          <div className="pp-sidebar-footer">
           
            <button className="pp-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
              ↑ Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="pp-main">
          {/* Top bar */}
          <div className="pp-topbar">
            <div>
              <div className="pp-topbar-title">
                {activeSection === 'profile' ? 'Your Profile' : activeSection === 'security' ? 'Security' : 'Appearance'}
              </div>
              <div className="pp-topbar-sub">
                {activeSection === 'profile' ? 'Manage your personal details' : activeSection === 'security' ? 'Update your password' : 'Customize how the app looks'}
              </div>
            </div>

       
          </div>

          {/* Content */}
          <div className="pp-content">

            {/* ── PROFILE SECTION ── */}
            {activeSection === 'profile' && (
              <div className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <div className="pp-card-title">Personal Information</div>
                    <div className="pp-card-desc">Update your display name and account details.</div>
                  </div>
                </div>
                <div className="pp-card-body">
                  {message && (
                    <div className={`pp-message ${message.type}`}>
                      <span>{message.type === 'success' ? '✓' : '!'}</span>
                      {message.text}
                    </div>
                  )}
                  <form onSubmit={handleSave}>
                    <div className="pp-field">
                      <label className="pp-label">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="pp-input"
                        placeholder="Your display name"
                      />
                    </div>

                    <div className="pp-field">
                      <label className="pp-label">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="pp-input"
                      />
                      <div className="pp-input-hint">Email address cannot be changed.</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="submit" className="pp-btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── SECURITY SECTION ── */}
            {activeSection === 'security' && (
              <div className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <div className="pp-card-title">Password</div>
                    <div className="pp-card-desc">Choose a strong password to protect your account.</div>
                  </div>
                </div>
                <div className="pp-card-body">
                  {message && (
                    <div className={`pp-message ${message.type}`}>
                      <span>{message.type === 'success' ? '✓' : '!'}</span>
                      {message.text}
                    </div>
                  )}

                  {!showPasswordSection ? (
                    <button
                      type="button"
                      className="pp-password-toggle"
                      onClick={() => setShowPasswordSection(true)}
                    >
                      <div className="pp-password-toggle-icon">🔑</div>
                      <div>
                        <div style={{ color: isDark ? '#c8d4e8' : '#2d3748', fontWeight: 600, fontSize: '0.9rem' }}>Change Password</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>Click to update your password</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>→</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSave}>
                      <div className="pp-field">
                        <label className="pp-label">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="pp-input"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="pp-field">
                        <label className="pp-label">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="pp-input"
                          placeholder="At least 6 characters"
                        />
                      </div>

                      <div className="pp-field">
                        <label className="pp-label">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="pp-input"
                          placeholder="Repeat new password"
                        />
                      </div>

                      <div className="pp-row" style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="pp-btn-ghost"
                          onClick={() => {
                            setShowPasswordSection(false);
                            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="pp-btn-primary" disabled={saving}>
                          {saving ? 'Saving…' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ── APPEARANCE SECTION ── */}
            {activeSection === 'appearance' && (
              <>
                <div className="pp-card" style={{ marginBottom: '1rem' }}>
                  <div className="pp-card-header">
                    <div>
                      <div className="pp-card-title">Interface Mode</div>
                      <div className="pp-card-desc">Switch between light and dark themes.</div>
                    </div>
                  </div>
                  <div className="pp-card-body">
                    <div className="pp-appearance-grid">
                      {/* Light */}
                      <div
                        className={`pp-mode-card ${!isDark ? 'active' : ''}`}
                        onClick={() => isDark && toggleDarkMode()}
                      >
                        <div className="pp-mode-preview light">
                          <div className="pp-mode-preview-bar" style={{ color: '#1a202c' }} />
                          <div className="pp-mode-preview-bar" style={{ color: '#1a202c', opacity: 0.08 }} />
                          <div className="pp-mode-preview-bar" style={{ color: '#1a202c', opacity: 0.08 }} />
                        </div>
                        <div className="pp-mode-label">
                          ☀️ Light
                          <div className="pp-mode-check">✓</div>
                        </div>
                      </div>
                      {/* Dark */}
                      <div
                        className={`pp-mode-card ${isDark ? 'active' : ''}`}
                        onClick={() => !isDark && toggleDarkMode()}
                      >
                        <div className="pp-mode-preview dark">
                          <div className="pp-mode-preview-bar" style={{ color: '#e2e8f0' }} />
                          <div className="pp-mode-preview-bar" style={{ color: '#e2e8f0', opacity: 0.08 }} />
                          <div className="pp-mode-preview-bar" style={{ color: '#e2e8f0', opacity: 0.08 }} />
                        </div>
                        <div className="pp-mode-label">
                          🌙 Dark
                          <div className="pp-mode-check">✓</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pp-card">
                  <div className="pp-card-header">
                    <div>
                      <div className="pp-card-title">Accent Color</div>
                      <div className="pp-card-desc">Choose the color used for buttons and highlights.</div>
                    </div>
                  </div>
                  <div className="pp-card-body">
                    <div className="pp-colors">
                      {(Object.keys(THEME_COLORS) as ThemeColor[]).map(color => (
                        <button
                          key={color}
                          className={`pp-color-swatch ${themeColor === color ? 'active' : ''}`}
                          style={{ background: THEME_COLORS[color].primary }}
                          onClick={() => setThemeColor(color)}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                        >
                          <span className="pp-color-check">✓</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* ── Logout Modal ── */}
      {showLogoutConfirm && (
        <div className="pp-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-icon">👋</div>
            <div className="pp-modal-title">Log out?</div>
            <div className="pp-modal-body">
              You&apos;ll be redirected to the login page. Any unsaved changes will be lost.
            </div>
            <div className="pp-modal-actions">
              <button className="pp-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Stay
              </button>
              <button className="pp-btn-danger" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}