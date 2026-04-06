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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: isDark ? '#4a5568' : '#a0aec0', fontSize: '1rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const theme = THEME_COLORS[themeColor];

  const navItems = [
    { id: 'profile',    label: 'Profile',    icon: '◈', desc: 'Name & details' },
    { id: 'security',   label: 'Security',   icon: '◎', desc: 'Password' },
    { id: 'appearance', label: 'Appearance', icon: '◐', desc: 'Theme & color' },
  ] as const;

  const bg           = isDark ? '#080c14'   : '#f0f2f8';
  const sidebar      = isDark ? '#0d1220'   : '#ffffff';
  const panel        = isDark ? '#111827'   : '#ffffff';
  const panelBorder  = isDark ? '#1f2a3d'   : '#e8ecf4';
  const text         = isDark ? '#e2e8f0'   : '#1a202c';
  const muted        = isDark ? '#4a5878'   : '#8a94a8';
  const subtle       = isDark ? '#1a2235'   : '#f5f7fc';
  const inputBorder  = isDark ? '#1f2a3d'   : '#dde2ef';
  const inputBg      = isDark ? '#0d1220'   : '#f8f9fd';
  const inputText    = isDark ? '#c8d4e8'   : '#2d3748';

  const sectionTitles = {
    profile:    { title: 'Your Profile',   sub: 'Manage your personal details' },
    security:   { title: 'Security',       sub: 'Update your password' },
    appearance: { title: 'Appearance',     sub: 'Customize how the app looks' },
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          width: 100%;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: ${bg};
          color: ${text};
          transition: background 0.4s ease, color 0.4s ease;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ───────────────────────────────────────
           SHELL — desktop: sidebar + main side by side
        ─────────────────────────────────────── */
        .pp-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: ${bg};
        }

        /* ── Sidebar ── */
        .pp-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: ${sidebar};
          border-right: 1px solid ${panelBorder};
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          transition: background 0.4s, border-color 0.4s;
          z-index: 20;
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
          padding: 2rem 1.5rem 1.5rem;
          border-bottom: 1px solid ${panelBorder};
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .pp-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
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

        /* Avatar */
        .pp-avatar-block {
          padding: 1.5rem 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.625rem;
          border-bottom: 1px solid ${panelBorder};
        }

        .pp-avatar-ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          padding: 2.5px;
          background: ${theme.gradient};
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
          font-size: 1.4rem;
          color: ${theme.primary};
        }

        .pp-avatar-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: ${text};
          letter-spacing: -0.01em;
          text-align: center;
        }

        .pp-avatar-email {
          font-size: 0.75rem;
          color: ${muted};
          font-family: 'DM Mono', monospace;
          text-align: center;
          letter-spacing: 0.01em;
          word-break: break-all;
        }

        /* Nav */
        .pp-nav {
          padding: 1rem 0.75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .pp-nav-section-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${muted};
          padding: 0 0.75rem;
          margin-bottom: 0.4rem;
        }

        .pp-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.875rem;
          border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          background: none;
          text-align: left;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: ${muted};
          transition: all 0.2s ease;
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
          font-size: 0.95rem;
          width: 18px;
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
          flex-shrink: 0;
        }

        .pp-nav-item.active .pp-nav-pip { opacity: 1; }

        /* Sidebar footer */
        .pp-sidebar-footer {
          padding: 0.875rem 1rem 1.5rem;
          border-top: 1px solid ${panelBorder};
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .pp-back-btn, .pp-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.875rem;
          border-radius: 10px;
          border: none;
          background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .pp-back-btn { color: ${muted}; }
        .pp-back-btn:hover { background: ${subtle}; color: ${text}; }

        .pp-logout-btn { color: #f87171; }
        .pp-logout-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

        /* ── MOBILE TOP NAV BAR ── */
        .pp-mobile-topnav {
          display: none;
          position: sticky;
          top: 0;
          z-index: 30;
          background: ${sidebar};
          border-bottom: 1px solid ${panelBorder};
          backdrop-filter: blur(12px);
        }

        /* Row 1: hamburger + actions */
        .pp-mobile-topnav-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          gap: 0.5rem;
        }

        .pp-mobile-topnav-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pp-mobile-topnav-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .pp-mobile-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pp-hamburger {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid ${panelBorder};
          background: ${subtle};
          color: ${text};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .pp-hamburger:hover { border-color: ${theme.primary}60; }

        /* Row 2: Tab bar */
        .pp-mobile-tabs {
          display: flex;
          gap: 4px;
          padding: 0 0.75rem 0.75rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .pp-mobile-tabs::-webkit-scrollbar { display: none; }

        .pp-mobile-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          border-radius: 9px;
          border: 1px solid transparent;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: ${muted};
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pp-mobile-tab.active {
          background: ${isDark ? `${theme.primary}18` : `${theme.primary}10`};
          border-color: ${isDark ? `${theme.primary}30` : `${theme.primary}25`};
          color: ${theme.primary};
        }

        .pp-mobile-tab-icon {
          font-size: 0.85rem;
        }

        /* ── Mobile drawer overlay ── */
        .pp-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 40;
          animation: fadeIn 0.2s ease;
        }

        .pp-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background: ${sidebar};
          border-right: 1px solid ${panelBorder};
          z-index: 50;
          display: flex;
          flex-direction: column;
          animation: slideRight 0.25s ease;
          overflow-y: auto;
        }

        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .pp-drawer-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid ${panelBorder};
          background: ${subtle};
          color: ${muted};
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-drawer-close:hover { color: ${text}; }

        /* ── Main panel ── */
        .pp-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: ${bg};
          overflow-y: auto;
          transition: background 0.4s;
        }

        /* Desktop topbar (hidden on mobile) */
        .pp-topbar {
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-bottom: 1px solid ${panelBorder};
          background: ${isDark ? 'rgba(8,12,20,0.9)' : 'rgba(240,242,248,0.9)'};
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
          transition: background 0.4s, border-color 0.4s;
        }

        .pp-topbar-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: ${text};
          letter-spacing: -0.02em;
        }

        .pp-topbar-sub {
          font-size: 0.78rem;
          color: ${muted};
          margin-top: 0.15rem;
        }

        .pp-topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .pp-topbar-back {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          border-radius: 9px;
          border: 1px solid ${panelBorder};
          background: ${subtle};
          color: ${muted};
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pp-topbar-back:hover {
          background: ${isDark ? '#1f2a3d' : '#e8ecf4'};
          color: ${text};
          border-color: ${panelBorder};
        }

        .pp-topbar-logout {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          border-radius: 9px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.07);
          color: #ef4444;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pp-topbar-logout:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.4);
        }

        /* Content */
        .pp-content {
          padding: 2rem 2.5rem;
          flex: 1;
          max-width: 680px;
          width: 100%;
        }

        /* ── Cards ── */
        .pp-card {
          background: ${panel};
          border: 1px solid ${panelBorder};
          border-radius: 20px;
          overflow: hidden;
          transition: background 0.4s, border-color 0.4s;
          margin-bottom: 1rem;
        }

        .pp-card:last-child { margin-bottom: 0; }

        .pp-card-header {
          padding: 1.5rem 1.75rem 1.25rem;
          border-bottom: 1px solid ${panelBorder};
        }

        .pp-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: ${text};
          letter-spacing: -0.01em;
        }

        .pp-card-desc {
          font-size: 0.82rem;
          color: ${muted};
          margin-top: 0.2rem;
          line-height: 1.5;
        }

        .pp-card-body {
          padding: 1.5rem 1.75rem;
        }

        /* ── Fields ── */
        .pp-field { margin-bottom: 1.1rem; }

        .pp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${muted};
          margin-bottom: 0.45rem;
        }

        .pp-input {
          width: 100%;
          padding: 0.825rem 1rem;
          background: ${inputBg};
          border: 1.5px solid ${inputBorder};
          border-radius: 12px;
          font-size: 0.925rem;
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

        .pp-input:disabled { opacity: 0.45; cursor: not-allowed; }

        .pp-input-hint { margin-top: 0.35rem; font-size: 0.75rem; color: ${muted}; }

        /* ── Message ── */
        .pp-message {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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

        /* ── Buttons ── */
        .pp-btn-primary {
          padding: 0.825rem 1.75rem;
          background: ${theme.gradient};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
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

        .pp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

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

        .pp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* ── Theme colors ── */
        .pp-colors {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 0.25rem;
        }

        .pp-color-swatch {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .pp-color-swatch:hover { transform: scale(1.1); }

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
          font-size: 0.75rem;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pp-color-swatch.active .pp-color-check { opacity: 1; }

        /* ── Appearance mode cards ── */
        .pp-appearance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
          margin-top: 0.25rem;
        }

        .pp-mode-card {
          padding: 1.1rem;
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
          height: 44px;
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
          border-radius: 3px;
          background: currentColor;
          opacity: 0.15;
        }

        .pp-mode-label {
          font-size: 0.84rem;
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
          font-size: 0.5rem;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }

        .pp-mode-card.active .pp-mode-check { opacity: 1; }

        /* ── Password toggle ── */
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
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .pp-password-toggle:hover {
          border-color: ${theme.primary}60;
          color: ${theme.primary};
          background: ${isDark ? `${theme.primary}08` : `${theme.primary}05`};
        }

        .pp-password-toggle-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: ${isDark ? '#1a2235' : '#f0f2f8'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        /* ── Modal ── */
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

        .pp-modal {
          background: ${panel};
          border: 1px solid ${panelBorder};
          border-radius: 24px;
          padding: 2rem;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.3);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }

        .pp-modal-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(239,68,68,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .pp-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: ${text};
          margin-bottom: 0.4rem;
        }

        .pp-modal-body {
          font-size: 0.875rem;
          color: ${muted};
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .pp-modal-actions { display: flex; gap: 0.75rem; }
        .pp-modal-actions > * { flex: 1; }

        .pp-btn-cancel {
          padding: 0.825rem 1rem;
          background: ${subtle};
          border: 1px solid ${inputBorder};
          border-radius: 12px;
          color: ${muted};
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-btn-cancel:hover { background: ${isDark ? '#1f2a3d' : '#e8ecf4'}; }

        .pp-btn-danger {
          padding: 0.825rem 1rem;
          background: #dc2626;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(220,38,38,0.3);
        }

        .pp-btn-danger:hover { background: #b91c1c; transform: translateY(-1px); }

        /* ──────────────────────────────────────
           RESPONSIVE
        ────────────────────────────────────── */

        /* Tablet: shrink sidebar */
        @media (max-width: 900px) and (min-width: 769px) {
          .pp-sidebar { width: 220px; }
          .pp-content { padding: 1.5rem 2rem; }
          .pp-topbar  { padding: 1.25rem 2rem; }
        }

        /* Mobile: hide sidebar, show mobile nav */
        @media (max-width: 768px) {
          .pp-sidebar       { display: none; }
          .pp-mobile-topnav { display: block; }

          .pp-topbar { display: none; }

          .pp-content {
            padding: 1.25rem 1rem;
            max-width: 100%;
          }

          .pp-card-header { padding: 1.25rem; }
          .pp-card-body   { padding: 1.25rem; }

          .pp-appearance-grid { grid-template-columns: 1fr 1fr; }

          .pp-row { flex-direction: row; justify-content: space-between; }
        }

        @media (max-width: 420px) {
          .pp-content { padding: 1rem 0.875rem; }
          .pp-appearance-grid { grid-template-columns: 1fr 1fr; }
          .pp-btn-primary { padding: 0.75rem 1.25rem; font-size: 0.875rem; }
        }
      `}</style>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="pp-drawer-overlay" onClick={() => setMobileSidebarOpen(false)}>
          <div className="pp-drawer" onClick={e => e.stopPropagation()}>
            <button className="pp-drawer-close" onClick={() => setMobileSidebarOpen(false)}>✕</button>

            <div className="pp-sidebar-top" style={{ paddingTop: '3rem' }}>
              <div className="pp-brand-dot" />
              <span className="pp-brand">My Account</span>
            </div>

            <div className="pp-avatar-block">
              <div className="pp-avatar-ring">
                <div className="pp-avatar-inner">{user.name.charAt(0).toUpperCase()}</div>
              </div>
              <div className="pp-avatar-name">{user.name}</div>
              <div className="pp-avatar-email">{user.email}</div>
            </div>

            <nav className="pp-nav">
              <div className="pp-nav-section-label">Settings</div>
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`pp-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                >
                  <span className="pp-nav-icon">{item.icon}</span>
                  {item.label}
                  <span className="pp-nav-pip" />
                </button>
              ))}
            </nav>

            <div className="pp-sidebar-footer">
              <button className="pp-back-btn" onClick={() => router.push('/')}>← Back to Todos</button>
              <button className="pp-logout-btn" onClick={() => { setMobileSidebarOpen(false); setShowLogoutConfirm(true); }}>↑ Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className="pp-shell">

        {/* ── Desktop Sidebar ── */}
        <aside className="pp-sidebar">
          <div className="pp-sidebar-top">
            <div className="pp-brand-dot" />
            <span className="pp-brand">My Account</span>
          </div>

          <div className="pp-avatar-block">
            <div className="pp-avatar-ring">
              <div className="pp-avatar-inner">{user.name.charAt(0).toUpperCase()}</div>
            </div>
            <div className="pp-avatar-name">{user.name}</div>
            <div className="pp-avatar-email">{user.email}</div>
          </div>

          <nav className="pp-nav">
            <div className="pp-nav-section-label">Settings</div>
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
            <button className="pp-back-btn" onClick={() => router.push('/')}>← Back to Todos</button>
            <button className="pp-logout-btn" onClick={() => setShowLogoutConfirm(true)}>↑ Logout</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="pp-main">

          {/* Mobile top nav */}
          <div className="pp-mobile-topnav">
            <div className="pp-mobile-topnav-row1">
              <div className="pp-mobile-topnav-left">
                <button className="pp-hamburger" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
                  ☰
                </button>
                <div className="pp-mobile-brand">
                  <div className="pp-brand-dot" />
                  <span className="pp-brand">My Account</span>
                </div>
              </div>
              <div className="pp-mobile-topnav-right">
                <button className="pp-topbar-back" onClick={() => router.push('/')}>dashboard</button>
                <button className="pp-topbar-logout" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
              </div>
            </div>
            <div className="pp-mobile-tabs">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`pp-mobile-tab ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="pp-mobile-tab-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop topbar */}
          <div className="pp-topbar">
            <div>
              <div className="pp-topbar-title">{sectionTitles[activeSection].title}</div>
              <div className="pp-topbar-sub">{sectionTitles[activeSection].sub}</div>
            </div>
            <div className="pp-topbar-actions">
              <button className="pp-topbar-back" onClick={() => router.push('/')}>← Back to Todos</button>
              <button className="pp-topbar-logout" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
            </div>
          </div>

          {/* Content */}
          <div className="pp-content">

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <div className="pp-card">
                <div className="pp-card-header">
                  <div className="pp-card-title">Personal Information</div>
                  <div className="pp-card-desc">Update your display name and account details.</div>
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
                      <input type="email" value={email} disabled className="pp-input" />
                      <div className="pp-input-hint">Email address cannot be changed.</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <button type="submit" className="pp-btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeSection === 'security' && (
              <div className="pp-card">
                <div className="pp-card-header">
                  <div className="pp-card-title">Password</div>
                  <div className="pp-card-desc">Choose a strong password to protect your account.</div>
                </div>
                <div className="pp-card-body">
                  {message && (
                    <div className={`pp-message ${message.type}`}>
                      <span>{message.type === 'success' ? '✓' : '!'}</span>
                      {message.text}
                    </div>
                  )}
                  {!showPasswordSection ? (
                    <button type="button" className="pp-password-toggle" onClick={() => setShowPasswordSection(true)}>
                      <div className="pp-password-toggle-icon">🔑</div>
                      <div>
                        <div style={{ color: isDark ? '#c8d4e8' : '#2d3748', fontWeight: 600, fontSize: '0.875rem' }}>Change Password</div>
                        <div style={{ fontSize: '0.78rem', marginTop: '0.1rem' }}>Click to update your password</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>→</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSave}>
                      <div className="pp-field">
                        <label className="pp-label">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="pp-input" placeholder="Enter current password" />
                      </div>
                      <div className="pp-field">
                        <label className="pp-label">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pp-input" placeholder="At least 6 characters" />
                      </div>
                      <div className="pp-field">
                        <label className="pp-label">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pp-input" placeholder="Repeat new password" />
                      </div>
                      <div className="pp-row" style={{ marginTop: '0.25rem' }}>
                        <button type="button" className="pp-btn-ghost" onClick={() => { setShowPasswordSection(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
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

            {/* ── APPEARANCE ── */}
            {activeSection === 'appearance' && (
              <>
                <div className="pp-card">
                  <div className="pp-card-header">
                    <div className="pp-card-title">Interface Mode</div>
                    <div className="pp-card-desc">Switch between light and dark themes.</div>
                  </div>
                  <div className="pp-card-body">
                    <div className="pp-appearance-grid">
                      <div className={`pp-mode-card ${!isDark ? 'active' : ''}`} onClick={() => isDark && toggleDarkMode()}>
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
                      <div className={`pp-mode-card ${isDark ? 'active' : ''}`} onClick={() => !isDark && toggleDarkMode()}>
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
                    <div className="pp-card-title">Accent Color</div>
                    <div className="pp-card-desc">Choose the color used for buttons and highlights.</div>
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

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="pp-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-icon">👋</div>
            <div className="pp-modal-title">Log out?</div>
            <div className="pp-modal-body">
              You&apos;ll be redirected to the login page. Any unsaved changes will be lost.
            </div>
            <div className="pp-modal-actions">
              <button className="pp-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Stay</button>
              <button className="pp-btn-danger" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}