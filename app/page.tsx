/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { 
  label: string; 
  color: string; 
  bg: string; 
  border: string;
}> = {
  low:    { label: "Low",    color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  medium: { label: "Medium", color: "#ca8a04", bg: "#fefce8", border: "#fde047" },
  high:   { label: "High",   color: "#dc2626", bg: "#fef2f2", border: "#f87171" },
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTodos = async () => {
    const res = await fetch("/api/todos");
    const data = await res.json();
    setTodos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (!text.trim()) return;
    setAdding(true);
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), priority }),
    });
    setText("");
    setPriority("medium");
    await fetchTodos();
    setAdding(false);
    inputRef.current?.focus();
  };

  const deleteTodo = async (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  };

  const toggleTodo = async (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggle: true }),
    });
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: editText.trim() } : t));
    setEditingId(null);
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });
  };

  const clearCompleted = async () => {
    const completed = todos.filter(t => t.completed);
    setTodos(prev => prev.filter(t => !t.completed));
    await Promise.all(completed.map(t => fetch(`/api/todos/${t.id}`, { method: "DELETE" })));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', system_ui, sans-serif;
          background: #f8fafc;
          color: #1e2937;
          min-height: 100vh;
        }

        .dashboard {
          min-height: 100vh;
          padding: 2rem 1.5rem;
          background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Top Navigation / Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .header-left p {
          color: #64748b;
          margin-top: 4px;
        }

        .stats {
          display: flex;
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          min-width: 140px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #1e2937;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 4px;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        /* Left Column - Todo Area */
        .todo-section {
          background: white;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.07);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          height: fit-content;
        }

        .todo-header {
          padding: 1.75rem 2rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .todo-header h2 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #1e2937;
        }

        /* Input */
        .input-area {
          padding: 2rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .main-input {
          flex: 1;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          font-size: 1.1rem;
          outline: none;
          transition: all 0.2s;
        }

        .main-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .add-btn {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
          transition: all 0.2s;
        }

        .add-btn:hover { transform: scale(1.06); }

        /* Priority */
        .priority-group {
          display: flex;
          gap: 10px;
          margin-top: 1.25rem;
        }

        .priority-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: white;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .priority-btn.active {
          border-color: #6366f1;
          background: #f0f0ff;
          color: #4f46e5;
        }

        /* Filters */
        .filters {
          display: flex;
          background: #f8fafc;
          padding: 8px;
          border-radius: 9999px;
          margin: 0 2rem 1.5rem;
        }

        .filter-btn {
          flex: 1;
          padding: 10px 24px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: white;
          color: #1e2937;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        /* Todo List */
        .todo-list {
          padding: 0 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .todo-item {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 1.1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.25s ease;
        }

        .todo-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .todo-item.completed {
          opacity: 0.75;
        }

        .checkbox {
          width: 28px;
          height: 28px;
          border: 2.5px solid #cbd5e1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox.checked {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
        }

        .todo-text {
          flex: 1;
          font-size: 1.08rem;
          line-height: 1.5;
          color: #334155;
        }

        .todo-text.done {
          text-decoration: line-through;
          color: #94a3b8;
        }

        .edit-input {
          flex: 1;
          background: #f8fafc;
          border: 2px solid #6366f1;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1.05rem;
          outline: none;
        }

        .actions {
          display: flex;
          gap: 6px;
          opacity: 0.6;
        }

        .todo-item:hover .actions { opacity: 1; }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        /* Sidebar */
        .sidebar {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.07);
          border: 1px solid #f1f5f9;
          height: fit-content;
        }

        .sidebar h3 {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: #1e2937;
        }

        .priority-legend {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .legend-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
        }

        /* Footer */
        .footer {
          margin-top: 3rem;
          text-align: center;
          color: #64748b;
          font-size: 0.95rem;
        }

        @media (max-width: 640px) {
          .dashboard { padding: 1.25rem 1rem; }
          .header { margin-bottom: 2rem; }
          .main-content { gap: 1.5rem; }
          .todo-header, .input-area, .todo-list { padding-left: 1.5rem; padding-right: 1.5rem; }
        }
      `}</style>

      <div className="dashboard">
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>Dashboard</h1>
              <p>Stay organized • Get things done</p>
            </div>

            <div className="stats">
              <div className="stat-card">
                <div className="stat-number">{activeCount}</div>
                <div className="stat-label">Remaining</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{completedCount}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalCount}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
          </div>

          <div className="main-content">
            {/* Main Todo Section */}
            <div className="todo-section">
              <div className="todo-header">
                <h2>My Tasks</h2>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  {filter === 'all' ? 'All Tasks' : filter === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>

              {/* Input Area */}
              <div className="input-area">
                <div className="input-row">
                  <input
                    ref={inputRef}
                    className="main-input"
                    placeholder="What needs to be done?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  />
                  <button className="add-btn" onClick={addTodo} disabled={adding || !text.trim()}>
                    +
                  </button>
                </div>

                <div className="priority-group">
                  {(["low", "medium", "high"] as Priority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isActive = priority === p;
                    return (
                      <button
                        key={p}
                        className={`priority-btn ${isActive ? "active" : ""}`}
                        style={isActive ? { borderColor: cfg.border, background: cfg.bg, color: cfg.color } : {}}
                        onClick={() => setPriority(p)}
                      >
                        <span className="priority-dot" style={{ background: cfg.color, width: '10px', height: '10px' }} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="filters">
                {(["all", "active", "completed"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    className={`filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Todo List */}
              <div className="todo-list">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading tasks...</div>
                ) : filteredTodos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
                    <p>No {filter} tasks yet</p>
                  </div>
                ) : (
                  filteredTodos.map((todo) => (
                    <div key={todo.id} className={`todo-item ${todo.completed ? "completed" : ""}`}>
                      <div
                        className={`checkbox ${todo.completed ? "checked" : ""}`}
                        onClick={() => toggleTodo(todo.id)}
                      >
                        {todo.completed && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      {editingId === todo.id ? (
                        <input
                          className="edit-input"
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(todo.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className={`todo-text ${todo.completed ? "done" : ""}`}>
                          {todo.text}
                        </span>
                      )}

                      <div className="actions">
                        {editingId === todo.id ? (
                          <button className="icon-btn" onClick={() => saveEdit(todo.id)}>✓</button>
                        ) : (
                          <button className="icon-btn" onClick={() => startEdit(todo)}>✎</button>
                        )}
                        <button className="icon-btn" onClick={() => deleteTodo(todo.id)}>✕</button>
                      </div>

                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: PRIORITY_CONFIG[todo.priority].color,
                        marginLeft: 'auto',
                        flexShrink: 0
                      }} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <h3>Priority Overview</h3>
              <div className="priority-legend">
                {(["high", "medium", "low"] as Priority[]).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const count = todos.filter(t => t.priority === p).length;
                  return (
                    <div key={p} className="legend-item">
                      <div className="legend-dot" style={{ background: cfg.color }} />
                      <div style={{ flex: 1 }}>
                        <strong>{cfg.label}</strong>
                      </div>
                      <div style={{ color: '#64748b', fontWeight: 500 }}>{count}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  onClick={clearCompleted}
                  disabled={completedCount === 0}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: completedCount > 0 ? '#fee2e2' : '#f1f5f9',
                    color: completedCount > 0 ? '#ef4444' : '#94a3b8',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 600,
                    cursor: completedCount > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Clear Completed ({completedCount})
                </button>
              </div>
            </div>
          </div>

          <div className="footer">
            Built with focus • {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}