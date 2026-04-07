/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, THEME_COLORS } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import AdminOverview from "./components/AdminOverview";

import { Priority, Todo } from "@/lib/types";
import { PRIORITY_CONFIG, getThemeColors } from "@/lib/theme";

type Filter = "all" | "active" | "completed";

export default function Home() {
  const { user, loading: authLoading, logout, themeColor, darkMode } = useAuth();
  const router = useRouter();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Completion Modal States
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Todo | null>(null);
  const [completionMsg, setCompletionMsg] = useState("");
  const [completing, setCompleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEME_COLORS[themeColor];
  const isDark = darkMode;

  const colors = getThemeColors(darkMode, THEME_COLORS[themeColor].primary);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const fetchTodos = async () => {
    const res = await fetch("/api/todos");
    if (res.ok) {
      const data = await res.json();
      setTodos(data);
    } else {
      setTodos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTodos(); }, []);

  const addTodo = async () => {
    if (!text.trim()) return;
    setAdding(true);
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        userId: user?.id,
        title: text.trim(), 
        priority,
        description: "Self-assigned task",
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // Default 7 days
        message: "Manually added from dashboard"
      }),
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
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (todo.completed) return; // Cannot undo completion

    setTaskToComplete(todo);
    setShowCompletionModal(true);
    setCompletionMsg("");
  };

  const handleCompleteTask = async () => {
    if (!taskToComplete || !completionMsg.trim()) return;
    
    setCompleting(true);
    const id = taskToComplete.id!;
    
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle: true, completionMessage: completionMsg.trim() }),
      });

      if (res.ok) {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true, completionMessage: completionMsg.trim() } : t));
        setShowCompletionModal(false);
        setTaskToComplete(null);
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    } finally {
      setCompleting(false);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id!);
    setEditText(todo.title);
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, title: editText.trim() } : t));
    setEditingId(null);
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editText.trim() }),
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

  const activeCount    = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t =>  t.completed).length;
  const totalCount     = todos.length;
  const completionPct  = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --accent: ${colors.accent};
          --accent-dim: ${colors.accent}22;
          --accent-mid: ${colors.accent}55;
        }

        html, body {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }

        body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: ${colors.bg};
          color: ${colors.text};
          min-height: 100vh;
          transition: background 0.4s, color 0.4s;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── LAYOUT ─────────────────────────────────────────── */
        .page-wrap {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: ${colors.bg};
        }

        /* Mesh background glow */
        .page-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, ${colors.accent}12 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 90%, ${colors.accent}08 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .page-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ─── TOPBAR ──────────────────────────────────────────── */
        .topbar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
          border-bottom: 1px solid ${colors.border};
          gap: 1rem;
          flex-wrap: wrap;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          box-shadow: 0 4px 14px ${colors.accent}44;
          flex-shrink: 0;
        }

        .brand-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.heading};
          letter-spacing: -0.02em;
        }

        .brand-sub {
          font-size: 0.75rem;
          color: ${colors.textMuted};
          font-weight: 400;
          margin-top: 1px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.9rem;
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 999px;
          font-size: 0.8rem;
          color: ${colors.textMuted};
          font-weight: 500;
          transition: border-color 0.2s;
          white-space: nowrap;
        }

        .stat-pill strong {
          color: ${colors.text};
          font-weight: 600;
        }

        .stat-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .avatar-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          background: var(--accent-dim);
          color: var(--accent);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .avatar-btn:hover {
          background: var(--accent);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 12px ${colors.accent}44;
        }

        /* ─── BODY GRID ───────────────────────────────────────── */
        .body-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
          padding: 2rem 0;
          align-items: start;
        }

        /* ─── MAIN COLUMN ─────────────────────────────────────── */
        .main-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ─── PROGRESS BANNER ─────────────────────────────────── */
        .progress-banner {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          overflow: hidden;
          position: relative;
        }

        .progress-banner::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent) ${completionPct}%, ${colors.border} ${completionPct}%);
          transition: background 0.6s;
        }

        .progress-greeting {
          flex: 1;
        }

        .progress-greeting h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: ${colors.heading};
          letter-spacing: -0.02em;
        }

        .progress-greeting p {
          font-size: 0.82rem;
          color: ${colors.textMuted};
          margin-top: 3px;
        }

        .progress-ring-wrap {
          position: relative;
          width: 64px;
          height: 64px;
          flex-shrink: 0;
        }

        .progress-ring-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent);
        }

        /* ─── CARD (todo panel) ───────────────────────────────── */
        .card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 20px;
          overflow: hidden;
          transition: background 0.3s;
        }

        .card-header {
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid ${colors.border};
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: ${colors.heading};
          letter-spacing: -0.01em;
        }

        .badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--accent-mid);
        }

        /* ─── INPUT AREA ──────────────────────────────────────── */
        .input-zone {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid ${colors.border};
        }

        .input-row {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }

        .main-input {
          flex: 1;
          background: ${colors.input};
          border: 1.5px solid ${colors.inputBorder};
          border-radius: 14px;
          padding: 13px 16px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          color: ${colors.text};
          transition: all 0.2s;
          min-width: 0;
        }

        .main-input::placeholder { color: ${colors.textSub}; }

        .main-input:focus {
          border-color: var(--accent);
          background: ${colors.surface};
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .add-btn {
          height: 46px;
          width: 46px;
          border-radius: 14px;
          background: var(--accent);
          color: white;
          border: none;
          font-size: 1.4rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 14px ${colors.accent}44;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .add-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 6px 20px ${colors.accent}55;
        }

        .add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .priority-row {
          display: flex;
          gap: 8px;
          margin-top: 0.9rem;
        }

        .pri-btn {
          flex: 1;
          padding: 9px 10px;
          border-radius: 12px;
          border: 1.5px solid ${colors.inputBorder};
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.2s;
          color: ${colors.textMuted};
          white-space: nowrap;
        }

        .pri-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ─── FILTER TABS ─────────────────────────────────────── */
        .filter-tabs {
          display: flex;
          gap: 4px;
          padding: 0.9rem 1.5rem;
          border-bottom: 1px solid ${colors.border};
        }

        .filter-tab {
          flex: 1;
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          color: ${colors.textMuted};
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .filter-tab.active {
          background: var(--accent-dim);
          color: var(--accent);
          font-weight: 600;
        }

        /* ─── TODO LIST ───────────────────────────────────────── */
        .todo-list {
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 100px;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 14px;
          border-radius: 14px;
          border: 1px solid ${colors.border};
          background: ${colors.input};
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
        }

        .todo-item::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background: transparent;
          transition: background 0.2s;
        }

        .todo-item:hover {
          border-color: ${colors.borderHover};
          background: ${colors.surfaceHover};
          transform: translateX(2px);
          box-shadow: 0 4px 16px rgba(0,0,0,${isDark ? '0.2' : '0.06'});
        }

        .todo-item.completed { opacity: 0.6; }

        .todo-check {
          width: 22px;
          height: 22px;
          border: 2px solid ${colors.border};
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          background: transparent;
        }

        .todo-check:hover { border-color: var(--accent); }

        .todo-check.checked {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 2px 8px ${colors.accent}44;
        }

        .todo-text {
          flex: 1;
          font-size: 0.88rem;
          line-height: 1.5;
          color: ${colors.text};
          min-width: 0;
          word-break: break-word;
        }

        .todo-text.done {
          text-decoration: line-through;
          color: ${colors.textMuted};
        }

        .edit-input {
          flex: 1;
          background: ${colors.surface};
          border: 1.5px solid var(--accent);
          border-radius: 9px;
          padding: 7px 11px;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          color: ${colors.text};
          box-shadow: 0 0 0 3px var(--accent-dim);
          min-width: 0;
        }

        .item-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.18s;
          flex-shrink: 0;
        }

        .todo-item:hover .item-actions { opacity: 1; }

        .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          background: ${colors.surface};
          color: ${colors.textMuted};
          border: 1px solid ${colors.border};
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .icon-btn:hover {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--accent-mid);
        }

        .priority-pip {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ─── EMPTY STATE ─────────────────────────────────────── */
        .empty-state {
          text-align: center;
          padding: 3.5rem 1rem;
          color: ${colors.textMuted};
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          opacity: 0.4;
        }

        .empty-state p {
          font-size: 0.88rem;
        }

        /* ─── SIDEBAR ─────────────────────────────────────────── */
        .sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 1.5rem;
        }

        .sidebar-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 20px;
          padding: 1.25rem;
          transition: background 0.3s;
        }

        .sidebar-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${colors.textMuted};
          margin-bottom: 1.1rem;
        }

        /* Priority breakdown */
        .pri-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }

        .pri-row + .pri-row {
          border-top: 1px solid ${colors.border};
        }

        .pri-row-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pri-row-label {
          flex: 1;
          font-size: 0.85rem;
          color: ${colors.text};
          font-weight: 500;
        }

        .pri-row-bar-wrap {
          width: 60px;
          height: 4px;
          background: ${colors.border};
          border-radius: 999px;
          overflow: hidden;
        }

        .pri-row-bar {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .pri-row-count {
          font-size: 0.8rem;
          font-weight: 600;
          color: ${colors.textMuted};
          min-width: 18px;
          text-align: right;
        }

        /* Clear completed */
        .clear-btn {
          width: 100%;
          padding: 11px;
          border-radius: 12px;
          border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .clear-btn.has-completed {
          background: rgba(239,68,68,0.08);
          color: #ef4444;
          border-color: rgba(239,68,68,0.25);
        }

        .clear-btn.has-completed:hover {
          background: rgba(239,68,68,0.14);
          box-shadow: 0 4px 12px rgba(239,68,68,0.15);
        }

        .clear-btn.none {
          background: ${colors.input};
          color: ${colors.textSub};
          cursor: not-allowed;
          border-color: ${colors.border};
        }

        /* ─── FOOTER ──────────────────────────────────────────── */
        .footer {
          padding: 1.25rem 0;
          border-top: 1px solid ${colors.border};
          text-align: center;
          font-size: 0.76rem;
          color: ${colors.textSub};
          letter-spacing: 0.02em;
        }

        /* ─── MODAL ───────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .modal-box {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 24px;
          padding: 2rem;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3);
        }

        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: ${colors.heading};
          margin-bottom: 0.5rem;
        }

        .modal-body {
          font-size: 0.88rem;
          color: ${colors.textMuted};
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .modal-btns {
          display: flex;
          gap: 10px;
        }

        .modal-btns button { flex: 1; }

        .btn-cancel {
          padding: 11px;
          background: ${colors.input};
          color: ${colors.textMuted};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover { background: ${colors.border}; }

        .btn-danger {
          padding: 11px;
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover { background: rgba(239,68,68,0.18); }

        /* ─── RESPONSIVE ──────────────────────────────────────── */
        @media (max-width: 1024px) {
          .body-grid {
            grid-template-columns: 1fr;
          }
          .sidebar-col {
            position: static;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-inner { padding: 0 1rem; }
          .topbar { padding: 1rem 0; }
          .topbar-right { gap: 0.5rem; }
          .stat-pill { display: none; }
          .stat-pill.always { display: flex; }
          .body-grid { gap: 1rem; padding: 1.25rem 0; }
          .sidebar-col { grid-template-columns: 1fr; }
          .progress-banner { padding: 1rem 1.25rem; gap: 1rem; }
          .input-zone { padding: 1rem 1.25rem; }
          .card-header { padding: 0.9rem 1.25rem; }
          .filter-tabs { padding: 0.75rem 1.25rem; }
          .todo-list { padding: 0.75rem 1rem; }
          .priority-row { gap: 6px; }
          .pri-btn { padding: 8px; font-size: 0.75rem; gap: 5px; }
        }

        @media (max-width: 480px) {
          .progress-ring-wrap { display: none; }
          .priority-row { display: grid; grid-template-columns: 1fr 1fr 1fr; }
        }

        /* ─── TRANSITIONS & ANIMATIONS ──────────────────────── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .todo-item { animation: fadeIn 0.2s ease both; }
      `}</style>

      <div className="page-wrap">
        <div className="page-inner">

          {/* ── TOPBAR ─────────────────────────────────────── */}
          <header className="topbar">
            <div className="brand">
              <div className="brand-icon">✓</div>
              <div>
                <div className="brand-text">TaskFlow</div>
                <div className="brand-sub">Stay sharp, stay done</div>
              </div>
            </div>

            <div className="topbar-right">
              {user?.role === 'admin' ? null : (
                <>
                  <div className="stat-pill always">
                    <span className="stat-pill-dot" style={{ background: '#22c55e' }} />
                    <strong>{activeCount}</strong>
                    <span>remaining</span>
                  </div>
                  <div className="stat-pill">
                    <strong>{completedCount}</strong>
                    <span>done</span>
                  </div>
                  <div className="stat-pill">
                    <strong>{totalCount}</strong>
                    <span>total</span>
                  </div>
                </>
              )}

              {user && (
                <button
                  className="avatar-btn"
                  onClick={() => router.push('/profile')}
                  title="Profile"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          </header>

          {/* ── BODY GRID ──────────────────────────────────── */}
          <div className="body-grid">
            {user?.role === 'admin' ? (
              <div key="admin-view" style={{ gridColumn: '1 / -1' }}>
                <AdminOverview />
              </div>
            ) : (
              <>
                {/* Main column */}
                <div className="main-col">
                  {/* Progress banner */}
                  <div className="progress-banner">
                    <div className="progress-greeting">
                      <h2>{user ? `Hey, ${user.name}!` : 'Welcome back!'}</h2>
                      <p>
                        {totalCount === 0
                          ? 'Add your first task below'
                          : completionPct === 100
                            ? '🎉 All tasks complete!'
                            : `${completionPct}% of your tasks completed`
                        }
                      </p>
                    </div>
                    <div className="progress-ring-wrap">
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke={colors.border} strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r="26"
                          fill="none"
                          stroke={colors.accent}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionPct / 100)}`}
                          transform="rotate(-90 32 32)"
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <div className="progress-ring-label">{completionPct}%</div>
                    </div>
                  </div>

                  {/* Todo card */}
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">My Tasks</span>
                      <span className="badge">
                        {filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>

                    {/* Filter tabs */}
                    <div className="filter-tabs">
                      {(["all", "active", "completed"] as Filter[]).map((f) => (
                        <button
                          key={f}
                          className={`filter-tab ${filter === f ? "active" : ""}`}
                          onClick={() => setFilter(f)}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* List */}
                    <div className="todo-list">
                      {loading ? (
                        <div className="empty-state">
                          <div className="empty-icon">⏳</div>
                          <p>Loading tasks…</p>
                        </div>
                      ) : filteredTodos.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <p>No {filter} tasks yet</p>
                        </div>
                      ) : filteredTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className={`todo-item ${todo.completed ? "completed" : ""}`}
                          style={{ ['--item-border' as string]: PRIORITY_CONFIG[todo.priority].color }}
                        >
                          <div
                            className={`todo-check ${todo.completed ? "checked" : ""}`}
                            style={{ cursor: todo.completed ? 'default' : 'pointer' }}
                            onClick={() => !todo.completed && toggleTodo(todo.id!)}
                          >
                            {todo.completed && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>

                          <div className="todo-content" style={{ flex: 1 }}>
                            {editingId === todo.id ? (
                              <input
                                className="edit-input"
                                value={editText}
                                autoFocus
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(todo.id!);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                            ) : (
                              <>
                                <div className={`todo-title ${todo.completed ? "done" : ""}`} style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {todo.title}
                                </div>
                                {todo.description && (
                                  <div className="todo-desc" style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: '2px' }}>
                                    {todo.description}
                                  </div>
                                )}
                                <div className="todo-meta" style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.72rem', color: colors.textSub }}>
                                  <span title="Due Date">📅 {new Date(todo.dueDate).toLocaleDateString()}</span>
                                  <span title="Assigned By">👤 {todo.assignedByName}</span>
                                </div>
                                {todo.message && (
                                  <div className="todo-admin-msg" style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', fontSize: '0.75rem', borderLeft: '2px solid var(--accent)' }}>
                                    <strong style={{ color: colors.accent }}>Admin Message:</strong> {todo.message}
                                  </div>
                                )}
                                {todo.completionMessage && (
                                  <div className="todo-complete-msg" style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', fontSize: '0.75rem', borderLeft: '2px solid #22c55e', color: '#166534' }}>
                                    <strong style={{ color: '#22c55e' }}>Your Completion Note:</strong> {todo.completionMessage}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {user?.role === 'admin' && !todo.completed && (
                            <div className="item-actions">
                              {editingId === todo.id ? (
                                <button className="icon-btn" onClick={() => saveEdit(todo.id!)}>✓</button>
                              ) : (
                                <button className="icon-btn" onClick={() => startEdit(todo)}>✎</button>
                              )}
                              <button className="icon-btn" onClick={() => deleteTodo(todo.id!)}>✕</button>
                            </div>
                          )}

                          <span
                            className="priority-pip"
                            style={{ background: PRIORITY_CONFIG[todo.priority].color }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="sidebar-col">
                  {/* Priority overview */}
                  <div className="sidebar-card">
                    <div className="sidebar-label">Priority Breakdown</div>
                    {(["high", "medium", "low"] as Priority[]).map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      const count = todos.filter(t => t.priority === p).length;
                      const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                      return (
                        <div key={p} className="pri-row">
                          <span className="pri-dot" style={{ background: cfg.color }} />
                          <span className="pri-row-label">{cfg.label}</span>
                          <div className="pri-row-bar-wrap">
                            <div
                              className="pri-row-bar"
                              style={{ width: `${pct}%`, background: cfg.color }}
                            />
                          </div>
                          <span className="pri-row-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="sidebar-card">
                    <div className="sidebar-label">Actions</div>
                    <button
                      className={`clear-btn ${completedCount > 0 ? 'has-completed' : 'none'}`}
                      onClick={clearCompleted}
                      disabled={completedCount === 0}
                    >
                      🗑 Clear Completed ({completedCount})
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <footer className="footer">
            Built with focus · {new Date().getFullYear()} · TaskFlow
          </footer>
        </div>
      </div>

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Sign out?</div>
            <p className="modal-body">You&apos;ll be redirected to the login page. Your tasks will be saved.</p>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '450px' }}>
            <div className="modal-title" style={{ color: '#22c55e' }}>Complete Task</div>
            <p className="modal-body">
              Great job! Please provide a short message about this task. This is mandatory and cannot be changed later.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>
                Completion Message
              </label>
              <textarea 
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${colors.border}`, 
                  background: colors.bg, color: colors.text, fontFamily: 'inherit', outline: 'none',
                  minHeight: '100px', resize: 'vertical'
                }}
                placeholder="What did you achieve?..."
                value={completionMsg}
                onChange={(e) => setCompletionMsg(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => !completing && setShowCompletionModal(false)}>Cancel</button>
              <button 
                className="btn-danger" 
                style={{ background: '#22c55e', color: 'white', borderColor: '#22c55e' }}
                onClick={handleCompleteTask}
                disabled={!completionMsg.trim() || completing}
              >
                {completing ? 'Completing...' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}