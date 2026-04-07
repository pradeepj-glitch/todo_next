"use client";

import React, { useEffect, useState } from "react";
import { useAuth, THEME_COLORS } from "@/context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Todo {
  id: number;
  userId: number;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedByName: string;
  message: string;
  createdAt: string;
}

export default function AdminTasksPage() {
  const { themeColor, darkMode } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");

  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const fetchAllTodos = async () => {
    try {
      const res = await fetch("/api/todos?all=true");
      if (res.ok) {
        const data = await res.json();
        setAllTodos(data);
      }
    } catch (error) {
      console.error("Failed to fetch all todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchAllTodos();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, users]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !title || !dueDate) return;

    setAssigning(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          title,
          description,
          priority,
          dueDate,
          message,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setMessage("");
        setSelectedUser(null);
        setSearchQuery("");
        fetchAllTodos();
        setToast({
          type: "success",
          text: "Task assigned successfully",
        });
      }
    } catch (error) {
      console.error("Failed to assign task:", error);
    } finally {
      setAssigning(false);
    }
  };

  // Group todos by user for progress tracking
  const userProgress = users
    .map((u) => {
      const userTodos = allTodos.filter((t) => t.userId === u.id);
      const completed = userTodos.filter((t) => t.completed).length;
      const total = userTodos.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...u, completed, total, pct, tasks: userTodos };
    })
    .filter((u) => u.total > 0);

  return (
    <>
      <style jsx>{`
        .admin-tasks {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .admin-tasks {
            grid-template-columns: 1fr;
          }
        }

        .assignment-panel {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 24px;
          padding: 1.5rem;
          position: sticky;
          top: 2rem;
        }
        .panel-title {
          font-family: "Syne", sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          color: ${colors.text};
        }

        .form-group {
          margin-bottom: 1.25rem;
        }
        .label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: ${colors.textMuted};
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input,
        .textarea,
        .select {
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 12px;
          padding: 10px 14px;
          background: ${colors.bg}50;
          color: ${colors.text};
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: ${colors.accent};
          background: ${colors.surface};
        }

        .search-wrap {
          position: relative;
        }
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          margin-top: 4px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
        }
        .search-item {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid ${colors.border};
          transition: background 0.2s;
        }
        .search-item:hover {
          background: ${colors.bg};
        }
        .search-item:last-child {
          border-bottom: none;
        }
        .selected-badge {
          background: ${colors.accent}15;
          color: ${colors.accent};
          border: 1px solid ${colors.accent}30;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .assign-btn {
          width: 100%;
          background: ${colors.accent};
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px ${colors.accent}40;
          margin-top: 0.5rem;
        }
        .assign-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${colors.accent}60;
        }
        .assign-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Progress Side */
        .progress-side {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .user-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 24px;
          padding: 1.5rem;
        }
        .user-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .user-name {
          font-weight: 700;
          font-family: "Syne", sans-serif;
          font-size: 1.1rem;
        }
        .progress-bar-wrap {
          height: 8px;
          background: ${colors.bg};
          border-radius: 999px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-bar {
          height: 100%;
          background: ${colors.accent};
          transition: width 0.6s ease;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 1rem;
        }
        .task-item {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid ${colors.border};
          background: ${colors.bg}30;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .task-item.done {
          opacity: 0.6;
          background: transparent;
        }
        .task-title {
          font-size: 0.88rem;
          font-weight: 500;
        }
        .task-meta {
          font-size: 0.72rem;
          color: ${colors.textMuted};
          display: flex;
          gap: 10px;
        }

        .empty-state {
          padding: 4rem;
          text-align: center;
          color: ${colors.textMuted};
          background: ${colors.surface};
          border-radius: 24px;
          border: 1px dashed ${colors.border};
        }

        /* ── Toast Notification ── */
        .pp-toast {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          padding: 0.875rem 1.25rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          z-index: 9999;
          animation:
            slideInRight 0.3s ease,
            fadeOut 0.3s ease 1.7s forwards;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          max-width: 360px;
        }

        .pp-toast.success {
          background: ${isDark ? "#052e16" : "#f0fdf4"};
          border: 1px solid ${isDark ? "#14532d" : "#bbf7d0"};
          color: ${isDark ? "#4ade80" : "#16a34a"};
        }

        .pp-toast.error {
          background: ${isDark ? "#2d0a0a" : "#fef2f2"};
          border: 1px solid ${isDark ? "#7f1d1d" : "#fecaca"};
          color: ${isDark ? "#f87171" : "#dc2626"};
        }
      `}</style>

      <div className="admin-tasks">
        {/* Left: Assignment Panel */}
        <section className="assignment-panel">
          <h2 className="panel-title">Assign New Task</h2>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label className="label">Search User</label>
              <div className="search-wrap">
                <input
                  className="input"
                  placeholder="Type name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!!selectedUser}
                />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="search-item"
                        onClick={() => {
                          setSelectedUser(u);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: colors.textMuted,
                          }}
                        >
                          {u.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="selected-badge">
                  <span>👤 {selectedUser.name}</span>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: colors.accent,
                      fontWeight: "bold",
                    }}
                    onClick={() => setSelectedUser(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Task Title</label>
              <input
                className="input"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Add details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div
              className="form-group"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label className="label">Priority</label>
                <select
                  className="select"
                  value={priority}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  className="input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Timeline Message / Note</label>
              <input
                className="input"
                placeholder="Message for the user..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              className="assign-btn"
              type="submit"
              disabled={assigning || !selectedUser}
            >
              {assigning ? "Assigning..." : "Assign Task"}
            </button>
          </form>
        </section>

        {/* Right: Progress Tracking Side */}
        <section className="progress-side">
          <h2 className="panel-title" style={{ marginBottom: "0.5rem" }}>
            User Progress Tracking
          </h2>
          {loading ? (
            <div className="empty-state">Loading tracking data...</div>
          ) : userProgress.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📈</div>
              No tasks assigned to users yet.
            </div>
          ) : (
            userProgress.map((u) => (
              <div key={u.id} className="user-card">
                <div className="user-header">
                  <div className="user-name">{u.name}</div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: colors.accent,
                    }}
                  >
                    {u.pct}% Complete
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar"
                    style={{ width: `${u.pct}%` }}
                  />
                </div>
                <div style={{ fontSize: "0.78rem", color: colors.textMuted }}>
                  {u.completed} of {u.total} tasks completed
                </div>

                <div className="task-list">
                  {u.tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`task-item ${t.completed ? "done" : ""}`}
                    >
                      <div>
                        <div className="task-title">
                          {t.completed && "✓ "}
                          {t.title}
                        </div>
                        <div className="task-meta">
                          <span>
                            📅 {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                          <span
                            style={{
                              color:
                                t.priority === "high"
                                  ? "#ef4444"
                                  : t.priority === "medium"
                                    ? "#f59e0b"
                                    : "#22c55e",
                              fontWeight: 600,
                            }}
                          >
                            {t.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontStyle: "italic",
                          color: colors.textMuted,
                        }}
                      >
                        {t.completed ? "Completed" : "Pending"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className={`pp-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "!"}</span>
          {toast.text}
        </div>
      )}
    </>
  );
}
