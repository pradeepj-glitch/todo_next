"use client";

import React, { useEffect, useState } from "react";
import { Todo, Priority } from "@/lib/types";
import { PRIORITY_CONFIG, getThemeColors } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

interface UserWithProgress {
  id: number;
  name: string;
  email: string;
  completed: number;
  total: number;
  pct: number;
  tasks: Todo[];
}

export default function AdminOverview() {
  const { user: authUser, darkMode } = useAuth();
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  // Assign Task Form States
  const [assignSearch, setAssignSearch] = useState("");
  const [assignUser, setAssignUser] = useState<{id: number, name: string} | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignPriority, setAssignPriority] = useState<Priority>("medium");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMessage, setAssignMessage] = useState("");
  const [assigning, setAssigning] = useState(false);
    const [toast, setToast] = useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);
  
  const colors = getThemeColors(darkMode);
   const isDark = darkMode;

  const fetchData = async () => {
    try {
      const [usersRes, todosRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/todos?all=true")
      ]);
      
      if (usersRes.ok && todosRes.ok) {
        const userData = await usersRes.json();
        const allTodos = await todosRes.json();
        
        const processedUsers = userData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((u: any) => u.id !== authUser?.id) // Filter out the current admin
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((u: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userTodos = allTodos.filter((t: any) => t.userId === u.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const completed = userTodos.filter((t: any) => t.completed).length;
            const total = userTodos.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { ...u, completed, total, pct, tasks: userTodos };
          });
        
        setUsers(processedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;

    try {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTodo)
      });

      if (res.ok) {
        setEditingTodo(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser || !assignTitle || !assignDueDate) return;

    setAssigning(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignUser.id,
          title: assignTitle,
          description: assignDesc,
          priority: assignPriority,
          dueDate: assignDueDate,
          message: assignMessage
        })
      });

      if (res.ok) {
        setAssignTitle("");
        setAssignDesc("");
        setAssignPriority("medium");
        setAssignDueDate("");
        setAssignMessage("");
        setAssignUser(null);
        setAssignSearch("");
        fetchData();
         setToast({
          type: "success",
          text: "Task assigned successfully",
        });
             setTimeout(() => setToast(null), 2000);
      }
    } catch (error) {
      console.error("Failed to assign task:", error);
    } finally {
      setAssigning(false);
    }
  };

  const matchingUsers = assignSearch.length >= 2 
    ? users.filter(u => u.name.toLowerCase().includes(assignSearch.toLowerCase()) || u.email.toLowerCase().includes(assignSearch.toLowerCase()))
    : [];

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>Loading Overview...</div>;

  return (
    <div className="admin-overview">
      <style jsx>{`
        .admin-overview { display: flex; flex-direction: column; gap: 1.5rem; }
        .dashboard-grid { display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }

        .form-card { background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 24px; padding: 1.5rem; position: sticky; top: 1.5rem; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem; color: ${colors.heading}; }
        
        .form-group { margin-bottom: 1rem; }
        .label { display: block; font-size: 0.72rem; font-weight: 700; color: ${colors.textMuted}; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .input, .textarea, .select { 
          width: 100%; padding: 10px 14px; border: 1px solid ${colors.border}; border-radius: 12px; 
          background: ${colors.bg}50; color: ${colors.text}; outline: none; transition: all 0.2s; font-size: 0.88rem;
        }
        .input:focus { border-color: ${colors.accent}; background: ${colors.surface}; }
        
        .search-results { 
          position: absolute; background: ${colors.surface}; border: 1px solid ${colors.border}; 
          border-radius: 12px; margin-top: 4px; width: 100%; z-index: 10; box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
          max-height: 200px; overflow-y: auto;
        }
        .search-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid ${colors.border}; }
        .search-item:hover { background: ${colors.bg}; }
        
        .assign-btn { 
          width: 100%; background: ${colors.accent}; color: white; border: none; border-radius: 12px; 
          padding: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;
        }
        .assign-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px ${colors.accent}44; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .stat-card { background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 20px; padding: 1.25rem; }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 700; color: ${colors.accent}; }
        .stat-lab { font-size: 0.75rem; color: ${colors.textMuted}; text-transform: uppercase; font-weight: 600; }

        .user-list { background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 24px; overflow: hidden; }
        .list-header { 
          display: grid; grid-template-columns: 2fr 2fr 1fr; padding: 1rem 1.5rem; 
          background: ${colors.bg}50; border-bottom: 1px solid ${colors.border};
          font-size: 0.7rem; font-weight: 700; color: ${colors.textMuted}; text-transform: uppercase;
        }
        .user-row { 
          display: grid; grid-template-columns: 2fr 2fr 1fr; padding: 1.25rem 1.5rem; 
          border-bottom: 1px solid ${colors.border}; cursor: pointer; transition: background 0.2s;
        }
        .user-row:hover { background: ${colors.bg}30; }
        .user-row.expanded { background: ${colors.accent}05; border-bottom: none; }
        
        .progress-cell { display: flex; align-items: center; gap: 12px; }
        .bar-bg { flex: 1; height: 6px; background: ${colors.bg}; border-radius: 99px; overflow: hidden; }
        .bar-fg { height: 100%; background: ${colors.accent}; transition: width 0.6s ease; }

        .details-area { background: ${colors.accent}05; padding: 0 1.5rem 1.5rem; border-bottom: 1px solid ${colors.border}; }
        .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .task-card { 
          background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 16px; padding: 1rem; 
          display: flex; flex-direction: column; gap: 8px; position: relative;
        }
        .edit-badge { 
          position: absolute; top: 12px; right: 12px; font-size: 0.65rem; 
          background: ${colors.accent}15; color: ${colors.accent}; padding: 4px 8px; 
          border-radius: 6px; cursor: pointer; font-weight: 700;
        }

        .edit-form { 
          background: ${colors.surface}; border: 1px solid ${colors.accent}30; border-radius: 20px; 
          padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 90%; max-width: 450px; z-index: 1000; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; backdrop-filter: blur(2px); }


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

      <div className="dashboard-grid">
        {/* Left Col: Assignment */}
        <div className="form-card">
          <h3 className="card-title">Assign New Task</h3>
          <form onSubmit={handleAssign}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="label">Search User</label>
              <input 
                className="input" 
                placeholder="Name or email..." 
                value={assignSearch} 
                onChange={e => setAssignSearch(e.target.value)}
                disabled={!!assignUser}
              />
              {matchingUsers.length > 0 && !assignUser && (
                <div className="search-results">
                  {matchingUsers.map(u => (
                    <div key={u.id} className="search-item" onClick={() => setAssignUser({id: u.id, name: u.name})}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}
              {assignUser && (
                <div style={{ marginTop: '8px', padding: '6px 12px', background: colors.accent+'15', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: colors.accent, border: '1px solid '+colors.accent+'33' }}>
                  <strong>👤 {assignUser.name}</strong>
                  <span style={{ cursor: 'pointer', fontWeight: 900 }} onClick={() => { setAssignUser(null); setAssignSearch(""); }}>✕</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" placeholder="Task title..." value={assignTitle} onChange={e => setAssignTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" rows={2} placeholder="Details..." value={assignDesc} onChange={e => setAssignDesc(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="label">Priority</label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <select className="select" value={assignPriority} onChange={e => setAssignPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input" type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Message / Timeline Note</label>
              <input className="input" placeholder="Note for the user..." value={assignMessage} onChange={e => setAssignMessage(e.target.value)} />
            </div>

            <button className="assign-btn" type="submit" disabled={assigning || !assignUser}>
              {assigning ? "Assigning..." : "Assign Task"}
            </button>
          </form>
        </div>

        {/* Right Col: Stats & User List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-val">{users.length}</div>
              <div className="stat-lab">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{users.reduce((acc, curr) => acc + curr.total, 0)}</div>
              <div className="stat-lab">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">
                {users.length > 0 ? Math.round(users.reduce((acc, curr) => acc + curr.pct, 0) / users.length) : 0}%
              </div>
              <div className="stat-lab">Avg Progress</div>
            </div>
          </div>

          <div className="user-list">
            <div className="list-header">
              <div>User</div>
              <div>Progress</div>
              <div>Status</div>
            </div>
            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted, fontSize: '0.9rem' }}>No users found.</div>
            ) : users.map(u => (
              <React.Fragment key={u.id}>
                <div 
                  className={`user-row ${expandedUserId === u.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{u.email}</div>
                  </div>
                  <div className="progress-cell">
                    <div className="bar-bg"><div className="bar-fg" style={{ width: `${u.pct}%` }} /></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '32px' }}>{u.pct}%</span>
                  </div>
                  <div>
                    <span className="badge" style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: u.pct === 100 ? '#22c55e15' : colors.accent + '12', color: u.pct === 100 ? '#22c55e' : colors.accent }}>
                      {u.pct === 100 ? '✓ Complete' : `${u.completed}/${u.total} Done`}
                    </span>
                  </div>
                </div>
                
                {expandedUserId === u.id && (
                  <div className="details-area">
                    <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>User Task Timeline</h4>
                      <button onClick={() => setExpandedUserId(null)} style={{ background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Collapse</button>
                    </div>
                    <div className="task-grid">
                      {u.tasks.map(t => (
                        <div key={t.id} className="task-card">
                          <div className="edit-badge" onClick={(e) => { e.stopPropagation(); setEditingTodo(t); }}>Edit</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', paddingRight: '40px', color: t.completed ? colors.textMuted : colors.text }}>
                            {t.completed && "✓ "}{t.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: colors.textMuted, lineHeight: 1.4 }}>{t.description}</div>
                          {t.completionMessage && (
                            <div style={{ marginTop: '4px', padding: '6px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '6px', fontSize: '0.7rem' }}>
                              <strong style={{ color: '#22c55e' }}>Note:</strong> {t.completionMessage}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', fontSize: '0.68rem', color: colors.textSub, paddingTop: '4px' }}>
                            <span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>
                            <span style={{ color: PRIORITY_CONFIG[t.priority].color, fontWeight: 700 }}>{t.priority.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                      {u.tasks.length === 0 && <div style={{ fontSize: '0.8rem', color: colors.textMuted, padding: '1rem 0' }}>No tasks assigned yet.</div>}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal (Admin Only) */}
      {editingTodo && (
        <>
          <div className="form-overlay" onClick={() => setEditingTodo(null)} />
          <form className="edit-form" onSubmit={handleUpdateTodo}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Edit Task Details</h3>
            
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={editingTodo.title} onChange={e => setEditingTodo({...editingTodo, title: e.target.value})} required />
            </div>
            
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} value={editingTodo.description} onChange={e => setEditingTodo({...editingTodo, description: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="select" value={editingTodo.priority} onChange={e => setEditingTodo({...editingTodo, priority: e.target.value as Priority})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input" type="date" value={editingTodo.dueDate.split('T')[0]} onChange={e => setEditingTodo({...editingTodo, dueDate: e.target.value})} required />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Admin Message</label>
              <input className="input" value={editingTodo.message} onChange={e => setEditingTodo({...editingTodo, message: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button type="button" className="input" style={{ flex: 1, background: colors.bg }} onClick={() => setEditingTodo(null)}>Cancel</button>
              <button type="submit" className="input" style={{ flex: 2, background: colors.accent, color: 'white', border: 'none', fontWeight: 800 }}>Update Task</button>
            </div>
          </form>
        </>
      )}
         {/* Toast Notification */}
      {toast && (
        <div className={`pp-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '!'}</span>
          {toast.text}
        </div>
      )}

    </div>
  );
}
