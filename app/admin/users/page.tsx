"use client";

import React, { useEffect, useState } from "react";
import { useAuth, THEME_COLORS } from "@/context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isDeleted: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { user: authUser, themeColor, darkMode } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'admin'|'user' } : u));
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to soft delete this user? They will be unable to log in.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: ${colors.text}; }
        .page-subtitle { font-size: 0.88rem; color: ${colors.textMuted}; margin-top: 4px; }

        .table-wrap {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,${isDark ? '0.2' : '0.04'});
        }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 16px 20px; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted}; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 16px 20px; border-bottom: 1px solid ${colors.border}; color: ${colors.text}; font-size: 0.9rem; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: ${colors.bg}50; }

        .user-info { display: flex; flex-direction: column; gap: 2px; }
        .user-name { font-weight: 600; }
        .user-email { font-size: 0.78rem; color: ${colors.textMuted}; }

        .role-badge { 
          padding: 4px 10px; 
          border-radius: 999px; 
          font-size: 0.75rem; 
          font-weight: 600;
          text-transform: capitalize;
        }
        .role-admin { background: ${colors.accent}20; color: ${colors.accent}; border: 1px solid ${colors.accent}40; }
        .role-user { background: ${colors.textMuted}20; color: ${colors.textMuted}; border: 1px solid ${colors.textMuted}40; }

        .actions { display: flex; gap: 8px; }
        .action-btn { 
          padding: 6px 12px; 
          border-radius: 8px; 
          border: 1px solid ${colors.border}; 
          background: transparent; 
          color: ${colors.text}; 
          font-size: 0.8rem; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .action-btn:hover { border-color: ${colors.accent}; color: ${colors.accent}; background: ${colors.accent}10; }
        .action-delete { color: #ef4444; border-color: rgba(239,68,68,0.2); }
        .action-delete:hover { border-color: #ef4444; color: white; background: #ef4444; }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty { padding: 3rem; text-align: center; color: ${colors.textMuted}; }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">View and manage all registered users.</p>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{u.name} {u.id === authUser?.id && "(You)"}</span>
                      <span className="user-email">{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {u.id !== authUser?.id && (
                        <>
                          <button 
                            className="action-btn"
                            disabled={actionLoading === u.id}
                            onClick={() => handleToggleRole(u.id, u.role)}
                          >
                            Set {u.role === 'admin' ? 'User' : 'Admin'}
                          </button>
                          <button 
                            className="action-btn action-delete"
                            disabled={actionLoading === u.id}
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
