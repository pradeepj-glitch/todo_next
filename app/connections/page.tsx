"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, THEME_COLORS } from "@/context/AuthContext";
import { getThemeColors } from "@/lib/theme";

type SafeUser = {
  id: number;
  _id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  isDeleted: boolean;
  createdAt: string;
};

type ConnectionRequest = {
  _id: number;
  fromUserId: number;
  toUserId: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  respondedAt?: string;
};

type ConnectionItem = {
  connection: { _id: number; userIdA: number; userIdB: number; createdAt: string };
  user: SafeUser;
};

type Message = {
  _id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: string;
};

export default function ConnectionsPage() {
  const { user, loading: authLoading, darkMode, themeColor } = useAuth();
  const router = useRouter();

  const theme = THEME_COLORS[themeColor];
  const colors = getThemeColors(darkMode, theme.primary);
  const isDark = darkMode;

  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<SafeUser[]>([]);
  const [searching, setSearching] = useState(false);

  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const streamRef = useRef<EventSource | null>(null);
  const lastMessageAt = useMemo(() => (messages.length ? messages[messages.length - 1].createdAt : undefined), [messages]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2000);
  };

  const refreshRequestsAndConnections = async () => {
    try {
      const [inRes, outRes, conRes] = await Promise.all([
        fetch("/api/connections/requests/incoming"),
        fetch("/api/connections/requests/outgoing"),
        fetch("/api/connections"),
      ]);

      if (inRes.ok) setIncoming(await inRes.json());
      if (outRes.ok) setOutgoing(await outRes.json());
      if (conRes.ok) setConnections(await conRes.json());
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) return;
    refreshRequestsAndConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (q.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          setSearchResults(await res.json());
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [q, user]);

  const sendRequest = async (toUserId: number) => {
    try {
      const res = await fetch("/api/connections/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Connection request sent");
        await refreshRequestsAndConnections();
      } else {
        showToast("error", data?.error || "Failed to send request");
      }
    } catch (e) {
      showToast("error", "Network error");
    }
  };

  const acceptRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/connections/requests/${requestId}/accept`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Connected");
        await refreshRequestsAndConnections();
      } else {
        showToast("error", data?.error || "Failed to accept");
      }
    } catch (e) {
      showToast("error", "Network error");
    }
  };

  const rejectRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/connections/requests/${requestId}/reject`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Request rejected");
        await refreshRequestsAndConnections();
      } else {
        showToast("error", data?.error || "Failed to reject");
      }
    } catch (e) {
      showToast("error", "Network error");
    }
  };

  const openChatWith = async (u: SafeUser) => {
    setSelectedUser(u);
    setMessages([]);
    setConversationId(null);

    try {
      const convoRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withUserId: u.id }),
      });
      const convoData = await convoRes.json();
      if (!convoRes.ok) {
        showToast("error", convoData?.error || "Cannot start chat");
        return;
      }

      const convoId = convoData?.conversation?._id as number | undefined;
      if (!convoId) {
        showToast("error", "Conversation not available");
        return;
      }
      setConversationId(convoId);

      const msgsRes = await fetch(`/api/conversations/${convoId}/messages`);
      let initialMessages: Message[] = [];
      if (msgsRes.ok) {
        initialMessages = await msgsRes.json();
        setMessages(initialMessages);
      }

      streamRef.current?.close();
      const after = (initialMessages.length ? initialMessages[initialMessages.length - 1].createdAt : new Date().toISOString());
      const es = new EventSource(`/api/conversations/${convoId}/stream?after=${encodeURIComponent(after)}`);
      streamRef.current = es;
      es.addEventListener("message", (evt) => {
        try {
          const msg = JSON.parse((evt as MessageEvent).data) as Message;
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        } catch (e) {
          // ignore
        }
      });
      es.onerror = () => {
        // Browser will auto-reconnect; keep it quiet.
      };
    } catch (e) {
      showToast("error", "Network error");
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  const sendMessage = async () => {
    if (!conversationId) return;
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessageText("");
        setMessages((prev) => (prev.some((m) => m._id === data._id) ? prev : [...prev, data]));
      } else {
        showToast("error", data?.error || "Failed to send");
      }
    } catch (e) {
      showToast("error", "Network error");
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, color: colors.textMuted }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <style jsx>{`
        .wrap { min-height: 100vh; background: ${colors.bg}; color: ${colors.text}; font-family: 'DM Sans', sans-serif; }
        .inner { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

        .top { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.02em; }
        .sub { margin-top: 4px; font-size: 0.9rem; color: ${colors.textMuted}; }
        .btn { border: 1px solid ${colors.border}; background: ${colors.surface}; color: ${colors.text}; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: all .2s; font-weight: 600; }
        .btn:hover { border-color: ${colors.accent}; color: ${colors.accent}; background: ${colors.accent}10; }

        .grid { display: grid; grid-template-columns: 380px 1fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 1024px) { .grid { grid-template-columns: 1fr; } }

        .card { background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 20px; overflow: hidden; }
        .cardHead { padding: 1rem 1.25rem; border-bottom: 1px solid ${colors.border}; display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
        .cardTitle { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; color: ${colors.heading}; }
        .cardBody { padding: 1rem 1.25rem; }

        .input { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid ${colors.inputBorder}; background: ${colors.bg}50; color: ${colors.text}; outline: none; transition: border-color .2s, background .2s; }
        .input:focus { border-color: ${colors.accent}; background: ${colors.surface}; box-shadow: 0 0 0 3px ${colors.accent}22; }

        .pill { font-size: 0.75rem; font-weight: 700; color: ${colors.accent}; background: ${colors.accent}12; border: 1px solid ${colors.accent}30; padding: 4px 10px; border-radius: 999px; }

        .list { display: flex; flex-direction: column; gap: 10px; }
        .row { border: 1px solid ${colors.border}; border-radius: 16px; padding: 12px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: ${colors.bg}30; }
        .row:hover { border-color: ${colors.borderHover}; background: ${colors.surfaceHover}; }
        .rowLeft { min-width: 0; }
        .name { font-weight: 800; font-size: 0.95rem; color: ${colors.text}; }
        .email { font-size: 0.78rem; color: ${colors.textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
        .actions { display: flex; gap: 8px; flex-shrink: 0; }
        .btnSmall { padding: 8px 10px; border-radius: 12px; border: 1px solid ${colors.border}; background: transparent; color: ${colors.text}; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all .2s; }
        .btnSmall:hover { border-color: ${colors.accent}; color: ${colors.accent}; background: ${colors.accent}10; }
        .btnOk { border-color: ${isDark ? "rgba(34,197,94,0.35)" : "rgba(22,163,74,0.25)"}; color: ${isDark ? "#4ade80" : "#16a34a"}; }
        .btnOk:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.45); color: ${isDark ? "#4ade80" : "#16a34a"}; }
        .btnBad { border-color: rgba(239,68,68,0.25); color: #ef4444; }
        .btnBad:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); color: #ef4444; }

        .chat { display: grid; grid-template-rows: auto 1fr auto; height: 560px; }
        .chatHead { padding: 1rem 1.25rem; border-bottom: 1px solid ${colors.border}; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .chatTitle { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid ${colors.accent}; background: ${colors.accent}14; color: ${colors.accent}; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 900; }
        .chatName { font-weight: 900; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chatSub { font-size: 0.76rem; color: ${colors.textMuted}; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .msgs { padding: 1rem 1.25rem; overflow: auto; display: flex; flex-direction: column; gap: 10px; background: ${colors.bg}20; }
        .bubble { max-width: 78%; padding: 10px 12px; border-radius: 14px; border: 1px solid ${colors.border}; background: ${colors.surface}; }
        .bubble.me { margin-left: auto; background: ${colors.accent}12; border-color: ${colors.accent}35; }
        .bubbleHead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
        .bubbleWho { font-weight: 900; font-size: 0.78rem; color: ${colors.textMuted}; }
        .bubbleTime { font-size: 0.72rem; color: ${colors.textSub}; }
        .bubbleText { white-space: pre-wrap; line-height: 1.5; font-size: 0.9rem; }
        .compose { padding: 1rem 1.25rem; border-top: 1px solid ${colors.border}; display: flex; gap: 10px; }
        .sendBtn { width: 46px; height: 46px; border-radius: 14px; border: none; background: ${colors.accent}; color: white; font-size: 1rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px ${colors.accent}44; transition: all .2s; }
        .sendBtn:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
        .sendBtn:hover:not(:disabled) { transform: translateY(-1px); }

        .empty { padding: 2rem 1.25rem; color: ${colors.textMuted}; text-align: center; }

        .pp-toast { position: fixed; top: 1.5rem; right: 1.5rem; padding: 0.875rem 1.25rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.625rem; z-index: 9999; animation: slideInRight 0.25s ease, fadeOut 0.25s ease 1.7s forwards; box-shadow: 0 8px 32px rgba(0,0,0,0.15); max-width: 360px; }
        .pp-toast.success { background: ${isDark ? "#052e16" : "#f0fdf4"}; border: 1px solid ${isDark ? "#14532d" : "#bbf7d0"}; color: ${isDark ? "#4ade80" : "#16a34a"}; }
        .pp-toast.error { background: ${isDark ? "#2d0a0a" : "#fef2f2"}; border: 1px solid ${isDark ? "#7f1d1d" : "#fecaca"}; color: ${isDark ? "#f87171" : "#dc2626"}; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-10px); } }
      `}</style>

      <div className="wrap">
        <div className="inner">
          <div className="top">
            <div>
              <div className="title">Connections</div>
              <div className="sub">Find people, connect, and chat in real-time.</div>
            </div>
            <button className="btn" onClick={() => router.push("/")}>← Dashboard</button>
          </div>

          <div className="grid">
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card">
                <div className="cardHead">
                  <div className="cardTitle">Search users</div>
                  <span className="pill">{searching ? "Searching…" : "Type 2+ chars"}</span>
                </div>
                <div className="cardBody">
                  <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" />
                  <div style={{ height: 12 }} />
                  <div className="list">
                    {q.trim().length < 2 ? (
                      <div className="empty">Start typing to find users.</div>
                    ) : searchResults.length === 0 ? (
                      <div className="empty">No users found.</div>
                    ) : (
                      searchResults.map((u) => (
                        <div key={u.id} className="row">
                          <div className="rowLeft">
                            <div className="name">{u.name}</div>
                            <div className="email">{u.email}</div>
                          </div>
                          <div className="actions">
                            <button className="btnSmall" onClick={() => sendRequest(u.id)}>Connect</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="cardHead">
                  <div className="cardTitle">Incoming requests</div>
                  <span className="pill">{incoming.length}</span>
                </div>
                <div className="cardBody">
                  <div className="list">
                    {incoming.length === 0 ? (
                      <div className="empty">No incoming requests.</div>
                    ) : (
                      incoming.map((r) => (
                        <div key={r._id} className="row">
                          <div className="rowLeft">
                            <div className="name">Request</div>
                            <div className="email">From userId: {r.fromUserId}</div>
                          </div>
                          <div className="actions">
                            <button className="btnSmall btnOk" onClick={() => acceptRequest(r._id)}>Accept</button>
                            <button className="btnSmall btnBad" onClick={() => rejectRequest(r._id)}>Reject</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="cardHead">
                  <div className="cardTitle">Outgoing requests</div>
                  <span className="pill">{outgoing.length}</span>
                </div>
                <div className="cardBody">
                  <div className="list">
                    {outgoing.length === 0 ? (
                      <div className="empty">No outgoing requests.</div>
                    ) : (
                      outgoing.map((r) => (
                        <div key={r._id} className="row">
                          <div className="rowLeft">
                            <div className="name">Pending</div>
                            <div className="email">To userId: {r.toUserId}</div>
                          </div>
                          <div className="actions">
                            <span className="pill">Waiting</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card">
                <div className="cardHead">
                  <div className="cardTitle">Your connections</div>
                  <span className="pill">{connections.length}</span>
                </div>
                <div className="cardBody">
                  <div className="list">
                    {connections.length === 0 ? (
                      <div className="empty">No connections yet.</div>
                    ) : (
                      connections.map((c) => (
                        <div key={c.connection._id} className="row">
                          <div className="rowLeft">
                            <div className="name">{c.user.name}</div>
                            <div className="email">{c.user.email}</div>
                          </div>
                          <div className="actions">
                            <button className="btnSmall" onClick={() => openChatWith(c.user)}>Chat</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="card chat">
                <div className="chatHead">
                  <div className="chatTitle">
                    <div className="avatar">{selectedUser ? selectedUser.name.charAt(0).toUpperCase() : "?"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="chatName">{selectedUser ? selectedUser.name : "Select a connection"}</div>
                      <div className="chatSub">{selectedUser ? selectedUser.email : "Open a chat to start messaging"}</div>
                    </div>
                  </div>
                  <span className="pill">{conversationId ? "Live" : "—"}</span>
                </div>

                <div className="msgs">
                  {!selectedUser ? (
                    <div className="empty">Pick a connection and click “Chat”.</div>
                  ) : messages.length === 0 ? (
                    <div className="empty">No messages yet.</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id} className={`bubble ${m.senderId === user.id ? "me" : ""}`}>
                        <div className="bubbleHead">
                          <div className="bubbleWho">{m.senderId === user.id ? "You" : "Them"}</div>
                          <div className="bubbleTime">{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <div className="bubbleText">{m.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="compose">
                  <input
                    className="input"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={selectedUser ? "Write a message…" : "Select a chat first…"}
                    disabled={!selectedUser || !conversationId || sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <button className="sendBtn" disabled={!selectedUser || !conversationId || sending || !messageText.trim()} onClick={() => void sendMessage()}>
                    ↑
                  </button>
                </div>
              </div>

              {/* tiny debug-ish info; keep minimal */}
              {conversationId && (
                <div style={{ fontSize: "0.75rem", color: colors.textSub }}>
                  Stream after: {lastMessageAt || "—"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`pp-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "!"}</span>
          {toast.text}
        </div>
      )}
    </>
  );
}

