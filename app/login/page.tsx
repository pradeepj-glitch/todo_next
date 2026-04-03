"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import "../globals.css";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, register, user } = useAuth();
  const router = useRouter();

   useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const result = await login(email, password);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Login failed");
      }
    } else {
      const result = await register(email, password, name);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Registration failed");
      }
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="login-title">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="login-subtitle">
            {mode === 'login' 
              ? 'Sign in to access your todos' 
              : 'Sign up to get started'}
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="login-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="login-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="login-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="login-input"
            />
          </div>

          <div className="form-group-last">
            <label className="login-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="login-input"
            />
            {mode === 'login' && (
              <p className="login-hint">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading 
              ? 'Please wait...' 
              : mode === 'login' 
                ? 'Sign In' 
                : 'Create Account'}
          </button>
        </form>

        <div className="login-divider">
          <p className="login-divider-text">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={toggleMode}
              className="login-toggle"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}