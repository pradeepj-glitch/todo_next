"use client";

import React, { useEffect } from "react";
import { useAuth, THEME_COLORS } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, themeColor, darkMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  const theme = THEME_COLORS[themeColor];
  const isDark = darkMode;

  const colors = {
    bg: isDark ? "#070b12" : "#f4f6fb",
    surface: isDark ? "#0d1420" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    text: isDark ? "#e8edf5" : "#111827",
    textMuted: isDark ? "#5a6a82" : "#8a94a6",
    accent: theme.primary || "#6366f1",
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: colors.bg,
        color: colors.text
      }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  const navItems = [
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Tasks", path: "/admin/tasks", icon: "📋" },
    { name: "Dashboard", path: "/", icon: "🏠" },
  ];

  return (
    <>
      <style jsx>{`
        .admin-wrap {
          display: flex;
          min-height: 100vh;
          background: ${colors.bg};
          color: ${colors.text};
          font-family: 'DM Sans', sans-serif;
        }

        .sidebar {
          width: 260px;
          background: ${colors.surface};
          border-right: 1px solid ${colors.border};
          display: flex;
          flex-direction: column;
          padding: 2rem 1.25rem;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .admin-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.25rem;
          margin-bottom: 2.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${colors.accent};
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          text-decoration: none;
          color: ${colors.textMuted};
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: ${colors.bg};
          color: ${colors.text};
        }

        .nav-item.active {
          background: ${colors.accent}15;
          color: ${colors.accent};
        }

        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .admin-wrap { flex-direction: column; }
          .sidebar { 
            width: 100%; 
            height: auto; 
            position: relative; 
            padding: 1rem;
            border-bottom: 1px solid ${colors.border};
          }
          .admin-brand { margin-bottom: 1rem; }
          .nav-list { flex-direction: row; flex-wrap: wrap; }
          .nav-item { padding: 8px 12px; font-size: 0.85rem; }
        }
      `}</style>

      <div className="admin-wrap">
        <aside className="sidebar">
          <div className="admin-brand">
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            Admin Panel
          </div>
          <nav className="nav-list">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', padding: '10px', fontSize: '0.8rem', color: colors.textMuted }}>
            Logged in as <strong>{user.name}</strong>
          </div>
        </aside>

        <main className="content-area">
          {children}
        </main>
      </div>
    </>
  );
}
